import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import interact from 'interactjs';

// Global style to ensure injected SVGs always fill their container perfectly
const svgGlobalStyles = `
  .page-svg-container svg {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* ============================================
     FIGMA-STYLE FRAME SELECTION SYSTEM
     ============================================ */

  /* Global SVG Interaction Prevention */
  .page-svg-container svg {
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    pointer-events: auto !important;
  }

  .page-svg-container svg * {
    cursor: default;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    cursor: default;
  }

  /* Allow text selection when editing */
  .page-svg-container svg text[contenteditable="true"],
  .page-svg-container svg tspan[contenteditable="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: text !important;
  }

  /* 1. HOVER state — blue outline on the topmost frame candidate */
  /* Replaced visually by exact overlaid SVG shapes */
  .page-svg-container svg [data-hovered="true"] {}

  /* 2. SELECTED frame — solid thick indigo outline + glow */
  .page-svg-container svg [data-selected="true"] {}

  /* 3. ENTERED FRAME indicator — when user has "entered" this frame,
        show it with a thin dashed blue border (like Figma's current frame) */
  .page-svg-container svg [data-frame-entered="true"] {}

  /* 4. CHILD HOVER inside an entered frame — dotted outline for child candidates */
  .page-svg-container svg [data-child-hovered="true"] {}

  /* 5. CHILD SELECTED inside an entered frame — same solid selection look */
  .page-svg-container svg [data-child-selected="true"] {}

  /* 7. Dragging State */
  .page-svg-container svg [data-dragging="true"] {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2)) !important;
  }

  /* 8. Direct Selection Tool Cursor */
  .page-svg-container.tool-direct svg * {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="-20 -20 300 300"><path d="M238.448 92.6028L0 0L90.103 241.348C90.7404 243.045 91.8924 244.501 93.3985 245.514C94.9045 246.526 96.6895 247.045 98.5048 246.997C100.32 246.949 102.075 246.337 103.525 245.246C104.976 244.156 106.049 242.641 106.596 240.913L130.069 164.711L209.652 242.219C211.287 243.841 213.498 244.751 215.804 244.751C218.109 244.751 220.321 243.841 221.956 242.219L242.462 221.753C244.088 220.122 245 217.914 245 215.614C245 213.313 244.088 211.106 242.462 209.474L163.141 132.315L238.448 109.062C240.163 108.47 241.65 107.359 242.703 105.884C243.755 104.409 244.321 102.643 244.321 100.833C244.321 99.0218 243.755 97.256 242.703 95.781C241.65 94.306 240.163 93.195 238.448 92.6028Z" fill="black" transform="rotate(18, 0, 0)"/></svg>') 1 1, auto !important;
  }

  /* 9. Fixed Overlay Prevention - changed to allow interaction */
  .page-svg-container svg [data-name="Overlay"] {
    pointer-events: auto !important;
    cursor: default;
  }
`;
import TopToolbar from './TopToolbar';

const CurveIcon = ({ width, height, className }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path d="M2.5 22.9995C4 17.5007 10.5 26.5 11.5 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M15.6926 4.29545H7.30629M15.6926 4.29545L17.0904 1.5H5.90856L7.30629 4.29545M15.6926 4.29545L18.954 10.8182L11.4995 22L4.04492 10.8182L7.30629 4.29545" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
    <path d="M11.5 21.9989V12.2148" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.897 10.8196L11.4993 9.42188L10.1016 10.8196L11.4993 12.2164L12.897 10.8196Z" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
  </svg>
);

