import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import usePreventBrowserZoom from '../../hooks/usePreventBrowserZoom';

import paper from 'paper';
import {
  makeNode,
  makePath,
  loadDIntoVectraSession,
  usePenNodeEngine
} from './penTool';

import { CropController } from './properties/Crop';


import CanvasRuler from './CanvasRuler';
import GuidesOverlay from './GuidesOverlay';
import TopToolbar from './TopToolbar';
import {
  getVisualBBox,
  getCanvasBounds,
  clearOverlayType
} from './mainEditor/geometryUtils';
import { isElementHidden, purgeElementOverlays } from './mainEditor/selectionOverlays/overlayDomUtils';
import { useSlideshowManager } from './mainEditor/useSlideshowManager';
import { useVideoControls } from './mainEditor/useVideoControls';
import { useSelectionOverlays } from './mainEditor/useSelectionOverlays';
import { useInteractEngine } from './mainEditor/useInteractEngine';
import { convertTextToForeignObject } from './mainEditor/textConversionUtils';
// Encapsulated in useCanvasPointerEvents
import { useCanvasZoomPan } from './mainEditor/useCanvasZoomPan';
import { alignSelectedElements } from './mainEditor/alignmentUtils';
import { useCanvasTransforms } from './mainEditor/useCanvasTransforms';
import { useCanvasAssetInsertion } from './mainEditor/useCanvasAssetInsertion';
import { useCanvasKeyboardShortcuts } from './mainEditor/useCanvasKeyboardShortcuts';
import { useCanvasDOMOverlays } from './mainEditor/useCanvasDOMOverlays';
import { useCanvasContextMenuAndBadges } from './mainEditor/useCanvasContextMenuAndBadges';
import { useCanvasPointerEvents } from './mainEditor/useCanvasPointerEvents';
import { CanvasViewport } from './mainEditor/CanvasViewport';
import { FloatingToolbars } from './mainEditor/FloatingToolbars';
import { getTopLevelFrames, hitTest as hitTestExt } from './mainEditor/frameHierarchyUtils';
import { PageNavigationControls } from './mainEditor/PageNavigationControls';
import { applyTrimViewToSvg, cleanTrimViewFromHtml, isElementCompletelyOutside } from './mainEditor/trimViewUtils';

// Re-export geometry utilities for backward compatibility with external components


