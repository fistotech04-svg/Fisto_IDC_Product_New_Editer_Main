import { useEffect, useRef, useCallback } from 'react';
import paper from 'paper';
import {
  VectraPenSession,
  pathToDCombo,
  makeNode
} from './vectraPenEngine';
import {
  getPaperSegments,
  getPaperCurves,
  cleanPaperPathData,
  mergeMeetingNodes,
  applyHandleDrag,
  executeVectorPathAction,
  deleteSelectedNodeOrHandle,
  bakeTransformIntoPaperPath,
  processVectorPathAction
} from './vectorNodeEngine';
import {
  drawNodeEditOverlay as drawNodeEditOverlayExt,
  clearPenToolNodes as clearPenToolNodesExt,
  drawPenToolNodes as drawPenToolNodesExt,
  drawBendingNodes as drawBendingNodesExt,
  renderVectraOverlay as renderVectraOverlayExt,
  clearVectraOverlay as clearVectraOverlayExt
} from './penOverlayEngine';
import { getLocalPoint } from '../mainEditor/geometryUtils';

/**
 * Hook for managing Pen Tool drawing (Vectra session, bezier curves, pencil)
 * and interactive Node Edit Mode (Paper.js paths, anchor points, bezier handles).
 */
export const usePenNodeEngine = ({
  zoom = 90,
  activePageIndex = 0,
  pages = [],
  selectedLayerId,
  setSelectedLayerId,
  setMultiSelectedIds,
  updatePageHtml,
  activeMainTool,
  activeTopTool,
  saveModifiedPageHtml,
  drawOverlayHighlight,
  clearOverlayType,
  clearMeasurementOverlay,
  nodeEditModeRef: externalNodeEditModeRef,
  skipClearSelectionRef: externalSkipClearSelectionRef,
  selectedLayerIdRef,
  multiSelectedIdsRef
}) => {
  const paperScopeRef = useRef(null);

  // ── Node Edit Mode Refs ───────────────────────────────────────────────────
  const internalNodeEditModeRef = useRef(false);
  const nodeEditModeRef = externalNodeEditModeRef || internalNodeEditModeRef;
  const nodeEditPathRef = useRef(null);
  const nodeEditPageIndexRef = useRef(null);
  const nodeEditPaperPathRef = useRef(null);
  const nodeEditDragRef = useRef(null);
  const nodeEditSelectedSegIdxRef = useRef(null);
  const nodeEditSelectedSegIndicesRef = useRef(new Set());
  const nodeEditSelectedHandleSideRef = useRef(null);
  const nodeEditSelectedCurveIdxRef = useRef(null);
  const nodeEditHoverCurveIdxRef = useRef(-1);
  const nodeEditSplitSegIdxRef = useRef(null);
  const nodeEditScreenNodesRef = useRef([]);
  const nodeEditScreenSegmentsRef = useRef([]);
  const nodeEditRetractHandleRef = useRef(null);

  // ── Pen & Drawing Session Refs ────────────────────────────────────────────
  const vectraPenSessionRef = useRef(new VectraPenSession());
  const drawingPathRef = useRef(null);
  const drawingPointsRef = useRef([]);
  const isFreehandDrawingRef = useRef(false);
  const drawingPageIndexRef = useRef(null);
  const drawingSvgRef = useRef(null);
  const drawingShapeRef = useRef(null);
  const shapeStartPointRef = useRef(null);
  const internalSkipClearSelectionRef = useRef(false);
  const skipClearSelectionRef = externalSkipClearSelectionRef || internalSkipClearSelectionRef;
  const draggedNodeIndexRef = useRef({ pIdx: -1, ptIdx: -1 });
  const bendingStateRef = useRef(null);
  const drawingSubPathsRef = useRef([]);
  const drawingSubPathElsRef = useRef([]);
  const activeBendingSegmentRef = useRef(null);
  const handleDraggingStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  // Initialize paper.js scope on mount
  useEffect(() => {
    if (!paperScopeRef.current) {
      paperScopeRef.current = new paper.PaperScope();
      paperScopeRef.current.setup(document.createElement('canvas'));
    }
  }, []);

  const createPaperPath = useCallback((d) => {
    if (!paperScopeRef.current || !d) return null;
    paperScopeRef.current.activate();
    const mCount = (d.match(/M/gi) || []).length;
    if (mCount > 1) {
      return new paperScopeRef.current.CompoundPath(d);
    }
    return new paperScopeRef.current.Path(d);
  }, []);

  const convertPaperSegmentToVectraNode = useCallback((seg) => {
    const node = makeNode(seg.point.x, seg.point.y);
    const hasIn = seg.handleIn && !seg.handleIn.isZero();
    const hasOut = seg.handleOut && !seg.handleOut.isZero();

    if (hasIn) {
      node.in = { x: seg.handleIn.x, y: seg.handleIn.y };
    }
    if (hasOut) {
      node.out = { x: seg.handleOut.y, y: seg.handleOut.y };
    }

    if (seg.nodeType) {
      node.type = seg.nodeType;
    } else if (hasIn && hasOut) {
      const normIn = seg.handleIn.normalize();
      const normOut = seg.handleOut.normalize();
      const dot = normIn.dot(normOut);
      if (dot < -0.90) {
        const diff = Math.abs(seg.handleIn.length - seg.handleOut.length);
        node.type = diff < 4.0 ? 'symmetric' : 'smooth';
      } else {
        node.type = 'cusp';
      }
    } else {
      node.type = 'sharp';
    }
    return node;
  }, []);

  const clearPenToolNodes = useCallback((pageIndex) => {
    clearPenToolNodesExt(pageIndex);
  }, []);

  const drawBendingNodes = useCallback((pageIndex, pathEl, paperPath, activeCurveIndex) => {
    drawBendingNodesExt(pageIndex, pathEl, paperPath, activeCurveIndex, zoom, {
      drawingPathRef,
      drawingSubPathsRef,
    });
  }, [zoom]);

  const drawPenToolNodes = useCallback((pageIndex, parentEl, nestedPoints, currentPoint = null) => {
    drawPenToolNodesExt(pageIndex, parentEl, nestedPoints, currentPoint, zoom);
  }, [zoom]);

  const renderVectraOverlay = useCallback((pageIndex, parentEl, vectraSession) => {
    renderVectraOverlayExt(pageIndex, parentEl, vectraSession, zoom);
  }, [zoom]);

  const clearVectraOverlay = useCallback((pageIndex) => {
    clearVectraOverlayExt(pageIndex);
  }, []);

  const drawNodeEditOverlay = useCallback((pathEl, paperPath, pageIndex) => {
    drawNodeEditOverlayExt(pathEl, paperPath, pageIndex, zoom, {
      nodeEditSelectedSegIdxRef,
      nodeEditSelectedSegIndicesRef,
      nodeEditSelectedHandleSideRef,
      nodeEditSelectedCurveIdxRef,
      nodeEditHoverCurveIdxRef,
      nodeEditSplitSegIdxRef,
      nodeEditDragRef,
      nodeEditScreenNodesRef,
      nodeEditScreenSegmentsRef,
      nodeEditRetractHandleRef,
    });
  }, [zoom]);

  const exitNodeEditMode = useCallback(() => {
    if (!nodeEditModeRef.current) return;

    document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
      const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
      if (nodeGroup) nodeGroup.remove();
    });

    const pathEl = nodeEditPathRef.current;
    if (pathEl) {
      pathEl.removeAttribute('data-node-edit');
    }
    document.querySelectorAll('[data-node-edit-active="true"]').forEach(el => el.removeAttribute('data-node-edit-active'));
    document.querySelectorAll('[data-node-edit="true"]').forEach(el => el.removeAttribute('data-node-edit'));

    nodeEditModeRef.current = false;
    nodeEditPathRef.current = null;
    drawingPathRef.current = null;
    nodeEditPageIndexRef.current = null;
    nodeEditDragRef.current = null;
    nodeEditSelectedSegIdxRef.current = null;
    nodeEditSelectedCurveIdxRef.current = null;
    nodeEditHoverCurveIdxRef.current = -1;
    nodeEditSelectedSegIndicesRef.current = new Set();
    nodeEditSplitSegIdxRef.current = null;
    if (vectraPenSessionRef.current) vectraPenSessionRef.current.reset();

    if (pathEl && pathEl.id) {
      const targetId = pathEl.id;
      if (selectedLayerIdRef) selectedLayerIdRef.current = targetId;
      if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([targetId]);
      if (setSelectedLayerId) setSelectedLayerId(targetId);
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([targetId]));
      if (skipClearSelectionRef) skipClearSelectionRef.current = true;
      setTimeout(() => {
        const freshEl = document.getElementById(targetId) || pathEl;
        if (freshEl && drawOverlayHighlight) {
          drawOverlayHighlight(freshEl, 'selected');
        }
      }, 30);
    }

    document.querySelectorAll('.page-svg-container').forEach(el => el.classList.remove('cur-node-edit'));
    window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: false } }));
  }, [drawOverlayHighlight, setSelectedLayerId, setMultiSelectedIds, selectedLayerIdRef, multiSelectedIdsRef, skipClearSelectionRef]);

  const enterNodeEditMode = useCallback((targetEl, pageIndex) => {
    if (!targetEl) return;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') return;

    const pathEl = targetEl.tagName?.toLowerCase() === 'path' ? targetEl : targetEl.querySelector('path');
    if (!pathEl || !pathEl.getAttribute('d')) return;

    const d = pathEl.getAttribute('d');
    if (!d) return;

    if (nodeEditModeRef.current) exitNodeEditMode();

    try {
      const paperPath = createPaperPath(d);
      if (!paperPath) return;

      bakeTransformIntoPaperPath(pathEl, paperPath, paperScopeRef.current);

      nodeEditModeRef.current = true;
      nodeEditPathRef.current = pathEl;
      nodeEditPageIndexRef.current = pageIndex;
      nodeEditPaperPathRef.current = paperPath;
      nodeEditDragRef.current = null;
      nodeEditSelectedSegIdxRef.current = 0;
      nodeEditSelectedSegIndicesRef.current = new Set([0]);
      nodeEditSplitSegIdxRef.current = null;

      if (pathEl.id) {
        pathEl.setAttribute('data-node-edit', 'true');
        if (typeof setSelectedLayerId === 'function') setSelectedLayerId(pathEl.id);
        if (typeof setMultiSelectedIds === 'function') {
          setMultiSelectedIds(new Set([pathEl.id]));
        }
      }

      document.querySelectorAll('.page-svg-container').forEach(el => el.classList.add('cur-node-edit'));

      if (clearOverlayType) clearOverlayType('selected');
      if (clearMeasurementOverlay) clearMeasurementOverlay();
      const overlay = document.getElementById(`highlight-overlay-${pageIndex}`);
      if (overlay) {
        overlay.querySelectorAll(`[id*="${pathEl.id}"]`).forEach(n => {
          if (!n.id || !n.id.includes('node-edit')) n.remove();
        });
      }
      const htmlOverlay = document.getElementById(`highlight-overlay-html-${pageIndex}`);
      if (htmlOverlay) {
        htmlOverlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
        htmlOverlay.querySelectorAll(`[id*="${pathEl.id}"]`).forEach(h => h.remove());
      }

      drawNodeEditOverlay(pathEl, paperPath, pageIndex);

      const container = pathEl.closest('.page-svg-container');
      if (container) {
        container.setAttribute('data-node-edit-active', 'true');
      }

      window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: true, pathId: pathEl.id } }));

      try {
        const initSegs = getPaperSegments(paperPath);
        const initSeg = initSegs[0];
        if (initSeg) {
          let initNodeType = initSeg.nodeType;
          if (!initNodeType) {
            if (initSeg.handleIn.isZero() && initSeg.handleOut.isZero()) {
              initNodeType = 'sharp';
            } else if (!initSeg.handleIn.isZero() && !initSeg.handleOut.isZero()) {
              const dot = initSeg.handleIn.normalize().dot(initSeg.handleOut.normalize());
              if (dot < -0.90) {
                initNodeType = Math.abs(initSeg.handleIn.length - initSeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth';
              } else {
                initNodeType = 'custom';
              }
            } else {
              initNodeType = 'custom';
            }
            initSeg.nodeType = initNodeType;
          }
          window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: initNodeType, segIdx: 0, selectedCount: 1, canJoin: false, isLineSelected: false } }));
        }
      } catch { /* ignored */ }
    } catch (err) {
      console.warn('[NodeEditMode] Failed to enter node edit mode:', err);
    }
  }, [activeTopTool, createPaperPath, exitNodeEditMode, setSelectedLayerId, setMultiSelectedIds, clearOverlayType, clearMeasurementOverlay, drawNodeEditOverlay]);

  const commitAndExitPenDrawing = useCallback(() => {
    const vSession = vectraPenSessionRef.current;
    if (!vSession) return;

    const hasPaths = vSession.paths && (vSession.paths.size > 0 || vSession.paths.length > 0);
    if (vSession.isDrawing || hasPaths || drawingPathRef.current) {
      vSession.finishPath();
      const pathEl = drawingPathRef.current;
      const pageIdx = drawingPageIndexRef.current !== null ? drawingPageIndexRef.current : activePageIndex;

      if (pathEl) {
        const comboD = pathToDCombo(vSession.paths);
        if (comboD) {
          pathEl.setAttribute('d', comboD);
        } else if (!vSession.paths || vSession.paths.size === 0) {
          if (pathEl.parentNode) pathEl.parentNode.removeChild(pathEl);
        }
      }

      const targetId = pathEl?.id;
      const svgEl = pathEl?.ownerSVGElement || drawingSvgRef?.current || document.querySelector(`.page-svg-container[data-page-index="${pageIdx}"] svg`);

      vSession.reset();
      drawingPathRef.current = null;
      exitNodeEditMode();
      clearVectraOverlay(pageIdx);
      document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
        const g = overlay.querySelector('#vectra-overlay-group');
        if (g) g.innerHTML = '';
        const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
        if (nodeGroup) nodeGroup.remove();
      });

      if (pathEl && svgEl && updatePageHtml) {
        updatePageHtml(pageIdx, svgEl.outerHTML);
        if (targetId) {
          skipClearSelectionRef.current = true;
          window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: targetId } }));
          if (selectedLayerIdRef) selectedLayerIdRef.current = targetId;
          if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([targetId]);
          if (setSelectedLayerId) {
            setSelectedLayerId(targetId);
          }
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set([targetId]));
          }
          setTimeout(() => {
            const freshEl = document.getElementById(targetId);
            if (freshEl) drawOverlayHighlight(freshEl, 'selected');
            else drawOverlayHighlight(pathEl, 'selected');
          }, 40);
          setTimeout(() => {
            const freshEl = document.getElementById(targetId);
            if (freshEl) drawOverlayHighlight(freshEl, 'selected');
          }, 120);
        }
      }
    } else {
      vSession.reset();
      drawingPathRef.current = null;
      if (drawingPageIndexRef.current !== null) {
        clearVectraOverlay(drawingPageIndexRef.current);
      }
    }
  }, [activePageIndex, updatePageHtml, setSelectedLayerId, setMultiSelectedIds, exitNodeEditMode, clearVectraOverlay, drawOverlayHighlight, selectedLayerIdRef, multiSelectedIdsRef]);

  // ── Listen for vector path actions from ShapeProperties (Sharp, Smooth, Join, etc.) ──
  useEffect(() => {
    const handleVectorPathAction = (e) => {
      const { action } = e.detail || {};
      if (!action) return;

      let targetEl = nodeEditPathRef.current || (selectedLayerId ? document.getElementById(selectedLayerId) : null);
      if (!targetEl) {
        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        targetEl = activeContainer?.querySelector('path[data-type="vector-path"]') || activeContainer?.querySelector('path');
      }
      if (!targetEl) return;

      let pathEl = targetEl.tagName?.toLowerCase() === 'path' ? targetEl : targetEl.querySelector('path');
      if (!pathEl || !pathEl.getAttribute('d')) return;

      const pageIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;

      processVectorPathAction(action, {
        pathEl,
        pageIdx,
        paperScope: paperScopeRef.current,
        createPaperPath,
        bakeTransformIntoPaperPath,
        deleteSelectedNodeOrHandle,
        executeVectorPathAction,
        cleanPaperPathData,
        getPaperSegments,
        exitNodeEditMode,
        saveModifiedPageHtml,
        setSelectedLayerId,
        drawNodeEditOverlay,
        enterNodeEditMode,
        updatePageHtml,
        refs: {
          nodeEditPaperPathRef,
          nodeEditSelectedSegIndicesRef,
          nodeEditSelectedSegIdxRef,
          nodeEditSelectedHandleSideRef,
          nodeEditSelectedCurveIdxRef,
          nodeEditSplitSegIdxRef,
          nodeEditModeRef
        }
      });
    };

    window.addEventListener('vector-path-action', handleVectorPathAction);
    return () => window.removeEventListener('vector-path-action', handleVectorPathAction);
  }, [activePageIndex, updatePageHtml, selectedLayerId, createPaperPath, exitNodeEditMode, saveModifiedPageHtml, setSelectedLayerId, drawNodeEditOverlay, enterNodeEditMode]);

  // ── Global mousemove listener for robust Node Edit dragging ──
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (nodeEditDragRef.current) {
        if (nodeEditSplitSegIdxRef.current !== null) {
          nodeEditSplitSegIdxRef.current = null;
        }
        const { mode, segIdx, handleSide, pathEl, paperPath, startPt, startPoints,
          curveIndex, startHandle1, startHandle2, pageIndex } = nodeEditDragRef.current;
        const svgEl = pathEl?.ownerSVGElement;
        if (!svgEl || !paperPath || !paperScopeRef.current) return;

        const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
        paperScopeRef.current.activate();
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
        const delta = mousePoint.subtract(new paperScopeRef.current.Point(startPt.x, startPt.y));

        const segments = getPaperSegments(paperPath);
        const curves = getPaperCurves(paperPath);

        let effectiveDelta = delta;

        if (mode === 'node' || mode === 'segment-translate') {
          if (startPoints && Object.keys(startPoints).length > 0) {
            const primaryIdx = segIdx !== undefined ? segIdx : parseInt(Object.keys(startPoints)[0]);
            const primaryStart = startPoints[primaryIdx] || Object.values(startPoints)[0];
            if (primaryStart) {
              const activePt = primaryStart.add(delta);

              const ctm = pathEl.getScreenCTM();
              const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
              const SNAP_RADIUS_PX = 6;
              let bestDist = SNAP_RADIUS_PX;
              let snapTargetPt = null;

              segments.forEach((otherSeg, oIdx) => {
                if (!startPoints[oIdx]) {
                  const distPx = Math.hypot(activePt.x - otherSeg.point.x, activePt.y - otherSeg.point.y) * scale;
                  if (distPx < bestDist) {
                    bestDist = distPx;
                    snapTargetPt = otherSeg.point;
                  }
                }
              });

              if (snapTargetPt) {
                effectiveDelta = snapTargetPt.subtract(primaryStart);
              }
            }

            Object.keys(startPoints).forEach(sIdxStr => {
              const sIdx = parseInt(sIdxStr);
              const seg = segments[sIdx];
              if (seg && startPoints[sIdx]) {
                seg.point = startPoints[sIdx].add(effectiveDelta);
              }
            });
          } else if (mode === 'node') {
            const seg = segments[segIdx];
            if (seg) seg.point = mousePoint;
          }
        } else if (mode === 'handle') {
          const seg = segments[segIdx];
          if (seg) {
            const ctm = pathEl.getScreenCTM();
            const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
            const distToCenterPx = Math.hypot(mousePoint.x - seg.point.x, mousePoint.y - seg.point.y) * scale;
            const SNAP_TO_CENTER_PX = 12;

            if (distToCenterPx < SNAP_TO_CENTER_PX) {
              nodeEditRetractHandleRef.current = { segIdx, handleSide, isReadyToDelete: true };
            } else {
              nodeEditRetractHandleRef.current = null;
            }
            applyHandleDrag(seg, handleSide, mousePoint, e.altKey);
          }
        } else if (mode === 'segment-bend') {
          const curve = curves[curveIndex];
          if (curve && startHandle1 && startHandle2) {
            curve.segment1.handleOut = startHandle1.add(delta.multiply(0.5));
            curve.segment2.handleIn = startHandle2.add(delta.multiply(0.5));
          }
        }

        const allSegments = getPaperSegments(paperPath);
        let allCollapsed = false;
        if (allSegments.length > 0) {
          const firstPt = allSegments[0].point;
          allCollapsed = allSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
        }

        const dStr = cleanPaperPathData(paperPath);
        const totalSegments = allSegments.length;

        if (allCollapsed || !dStr || dStr.trim() === '' || totalSegments <= 1) {
          pathEl.setAttribute('d', '');
          const pageIdx = pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current;
          const overlay = document.getElementById(`highlight-overlay-${pageIdx}`);
          if (overlay) {
            const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
            if (nodeGroup) nodeGroup.innerHTML = '';
          }
        } else {
          pathEl.setAttribute('d', dStr);
          drawNodeEditOverlay(pathEl, paperPath, pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current);
        }
        suppressClickRef.current = true;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [drawNodeEditOverlay]);

  // ── Global mouseup: end node edit drag and persist path ──
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (nodeEditDragRef.current) {
        const { pathEl, paperPath, pageIndex } = nodeEditDragRef.current;
        nodeEditDragRef.current = null;

        if (nodeEditRetractHandleRef.current && nodeEditRetractHandleRef.current.isReadyToDelete) {
          const { segIdx, handleSide } = nodeEditRetractHandleRef.current;
          if (paperPath && paperScopeRef.current) {
            const segments = getPaperSegments(paperPath);
            const seg = segments[segIdx];
            if (seg) {
              if (handleSide === 'in') {
                seg.handleIn = new paperScopeRef.current.Point(0, 0);
              } else if (handleSide === 'out') {
                seg.handleOut = new paperScopeRef.current.Point(0, 0);
              }
            }
          }
        }
        nodeEditRetractHandleRef.current = null;

        if (paperPath && pathEl) {
          mergeMeetingNodes(paperPath);
          const dStr = cleanPaperPathData(paperPath);
          const allSegments = getPaperSegments(paperPath);
          let allCollapsed = false;
          if (allSegments.length > 0) {
            const firstPt = allSegments[0].point;
            allCollapsed = allSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
          }

          if (allCollapsed || !dStr || dStr.trim() === '' || allSegments.length <= 1) {
            const svgEl = pathEl.ownerSVGElement;
            pathEl.remove();
            exitNodeEditMode();
            if (svgEl && saveModifiedPageHtml) {
              saveModifiedPageHtml(
                pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current,
                svgEl
              );
            }
            if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
            return;
          }

          if (pathEl.tagName?.toLowerCase() === 'g') {
            const firstChild = pathEl.querySelector('path');
            if (firstChild) firstChild.setAttribute('d', dStr);
          } else {
            pathEl.setAttribute('d', dStr);
          }
          drawNodeEditOverlay(pathEl, paperPath, pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current);
        }

        if (pathEl && pathEl.ownerSVGElement && saveModifiedPageHtml) {
          saveModifiedPageHtml(
            pageIndex !== undefined ? pageIndex : nodeEditPageIndexRef.current,
            pathEl.ownerSVGElement
          );
        }
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [drawNodeEditOverlay, exitNodeEditMode, saveModifiedPageHtml, setSelectedLayerId]);

  // ── Auto-exit Node Edit Mode when switching pages or changing layer selection ──
  useEffect(() => {
    if (nodeEditModeRef.current) {
      if (activePageIndex !== nodeEditPageIndexRef.current || (selectedLayerId && selectedLayerId !== nodeEditPathRef.current?.id)) {
        exitNodeEditMode();
      }
    }
  }, [activePageIndex, selectedLayerId, exitNodeEditMode]);

  // Re-draw active node overlays on zoom change so pen points/dots retain constant visual size
  useEffect(() => {
    if (nodeEditModeRef.current && nodeEditPathRef.current && nodeEditPaperPathRef.current) {
      drawNodeEditOverlay(nodeEditPathRef.current, nodeEditPaperPathRef.current, nodeEditPageIndexRef.current);
    }
    if (drawingPathRef.current && drawingSubPathsRef.current) {
      drawPenToolNodes(activePageIndex, drawingPathRef.current, drawingSubPathsRef.current);
    }
    if (bendingStateRef.current) {
      const { pathEl, paperPath, curveIndex, pageIndex: activePageIdx } = bendingStateRef.current;
      drawBendingNodes(activePageIdx, pathEl, paperPath, curveIndex);
    }
  }, [zoom, activePageIndex, drawNodeEditOverlay, drawPenToolNodes, drawBendingNodes]);

  // ── Live sync PaperPath & Node Overlay when shape path changes ──
  useEffect(() => {
    if (nodeEditModeRef.current && nodeEditPathRef.current) {
      const pathEl = nodeEditPathRef.current;
      const freshEl = pathEl.id ? document.getElementById(pathEl.id) : pathEl;
      const targetPathEl = freshEl?.tagName?.toLowerCase() === 'path' ? freshEl : freshEl?.querySelector?.('path');
      if (targetPathEl && targetPathEl.getAttribute('d')) {
        const newD = targetPathEl.getAttribute('d');
        const pageIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
        try {
          if (paperScopeRef.current) {
            paperScopeRef.current.activate();
            const newPaperPath = createPaperPath(newD);
            if (newPaperPath) {
              bakeTransformIntoPaperPath(targetPathEl, newPaperPath, paperScopeRef.current);
              nodeEditPathRef.current = targetPathEl;
              nodeEditPaperPathRef.current = newPaperPath;
              drawNodeEditOverlay(targetPathEl, newPaperPath, pageIdx);
            }
          }
        } catch (err) {
          console.warn('[NodeEditSync] Error syncing node edit paper path:', err);
        }
      }
    }
  }, [pages, activePageIndex, createPaperPath, drawNodeEditOverlay]);

  // Handle exiting pen drawing when tool changes
  useEffect(() => {
    if (activeBendingSegmentRef.current) {
      clearPenToolNodes(activeBendingSegmentRef.current.pageIndex);
      activeBendingSegmentRef.current = null;
    }
    if (activeMainTool !== 'pen') {
      commitAndExitPenDrawing();
    }
  }, [activeMainTool, commitAndExitPenDrawing, clearPenToolNodes]);

  return {
    paperScopeRef,
    nodeEditModeRef,
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
    nodeEditRetractHandleRef,
    vectraPenSessionRef,
    drawingPathRef,
    drawingPointsRef,
    isFreehandDrawingRef,
    drawingPageIndexRef,
    drawingSvgRef,
    drawingShapeRef,
    shapeStartPointRef,
    skipClearSelectionRef,
    draggedNodeIndexRef,
    bendingStateRef,
    drawingSubPathsRef,
    drawingSubPathElsRef,
    activeBendingSegmentRef,
    handleDraggingStateRef,
    suppressClickRef,
    createPaperPath,
    convertPaperSegmentToVectraNode,
    clearPenToolNodes,
    drawBendingNodes,
    drawPenToolNodes,
    renderVectraOverlay,
    clearVectraOverlay,
    drawNodeEditOverlay,
    exitNodeEditMode,
    enterNodeEditMode,
    commitAndExitPenDrawing,
  };
};

export default usePenNodeEngine;
