/* eslint-disable react-hooks/purity, react-hooks/immutability */
import { useEffect } from 'react';
import {
  pathToDCombo,
  getPaperSegments, getPaperCurves, cleanPaperPathData, mergeMeetingNodes, applyHandleDrag, deleteSelectedNodeOrHandle
} from '../penTool';
import {
  formatSmoothPathD,
  getSvgPoint,
  getLocalPoint,
  clearOverlayType
} from './geometryUtils';
import { getTopLevelFrames, getDirectChildFrames, hitTest } from './frameHierarchyUtils';
import { useInlineTextEditor } from './useInlineTextEditor';

/**
 * Hook managing canvas pointer interactions:
 * - Mouse down, move, leave, click, double click
 * - Shape creation, pencil drawing, pen tool vectra sessions
 * - Marquee rectangle selection, frame selection drill-down
 * - Global mouseup listeners for pen/shape commit
 */
const setsAreEqual = (a, b) => a.size === b.size && [...a].every(v => b.has(v));

export const useCanvasPointerEvents = ({
  zoom = 90,
  activePageIndex = 0,
  setActivePageIndex,
  pages = [],
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
}) => {
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

  // ── Screen-space marquee box (unscaled, pixel-snapped like smart guides) ──
  const getScreenMarqueeBox = () => {
    let box = document.getElementById('marquee-screen-box');
    if (box) return box;
    const host = document.getElementById('main-zoom-container')?.parentElement;
    if (!host) return null;
    box = document.createElement('div');
    box.id = 'marquee-screen-box';
    box.style.cssText = 'position:absolute; display:none; box-sizing:border-box; border:1px solid #5255CA; background-color:rgba(82,85,202,0.1); pointer-events:none; z-index:36; left:0; top:0; width:0; height:0;';
    host.appendChild(box);
    return box;
  };

  const updateScreenMarqueeBox = (x1, y1, x2, y2) => {
    const box = getScreenMarqueeBox();
    if (!box) return;
    const hostRect = box.parentElement.getBoundingClientRect();
    const left = Math.round(Math.min(x1, x2) - hostRect.left);
    const top = Math.round(Math.min(y1, y2) - hostRect.top);
    const right = Math.round(Math.max(x1, x2) - hostRect.left);
    const bottom = Math.round(Math.max(y1, y2) - hostRect.top);
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${Math.max(1, right - left)}px`;
    box.style.height = `${Math.max(1, bottom - top)}px`;
    box.style.display = 'block';
  };

  const hideScreenMarqueeBox = () => {
    const box = document.getElementById('marquee-screen-box');
    if (box) box.style.display = 'none';
  };

  const cleanupMarquee = () => {
    hideScreenMarqueeBox();
    if (marqueeOverlayRef1?.current) {
      marqueeOverlayRef1.current.style.display = 'none';
      const rectEl = marqueeOverlayRef1.current.querySelector ? marqueeOverlayRef1.current.querySelector('rect') : null;
      if (rectEl) {
        rectEl.setAttribute('x', '0');
        rectEl.setAttribute('y', '0');
        rectEl.setAttribute('width', '0');
        rectEl.setAttribute('height', '0');
      }
    }
    if (marqueeOverlayRef2?.current) {
      marqueeOverlayRef2.current.style.display = 'none';
    }
    if (marqueeDataRef.current?.hasDragged) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 100);
    }
    marqueeDataRef.current = null;
    marqueeRef.current = null;
    if (typeof setMarquee === 'function') {
      setMarquee(null);
    }
  };

  const handleSvgMouseUp = (e) => {
    if (marqueeDataRef.current || marqueeRef.current) {
      cleanupMarquee();
    }
  };

  const handleSvgMouseDown = (pageIndex, e) => {
    if (e._handledMarquee) return;
    if (e.button !== 0 || e.target.closest('.resize-handle')) return;

    // Allow native text selection/interaction inside actively edited text boxes
    if (e.target.closest('[contenteditable="true"]')) {
      e.stopPropagation();
      return;
    }

    const canvasContent = document.getElementById(`canvas-content-${pageIndex}`) ||
      document.querySelector(`[data-page-index="${pageIndex}"] [id^="canvas-content-"]`) ||
      document.querySelector('[id^="canvas-content-"]');

    const targetPageContainer = e.currentTarget?.classList?.contains('page-svg-container')
      ? e.currentTarget
      : (e.currentTarget?.closest?.('.page-svg-container') ||
         document.querySelector(`[data-page-index="${pageIndex}"]`) ||
         canvasContent ||
         document.querySelector('.page-svg-container'));

    const container = targetPageContainer || e.currentTarget;
    const svg = canvasContent?.querySelector('svg') || container?.querySelector('svg:not([id^="highlight-overlay-"]):not([id^="marquee"])') || container?.querySelector('svg');
    if (!svg) return;

    const getDistinctNodes = (paperPath, selSet) => {
      if (!paperPath || !selSet) return [];
      const segments = getPaperSegments(paperPath);
      const selSegs = Array.from(selSet).map(idx => segments[idx]).filter(Boolean);
      const distinct = [];
      selSegs.forEach(seg => {
        if (!distinct.some(s => Math.hypot(s.point.x - seg.point.x, s.point.y - seg.point.y) < 3.0)) {
          distinct.push(seg);
        }
      });
      return distinct;
    };

    const checkCanJoinNodes = (paperPath, selSet) => {
      if (!paperPath || !selSet) return false;
      try {
        const distinct = getDistinctNodes(paperPath, selSet);
        if (distinct.length !== 2) return false;

        const segments = getPaperSegments(paperPath);
        const curves = getPaperCurves(paperPath);

        const pt1 = distinct[0].point;
        const pt2 = distinct[1].point;

        const segs1 = segments.filter(s => Math.hypot(s.point.x - pt1.x, s.point.y - pt1.y) < 3.0);
        const segs2 = segments.filter(s => Math.hypot(s.point.x - pt2.x, s.point.y - pt2.y) < 3.0);

        const isConnected = curves.some(c =>
          (segs1.includes(c.segment1) && segs2.includes(c.segment2)) ||
          (segs1.includes(c.segment2) && segs2.includes(c.segment1))
        );
        return !isConnected;
      } catch {
        return false;
      }
    };

    // ── NODE EDIT MODE: Handle node, handle, and line segment dragging ──────────
    if (nodeEditModeRef.current && nodeEditPathRef.current && activeMainTool !== 'pen') {
      const pathEl = nodeEditPathRef.current;
      const paperPath = nodeEditPaperPathRef.current;
      if (!paperPath || !pathEl) return;

      skipClearSelectionRef.current = true;
      if (pathEl && pathEl.id) {
        selectedLayerIdRef.current = pathEl.id;
        if (typeof setSelectedLayerId === 'function') setSelectedLayerId(pathEl.id);
        if (typeof setMultiSelectedIds === 'function') {
          multiSelectedIdsRef.current = new Set([pathEl.id]);
          setMultiSelectedIds(new Set([pathEl.id]));
        }
      }
      window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: true, pathId: pathEl.id } }));

      // Screen-space hit testing using stored node positions from drawNodeEditOverlay.
      // These positions are in actual screen pixels (from pathEl.getScreenCTM()),
      // so they correctly match e.clientX/e.clientY regardless of zoom/scroll/transforms.
      let hitSegIdx = -1;
      let hitHandleSide = null; // 'point', 'in', 'out'
      const HIT_RADIUS_PX = 12; // screen pixel radius

      const screenNodes = nodeEditScreenNodesRef.current;
      let minDist = HIT_RADIUS_PX;
      for (const node of screenNodes) {
        const dist = Math.hypot(e.clientX - node.x, e.clientY - node.y);
        if (dist < minDist) {
          minDist = dist;
          hitSegIdx = node.segIdx;
          hitHandleSide = node.handleSide;
        }
      }

      paperScopeRef.current.activate();
      const svgEl = pathEl.ownerSVGElement;
      const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
      const mousePt = new paperScopeRef.current.Point(pt.x, pt.y);

      if (hitSegIdx !== -1 && !isNaN(hitSegIdx)) {
        if (hitHandleSide === 'point') {
          // Deleting an anchor point is ONLY performed if the Pen Subtract tool is active
          if (selectedPenToolRef.current === 'subtract') {
            const segments = getPaperSegments(paperPath);
            if (segments[hitSegIdx]) {
              segments[hitSegIdx].remove();
            }
            mergeMeetingNodes(paperPath);
            const dStr = cleanPaperPathData(paperPath);
            const remainingSegments = getPaperSegments(paperPath);
            if (remainingSegments.length <= 1 || !dStr || dStr.trim() === '') {
              pathEl.remove();
              exitNodeEditMode();
              if (svgEl && updatePageHtml) {
                saveModifiedPageHtml(pageIndex, svgEl);
              }
              if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
            } else {
              pathEl.setAttribute('d', dStr);
              nodeEditSelectedSegIdxRef.current = null;
              nodeEditSelectedSegIndicesRef.current = new Set();
              drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            }
            suppressClickRef.current = true;
            e.stopPropagation();
            return;
          }

          let selSet = nodeEditSelectedSegIndicesRef.current || new Set();
          if (e.shiftKey) {
            if (selSet.has(hitSegIdx)) selSet.delete(hitSegIdx);
            else selSet.add(hitSegIdx);
          } else {
            // Select only the clicked node point (plus any co-located merged nodes) and unselect other nodes
            selSet = new Set([hitSegIdx]);
          }
          const isSplitNode = (nodeEditSplitSegIdxRef.current !== null);
          const segments = getPaperSegments(paperPath);
          const primarySeg = segments[hitSegIdx];
          if (primarySeg) {
            // Snap all co-located/merged nodes ONLY if it is not a split node action
            if (!isSplitNode && !e.shiftKey) {
              segments.forEach((s, sIdx) => {
                if (Math.hypot(s.point.x - primarySeg.point.x, s.point.y - primarySeg.point.y) < 1.5) {
                  selSet.add(sIdx);
                  s.point.x = primarySeg.point.x;
                  s.point.y = primarySeg.point.y;
                }
              });
            }

            let currentNodeType = primarySeg.nodeType;
            if (!currentNodeType) {
              if (primarySeg.handleIn.isZero() && primarySeg.handleOut.isZero()) {
                currentNodeType = 'sharp';
              } else if (!primarySeg.handleIn.isZero() && !primarySeg.handleOut.isZero()) {
                const dot = primarySeg.handleIn.normalize().dot(primarySeg.handleOut.normalize());
                if (dot < -0.90) {
                  currentNodeType = Math.abs(primarySeg.handleIn.length - primarySeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth';
                } else {
                  currentNodeType = 'custom';
                }
              } else {
                currentNodeType = 'custom';
              }
              primarySeg.nodeType = currentNodeType;
            }
            const distinctCount = getDistinctNodes(paperPath, selSet).length;
            const canJoin = checkCanJoinNodes(paperPath, selSet);
            window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: currentNodeType, segIdx: hitSegIdx, selectedCount: distinctCount, canJoin, isLineSelected: false } }));
          }

          nodeEditSelectedHandleSideRef.current = 'point';
          nodeEditSelectedCurveIdxRef.current = null;
          nodeEditSelectedSegIndicesRef.current = selSet;
          nodeEditSelectedSegIdxRef.current = hitSegIdx;
          if (nodeEditSplitSegIdxRef.current !== hitSegIdx) {
            nodeEditSplitSegIdxRef.current = null;
          }
          drawNodeEditOverlay(pathEl, paperPath, pageIndex);

          // Store initial local positions of all selected nodes for multi-node translation
          const startPoints = {};
          selSet.forEach(idx => {
            if (segments[idx]) {
              startPoints[idx] = segments[idx].point.clone();
            }
          });

          nodeEditDragRef.current = {
            mode: 'node',
            segIdx: hitSegIdx,
            handleSide: hitHandleSide,
            startPt: pt,
            startPoints,
            pathEl,
            paperPath,
            pageIndex
          };
        } else {
          // Double-click (e.detail === 2), Alt+Click, or Subtract tool on a top/bottom control handle retracts/deletes that handle point
          if (e.detail === 2 || e.altKey || selectedPenToolRef.current === 'subtract') {
            deleteSelectedNodeOrHandle(paperPath, [hitSegIdx], hitHandleSide, paperScopeRef.current);
            nodeEditSelectedHandleSideRef.current = 'point';
            nodeEditSelectedSegIdxRef.current = hitSegIdx;
            nodeEditSelectedSegIndicesRef.current = new Set([hitSegIdx]);
            const dStr = cleanPaperPathData(paperPath);
            pathEl.setAttribute('d', dStr);
            drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            if (svgEl && updatePageHtml) {
              saveModifiedPageHtml(pageIndex, svgEl);
            }
            suppressClickRef.current = true;
            e.stopPropagation();
            return;
          }

          nodeEditSelectedHandleSideRef.current = hitHandleSide;
          nodeEditSelectedSegIndicesRef.current = new Set([hitSegIdx]);
          nodeEditSelectedSegIdxRef.current = hitSegIdx;
          drawNodeEditOverlay(pathEl, paperPath, pageIndex);
          // Dispatch the actual nodeType of the segment (not always 'custom') to keep the correct button highlighted
          // NOTE: 'segments' is only declared in the 'point' branch above, so we re-fetch here
          const handleSegs = getPaperSegments(paperPath);
          const hitSeg = handleSegs[hitSegIdx];
          let hitNodeType = 'custom';
          if (hitSeg) {
            if (hitSeg.nodeType) {
              hitNodeType = hitSeg.nodeType;
            } else if (!hitSeg.handleIn.isZero() && !hitSeg.handleOut.isZero()) {
              const dot = hitSeg.handleIn.normalize().dot(hitSeg.handleOut.normalize());
              hitNodeType = (dot < -0.90)
                ? (Math.abs(hitSeg.handleIn.length - hitSeg.handleOut.length) < 4.0 ? 'balanced' : 'smooth')
                : 'custom';
            } else if (hitSeg.handleIn.isZero() && hitSeg.handleOut.isZero()) {
              hitNodeType = 'sharp';
            }
          }
          window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: hitNodeType, selectedCount: 1, canJoin: false, isLineSelected: false } }));

          nodeEditDragRef.current = {
            mode: 'handle',
            segIdx: hitSegIdx,
            handleSide: hitHandleSide,
            startPt: pt,
            pathEl,
            paperPath,
            pageIndex
          };
        }

        suppressClickRef.current = true;
        e.stopPropagation();
        return;
      }

      // Path-line proximity: Check if clicking near path curve segment
      // Use stored screen-space segment midpoints for reliable detection
      const SEG_HIT_RADIUS_PX = 25;
      let hitCurveIdx = -1;
      let hitSeg1Idx = -1;
      let hitSeg2Idx = -1;
      let segMinDist = SEG_HIT_RADIUS_PX;

      for (const seg of nodeEditScreenSegmentsRef.current) {
        // Also compute distance to nearest point along segment by sampling screen positions
        const dist = Math.hypot(e.clientX - seg.mx, e.clientY - seg.my);
        if (dist < segMinDist) {
          segMinDist = dist;
          hitCurveIdx = seg.curveIdx;
          hitSeg1Idx = seg.seg1Idx;
          hitSeg2Idx = seg.seg2Idx;
        }
      }

      // Fallback: use paper.js local distance if screen midpoints didn't find anything
      if (hitCurveIdx === -1) {
        try {
          const nearestLoc = paperPath.getNearestLocation(mousePt);
          if (nearestLoc && nearestLoc.curve) {
            const ctm = pathEl.getScreenCTM();
            const scale = ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
            const screenDist = nearestLoc.distance * scale;
            if (screenDist <= SEG_HIT_RADIUS_PX) {
              const curves = getPaperCurves(paperPath);
              const segments = getPaperSegments(paperPath);
              hitCurveIdx = curves.indexOf(nearestLoc.curve);
              hitSeg1Idx = segments.indexOf(nearestLoc.curve.segment1);
              hitSeg2Idx = segments.indexOf(nearestLoc.curve.segment2);
            }
          }
        } catch { /* ignored */ }
      }

      if (hitCurveIdx !== -1 && hitSeg1Idx !== -1 && hitSeg2Idx !== -1) {
        const curves = getPaperCurves(paperPath);
        const segments = getPaperSegments(paperPath);
        const curve = curves[hitCurveIdx];
        if (curve) {
          if (e.ctrlKey) {
            // Ctrl + drag on segment in Node Edit Mode: Bend the line into a curve!
            nodeEditDragRef.current = {
              mode: 'segment-bend',
              curveIndex: hitCurveIdx,
              startPt: pt,
              startHandle1: curve.segment1.handleOut.clone(),
              startHandle2: curve.segment2.handleIn.clone(),
              pathEl,
              paperPath,
              pageIndex
            };
          } else {
            // Regular click: select both endpoint nodes (plus co-located nodes) and allow moving the segment
            const selSet = new Set([hitSeg1Idx, hitSeg2Idx]);
            [hitSeg1Idx, hitSeg2Idx].forEach(idx => {
              if (segments[idx]) {
                const p = segments[idx].point;
                segments.forEach((s, sIdx) => {
                  if (Math.hypot(s.point.x - p.x, s.point.y - p.y) < 3.0) {
                    selSet.add(sIdx);
                    s.point.x = p.x;
                    s.point.y = p.y;
                  }
                });
              }
            });

            nodeEditSelectedHandleSideRef.current = 'line';
            nodeEditSelectedCurveIdxRef.current = hitCurveIdx;
            nodeEditSelectedSegIndicesRef.current = selSet;
            nodeEditSelectedSegIdxRef.current = hitSeg1Idx;
            drawNodeEditOverlay(pathEl, paperPath, pageIndex);
            const distinctCount = getDistinctNodes(paperPath, selSet).length;
            const canJoin = checkCanJoinNodes(paperPath, selSet);
            // Detect actual curve type from segment handles instead of always dispatching 'custom'
            const curveSeg1 = segments[hitSeg1Idx];
            let curveNodeType = 'custom';
            if (curveSeg1) {
              if (curveSeg1.nodeType) {
                curveNodeType = curveSeg1.nodeType;
              } else if (!curveSeg1.handleIn.isZero() && !curveSeg1.handleOut.isZero()) {
                const dot = curveSeg1.handleIn.normalize().dot(curveSeg1.handleOut.normalize());
                curveNodeType = (dot < -0.90)
                  ? (Math.abs(curveSeg1.handleIn.length - curveSeg1.handleOut.length) < 4.0 ? 'balanced' : 'smooth')
                  : 'custom';
              } else if (curveSeg1.handleIn.isZero() && curveSeg1.handleOut.isZero()) {
                curveNodeType = 'sharp';
              }
            }
            window.dispatchEvent(new CustomEvent('node-selected', { detail: { nodeType: curveNodeType, selectedCount: distinctCount, canJoin, isLineSelected: true } }));

            // Store initial positions of all segment endpoint nodes (and co-located nodes)
            const startPoints = {};
            selSet.forEach(idx => {
              if (segments[idx]) {
                startPoints[idx] = segments[idx].point.clone();
              }
            });

            nodeEditDragRef.current = {
              mode: 'segment-translate',
              curveIndex: hitCurveIdx,
              seg1Idx: hitSeg1Idx,
              seg2Idx: hitSeg2Idx,
              startPt: pt,
              startPoints,
              pathEl,
              paperPath,
              pageIndex
            };
          }
        }

        suppressClickRef.current = true;
        e.stopPropagation();
        return;
      }

      // Clicked outside all nodes and path → exit Node Edit Mode and select full path
      const pIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
      const targetPath = pathEl;
      const targetId = targetPath?.id;

      exitNodeEditMode();

      if (targetPath && targetId) {
        if (selectedLayerIdRef) selectedLayerIdRef.current = targetId;
        if (multiSelectedIdsRef) multiSelectedIdsRef.current = new Set([targetId]);
        if (setSelectedLayerId) setSelectedLayerId(targetId);
        if (setMultiSelectedIds) setMultiSelectedIds(new Set([targetId]));
        if (skipClearSelectionRef) skipClearSelectionRef.current = true;
        setTimeout(() => {
          const freshEl = document.getElementById(targetId) || targetPath;
          if (freshEl && drawOverlayHighlight) {
            drawOverlayHighlight(freshEl, 'selected');
          }
        }, 40);
      }

      if (targetPath && targetPath.ownerSVGElement && saveModifiedPageHtml) {
        saveModifiedPageHtml(pIdx, targetPath.ownerSVGElement);
      }

      suppressClickRef.current = true;
      e.stopPropagation();
      return;
    }



    // ── Creation Tool: Text (Type) Tool ─────────────────────────────────────────
    if (activeMainTool === 'type') {
      let parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;

      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      if (parentEl) {
        const id = `text-${Math.random().toString(36).substr(2, 9)}`;
        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        const ptToMmScale = 0.2645833333333333;
        fo.setAttribute('id', id);
        // Scale the local x,y,width,height inversely so it renders at the mouse cursor
        fo.setAttribute('x', pt.x / ptToMmScale);
        fo.setAttribute('y', pt.y / ptToMmScale);
        fo.setAttribute('width', '170');
        fo.setAttribute('height', '30');
        fo.setAttribute('transform', `matrix(${ptToMmScale} 0 0 ${ptToMmScale} 0 0)`);
        fo.setAttribute('fill', '#000000');
        fo.setAttribute('stroke', 'none');
        fo.setAttribute('stroke-width', '0');
        fo.setAttribute('font-family', "'Outfit', sans-serif");
        fo.setAttribute('font-size', '24');
        fo.setAttribute('letter-spacing', '0');
        fo.setAttribute('data-auto-wrap', 'false');
        fo.setAttribute('data-sizing-mode', 'auto-width');
        fo.setAttribute('data-type', 'text');

        const div = document.createElement('div');
        div.style.width = 'max-content'; // Allows scrollWidth to perfectly match text
        div.style.minHeight = '100%';
        div.style.color = '#000000';
        div.style.fontFamily = "'Outfit', sans-serif";
        div.style.fontSize = '24px';
        div.style.fontWeight = 'normal';
        div.style.fontStyle = 'normal';
        div.style.textDecoration = 'none';
        div.style.textAlign = 'left';
        div.style.lineHeight = '1.2';
        div.style.letterSpacing = '0px';
        div.style.wordBreak = 'normal';
        div.style.overflowWrap = 'anywhere';
        div.style.whiteSpace = 'nowrap'; // Auto-width defaults to no wrapping
        div.style.padding = '0px';
        div.style.margin = '0';
        div.style.boxSizing = 'border-box';
        div.style.outline = 'none';
        div.style.background = 'transparent';
        div.style.userSelect = 'none';
        div.style.pointerEvents = 'none';

        div.innerText = 'Type your text';
        fo.appendChild(div);

        parentEl.appendChild(fo);

        if (updatePageHtml) {
          saveModifiedPageHtml(pageIndex, svg);
          window.dispatchEvent(new CustomEvent('expand-layer-parent', { detail: { id: id } }));
          if (setActiveMainTool) setActiveMainTool('select');
          window.dispatchEvent(new CustomEvent('select-layer', { detail: { layerId: id } }));
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
            // Enter edit mode immediately for newly created text and fully select it
            enterTextEditMode(mountedText, null, null, true);
          }

          suppressClickRef.current = false;
        }, 100);

        suppressClickRef.current = true;
      }
      return;
    }

    // ── Pen/Pencil Tool Drawing (Only on Active Page) ─────────────────────────────
    if (activeMainTool === 'pen' && pageIndex === activePageIndex) {
      const currentPenTool = selectedPenToolRef?.current || selectedPenTool || 'pen';
      if (currentPenTool === 'pencil') {
        const parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
        if (!parentEl) return;
        const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const id = `pencil-${Math.random().toString(36).substr(2, 9)}`;
        path.setAttribute('id', id);
        path.setAttribute('data-type', 'vector-path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('shape-rendering', 'geometricPrecision');
        path.setAttribute('d', `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);

        parentEl.appendChild(path);
        drawingPathRef.current = path;
        drawingPointsRef.current = [{ x: pt.x, y: pt.y }];
        drawingPageIndexRef.current = pageIndex;
        drawingSvgRef.current = svg;
        isFreehandDrawingRef.current = true;
        suppressClickRef.current = true;
        return;
      }

      // Vectra Pen Tool
      const parentEl = resolveTargetParentForCreation(svg, e.clientX, e.clientY);
      if (!parentEl) return;
      const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);

      const vSession = vectraPenSessionRef.current;

      // Create or reuse an existing SVG <path> element for the Pen session
      let pathEl = drawingPathRef.current;
      if (!pathEl || !pathEl.parentElement || !pathEl.ownerSVGElement) {
        let existingTarget = nodeEditModeRef.current ? nodeEditPathRef.current : null;

        if (existingTarget && existingTarget.getAttribute('d')) {
          pathEl = existingTarget;
          drawingPathRef.current = pathEl;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;

          if (vSession.paths.size === 0) {
            loadDIntoVectraSession(pathEl.getAttribute('d'), vSession, paperScopeRef.current);
          }
        } else {
          const id = `vpath-${Math.random().toString(36).substr(2, 9)}`;
          pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathEl.setAttribute('id', id);
          pathEl.setAttribute('data-type', 'vector-path');
          pathEl.setAttribute('data-name', 'Vector Path');
          pathEl.setAttribute('fill', 'none');
          pathEl.setAttribute('stroke', '#000000');
          pathEl.setAttribute('stroke-width', '1');
          pathEl.setAttribute('stroke-linecap', 'round');
          pathEl.setAttribute('stroke-linejoin', 'round');
          pathEl.setAttribute('shape-rendering', 'geometricPrecision');
          parentEl.appendChild(pathEl);
          drawingPathRef.current = pathEl;
          drawingPageIndexRef.current = pageIndex;
          drawingSvgRef.current = svg;
        }
      }

      vSession.onDown(e, pt);

      // Update single <path> element's d attribute with ALL paths in vSession
      const comboD = pathToDCombo(vSession.paths);
      if (comboD) {
        pathEl.setAttribute('d', comboD);
      }

      // Render overlay showing ALL nodes for ALL paths currently in vSession
      renderVectraOverlay(pageIndex, pathEl.parentElement || parentEl, vSession);
      suppressClickRef.current = true;
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
          case 'free-frame':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', pt.x);
            shape.setAttribute('y', pt.y);
            shape.setAttribute('width', '0');
            shape.setAttribute('height', '0');
            break;
          case 'circle':
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shape.setAttribute('cx', pt.x);
            shape.setAttribute('cy', pt.y);
            shape.setAttribute('rx', '0');
            shape.setAttribute('ry', '0');
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
            shape.setAttribute('data-cx', pt.x);
            shape.setAttribute('data-cy', pt.y);
            shape.setAttribute('data-count', selectedShapeTool === 'polygon' ? '3' : '5');
            shape.setAttribute('data-ratio', '40');
            shape.setAttribute('data-shape-type', selectedShapeTool);
            break;
        }

        if (shape) {
          shape.setAttribute('id', id);
          if (selectedShapeTool === 'line') {
            shape.setAttribute('fill', 'none');
            shape.setAttribute('stroke', '#000000');
            shape.setAttribute('stroke-width', '1');
          } else if (selectedShapeTool === 'free-frame') {
            const zoomScale = zoom / 100;
            shape.setAttribute('fill', 'transparent');
            shape.setAttribute('stroke', '#000000');
            shape.setAttribute('stroke-width', String(1 / zoomScale));
            shape.removeAttribute('stroke-dasharray');
            shape.setAttribute('data-interaction', 'open-link');
            shape.setAttribute('data-interaction-value', '');
            shape.setAttribute('data-drawing', 'true');
          } else {
            shape.setAttribute('fill', '#d0ccff');
            shape.setAttribute('stroke', 'none');
            shape.setAttribute('stroke-width', '0');
          }
          shape.setAttribute('data-name', selectedShapeTool === 'free-frame' ? 'Free Frame' : `${selectedShapeTool} ${id.substr(0, 4)}`);
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

    if (!['select', 'upload', 'grid'].includes(activeMainTool)) return;

    // Automatically close the icon popup (which uses 'grid' tool) when interacting with the canvas
    if (activeMainTool === 'grid' && typeof setActiveMainTool === 'function') {
      setActiveMainTool('select');
    }

    // ── Update Active Page on MouseDown ─────────────────────────────────────
    if (setActivePageIndex && activePageIndex !== pageIndex) {
      setActivePageIndex(pageIndex);
    }


    // 1. Identify level candidates and check if click hit any (including gaps)
    let candidates = [];
    let effectiveFrameId = currentFrameIdRef.current;

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

    const topFrames = getTopLevelFrames(svg);
    if (!hitCandidate || topFrames.some(f => f.id === hitCandidate.id)) {
      const leafTarget = (svg && e.target && svg.contains && svg.contains(e.target)) ? getDraggableElement(e.target, svg) : null;
      if (leafTarget) {
        const leafIsBase = topFrames.some(f => f.id === leafTarget.id);
        if (!leafIsBase && leafTarget.getAttribute('data-name') !== 'Overlay') {
          hitCandidate = leafTarget;
        }
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

    let hitMultiSelectionGap = false;
    if (currentMultiIds.size > 1 && !hitAnySelected) {
      const pageContainer = e.currentTarget.closest('.page-svg-container');
      const multiPoly = pageContainer?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || pageContainer?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
      if (multiPoly) {
        const polyRect = multiPoly.getBoundingClientRect();
        if (e.clientX >= polyRect.left && e.clientX <= polyRect.right &&
          e.clientY >= polyRect.top && e.clientY <= polyRect.bottom) {
          hitMultiSelectionGap = true;
        }
      }
    }

    const hitBaseFrame = hitCandidate && topFrames.some(f => f.id === hitCandidate.id);

    // 2. Selection/Drag Priority
    // If we hit any valid child candidate OR any already-selected element OR the multi-selection gap, 
    // don't start a marquee. Return early to allow interactjs to handle dragging.
    if ((hitCandidate && !hitBaseFrame || hitAnySelected || hitMultiSelectionGap) && !e.ctrlKey && selectedSelectToolRef.current !== 'direct') {
      return;
    }

    // 3. Marquee Start Detection
    let hitSelectedImage = false;
    if (hitAnySelected && currentMultiIds.size === 1) {
      const id = Array.from(currentMultiIds)[0];
      const el = svg.querySelector(`[id="${id}"]`);
      if (el && (el.getAttribute('data-type') === 'image' || el.tagName.toLowerCase() === 'image')) {
        hitSelectedImage = true;
      }
    }

    // Start marquee if user holds Ctrl (unless clicking a selected image) OR if they clicked on the background/base frame
    // (Also start if Shift is held so Shift+Drag can draw marquee over elements without Ctrl)
    // Converted flipbooks / Interaction & Animation modules: NEVER start marquee drag-selection
    const isModuleWithoutMarquee = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    const shouldStartMarquee = !isModuleWithoutMarquee && !isConvertedFlipbook && (((e.ctrlKey || e.shiftKey) && !hitSelectedImage) || ((!hitCandidate || hitBaseFrame) && selectedSelectToolRef.current !== 'direct' && !isEditingTextRef.current));

    if (shouldStartMarquee) {
      const rect = container.getBoundingClientRect();
      const scale = zoom / 100;
      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;

      marqueeDataRef.current = { startX, startY, containerRect: rect, scale, startClientX: e.clientX, startClientY: e.clientY };

      // Cache candidates and their bounding boxes for the marquee operation
      const isInteractiveTool = activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
      let marqueeCandidates = candidates.filter(el => {
        const isFreeFrame = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame' || el.id?.startsWith('free-frame');
        if (isFreeFrame && !isInteractiveTool) return false;

        const isOverlay = el.getAttribute('data-name') === 'Overlay';
        const isBasePage = topFrames.some(f => f.id === el.id);
        const isPdfBg = el.getAttribute('data-name')?.includes('PDF Background') || el.getAttribute('data-type') === 'pdf-vector-layer';
        const isShield = el.getAttribute('data-name') === 'Document Shield' || el.getAttribute('data-type') === 'shield';
        if (isConvertedFlipbook) {
          const isHotspot = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
          const isFreeFrameCandidate = isFreeFrame && isInteractiveTool;
          const isShape = el.getAttribute('data-type') === 'shape' && !isFreeFrame;
          const isIcon = el.getAttribute('data-type') === 'icon';
          return isHotspot || isFreeFrameCandidate || isShape || isIcon;
        }
        return !isOverlay && !isBasePage && !isPdfBg && !isShield;
      });

      marqueeCandidatesRef.current = marqueeCandidates.map(el => ({
        id: el.id,
        rect: el.getBoundingClientRect()
      }));

      setMarquee({ pageIndex });
      if (marqueeRef) marqueeRef.current = { pageIndex };
      e._handledMarquee = true;

      const activeRef = marqueeOverlayRef1; // Single page is always container 1
      if (activeRef.current) {
        activeRef.current.style.display = 'none';
        const rectEl = activeRef.current.querySelector ? activeRef.current.querySelector('rect') : null;
        if (rectEl) {
          rectEl.setAttribute('x', String(startX));
          rectEl.setAttribute('y', String(startY));
          rectEl.setAttribute('width', '0');
          rectEl.setAttribute('height', '0');
          rectEl.setAttribute('stroke-width', (1 / scale).toFixed(3));
        } else {
          Object.assign(activeRef.current.style, {
            borderWidth: `${(1 / scale).toFixed(3)}px`,
            left: `${startX}px`,
            top: `${startY}px`,
            width: '0px',
            height: '0px'
          });
        }
      }
      return;
    }
  };

  // ── FIGMA-STYLE MOUSE MOVE: hover highlight & Marquee update ─────────────────
  const handleSvgMouseMove = (pageIndex, e) => {
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, target: e.target };
    if (isAltPressedRef.current && selectedLayerIdRef.current) {
      if (drawMeasurementOverlayRef.current && !document.querySelector('[data-dragging="true"]')) {
        drawMeasurementOverlayRef.current(e.target);
      }
    }

    // ── NODE EDIT MODE: Drag node(s), handle, or line segment ─────────────────
    if (nodeEditDragRef.current) {
      const { mode, segIdx, handleSide, pathEl, paperPath, startPt, startPoints, curveIndex, startHandle1, startHandle2 } = nodeEditDragRef.current;
      const svgEl = pathEl.ownerSVGElement;
      if (!svgEl) return;
      const pt = getLocalPoint(svgEl, pathEl, e.clientX, e.clientY);
      paperScopeRef.current.activate();
      const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);
      const delta = mousePoint.subtract(new paperScopeRef.current.Point(startPt.x, startPt.y));

      if (mode === 'node') {
        if (startPoints && Object.keys(startPoints).length > 0) {
          Object.keys(startPoints).forEach(sIdxStr => {
            const sIdx = parseInt(sIdxStr);
            const seg = paperPath?.segments?.[sIdx];
            if (seg && startPoints[sIdx]) {
              seg.point = startPoints[sIdx].add(delta);
            }
          });
        } else {
          const seg = paperPath?.segments?.[segIdx];
          if (seg) seg.point = mousePoint;
        }
      } else if (mode === 'handle') {
        const seg = paperPath?.segments?.[segIdx];
        if (seg) {
          applyHandleDrag(seg, handleSide, mousePoint, e.altKey);
        }
      } else if (mode === 'segment-bend') {
        const curve = paperPath?.curves?.[curveIndex];
        if (curve && startHandle1 && startHandle2) {
          curve.segment1.handleOut = startHandle1.add(delta.multiply(0.5));
          curve.segment2.handleIn = startHandle2.add(delta.multiply(-0.5));
        }
      }

      if (paperPath?.pathData) {
        pathEl.setAttribute('d', paperPath.pathData);
        drawNodeEditOverlay(pathEl, paperPath, nodeEditPageIndexRef.current);
      }
      suppressClickRef.current = true;
      return;
    }

    // ── NODE EDIT MODE: Hover Segment Highlight ────────────────
    if (nodeEditModeRef.current && nodeEditPathRef.current && nodeEditPaperPathRef.current && !nodeEditDragRef.current && activeMainTool !== 'pen') {
      const SEG_HIT_RADIUS_PX = 22;
      let hoverCurveIdx = -1;
      let minSegDist = SEG_HIT_RADIUS_PX;

      for (const seg of nodeEditScreenSegmentsRef.current) {
        const dist = Math.hypot(e.clientX - seg.mx, e.clientY - seg.my);
        if (dist < minSegDist) {
          minSegDist = dist;
          hoverCurveIdx = seg.curveIdx;
        }
      }

      if (hoverCurveIdx !== nodeEditHoverCurveIdxRef.current) {
        nodeEditHoverCurveIdxRef.current = hoverCurveIdx;
        drawNodeEditOverlay(nodeEditPathRef.current, nodeEditPaperPathRef.current, nodeEditPageIndexRef.current);
      }
    }

    // ── Ctrl + Click Bending Update ──
    if (bendingStateRef.current) {
      const { pathEl, paperPath, curveIndex, pageIndex: activePageIdx } = bendingStateRef.current;
      const svg = pathEl.ownerSVGElement;
      const pt = getLocalPoint(svg, pathEl, e.clientX, e.clientY);

      paperScopeRef.current.activate();
      const curve = paperPath?.curves?.[curveIndex];
      if (curve) {
        const mousePoint = new paperScopeRef.current.Point(pt.x, pt.y);

        // Symmetrical bending logic: point handles towards mouse
        const p1 = curve.segment1.point;
        const p2 = curve.segment2.point;

        // Factor of 0.45 creates a natural-looking bow that passes near the cursor
        curve.segment1.handleOut = mousePoint.subtract(p1).multiply(0.45);
        curve.segment2.handleIn = mousePoint.subtract(p2).multiply(0.45);

        pathEl.setAttribute('d', paperPath.pathData);
      }
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

    // ── Freehand Pencil Update (During Drag) ──────────
    if (isFreehandDrawingRef.current && drawingPathRef.current) {
      const svg = drawingSvgRef.current || (e.currentTarget.closest('.page-svg-container')?.querySelector('svg'));
      if (!svg) return;
      const pt = getLocalPoint(svg, drawingPathRef.current.parentElement, e.clientX, e.clientY);

      const lastPt = drawingPointsRef.current[drawingPointsRef.current.length - 1];
      if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 1.5) return;

      drawingPointsRef.current.push(pt);
      const d = formatSmoothPathD(drawingPointsRef.current);
      drawingPathRef.current.setAttribute('d', d);
      suppressClickRef.current = true;
      return;
    }

    // ── Vectra Pen Tool Update & Hover Preview ──────────
    const currentPenTool = selectedPenToolRef?.current || selectedPenTool || 'pen';
    if (activeMainTool === 'pen' && currentPenTool === 'pen') {
      const pageContainer = e.currentTarget.closest('.page-svg-container');
      const svg = drawingSvgRef.current || (pageContainer?.querySelector('svg')) || e.currentTarget.querySelector('svg');
      if (svg) {
        const parentEl = drawingPathRef.current?.parentElement || resolveTargetParentForCreation(svg, e.clientX, e.clientY);
        if (parentEl) {
          const pt = getLocalPoint(svg, parentEl, e.clientX, e.clientY);
          const vSession = vectraPenSessionRef.current;
          vSession.scale = zoom / 100;

          if (e.buttons & 1) {
            vSession.onDrag(e, pt);
          } else {
            vSession.onHover(e, pt);
          }

          const pathEl = drawingPathRef.current;
          if (pathEl) {
            const comboD = pathToDCombo(vSession.paths);
            if (comboD) pathEl.setAttribute('d', comboD);
          }

          if (pageContainer) {
            pageContainer.classList.remove('cur-pen-close', 'cur-pen-extend', 'cur-snap');
            if (vSession.cursor && vSession.cursor !== 'cur-pen') {
              pageContainer.classList.add(vSession.cursor);
            }
          }

          const targetPageIndex = (drawingPageIndexRef.current !== null && drawingPageIndexRef.current !== undefined)
            ? drawingPageIndexRef.current
            : pageIndex;
          renderVectraOverlay(targetPageIndex, parentEl, vSession);
        }
      }
      suppressClickRef.current = true;
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
          case 'free-frame': {
            let width = Math.abs(dx);
            let height = Math.abs(dy);
            if (e.shiftKey) {
              const maxDim = Math.max(width, height);
              width = maxDim;
              height = maxDim;
            }
            shape.setAttribute('x', dx < 0 ? start.x - width : start.x);
            shape.setAttribute('y', dy < 0 ? start.y - height : start.y);
            shape.setAttribute('width', width);
            shape.setAttribute('height', height);
            break;
          }
          case 'circle': {
            let rx = Math.abs(dx);
            let ry = Math.abs(dy);
            if (e.shiftKey) {
              const maxR = Math.max(rx, ry);
              rx = maxR;
              ry = maxR;
            }
            shape.setAttribute('rx', rx);
            shape.setAttribute('ry', ry);
            break;
          }
          case 'line': {
            if (e.shiftKey) {
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);

              let newDx = 0, newDy = 0;
              if (absDx >= absDy) {
                newDx = dx;
                newDy = 0;
              } else {
                newDx = 0;
                newDy = dy;
              }
              shape.setAttribute('x2', start.x + newDx);
              shape.setAttribute('y2', start.y + newDy);
            } else {
              shape.setAttribute('x2', pt.x);
              shape.setAttribute('y2', pt.y);
            }
            break;
          }
          case 'polygon': {
            const radius = Math.sqrt(dx * dx + dy * dy);
            const sides = parseInt(shape.getAttribute('data-count') || 3);
            const points = [];
            for (let i = 0; i < sides; i++) {
              const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
              points.push(`${start.x + radius * Math.cos(angle)},${start.y + radius * Math.sin(angle)}`);
            }
            shape.setAttribute('d', `M ${points.join(' L ')} Z`);
            shape.setAttribute('data-rx', radius);
            shape.setAttribute('data-ry', radius);
            break;
          }
          case 'star': {
            const rOuter = Math.sqrt(dx * dx + dy * dy);
            const ratio = parseFloat(shape.getAttribute('data-ratio') || 40) / 100;
            const rInner = rOuter * ratio;
            const count = parseInt(shape.getAttribute('data-count') || 5);
            const sides = count * 2;
            const points = [];
            for (let i = 0; i < sides; i++) {
              const r = (i % 2 === 0) ? rOuter : rInner;
              const angle = (Math.PI / count) * i - Math.PI / 2;
              points.push(`${start.x + r * Math.cos(angle)},${start.y + r * Math.sin(angle)}`);
            }
            shape.setAttribute('d', `M ${points.join(' L ')} Z`);
            shape.setAttribute('data-rx', rOuter);
            shape.setAttribute('data-ry', rOuter);
            break;
          }
        }
        suppressClickRef.current = true;
      }
      return;
    }

    const isPenToolActive = activeMainTool === 'pen';
    const isShapes = activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload', 'grid'].includes(activeMainTool);
    const allowSelection = isSelectionTool || ((isPenToolActive || isShapes) && pageIndex !== activePageIndex);

    if (!allowSelection) return;
    if (document.querySelector('[data-dragging="true"]')) return;

    // ── MARQUEE UPDATE ──
    const isModuleWithoutMarquee = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    if ((e.buttons & 1) === 0 && (marqueeRef.current || marqueeDataRef.current)) {
      cleanupMarquee();
      return;
    }
    if (marqueeDataRef.current && marqueeDataRef.current.containerRect && !isConvertedFlipbook && !isModuleWithoutMarquee) {
      const { startX, startY, containerRect, scale } = marqueeDataRef.current;
      const curX = (e.clientX - containerRect.left) / scale;
      const curY = (e.clientY - containerRect.top) / scale;

      if (!marqueeDataRef.current.hasDragged) {
        const dx = curX - startX;
        const dy = curY - startY;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          return;
        }
        marqueeDataRef.current.hasDragged = true;
        // Keep the scaled SVG overlay hidden; the crisp screen-space box is used instead
        if (marqueeOverlayRef1.current) {
          marqueeOverlayRef1.current.style.display = 'none';
        }
      }

      const x = Math.min(curX, startX);
      const y = Math.min(curY, startY);
      const width = Math.abs(curX - startX);
      const height = Math.abs(curY - startY);

      // Direct DOM update for marquee box in unscaled screen space (pixel-snapped, crisp 1px border)
      const { startClientX, startClientY } = marqueeDataRef.current;
      const sx = startClientX ?? (containerRect.left + startX * scale);
      const sy = startClientY ?? (containerRect.top + startY * scale);
      updateScreenMarqueeBox(sx, sy, e.clientX, e.clientY);

      updateMarqueeSelection(x, y, width, height, containerRect, scale);
      return;
    }

    const container = (e.currentTarget && typeof e.currentTarget.querySelector === 'function')
      ? e.currentTarget
      : (document.getElementById(`canvas-content-${pageIndex}`) || document.querySelector(`[data-page-index="${pageIndex}"]`));
    const svg = container?.querySelector('svg');
    if (!svg) return;

    // Clear all hover states
    svg.querySelectorAll('[data-hovered="true"]').forEach(el => el.removeAttribute('data-hovered'));
    svg.querySelectorAll('[data-child-hovered="true"]').forEach(el => el.removeAttribute('data-child-hovered'));
    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // ── Converted Flipbook Mode (PDF, DOC, PPT): Only hover user-added Frames or Hotspots ──
    if (isConvertedFlipbook) {
      let hoverTarget = null;
      let curr = e.target;
      const isInteractiveTool = activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
      while (curr && curr !== svg) {
        if (curr.getAttribute) {
          const isHotspot = curr.getAttribute('data-is-hotspot') === 'true' || curr.getAttribute('data-type') === 'hotspot';
          const isFreeFrame = (curr.getAttribute('data-name') === 'Free Frame' || curr.getAttribute('data-type') === 'free-frame' || curr.id?.startsWith('free-frame')) && isInteractiveTool;
          const isShape = curr.getAttribute('data-type') === 'shape' && curr.getAttribute('data-name') !== 'Free Frame' && curr.getAttribute('data-type') !== 'free-frame' && !curr.id?.startsWith('free-frame');
          const isIcon = curr.getAttribute('data-type') === 'icon';
          const isShield = curr.getAttribute('data-name') === 'Document Shield' || curr.getAttribute('data-type') === 'shield';
          if (isShield) {
            hoverTarget = null;
            break;
          }
          if (isHotspot || isFreeFrame || isShape || isIcon) {
            hoverTarget = curr;
            break;
          }
        }
        curr = curr.parentElement || curr.parentNode;
      }

      if (hoverTarget && hoverTarget.id && selectedLayerIdRef.current !== hoverTarget.id) {
        hoverTarget.setAttribute('data-hovered', 'true');
        drawOverlayHighlight(hoverTarget, 'hover');
      }
      return;
    }

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

    const effectiveFrameId = currentFrameIdRef.current;

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
      multiSelectedIdsRef.current = newSelectedIds;
      setMultiSelectedIds(newSelectedIds);
      const primary = Array.from(newSelectedIds)[newSelectedIds.size - 1];
      selectedLayerIdRef.current = primary || null;
      setSelectedLayerId(primary || null);
    }
  };

  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee) ─────────────────────
  // ── FIGMA-STYLE GLOBAL MOUSE UP (Handles end of marquee or tool drawing) ────────────────
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      // ── Node Edit Mode: Finalize node drag ──
      if (nodeEditDragRef.current) {
        const { pathEl, pageIndex: nePageIndex } = nodeEditDragRef.current;
        nodeEditDragRef.current = null;
        if (pathEl && pathEl.ownerSVGElement && updatePageHtml) {
          saveModifiedPageHtml(nePageIndex, pathEl.ownerSVGElement);
        }
        setTimeout(() => { suppressClickRef.current = false; }, 50);
        return;
      }

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

      const currentPenTool = selectedPenToolRef?.current || selectedPenTool || 'pen';
      if (activeMainTool === 'pen' && currentPenTool === 'pen') {
        const vSession = vectraPenSessionRef.current;
        vSession.onUp();
        if (drawingPathRef.current) {
          const comboD = pathToDCombo(vSession.paths);
          if (comboD) drawingPathRef.current.setAttribute('d', comboD);
          if (drawingPathRef.current.parentElement) {
            const targetPageIndex = (drawingPageIndexRef.current !== null && drawingPageIndexRef.current !== undefined)
              ? drawingPageIndexRef.current
              : activePageIndex;
            renderVectraOverlay(targetPageIndex, drawingPathRef.current.parentElement, vSession);
          }
        }
      }

      // Termination for drag-based pen tools (Pencil)
      if (drawingPathRef.current) {
        const points = drawingPointsRef.current;
        const tool = selectedPenToolRef?.current || selectedPenTool;

        draggedNodeIndexRef.current = { pIdx: -1, ptIdx: -1 };

        if (tool === 'pencil') {
          const path = drawingPathRef.current;
          const pageIdx = drawingPageIndexRef.current;
          const svgEl = path?.ownerSVGElement;

          if (points.length <= 1 && path) {
            const pt = points[0] || { x: 0, y: 0 };
            path.setAttribute('d', `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} L ${(pt.x + 0.1).toFixed(2)} ${pt.y.toFixed(2)}`);
          } else if (points.length > 1 && path) {
            const simplified = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
            const ptsToUse = simplified.length > 2 ? simplified : points;
            const pathData = formatSmoothPathD(ptsToUse);
            path.setAttribute('d', pathData);
          }
          path?.setAttribute('shape-rendering', 'geometricPrecision');

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
          isFreehandDrawingRef.current = false;
          clearPenToolNodes(pageIdx);
        }

        return;
      }

      // Termination for Shape tools
      if (drawingShapeRef.current) {
        const shape = drawingShapeRef.current;
        const pageIdx = drawingPageIndexRef.current;
        const svgEl = shape?.ownerSVGElement;

        if (shape.getAttribute('data-name') === 'Free Frame') {
          shape.removeAttribute('data-drawing');
          shape.removeAttribute('stroke-dasharray');
        }

        const start = shapeStartPointRef.current;
        if (start && svgEl && e) {
          const pt = getSvgPoint(svgEl, e.clientX, e.clientY);
          if (pt && Math.hypot(pt.x - start.x, pt.y - start.y) < 2) {
            const type = shape.getAttribute('data-shape-type') || shape.tagName.toLowerCase();

            if (type === 'rect' || type === 'free-frame' || shape.tagName.toLowerCase() === 'rect') {
              shape.setAttribute('x', start.x - 15);
              shape.setAttribute('y', start.y - 15);
              shape.setAttribute('width', 30);
              shape.setAttribute('height', 30);
            } else if (type === 'circle' || type === 'ellipse' || shape.tagName.toLowerCase() === 'ellipse') {
              shape.setAttribute('cx', start.x);
              shape.setAttribute('cy', start.y);
              shape.setAttribute('rx', 15);
              shape.setAttribute('ry', 15);
            } else if (type === 'line' || shape.tagName.toLowerCase() === 'line') {
              shape.setAttribute('x1', start.x - 15);
              shape.setAttribute('y1', start.y - 15);
              shape.setAttribute('x2', start.x + 15);
              shape.setAttribute('y2', start.y + 15);
            } else if (type === 'polygon' || type === 'star') {
              const radius = 15;
              const isStar = type === 'star';
              const count = isStar ? parseInt(shape.getAttribute('data-count') || 5) : parseInt(shape.getAttribute('data-count') || 3);
              const sides = isStar ? count * 2 : count;
              const points = [];
              for (let i = 0; i < sides; i++) {
                let r = radius;
                if (isStar && i % 2 !== 0) {
                  const ratio = parseFloat(shape.getAttribute('data-ratio') || 40) / 100;
                  r = radius * ratio;
                }
                const angle = (isStar ? (Math.PI / count) : (2 * Math.PI / count)) * i - Math.PI / 2;
                points.push(`${start.x + r * Math.cos(angle)},${start.y + r * Math.sin(angle)}`);
              }
              shape.setAttribute('d', `M ${points.join(' L ')} Z`);
              shape.setAttribute('data-rx', radius);
              shape.setAttribute('data-ry', radius);
            }
          }
        }

        // Store original aspect ratio
        try {
          if (shape && typeof shape.getBBox === 'function') {
            const bbox = shape.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
              shape.setAttribute('data-original-aspect-ratio', (bbox.width / bbox.height).toString());
            } else {
              shape.setAttribute('data-original-aspect-ratio', '1');
            }
          }
        } catch {
          // ignore error if getBBox fails
        }

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
      if (marqueeDataRef.current || marqueeRef.current) {
        cleanupMarquee();
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (marqueeDataRef.current && (e.buttons & 1) !== 0) {
        handleSvgMouseMove(activePageIndex, e);
      } else if (marqueeDataRef.current && (e.buttons & 1) === 0) {
        cleanupMarquee();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('pointerup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('pointerup', handleGlobalMouseUp);
    };
  }, [selectedPenTool, activeMainTool, updatePageHtml, setActiveMainTool, setSelectedLayerId]);

  // ── FIGMA-STYLE MOUSE LEAVE: clear all hovers ─────────────────────────────────
  const handleSvgMouseLeave = (e) => {
    if ((e.buttons & 1) === 0 && (marqueeDataRef.current || marqueeRef.current)) {
      cleanupMarquee();
    }
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
    if (id) {
      const el = document.getElementById(id);
      const isFreeFrame = el ? (
        el.getAttribute('data-name') === 'Free Frame' ||
        el.getAttribute('data-type') === 'free-frame' ||
        (el.id && el.id.startsWith('free-frame'))
      ) : id.startsWith('free-frame');
      if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') {
        return;
      }
    }

    if (setSelectedLayerId) {
      setSelectedLayerId(id);
      selectedLayerIdRef.current = id;
    }

    const newSet = id ? new Set([id]) : new Set();
    multiSelectedIdsRef.current = newSet;
    setMultiSelectedIds(newSet);

    if (newSet.size <= 1) {
      document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    }

    // ── Figma-style: auto-convert <text> to <foreignObject> on first selection ──
    // This ensures resize handles, click-to-edit, and style panel all work correctly
    if (id) {
      const el = document.getElementById(id);
      if (el && el.tagName.toLowerCase() === 'text') {
        const fo = convertTextToForeignObject(el);
        if (fo) {
          el.replaceWith(fo);

          // Auto-snap height to perfectly fit the HTML text
          requestAnimationFrame(() => {
            const div = fo.firstElementChild;
            if (div) {
              const ch = div.scrollHeight;
              const currentH = parseFloat(fo.getAttribute('height')) || 0;

              if (ch > 0 && Math.abs(ch - currentH) > 2) {
                fo.setAttribute('height', ch);
              }

              // Force interact.js/overlays to redraw bounds
              const event = new Event('resize');
              window.dispatchEvent(event);

              // Explicitly redraw the highlight now that the FO has painted
              drawOverlayHighlight(fo, 'selected');
            }
          });

          // Save the conversion so it persists
          const svg = fo.ownerSVGElement;
          const container = fo.closest('.page-svg-container');
          if (container && svg) {
            const pageIdx = parseInt(container.getAttribute('data-page-index'));
            // Use a microtask so React state settles before saving
            requestAnimationFrame(() => saveModifiedPageHtml(pageIdx, svg));
          }
        }
      }
    }
  };


  // ── Modular Hook Call: Inline ForeignObject Text Editor & Spell Checker ──
  const { enterTextEditMode } = useInlineTextEditor({
    isEditingTextRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    activeMainToolRef,
    selectedPenToolRef,
    suppressClickRef,
    currentFrameIdRef,
    activeTopTool,
    activePageIndex,
    pages,
    setSelectedLayerId,
    setMultiSelectedIds,
    setCurrentFrameId,
    drawOverlayHighlight,
    saveModifiedPageHtml
  });

  // ── FIGMA-STYLE CLICK: hierarchical frame drill-down selection ─────────────────
  const handleSvgClick = (e) => {
    if (e.target.closest('.resize-handle')) return;

    // Allow native text selection/interaction inside actively edited text boxes
    if (e.target.closest('[contenteditable="true"]')) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    e.preventDefault(); // Prevent default browser actions (like following <a> links or downloading) on the canvas

    const now = Date.now();
    const timeSinceLast = now - (lastClickRef.current.time || 0);
    const dx = e.clientX - (lastClickRef.current.x || 0);
    const dy = e.clientY - (lastClickRef.current.y || 0);
    const distance = Math.hypot(dx, dy);

    // A double click must happen within 500ms AND the mouse must not have moved more than 10 pixels
    const isDoubleClick = timeSinceLast > 0 && timeSinceLast < 500 && distance < 10;

    lastClickRef.current = { time: now, target: e.target, x: e.clientX, y: e.clientY };

    if (isDoubleClick) {
      if (activeMainTool === 'pen' && (drawingPathRef.current || vectraPenSessionRef.current?.paths?.size > 0)) {
        const vSession = vectraPenSessionRef.current;
        if (vSession) vSession.finishPath();
        commitAndExitPenDrawing();
        if (typeof setActiveMainTool === 'function') {
          setActiveMainTool('select');
        }
        suppressClickRef.current = false;
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

    // ── Converted Flipbook Mode (PDF, DOC, PPT): Avoid clicking any path or full page! Only select Frames or Hotspots ──
    if (isConvertedFlipbook) {
      let interactiveTarget = null;
      const isInteractiveTool = activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';

      // Check if clicking an overlay polygon for a selected element
      if (e.target.tagName?.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
        const polyId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');
        const underEl = svg.querySelector(`[id="${polyId}"]`);
        if (underEl) {
          const isHotspot = underEl.getAttribute('data-is-hotspot') === 'true' || underEl.getAttribute('data-type') === 'hotspot';
          const isFreeFrame = (underEl.getAttribute('data-name') === 'Free Frame' || underEl.getAttribute('data-type') === 'free-frame' || underEl.id?.startsWith('free-frame')) && isInteractiveTool;
          const isShape = underEl.getAttribute('data-type') === 'shape' && underEl.getAttribute('data-name') !== 'Free Frame' && underEl.getAttribute('data-type') !== 'free-frame' && !underEl.id?.startsWith('free-frame');
          const isIcon = underEl.getAttribute('data-type') === 'icon';
          if (isHotspot || isFreeFrame || isShape || isIcon) {
            interactiveTarget = underEl;
          }
        }
      }

      if (!interactiveTarget) {
        let curr = e.target;
        while (curr && curr !== svg) {
          if (curr.getAttribute) {
            const isHotspot = curr.getAttribute('data-is-hotspot') === 'true' || curr.getAttribute('data-type') === 'hotspot';
            const isFreeFrame = (curr.getAttribute('data-name') === 'Free Frame' || curr.getAttribute('data-type') === 'free-frame' || curr.id?.startsWith('free-frame')) && isInteractiveTool;
            const isShape = curr.getAttribute('data-type') === 'shape' && curr.getAttribute('data-name') !== 'Free Frame' && curr.getAttribute('data-type') !== 'free-frame' && !curr.id?.startsWith('free-frame');
            const isIcon = curr.getAttribute('data-type') === 'icon';
            const isShield = curr.getAttribute('data-name') === 'Document Shield' || curr.getAttribute('data-type') === 'shield';
            if (isShield) {
              interactiveTarget = null;
              break;
            }
            if (isHotspot || isFreeFrame || isShape || isIcon) {
              interactiveTarget = curr;
              break;
            }
          }
          curr = curr.parentElement || curr.parentNode;
        }
      }

      if (interactiveTarget && interactiveTarget.id) {
        setSingleSelection(interactiveTarget.id);
      } else {
        // Clear selection: avoid clicking any path or full page!
        setSingleSelection(null);
        setCurrentFrameId(null);
        currentFrameIdRef.current = null;
      }
      return;
    }

    // ── Pre-empt polygon clicks (hit area padding) ─────────────────────────────
    let hitMultiSelectionGap = false;
    const currentMultiIds = multiSelectedIdsRef.current;
    if (currentMultiIds.size > 1) {
      const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
      if (multiPoly) {
        const polyRect = multiPoly.getBoundingClientRect();
        if (e.clientX >= polyRect.left && e.clientX <= polyRect.right &&
          e.clientY >= polyRect.top && e.clientY <= polyRect.bottom) {
          hitMultiSelectionGap = true;
        }
      }
    }

    if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
      const polySelectionId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');

      if (polySelectionId === 'multi' || polySelectionId === 'multi-selection-bounds') {
        return;
      }

      if (polySelectionId) {
        const clickedEl = svg.querySelector(`[id="${polySelectionId}"]`);
        const isFreeFrame = clickedEl ? (
          clickedEl.getAttribute('data-name') === 'Free Frame' ||
          clickedEl.getAttribute('data-type') === 'free-frame' ||
          (clickedEl.id && clickedEl.id.startsWith('free-frame'))
        ) : polySelectionId.startsWith('free-frame');
        if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') {
          return;
        }
        if (e.shiftKey && !e.ctrlKey) {
          const currentSet = new Set(multiSelectedIdsRef.current);
          const primaryId = selectedLayerIdRef.current;
          if (primaryId) currentSet.add(primaryId);
          if (currentSet.has(polySelectionId)) {
            currentSet.delete(polySelectionId);
            if (primaryId === polySelectionId) {
              const remaining = [...currentSet];
              const newPrimary = remaining.length > 0 ? remaining[remaining.length - 1] : null;
              if (setSelectedLayerId) {
                setSelectedLayerId(newPrimary);
                selectedLayerIdRef.current = newPrimary;
              }
            }
          } else {
            currentSet.add(polySelectionId);
            if (setSelectedLayerId) {
              setSelectedLayerId(polySelectionId);
              selectedLayerIdRef.current = polySelectionId;
            }
          }
          multiSelectedIdsRef.current = currentSet;
          setMultiSelectedIds(currentSet);
          return;
        }

        // Normal click on polygon
        if (selectedLayerIdRef.current === polySelectionId && multiSelectedIdsRef.current.size <= 1) {
          // Already uniquely selected. Enter text edit mode if text!
          console.log('[handleSvgClick] Polygon clicked for already selected item:', polySelectionId);
          const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
          if (underlyingEl && (underlyingEl.tagName.toLowerCase() === 'text' || underlyingEl.tagName.toLowerCase() === 'tspan' || underlyingEl.tagName.toLowerCase() === 'foreignobject')) {
            console.log('[handleSvgClick] Entering text edit mode for', underlyingEl);
            enterTextEditMode(underlyingEl, e.clientX, e.clientY);
          }
          return;
        }

        // Otherwise, select it
        setSingleSelection(polySelectionId);

        // Enter frame context if the element is inside a frame
        const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
        if (underlyingEl) {
          const topFrames = getTopLevelFrames(svg);
          const frameParent = topFrames.find(f => f.contains(underlyingEl));
          if (frameParent) {
            setCurrentFrameId(frameParent.id);
            currentFrameIdRef.current = frameParent.id;
          }
        }
        return;
      }
    }

    // ── Creation Tool: Text (Type) Tool logic removed (moved to mousedown) ──────


    // ── CLICK-OUTSIDE-PREVENTION (if in tools like pen/shapes but not typing) ───
    const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
    const isDrawingTool = activeMainTool === 'pen' || activeMainTool === 'shapes';
    const isSelectionTool = ['select', 'upload', 'type', 'grid'].includes(activeMainTool);
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

    const effectiveFrameId = frameId;

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
            const polySelectionId = e.target.id.replace(/^overlay-poly-(selected|child-selected|hover|child-hover|entered|multi-child-selected)-/, '');
            const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
            if (underlyingEl) {
              const isFreeFrame = underlyingEl.getAttribute('data-name') === 'Free Frame' || underlyingEl.getAttribute('data-type') === 'free-frame' || underlyingEl.id?.startsWith('free-frame');
              if (!(isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation')) {
                target = underlyingEl;
              }
            }
          }

          if (target && target !== frameEl && frameEl.contains(target)) {
            setSingleSelection(target.id);
            // Persist auto-assigned ids (e.g. template text with no id) immediately
            if (target.tagName?.toLowerCase() === 'text') {
              saveModifiedPageHtml(pageIdx, svg);
            }
            return;
          }

          // 1. STICKY SELECTION PRIORITY: If clicking near the already-selected element, keep it selected!
          const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
          if (activeSel && frameEl.contains(activeSel) && hitTest(activeSel, e.clientX, e.clientY, 15)) {
            setSingleSelection(activeSel.id);
            return;
          }

          // 2. Fallback: hit testing to catch clicks between text letters or transparent shape bounds
          const normalElements = Array.from(frameEl.children).filter(el => {
            const isFreeFrame = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame' || el.id?.startsWith('free-frame');
            if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') return false;
            return el.id && el.getAttribute('data-type') !== 'frame' &&
              el.getAttribute('data-name') !== 'Overlay' &&
              el.getAttribute('data-hidden') !== 'true' &&
              el.getAttribute('data-locked') !== 'true';
          });
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
            // ── Root Folder Gap (Canvas Background): Keep page root folder selected
            if (hitMultiSelectionGap) return; // Keep multi-selection intact!
            const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : frameId);
            setSingleSelection(rootId);
            setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else {
            // ── Deeper Frame Gap: exit one level (select frame, keep entered)
            if (hitMultiSelectionGap) return; // Keep multi-selection intact!
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
        let targetEl = getDraggableElement(e.target, e.currentTarget);

        let currEl = targetEl;
        while (currEl && currEl !== svg) {
          if (topLevelEls.includes(currEl)) {
            hitTopFrame = currEl;
            break;
          }
          currEl = currEl.parentElement;
        }

        if (!hitTopFrame) {
          for (let i = topLevelEls.length - 1; i >= 0; i--) {
            if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
              hitTopFrame = topLevelEls[i];
              break;
            }
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
          // Hit nothing? Keep page root folder selected
          if (hitMultiSelectionGap) return; // Keep multi-selection intact!
          const rootId = (topLevelEls && topLevelEls.length > 0 ? topLevelEls[0].id : pages[activePageIndex]?.layers?.[0]?.id);
          if (rootId) {
            setSingleSelection(rootId);
            setCurrentFrameId(rootId);
            currentFrameIdRef.current = rootId;
          } else {
            setSingleSelection(null);
            setCurrentFrameId(null);
            currentFrameIdRef.current = null;
          }
        }
        return;
      }
    }

    // ── Case 2: No frame entered — top-level selection ────────────────────────
    const topLevelEls = getTopLevelFrames(svg);

    // 1. Identify which top-level frame was hit (topmost in z-order)
    let hitFrame = null;
    let target = getDraggableElement(e.target, e.currentTarget);

    // First, try to find the frame directly from the clicked target's DOM ancestry
    // This is robust against coordinate-based hitTest failing due to UI overlays (like the Upload panel)
    let currentEl = target;
    while (currentEl && currentEl !== svg) {
      if (topLevelEls.includes(currentEl)) {
        hitFrame = currentEl;
        break;
      }
      currentEl = currentEl.parentElement;
    }

    // Fallback to hitTest if DOM ancestry didn't find a top-level frame
    if (!hitFrame) {
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          hitFrame = topLevelEls[i];
          break;
        }
      }
    }

    if (hitFrame) {
      // Check if we hit an element inside this frame directly (lifted out of selId check to capture any hit!)
      let target = getDraggableElement(e.target, e.currentTarget);

      if (e.target.tagName.toLowerCase() === 'polygon' && e.target.id?.includes('overlay-poly-')) {
        const polySelectionId = e.target.id.replace('overlay-poly-selected-', '').replace('overlay-poly-child-selected-', '').replace('overlay-poly-hover-', '');
        const underlyingEl = svg.querySelector(`[id="${polySelectionId}"]`);
        if (underlyingEl) {
          const isFreeFrame = underlyingEl.getAttribute('data-name') === 'Free Frame' || underlyingEl.getAttribute('data-type') === 'free-frame' || underlyingEl.id?.startsWith('free-frame');
          if (!(isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation')) {
            target = underlyingEl;
          }
        }
      }

      if (target && target !== hitFrame && hitFrame.contains(target)) {
        setCurrentFrameId(hitFrame.id);
        currentFrameIdRef.current = hitFrame.id;
        setSingleSelection(target.id);
        // Persist auto-assigned ids (e.g. template text with no id) immediately
        if (target.tagName?.toLowerCase() === 'text') {
          saveModifiedPageHtml(pageIdx, svg);
        }
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
      const normalEls = Array.from(hitFrame.children).filter(el => {
        const isFreeFrame = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame' || el.id?.startsWith('free-frame');
        if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') return false;
        return el.id && el.getAttribute('data-type') !== 'frame' &&
          el.getAttribute('data-name') !== 'Overlay' &&
          el.getAttribute('data-hidden') !== 'true' &&
          el.getAttribute('data-locked') !== 'true';
      });
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

      // ── STICKY SELECTION PRIORITY (Case 3) ──
      // If we are about to clear the selection, check if the click was VERY close to the active selection!
      // This protects against accidental deselection when trying to double-click text!
      const activeSel = selectedLayerIdRef.current ? svg.querySelector(`[id="${selectedLayerIdRef.current}"]`) : null;
      if (activeSel && hitTest(activeSel, e.clientX, e.clientY, 15)) {
        return; // Keep selection intact!
      }

      // ── MULTI-SELECTION GAP CLICK CHECK ──
      if (multiSelectedIdsRef.current.size > 1) {
        const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
        if (multiPoly) {
          const rect = multiPoly.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            return; // Keep multi-selection intact!
          }
        }
      }

      if (topLevelEls && topLevelEls.length > 0) {
        const rootId = topLevelEls[0].id;
        setSingleSelection(rootId);
        setCurrentFrameId(rootId);
        currentFrameIdRef.current = rootId;
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
    // Intentionally ignore suppressClickRef here so that micro-jitters during double-clicks don't abort text editing!

    const container = e.currentTarget;
    const svg = container.querySelector('svg');
    if (!svg) return;

    if (isConvertedFlipbook) {
      return;
    }

    // ── NODE EDIT MODE: Double-click on already-active node edit path ──────────────
    if (nodeEditModeRef.current) {
      // Already in node edit mode – do nothing on double click (single click to drag handles)
      return;
    }

    // Text editing on double-click
    // 1. First check if we directly hit text
    let target = getDraggableElement(e.target, e.currentTarget);

    // 2. Proactively check if we are double-clicking while a text is selected
    const selIdContext = selectedLayerIdRef.current;
    if (selIdContext && (!target || !['text', 'tspan', 'foreignobject'].includes(target.tagName?.toLowerCase()))) {
      let activeSelEls = svg.querySelectorAll(`[id="${selIdContext}"]`);
      // If there are duplicates due to temporary template saving leaks, find the visible one
      const activeSelEl = Array.from(activeSelEls).find(el => el.getBoundingClientRect().width > 0) || activeSelEls[0];

      if (activeSelEl && ['text', 'tspan', 'foreignobject'].includes(activeSelEl.tagName.toLowerCase()) && activeSelEl.getAttribute('data-locked') !== 'true') {
        // Bypass strict hitTest if the target was the overlay polygon (meaning they clicked inside the blue box exactly)
        const clickedPolygon = e.target.tagName.toLowerCase() === 'polygon';
        if (clickedPolygon || hitTest(activeSelEl, e.clientX, e.clientY, 15)) {
          target = activeSelEl;
        }
      }
    }

    // ── NODE EDIT MODE: Check if double-clicking a vector/path/shape element ───
    const isModuleWithoutPenEdit = activeTopTool === 'interaction' || activeTopTool === 'animation' || activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
    if (!isModuleWithoutPenEdit && target && !['text', 'tspan', 'foreignobject'].includes(target.tagName?.toLowerCase())) {
      const tag = target.tagName?.toLowerCase();
      const dataType = target.getAttribute('data-type') || '';
      const isVectorOrPath = (
        tag === 'path' ||
        dataType === 'vector-path' ||
        dataType === 'shape' ||
        (tag === 'ellipse' || tag === 'circle' || tag === 'rect' || tag === 'line' || tag === 'polyline' || tag === 'polygon')
      ) && target.getAttribute('data-locked') !== 'true' &&
        target.getAttribute('data-name') !== 'Overlay' &&
        target.getAttribute('data-type') !== 'frame' &&
        target.getAttribute('data-type') !== 'background';

      if (isVectorOrPath && target.id) {
        // For non-path shapes (rect/ellipse/etc.), convert to path first or skip
        if (tag === 'path' || dataType === 'vector-path') {
          const container = target.closest('.page-svg-container');
          const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
          enterNodeEditMode(target, pageIdx);
          return;
        }
      }
    }

    if (!target) {
      return;
    }

    const isText = (['text', 'tspan'].includes(target.tagName.toLowerCase()) || target.tagName.toLowerCase() === 'foreignobject') && target.getAttribute('data-type') !== 'video' && !target.querySelector('video, iframe');
    if (isText && target.id) {
      if (activeTopTool !== 'interaction' && activeTopTool !== 'animation') {
        enterTextEditMode(target, e.clientX, e.clientY);
      }
      return;
    }

    const isCropModeMedia = target && !target.closest?.('[data-is-gif-group="true"]') && (
      (target.getAttribute('data-object-fit') === 'Crop') ||
      (target.closest?.('[data-object-fit="Crop"]'))
    );

    if (isCropModeMedia) {
      const cropLayer = target.closest?.('[data-object-fit="Crop"]') || target;
      if (cropLayer && cropLayer.id) {
        if (setSelectedLayerId) {
          setSelectedLayerId(cropLayer.id);
          selectedLayerIdRef.current = cropLayer.id;
        }

        const evt = new CustomEvent('enter-crop-mode', { detail: { elementId: cropLayer.id } });
        window.dispatchEvent(evt);
        return;
      }
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
      const isMediaGroupChild = target.closest('[data-is-image-group="true"]') ||
        target.closest('[data-is-video-group="true"]') ||
        target.closest('[data-is-gif-group="true"]');

      // If the target is a child of a media group, do not drill down on double click
      if (isMediaGroupChild && isMediaGroupChild !== target) {
        return;
      }

      if (setSelectedLayerId) {
        setSelectedLayerId(target.id);
        selectedLayerIdRef.current = target.id;
      }
    }
  };

  return {
    handleSvgMouseDown,
    handleSvgMouseMove,
    handleSvgMouseUp,
    handleSvgMouseLeave,
    handleSvgClick,
    handleSvgDoubleClick
  };
};

export default useCanvasPointerEvents;