const MainEditor = ({
  isPdfProject,
  isRulerEnabled = true,
  isTrimView = false,
  pages = [],
  activePageIndex,
  setActivePageIndex,
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
  setActiveMainTool,
  activeTopTool,
  setActiveTopTool,
  updateElementAttribute,
  flipbookDimensions = null,
  isPopupEditor = false
}) => {
  usePreventBrowserZoom();const { width: baseWidth, height: baseHeight } = flipbookDimensions || { width: 210, height: 297 };
  const canvasAspectRatio = baseWidth && baseHeight ? `${baseWidth} / ${baseHeight}` : '210 / 297';

  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesOptions, setShowShapesOptions] = useState(false);
  const [localTrimView, setLocalTrimView] = useState(isTrimView);

  useEffect(() => {
    setLocalTrimView(isTrimView);
  }, [isTrimView]);

  useEffect(() => {
    const handleToggleTrim = (e) => {
      if (e.detail !== undefined) {
        setLocalTrimView(e.detail);
      } else {
        setLocalTrimView(prev => !prev);
      }
    };
    window.addEventListener('editor_toggleTrimView', handleToggleTrim);
    return () => window.removeEventListener('editor_toggleTrimView', handleToggleTrim);
  }, []);

  // Robustly ensure multi-selection dotted outlines are removed when selection is no longer multiple
  useEffect(() => {
    if (multiSelectedIds && multiSelectedIds.size <= 1) {
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    }
  }, [multiSelectedIds]);
  // isEditingText is now managed via isEditingTextRef to prevent React re-renders from destroying the edit box

  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [showHotspotPopup, setShowHotspotPopup] = useState(false);
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [zoom, setZoom] = useState(90);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which page's menu is open


  const isConvertedFlipbook = Boolean(isPdfProject || (pages && pages.some(p => p.html && (p.html.includes('PDF Background') || p.html.includes('pdf-vector-layer') || p.html.includes('Document Shield')))));

  const pdfDefaultsSetRef = useRef(false);
  useEffect(() => {
    if (isConvertedFlipbook) {
      if (!pdfDefaultsSetRef.current) {
        if (setActiveTopTool) setActiveTopTool('interaction');
        pdfDefaultsSetRef.current = true;
      }
      if (marqueeOverlayRef1.current) {
        marqueeOverlayRef1.current.style.display = 'none';
        const rect = marqueeOverlayRef1.current.querySelector?.('rect');
        if (rect) {
          rect.setAttribute('x', '0');
          rect.setAttribute('y', '0');
          rect.setAttribute('width', '0');
          rect.setAttribute('height', '0');
        }
      }
      if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
      { const sb = document.getElementById('marquee-screen-box'); if (sb) sb.style.display = 'none'; }
      if (multiSelectedIds && multiSelectedIds.size > 0 && setMultiSelectedIds) {
        setMultiSelectedIds(new Set());
      }
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
      const boundsPoly = document.getElementById('overlay-poly-selected-multi-selection-bounds');
      if (boundsPoly) boundsPoly.remove();
    }
  }, [isConvertedFlipbook, setActiveTopTool]);

  // ── Refs ─────────────────────────────────────────────────────────────
  const isCtrlPressedRef = useRef(false);
  const currentFrameIdRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeOverlayRef1 = useRef(null);
  const marqueeOverlayRef2 = useRef(null);
  const marqueeCandidatesRef = useRef([]);
  const marqueeDataRef = useRef(null);
  const multiSelectedIdsRef = useRef(new Set());
  const selectedLayerIdRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);
  const lastWheelTimeRef = useRef(0);       // ← tracks last Ctrl+scroll time to suppress spurious clicks
  const wasRecentlyPanningRef = useRef(false); // ← tracks recent Space pan to suppress spurious clicks
  const isAltPressedRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0, target: null });
  const drawMeasurementOverlayRef = useRef(null);
  const activeMainToolRef = useRef(activeMainTool);
  const activeTopToolRef = useRef(activeTopTool);
  const selectedSelectToolRef = useRef(selectedSelectTool);
  const isSpaceDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const currentPanRef = useRef({ x: 0, y: 0 });
  const currentZoomRef = useRef(90);
  const wheelRafRef = useRef(null);
  const zoomContainerRef = useRef(null);
  const selectedPenToolRef = useRef(selectedPenTool);
  const drawingShapeRef = useRef(null);
  const shapeStartPointRef = useRef(null);
  const skipClearSelectionRef = useRef(false);
  const lastClickRef = useRef({ time: 0, target: null });
  const updatePageHtmlRef = useRef(updatePageHtml);
  const editorContainerRef = useRef(null);
  const isEditingTextRef = useRef(false);
  const drawOverlayHighlightRef = useRef(null); // Stable ref, populated after useSelectionOverlays
  const nodeEditModeRef = useRef(false);    // Stable early ref, also returned by usePenNodeEngine
  const clearMeasurementOverlayRef = useRef(null); // Stable ref, populated after useSelectionOverlays




  useEffect(() => {
    activeTopToolRef.current = activeTopTool;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') {
      if (marqueeOverlayRef1.current) {
        marqueeOverlayRef1.current.style.display = 'none';
        const rect = marqueeOverlayRef1.current.querySelector?.('rect');
        if (rect) {
          rect.setAttribute('x', '0');
          rect.setAttribute('y', '0');
          rect.setAttribute('width', '0');
          rect.setAttribute('height', '0');
        }
      }
      if (marqueeOverlayRef2.current) marqueeOverlayRef2.current.style.display = 'none';
      { const sb = document.getElementById('marquee-screen-box'); if (sb) sb.style.display = 'none'; }
      if (marqueeDataRef.current) marqueeDataRef.current = null;
      marqueeRef.current = null;
      setMarquee(null);
      if (multiSelectedIds && multiSelectedIds.size > 1 && setMultiSelectedIds) {
        setMultiSelectedIds(new Set(selectedLayerId ? [selectedLayerId] : []));
      }
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
      const boundsPoly = document.getElementById('overlay-poly-selected-multi-selection-bounds');
      if (boundsPoly) boundsPoly.remove();
    } else {
      // In normal edit mode: deselect any Free Frame immediately
      if (selectedLayerId) {
        const selEl = document.getElementById(selectedLayerId);
        const isFreeFrame = selEl ? (
          selEl.getAttribute('data-name') === 'Free Frame' ||
          selEl.getAttribute('data-type') === 'free-frame' ||
          (selEl.id && selEl.id.startsWith('free-frame'))
        ) : selectedLayerId.startsWith('free-frame');
        if (isFreeFrame) {
          if (setSelectedLayerId) setSelectedLayerId(null);
          selectedLayerIdRef.current = null;
          if (setMultiSelectedIds) setMultiSelectedIds(new Set());
          multiSelectedIdsRef.current = new Set();
          document.querySelectorAll('.selection-overlay-layer polygon, .selection-overlay-layer g, .selection-overlay-layer circle').forEach(el => el.remove());
        }
      }
    }
  }, [activeTopTool, selectedLayerId, multiSelectedIds, setMultiSelectedIds]);

  useEffect(() => {
    paperScopeRef.current = new paper.PaperScope();
    paperScopeRef.current.setup(document.createElement('canvas'));

    const handleKeyDown = (e) => {
      // 1. Skip shortcuts if user is typing
      if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        isEditingTextRef.current ||
        document.activeElement.isContentEditable) return;

      const key = e.key.toLowerCase();

      // ── Restrict shortcuts in non-editor modes ─────────────────
      if (activeTopTool !== 'editor') {
        const isSelectionKey = key === 'v' || key === 'a' || key === ' ';
        if (!isSelectionKey) return;
      }

      // ── Spacebar Pan ─────────────
      if (key === ' ' && !isSpaceDownRef.current) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || isEditingTextRef.current || document.activeElement.isContentEditable) return;
        e.preventDefault();
        // Blur any focused interactive element (buttons, etc.) so Space doesn't
        // re-trigger their click action on keyup.
        const active = document.activeElement;
        if (active && active !== document.body && typeof active.blur === 'function') {
          active.blur();
        }
        isSpaceDownRef.current = true;
        setIsSpaceDown(true);
      }

      // ── Tool Shortcuts ─────────────
      // V for selection
      if (key === 'v' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('select');
        setSelectedSelectTool('select');
        closeAllDropdowns();
      }

      // A for direct tool
      if (key === 'a' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('select');
        setSelectedSelectTool('direct');
        closeAllDropdowns();
      }

      // P or Shift+P for pen tool
      if (key === 'p' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setActiveMainTool('pen');
        if (e.shiftKey) {
          setSelectedPenTool('pencil');
        } else {
          setSelectedPenTool('pen');
        }
        closeAllDropdowns();
      }

      // ── Ctrl detection ──
      if (e.key === 'Control' && !isCtrlPressedRef.current) {
        isCtrlPressedRef.current = true;
      }

      if (e.key === 'Alt') {
        e.preventDefault();
        if (!isAltPressedRef.current) {
          isAltPressedRef.current = true;
          document.querySelectorAll('.overlay-type-hover, .overlay-type-child-hover').forEach(el => el.remove());
          if (lastMousePosRef.current && drawMeasurementOverlayRef.current) {
            let currentTarget = lastMousePosRef.current.target;
            // If the SVG re-rendered, the old target might be detached from the DOM.
            // Get the fresh element currently at the mouse coordinates.
            if (currentTarget && !document.contains(currentTarget)) {
              currentTarget = document.elementFromPoint(lastMousePosRef.current.x, lastMousePosRef.current.y) || currentTarget;
              lastMousePosRef.current.target = currentTarget;
            }
            drawMeasurementOverlayRef.current(currentTarget);
          }
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        isSpaceDownRef.current = false;
        setIsSpaceDown(false);
        isPanningRef.current = false;
      }
      if (e.key === 'Control') {
        isCtrlPressedRef.current = false;
      }
      if (e.key === 'Alt') {
        e.preventDefault();
        isAltPressedRef.current = false;
        document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
      }
    };

    const handleWindowBlur = () => {
      isAltPressedRef.current = false;
      document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
    };

    // Use capture phase so our Space handler fires BEFORE the focused button's
    // native Space-activates-button handler — ensuring preventDefault() works.
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    // Cleanup to prevent leaks
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeTopTool]);

  const saveModifiedPageHtml = (targetPageIndex, targetSvg) => {
    if (!updatePageHtmlRef.current) return;
    window.__skipCanvasUpdateForPage = targetPageIndex;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = targetSvg.outerHTML;
    tempDiv.querySelectorAll('.slideshow-transition-clone').forEach(el => el.remove());
    cleanTrimViewFromHtml(tempDiv);
    let finalHtml = tempDiv.innerHTML;
    finalHtml = finalHtml
      .replace(/<\s*br[^>]*>(?:<\/\s*br\s*>)?/gi, '<br/>')
      .replace(/<\/\s*br\s*>/gi, '');
    if (updatePageHtmlRef.current) {
      updatePageHtmlRef.current(targetPageIndex, finalHtml);
    } else if (typeof updatePageHtml === 'function') {
      updatePageHtml(targetPageIndex, finalHtml);
    }
  };

  // ── Modular Hook Calls: Slideshow & Custom Video Controls ──
  useSlideshowManager();
  useVideoControls({ setSelectedLayerId, activePageIndex, updateElementAttribute });


  // ── Modular Hook Call: Canvas DOM Overlays & Visual Observers ──
  useCanvasDOMOverlays({ activePageIndex });

  // ── Modular Hook Call: External Asset & Media Insertion Engine ──
  useCanvasAssetInsertion({
    pages,
    activePageIndex,
    baseWidth,
    baseHeight,
    updatePageHtml,
    saveModifiedPageHtml,
    setSelectedLayerId,
    setMultiSelectedIds,
    setActiveMainTool,
    setActiveTopTool,
    drawOverlayHighlight: (...args) => drawOverlayHighlightRef.current?.(...args),
    currentFrameIdRef,
    setCurrentFrameId,
    selectedLayerIdRef,
    multiSelectedIdsRef
  });

  // ── Marquee Selection State ───────────────────────────────────────────────
  const [marquee, setMarquee] = useState(null); // { pageIndex }

  useEffect(() => { marqueeRef.current = marquee; }, [marquee]);

  const handleRotateRef = useRef(null);

  // ── Modular Hook Call: Figma-Style Selection Overlays & Highlighting ──
  const {
    syncMultiSelectionBox,
    drawMultiSelectionHighlight,
    drawOverlayHighlight,
    clearMeasurementOverlay
  } = useSelectionOverlays({
    zoom,
    activePageIndex,
    baseWidth,
    baseHeight,
    isAltPressedRef,
    nodeEditModeRef,
    activeTopToolRef,
    isEditingTextRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    drawMeasurementOverlayRef,
    setActiveTopTool,
    updateElementAttribute,
    handleRotateRef
  });

  // Populate stable refs so hooks initialized before useSelectionOverlays can call them via wrappers
  drawOverlayHighlightRef.current = drawOverlayHighlight;
  clearMeasurementOverlayRef.current = clearMeasurementOverlay;

  // ── Modular Hook Call: Canvas Element Transformations (Rotate & Flip) ──
  const {
    rotation,
    handleRotate,
    handleFlip
  } = useCanvasTransforms({
    selectedLayerId,
    multiSelectedIds,
    activePageIndex,
    currentFrameId,
    updatePageHtml,
    drawOverlayHighlight,
    drawMultiSelectionHighlight
  });

  handleRotateRef.current = handleRotate;


  // ── Modular Hook Call: Canvas Context Menu & Interaction Badges ──
  const { handleSvgContextMenu } = useCanvasContextMenuAndBadges({
    activeTopTool,
    isConvertedFlipbook,
    currentFrameIdRef,
    selectedLayerId,
    setSelectedLayerId,
    multiSelectedIds,
    setMultiSelectedIds,
    pages,
    drawOverlayHighlight,
    setActiveMainTool,
    setSelectedShapeTool,
    selectedShapeTool
  });
  // ── Sync refs with props ──────────────────────────────────────────────────
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; }, [multiSelectedIds]);
  useEffect(() => { updatePageHtmlRef.current = updatePageHtml; }, [updatePageHtml]);
  useEffect(() => { currentFrameIdRef.current = currentFrameId; }, [currentFrameId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Modular Hook Call: Pen Tool & Interactive Node Edit Engine ──
  // (Must be called before useCanvasKeyboardShortcuts which needs its refs)
  const {
    paperScopeRef,
    nodeEditModeRef: _nodeEditModeRef,
    nodeEditPathRef,
    nodeEditPageIndexRef,
    nodeEditPaperPathRef,
    nodeEditDragRef,
    nodeEditSelectedSegIdxRef,
    nodeEditSelectedSegIndicesRef,
    nodeEditSelectedHandleSideRef,
    nodeEditSelectedCurveIdxRef,
    nodeEditHoverCurveIdxRef,
    nodeEditSplitSegIdxRef,
    nodeEditScreenNodesRef,
    nodeEditScreenSegmentsRef,
    vectraPenSessionRef,
    drawingPathRef,
    drawingPointsRef,
    isFreehandDrawingRef,
    drawingPageIndexRef,
    drawingSvgRef,
    draggedNodeIndexRef,
    bendingStateRef,
    drawingSubPathsRef,
    drawingSubPathElsRef,
    activeBendingSegmentRef,
    handleDraggingStateRef,
    convertPaperSegmentToVectraNode,
    clearPenToolNodes,
    drawBendingNodes,
    renderVectraOverlay,
    clearVectraOverlay,
    drawNodeEditOverlay,
    exitNodeEditMode,
    enterNodeEditMode,
    commitAndExitPenDrawing,
  } = usePenNodeEngine({
    zoom,
    activePageIndex,
    pages,
    selectedLayerId,
    setSelectedLayerId,
    setMultiSelectedIds,
    updatePageHtml,
    activeMainTool,
    activeTopTool,
    saveModifiedPageHtml,
    drawOverlayHighlight: (...args) => drawOverlayHighlightRef.current?.(...args),
    clearOverlayType,
    clearMeasurementOverlay: (...args) => clearMeasurementOverlayRef.current?.(...args),
    nodeEditModeRef,
    skipClearSelectionRef,
    selectedLayerIdRef,
    multiSelectedIdsRef
  });

  // ── Modular Hook Call: Canvas Keyboard Shortcuts Engine ──
  useCanvasKeyboardShortcuts({
    activeTopTool,
    activeMainTool,
    setActiveMainTool,
    selectedPenTool,
    setSelectedPenTool,
    activePageIndex,
    pages,
    updatePageHtml,
    saveModifiedPageHtml,
    setSelectedLayerId,
    setMultiSelectedIds,
    setCurrentFrameId,
    currentFrameIdRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    vectraPenSessionRef,
    drawingPathRef,
    commitAndExitPenDrawing,
    clearVectraOverlay,
    renderVectraOverlay,
    nodeEditModeRef,
    nodeEditPaperPathRef,
    nodeEditPathRef,
    nodeEditPageIndexRef,
    nodeEditSelectedSegIndicesRef,
    nodeEditSelectedSegIdxRef,
    nodeEditSelectedHandleSideRef,
    nodeEditSelectedCurveIdxRef,
    paperScopeRef,
    exitNodeEditMode,
    drawNodeEditOverlay,
    drawOverlayHighlight,
    drawMultiSelectionHighlight,
    isAltPressedRef,
    drawMeasurementOverlayRef,
    lastMousePosRef
  });

  useEffect(() => {
    return () => {
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('resizing-active');
      document.body.classList.remove('dragging-active');
    };
  }, []);

  // ── Clear selection on tool switch ──────────────────────────────────────────
  const prevActiveMainToolRef = useRef(activeMainTool);
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const prevTool = prevActiveMainToolRef.current;
    prevActiveMainToolRef.current = activeMainTool;

    if (skipClearSelectionRef.current) {
      skipClearSelectionRef.current = false;
      return;
    }

    // Do not clear selection if main tool has not changed (e.g. sub-tool toggle or re-render within 'select')
    if (prevTool === activeMainTool) {
      return;
    }

    // When switching to pen tool, check if an existing vector path is being edited or selected
    if (activeMainTool === 'pen') {
      // Clear node edit contour overlay so blue outline does not cover existing path stroke while drawing
      document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
        const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
        if (nodeGroup) nodeGroup.remove();
      });

      let existingTarget = nodeEditModeRef.current ? nodeEditPathRef.current : null;

      if (existingTarget && existingTarget.getAttribute('d')) {
        drawingPathRef.current = existingTarget;
        nodeEditPathRef.current = existingTarget;
        nodeEditModeRef.current = true;
        drawingPageIndexRef.current = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
        const activeContainer = existingTarget.closest('.page-svg-container');
        if (activeContainer) {
          const svg = activeContainer.querySelector('svg');
          drawingSvgRef.current = svg;
        }

        if (existingTarget.id && setSelectedLayerId) {
          setSelectedLayerId(existingTarget.id);
          selectedLayerIdRef.current = existingTarget.id;
        }

        const vSession = vectraPenSessionRef.current;
        loadDIntoVectraSession(existingTarget.getAttribute('d'), vSession, paperScopeRef.current);
        if (existingTarget.parentElement) {
          renderVectraOverlay(drawingPageIndexRef.current, existingTarget.parentElement, vSession);
        }
        return;
      }
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
      // Clear pen tool nodes and Vectra overlay on tool switch
      document.querySelectorAll('.pen-tool-node').forEach(n => n.remove());
      if (activeMainTool !== 'pen' || selectedPenTool !== 'pen') {
        vectraPenSessionRef.current.reset();
        clearVectraOverlay(activePageIndex);
        document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
          const g = overlay.querySelector('#vectra-overlay-group');
          if (g) g.innerHTML = '';
        });
      }

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

  // ── Modular Hook Call: Canvas Zoom & Pan Gestures Engine ──
  const {
    handleZoomIn,
    handleZoomOut,
    handleResetZoom
  } = useCanvasZoomPan({
    zoom,
    setZoom,
    pan,
    setPan,
    baseWidth,
    baseHeight,
    activePageIndex,
    pagesCount: pages ? pages.length : 1,
    editorContainerRef,
    zoomContainerRef,
    currentZoomRef,
    currentPanRef,
    wheelRafRef,
    lastWheelTimeRef,
    suppressClickRef
  });




  // ── Sync refs and perform page-level DOM highlights ──────────────────────────
  useEffect(() => {
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') {
      if (nodeEditModeRef.current) {
        exitNodeEditMode();
      }
    }

    // Suppress regular selection box and resize handles when in Path Node Edit Mode
    if (nodeEditModeRef.current) {
      clearOverlayType('selected');
      clearOverlayType('entered');
      clearOverlayType('child-selected');
      document.querySelectorAll('[id^="highlight-overlay-html-"] .resize-handle').forEach(h => h.remove());
      if (nodeEditPathRef.current && nodeEditPaperPathRef.current) {
        drawNodeEditOverlay(nodeEditPathRef.current, nodeEditPaperPathRef.current, nodeEditPageIndexRef.current);
      }
      return;
    }

    // Force immediate visual cleanup of all overlays before redraw
    clearOverlayType('selected');
    clearOverlayType('entered');
    clearOverlayType('child-selected');

    // Clean up HTML-based UI elements (interaction badges)
    document.querySelectorAll('[id^="interaction-badge-"]').forEach(badge => {
      if (activeTopTool !== 'interaction') {
        badge.remove();
      } else {
        const id = badge.id.replace('interaction-badge-', '');
        const idsToHighlight = multiSelectedIds.size > 0
          ? multiSelectedIds
          : (selectedLayerId ? new Set([selectedLayerId]) : new Set());
        if (!idsToHighlight.has(id)) {
          badge.remove();
        }
      }
    });

    if (multiSelectedIds.size > 1) {
      if (localTrimView) {
        multiSelectedIds.forEach(id => {
          document.querySelectorAll(`[id="${id}"]`).forEach(el => {
            const svg = el.closest('svg');
            if (svg && isElementCompletelyOutside(el, svg)) {
              el.setAttribute('data-trim-outside', 'true');
            } else if (el) {
              el.removeAttribute('data-trim-outside');
            }
          });
        });
      }
      drawMultiSelectionHighlight(multiSelectedIds, 'selected');
    } else {
      const idsToHighlight = multiSelectedIds.size > 0
        ? multiSelectedIds
        : (selectedLayerId ? new Set([selectedLayerId]) : new Set());

      idsToHighlight.forEach(id => {
        const elements = document.querySelectorAll(`[id="${id}"]`);
        if (elements.length === 0) {
          purgeElementOverlays(id);
          return;
        }

        elements.forEach(el => {
          if (isElementHidden(el)) {
            purgeElementOverlays(el);
            return;
          }

          const isFreeFrame = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame' || (el.id && el.id.startsWith('free-frame'));
          if (isFreeFrame && activeTopTool !== 'interaction' && activeTopTool !== 'animation') return;

          if (localTrimView) {
            const svg = el.closest('svg');
            if (svg && isElementCompletelyOutside(el, svg)) {
              el.setAttribute('data-trim-outside', 'true');
            } else if (el) {
              el.removeAttribute('data-trim-outside');
            }
          }

          // Highlights across multiple pages are drawn in their respective containers
          const type = (currentFrameId && id !== currentFrameId) ? 'child-selected' : 'selected';
          el.setAttribute(`data-${type}`, 'true');
          drawOverlayHighlight(el, type);

          // If this selected element is inside a parent group, highlight the parent group with a dotted line!
          const parentGroup = el.parentElement?.closest('g');
          if (parentGroup && parentGroup.id && parentGroup.id !== id && parentGroup.getAttribute('data-type') !== 'frame' && parentGroup.getAttribute('data-name') !== 'Overlay') {
            if (!isElementHidden(parentGroup)) {
              drawOverlayHighlight(parentGroup, 'entered');
            }
          }
        });
      });
    }

    if (currentFrameId) {
      document.querySelectorAll(`[id="${currentFrameId}"]`).forEach(el => {
        if (el.getAttribute('data-type') === 'frame') {
          el.setAttribute('data-frame-entered', 'true');
          drawOverlayHighlight(el, 'entered');
        }
      });
    }

    if (isEditingTextRef.current) {
      document.querySelectorAll('.selection-overlay-layer .resize-handle').forEach(h => h.remove());
      document.querySelectorAll('[id^="highlight-overlay-html-"] .resize-handle').forEach(h => h.remove());
    }
  }, [selectedLayerId, currentFrameId, multiSelectedIds, pages, activePageIndex, zoom, activeTopTool, localTrimView]);

  // Synchronize Trim View mask and outside status across all visible page SVGs
  useEffect(() => {
    const svgs = document.querySelectorAll('.page-svg-container svg:not([id^="highlight-overlay-"])');
    svgs.forEach(svg => {
      applyTrimViewToSvg(svg, localTrimView, baseWidth, baseHeight);
    });
  }, [localTrimView, activePageIndex, pages, baseWidth, baseHeight]);

  // Sync refs
  useEffect(() => {
    currentFrameIdRef.current = currentFrameId;
  }, [currentFrameId]);

  const hitTest = (el, clientX, clientY, buffer = 0) =>
    hitTestExt(el, clientX, clientY, buffer, selectedLayerIdRef.current, multiSelectedIdsRef.current);





  // Sync refs with props/state
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);
  useEffect(() => { activeMainToolRef.current = activeMainTool; }, [activeMainTool]);
  useEffect(() => { selectedSelectToolRef.current = selectedSelectTool; }, [selectedSelectTool]);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; }, [multiSelectedIds]);
  useEffect(() => { selectedPenToolRef.current = selectedPenTool; }, [selectedPenTool]);

