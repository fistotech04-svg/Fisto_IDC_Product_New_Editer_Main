import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import interact from 'interactjs';

import paper from 'paper';

const PENCIL_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><path d='m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z' /><path fill='%23000' d='M20.131 3.16a3 3 0 0 0-4.242 0l-.707.708l4.95 4.95l.706-.707a3 3 0 0 0 0-4.243l-.707-.707Zm-1.414 7.072l-4.95-4.95l-9.09 9.091a1.5 1.5 0 0 0-.401.724l-1.029 4.455a1 1 0 0 0 1.2 1.2l4.456-1.028a1.5 1.5 0 0 0 .723-.401z' /></g></svg>") 1 16, crosshair`;
const PEN_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'><g transform='rotate(135 12 12)' fill='%23FFF' stroke='%23000' stroke-linejoin='round' stroke-miterlimit='10' stroke-width='1'><path d='M16 4.5H7l-1.5-3h12zm3.5 7l-7 12h-2l-7-12l3.5-7h9z' /><path stroke-linecap='round' d='M11.5 23.5V13' /><path d='M13 11.5L11.5 10L10 11.5l1.5 1.499z' /></g></svg>") 3 3, crosshair`;
const SHAPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2V22M2 12H22' stroke='%236366F1' stroke-width='2' stroke-linecap='round'/></svg>") 12 12, crosshair`;
const TYPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 15 15'><path fill='%23000' d='M10.5 1a.5.5 0 0 1 0 1c-.922 0-1.54.23-1.92.563C8.206 2.89 8 3.366 8 4v3h1.25a.5.5 0 0 1 0 1H8v3c0 .634.207 1.11.58 1.437c.38.333.998.563 1.92.563a.5.5 0 0 1 0 1c-1.078 0-1.96-.27-2.58-.812a2.6 2.6 0 0 1-.42-.47q-.177.256-.42.47C6.46 13.73 5.577 14 4.5 14a.5.5 0 0 1 0-1c.922 0 1.54-.23 1.92-.563c.373-.326.58-.803.58-1.437V8H5.75a.5.5 0 0 1 0-1H7V4c0-.634-.207-1.11-.58-1.437C6.04 2.23 5.423 2 4.5 2a.5.5 0 0 1 0-1c1.078 0 1.96.27 2.58.812q.243.213.42.468q.177-.255.42-.468C8.54 1.27 9.423 1 10.5 1' /></svg>") 7 7, text`;

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
    cursor: inherit;
  }

  /* Allow text selection when editing */
  .page-svg-container svg [contenteditable="true"],
  .page-svg-container svg foreignObject[data-editing="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: ${TYPE_CURSOR} !important;
    outline: none;
  }

  div.text-edit-box {
    outline: 1.5px solid #6366F1 !important;
    box-shadow: 0 0 4px rgba(99, 102, 241, 0.3) !important;
    background: white !important;
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

  /* 10. Pencil Tool Cursor */
  .page-svg-container.pencil-mode svg,
  .page-svg-container.pencil-mode svg *,
  .page-svg-container.pencil-mode svg [data-name="Overlay"] {
    cursor: ${PENCIL_CURSOR} !important;
  }

  /* 10a. Pen/Curve Tool Cursor */
  .page-svg-container.pen-mode svg,
  .page-svg-container.pen-mode svg *,
  .page-svg-container.pen-mode svg [data-name="Overlay"] {
    cursor: ${PEN_CURSOR} !important;
  }

  /* 10b. Shape Tool Cursor */
  .page-svg-container.shape-mode svg,
  .page-svg-container.shape-mode svg *,
  .page-svg-container.shape-mode svg [data-name="Overlay"] {
    cursor: ${SHAPE_CURSOR} !important;
  }

  /* 10c. Type Tool Cursor */
  .page-svg-container.type-mode svg,
  .page-svg-container.type-mode svg *,
  .page-svg-container.type-mode svg [data-name="Overlay"] {
    cursor: ${TYPE_CURSOR} !important;
  }

  /* 11. Active Page Indicator - Glow/Shadow selection without solid border */
  .active-page-outline {
    outline: 2px solid #5145f6 !important;
    box-shadow: 0 0 10px rgba(16, 0, 188, 0.45) !important;
    z-index: 10 !important;
    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pen-tool-node {
    pointer-events: none;
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.2));
    transition: all 0.1s ease;
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
  const [isEditingText, setIsEditingText] = useState(false);
  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [zoom, setZoom] = useState(90);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which page's menu is open
  const [rotation, setRotation] = useState(0);
  const paperScopeRef = useRef(null);
  const currentFrameIdRef = useRef(null);

  useEffect(() => {
    paperScopeRef.current = new paper.PaperScope();
    paperScopeRef.current.setup(document.createElement('canvas'));
  }, []);

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

  const getHtmlOverlayForElement = (el) => {
    const container = el.closest('.page-svg-container');
    if (!container) return null;
    const pageIdx = container.getAttribute('data-page-index');
    return document.getElementById(`highlight-overlay-html-${pageIdx}`);
  };

  const drawOverlayHighlight = (el, type) => {
    if (!el || typeof el.getBBox !== 'function' || typeof el.getScreenCTM !== 'function') return;
    
    const overlay = getOverlayForElement(el);
    if (!overlay) return;

    // Skip if element is hidden (e.g. while editing text), but DO clear its stale overlay!
    if (el.style.visibility === 'hidden' || el.style.opacity === '0') {
       const existingPoly = overlay.querySelector(`[id="overlay-poly-${type}-${el.id}"]`);
       if (existingPoly) existingPoly.remove();
       const htmlOverlay = getHtmlOverlayForElement(el);
       if (htmlOverlay) {
           const existingHandles = htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"]`);
           existingHandles.forEach(h => h.remove());
       }
       return;
    }
    
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
                // crisp lines without massive drop shadow
            } else if (type === 'entered') {
                polygon.setAttribute('stroke', '#6366F1');
                polygon.setAttribute('stroke-width', '1');
                polygon.setAttribute('stroke-dasharray', '4,4');
            }
            
            polygon.setAttribute('pointer-events', 'none'); 
            overlay.appendChild(polygon);
        }
        polygon.setAttribute('points', pointsStr);
        
        // ── RESIZE HANDLES ──
        if (type === 'selected' || type === 'child-selected') {
            const htmlOverlay = getHtmlOverlayForElement(el);
            const handleSize = 10;
            const handleNames = ['nw', 'ne', 'se', 'sw'];
            
            // Handles match the corners defined in pts array: 
            // 0:Top-Left(nw), 1:Top-Right(ne), 2:Bottom-Right(se), 3:Bottom-Left(sw)
            mapped.forEach((p, i) => {
                let handleId = `resize-handle-${el.id}-${handleNames[i]}`;
                let handle = htmlOverlay?.querySelector(`[id="${handleId}"]`);
                if (!handle && htmlOverlay) {
                    handle = document.createElement('div');
                    handle.id = handleId;
                    // Removed rounded-sm to make them perfect squares like Fabric.js
                    handle.className = `resize-handle overlay-type-${type} absolute bg-white`;
                    handle.style.width = `${handleSize}px`;
                    handle.style.height = `${handleSize}px`;
                    handle.style.border = '1.5px solid #6366F1';
                    handle.style.boxSizing = 'border-box';
                    handle.style.pointerEvents = 'auto';
                    
                    // Determine cursor based on corner and current element rotation
                    const angle = Math.atan2(ctm.b, ctm.a) * (180 / Math.PI);
                    const isDiagonal1 = (i === 0 || i === 2); // NW or SE
                    handle.style.cursor = isDiagonal1 ? 'nwse-resize' : 'nesw-resize';
                    
                    htmlOverlay.appendChild(handle);
                }
                if (handle) {
                    handle.style.left = `${p.x - handleSize/2}px`;
                    handle.style.top = `${p.y - handleSize/2}px`;
                }
            });
        }
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

    // Allow right click on overlay, but block pure svg background clicks if any
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'svg') {
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

    const layerEl = svg.querySelector(`[id="${layerId}"]`);
    const isOverlay = layerEl ? layerEl.getAttribute('data-name') === 'Overlay' : false;

    // 2. Select the layer if not already part of multi-selection
    if (!multiSelectedIds.has(layerId)) {
        setSelectedLayerId(layerId);
        setMultiSelectedIds(new Set([layerId]));
    }

    // 3. Dispatch event to trigger the Layer.jsx menu
    window.dispatchEvent(new CustomEvent('show-layer-context-menu', { 
        detail: { e, layerId, pageIndex, isOverlay } 
    }));
  };

  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const selectedLayerIdRef = useRef(null);
  const activeMainToolRef = useRef(activeMainTool);
  const selectedSelectToolRef = useRef(selectedSelectTool);
  const selectedPenToolRef = useRef(selectedPenTool);
  const drawingPathRef = useRef(null);
  const drawingPointsRef = useRef([]);
  const drawingPageIndexRef = useRef(null);
  const drawingSvgRef = useRef(null);
  const drawingShapeRef = useRef(null);
  const shapeStartPointRef = useRef(null);
  const skipClearSelectionRef = useRef(false);
  const lastClickRef = useRef({ time: 0, target: null });
  const draggedNodeIndexRef = useRef({ pIdx: -1, ptIdx: -1 });
  const bendingStateRef = useRef(null);
  const drawingSubPathsRef = useRef([]); // [[{x,y..}], [{x,y..}]]
  const drawingSubPathElsRef = useRef([]); // [pathElement, pathElement]
  const activeBendingSegmentRef = useRef(null);
  const handleDraggingStateRef = useRef(null);

  // ── Sync refs with state/props ──────────────────────────────────────────────
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);

  useEffect(() => {
    if (activeBendingSegmentRef.current) {
        clearPenToolNodes(activeBendingSegmentRef.current.pageIndex);
        activeBendingSegmentRef.current = null;
    }
  }, [activeMainTool]);

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
        const isPenDrawing = activeMainTool === 'pen' && drawingPathRef.current;
        
        if (isPenDrawing) {
          const subPaths = drawingSubPathsRef.current;
          const currentPts = subPaths[subPaths.length - 1];
          
          // If the group is totally empty (first segment has 1 or 0 points), cancel the whole group
          if (subPaths.length === 1 && (!currentPts || currentPts.length <= 1)) {
            const path = drawingPathRef.current;
            if (path.parentNode) path.parentNode.removeChild(path);
            drawingPathRef.current = null;
            drawingSubPathsRef.current = [];
            drawingSubPathElsRef.current = [];
            clearPenToolNodes(activePageIndex);
            return;
          }

          // Otherwise, just finish the current segment (allow starting next path in same group)
          drawingPathRef.current.isFinished = true;
          drawPenToolNodes(activePageIndex, drawingPathRef.current, subPaths);
          
          const currentIdx = subPaths.length - 1;
          if (drawingSubPathElsRef.current[currentIdx]) {
            drawingSubPathElsRef.current[currentIdx].setAttribute('d', generatePathData(subPaths[currentIdx], false, selectedPenTool));
          }
          return;
        }

        // Standard Navigation logic: clear selection or exit frame
        multiSelectedIdsRef.current = new Set();
        setMultiSelectedIds(new Set());

        const frameId = currentFrameIdRef.current;
        if (frameId) {
          if (setSelectedLayerId) {
            setSelectedLayerId(frameId);
            selectedLayerIdRef.current = frameId;
          }
          setCurrentFrameId(null);
          currentFrameIdRef.current = null;
        } else if (selectedLayerIdRef.current) {
          if (setSelectedLayerId) {
            setSelectedLayerId(null);
            selectedLayerIdRef.current = null;
          }
        }
      } else if (e.key.toLowerCase() === 'a' || e.key === 'Enter') {
        if (activeMainTool === 'pen' && drawingPathRef.current) {
            const group = drawingPathRef.current;
            const pageIdx = drawingPageIndexRef.current;
            const svgEl = group?.ownerSVGElement;

            drawingPathRef.current = null;
            drawingSubPathsRef.current = [];
            drawingSubPathElsRef.current = [];
            draggedNodeIndexRef.current = { pIdx: -1, ptIdx: -1 };
            clearPenToolNodes(pageIdx);

            if (svgEl && updatePageHtml) {
                updatePageHtml(pageIdx, svgEl.outerHTML);
                
                // Auto-select and switch to selection tool
                if (group && group.id) {
                    if (setSelectedLayerId) {
                        setSelectedLayerId(group.id);
                        selectedLayerIdRef.current = group.id;
                    }
                    if (setMultiSelectedIds) {
                        setMultiSelectedIds(new Set([group.id]));
                        multiSelectedIdsRef.current = new Set([group.id]);
                    }
                    drawOverlayHighlight(group, 'selected');
                }
                skipClearSelectionRef.current = true;
                setTimeout(() => {
                    if (setActiveMainTool) setActiveMainTool('select');
                }, 100);
            }
            return;
        }
      } else if (e.key === 'P' && e.shiftKey) {
        setActiveMainTool('pen');
        setSelectedPenTool('pencil');
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
    if (skipClearSelectionRef.current) {
      skipClearSelectionRef.current = false;
      return;
    }
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
      // Clear pen tool nodes on tool switch
      document.querySelectorAll('.pen-tool-node').forEach(n => n.remove());
      
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

  const insertImageIntoPage = (pageIdx, dataUrl) => {
    // 1. Find the SVG of the target page
    const container = document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"]`);
    const svg = container?.querySelector('svg');
    if (!svg) return;

    // 2. Create SVG <image>
    const imgId = `image-${Math.random().toString(36).substr(2, 9)}`;
    const newImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    newImg.setAttribute('id', imgId);
    newImg.setAttribute('href', dataUrl);
    newImg.setAttribute('data-type', 'image');
    newImg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Load image to get dimensions
    const i = new Image();
    i.onload = () => {
      const width = i.width;
      const height = i.height;

      // Scale up to fit page width roughly
      let displayWidth = Math.min(width, 210);
      let displayHeight = (height / width) * displayWidth;

      if (displayHeight > 297) {
          displayHeight = 297;
          displayWidth = (width / height) * displayHeight;
      }

      // Append to root frame
      const topFrames = getTopLevelFrames(svg);
      const rootFrame = topFrames[0] || svg.querySelector('g');
      if (rootFrame) {
          try {
              const bbox = rootFrame.getBBox();
              const cx = bbox.x + bbox.width / 2;
              const cy = bbox.y + bbox.height / 2;
              
              newImg.setAttribute('x', cx - displayWidth / 2);
              newImg.setAttribute('y', cy - displayHeight / 2);
              newImg.setAttribute('width', displayWidth);
              newImg.setAttribute('height', displayHeight);
              
              rootFrame.appendChild(newImg);
              
              if (updatePageHtml) {
                  saveModifiedPageHtml(pageIdx, svg);
              }
              
              if (setSelectedLayerId) setSelectedLayerId(imgId);
              if (setMultiSelectedIds) setMultiSelectedIds(new Set([imgId]));
              if (setActiveMainTool) setActiveMainTool('select');
          } catch (err) {}
      }
    };
    i.src = dataUrl;
  };

  useEffect(() => {
    const handleAddImageEvent = (e) => {
      const { pageIndex, dataUrl } = e.detail;
      insertImageIntoPage(pageIndex, dataUrl);
    };
    window.addEventListener('upload-image-to-editor', handleAddImageEvent);
    return () => window.removeEventListener('upload-image-to-editor', handleAddImageEvent);
  }, [activePageIndex]);

  const clearOverlayType = (typePattern) => {
    document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
      overlay.querySelectorAll(`.overlay-pattern-${typePattern}`).forEach(p => p.remove());
      overlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
      // Also clear resize handles if we are clearing selection
      if (typePattern.includes('selected')) {
        overlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
    });

    // Clean up HTML-based UI elements (resize handles)
    document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
      htmlOverlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
      if (typePattern.includes('selected')) {
        htmlOverlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
    });
  };

  const clearPenToolNodes = (pageIndex) => {
    const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
    if (overlay) {
      overlay.querySelectorAll('.pen-tool-node').forEach(n => n.remove());
    }
  };

  const drawBendingNodes = (pageIndex, pathEl, paperPath, activeCurveIndex) => {
    const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
    if (!overlay || !pathEl) return;

    // IF drawing session active, draw ALL pen points first
    if (drawingPathRef.current) {
        drawPenToolNodes(pageIndex, drawingPathRef.current, drawingSubPathsRef.current);
    } else {
        clearPenToolNodes(pageIndex);
    }

    try {
      const ctm = pathEl.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return;
      const svgMatrix = overlayCtm.inverse().multiply(ctm);

      const curve = paperPath.curves[activeCurveIndex];
      const segments = [curve.segment1, curve.segment2];

      // Draw the Indigo highlight for ONLY the active segment
      const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      const map = (x, y) => new DOMPoint(x, y).matrixTransform(svgMatrix);
      const p1 = map(curve.point1.x, curve.point1.y);
      const p2 = map(curve.point2.x, curve.point2.y);
      const h1 = map(curve.point1.x + curve.segment1.handleOut.x, curve.point1.y + curve.segment1.handleOut.y);
      const h2 = map(curve.point2.x + curve.segment2.handleIn.x, curve.point2.y + curve.segment2.handleIn.y);

      highlight.setAttribute('d', `M ${p1.x} ${p1.y} C ${h1.x} ${h1.y} ${h2.x} ${h2.y} ${p2.x} ${p2.y}`);
      
      highlight.setAttribute('stroke', '#6366F1');
      highlight.setAttribute('stroke-width', '2.5');
      highlight.setAttribute('fill', 'none');
      highlight.setAttribute('class', 'pen-tool-node');
      highlight.style.pointerEvents = 'none';
      overlay.appendChild(highlight);

      segments.forEach(seg => {
        const pt = seg.point;
        
        // Draw Nodes
        const mappedPt = new DOMPoint(pt.x, pt.y).matrixTransform(svgMatrix);
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', mappedPt.x);
        node.setAttribute('cy', mappedPt.y);
        node.setAttribute('r', '3.5');
        node.setAttribute('class', 'pen-tool-node');
        node.setAttribute('stroke', '#6366F1');
        node.setAttribute('stroke-width', '1.5');
        node.setAttribute('fill', '#FFFFFF');
        overlay.appendChild(node);

        // Draw Handles
        const drawHandle = (h) => {
          if (!h || h.isZero()) return;
          const absH = pt.add(h);
          const mappedH = new DOMPoint(absH.x, absH.y).matrixTransform(svgMatrix);
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', mappedPt.x);
          line.setAttribute('y1', mappedPt.y);
          line.setAttribute('x2', mappedH.x);
          line.setAttribute('y2', mappedH.y);
          line.setAttribute('stroke', '#6366F1');
          line.setAttribute('stroke-width', '1');
          line.setAttribute('class', 'pen-tool-node');
          overlay.appendChild(line);

          const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          diamond.setAttribute('x', mappedH.x - 3);
          diamond.setAttribute('y', mappedH.y - 3);
          diamond.setAttribute('width', '6');
          diamond.setAttribute('height', '6');
          diamond.setAttribute('transform', `rotate(45, ${mappedH.x}, ${mappedH.y})`);
          diamond.setAttribute('fill', '#FFFFFF');
          diamond.setAttribute('stroke', '#6366F1');
          diamond.setAttribute('stroke-width', '1');
          diamond.setAttribute('class', 'pen-tool-node');
          overlay.appendChild(diamond);
        };

        drawHandle(seg.handleIn);
        drawHandle(seg.handleOut);
      });
    } catch (e) {}
  };

  const generatePathData = (pts, isClosed = false, toolType = 'pen', activePoint = null) => {
    let subPts = [...pts];
    if (activePoint) subPts.push(activePoint);
    if (subPts.length === 0) return "";
    
    const subIsClosed = isClosed || (pts && pts.isZ);
    const isCurve = toolType === 'curve';
    
    if (!isCurve) {
      return subPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + (subIsClosed ? ' Z' : '');
    }

    // Curve Logic
    if (subPts.length === 1) return `M ${subPts[0].x.toFixed(1)} ${subPts[0].y.toFixed(1)}`;
    if (subPts.length === 2 && !subIsClosed) {
      return `M ${subPts[0].x.toFixed(1)} ${subPts[0].y.toFixed(1)} L ${subPts[1].x.toFixed(1)} ${subPts[1].y.toFixed(1)}`;
    }

    let d = `M ${subPts[0].x.toFixed(1)} ${subPts[0].y.toFixed(1)}`;
    const count = subIsClosed ? subPts.length : subPts.length - 1;
    
    for (let i = 0; i < count; i++) {
      const p1 = subPts[i];
      const p2 = subPts[(i + 1) % subPts.length];
      
      // Support manual Bézier handles (from bending tool)
      if (p1.handleOut || p2.handleIn) {
        const h1 = p1.handleOut || { x: 0, y: 0 };
        const h2 = p2.handleIn || { x: 0, y: 0 };
        const cp1x = p1.x + h1.x;
        const cp1y = p1.y + h1.y;
        const cp2x = p2.x + h2.x;
        const cp2y = p2.y + h2.y;
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        continue;
      }

      if (p1.isCorner || p2.isCorner || !isCurve) {
        d += ` L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        continue;
      }

      const p0 = subPts[i === 0 ? (subIsClosed ? subPts.length - 1 : 0) : i - 1] || p1;
      const p3 = subPts[(i + 2) % subPts.length] || p2;
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    if (subIsClosed) d += " Z";
    return d;
  };

  const drawPenToolNodes = (pageIndex, parentEl, nestedPoints, currentPoint = null) => {
    const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
    if (!overlay || !parentEl) return;

    clearPenToolNodes(pageIndex);

    try {
      const ctm = parentEl.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return;
      const svgMatrix = overlayCtm.inverse().multiply(ctm);

      nestedPoints.forEach((pts, pIdx) => {
        const allPts = [...pts];
        const isCurrentPath = pIdx === nestedPoints.length - 1;
        if (isCurrentPath && currentPoint && !pts.isZ) allPts.push(currentPoint);

        allPts.forEach((pt, i) => {
          const svgPt = overlay.createSVGPoint();
          svgPt.x = pt.x;
          svgPt.y = pt.y;
          const mapped = svgPt.matrixTransform(svgMatrix);

          const isCorner = pt.isCorner;
          let node;
          if (isCorner) {
            node = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            node.setAttribute('x', mapped.x - 3.5);
            node.setAttribute('y', mapped.y - 3.5);
            node.setAttribute('width', '7');
            node.setAttribute('height', '7');
          } else {
            node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            node.setAttribute('cx', mapped.x);
            node.setAttribute('cy', mapped.y);
            node.setAttribute('r', '4');
          }
          
          node.setAttribute('class', 'pen-tool-node');
          node.setAttribute('stroke', '#6366F1');
          node.setAttribute('stroke-width', '1.5');
          
          const isLast = isCurrentPath && i === allPts.length - 1 && !pts.isZ;
          node.setAttribute('fill', isLast ? '#6366F1' : '#FFFFFF');
          
          overlay.appendChild(node);
        });
      });
    } catch (e) {}
  };

  // Helper: Get the starting index (left page) of the spread containing activePageIndex
  const spreadStartIndex = (isDoublePage && activePageIndex > 0) 
    ? (activePageIndex % 2 === 0 ? activePageIndex - 1 : activePageIndex)
    : activePageIndex;
    
  const isCurrentlySpread = isDoublePage && spreadStartIndex > 0 && spreadStartIndex + 1 < pages.length;


  // ── Sync refs and perform page-level DOM highlights ──────────────────────────
  useEffect(() => {
    // Force immediate visual cleanup of all overlays before redraw
    clearOverlayType('selected');
    clearOverlayType('entered');
    clearOverlayType('child-selected');
    
    // Highlights across all visible pages in the spread
    const pageIndices = [activePageIndex];
    if (isCurrentlySpread) {
      if (!pageIndices.includes(spreadStartIndex)) pageIndices.push(spreadStartIndex);
      if (!pageIndices.includes(spreadStartIndex + 1)) pageIndices.push(spreadStartIndex + 1);
    }


    const idsToHighlight = multiSelectedIds.size > 0
      ? multiSelectedIds
      : (selectedLayerId ? new Set([selectedLayerId]) : new Set());

    if (isEditingText) return;

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
  }, [selectedLayerId, currentFrameId, multiSelectedIds, pages, activePageIndex, isDoublePage, zoom, isEditingText]);

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
      child.getAttribute('data-hidden') !== 'true' &&
      child.getAttribute('data-name') !== 'Overlay'
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
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);

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

  const updatePageHtmlRef = useRef(updatePageHtml);
  useEffect(() => { updatePageHtmlRef.current = updatePageHtml; }, [updatePageHtml]);

  useEffect(() => {
    // Setup interactjs for elements within the SVG - targeting both elements and the background
    const interactable = interact('.page-svg-container svg, .page-svg-container svg *')
      .styleCursor(false) // Prevents interact.js from dynamically setting cursors on hover
      .draggable({
        ignoreFrom: '.resize-handle, .text-edit-box, [data-editing="true"]',
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
               // 1. Check current selection first (Selection Priority)
               // Priority: if clicking inside any element already part of the multi-selection, 
               // let's assume the user wants to drag the group (including clicking gaps inside or descendants).
               const currentMultiIds = multiSelectedIdsRef.current;
               if (currentMultiIds.size > 0 && selectedSelectToolRef.current !== 'direct') {
                 const entries = Array.from(currentMultiIds);
                 for (const id of entries) {
                   const selEl = container?.querySelector(`[id="${id}"]`);
                   if (selEl && selEl !== svgElement) {
                     // Check if we hit the element's bounding box OR one of its descendants
                     const isHit = hitTest(selEl, event.clientX, event.clientY, 2);
                     const isMemberHit = target && selEl.contains(target);
                     
                     if (isHit || isMemberHit) {
                        // Only allow dragging if it's NOT the root page-level frame
                        const topFrames = getTopLevelFrames(svgElement);
                        const isMainPageFrame = topFrames.length === 1 && selEl.id === topFrames[0].id;
                        
                        if (!isMainPageFrame) {
                          elementToDrag = selEl;
                          break; // Found it!
                        }
                     }
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
                          const isBaseFrame = topFrames.some(f => f.id === candidates[i].id);
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
              saveModifiedPageHtml(pageIdx, dragState.svgElement);
            }

            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);

            // Access data BEFORE deleting
            const svgEl = dragState.svgElement;
            const pageIndex = dragState.pageIndex;
            delete event.interaction.dragState;
            
            // Single reliable update call
            if (updatePageHtmlRef.current && svgEl) {
               updatePageHtmlRef.current(pageIndex, svgEl.outerHTML);
            }
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [zoom, activePageIndex]); // No longer depends on frequently changing callbacks

  useEffect(() => {
    const interactable = interact('.resize-handle')
      .draggable({
        listeners: {
          start(event) {
            suppressClickRef.current = true;
            const handle = event.target;
            const handleId = handle.id;
            const match = handleId.match(/resize-handle-(.+)-(nw|ne|se|sw)/);
            if (!match) return;
            
            const elId = match[1];
            const dir = match[2];
            const el = document.getElementById(elId);
            if (!el) return;

            const svg = el.ownerSVGElement;
            const startPoint = getSvgPoint(svg, event.clientX, event.clientY);
            const matrix = getElementMatrix(el);
            const bbox = el.getBBox();

            // Define anchor point in local space (opposite corner)
            let localAnchor;
            if (dir === 'se') localAnchor = { x: bbox.x, y: bbox.y };
            else if (dir === 'sw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'ne') localAnchor = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'nw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };

            const worldAnchor = new DOMPoint(localAnchor.x, localAnchor.y).matrixTransform(matrix);

            event.interaction.resizeState = {
              el,
              dir,
              matrix,
              bbox,
              worldAnchor,
              startPoint,
              svg
            };
          },
          move(event) {
            const state = event.interaction.resizeState;
            if (!state) return;

            const currentPoint = getSvgPoint(state.svg, event.clientX, event.clientY);
            if (!currentPoint) return;

            const { el, bbox, worldAnchor, matrix, dir } = state;
            
            // Vector from anchor to current cursor position
            const vCurrent = { x: currentPoint.x - worldAnchor.x, y: currentPoint.y - worldAnchor.y };
            
            // Vector from anchor to original handle position in world space
            let localHandle;
            if (dir === 'se') localHandle = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
            else if (dir === 'sw') localHandle = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'ne') localHandle = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'nw') localHandle = { x: bbox.x, y: bbox.y };
            
            const worldHandle = new DOMPoint(localHandle.x, localHandle.y).matrixTransform(matrix);
            const vOriginal = { x: worldHandle.x - worldAnchor.x, y: worldHandle.y - worldAnchor.y };

            // Transform vectors to local space of the element (ignoring its translation component)
            const invMatrix = matrix.inverse();
            invMatrix.e = 0; invMatrix.f = 0; 

            const vCurrentLocal = new DOMPoint(vCurrent.x, vCurrent.y).matrixTransform(invMatrix);
            const vOriginalLocal = new DOMPoint(vOriginal.x, vOriginal.y).matrixTransform(invMatrix);

            let scaleX = Math.abs(vOriginalLocal.x) < 0.1 ? 1 : vCurrentLocal.x / vOriginalLocal.x;
            let scaleY = Math.abs(vOriginalLocal.y) < 0.1 ? 1 : vCurrentLocal.y / vOriginalLocal.y;

            // Maintain Aspect Ratio for images or if Shift key is held
            const isImage = el.getAttribute('data-type') === 'image' || el.tagName.toLowerCase() === 'image';
            if (event.shiftKey || isImage) {
                const s = Math.max(Math.abs(scaleX), Math.abs(scaleY)) * (Math.sign(scaleX) || 1);
                scaleX = s;
                scaleY = s * (Math.sign(scaleY) / Math.sign(scaleX) || 1);
            }

            const scaleMatrix = new DOMMatrix()
              .translate(worldAnchor.x, worldAnchor.y)
              .scale(scaleX, scaleY)
              .translate(-worldAnchor.x, -worldAnchor.y);
            
            const nextMatrix = scaleMatrix.multiply(matrix);
            el.setAttribute('transform', matrixToTransform(nextMatrix));

            // Force update selection highlight immediately
            const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
            drawOverlayHighlight(el, highlightType);
          },
          end(event) {
            const state = event.interaction.resizeState;
            if (state && updatePageHtmlRef.current) {
               const container = state.el.closest('.page-svg-container');
               const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
               saveModifiedPageHtml(pageIdx, state.svg);
            }
            delete event.interaction.resizeState;
            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [activePageIndex]);

  // ── FIGMA-STYLE MOUSE DOWN: start drag on already-selected element ────────────
  const getLocalPoint = (svg, element, clientX, clientY) => {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(element.getScreenCTM().inverse());
  };

  const saveModifiedPageHtml = (targetPageIndex, targetSvg) => {
      if (!updatePageHtmlRef.current) return;
      let finalHtml = targetSvg.outerHTML;
      if (isDoublePage && pages && pages[targetPageIndex]) {
          const groupWrap = targetSvg.querySelector(`#page-group-${targetPageIndex}`);
          if (groupWrap) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(pages[targetPageIndex].html, 'image/svg+xml');
              const cleanSvg = doc.querySelector('svg');
              if (cleanSvg) {
                  cleanSvg.innerHTML = '';
                  Array.from(groupWrap.children).forEach(c => cleanSvg.appendChild(c.cloneNode(true)));
                  finalHtml = cleanSvg.outerHTML;
              }
          }
      }
      updatePageHtml(targetPageIndex, finalHtml);
  };

  const resolveTargetParentForCreation = (svg, clientX, clientY) => {
      let activeId = currentFrameIdRef.current;
      const topFrames = getTopLevelFrames(svg);
      const hitRoot = topFrames.find(f => hitTest(f, clientX, clientY));
      
      if (activeId) {
          const activeEl = svg.querySelector(`[id="${activeId}"]`);
          if (activeEl && !hitTest(activeEl, clientX, clientY) && hitRoot) {
              activeId = hitRoot.id;
              setCurrentFrameId(hitRoot.id);
              currentFrameIdRef.current = hitRoot.id;
          }
      } else if (hitRoot) {
          activeId = hitRoot.id;
      }
      return activeId ? svg.querySelector(`[id="${activeId}"]`) : (hitRoot || svg.querySelector('g[data-type="frame"]') || svg.querySelector('g'));
  };

  const handleSvgMouseDown = (pageIndex, e) => {
    if (e.button !== 0 || e.target.closest('.resize-handle')) return;

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // ── Universal cleanup for Bending State ──
    if (activeBendingSegmentRef.current && !e.ctrlKey) {
        clearPenToolNodes(activeBendingSegmentRef.current.pageIndex);
        activeBendingSegmentRef.current = null;
    }

    // ── Ctrl + Click Bending Detection (Universal across Pen/Select tools) ──
    if (e.ctrlKey && ['select', 'upload', 'pen', 'curve'].includes(activeMainToolRef.current || activeMainTool)) {
        const targetPath = e.target.closest('path');
        if (targetPath && targetPath.id && targetPath.getAttribute('data-type') !== 'Overlay') {
            const pt = getLocalPoint(svg, targetPath, e.clientX, e.clientY);
            paperScopeRef.current.activate();
            const paperPath = new paperScopeRef.current.Path(targetPath.getAttribute('d'));
            const location = paperPath.getNearestLocation(new paperScopeRef.current.Point(pt.x, pt.y));
            
            // Check for hits on existing handles first (prioritize handle dragging)
            const curves = paperPath.curves;
            for (let i = 0; i < curves.length; i++) {
                const c = curves[i];
                const hOut = c.point1.add(c.segment1.handleOut);
                const hIn = c.point2.add(c.segment2.handleIn);
                
                if (hOut.subtract(pt).length < 15) {
                    handleDraggingStateRef.current = { pathEl: targetPath, paperPath, curveIndex: i, handleSide: 'out', pageIndex };
                    suppressClickRef.current = true;
                    return;
                }
                if (hIn.subtract(pt).length < 15) {
                    handleDraggingStateRef.current = { pathEl: targetPath, paperPath, curveIndex: i, handleSide: 'in', pageIndex };
                    suppressClickRef.current = true;
                    return;
                }
            }

            // If no handle hit, check for segment bending
            if (location && location.distance < 40) {
                bendingStateRef.current = {
                    pathEl: targetPath,
                    paperPath,
                    curveIndex: location.curve.index,
                    startPoint: pt,
                    pageIndex
                };
                drawBendingNodes(pageIndex, targetPath, paperPath, location.curve.index);
                suppressClickRef.current = true;
                return;
            }
        }
    }

    // ── Creation Tool: Text (Type) Tool ─────────────────────────────────────────
    if (activeMainTool === 'type') {
      let parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        const id = `text-${Math.random().toString(36).substr(2, 9)}`;
        const newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        newText.setAttribute('id', id);
        newText.setAttribute('x', pt.x); // top-left x align
        newText.setAttribute('y', pt.y + 12); // visually balance so the click anchors closer to the top left 
        newText.setAttribute('fill', '#000000');
        newText.setAttribute('font-family', 'Inter, sans-serif');
        newText.setAttribute('font-size', '16');

        // Satisfying user requirement: precisely populate dummy text and let user double-click manually
        newText.textContent = 'Text'; 
        
        parentEl.appendChild(newText);
        
        if (updatePageHtml) {
            saveModifiedPageHtml(pageIndex, svg);
            window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: id } }));
        }

        skipClearSelectionRef.current = true;
        
        setTimeout(() => {
            if (setActiveMainTool) setActiveMainTool('select');
            
            if (setSelectedLayerId) {
                setSelectedLayerId(id);
                selectedLayerIdRef.current = id;
            }
            if (setMultiSelectedIds) {
                setMultiSelectedIds(new Set([id]));
                multiSelectedIdsRef.current = new Set([id]);
            }
            
            // Highlight it instantly
            const mountedText = container.querySelector(`[id="${id}"]`);
            if (mountedText) {
                drawOverlayHighlight(mountedText, 'selected');
            }
            
            suppressClickRef.current = false;
        }, 100);

        suppressClickRef.current = true;
      }
      return;
    }

    // ── Pen/Pencil/Curve Tool Drawing (Only on Active Page) ─────────────────────────────
    if (activeMainTool === 'pen' && pageIndex === activePageIndex && !e.ctrlKey) {
      const parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        // If already drawing, add point or close path
        if (drawingPathRef.current) {
            const nestedPoints = drawingSubPathsRef.current;
            const currentSubIdx = nestedPoints.length - 1;
            const currentPts = nestedPoints[currentSubIdx];

            // Hit test nodes
            let hitPIdx = -1, hitPtIdx = -1;
            nestedPoints.forEach((pts, pi) => {
                const idx = pts.findIndex(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 8);
                if (idx !== -1) { hitPIdx = pi; hitPtIdx = idx; }
            });

            if (hitPIdx !== -1) {
                if (hitPIdx === currentSubIdx && hitPtIdx === 0 && currentPts.length > 2 && !currentPts.isZ) {
                    currentPts.isZ = true;
                    drawingPathRef.current.isFinished = true;
                    const pathData = generatePathData(currentPts, true, selectedPenTool);
                    drawingSubPathElsRef.current[currentSubIdx].setAttribute('d', pathData);
                    drawPenToolNodes(pageIndex, drawingPathRef.current, nestedPoints);
                    suppressClickRef.current = true;
                    return;
                }
                draggedNodeIndexRef.current = { pIdx: hitPIdx, ptIdx: hitPtIdx };
                suppressClickRef.current = true;
                return;
            }

            if (drawingPathRef.current.isFinished) {
               drawingPathRef.current.isFinished = false;
               const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
               const pathId = `vpath-${Math.random().toString(36).substr(2, 9)}`;
               newPath.setAttribute('id', pathId);
               newPath.setAttribute('data-type', 'vector-path');
               newPath.setAttribute('fill', 'none');
               newPath.setAttribute('stroke', '#000000');
               newPath.setAttribute('stroke-width', '1.5');
               newPath.setAttribute('stroke-linecap', 'round');
               newPath.setAttribute('stroke-linejoin', 'round');
               newPath.setAttribute('d', `M ${pt.x} ${pt.y}`);
               drawingPathRef.current.appendChild(newPath);
               drawingSubPathsRef.current.push([{ x: pt.x, y: pt.y, isCorner: false }]);
               drawingSubPathElsRef.current.push(newPath);
               draggedNodeIndexRef.current = { pIdx: drawingSubPathsRef.current.length - 1, ptIdx: 0 };
            } else {
               currentPts.push({ x: pt.x, y: pt.y, isCorner: false });
               draggedNodeIndexRef.current = { pIdx: currentSubIdx, ptIdx: currentPts.length - 1 };
               const pathData = generatePathData(currentPts, false, selectedPenTool);
               drawingSubPathElsRef.current[currentSubIdx].setAttribute('d', pathData);
            }
            drawPenToolNodes(pageIndex, drawingPathRef.current, drawingSubPathsRef.current);
            suppressClickRef.current = true;
            return;
        }

        // Start new group
        const typeLabel = (selectedPenTool === 'curve' ? 'curve' : 'pen');
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const id = `${typeLabel}-group-${Math.random().toString(36).substr(2, 9)}`;
        group.setAttribute('id', id);
        group.setAttribute(`data-${typeLabel}-group`, 'true');
        group.setAttribute('data-type', 'vector-object');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathId = `vpath-${Math.random().toString(36).substr(2, 9)}`;
        path.setAttribute('id', pathId);
        path.setAttribute('data-type', 'vector-path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('d', `M ${pt.x} ${pt.y}`);
        group.appendChild(path);

        parentEl.appendChild(group);
        drawingPathRef.current = group;
        drawingSubPathsRef.current = [[{ x: pt.x, y: pt.y, isCorner: false }]];
        drawingSubPathElsRef.current = [path];
        draggedNodeIndexRef.current = { pIdx: 0, ptIdx: 0 };
        drawingPageIndexRef.current = pageIndex;
        drawingSvgRef.current = svg;
        
        drawPenToolNodes(pageIndex, group, drawingSubPathsRef.current);
        suppressClickRef.current = true;
      }
      return;
    }

    // ── Shapes Tool Drawing (Only on Active Page) ──────────────────────────────
    if (activeMainTool === 'shapes' && pageIndex === activePageIndex) {
      let parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        let shape;
        const id = `shape-${Math.random().toString(36).substr(2, 9)}`;

        switch (selectedShapeTool) {
          case 'rectangle':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', pt.x);
            shape.setAttribute('y', pt.y);
            shape.setAttribute('width', '0');
            shape.setAttribute('height', '0');
            break;
          case 'circle':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shape.setAttribute('cx', pt.x);
            shape.setAttribute('cy', pt.y);
            shape.setAttribute('r', '0');
            break;
          case 'line':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            shape.setAttribute('x1', pt.x);
            shape.setAttribute('y1', pt.y);
            shape.setAttribute('x2', pt.x);
            shape.setAttribute('y2', pt.y);
            break;
          case 'polygon':
          case 'star':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shape.setAttribute('d', `M ${pt.x} ${pt.y}`);
            break;
        }

        if (shape) {
          shape.setAttribute('id', id);
          shape.setAttribute('fill', 'none');
          shape.setAttribute('stroke', '#000000');
          shape.setAttribute('stroke-width', '1');
          shape.setAttribute('data-name', `${selectedShapeTool} ${id.substr(0, 4)}`);
          shape.setAttribute('data-type', 'shape');

          parentEl.appendChild(shape);
          drawingShapeRef.current = shape;
          shapeStartPointRef.current = pt;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;
          suppressClickRef.current = true;
        }
      }
      return;
    }

    if (!['select', 'upload'].includes(activeMainTool)) return;

    // ── Update Active Page on MouseDown ─────────────────────────────────────
    if (setActivePageIndex && activePageIndex !== pageIndex) {
      setActivePageIndex(pageIndex);
    }


    // 1. Identify level candidates and check if click hit any (including gaps)
    let candidates = [];
    let effectiveFrameId = currentFrameIdRef.current;
    
    // Auto-enter root frame context on mouse down for double pageview
    if (isDoublePage) {
        const topLevels = getTopLevelFrames(svg);
        const hitRoot = topLevels.find(f => hitTest(f, e.clientX, e.clientY));
        if (hitRoot && topLevels.length === 1 && effectiveFrameId !== hitRoot.id) {
            effectiveFrameId = hitRoot.id;
            setCurrentFrameId(hitRoot.id);
            currentFrameIdRef.current = hitRoot.id;
        }
    }

    if (effectiveFrameId) {
        const frameEl = svg.querySelector(`[id="${effectiveFrameId}"]`);
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

    // ── NEW: Check if we hit ANY already-selected element's bounding box ──────────
    let hitAnySelected = false;
    const currentMultiIds = multiSelectedIdsRef.current;
    if (currentMultiIds.size > 0) {
        for (const id of currentMultiIds) {
            const el = svg.querySelector(`[id="${id}"]`);
            if (el && hitTest(el, e.clientX, e.clientY, 2)) {
                hitAnySelected = true;
                break;
            }
        }
    }

    const topFrames = getTopLevelFrames(svg);
    const hitBaseFrame = hitCandidate && topFrames.some(f => f.id === hitCandidate.id);

    // 2. Selection/Drag Priority
    // If we hit any valid child candidate OR any already-selected element, 
    // don't start a marquee. Return early to allow interactjs to handle dragging.
    if ((hitCandidate && !hitBaseFrame || hitAnySelected) && !e.ctrlKey && selectedSelectToolRef.current !== 'direct') {
        return; 
    }

    // 3. Marquee Start Detection
    // Start marquee ONLY if forced (Ctrl). Normal drags will not start it.
    const shouldStartMarquee = e.ctrlKey;

    if (shouldStartMarquee) {
      const rect = container.getBoundingClientRect();
      const scale = zoom / 100;
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;
      
      marqueeDataRef.current = { startX, startY, containerRect: rect, scale };
      
      // Cache candidates and their bounding boxes for the marquee operation
      let marqueeCandidates = candidates.filter(el => {
          const isOverlay = el.getAttribute('data-name') === 'Overlay';
          const isBasePage = topFrames.some(f => f.id === el.id);
          return !isOverlay && !isBasePage;
      });

      marqueeCandidatesRef.current = marqueeCandidates.map(el => ({
          id: el.id,
          rect: el.getBoundingClientRect()
      }));

      setMarquee({ pageIndex });
      
      let activeRef;
      if (isDoublePage) {
          if (activePageIndex === 0 && pageIndex === 0) {
              activeRef = marqueeOverlayRef2; // Cover is on the right
          } else if (pageIndex === spreadStartIndex) {
              activeRef = marqueeOverlayRef1; // Left side of spread
          } else {
              activeRef = marqueeOverlayRef2; // Right side of spread
          }
      } else {
          activeRef = marqueeOverlayRef1; // Single page is always container 1
      }
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
  const handleSvgMouseMove = (pageIndex, e) => {
    // ── Ctrl + Click Bending Update ──
    if (bendingStateRef.current) {
        const { pathEl, paperPath, curveIndex, pageIndex: activePageIdx } = bendingStateRef.current;
        const svg = pathEl.ownerSVGElement;
        const pt = getLocalPoint(svg, pathEl, e.clientX, e.clientY);
        
        paperScopeRef.current.activate();
        const curve = paperPath.curves[curveIndex];
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
        
        // Symmetrical bending logic: point handles towards mouse
        const p1 = curve.segment1.point;
        const p2 = curve.segment2.point;
        
        // Factor of 0.45 creates a natural-looking bow that passes near the cursor
        curve.segment1.handleOut = mousePoint.subtract(p1).multiply(0.45);
        curve.segment2.handleIn = mousePoint.subtract(p2).multiply(0.45);
        
        pathEl.setAttribute('d', paperPath.pathData);
        drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);

        // ── SYNC WITH PEN TOOL STATE ──
        // If this path is part of an active drawing session, we must update the handles in drawingSubPathsRef
        // otherwise finalize/redraw (like pressing Enter) will recalculate automated curves and lose the bend.
        const subPathIdx = drawingSubPathElsRef.current.indexOf(pathEl);
        if (subPathIdx !== -1) {
            const subPath = drawingSubPathsRef.current[subPathIdx];
            const p1Ref = subPath[curveIndex];
            const p2Ref = subPath[(curveIndex + 1) % subPath.length];
            
            p1Ref.handleOut = { x: curve.segment1.handleOut.x, y: curve.segment1.handleOut.y };
            p2Ref.handleIn = { x: curve.segment2.handleIn.x, y: curve.segment2.handleIn.y };
        }

        suppressClickRef.current = true;
        return;
    }

    // ── Handle Dragging Logic ───────────────────────────────────────────────
    if (handleDraggingStateRef.current) {
        const { pathEl, paperPath, curveIndex, handleSide, pageIndex: activePageIdx } = handleDraggingStateRef.current;
        const svg = pathEl.ownerSVGElement;
        const pt = getLocalPoint(svg, pathEl, e.clientX, e.clientY);
        
        paperScopeRef.current.activate();
        const curve = paperPath.curves[curveIndex];
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
        
        if (handleSide === 'out') {
            curve.segment1.handleOut = mousePoint.subtract(curve.segment1.point);
        } else {
            curve.segment2.handleIn = mousePoint.subtract(curve.segment2.point);
        }
        
        pathEl.setAttribute('d', paperPath.pathData);
        drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);

        // Sync with Pen session points
        const subPathIdx = drawingSubPathElsRef.current.indexOf(pathEl);
        if (subPathIdx !== -1) {
            const subPath = drawingSubPathsRef.current[subPathIdx];
            if (handleSide === 'out') {
                subPath[curveIndex].handleOut = { x: curve.segment1.handleOut.x, y: curve.segment1.handleOut.y };
            } else {
                subPath[(curveIndex + 1) % subPath.length].handleIn = { x: curve.segment2.handleIn.x, y: curve.segment2.handleIn.y };
            }
        }

        suppressClickRef.current = true;
        return;
    }

    // ── Pencil/Pen/Curve Drawing Update ────────────────────────────────────────────────
    if (drawingPathRef.current) {
        const svg = drawingSvgRef.current;
        const pt = getSvgPoint(svg, e.clientX, e.clientY);
        if (pt) {
            const points = drawingPointsRef.current;
            
            // For node-based tools, we either drag an existing node or preview the new one
            if (selectedPenTool === 'pen' || selectedPenTool === 'curve') {
                const subPaths = drawingSubPathsRef.current;
                const activePIdx = subPaths.length - 1;
                const dNode = draggedNodeIndexRef.current;

                if (dNode.pIdx !== -1) {
                  // Update existing node in any subpath
                  const targetPt = subPaths[dNode.pIdx][dNode.ptIdx];
                  targetPt.x = pt.x;
                  targetPt.y = pt.y;
                  
                  const pathData = generatePathData(subPaths[dNode.pIdx], false, selectedPenTool);
                  drawingSubPathElsRef.current[dNode.pIdx].setAttribute('d', pathData);
                  drawPenToolNodes(pageIndex, drawingPathRef.current, subPaths);
                } else if (!drawingPathRef.current.isFinished) {
                  // Preview: only rubber-band for current subpath if not closed
                  const currentPts = subPaths[activePIdx];
                  const pathData = generatePathData(currentPts, false, selectedPenTool, pt);
                  drawingSubPathElsRef.current[activePIdx].setAttribute('d', pathData);
                  drawPenToolNodes(pageIndex, drawingPathRef.current, subPaths, pt);
                }
                return;
            }

            // Pencil (Freehand) logic adds points on every move
            points.push({ x: pt.x, y: pt.y });
            const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            
            drawingPathRef.current.setAttribute('d', pathData);
            suppressClickRef.current = true;
        }
        return;
    }

    // ── Shapes Drawing Update ────────────────────────────────────────────────
    if (drawingShapeRef.current) {
        const svg = drawingSvgRef.current;
        const pt = getSvgPoint(svg, e.clientX, e.clientY);
        const start = shapeStartPointRef.current;
        
        if (pt && start) {
            const shape = drawingShapeRef.current;
            const dx = pt.x - start.x;
            const dy = pt.y - start.y;
            
            switch (selectedShapeTool) {
              case 'rectangle':
                shape.setAttribute('x', Math.min(start.x, pt.x));
                shape.setAttribute('y', Math.min(start.y, pt.y));
                shape.setAttribute('width', Math.abs(dx));
                shape.setAttribute('height', Math.abs(dy));
                break;
              case 'circle':
                const radius = Math.sqrt(dx * dx + dy * dy);
                shape.setAttribute('r', radius);
                break;
              case 'line':
                shape.setAttribute('x2', pt.x);
                shape.setAttribute('y2', pt.y);
                break;
              case 'polygon': {
                const p1 = `${start.x},${start.y}`;
                const p2 = `${pt.x},${pt.y}`;
                const p3 = `${start.x - (pt.x - start.x)},${pt.y}`;
                shape.setAttribute('d', `M ${p1} L ${p2} L ${p3} Z`);
                break;
              }
              case 'star': {
                const rOuter = Math.sqrt(dx * dx + dy * dy);
                const rInner = rOuter / 2.5;
                const points = [];
                for (let i = 0; i < 10; i++) {
                    const r = (i % 2 === 0) ? rOuter : rInner;
                    const angle = (Math.PI / 5) * i - Math.PI / 2;
                    points.push(`${start.x + r * Math.cos(angle)},${start.y + r * Math.sin(angle)}`);
                }
                shape.setAttribute('d', `M ${points.join(' L ')} Z`);
                break;
              }
            }
            suppressClickRef.current = true;
        }
        return;
    }

    const isPenToolActive = activeMainTool === 'pen';
    const isShapes = activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload'].includes(activeMainTool);
    const allowSelection = isSelectionTool || ((isPenToolActive || isShapes) && pageIndex !== activePageIndex);

    if (!allowSelection) return;

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
        let activeRef;
        if (isDoublePage) {
            if (activePageIndex === 0 && marqueeRef.current.pageIndex === 0) {
                activeRef = marqueeOverlayRef2;
            } else if (marqueeRef.current.pageIndex === spreadStartIndex) {
                activeRef = marqueeOverlayRef1;
            } else {
                activeRef = marqueeOverlayRef2;
            }
        } else {
            activeRef = marqueeOverlayRef1;
        }
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
    // If we're on a spread, always try to "enter" the page we are hovering
    let effectiveFrameId = frameId;
    if (isDoublePage) {
        const tops = getTopLevelFrames(svg);
        const hitRoot = tops.find(f => hitTest(f, e.clientX, e.clientY));
        if (hitRoot && tops.length === 1 && effectiveFrameId !== hitRoot.id) {
            effectiveFrameId = hitRoot.id;
            // No need to set state via setCurrentFrameId here, 
            // the handleClick will finalize it. 
            // Just use local effectiveFrameId for hover highlighting.
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
  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee or tool drawing) ────────────────
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // ── Bending/Handle Dragging Finalization ──
      const activeState = (bendingStateRef.current || handleDraggingStateRef.current);
      if (activeState) {
          const { pathEl, paperPath, curveIndex, pageIndex } = activeState;
          const svgEl = pathEl.ownerSVGElement;
          if (svgEl && updatePageHtml) {
              saveModifiedPageHtml(pageIndex, svgEl);
          }
          activeBendingSegmentRef.current = { pathEl, paperPath, curveIndex, pageIndex };
          bendingStateRef.current = null;
          handleDraggingStateRef.current = null;
          return;
      }

      // Termination for drag-based pen tools (Pencil)
      if (drawingPathRef.current) {
        const points = drawingPointsRef.current;
        const tool = selectedPenTool;

          draggedNodeIndexRef.current = { pIdx: -1, ptIdx: -1 };

        if (tool === 'pencil') {
          const path = drawingPathRef.current;
          const pageIdx = drawingPageIndexRef.current;
          const svgEl = path?.ownerSVGElement;
          
          if (points.length <= 1 && path) {
            const pt = points[0] || { x: 0, y: 0 };
            path.setAttribute('d', `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} L ${(pt.x + 0.1).toFixed(1)} ${pt.y.toFixed(1)}`);
          } else if (points.length > 5 && path) {
            // Path Simplification: node reduction for performance
            const simplified = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
            
            let pathData = '';
            if (tool === 'curve') {
                // Smoothing logic for Curve tool
                pathData = `M ${simplified[0].x.toFixed(1)} ${simplified[0].y.toFixed(1)}`;
                for (let i = 1; i < simplified.length - 2; i++) {
                    const xc = (simplified[i].x + simplified[i + 1].x) / 2;
                    const yc = (simplified[i].y + simplified[i + 1].y) / 2;
                    pathData += ` Q ${simplified[i].x.toFixed(1)} ${simplified[i].y.toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
                }
                const last = simplified.length - 1;
                pathData += ` Q ${simplified[last-1].x.toFixed(1)} ${simplified[last-1].y.toFixed(1)}, ${simplified[last].x.toFixed(1)} ${simplified[last].y.toFixed(1)}`;
            } else {
                pathData = simplified.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            }
            path.setAttribute('d', pathData);
          }

          if (svgEl && updatePageHtml) {
            updatePageHtml(pageIdx, svgEl.outerHTML);
            if (path && path.id) {
              window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: path.id } }));
              
              // Auto-select newly created path
              if (setSelectedLayerId) {
                setSelectedLayerId(path.id);
                selectedLayerIdRef.current = path.id;
              }
              if (setMultiSelectedIds) {
                setMultiSelectedIds(new Set([path.id]));
                multiSelectedIdsRef.current = new Set([path.id]);
              }
              if (path) drawOverlayHighlight(path, 'selected');
            }
          }

          // Switch back to selection tool
          skipClearSelectionRef.current = true;
          setTimeout(() => {
              if (setActiveMainTool) setActiveMainTool('select');
              suppressClickRef.current = false;
          }, 100);

          drawingPathRef.current = null;
          drawingPointsRef.current = [];
          drawingPageIndexRef.current = null;
          drawingSvgRef.current = null;
          clearPenToolNodes(pageIdx);
        }
        
        return;
      }

      // Termination for Shape tools
      if (drawingShapeRef.current) {
        const shape = drawingShapeRef.current;
        const pageIdx = drawingPageIndexRef.current;
        const svgEl = shape?.ownerSVGElement;

        drawingShapeRef.current = null;
        shapeStartPointRef.current = null;
        drawingPageIndexRef.current = null;
        drawingSvgRef.current = null;

        if (svgEl && updatePageHtml) {
          updatePageHtml(pageIdx, svgEl.outerHTML);
          if (shape && shape.id) {
            window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: shape.id } }));
            if (setSelectedLayerId) {
              setSelectedLayerId(shape.id);
              selectedLayerIdRef.current = shape.id;
            }
            if (setMultiSelectedIds) {
              setMultiSelectedIds(new Set([shape.id]));
              multiSelectedIdsRef.current = new Set([shape.id]);
            }
          }
          skipClearSelectionRef.current = true;
          setTimeout(() => {
            if (setActiveMainTool) setActiveMainTool('select');
            suppressClickRef.current = false;
          }, 100);
        } else {
          setTimeout(() => {
            suppressClickRef.current = false;
          }, 100);
        }
        return;
      }

      // Termination for Marquee Selection
      if (marqueeRef.current) {
        setMarquee(null);
        if (marqueeOverlayRef1.current) marqueeOverlayRef1.current.style.display = 'none';
        if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [selectedPenTool, activeMainTool, updatePageHtml, setActiveMainTool, setSelectedLayerId]);

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
    
    // In double page mode, if we are selecting a root folder, 
    // we should try to keep both root folders in the multi-selection set.
    const newSet = id ? new Set([id]) : new Set();
    
    if (isDoublePage && id && pages.length > 0) {
      // Find the page index this ID belongs to
      const pgIdx = pages.findIndex(p => p.layers?.[0]?.id === id);
      if (pgIdx !== -1) {
        // If it's a root folder, check if its spread-mate should stay selected
        const lIdx = pgIdx % 2 === 1 ? pgIdx : pgIdx - 1;
        const rIdx = pgIdx % 2 === 1 ? pgIdx + 1 : pgIdx;
        
        if (lIdx >= 0 && lIdx < pages.length && rIdx < pages.length) {
          const rootL = pages[lIdx]?.layers?.[0]?.id;
          const rootR = pages[rIdx]?.layers?.[0]?.id;
          if (rootL) newSet.add(rootL);
          if (rootR) newSet.add(rootR);
        }
      }
    }

    multiSelectedIdsRef.current = newSet;
    setMultiSelectedIds(newSet);
  };

  const enterTextEditMode = (target) => {
    const isText = ['text', 'tspan'].includes(target.tagName.toLowerCase());
    if (isText && target.id) {
      setIsEditingText(true);
      const svgRoot = target.ownerSVGElement;
      const bbox = target.getBBox();
      const style = window.getComputedStyle(target);
      const transform = target.getAttribute('transform');
      
      // Hide original text to create illusion of editing in-place
      target.style.opacity = '0';
      target.style.visibility = 'hidden';
      
      // Create foreignObject directly inside the SVG
      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      const padX = 1; 
      const padY = 1;
      
      // Initial calculated dimensions
      const initialWidth = Math.max(bbox.width + padX * 2, 4);
      const initialHeight = Math.max(bbox.height + padY * 2, 20);
      
      const isNewCreation = target.textContent.length === 0;
      
      fo.setAttribute('x', (parseFloat(target.getAttribute('x')) || bbox.x) - padX);
      
      if (isNewCreation) {
          // For new creation, bounding box is empty, derive exact top-left from baseline 'y' manually
          fo.setAttribute('y', (parseFloat(target.getAttribute('y')) || bbox.y) - 16);
      } else {
          // For existing text, use the actual visual top (bbox.y)
          // Add a tiny -2px offset to perfectly match strict HTML line-height rendering vs SVG baseline
          fo.setAttribute('y', bbox.y - padY - 2);
      }
      
      fo.setAttribute('width', initialWidth + 100); // Leave room for growth initially
      fo.setAttribute('height', initialHeight + 50);
      if (transform) fo.setAttribute('transform', transform);
      
      // Mark it so interact.js ignores dragging while editing
      fo.setAttribute('data-editing', 'true');
      fo.style.cursor = TYPE_CURSOR;
      fo.style.overflow = 'visible';
      
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      div.className = 'text-edit-box';
      div.style.width = 'fit-content';
      div.style.minWidth = '1px';
      div.style.height = 'fit-content';
      div.style.minHeight = '1em';
      div.style.setProperty('background', 'transparent', 'important');
      div.style.setProperty('background-color', 'transparent', 'important');
      fo.style.setProperty('background', 'transparent', 'important');
      fo.style.setProperty('background-color', 'transparent', 'important');
      div.style.cursor = TYPE_CURSOR;
      div.style.userSelect = 'text';
      div.style.overflow = 'visible';
      
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
      div.style.whiteSpace = 'pre';
      div.style.wordWrap = 'normal';
      
      div.style.padding = `${padY}px ${padX}px`; 
      div.style.margin = '0';
      div.style.display = 'inline-block';
      div.style.webkitFontSmoothing = 'antialiased';
      div.style.mozOsxFontSmoothing = 'grayscale';
      
      // Alignment mapping
      const textAnchor = target.getAttribute('text-anchor') || style.textAnchor;
      if (textAnchor === 'middle') {
        div.style.textAlign = 'center';
        fo.setAttribute('x', (parseFloat(target.getAttribute('x')) || (bbox.x + bbox.width/2)) - padX);
        div.style.transform = 'translateX(-50%)';
      } else if (textAnchor === 'end') {
        div.style.textAlign = 'right';
        fo.setAttribute('x', (parseFloat(target.getAttribute('x')) || (bbox.x + bbox.width)) - padX);
        div.style.transform = 'translateX(-100%)';
      } else {
        div.style.textAlign = 'left';
      }

      // Correctly load multi-line text from tspans
      const tspans = target.querySelectorAll('tspan');
      if (tspans.length > 0) {
          div.innerText = Array.from(tspans).map(t => t.textContent).join('\n');
      } else {
          div.textContent = target.textContent;
      }
      fo.appendChild(div);
      
      // Insert in exact DOM position next to target to inherit proper z-index and scaling context
      target.parentNode.insertBefore(fo, target.nextSibling);

      // Function to sync foreignObject size to content dynamically
      const syncSize = () => {
          // Inside foreignObject, 1 CSS pixel matches 1 SVG user unit
          // scrollWidth/Height gives us the content size without browser zoom scaling issues
          const w = Math.max(div.scrollWidth, 10);
          const h = Math.max(div.scrollHeight, 20);
          
          fo.setAttribute('width', w + 40); // Breathing room for the caret and outline
          fo.setAttribute('height', h + 20);
      };

      div.addEventListener('input', syncSize);

      // Timeout ensures the browser paints 'contenteditable' and can focus
      setTimeout(() => {
        div.focus();
        syncSize();
        
        // Select all text natively if it's not a new creation
        if (target.textContent.length > 0) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(div);
            selection.removeAllRanges();
            selection.addRange(range);
        }
      }, 0);

      const initialInnerHTML = target.innerHTML;
      
      const cleanup = () => {
        setIsEditingText(false);
        target.style.removeProperty('opacity');
        target.style.removeProperty('visibility');
        if (target.getAttribute('style') === '') target.removeAttribute('style');
        
        div.removeEventListener('blur', handleBlur);
        div.removeEventListener('keydown', handleKeyDown);
        div.removeEventListener('input', syncSize);
        
        if (fo.parentNode) {
          fo.parentNode.removeChild(fo);
        }
        
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      };

      const handleBlur = () => {
        const finalContent = div.innerText.trim();
        // If the content is empty, remove the layer.
        if (finalContent.length === 0) {
          if (target.parentNode) {
            target.parentNode.removeChild(target);
          }
          cleanup();
          
          if (setSelectedLayerId) {
            setSelectedLayerId(null);
            selectedLayerIdRef.current = null;
            if (setMultiSelectedIds) {
              setMultiSelectedIds(new Set());
              multiSelectedIdsRef.current = new Set();
            }
          }

          const container = target.closest('.page-svg-container');
          if (container) {
            const pageIdx = parseInt(container.getAttribute('data-page-index'));
            saveModifiedPageHtml(pageIdx, svgRoot);
          }
          return;
        }

        // Handle multi-line conversion
        // Trim only the very end to remove the phantom newline added by contenteditable
        const lines = div.innerText.trimEnd().split(/\r?\n/);
        target.innerHTML = '';
        const x = target.getAttribute('x') || '0';
        
        lines.forEach((line, i) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.textContent = line || '\u00A0';
          tspan.setAttribute('x', x);
          if (i > 0) tspan.setAttribute('dy', '1.2em');
          target.appendChild(tspan);
        });

        cleanup();
        
        // Auto-select and redraw highlight after exit
        if (target.id) {
            if (setSelectedLayerId) setSelectedLayerId(target.id);
            selectedLayerIdRef.current = target.id;
            if (setMultiSelectedIds) {
                setMultiSelectedIds(new Set([target.id]));
                multiSelectedIdsRef.current = new Set([target.id]);
            }
            drawOverlayHighlight(target, 'selected');
        }
        
        const container = target.closest('.page-svg-container');
        if (container) {
          const pageIdx = parseInt(container.getAttribute('data-page-index'));
          saveModifiedPageHtml(pageIdx, svgRoot);
        }
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Check if it's empty - if so, blur to remove
            if (div.innerText.trim() === '') {
                e.preventDefault();
                div.blur();
            }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          target.innerHTML = initialInnerHTML;
          if (target.textContent.trim().length === 0) {
             if (target.parentNode) target.parentNode.removeChild(target);
          }
          cleanup();
        }
      };

      div.addEventListener('blur', handleBlur);
      div.addEventListener('keydown', handleKeyDown);
    }
  };

  // ── FIGMA-STYLE CLICK: hierarchical frame drill-down selection ─────────────────
  const handleSvgClick = (e) => {
    if (e.target.closest('.resize-handle')) return;
    
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLast = now - lastClickRef.current.time;
    // 500ms is a safe standard double click threshold
    const isDoubleClick = timeSinceLast > 0 && timeSinceLast < 500;
    lastClickRef.current.time = now;

    if (isDoubleClick) {
      if (activeMainTool === 'pen' && selectedPenTool === 'pen' && drawingPathRef.current) {
         // Finish pen path on double click
         const path = drawingPathRef.current;
         const pageIdx = drawingPageIndexRef.current;
         const svgEl = path.ownerSVGElement;
         
         drawingPathRef.current = null;
         drawingPointsRef.current = [];
         drawingPageIndexRef.current = null;
         drawingSvgRef.current = null;
         
         if (svgEl && updatePageHtml) {
             updatePageHtml(pageIdx, svgEl.outerHTML);
             if (path && path.id) {
                 window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: path.id } }));
                 
                 // Auto-select
                 if (setSelectedLayerId) {
                    setSelectedLayerId(path.id);
                    selectedLayerIdRef.current = path.id;
                    drawOverlayHighlight(path, 'selected');
                 }
             }
         }
         
         // Switch tool
         skipClearSelectionRef.current = true;
         setTimeout(() => {
             // if (setActiveMainTool) setActiveMainTool('select');

             suppressClickRef.current = false;
         }, 100);
         return;
      }
      handleSvgDoubleClick(e);
      return;
    }

    // ── Update Active Page on Click ─────────────────────────────────────────
    const container = e.currentTarget.closest('.page-svg-container');
    if (container) {
      const pageIdx = parseInt(container.getAttribute('data-page-index'));
      if (!isNaN(pageIdx) && setActivePageIndex && activePageIndex !== pageIdx) {
        setActivePageIndex(pageIdx);
      }
    }


    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const svg = container.querySelector('svg');
    if (!svg) return;

    // Clear hover states immediately on click to prevent overlapping outlines
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── Creation Tool: Text (Type) Tool logic removed (moved to mousedown) ──────


    // ── CLICK-OUTSIDE-PREVENTION (if in tools like pen/shapes but not typing) ───
    const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
    const isDrawingTool = activeMainTool === 'pen' || activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload', 'type'].includes(activeMainTool);
    const allowClick = isSelectionTool || (isDrawingTool && pageIdx !== activePageIndex);

    if (!allowClick && !getDraggableElement(e.target, e.currentTarget)) {
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
    const topFrames = getTopLevelFrames(svg);
    const hitRoot = topFrames.find(f => hitTest(f, e.clientX, e.clientY));

    if (isDoublePage && hitRoot) {
        // Always enter the context of the page we click, even if another was entered
        effectiveFrameId = hitRoot.id;
        if (frameId !== hitRoot.id) {
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
          // Check if we hit a non-frame element (text, shape, path) inside this entered frame
          let target = getDraggableElement(e.target, e.currentTarget);
          
          if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
              const polySelectionId = e.target.id.replace('overlay-poly-selected-', '').replace('overlay-poly-child-selected-', '').replace('overlay-poly-hover-', '');
              const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
              if (underlyingEl) target = underlyingEl;
          }

          if (target && target !== frameEl && frameEl.contains(target)) {
            setSingleSelection(target.id);
            return;
          }

          // 1. STICKY SELECTION PRIORITY: If clicking near the already-selected element, keep it selected!
          const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
          if (activeSel && frameEl.contains(activeSel) && hitTest(activeSel, e.clientX, e.clientY, 15)) {
              setSingleSelection(activeSel.id);
              return;
          }

          // 2. Fallback: hit testing to catch clicks between text letters or transparent shape bounds
          const normalElements = Array.from(frameEl.children).filter(el => 
             el.id && el.getAttribute('data-type') !== 'frame' &&
             el.getAttribute('data-name') !== 'Overlay' &&
             el.getAttribute('data-hidden') !== 'true'
          );
          for (let i = normalElements.length - 1; i >= 0; i--) {
             if (hitTest(normalElements[i], e.clientX, e.clientY, 5)) {
                 setSingleSelection(normalElements[i].id);
                 return;
             }
          }

          // ── Clicked the entered frame's empty gap → behavior depends on level
          const topFrames = getTopLevelFrames(svg);
          const isRootFolder = topFrames.some(f => f.id === frameId);

          if (isRootFolder) {
            // ── Root Folder Gap (Canvas Background): Deselect everything
            setSingleSelection(null);
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
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
          // Always enter the top level frame immediately upon click (handles both single and double page spreads cleanly)
          setCurrentFrameId(hitTopFrame.id);
          currentFrameIdRef.current = hitTopFrame.id;
        } else {
          // Hit nothing? Deselect everything
          setSingleSelection(null);
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
      // Check if we hit an element inside this frame directly (lifted out of selId check to capture any hit!)
      let target = getDraggableElement(e.target, e.currentTarget);
      
      if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
          const polySelectionId = e.target.id.replace('overlay-poly-selected-', '').replace('overlay-poly-child-selected-', '').replace('overlay-poly-hover-', '');
          const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
          if (underlyingEl) target = underlyingEl;
      }

      if (target && target !== hitFrame && hitFrame.contains(target)) {
          setCurrentFrameId(hitFrame.id);
          currentFrameIdRef.current = hitFrame.id;
          setSingleSelection(target.id);
          return;
      }

      // STICKY SELECTION PRIORITY (Case 2)
      const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
      if (activeSel && hitFrame.contains(activeSel) && hitTest(activeSel, e.clientX, e.clientY, 15)) {
          setCurrentFrameId(hitFrame.id);
          currentFrameIdRef.current = hitFrame.id;
          setSingleSelection(activeSel.id);
          return;
      }

      // Hit testing fallback for elements within hitFrame (text gaps)
      const normalEls = Array.from(hitFrame.children).filter(el => 
         el.id && el.getAttribute('data-type') !== 'frame' &&
         el.getAttribute('data-name') !== 'Overlay' &&
         el.getAttribute('data-hidden') !== 'true'
      );
      for (let i = normalEls.length - 1; i >= 0; i--) {
         if (hitTest(normalEls[i], e.clientX, e.clientY, 5)) {
             setCurrentFrameId(hitFrame.id);
             currentFrameIdRef.current = hitFrame.id;
             setSingleSelection(normalEls[i].id);
             return;
         }
      }

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
      // 2. Clicked canvas background — deselect everything
      setSingleSelection(null);
      setCurrentFrameId(null);
      currentFrameIdRef.current = null;
    }
  };

  // ── FIGMA-STYLE DOUBLE CLICK: enter frame / edit text ─────────────────────────
  const handleSvgDoubleClick = (e) => {
    e.stopPropagation();
    // Intentionally ignore suppressClickRef here so that micro-jitters during double-clicks don't abort text editing!

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Text editing on double-click
    // 1. First check if we directly hit text
    let target = getDraggableElement(e.target, e.currentTarget);
    
    // 2. Proactively check if we are double-clicking while a text is selected
    const selIdContext = selectedLayerIdRef.current;
    if (selIdContext && (!target || !['text', 'tspan'].includes(target.tagName?.toLowerCase()))) {
        let activeSelEls = svg.querySelectorAll(`[id="${selIdContext}"]`);
        // If there are duplicates due to temporary template saving leaks, find the visible one
        const activeSelEl = Array.from(activeSelEls).find(el => el.getBoundingClientRect().width > 0) || activeSelEls[0];
        
        if (activeSelEl && ['text', 'tspan'].includes(activeSelEl.tagName.toLowerCase())) {
            // Bypass strict hitTest if the target was the overlay polygon (meaning they clicked inside the blue box exactly)
            const clickedPolygon = e.target.tagName.toLowerCase() === 'polygon';
            if (clickedPolygon || hitTest(activeSelEl, e.clientX, e.clientY, 10)) {
                target = activeSelEl; 
            }
        }
    }

    if (!target) {
        // If in curve tool, check for double click on a node to toggle corner/smooth
        if (activeMainTool === 'pen' && selectedPenTool === 'curve' && drawingPathRef.current) {
            const svgEl = svg;
            const containerBox = container.getBoundingClientRect();
            const scale = zoom / 100;
            const pt = getSvgPoint(svgEl, e.clientX, e.clientY);
            
            const points = drawingPointsRef.current;
            const hitIdx = points.findIndex(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 10 / scale);
            if (hitIdx !== -1) {
                points[hitIdx].isCorner = !points[hitIdx].isCorner;
                drawingPathRef.current.setAttribute('d', generatePathData(points, false, 'curve'));
                drawPenToolNodes(activePageIndex, drawingPathRef.current.parentNode, points);
                return;
            }
        }
        return;
    }

    const isText = ['text', 'tspan'].includes(target.tagName.toLowerCase());
    if (isText && target.id) {
      enterTextEditMode(target);
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
      if (activePageIndex <= 0) return;
      if (activePageIndex === 1 || activePageIndex === 2) {
        setActivePageIndex(0);
        return;
      }
      // Jump to the start of the previous spread
      const currentSpreadStart = activePageIndex % 2 === 0 ? activePageIndex - 1 : activePageIndex;
      setActivePageIndex(Math.max(1, currentSpreadStart - 2));
    } else {
      setActivePageIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (isDoublePage) {
      if (activePageIndex === 0) {
        if (pages.length > 1) setActivePageIndex(1);
        return;
      }
      
      // Jump to the start of the next spread/page after the current spread
      const currentSpreadStart = activePageIndex % 2 === 0 ? activePageIndex - 1 : activePageIndex;
      const nextIdx = currentSpreadStart + 2;
      
      if (nextIdx < pages.length) {
        setActivePageIndex(nextIdx);
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
    if (setOpenMenuIndex) setOpenMenuIndex(null);
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
          const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
          if (ids.length === 0) return false;

          // Collect all "Base" (Root Frame or Background Overlay) IDs across all visible containers
          // (Handles both single and double-page spread selections)
          const baseIds = new Set();
          document.querySelectorAll('.page-svg-container svg').forEach(svg => {
            const topLevelFrames = getTopLevelFrames(svg);
            topLevelFrames.forEach(frame => {
              baseIds.add(frame.id);
              const overlay = frame.querySelector('[data-name="Overlay"]');
              if (overlay) baseIds.add(overlay.id);
            });
          });

          // Enable tools ONLY if at least one selected ID is NOT a base/root frame
          return ids.some(id => id && !baseIds.has(id));
        })()}
      />
      <div 
        className="flex-1 relative flex items-center justify-center p-[1vw] overflow-hidden bg-[#FBFBFB]"
        onClick={(e) => {
          // ── Background Click: Deselect everything ─────────────────
          const container = e.target.closest('.page-svg-container');
          const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
          
          if (setActivePageIndex && activePageIndex !== pageIdx) {
            setActivePageIndex(pageIdx);
          }

          if (setSelectedLayerId) {
            setSelectedLayerId(null);
            setMultiSelectedIds(new Set());
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSelectOptions(!showSelectOptions);
                  setShowPenOptions(false);
                  setShowShapesOptions(false);
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPenOptions(!showPenOptions);
                  setShowSelectOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('pen');
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowShapesOptions(!showShapesOptions);
                  setShowSelectOptions(false);
                  setShowPenOptions(false);
                  setActiveMainTool('shapes');
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
            {pages.length > 0 && (isDoublePage ? (spreadStartIndex > 0 && pages[spreadStartIndex]) : pages[activePageIndex]) && (

              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top) */}
                {((isDoublePage ? spreadStartIndex : activePageIndex) === activePageIndex) && (
                <div className="absolute top-[-2.5vw] z-30" style={{ [isCurrentlySpread ? 'left' : 'right']: '0vw' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const displayIdx = isDoublePage ? spreadStartIndex : activePageIndex;
                      setOpenMenuIndex(openMenuIndex === displayIdx ? null : displayIdx);
                    }}

                    className={`cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200`}
                  >
                    <Icon icon={isCurrentlySpread ? "ri:menu-fold-4-fill" : "ri:menu-unfold-4-fill"} width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {(() => {
                      const displayIdx = isDoublePage ? spreadStartIndex : activePageIndex;
                      return openMenuIndex === displayIdx && (

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
                      );
                    })()}
                  </AnimatePresence>
                </div>
                )}

                {/* A4 Canvas Page 1 Inner */}
                <div 
                  className={`relative z-0 flex flex-col overflow-hidden bg-white group/inner transition-all duration-300 ${isDoublePage && spreadStartIndex === activePageIndex ? 'active-page-outline' : ''}`}
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className={`flex-1 w-full relative page-svg-container tool-${selectedSelectTool} ${(activeMainTool === 'pen' && selectedPenTool === 'pencil' && (isDoublePage ? spreadStartIndex : activePageIndex) === activePageIndex) ? 'pencil-mode' : ''} ${(activeMainTool === 'pen' && ['pen', 'curve'].includes(selectedPenTool) && (isDoublePage ? spreadStartIndex : activePageIndex) === activePageIndex) ? 'pen-mode' : ''} ${(activeMainTool === 'shapes' && (isDoublePage ? spreadStartIndex : activePageIndex) === activePageIndex) ? 'shape-mode' : ''} ${(activeMainTool === 'type' && (isDoublePage ? spreadStartIndex : activePageIndex) === activePageIndex) ? 'type-mode' : ''}`} data-page-index={isDoublePage ? spreadStartIndex : activePageIndex}>
                    <style>{svgGlobalStyles}</style>
                    {(() => {
                        const displayIndex = isDoublePage ? spreadStartIndex : activePageIndex;
                        const isShapeActive = activeMainTool === 'shapes' && displayIndex === activePageIndex;
                        const isPencilActive = activeMainTool === 'pen' && selectedPenTool === 'pencil' && displayIndex === activePageIndex;
                        const isPenToolActive = activeMainTool === 'pen' && displayIndex === activePageIndex;
                        const isTypeActive = activeMainTool === 'type' && displayIndex === activePageIndex;

                        return pages[displayIndex]?.html ? (
                        <div 
                          className="absolute inset-0 w-full h-full overflow-visible flex items-center justify-center bg-white"
                          style={{ cursor: isEditingText ? 'text' : (isPencilActive ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')))) }}
                        >
                         <div 
                           className="w-full h-full flex items-center justify-center"
                           dangerouslySetInnerHTML={{ __html: pages[displayIndex]?.html }}
                           onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                           onMouseMove={(e) => handleSvgMouseMove(displayIndex, e)}
                           onMouseLeave={handleSvgMouseLeave}
                           onClick={handleSvgClick}
                           // onDoubleClick={handleSvgDoubleClick} // replaced by manual detection in handleSvgClick
                           onContextMenu={(e) => handleSvgContextMenu(displayIndex, e)}
                         />
                         {/* Selection Overlay (Overlay rotated element perfectly) */}
                         <svg 
                           id={`highlight-overlay-${displayIndex}`}
                           className="absolute inset-0 w-full h-full selection-overlay-layer" style={{ overflow: 'visible', pointerEvents: 'none' }}
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
                        {displayIndex === activePageIndex && (
                          <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                        )}
                      </div>
                    );
                    })()}


                    {/* Simple Click-to-Open Gallery Overlay for empty pages */}
                    {(() => {
                      const displayIndex = isDoublePage ? spreadStartIndex : activePageIndex;
                      return !pages[displayIndex]?.html && displayIndex === activePageIndex && (
                        <div 
                          className="absolute inset-0 z-10"
                          onClick={() => onOpenTemplateModal(displayIndex)}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      );
                    })()}

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
                {((activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex) && (
                <div className="absolute top-[-2.5vw] right-0 z-30">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const displayIndex = activePageIndex === 0 ? 0 : spreadStartIndex + 1;
                      setOpenMenuIndex(openMenuIndex === displayIndex ? null : displayIndex);
                    }}

                    className="cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200"
                  >
                    <Icon icon="ri:menu-unfold-4-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : spreadStartIndex + 1;
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
                )}

                {/* A4 Canvas Page 2 Inner */}
                <div 
                  className={`relative z-0 flex flex-col overflow-hidden bg-white group/inner transition-all duration-300 ${(activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex ? 'active-page-outline' : ''}`}
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className={`flex-1 w-full relative page-svg-container tool-${selectedSelectTool} ${(activeMainTool === 'pen' && selectedPenTool === 'pencil' && (activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex) ? 'pencil-mode' : ''} ${(activeMainTool === 'pen' && ['pen', 'curve'].includes(selectedPenTool) && (activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex) ? 'pen-mode' : ''} ${(activeMainTool === 'shapes' && (activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex) ? 'shape-mode' : ''} ${(activeMainTool === 'type' && (activePageIndex === 0 ? 0 : spreadStartIndex + 1) === activePageIndex) ? 'type-mode' : ''}`} data-page-index={activePageIndex === 0 ? 0 : spreadStartIndex + 1}>

                    <style>{svgGlobalStyles}</style>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : spreadStartIndex + 1;
                      const page = pages[displayIndex];
                      const isShapeActive = activeMainTool === 'shapes' && displayIndex === activePageIndex;
                      const isPenToolActive = activeMainTool === 'pen' && displayIndex === activePageIndex;
                      const isTypeActive = activeMainTool === 'type' && displayIndex === activePageIndex;


                      return page?.html ? (
                        <div
                          className="absolute inset-0 w-full h-full overflow-visible flex items-center justify-center bg-white"
                          style={{ cursor: isEditingText ? 'text' : ((activeMainTool === 'pen' && selectedPenTool === 'pencil') ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')))) }}
                        >
                           <div
                             className="w-full h-full flex items-center justify-center"
                             dangerouslySetInnerHTML={{ __html: page.html }}
                             onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                             onMouseMove={(e) => handleSvgMouseMove(displayIndex, e)}
                             onMouseLeave={handleSvgMouseLeave}
                             onClick={handleSvgClick}
                             // onDoubleClick={handleSvgDoubleClick} // replaced by manual detection in handleSvgClick
                             onContextMenu={(e) => handleSvgContextMenu(displayIndex, e)}
                           />
                           {/* Selection Overlay (Overlay rotated element perfectly) */}
                           <svg 
                             id={`highlight-overlay-${displayIndex}`}
                             className="absolute inset-0 w-full h-full selection-overlay-layer" style={{ overflow: 'visible', pointerEvents: 'none' }}
                           />
                           
                           {/* HTML Overlay for Resize Handles (Clickable) */}
                           <div 
                             id={`highlight-overlay-html-${displayIndex}`}
                             className="absolute inset-0 w-full h-full" style={{ overflow: 'visible', pointerEvents: 'none' }}
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
                            {displayIndex === activePageIndex && (
                              <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                            )}
                          </div>
                          {/* Click Overlay to open gallery */}
                          {displayIndex === activePageIndex && (
                            <div 
                              className="absolute inset-0 cursor-pointer z-10"
                              onClick={() => onOpenTemplateModal(displayIndex)}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          )}
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
              ? (activePageIndex === 0 ? pages.length <= 1 : (isCurrentlySpread ? spreadStartIndex + 2 >= pages.length : spreadStartIndex + 1 >= pages.length)) 
              : activePageIndex + 1 >= pages.length
            }
            onClick={handleNextPage}
            className={`absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw] ${ 
              (isDoublePage 
                ? (activePageIndex === 0 ? pages.length <= 1 : (isCurrentlySpread ? spreadStartIndex + 2 >= pages.length : spreadStartIndex + 1 >= pages.length)) 
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