const MainEditor = ({ 
  isDoublePage, 
  pages = [], 
  activePageIndex, 
  setActivePageIndex, 
  insertPageAfter,
  duplicatePage,
  clearPage,
  deletePage,
  onOpenTemplateModal,
  selectedLayerId,
  setSelectedLayerId,
  updatePageHtml,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentFrameId,
  setCurrentFrameId,
  activeMainTool,
  setActiveMainTool
}) => {

  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesOptions, setShowShapesOptions] = useState(false);
  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [zoom, setZoom] = useState(90);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which page's menu is open
  const [rotation, setRotation] = useState(0);
  const currentFrameIdRef = useRef(null);

  // ── Marquee Selection State ───────────────────────────────────────────────
  const [marquee, setMarquee] = useState(null); // { pageIndex }
  const marqueeRef = useRef(null);
  const marqueeOverlayRef1 = useRef(null);
  const marqueeOverlayRef2 = useRef(null);
  const marqueeCandidatesRef = useRef([]);
  const marqueeDataRef = useRef({ startX: 0, startY: 0, containerRect: null, scale: 1 });
  
  useEffect(() => { marqueeRef.current = marquee; }, [marquee]);

  const setsAreEqual = (a, b) => a.size === b.size && [...a].every(v => b.has(v));

  // ── Overlay Highlight Drawing Helpers ─────────────────────────────────────
  const getOverlayForElement = (el) => {
    const container = el.closest('.page-svg-container');
    if (!container) return null;
    const pageIdx = container.getAttribute('data-page-index');
    return document.getElementById(`highlight-overlay-${pageIdx}`);
  };

  const drawOverlayHighlight = (el, type) => {
    if (!el || typeof el.getBBox !== 'function' || typeof el.getScreenCTM !== 'function') return;
    const overlay = getOverlayForElement(el);
    if (!overlay) return;
    
    try {
        const bbox = el.getBBox();
        if (bbox.width === 0 && bbox.height === 0) return;
        const ctm = el.getScreenCTM();
        const overlayCtm = overlay.getScreenCTM();
        if (!ctm || !overlayCtm) return;

        const svgMatrix = overlayCtm.inverse().multiply(ctm);
        
        const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
        const screenOffset = type.includes('selected') ? 2.5 : 1.5;
        const localOffset = screenOffset / scale;
        
        const pt1 = overlay.createSVGPoint(); pt1.x = bbox.x - localOffset; pt1.y = bbox.y - localOffset;
        const pt2 = overlay.createSVGPoint(); pt2.x = bbox.x + bbox.width + localOffset; pt2.y = bbox.y - localOffset;
        const pt3 = overlay.createSVGPoint(); pt3.x = bbox.x + bbox.width + localOffset; pt3.y = bbox.y + bbox.height + localOffset;
        const pt4 = overlay.createSVGPoint(); pt4.x = bbox.x - localOffset; pt4.y = bbox.y + bbox.height + localOffset;

        const pts = [pt1, pt2, pt3, pt4];
        const mapped = pts.map(p => p.matrixTransform(svgMatrix));
        const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');

        let polyId = `overlay-poly-${type}-${el.id}`;
        let polygon = overlay.querySelector(`[id="${polyId}"]`);
        if (!polygon) {
            polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.id = polyId;
            polygon.setAttribute('class', `overlay-type-${type}`);
            
            polygon.setAttribute('fill', 'none');
            
            if (type === 'hover' || type === 'child-hover') {
                polygon.setAttribute('stroke', '#6366F1');
                polygon.setAttribute('stroke-width', '1');
                if (type === 'child-hover') polygon.setAttribute('stroke-dasharray', '2,2');
            } else if (type === 'selected' || type === 'child-selected') {
                polygon.setAttribute('stroke', '#6366F1');
                polygon.setAttribute('stroke-width', type === 'selected' ? '1.5' : '1.2');
                polygon.setAttribute('filter', 'drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))');
            } else if (type === 'entered') {
                polygon.setAttribute('stroke', '#6366F1');
                polygon.setAttribute('stroke-width', '1');
                polygon.setAttribute('stroke-dasharray', '4,4');
            }
            overlay.appendChild(polygon);
        }
        polygon.setAttribute('points', pointsStr);
    } catch(e) {}
  };

  // ── Synchronize rotation with DOM selection ──────────────────────────────────
  useEffect(() => {
    const selId = selectedLayerId;
    if (selId) {
      const el = document.getElementById(selId);
      if (el) {
        const matrix = getElementMatrix(el);
        const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
        setRotation(angle < 0 ? angle + 360 : angle);
      }
    } else {
      setRotation(0);
    }
  }, [selectedLayerId, multiSelectedIds]);

  const handleRotate = (newAngle) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      const bbox = el.getBBox();
      
      // Calculate local center
      const localCx = bbox.x + bbox.width / 2;
      const localCy = bbox.y + bbox.height / 2;
      
      // Transform local center by current matrix to get world center
      const worldCenter = new DOMPoint(localCx, localCy).matrixTransform(matrix);
      
      const currentAngle = (Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
      const diff = newAngle - currentAngle;

      // Create rotation around world center
      const rotateMatrix = new DOMMatrix()
        .translate(worldCenter.x, worldCenter.y)
        .rotate(diff)
        .translate(-worldCenter.x, -worldCenter.y);
      
      const nextMatrix = rotateMatrix.multiply(matrix);
      el.setAttribute('transform', matrixToTransform(nextMatrix));

      // Force-sync the highlight overlay immediately while dragging
      const highlightType = (currentFrameId && el.id !== currentFrameId) ? 'child-selected' : 'selected';
      drawOverlayHighlight(el, highlightType);
    });

    setRotation(newAngle);
    if (updatePageHtml) {
      // Find the SVG containing the selection
      const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const svg = activeContainer?.querySelector('svg');
      if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
    }
  };

  const handleFlip = (direction) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      const bbox = el.getBBox();
      
      // Calculate local center
      const localCx = bbox.x + bbox.width / 2;
      const localCy = bbox.y + bbox.height / 2;

      // Transform local center by current matrix to get world center
      const worldCenter = new DOMPoint(localCx, localCy).matrixTransform(matrix);

      const scaleX = direction === 'h' ? -1 : 1;
      const scaleY = direction === 'v' ? -1 : 1;

      // Create flip matrix centered at the current world position
      const flipMatrix = new DOMMatrix()
        .translate(worldCenter.x, worldCenter.y)
        .scale(scaleX, scaleY)
        .translate(-worldCenter.x, -worldCenter.y);
      
      const nextMatrix = flipMatrix.multiply(matrix);
      el.setAttribute('transform', matrixToTransform(nextMatrix));

      // Force-sync the highlight overlay immediately after flip
      const highlightType = (currentFrameId && el.id !== currentFrameId) ? 'child-selected' : 'selected';
      drawOverlayHighlight(el, highlightType);
    });

    if (updatePageHtml) {
        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
    }
  };

  // ── Multi-Selection Ref (state is lifted to TemplateEditor via props) ───────────
  // Keep a mutable ref so interactjs callbacks (closures) always see latest value
  const multiSelectedIdsRef = useRef(new Set());

  const handleSvgContextMenu = (pageIndex, e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = e.currentTarget.closest('.page-svg-container');
    const svg = container?.querySelector('svg');
    if (!svg) return;

    // Check if right-clicked directly on the default overlay or background
    if (e.target && (e.target.getAttribute('data-name') === 'Overlay' || e.target.closest('[data-name="Overlay"]'))) {
        return;
    }

    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;
    let layerId = null;

    // 1. Identify which layer was right-clicked using drill-down priority
    if (frameId) {
      // ── Inside an entered frame: prioritized children mapping ──
      const frameEl = svg.querySelector(`[id="${frameId}"]`);
      if (frameEl && hitTest(frameEl, e.clientX, e.clientY)) {
        const children = getDirectChildFrames(frameEl);
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            layerId = children[i].id;
            break;
          }
        }
        // If hit frame gap, target the frame itself
        if (!layerId) layerId = frameId;
      }
    } else {
      // ── Top-level: select top-level frames ──
      const topLevelEls = getTopLevelFrames(svg);
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          layerId = topLevelEls[i].id;
          break;
        }
      }
    }

    // Fallback to original simple detection if hierarchy drill-down didn't catch it
    if (!layerId) {
      const target = e.target.closest('[id]');
      if (target && target.id && target.id !== 'main-svg-root') {
        layerId = target.id;
      }
    }

    if (!layerId) return;

    // Don't show context menu if the layer is an "Overlay"
    const layerEl = svg.querySelector(`[id="${layerId}"]`);
    if (layerEl && layerEl.getAttribute('data-name') === 'Overlay') return;


    // 2. Select the layer if not already part of multi-selection
    if (!multiSelectedIds.has(layerId)) {
        setSelectedLayerId(layerId);
        setMultiSelectedIds(new Set([layerId]));
    }

    // 3. Dispatch event to trigger the Layer.jsx menu
    window.dispatchEvent(new CustomEvent('show-layer-context-menu', { 
        detail: { e, layerId, pageIndex } 
    }));
  };

  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const selectedLayerIdRef = useRef(null);
  const activeMainToolRef = useRef(activeMainTool);
  const selectedSelectToolRef = useRef(selectedSelectTool);
  const lastClickRef = useRef({ time: 0, target: null });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Escape key: exit current frame context (go up one level) ──────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input, textarea or contenteditable element
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || 
          document.activeElement.contentEditable === 'true') {
        return;
      }

      if (e.key === 'Escape') {
        // Always clear multi-selection first
        multiSelectedIdsRef.current = new Set();
        setMultiSelectedIds(new Set());

        const frameId = currentFrameIdRef.current;
        if (frameId) {
          // Go up: select the frame we were inside, exit it
          if (setSelectedLayerId) {
            setSelectedLayerId(frameId);
            selectedLayerIdRef.current = frameId;
          }
          setCurrentFrameId(null);
          currentFrameIdRef.current = null;
        } else if (selectedLayerIdRef.current) {
          // No frame entered but something is selected Deselect
          if (setSelectedLayerId) {
            setSelectedLayerId(null);
            selectedLayerIdRef.current = null;
          }
        }
      } else if (e.key.toLowerCase() === 'a') {
        setActiveMainTool('select');
        setSelectedSelectTool('direct');
      } else if (e.key.toLowerCase() === 'v') {
        setActiveMainTool('select');
        setSelectedSelectTool('select');
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Core Logic: Move selected element with arrow keys
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;

        const ids = multiSelectedIdsRef.current.size > 0 
          ? Array.from(multiSelectedIdsRef.current) 
          : (selectedLayerIdRef.current ? [selectedLayerIdRef.current] : []);
        
        if (ids.length === 0) return;

        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          const matrix = getElementMatrix(el);
          const nextMatrix = new DOMMatrix().translate(dx, dy).multiply(matrix);
          el.setAttribute('transform', matrixToTransform(nextMatrix));
          // Update highlights
          const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
          drawOverlayHighlight(el, highlightType);
        });

        if (updatePageHtml) {
          const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
          const svg = activeContainer?.querySelector('svg');
          if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedLayerId, setMultiSelectedIds, setCurrentFrameId, activePageIndex, updatePageHtml, setActiveMainTool, setSelectedSelectTool]);

  useEffect(() => {
    return () => {
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  // ── Clear selection on tool switch ──────────────────────────────────────────
  useEffect(() => {
    if (setSelectedLayerId) {
      setSelectedLayerId(null);
      if (setMultiSelectedIds) {
        setMultiSelectedIds(new Set());
        multiSelectedIdsRef.current = new Set();
      }
      setMarquee(null);
      // Force immediate visual cleanup of active selections
      clearOverlayType('selected');
      clearOverlayType('child-selected');
      document.querySelectorAll('[data-selected="true"]').forEach(el => el.removeAttribute('data-selected'));
      document.querySelectorAll('[data-child-selected="true"]').forEach(el => el.removeAttribute('data-child-selected'));
    }
  }, [activeMainTool, selectedSelectTool, selectedPenTool, selectedShapeTool, setSelectedLayerId, setMultiSelectedIds]);

  // ── Sync multi-selection ref with prop ────────────────────────────────────────
  useEffect(() => {
    if (multiSelectedIds) {
      multiSelectedIdsRef.current = multiSelectedIds;
    }
  }, [multiSelectedIds]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));
  const handleResetZoom = () => setZoom(90);

  const clearOverlayType = (typePattern) => {
    document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
      overlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
    });
  };

  // Helper: check if the current activePageIndex starts a spread (1, 3, 5...)
  const isCurrentlySpread = isDoublePage && activePageIndex > 0 && activePageIndex % 2 === 1 && activePageIndex + 1 < pages.length;

  // ── Sync refs and perform page-level DOM highlights ──────────────────────────
  useEffect(() => {
    // Force immediate visual cleanup of all overlays before redraw
    clearOverlayType('selected');
    clearOverlayType('entered');
    clearOverlayType('child-selected');
    
    // Highlights across all visible pages in the spread
    const pageIndices = [activePageIndex];
    if (isCurrentlySpread) pageIndices.push(activePageIndex + 1);

    const idsToHighlight = multiSelectedIds.size > 0
      ? multiSelectedIds
      : (selectedLayerId ? new Set([selectedLayerId]) : new Set());

    idsToHighlight.forEach(id => {
      document.querySelectorAll(`[id="${id}"]`).forEach(el => {
        // Highlights across multiple pages are drawn in their respective containers
        const type = (currentFrameId && id !== currentFrameId) ? 'child-selected' : 'selected';
        el.setAttribute(`data-${type}`, 'true');
        drawOverlayHighlight(el, type);
      });
    });

    if (currentFrameId) {
      document.querySelectorAll(`[id="${currentFrameId}"]`).forEach(el => {
        el.setAttribute('data-frame-entered', 'true');
        drawOverlayHighlight(el, 'entered');
      });
    }
  }, [selectedLayerId, currentFrameId, multiSelectedIds, pages, activePageIndex, isDoublePage, zoom]);

  // Sync refs
  useEffect(() => { 
    currentFrameIdRef.current = currentFrameId; 
  }, [currentFrameId]);

  // Helper: get direct children of SVG root that have IDs (top-level frames)
  const getTopLevelFrames = (svg) => {
    return Array.from(svg.children).filter(el =>
      el.id &&
      el.tagName.toLowerCase() !== 'style' &&
      el.tagName.toLowerCase() !== 'defs' &&
      el.getAttribute('data-hidden') !== 'true'
    );
  };

  // Helper: get direct children of a given element that have IDs
  const getDirectChildFrames = (el) => {
    return Array.from(el.children).filter(child =>
      child.id &&
      child.tagName.toLowerCase() !== 'style' &&
      child.tagName.toLowerCase() !== 'defs' &&
      child.getAttribute('data-hidden') !== 'true'
    );
  };

  // Helper: check if a point (clientX, clientY) hits an element's bounding box mathematically mapped
  const hitTest = (el, clientX, clientY, buffer = 0) => {
    if (!el) return false;

    // 1. Pixel-perfect fast check: native browser hit testing
    // Handles thin lines, complex strokes, and accurately painted bounds natively
    const hitElements = document.elementsFromPoint(clientX, clientY);
    if (hitElements.includes(el)) return true;

    // 2. Extrapolated local Bounding Box hit testing
    // Handles hitting transparent gaps, transparent shape areas, or hitting areas expanded by exact buffers
    if (typeof el.getScreenCTM === 'function' && typeof el.getBBox === 'function') {
      const svg = el.ownerSVGElement || (el.tagName && el.tagName.toLowerCase() === 'svg' ? el : null);
      if (svg && typeof svg.createSVGPoint === 'function') {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        try {
          const ctm = el.getScreenCTM();
          if (ctm) {
            const localPt = pt.matrixTransform(ctm.inverse());
            const bbox = el.getBBox();
            // Calculate scale from CTM to convert screen buffer into local coordinate units
            const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
            const localBuffer = buffer / scale;
            
            return localPt.x >= (bbox.x - localBuffer) && localPt.x <= (bbox.x + bbox.width + localBuffer) &&
                   localPt.y >= (bbox.y - localBuffer) && localPt.y <= (bbox.y + bbox.height + localBuffer);
          }
        } catch (e) {}
      }
    }
    const rect = el.getBoundingClientRect();
    return clientX >= rect.left - buffer && clientX <= rect.right + buffer &&
           clientY >= rect.top - buffer && clientY <= rect.bottom + buffer;
  };

  // Helper to get all valid SVG elements at a point (z-index ordered, top to bottom)
  const getElementsAtPoint = (x, y) => {
    return document.elementsFromPoint(x, y).filter(el => {
      const isSvgContent = el.closest('.page-svg-container') && el.id && el.tagName.toLowerCase() !== 'svg';
      const isVisible = el.getAttribute('data-hidden') !== 'true';
      return isSvgContent && isVisible;
    });
  };



  // Sync refs with props/state
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; }, [multiSelectedIds]);

  const getSvgPoint = (svgElement, clientX, clientY) => {
    const ctm = svgElement?.getScreenCTM();
    if (!ctm) return null;

    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    return point.matrixTransform(ctm.inverse());
  };

  const matrixToTransform = (matrix) => {
    return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
  };

  const getElementMatrix = (element) => {
    const baseTransform = element?.transform?.baseVal?.consolidate();

    if (!baseTransform?.matrix) {
      return new DOMMatrix();
    }

    const { a, b, c, d, e, f } = baseTransform.matrix;
    return new DOMMatrix([a, b, c, d, e, f]);
  };

  const getDraggableElement = (target, canvasRoot) => {
    let current = target;

    while (current && current !== canvasRoot && current.tagName) {
      const tagName = current.tagName.toLowerCase();

      if (tagName === 'svg') {
        return null;
      }

      if (
        current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true' &&
        current.getAttribute('data-name') !== 'Overlay'
      ) {
        return current;
      }

      current = current.parentNode;
    }

    return null;
  };

  useEffect(() => {
    // Setup interactjs for elements within the SVG - targeting both elements and the background
    const interactable = interact('.page-svg-container svg, .page-svg-container svg *')
      .styleCursor(false) // Prevents interact.js from dynamically setting cursors on hover
      .draggable({
        cursorChecker: () => null, // Second layer of prevention just in case
        inertia: false, // Disable inertia for perfect cursor sync
        autoScroll: true,
        listeners: {
          start(event) {
            let target = event.target;
            const svgElement = target.ownerSVGElement || (target.tagName.toLowerCase() === 'svg' ? target : null);
            if (!svgElement) return;

            const isEditing = target.closest('[data-editing="true"]') || (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true');
            // If Ctrl is held or not in selection mode, stop interact.js drag
            if (!['select', 'upload'].includes(activeMainToolRef.current) || isEditing || event.ctrlKey) {
              event.interaction.stop();
              return;
            }

            const container = target.closest('.page-svg-container');
            const startPoint = getSvgPoint(svgElement, event.clientX, event.clientY);
            if (!startPoint) {
              event.interaction.stop();
              return;
            }

            // 1. Handle "Selection Priority" - if clicking inside the current selection's box, drag it!
            // (Only for normal select mode, direct mode always targets whatever is hit)
            const selectedId = selectedLayerIdRef.current;
            if (selectedId && selectedSelectToolRef.current !== 'direct') {
              const selectedEl = container?.querySelector(`[id="${selectedId}"]`);
              if (selectedEl && selectedEl !== svgElement) {
                if (hitTest(selectedEl, event.clientX, event.clientY, 2)) {
                  target = selectedEl; // Redirect drag to the current selection!
                }
              }
            }

            // Also allow drag if clicking inside ANY multi-selected element (ignored in direct mode)
            if (selectedSelectToolRef.current !== 'direct' && (target === event.target || target.tagName?.toLowerCase() === 'svg')) {
              const multiIds = multiSelectedIdsRef.current;
              if (multiIds.size > 1) {
                for (const id of multiIds) {
                  const el = container?.querySelector(`[id="${id}"]`);
                  if (el && el !== svgElement) {
                    if (hitTest(el, event.clientX, event.clientY, 2)) {
                      target = el;
                      break;
                    }
                  }
                }
              }
            }

            // If background (SVG or Overlay), stop drag completely
            if (target === svgElement || target.getAttribute('data-name') === 'Overlay') {
              event.interaction.stop();
              return;
            }

            let elementToDrag = null;

            // In Direct mode, the elementToDrag is the deep target
            if (selectedSelectToolRef.current === 'direct') {
               const directTarget = getDraggableElement(event.target, svgElement);
               if (directTarget) elementToDrag = directTarget;
            } else {
              // ── Select Mode Candidate Logic ─────────────────────────────────
              // 1. Check current selection first (Selection Priority)
              const currentSelectedId = selectedLayerIdRef.current;
              if (currentSelectedId) {
                const selectedEl = container?.querySelector(`[id="${currentSelectedId}"]`);
                if (selectedEl && selectedEl !== svgElement && selectedEl.contains(target)) {
                  // Only allow dragging if it's NOT the root page-level frame
                  const topFrames = getTopLevelFrames(svgElement);
                  const isMainPageFrame = topFrames.length === 1 && selectedEl.id === topFrames[0].id;
                  
                  if (!isMainPageFrame) {
                    elementToDrag = selectedEl;
                  }
                }
              }

              // 2. If nothing selected or selection not hit, find a new candidate
              if (!elementToDrag) {
                  let candidates = [];
                  const frameId = currentFrameIdRef.current;
                  if (frameId) {
                      const frameEl = svgElement.querySelector(`[id="${frameId}"]`);
                      candidates = frameEl ? getDirectChildFrames(frameEl) : [];
                  } else {
                      candidates = getTopLevelFrames(svgElement);
                  }

                  // Find the top-most hit candidate
                  for (let i = candidates.length - 1; i >= 0; i--) {
                      if (hitTest(candidates[i], event.clientX, event.clientY)) {
                          // Prevent dragging the main page base
                          const topFrames = getTopLevelFrames(svgElement);
                          const isBaseFrame = topFrames.length === 1 && candidates[i].id === topFrames[0].id;
                          if (!isBaseFrame) {
                              elementToDrag = candidates[i];
                          }
                          break;
                      }
                  }
              }
            }

            // Safety check for metadata-based 'locked' or 'hidden'
            if (!elementToDrag || 
                elementToDrag.getAttribute('data-hidden') === 'true' || 
                elementToDrag.getAttribute('data-locked') === 'true' ||
                elementToDrag.getAttribute('data-name') === 'Overlay') {
              event.interaction.stop();
              return;
            }

            // 2. AUTO-SELECT if not already selected
            const isSelected = (selectedLayerIdRef.current === elementToDrag.id) || 
                               (multiSelectedIdsRef.current && multiSelectedIdsRef.current.has(elementToDrag.id));
            
            if (!isSelected) {
              if (setSelectedLayerId) {
                  setSelectedLayerId(elementToDrag.id);
                  if (setMultiSelectedIds) setMultiSelectedIds(new Set([elementToDrag.id]));
                  // Force update ref so it's visible to subsequent drag steps
                  selectedLayerIdRef.current = elementToDrag.id;
                  multiSelectedIdsRef.current = new Set([elementToDrag.id]);
                  
                  // Visualize selection immediately
                  drawOverlayHighlight(elementToDrag, currentFrameIdRef.current && elementToDrag.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');
              }
            }

            // ── Build multi-drag list: all multi-selected elements in the same SVG ──
            const multiIds = multiSelectedIdsRef.current;
            const multiDragItems = [];

            if (multiIds.size > 1) {
              for (const id of multiIds) {
                const el = container?.querySelector(`[id="${id}"]`);
                if (el && el !== svgElement &&
                    el.getAttribute('data-hidden') !== 'true' &&
                    el.getAttribute('data-locked') !== 'true') {
                  el.setAttribute('data-dragging', 'true');
                  multiDragItems.push({
                    element: el,
                    initialMatrix: getElementMatrix(el)
                  });
                }
              }
            }

            // If no multi items, just add the primary element
            if (multiDragItems.length === 0) {
              elementToDrag.setAttribute('data-dragging', 'true');
            }

            event.interaction.dragState = {
              element: elementToDrag,
              startPoint: startPoint,
              initialMatrix: getElementMatrix(elementToDrag),
              svgElement: svgElement,
              pageIndex: activePageIndex,
              // Multi-drag support
              multiDragItems: multiDragItems.length > 0 ? multiDragItems : null
            };
          },
          move(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            const currentPoint = getSvgPoint(dragState.svgElement, event.clientX, event.clientY);
            if (!currentPoint) return;

            // Calculate total delta from start for 1:1 cursor sync
            const dx = currentPoint.x - dragState.startPoint.x;
            const dy = currentPoint.y - dragState.startPoint.y;

              if (dragState.multiDragItems) {
              // Move ALL multi-selected elements
              for (const item of dragState.multiDragItems) {
                const translation = new DOMMatrix().translate(dx, dy);
                const nextMatrix = translation.multiply(item.initialMatrix);
                item.element.setAttribute('transform', matrixToTransform(nextMatrix));
                // dynamically update the outline while dragging
                drawOverlayHighlight(item.element, currentFrameIdRef.current && item.element.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');
              }
            } else {
              // Single element drag
              const target = dragState.element;
              const translation = new DOMMatrix().translate(dx, dy);
              const nextMatrix = translation.multiply(dragState.initialMatrix);
              target.setAttribute('transform', matrixToTransform(nextMatrix));
              // dynamically update the outline while dragging
              drawOverlayHighlight(target, currentFrameIdRef.current && target.id !== currentFrameIdRef.current ? 'child-selected' : 'selected');
            }

            suppressClickRef.current = true;
          },
          end(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            if (dragState.multiDragItems) {
              // Clean up all multi-dragged elements
              for (const item of dragState.multiDragItems) {
                item.element.removeAttribute('data-dragging');
              }
            } else {
              dragState.element.removeAttribute('data-dragging');
            }

            if (suppressClickRef.current && updatePageHtml) {
              const container = dragState.element.closest('.page-svg-container');
              const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : dragState.pageIndex;
              updatePageHtml(pageIdx, dragState.svgElement.outerHTML);
            }

            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);

            delete event.interaction.dragState;
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [zoom, updatePageHtml, activePageIndex, setSelectedLayerId]); // No longer depends on frequently changing state like selectedLayerId because of refs

  // ── FIGMA-STYLE MOUSE DOWN: start drag on already-selected element ────────────
  const handleSvgMouseDown = (pageIndex, e) => {
    if (e.button !== 0 || !['select', 'upload'].includes(activeMainTool)) return;

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // 1. Identify level candidates and check if click hit any (including gaps)
    let candidates = [];
    const frameId = currentFrameIdRef.current;
    if (frameId) {
        const frameEl = svg.querySelector(`[id="${frameId}"]`);
        candidates = frameEl ? getDirectChildFrames(frameEl) : [];
    } else {
        candidates = getTopLevelFrames(svg);
    }
    
    let hitCandidate = null;
    for (let i = candidates.length - 1; i >= 0; i--) {
        if (hitTest(candidates[i], e.clientX, e.clientY, 2)) {
            hitCandidate = candidates[i];
            break;
        }
    }

    const topFrames = getTopLevelFrames(svg);
    const hitBaseFrame = hitCandidate && topFrames.length === 1 && hitCandidate.id === topFrames[0].id;

    // 2. Selection/Drag Priority
    // If we hit any valid child candidate (even in its gap), don't start a marquee.
    // Return early to allow interactjs to handle dragging and handleSvgClick to handle selection focus.
    if (hitCandidate && !hitBaseFrame && !e.ctrlKey && selectedSelectToolRef.current !== 'direct') {
        return; 
    }

    // 3. Marquee Start Detection
    // Start marquee if forced (Ctrl) OR if clicking purely on the background / base page.
    const isBackground = e.target.tagName.toLowerCase() === 'svg' || e.target.getAttribute('data-name') === 'Overlay';
    const shouldStartMarquee = e.ctrlKey || (isBackground && (!hitCandidate || hitBaseFrame));

    if (shouldStartMarquee) {
      const rect = container.getBoundingClientRect();
      const scale = zoom / 100;
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;
      
      marqueeDataRef.current = { startX, startY, containerRect: rect, scale };
      
      // Cache candidates and their bounding boxes for the marquee operation
      let marqueeCandidates = candidates.filter(el => {
          const isOverlay = el.getAttribute('data-name') === 'Overlay';
          const isBasePage = topFrames.length === 1 && el.id === topFrames[0].id;
          return !isOverlay && !isBasePage;
      });

      marqueeCandidatesRef.current = marqueeCandidates.map(el => ({
          id: el.id,
          rect: el.getBoundingClientRect()
      }));

      setMarquee({ pageIndex });
      
      const activeRef = pageIndex === activePageIndex ? marqueeOverlayRef1 : marqueeOverlayRef2;
      if (activeRef.current) {
          Object.assign(activeRef.current.style, {
              display: 'block',
              left: `${startX}px`,
              top: `${startY}px`,
              width: '0px',
              height: '0px'
          });
      }
      return;
    }
  };

  // ── FIGMA-STYLE MOUSE MOVE: hover highlight & Marquee update ─────────────────
  const handleSvgMouseMove = (e) => {
    if (!['select', 'upload'].includes(activeMainTool)) return;

    const container = e.currentTarget;

    // ── MARQUEE UPDATE ──
    if (marqueeRef.current) {
        const { startX, startY, containerRect, scale } = marqueeDataRef.current;
        const curX = (e.clientX - containerRect.left) / scale;
        const curY = (e.clientY - containerRect.top) / scale;
        
        const x = Math.min(curX, startX);
        const y = Math.min(curY, startY);
        const width = Math.abs(curX - startX);
        const height = Math.abs(curY - startY);
        
        // Direct DOM update for marquee box - avoids React re-render lag
        const activeRef = marqueeRef.current.pageIndex === activePageIndex ? marqueeOverlayRef1 : marqueeOverlayRef2;
        if (activeRef.current) {
            activeRef.current.style.left = `${x}px`;
            activeRef.current.style.top = `${y}px`;
            activeRef.current.style.width = `${width}px`;
            activeRef.current.style.height = `${height}px`;
            activeRef.current.style.display = 'block';
        }
        
        updateMarqueeSelection(x, y, width, height, containerRect, scale);
        return;
    }

    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clear all hover states
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── Direct selection mode: hover the deepest element with an ID ──────────
    if (selectedSelectTool === 'direct') {
      const target = getDraggableElement(e.target, svg);
      if (target && target.id && target.tagName.toLowerCase() !== 'svg') {
        if (!multiSelectedIdsRef.current.has(target.id) && selectedLayerIdRef.current !== target.id) {
          target.setAttribute('data-hovered', 'true');
          drawOverlayHighlight(target, 'child-hover');
        }
        return;
      }
    }

    const frameId = currentFrameIdRef.current;
    
    // ── DYNAMIC CONTEXT (Double Page): Auto-adjust target level for easy edit ─────
    // If we're at top level (null frameId) on a spread, and hover a root folder,
    // let's treat it as entered context so user can hit children immediately.
    let effectiveFrameId = frameId;
    if (!frameId && isDoublePage) {
        const topFrames = getTopLevelFrames(svg);
        const hitRoot = topFrames.find(f => hitTest(f, e.clientX, e.clientY));
        if (hitRoot && topFrames.length === 1) {
            effectiveFrameId = hitRoot.id;
        }
    }

    if (effectiveFrameId) {
      // ── Inside a frame: hover its direct children ──
      const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);
      if (frameEl) {
        const children = getDirectChildFrames(frameEl);
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            // Only hover if not already selected
            if (!multiSelectedIdsRef.current.has(children[i].id) && selectedLayerIdRef.current !== children[i].id) {
              children[i].setAttribute('data-child-hovered', 'true');
              drawOverlayHighlight(children[i], 'child-hover');
            }
            return;
          }
        }

        // Falling outside current frame context: highlight top-level elements
        if (!hitTest(frameEl, e.clientX, e.clientY)) {
           const topLevelEls = getTopLevelFrames(svg);
           for (let i = topLevelEls.length - 1; i >= 0; i--) {
             if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
               // Only hover if not already selected
               if (!multiSelectedIdsRef.current.has(topLevelEls[i].id) && selectedLayerIdRef.current !== topLevelEls[i].id) {
                 topLevelEls[i].setAttribute('data-hovered', 'true');
                 drawOverlayHighlight(topLevelEls[i], 'hover');
               }
               return;
             }
           }
        }
      }
    } else {
      // ── Top-level: hover top-level frames ──
      const topLevelEls = getTopLevelFrames(svg);
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          // Only hover if not already selected
          if (!multiSelectedIdsRef.current.has(topLevelEls[i].id) && selectedLayerIdRef.current !== topLevelEls[i].id) {
            topLevelEls[i].setAttribute('data-hovered', 'true');
            drawOverlayHighlight(topLevelEls[i], 'hover');
          }
          return;
        }
      }
    }
  };

  // ── MARQUEE SELECTION LOGIC (Optimized) ──
  const updateMarqueeSelection = (mx, my, mw, mh, containerRect, scale) => {
    const newSelectedIds = new Set();

    marqueeCandidatesRef.current.forEach(item => {
        const { id, rect: elRect } = item;
        
        const relElRect = {
            left: (elRect.left - containerRect.left) / scale,
            top: (elRect.top - containerRect.top) / scale,
            right: (elRect.right - containerRect.left) / scale,
            bottom: (elRect.bottom - containerRect.top) / scale
        };

        const intersects = !(
            mx > relElRect.right || 
            mx + mw < relElRect.left || 
            my > relElRect.bottom || 
            my + mh < relElRect.top
        );

        if (intersects) {
            newSelectedIds.add(id);
        }
    });

    // Avoid state updates if selection is identical
    if (!setsAreEqual(newSelectedIds, multiSelectedIdsRef.current)) {
        setMultiSelectedIds(newSelectedIds);
        const primary = Array.from(newSelectedIds)[newSelectedIds.size - 1];
        setSelectedLayerId(primary || null);
    }
  };

  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee) ─────────────────────
  useEffect(() => {
    const handleGlobalMouseUp = () => {
        if (marqueeRef.current) {
            const pageIdx = marqueeRef.current.pageIndex;
            setMarquee(null);
            if (marqueeOverlayRef1.current) marqueeOverlayRef1.current.style.display = 'none';
            if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
        }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // ── FIGMA-STYLE MOUSE LEAVE: clear all hovers ─────────────────────────────────
  const handleSvgMouseLeave = (e) => {
    const container = e.currentTarget.closest('.page-svg-container') || e.currentTarget;
    const svg = container.querySelector('svg');
    if (svg) {
      svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
      svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
      clearOverlayType('hover');
      clearOverlayType('child-hover');
    }
  };

  // ── Helper: set single selection and clear multi-selection ───────────────────
  const setSingleSelection = (id) => {
    if (setSelectedLayerId) {
      setSelectedLayerId(id);
      selectedLayerIdRef.current = id;
    }
    const newSet = id ? new Set([id]) : new Set();
    multiSelectedIdsRef.current = newSet;
    setMultiSelectedIds(newSet);
  };

  // ── FIGMA-STYLE CLICK: hierarchical frame drill-down selection ─────────────────
  const handleSvgClick = (e) => {
    e.stopPropagation();

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clear hover states immediately on click to prevent overlapping outlines
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── CLICK-OUTSIDE-PREVENTION (if in tools like pen/shapes but not typing) ───
    if (!['select', 'upload', 'type'].includes(activeMainToolRef.current) && 
        !getDraggableElement(e.target, e.currentTarget)) {
        return;
    }

    // ── Ctrl + Shift + Click OR Direct selection tool: deep selection ────────
    if ((e.ctrlKey && e.shiftKey) || selectedSelectTool === 'direct') {
      const target = getDraggableElement(e.target, svg);
      if (target && target.id && target.tagName.toLowerCase() !== 'svg') {
        if (e.shiftKey && selectedSelectTool === 'direct') {
          // Multi-toggle in direct mode
          const currentSet = new Set(multiSelectedIdsRef.current);
          if (currentSet.has(target.id)) {
            currentSet.delete(target.id);
            if (selectedLayerIdRef.current === target.id) {
              const remaining = [...currentSet];
              const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
              if (setSelectedLayerId) {
                setSelectedLayerId(newPrimary);
                selectedLayerIdRef.current = newPrimary;
              }
            }
          } else {
            currentSet.add(target.id);
            if (setSelectedLayerId) {
              setSelectedLayerId(target.id);
              selectedLayerIdRef.current = target.id;
            }
          }
          multiSelectedIdsRef.current = currentSet;
          setMultiSelectedIds(currentSet);
          return;
        }

        setSingleSelection(target.id);
        return;
      }
    }

    // ── Shift + Click (no Ctrl): Multi-select toggle ───────────────────────────
    // Works at top-level OR inside an entered frame, but does NOT enter frames.
    if (e.shiftKey && !e.ctrlKey) {
      const frameId = currentFrameIdRef.current;

      // Determine candidate element pool (same as current navigation level)
      let candidates;
      if (frameId) {
        const frameEl = svg.querySelector(`[id="${frameId}"]`);
        candidates = frameEl ? getDirectChildFrames(frameEl) : [];
      } else {
        candidates = getTopLevelFrames(svg);
      }

      // Find the topmost candidate hit at this point
      let hitEl = null;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (hitTest(candidates[i], e.clientX, e.clientY)) {
          hitEl = candidates[i];
          break;
        }
      }

      if (hitEl) {
        // Toggle this element in/out of the multi-selection
        const currentSet = new Set(multiSelectedIdsRef.current);

        // Always keep the primary selectedLayerId in the set (if it exists)
        const primaryId = selectedLayerIdRef.current;
        if (primaryId) currentSet.add(primaryId);

        if (currentSet.has(hitEl.id)) {
          currentSet.delete(hitEl.id);
          // If we removed the primary, promote another
          if (primaryId === hitEl.id) {
            const remaining = [...currentSet];
            const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
            if (setSelectedLayerId) {
              setSelectedLayerId(newPrimary);
              selectedLayerIdRef.current = newPrimary;
            }
          }
        } else {
          currentSet.add(hitEl.id);
          // The most recently shift-clicked element becomes primary
          if (setSelectedLayerId) {
            setSelectedLayerId(hitEl.id);
            selectedLayerIdRef.current = hitEl.id;
          }
        }

        multiSelectedIdsRef.current = currentSet;
        setMultiSelectedIds(currentSet);
      }
      // Shift+Click on empty space does nothing (don't clear multi-selection)
      return;
    }

    // ── Non-shift plain click: always clears multi-selection ─────────────────
    // Reset multi-selection on normal click (will rebuild from single selected)
    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;

    // ── DYNAMIC CONTEXT (Double Page): Auto-enter context to avoid double click ───
    let effectiveFrameId = frameId;
    if (!frameId && isDoublePage) {
        const topFrames = getTopLevelFrames(svg);
        const hitRoot = topFrames.find(f => hitTest(f, e.clientX, e.clientY));
        if (hitRoot && topFrames.length === 1) {
            effectiveFrameId = hitRoot.id;
            setCurrentFrameId(hitRoot.id);
            currentFrameIdRef.current = hitRoot.id;
        }
    }

    // ── Case 1: We are INSIDE an entered frame — INFINITE RECURSIVE DRILL-DOWN ─
    if (effectiveFrameId) {
      const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);

      if (frameEl && hitTest(frameEl, e.clientX, e.clientY)) {
        // ── Clicked INSIDE the currently entered frame ──
        const children = getDirectChildFrames(frameEl);
        let clickedChild = null;
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            clickedChild = children[i];
            break;
          }
        }

        if (clickedChild) {
          if (selId === clickedChild.id) {
            // ── Already selected this child → try to ENTER it (go deeper)
            const grandchildren = getDirectChildFrames(clickedChild);
            if (grandchildren.length > 0) {
              setCurrentFrameId(clickedChild.id);
              currentFrameIdRef.current = clickedChild.id;
              // Immediately select whichever grandchild was actually hit
              for (let i = grandchildren.length - 1; i >= 0; i--) {
                if (hitTest(grandchildren[i], e.clientX, e.clientY)) {
                  setSingleSelection(grandchildren[i].id);
                  return;
                }
              }
              // Hit the gap inside the child → entered, keep child selected
              return;
            }
            // Child has no sub-frames → stay selected, nothing deeper to enter
            return;
          } else {
            // ── Different child → SELECT it 
            setSingleSelection(clickedChild.id);
          }
        } else {
          // ── Clicked the entered frame's empty gap → behavior depends on level
          const topFrames = getTopLevelFrames(svg);
          const isRootFolder = topFrames.length === 1 && topFrames[0].id === frameId;

          if (isRootFolder) {
            // ── Root Folder Gap: Behavior changed to KEEP root selected
            setSingleSelection(frameId);
          } else {
            // ── Deeper Frame Gap: exit one level (select frame, keep entered)
            setSingleSelection(frameId);
            // Don't null currentFrameId here to keep context
          }
        }
        return;

      } else {
        // ── Clicked completely OUTSIDE the entered frame
        // Exit current context and select whatever is at this point
        const topLevelEls = getTopLevelFrames(svg);
        let hitTopFrame = null;
        for (let i = topLevelEls.length - 1; i >= 0; i--) {
          if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
            hitTopFrame = topLevelEls[i];
            break;
          }
        }

        setCurrentFrameId(null);
        currentFrameIdRef.current = null;

        if (hitTopFrame) {
          setSingleSelection(hitTopFrame.id);
          // If hit top frame is the only root, automatically enter it
          if (topLevelEls.length === 1) {
            setCurrentFrameId(hitTopFrame.id);
            currentFrameIdRef.current = hitTopFrame.id;
          }
        } else {
          // Hit nothing? Behavior for Root Folder
          if (topLevelEls.length === 1) {
            setSingleSelection(topLevelEls[0].id);
            setCurrentFrameId(topLevelEls[0].id);
            currentFrameIdRef.current = topLevelEls[0].id;
          } else {
            setSingleSelection(null);
          }
        }
        return;
      }
    }

    // ── Case 2: No frame entered — top-level selection ────────────────────────
    const topLevelEls = getTopLevelFrames(svg);

    // 1. Identify which top-level frame was hit (topmost in z-order)
    let hitFrame = null;
    for (let i = topLevelEls.length - 1; i >= 0; i--) {
      if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
        hitFrame = topLevelEls[i];
        break;
      }
    }

    if (hitFrame) {
      if (selId === hitFrame.id) {
        // User clicked the ALREADY-SELECTED frame -> try to ENTER it (drill-down)
        const hasChildren = getDirectChildFrames(hitFrame).length > 0;
        if (hasChildren) {
          setCurrentFrameId(selId);
          currentFrameIdRef.current = selId;

          // Immediately check if a child is hit and select it
          const children = getDirectChildFrames(hitFrame);
          for (let i = children.length - 1; i >= 0; i--) {
            if (hitTest(children[i], e.clientX, e.clientY)) {
              setSingleSelection(children[i].id);
              return;
            }
          }
          // Clicked in the gap area of the frame — keep primary frame selected, just mark as entered
          return;
        }
        // Frame has no children — stay selected
        return;
      } else {
        // User clicked a DIFFERENT top-level frame -> SELECT it (unselects old)
        setSingleSelection(hitFrame.id);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
        return;
      }
    } else {
      // 2. Clicked canvas background — ONLY deselect everything if there are multiple frames
      // Otherwise, keep the single root folder selected
      const currentTopFrames = getTopLevelFrames(svg);
      if (currentTopFrames.length === 1) {
        setSingleSelection(currentTopFrames[0].id);
        setCurrentFrameId(currentTopFrames[0].id);
        currentFrameIdRef.current = currentTopFrames[0].id;
      } else {
        setSingleSelection(null);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
      }
    }
  };

  // ── FIGMA-STYLE DOUBLE CLICK: enter frame / edit text ─────────────────────────
  const handleSvgDoubleClick = (e) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Find deepest element with an ID at this point
    let target = getDraggableElement(e.target, e.currentTarget);
    if (!target) return;

    // Text editing on double-click
    const isText = ['text', 'tspan'].includes(target.tagName.toLowerCase());
    if (isText && target.id) {
      const svgRoot = target.ownerSVGElement;
      const bbox = target.getBBox();
      const style = window.getComputedStyle(target);
      const transform = target.getAttribute('transform');
      
      // Hide original text to create illusion of editing in-place
      target.style.opacity = '0';
      target.style.visibility = 'hidden';
      
      // Create foreignObject directly inside the SVG
      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      const padding = 10; // Extra padding for caret
      fo.setAttribute('x', bbox.x - padding);
      fo.setAttribute('y', bbox.y - padding);
      fo.setAttribute('width', Math.max(bbox.width + padding * 2 + 100, 250)); 
      fo.setAttribute('height', Math.max(bbox.height + padding * 2 + 50, 100));
      if (transform) fo.setAttribute('transform', transform);
      
      // Mark it so interact.js ignores dragging while editing
      fo.setAttribute('data-editing', 'true');
      
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      div.style.width = '100%';
      div.style.height = '100%';
      div.style.outline = 'none';
      div.style.border = 'none';
      div.style.background = 'transparent';
      
      // Copy exact styles over to make it look identical to original text
      div.style.fontFamily = target.getAttribute('font-family') || style.fontFamily;
      let fSize = target.getAttribute('font-size') || style.fontSize;
      if (!fSize.toString().includes('px') && !fSize.toString().includes('em') && !fSize.toString().includes('rem')) {
          fSize += 'px';
      }
      div.style.fontSize = fSize;
      div.style.fontWeight = target.getAttribute('font-weight') || style.fontWeight;
      
      let color = target.getAttribute('fill') || style.fill;
      if (color === 'none') color = target.getAttribute('stroke') || style.stroke || '#000';
      div.style.color = color;
      div.style.letterSpacing = target.getAttribute('letter-spacing') || style.letterSpacing;
      
      div.style.lineHeight = '1.2';
      div.style.whiteSpace = 'pre-wrap';
      div.style.wordWrap = 'break-word';
      
      div.style.padding = `${padding}px`;
      div.style.margin = '0';
      div.style.display = 'flex';
      
      // Alignment mapping
      const textAnchor = target.getAttribute('text-anchor') || style.textAnchor;
      if (textAnchor === 'middle') {
        div.style.justifyContent = 'center';
        div.style.textAlign = 'center';
      } else if (textAnchor === 'end') {
        div.style.justifyContent = 'flex-end';
        div.style.textAlign = 'right';
      } else {
        div.style.justifyContent = 'flex-start';
        div.style.textAlign = 'left';
      }

      div.textContent = target.textContent;
      fo.appendChild(div);
      
      // Insert in exact DOM position next to target to inherit proper z-index and scaling context
      target.parentNode.insertBefore(fo, target.nextSibling);

      // Timeout ensures the browser paints 'contenteditable' and can focus
      setTimeout(() => {
        div.focus();
        
        // Select all text natively
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(div);
        selection.removeAllRanges();
        selection.addRange(range);
      }, 0);

      const initialInnerHTML = target.innerHTML;
      
      const cleanup = () => {
        target.style.removeProperty('opacity');
        target.style.removeProperty('visibility');
        if (target.getAttribute('style') === '') target.removeAttribute('style');
        
        div.removeEventListener('blur', handleBlur);
        div.removeEventListener('keydown', handleKeyDown);
        
        if (fo.parentNode) {
          fo.parentNode.removeChild(fo);
        }
        
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      };

      const handleBlur = () => {
        // Try to keep the first tspan to preserve coordinates
        const tspans = target.querySelectorAll('tspan');
        if (tspans.length > 0) {
          tspans[0].textContent = div.textContent;
          for (let i = 1; i < tspans.length; i++) {
            tspans[i].remove();
          }
        } else {
          target.textContent = div.textContent;
        }
        cleanup();
        
        const container = target.closest('.page-svg-container');
        if (container) {
          const pageIdx = parseInt(container.getAttribute('data-page-index'));
          if (svgRoot && updatePageHtml) {
            updatePageHtml(pageIdx, svgRoot.outerHTML);
          }
        }
      };

      const handleKeyDown = (e) => {
        // Prevent newlines in SVG text and confirm
        if (e.key === 'Enter') {
          e.preventDefault();
          div.blur();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          target.innerHTML = initialInnerHTML;
          cleanup();
        }
      };

      div.addEventListener('blur', handleBlur);
      div.addEventListener('keydown', handleKeyDown);
      return;
    }

    // On double-click a frame: enter it immediately
    const frameId = currentFrameIdRef.current;
    const selId = selectedLayerIdRef.current;

    if (!frameId && selId) {
      // Enter the currently selected frame
      const selEl = svg.querySelector(`[id="${selId}"]`);
      if (selEl && hitTest(selEl, e.clientX, e.clientY)) {
        const hasChildren = getDirectChildFrames(selEl).length > 0;
        if (hasChildren) {
          setCurrentFrameId(selId);
          currentFrameIdRef.current = selId;
          // Select the child at this point as well
          const children = getDirectChildFrames(selEl);
          for (let i = children.length - 1; i >= 0; i--) {
            if (hitTest(children[i], e.clientX, e.clientY)) {
              if (setSelectedLayerId) {
                setSelectedLayerId(children[i].id);
                selectedLayerIdRef.current = children[i].id;
              }
              return;
            }
          }
          return;
        }
      }
    }

    // Fallback: select the target element directly
    if (target.id && target.tagName.toLowerCase() !== 'svg') {
      if (setSelectedLayerId) {
        setSelectedLayerId(target.id);
        selectedLayerIdRef.current = target.id;
      }
    }
  };

  const handlePrevPage = () => {
    if (isDoublePage) {
      if (activePageIndex === 0) return;
      
      const prevIdx = activePageIndex - 1;
      const wasPrevSpread = isDoublePage && prevIdx - 1 > 0 && prevIdx < pages.length - 1;
      
      if (activePageIndex === 1) {
        setActivePageIndex(0);
      } else if (wasPrevSpread) {
        // Jump back to start of previous spread
        setActivePageIndex(prev => Math.max(1, prev - 2));
      } else {
        // Just go back one
        setActivePageIndex(prev => Math.max(0, prev - 1));
      }
    } else {
      setActivePageIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (isDoublePage) {
      if (activePageIndex === 0) {
        if (pages.length > 1) setActivePageIndex(1);
      } else if (isCurrentlySpread) {
        // We are on a spread, jump 2
        if (activePageIndex + 2 < pages.length) {
          setActivePageIndex(prev => prev + 2);
        }
      } else {
        // We are on a single page, jump 1
        if (activePageIndex + 1 < pages.length) {
          setActivePageIndex(prev => prev + 1);
        }
      }
    } else {
      if (activePageIndex + 1 < pages.length) {
        setActivePageIndex(prev => prev + 1);
      }
    }
  };

  const closeAllDropdowns = () => {
    setShowSelectOptions(false);
    setShowPenOptions(false);
    setShowShapesOptions(false);
  };

  const isPageEmpty = !pages[activePageIndex]?.html;

  return (
    <div 
      className="bg-white flex-1 flex flex-col overflow-hidden h-[92vh]"
      onClick={closeAllDropdowns}
      onContextMenu={(e) => e.preventDefault()}
    >
      <TopToolbar 
        zoom={zoom} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onReset={handleResetZoom}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        rotation={rotation}
        onRotate={handleRotate}
        onFlipH={() => handleFlip('h')}
        onFlipV={() => handleFlip('v')}
        hasSelection={(() => {
          // Check if anything is selected
          if (!selectedLayerId && multiSelectedIds.size === 0) return false;
          
          // Identify if the only thing selected is the Root Folder
          const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
          const svg = activeContainer?.querySelector('svg');
          if (svg) {
            const topFrames = getTopLevelFrames(svg);
            if (topFrames.length === 1) {
              const rootId = topFrames[0].id;
              const overlayId = topFrames[0].querySelector('[data-name="Overlay"]')?.id;
              const isBase = (id) => id === rootId || (overlayId && id === overlayId);

              // If only root or its background overlay is selected, we consider it "no valid selection" for rotation
              const onlyRoot = (isBase(selectedLayerId) && multiSelectedIds.size === 0) || 
                               (multiSelectedIds.size === 1 && Array.from(multiSelectedIds).some(isBase));
              if (onlyRoot) return false;
            }
          }
          return true;
        })()}
      />
      <div 
        className="flex-1 relative flex items-center justify-center p-[1vw] overflow-hidden bg-[#FBFBFB]"
        onClick={(e) => {
          // ── Background Click: Identify Base Root Folder(s) ─────────────────
          const containers = [];
          containers.push(document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`));
          if (isCurrentlySpread) {
            containers.push(document.querySelector(`.page-svg-container[data-page-index="${activePageIndex + 1}"]`));
          }

          const rootIds = [];
          containers.forEach(container => {
            const svg = container?.querySelector('svg');
            if (svg) {
              const topFrames = getTopLevelFrames(svg);
              if (topFrames.length === 1) {
                rootIds.push(topFrames[0].id);
              }
            }
          });

          if (rootIds.length > 0) {
            if (setSelectedLayerId) {
              setSelectedLayerId(rootIds[0]);
              setMultiSelectedIds(new Set(rootIds));
              setCurrentFrameId(null); // Deselect sub-frame to allow whole page moving
              currentFrameIdRef.current = null;
            }
            setActiveMainTool('select');
          } else {
            setSelectedLayerId(null);
            setMultiSelectedIds(new Set());
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
            setActiveMainTool('select');
          }
        }}
      >
        
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        <div className="absolute right-[1.05vw] top-[1.9vh] z-50">
          <div className="bg-[#F1F3F4] rounded-[0.5vw] border border-gray-300 p-[0.3vw] flex flex-col items-center w-[2.7vw] gap-[0.7vh] shadow-sm">
            {/* Black Edit Icon Button */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer bg-[#000000] rounded-[0.4vw] flex items-center justify-center transition-all my-[0.1vh]">
              <Icon icon="tabler:edit" width="1.1vw" height="1.1vw" className="text-white" />
            </button>
            
            {/* Hand / Pan Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all">
              <Icon icon="hugeicons:touch-interaction-01" width="1.2vw" height="1.2vw" />
            </button>
            
            {/* Star / Special Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all mb-[0.2vh]">
              <Icon icon="tdesign:animation-1" width="1.2vw" height="1.2vw" />
            </button>
          </div>
        </div>

        {/* Top-Left: Animated Lordicon Card - Vertical Column */}
        <div className="absolute left-[0.8vw] top-[0.8vw] z-50">
          <div className="bg-white rounded-[0.5vw] border border-gray-100/50 p-[0.3vw] shadow-sm flex flex-col items-center gap-[0.5vw]">
            {/* Animated Hotspot Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/erxuunyq.json"
                trigger="loop"
                colors="primary:#E88F23"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Notification/Follow Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/kwnsnjyg.json"
                trigger="loop"
                colors="primary:#00ACEE"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Third Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/shquqxad.json"
                trigger="loop"
                delay="2000"
                colors="primary:#9381FF"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>
          </div>
        </div>

        {/* Bottom Group: Creation & Widgets - Perfected Integrated Design */}
        <div className="absolute right-0 top-[20vh] z-50">
          <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
            
            {/* Perfect Inverted Corner Top */}
            <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4"/>
                <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* Perfect Inverted Corner Bottom */}
            <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4"/>
                <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* White Upload Button - matching top group size */}
            <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw]">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('upload');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'upload' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="prime:upload" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Select Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Select Tool Options Dropdown */}
              {showSelectOptions && (
                <div className="absolute right-[4.2vw] top-[-1.5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('select');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-line" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Select</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'direct' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('direct');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-solid" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Direct</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('select');
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={selectedSelectTool === 'select' ? 'clarity:cursor-arrow-line' : 'clarity:cursor-arrow-solid'} 
                  width="1.2vw" 
                  height="1.2vw" 
                  className="text-[#111827]" 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSelectOptions(!showSelectOptions);
                  setShowPenOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('select');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showSelectOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Pen Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Pen Tool Options Dropdown */}
              {showPenOptions && (
                <div className="absolute right-[4.2vw] top-[-5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pen' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pen');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pen</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.3vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'curve' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('curve');
                      setShowPenOptions(false);
                    }}
                  >
                    <CurveIcon width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Curve</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pencil' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pencil');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="mingcute:pencil-fill" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pencil</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('pen');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'pen' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                {selectedPenTool === 'pencil' ? (
                  <Icon icon="mingcute:pencil-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : selectedPenTool === 'curve' ? (
                  <CurveIcon width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : (
                  <Icon icon="streamline-cyber:pen-tool" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                )}
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPenOptions(!showPenOptions);
                  setShowSelectOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('pen');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showPenOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Type Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('type');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'type' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="mi:text" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Shapes Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Shapes Tool Options Dropdown */}
              {showShapesOptions && (
                <div className="absolute right-[4.2vw] top-[-12vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.8vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('rectangle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:square" width="1vw" height="1vw" className={`${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Rectangle</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'circle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('circle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:circle" width="1vw" height="1vw" className={`${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Circle</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('polygon');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:triangle" width="1vw" height="1vw" className={`${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Polygon</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('line');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="tabler:line" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827] rotate-[-45deg]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Line</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'star' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('star');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:star" width="1vw" height="1vw" className={`${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Star</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('shapes');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'shapes' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={
                    selectedShapeTool === 'rectangle' ? 'lucide:square' : 
                    selectedShapeTool === 'circle' ? 'lucide:circle' : 
                    selectedShapeTool === 'polygon' ? 'lucide:triangle' : 
                    selectedShapeTool === 'line' ? 'tabler:line' : 'lucide:star'
                  } 
                  width="1.2vw" 
                  height="1.2vw" 
                  className={`text-[#111827] ${selectedShapeTool === 'line' ? 'rotate-[-45deg]' : ''}`} 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShapesOptions(!showShapesOptions);
                  setShowSelectOptions(false);
                  setShowPenOptions(false);
                  setActiveMainTool('shapes');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showShapesOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Grid Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('grid');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'grid' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="tabler:icons" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>
          </div>
        </div>

        {/* Canvas Area container */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white">
          {/* Left Navigation-Button */}
          <button 
            disabled={activePageIndex === 0}
            onClick={handlePrevPage}
            className={`absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw] ${activePageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ 
              left: `calc(50% - ${
                isCurrentlySpread
                  ? '((78vh / 1.414) * 1.0)' 
                  : '((78vh / 1.414) / 2)'
              } * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[-90deg]" />
          </button>

          {/* Zoomable Canvas Container with Perimeter Shadow */}
          <div 
            className={`flex items-center justify-center transition-all duration-300 origin-center gap-[0] bg-white border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_20px_-5px_rgba(0,0,0,0.05)]`}
            style={{ 
              transform: `scale(${zoom / 100})`,
            }}
          >
            {/* A4 Canvas Page 1 (Left Page in Spread or Hidden if Cover) */}
            {pages.length > 0 && (isDoublePage ? (activePageIndex > 0 && pages[activePageIndex]) : pages[activePageIndex]) && (
              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top) */}
                <div className="absolute top-[-2.5vw] z-30" style={{ [isCurrentlySpread ? 'left' : 'right']: '0vw' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === activePageIndex ? null : activePageIndex);
                    }}
                    className={`cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200`}
                  >
                    <Icon icon={isCurrentlySpread ? "ri:menu-fold-4-fill" : "ri:menu-unfold-4-fill"} width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {openMenuIndex === activePageIndex && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-[0.5vw] left-0 w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuOption 
                          icon={<PlusIcon />} 
                          label="Add Page" 
                          onClick={() => { insertPageAfter(activePageIndex); setOpenMenuIndex(null); }}
                        />
                        <MenuOption 
                          icon={<FilePlusIcon />} 
                          label="Add File" 
                          onClick={() => setOpenMenuIndex(null)}
                        />
                        <MenuOption 
                          icon={<DuplicateIcon />} 
                          label="Duplicate" 
                          onClick={() => { duplicatePage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                          <MenuOption 
                            icon={<TemplateIcon />} 
                            label="Template" 
                            onClick={() => {
                              onOpenTemplateModal(activePageIndex);
                              setOpenMenuIndex(null);
                            }}
                          />
                        <div className="h-[0.1vw] bg-gray-100 my-[0.2vw] mx-[0.4vw]" />
                        <MenuOption 
                          icon={<ClearIcon />} 
                          label="Clear" 
                          onClick={() => { clearPage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                        <MenuOption 
                          icon={<DeleteIcon />} 
                          label="Delete" 
                          color="text-red-500" 
                          hoverColor="hover:bg-red-50"
                          onClick={() => { deletePage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* A4 Canvas Page 1 Inner */}
                <div 
                  className="relative z-0 flex flex-col overflow-hidden bg-white group/inner"
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className={`flex-1 w-full relative page-svg-container tool-${selectedSelectTool}`} data-page-index={activePageIndex}>
                    <style>{svgGlobalStyles}</style>
                    {pages[activePageIndex]?.html ? (
                        <div 
                          className="absolute inset-0 w-full h-full overflow-visible flex items-center justify-center bg-white"
                        >
                         <div 
                           className="w-full h-full flex items-center justify-center"
                           dangerouslySetInnerHTML={{ __html: pages[activePageIndex]?.html }}
                           onMouseDown={(e) => handleSvgMouseDown(activePageIndex, e)}
                           onMouseMove={handleSvgMouseMove}
                           onMouseLeave={handleSvgMouseLeave}
                           onClick={handleSvgClick}
                           onDoubleClick={handleSvgDoubleClick}
                           onContextMenu={(e) => handleSvgContextMenu(activePageIndex, e)}
                         />
                         {/* Selection Overlay (Overlay rotated element perfectly) */}
                         <svg 
                           id={`highlight-overlay-${activePageIndex}`}
                           className="absolute inset-0 w-full h-full pointer-events-none z-[100] selection-overlay-layer" style={{ overflow: 'visible' }}
                         />

                          {/* Marquee Selection Box */}
                          <div 
                            ref={marqueeOverlayRef1}
                            style={{
                              position: 'absolute',
                              border: '1px solid #6366F1',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              pointerEvents: 'none',
                              zIndex: 1000,
                              display: 'none'
                            }}
                          />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                        <span className="text-[1.1vw] text-gray-300 font-medium mb-[0.4vw]">A4 sheet (210 x 297 mm)</span>
                        <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                      </div>
                    )}

                    {/* Simple Click-to-Open Gallery Overlay for empty pages */}
                    {!pages[activePageIndex]?.html && (
                      <div 
                        className="absolute inset-0 z-10"
                        onClick={() => onOpenTemplateModal(activePageIndex)}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* Subtle Center Divider for Double Page - Only show if it's a spread */}
            {isCurrentlySpread && (
              <div className="w-[1px] h-[78vh] bg-gray-100/50 relative z-10 shrink-0"></div>
            )}

            {/* A4 Canvas Page 2 (Visible if Double Page is enabled OR Right-Side Cover) */}
            {(activePageIndex === 0 ? (isDoublePage && pages[0]) : isCurrentlySpread) && (
              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top - Right Side) */}
                <div className="absolute top-[-2.5vw] right-0 z-30">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      setOpenMenuIndex(openMenuIndex === displayIndex ? null : displayIndex);
                    }}
                    className="cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200"
                  >
                    <Icon icon="ri:menu-unfold-4-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      return openMenuIndex === displayIndex && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full mt-[0.5vw] right-0 w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MenuOption 
                            icon={<PlusIcon />} 
                            label="Add Page" 
                            onClick={() => { insertPageAfter(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<FilePlusIcon />} 
                            label="Add File" 
                            onClick={() => setOpenMenuIndex(null)}
                          />
                          <MenuOption 
                            icon={<DuplicateIcon />} 
                            label="Duplicate" 
                            onClick={() => { duplicatePage(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<TemplateIcon />} 
                            label="Template" 
                            onClick={() => {
                              onOpenTemplateModal(displayIndex);
                              setOpenMenuIndex(null);
                            }}
                          />
                          <div className="h-[0.1vw] bg-gray-100 my-[0.2vw] mx-[0.4vw]" />
                          <MenuOption 
                            icon={<ClearIcon />} 
                            label="Clear" 
                            onClick={() => { clearPage(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<DeleteIcon />} 
                            label="Delete" 
                            color="text-red-500" 
                            hoverColor="hover:bg-red-50"
                            onClick={() => { deletePage(displayIndex); setOpenMenuIndex(null); }}
                          />
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* A4 Canvas Page 2 Inner */}
                <div 
                  className="relative z-0 flex flex-col overflow-hidden bg-white group/inner"
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className={`flex-1 w-full relative page-svg-container tool-${activePageIndex === 0 ? selectedSelectTool : selectedSelectTool}`} data-page-index={activePageIndex === 0 ? 0 : activePageIndex + 1}>
                    <style>{svgGlobalStyles}</style>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      const page = pages[displayIndex];

                      return page?.html ? (
                        <div
                          className="absolute inset-0 w-full h-full overflow-visible flex items-center justify-center bg-white"
                        >
                           <div
                             className="w-full h-full flex items-center justify-center"
                             dangerouslySetInnerHTML={{ __html: page.html }}
                             onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                             onMouseMove={handleSvgMouseMove}
                             onMouseLeave={handleSvgMouseLeave}
                             onClick={handleSvgClick}
                             onDoubleClick={handleSvgDoubleClick}
                             onContextMenu={(e) => handleSvgContextMenu(displayIndex, e)}
                           />
                           {/* Selection Overlay (Overlay rotated element perfectly) */}
                           <svg 
                             id={`highlight-overlay-${displayIndex}`}
                             className="absolute inset-0 w-full h-full pointer-events-none z-[100] selection-overlay-layer" style={{ overflow: 'visible' }}
                           />

                           {/* Marquee Selection Box */}
                           <div 
                             ref={marqueeOverlayRef2}
                             style={{
                               position: 'absolute',
                               border: '1px solid #6366F1',
                               backgroundColor: 'rgba(99, 102, 241, 0.1)',
                               pointerEvents: 'none',
                               zIndex: 1000,
                               display: 'none'
                             }}
                           />
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                            <span className="text-[1.1vw] text-gray-300 font-medium mb-[0.4vw]">A4 sheet (210 x 297 mm)</span>
                            <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                          </div>
                          {/* Click Overlay to open gallery */}
                          <div 
                            className="absolute inset-0 cursor-pointer z-10"
                            onClick={() => onOpenTemplateModal(displayIndex)}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </>
                      );
                  })()}
                </div>
                  
                </div>
              </div>
            )}
          </div>

          {/* Right Navigation Button */}
          <button 
            disabled={isDoublePage 
              ? (activePageIndex === 0 ? pages.length <= 1 : (isCurrentlySpread ? activePageIndex + 2 >= pages.length : activePageIndex + 1 >= pages.length)) 
              : activePageIndex + 1 >= pages.length
            }
            onClick={handleNextPage}
            className={`absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw] ${ 
              (isDoublePage 
                ? (activePageIndex === 0 ? pages.length <= 1 : (isCurrentlySpread ? activePageIndex + 2 >= pages.length : activePageIndex + 1 >= pages.length)) 
                : activePageIndex + 1 >= pages.length
              ) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{ 
              right: `calc(50% - ${
                isCurrentlySpread
                  ? '((78vh / 1.414) * 1.0)' 
                  : '((78vh / 1.414) / 2)'
              } * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[90deg]" />
          </button>
        </div>

      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const FilePlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const DuplicateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const TemplateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ClearIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const DeleteIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const MenuOption = ({ icon, label, onClick, color = "text-gray-700", hoverColor = "hover:bg-gray-50" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium transition-colors rounded-[0.4vw] text-left cursor-pointer ${color} ${hoverColor}`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

export default MainEditor;