const getDraggableElement = (target, canvasRoot) => {
    if (!target || !canvasRoot || !canvasRoot.contains || !canvasRoot.contains(target)) return null;
    let current = target;

    // If clicking on a tspan, promote to parent text element first
    if (current && current.tagName?.toLowerCase() === 'tspan') {
      current = current.parentElement || current.parentNode;
    }

    // Hotspots are single compound elements; if clicking anywhere inside a hotspot group, drag the whole hotspot!
    const hotspotGroup = current && typeof current.closest === 'function' ? current.closest('[data-is-hotspot="true"], [data-type="hotspot"]') : null;
    if (hotspotGroup) {
      if (!hotspotGroup.id) {
        hotspotGroup.id = `hotspot-${Date.now()}`;
      }
      return hotspotGroup;
    }

    let deepestElementWithId = null;

    while (current && current !== canvasRoot && current.tagName) {
      const tagName = current.tagName.toLowerCase();

      if (tagName === 'svg') {
        return deepestElementWithId;
      }

      // In normal edit mode (non-interaction & non-animation), Free Frames must never be draggable or selectable
      const isFreeFrame = (
        current.getAttribute && (
          current.getAttribute('data-name') === 'Free Frame' ||
          current.getAttribute('data-type') === 'free-frame' ||
          (current.id && current.id.startsWith('free-frame'))
        )
      );
      if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') {
        current = current.parentElement || current.parentNode;
        continue;
      }

      // In Trim View, elements completely outside cannot be targeted directly from canvas unless already selected
      if (current.getAttribute && current.getAttribute('data-trim-outside') === 'true') {
        const isSel = (current.id && current.id === selectedLayerIdRef.current) ||
          (multiSelectedIdsRef.current && current.id && multiSelectedIdsRef.current.has(current.id));
        if (!isSel) {
          current = current.parentElement || current.parentNode;
          continue;
        }
      }

      // Auto-assign an id to id-less elements from SVG templates so they
      // become selectable. This matches how the type tool creates new text.
      if (
        !current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true' &&
        current.getAttribute('data-name') !== 'Overlay' &&
        current.getAttribute('data-name') !== 'Document Shield' &&
        current.getAttribute('data-type') !== 'shield' &&
        !['svg', 'defs', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'style', 'metadata'].includes(tagName)
      ) {
        current.id = `${tagName}-${Math.random().toString(36).substr(2, 9)}`;
        if (!deepestElementWithId) deepestElementWithId = current;
      }

      if (
        current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true' &&
        current.getAttribute('data-name') !== 'Overlay' &&
        current.getAttribute('data-name') !== 'Document Shield' &&
        current.getAttribute('data-type') !== 'shield' &&
        (!isConvertedFlipbook || (
          current.getAttribute('data-is-hotspot') === 'true' ||
          current.getAttribute('data-type') === 'hotspot' ||
          ((current.getAttribute('data-name') === 'Free Frame' || current.getAttribute('data-type') === 'free-frame' || current.id?.startsWith('free-frame')) && (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation')) ||
          (current.getAttribute('data-type') === 'shape' && current.getAttribute('data-name') !== 'Free Frame' && current.getAttribute('data-type') !== 'free-frame' && !current.id?.startsWith('free-frame')) ||
          current.getAttribute('data-type') === 'icon'
        ))
      ) {
        // Prevent targeting inner image of an image group directly, or inner elements of video/gif groups
        if (tagName === 'image' && current.parentElement?.getAttribute('data-is-image-group') === 'true') {
          // Skip the inner image and let it traverse to the parent group
        } else if ((tagName === 'foreignobject' || tagName === 'video' || tagName === 'iframe') && current.parentElement?.getAttribute('data-is-video-group') === 'true') {
          // Skip inner foreignobject/video/iframe and let it traverse to the parent video group
        } else if (current.parentElement?.getAttribute('data-is-gif-group') === 'true') {
          // Skip inner gif elements and let it traverse to parent gif group
        } else {
          if (!deepestElementWithId) deepestElementWithId = current;
        }
      }

      // Check if current is a User Group (<g data-type="group"> or <g data-name="Group"> or id starting with "group-")
      const isUserGroup = current.id && (
        current.getAttribute('data-type') === 'group' ||
        (current.getAttribute('data-name') || '').toLowerCase() === 'group' ||
        current.id.startsWith('group-')
      ) && current.getAttribute('data-is-image-group') !== 'true' && current.getAttribute('data-is-video-group') !== 'true' && current.getAttribute('data-is-gif-group') !== 'true';

      if (isUserGroup && selectedSelectToolRef.current !== 'direct') {
        const frameId = currentFrameIdRef.current;
        // If this group is not the currently entered frame/context, return the User Group!
        if (frameId !== current.id) {
          return current;
        }
      }

      current = current.parentElement || current.parentNode;
    }

    return deepestElementWithId;
  };

  // ── Modular Hook Call: Interact.js Dragging & Resizing Engine ──
  useInteractEngine({
    zoom,
    activePageIndex,
    isConvertedFlipbook,
    setSelectedLayerId,
    setMultiSelectedIds,
    setCurrentFrameId,
    drawOverlayHighlight,
    drawMultiSelectionHighlight,
    syncMultiSelectionBox,
    saveModifiedPageHtml,
    getDraggableElement,
    getTopLevelFrames,
    hitTest,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    currentFrameIdRef,
    activeTopToolRef,
    activeMainToolRef,
    selectedSelectToolRef,
    nodeEditModeRef,
    suppressClickRef,
    drawMeasurementOverlayRef,
    updatePageHtml,
    updatePageHtmlRef,
    localTrimView
  });


  // ── Modular Hook Call: Canvas Pointer Events Engine ────────────────────────
  const {
    handleSvgMouseDown,
    handleSvgMouseMove,
    handleSvgMouseUp,
    handleSvgMouseLeave,
    handleSvgClick,
} = useCanvasPointerEvents({
    zoom,
    activePageIndex,
    setActivePageIndex,
    pages,
    setSelectedLayerId,
    setMultiSelectedIds,
    setCurrentFrameId,
    activeMainTool,
    setActiveMainTool,
    activeTopTool,
    selectedPenTool,
    selectedSelectTool,
    selectedShapeTool,
    setMarquee,
    isConvertedFlipbook,
    updatePageHtml,
    saveModifiedPageHtml,
    // Refs
    currentFrameIdRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    activeMainToolRef,
    activeTopToolRef,
    selectedSelectToolRef,
    selectedPenToolRef,
    drawingPathRef,
    drawingPointsRef,
    isFreehandDrawingRef,
    drawingPageIndexRef,
    drawingSvgRef,
    drawingShapeRef,
    shapeStartPointRef,
    draggedNodeIndexRef,
    bendingStateRef,
    drawingSubPathsRef,
    drawingSubPathElsRef,
    activeBendingSegmentRef,
    handleDraggingStateRef,
    nodeEditModeRef,
    nodeEditPathRef,
    nodeEditPaperPathRef,
    nodeEditPageIndexRef,
    nodeEditDragRef,
    nodeEditSelectedSegIdxRef,
    nodeEditSelectedSegIndicesRef,
    nodeEditSelectedHandleSideRef,
    nodeEditSelectedCurveIdxRef,
    nodeEditHoverCurveIdxRef,
    nodeEditSplitSegIdxRef,
    nodeEditScreenNodesRef,
    nodeEditScreenSegmentsRef,
    vectraPenSessionRef,
    paperScopeRef,
    marqueeRef,
    marqueeOverlayRef1,
    marqueeOverlayRef2,
    marqueeCandidatesRef,
    marqueeDataRef,
    suppressClickRef,
    isAltPressedRef,
    lastMousePosRef,
    lastClickRef,
    isEditingTextRef,
    drawMeasurementOverlayRef,
    skipClearSelectionRef,
    loadDIntoVectraSession,
    // Helper callbacks
    drawOverlayHighlight,
    drawBendingNodes,
    renderVectraOverlay,
    clearPenToolNodes,
    drawNodeEditOverlay,
    enterNodeEditMode,
    exitNodeEditMode,
    commitAndExitPenDrawing,
    convertTextToForeignObject,
    getDraggableElement
  });

  const handlePrevPage = () => {
    setActivePageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    if (activePageIndex + 1 < pages.length) {
      setActivePageIndex(prev => prev + 1);
    }
  };

  const closeAllDropdowns = () => {
    setShowSelectOptions(false);
    setShowPenOptions(false);
    setShowShapesOptions(false);
    if (setOpenMenuIndex) setOpenMenuIndex(null);
  };


  const handleAlign = (type) => {
    alignSelectedElements(type, {
      activePageIndex,
      multiSelectedIds,
      selectedLayerId,
      updatePageHtml,
      saveModifiedPageHtml,
      drawMultiSelectionHighlight,
      drawOverlayHighlight,
      multiSelectedIdsRef
    });
  };


  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden h-[92vh] ${isPopupEditor ? 'bg-[#E5E7EB]' : 'bg-white'}`}
      onClick={closeAllDropdowns}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CropController
        activePageIndex={activePageIndex}
        zoom={zoom}
        saveModifiedPageHtml={saveModifiedPageHtml}
        drawOverlayHighlight={drawOverlayHighlight}
        getVisualBBox={getVisualBBox}
      />
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
        onAlign={handleAlign}
        hideTools={isPdfProject}

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
        ref={editorContainerRef}
        className={`flex-1 relative flex items-center justify-center  overflow-hidden ${isPopupEditor ? 'bg-transparent' : 'bg-[#e6e7e7]'}`}
        style={{ cursor: isSpaceDown ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default' }}
        onContextMenu={(e) => {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('show-layer-context-menu', {
            detail: { e, layerId: 'outside-background', pageIndex: activePageIndex, isOverlay: true }
          }));
        }}
        onMouseDown={(e) => {
          if (isSpaceDownRef.current || e.button === 1 || activeMainTool === 'hand') {
            e.preventDefault();
            e.stopPropagation();
            isPanningRef.current = true;
            lastPanPointRef.current = { x: e.clientX, y: e.clientY };
            setIsSpaceDown(true);
            if (zoomContainerRef.current) {
              zoomContainerRef.current.style.transition = 'none';
            }
            return;
          }
        }}
        onMouseMove={(e) => {
          if (isPanningRef.current) {
            e.preventDefault();
            e.stopPropagation();
            const dx = e.clientX - lastPanPointRef.current.x;
            const dy = e.clientY - lastPanPointRef.current.y;
            lastPanPointRef.current = { x: e.clientX, y: e.clientY };

            const prev = currentPanRef.current;
            const newX = prev.x + dx;
            const newY = prev.y + dy;

            if (!editorContainerRef.current) return;

            const containerWidth = editorContainerRef.current.clientWidth;
            const containerHeight = editorContainerRef.current.clientHeight;

            const baseVhHeight = window.innerHeight * 0.78;
            const currentScale = zoom / 100;

            const bounds = getCanvasBounds(null, baseWidth, baseHeight);
            const canvasWidthMM = bounds.canvasWidthMM || 1600;

            const scaledCanvasW = (baseVhHeight * (canvasWidthMM / baseHeight)) * currentScale;
            const scaledCanvasH = (baseVhHeight * (1000 / baseHeight)) * currentScale;

            const maxPanX = Math.max(containerWidth * 1.5, scaledCanvasW);
            const maxPanY = Math.max(containerHeight * 1.5, scaledCanvasH);

            const boundedX = Math.min(Math.max(newX, -maxPanX), maxPanX);
            const boundedY = Math.min(Math.max(newY, -maxPanY), maxPanY);

            currentPanRef.current = { x: boundedX, y: boundedY };

            if (zoomContainerRef.current) {
              zoomContainerRef.current.style.transition = 'none';
              zoomContainerRef.current.style.transform = `translate(${boundedX}px, ${boundedY}px) scale(${currentScale})`;
            }
            window.dispatchEvent(new CustomEvent('editor-pan-update', { detail: { x: boundedX, y: boundedY } }));
          } else if (marqueeDataRef?.current && (e.buttons & 1) !== 0) {
            if (handleSvgMouseMove) {
              handleSvgMouseMove(activePageIndex, e);
            }
          }
        }}
        onMouseUp={(e) => {
          if (isPanningRef.current) {
            isPanningRef.current = false;
            // Mark that we just finished panning so the immediately-following
            // onClick does not accidentally select/deselect canvas elements.
            wasRecentlyPanningRef.current = true;
            setTimeout(() => { wasRecentlyPanningRef.current = false; }, 150);
            setIsSpaceDown(isSpaceDownRef.current);
            setPan(currentPanRef.current);
          }
          if (handleSvgMouseUp) {
            handleSvgMouseUp(e);
          }
        }}
        onMouseLeave={() => {
          if (isPanningRef.current) {
            isPanningRef.current = false;
            wasRecentlyPanningRef.current = true;
            setTimeout(() => { wasRecentlyPanningRef.current = false; }, 150);
            setIsSpaceDown(isSpaceDownRef.current);
            setPan(currentPanRef.current);
          }
        }}
        onClick={(e) => {
          // Suppress clicks that happen right after Ctrl+scroll zoom or Space panning
          if (isPanningRef.current || isSpaceDownRef.current || suppressClickRef.current || wasRecentlyPanningRef.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // ── Background Click: Select active page root folder instead of clearing selection ─────────────────
          const container = e.target.closest('.page-svg-container');
          const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;

          if (setActivePageIndex && activePageIndex !== pageIdx) {
            setActivePageIndex(pageIdx);
          }

          // ── Background Click: In converted flipbooks, clear selection instead of selecting full page root ─────
          if (isConvertedFlipbook) {
            if (setSelectedLayerId) setSelectedLayerId(null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set());
            if (setCurrentFrameId) setCurrentFrameId(null);
            currentFrameIdRef.current = null;
            return;
          }

          const pageSvg = container?.querySelector('svg') || document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"] svg`);
          const topFrames = pageSvg ? getTopLevelFrames(pageSvg) : [];
          const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[pageIdx]?.layers?.[0]?.id);

          if (rootId) {
            if (setSelectedLayerId) setSelectedLayerId(rootId);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
            if (setCurrentFrameId) setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else if (setSelectedLayerId) {
            setSelectedLayerId(null);
            setMultiSelectedIds(new Set());
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
          }
        }}

      >
        {/* Invisible Overlay for Panning */}
        {isSpaceDown && (
          <div className="absolute inset-0 z-[9999]" style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }} />
        )}

        {/* Canvas Ruler */}
        {isRulerEnabled && (
          <CanvasRuler
            zoom={zoom}
            pan={currentPanRef.current}
            baseLogicalWidth={baseWidth}
            baseLogicalHeight={baseHeight}
            baseCanvasWidth={window.innerHeight * 0.78 * (baseWidth / baseHeight)}
            baseCanvasHeight={window.innerHeight * 0.78}
            selectedLayerId={selectedLayerId}
            multiSelectedIds={multiSelectedIds}
          />
        )}

        {/* Guides Overlay */}
        {isRulerEnabled && (
          <GuidesOverlay
            zoom={zoom}
            pan={currentPanRef.current}
            baseCanvasWidth={window.innerHeight * 0.78 * (baseWidth / baseHeight)}
            baseCanvasHeight={window.innerHeight * 0.78}
          />
        )}

        {/* Modular Floating Toolbars */}
        <FloatingToolbars
          isPdfProject={isPdfProject}
          isPopupEditor={isPopupEditor}
          pages={pages}
          activePageIndex={activePageIndex}
          activeTopTool={activeTopTool}
          setActiveTopTool={setActiveTopTool}
          activeMainTool={activeMainTool}
          setActiveMainTool={setActiveMainTool}
          selectedSelectTool={selectedSelectTool}
          setSelectedSelectTool={setSelectedSelectTool}
          selectedPenTool={selectedPenTool}
          setSelectedPenTool={setSelectedPenTool}
          selectedShapeTool={selectedShapeTool}
          setSelectedShapeTool={setSelectedShapeTool}
          showHotspotPopup={showHotspotPopup}
          setShowHotspotPopup={setShowHotspotPopup}
          showSelectOptions={showSelectOptions}
          setShowSelectOptions={setShowSelectOptions}
          showPenOptions={showPenOptions}
          setShowPenOptions={setShowPenOptions}
          showShapesOptions={showShapesOptions}
          setShowShapesOptions={setShowShapesOptions}
          openMenuIndex={openMenuIndex}
          setOpenMenuIndex={setOpenMenuIndex}
          closeAllDropdowns={closeAllDropdowns}
          onOpenTemplateModal={onOpenTemplateModal}
          clearPage={clearPage}
          deletePage={deletePage}
        />
        {/* Canvas Area container */}
        <div
          ref={editorContainerRef}
          className={`w-full h-full flex items-center justify-center relative ${isPopupEditor ? 'bg-transparent overflow-visible' : 'overflow-hidden bg-[#e6e7e7]'}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && activeMainTool === 'grid' && typeof setActiveMainTool === 'function') {
              setActiveMainTool('select');
            }
            if (e.button === 0 && !isSpaceDownRef.current && activeMainTool !== 'hand' && !e.target.closest('[id^="canvas-content-"]') && !e.target.closest('.resize-handle') && !e.target.closest('button') && !e.target.closest('input')) {
              if (handleSvgMouseDown) {
                handleSvgMouseDown(activePageIndex, e);
              }
            }
          }}
        >
          {/* Modular Canvas Viewport */}
          <CanvasViewport
            zoomContainerRef={zoomContainerRef}
            pan={pan}
            zoom={zoom}
            pages={pages}
            activePageIndex={activePageIndex}
            localTrimView={localTrimView}
            isPopupEditor={isPopupEditor}
            canvasAspectRatio={canvasAspectRatio}
            isConvertedFlipbook={isConvertedFlipbook}
            selectedSelectTool={selectedSelectTool}
            activeTopTool={activeTopTool}
            setActiveTopTool={setActiveTopTool}
            activeMainTool={activeMainTool}
            setActiveMainTool={setActiveMainTool}
            selectedPenTool={selectedPenTool}
            handleSvgMouseDown={handleSvgMouseDown}
            handleSvgMouseMove={handleSvgMouseMove}
            handleSvgMouseUp={handleSvgMouseUp}
            handleSvgMouseLeave={handleSvgMouseLeave}
            handleSvgClick={handleSvgClick}
            handleSvgContextMenu={handleSvgContextMenu}
            isSpaceDown={isSpaceDown}
            selectedLayerId={selectedLayerId}
            multiSelectedIds={multiSelectedIds}
            isEditingTextRef={isEditingTextRef}
            marqueeOverlayRef1={marqueeOverlayRef1}
            updateElementAttribute={updateElementAttribute}
            onOpenTemplateModal={onOpenTemplateModal}
            setShowHotspotPopup={setShowHotspotPopup}
          />
          {/* Page Navigation Controls Widget */}
          <PageNavigationControls
            pages={pages}
            activePageIndex={activePageIndex}
            setActivePageIndex={setActivePageIndex}
            handlePrevPage={handlePrevPage}
            handleNextPage={handleNextPage}
          />
        </div>
      </div>

      {/* Pages rendered on demand via PageCacheManager */}
    </div>
  );
};




export default MainEditor;

