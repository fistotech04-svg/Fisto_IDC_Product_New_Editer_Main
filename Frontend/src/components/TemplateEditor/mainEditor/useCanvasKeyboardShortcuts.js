import { useEffect } from 'react';
import {
  pathToD,
  deleteSelectedNodeOrHandle,
  cleanPaperPathData,
  getPaperSegments
} from '../penTool';
import { getElementMatrix, matrixToTransform } from './geometryUtils';
import { getTopLevelFrames } from './frameHierarchyUtils';

/**
 * Hook managing canvas keyboard shortcuts:
 * - Escape / Enter (exit pen tool, exit node edit mode)
 * - Backspace / Delete (delete pen node, delete selected node/handle in node edit, delete canvas layers)
 * - Shift + P (switch to pencil)
 * - Ctrl+G / Ctrl+Shift+G (Group / Ungroup selected layers)
 * - Arrow keys (Nudge selected layers with optional Shift for 1mm vs 0.1mm)
 * - Custom window events: 'trigger-group', 'trigger-ungroup'
 */
export const useCanvasKeyboardShortcuts = ({
  activeTopTool,
  activeMainTool,
  setActiveMainTool,
  selectedPenTool,
  setSelectedPenTool,
  activePageIndex = 0,
  pages = [],
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
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Restrict shortcuts in non-editor modes
      if (activeTopTool !== 'editor') {
        const isSelectionKey = key === 'v' || key === 'a';
        if (!isSelectionKey) return;
      }

      // Ignore if typing in an input, textarea or contenteditable element
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ||
        document.activeElement.contentEditable === 'true') {
        return;
      }

      if (e.key === 'Escape' || e.key === 'Enter') {
        if (activeMainTool === 'pen') {
          const vSession = vectraPenSessionRef?.current;
          if (vSession) vSession.onKey(e);
          if (commitAndExitPenDrawing) commitAndExitPenDrawing();
          if (typeof setActiveMainTool === 'function') {
            setActiveMainTool('select');
          }
          return;
        }

        if (nodeEditModeRef?.current) {
          const pathEl = nodeEditPathRef.current;
          const pIdx = nodeEditPageIndexRef.current;
          if (exitNodeEditMode) exitNodeEditMode();
          if (pathEl && pathEl.ownerSVGElement && saveModifiedPageHtml) {
            saveModifiedPageHtml(pIdx, pathEl.ownerSVGElement);
          }
          return;
        }
      } else if (e.key === 'Backspace') {
        if (activeMainTool === 'pen' && selectedPenTool === 'pen') {
          const vSession = vectraPenSessionRef?.current;
          const activePath = vSession?.getActivePath();
          if (activePath) {
            vSession.onKey(e);
            const pathEl = drawingPathRef.current;
            const updated = vSession.getActivePath();
            if (!updated) {
              if (pathEl && pathEl.parentNode) pathEl.parentNode.removeChild(pathEl);
              drawingPathRef.current = null;
              if (clearVectraOverlay) clearVectraOverlay(activePageIndex);
            } else if (pathEl) {
              pathEl.setAttribute('d', pathToD(updated));
              if (renderVectraOverlay) renderVectraOverlay(activePageIndex, pathEl.parentElement, vSession);
            }
            return;
          }
        }
      } else if (e.key === 'P' && e.shiftKey) {
        if (setActiveMainTool) setActiveMainTool('pen');
        if (setSelectedPenTool) setSelectedPenTool('pencil');
      } else if (e.key.toLowerCase() === 'g' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (!svg) return;

        const ids = (multiSelectedIdsRef?.current && multiSelectedIdsRef.current.size > 0)
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef?.current ? [selectedLayerIdRef.current] : []);

        const isUngroup = e.shiftKey;

        if (!isUngroup && ids.length > 0) {
          // GROUP
          const elements = ids.map(id => svg.querySelector(`[id="${id}"]`)).filter(Boolean);
          if (elements.length > 0) {
            const parent = elements[0].parentNode;
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.id = 'group-' + Date.now();
            group.setAttribute('data-name', 'Group');
            group.setAttribute('data-type', 'group');

            parent.insertBefore(group, elements[elements.length - 1].nextSibling);

            elements.forEach(el => {
              group.appendChild(el);
            });

            if (updatePageHtml) updatePageHtml(activePageIndex, svg.outerHTML);

            if (setSelectedLayerId) setSelectedLayerId(group.id);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([group.id]));
          }
        } else if (isUngroup && ids.length > 0) {
          // UNGROUP
          let hasChanges = false;
          const newSelectedIds = new Set();

          const groupsToUngroup = new Set();
          ids.forEach(id => {
            let el = svg.querySelector(`[id="${id}"]`);
            if (el && el.tagName.toLowerCase() !== 'g') {
              let parentG = el.closest('g');
              if (parentG) el = parentG;
            }
            if (el && el.tagName.toLowerCase() === 'g') {
              const elName = el.getAttribute('data-name') || '';
              const elType = el.getAttribute('data-type') || '';
              const isLocked = el.getAttribute('data-locked') === 'true';

              if (!isLocked && !elName.includes('PDF Background') && !elName.includes('Overlay') && elType !== 'frame' && elType !== 'background' && el.parentNode !== svg) {
                groupsToUngroup.add(el);
              }
            }
          });

          groupsToUngroup.forEach(el => {
            const parent = el.parentNode;
            const children = Array.from(el.childNodes);

            const groupTransform = el.getAttribute('transform') || '';
            const inheritableAttrs = ['fill', 'stroke', 'stroke-width', 'opacity', 'font-family', 'font-size', 'font-weight', 'color', 'letter-spacing', 'stroke-linecap', 'stroke-linejoin'];
            const inheritedStyles = {};
            inheritableAttrs.forEach(attr => {
              if (el.hasAttribute(attr)) inheritedStyles[attr] = el.getAttribute(attr);
            });

            children.forEach((child, idx) => {
              if (child.nodeType === 1) {
                if (!child.id) {
                  child.id = `ungrouped-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
                }

                if (groupTransform) {
                  const childTransform = child.getAttribute('transform') || '';
                  child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
                }

                Object.entries(inheritedStyles).forEach(([attr, val]) => {
                  if (!child.hasAttribute(attr)) {
                    child.setAttribute(attr, val);
                  }
                });

                parent.insertBefore(child, el);
                if (child.id) newSelectedIds.add(child.id);
              }
            });

            parent.removeChild(el);
            hasChanges = true;
          });

          if (hasChanges) {
            if (updatePageHtml) updatePageHtml(activePageIndex, svg.outerHTML);
            const newIdsArr = Array.from(newSelectedIds);
            if (setSelectedLayerId) setSelectedLayerId(newIdsArr.length === 1 ? newIdsArr[0] : null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set(newIdsArr));
          }
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();

        // Node Edit Mode: Delete selected handle point, line segment, or center node
        if (nodeEditModeRef?.current && nodeEditPaperPathRef?.current && nodeEditPathRef?.current) {
          window.__nodeEditModeActive = true;
          let paperPath = nodeEditPaperPathRef.current;
          const pathEl = nodeEditPathRef.current;
          const pIdx = nodeEditPageIndexRef.current !== null ? nodeEditPageIndexRef.current : activePageIndex;
          const targetSegIndices = (nodeEditSelectedSegIndicesRef?.current && nodeEditSelectedSegIndicesRef.current.size > 0)
            ? Array.from(nodeEditSelectedSegIndicesRef.current)
            : (nodeEditSelectedSegIdxRef?.current !== null ? [nodeEditSelectedSegIdxRef.current] : []);

          const selectedHandleSide = nodeEditSelectedHandleSideRef?.current;

          if (targetSegIndices.length > 0 || selectedHandleSide === 'line' || selectedHandleSide === 'segment') {
            if (paperScopeRef?.current) {
              paperScopeRef.current.activate();
              const { sideDeleted, paperPath: updatedPath } = deleteSelectedNodeOrHandle(paperPath, targetSegIndices, selectedHandleSide, paperScopeRef.current, nodeEditSelectedCurveIdxRef?.current);
              if (updatedPath) {
                paperPath = updatedPath;
                nodeEditPaperPathRef.current = updatedPath;
              }
              if (sideDeleted === 'in' || sideDeleted === 'out') {
                if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = 'point';
              } else {
                if (nodeEditSelectedHandleSideRef) nodeEditSelectedHandleSideRef.current = null;
                if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
                if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = null;
                if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set();
              }

              const dStr = cleanPaperPathData(paperPath);
              const remainingSegments = getPaperSegments(paperPath);
              const svgEl = pathEl.ownerSVGElement;

              let allCollapsed = false;
              if (remainingSegments.length > 0) {
                const firstPt = remainingSegments[0].point;
                allCollapsed = remainingSegments.every(s => Math.hypot(s.point.x - firstPt.x, s.point.y - firstPt.y) < 2.0);
              }
              if (remainingSegments.length <= 1 || allCollapsed || !dStr || dStr.trim() === '') {
                pathEl.remove();
                if (exitNodeEditMode) exitNodeEditMode();
                if (svgEl && saveModifiedPageHtml) {
                  saveModifiedPageHtml(pIdx, svgEl);
                }
                if (typeof setSelectedLayerId === 'function') setSelectedLayerId(null);
              } else {
                pathEl.setAttribute('d', dStr);
                if (sideDeleted === 'point' || sideDeleted === 'line') {
                  if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = null;
                  if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set();
                }
                if (drawNodeEditOverlay) drawNodeEditOverlay(pathEl, paperPath, pIdx);
                if (svgEl && saveModifiedPageHtml) {
                  saveModifiedPageHtml(pIdx, svgEl);
                }
              }
              return;
            }
          }
        }

        // Delete selected element(s) from canvas
        const ids = (multiSelectedIdsRef?.current && multiSelectedIdsRef.current.size > 0)
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef?.current ? [selectedLayerIdRef.current] : []);

        if (ids.length === 0) return;

        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (!svg) return;

        let deleted = false;
        ids.forEach(id => {
          const el = svg.querySelector(`[id="${id}"]`);
          if (!el) return;

          const elName = el.getAttribute('data-name') || '';
          const elType = el.getAttribute('data-type') || '';
          const isLocked = el.getAttribute('data-locked') === 'true';

          if (!isLocked && !elName.includes('PDF Background') && !elName.includes('Overlay') && elType !== 'frame' && elType !== 'background') {
            el.remove();
            deleted = true;
          }
        });

        if (deleted && updatePageHtml) {
          updatePageHtml(activePageIndex, svg.outerHTML);
          const topFrames = getTopLevelFrames(svg);
          const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[activePageIndex]?.layers?.[0]?.id);
          if (rootId) {
            if (setSelectedLayerId) setSelectedLayerId(rootId);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
            if (setCurrentFrameId) setCurrentFrameId(rootId);
            if (currentFrameIdRef) currentFrameIdRef.current = rootId;
          } else {
            if (setSelectedLayerId) setSelectedLayerId(null);
            if (setMultiSelectedIds) setMultiSelectedIds(new Set());
            if (setCurrentFrameId) setCurrentFrameId(null);
            if (currentFrameIdRef) currentFrameIdRef.current = null;
          }
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;

        const ids = (multiSelectedIdsRef?.current && multiSelectedIdsRef.current.size > 0)
          ? Array.from(multiSelectedIdsRef.current)
          : (selectedLayerIdRef?.current ? [selectedLayerIdRef.current] : []);

        if (ids.length === 0) return;

        ids.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;

          const elName = el.getAttribute('data-name') || '';
          const elType = el.getAttribute('data-type') || '';
          const isLocked = el.getAttribute('data-locked') === 'true';

          if (isLocked ||
            elName.includes('PDF Background') ||
            elName.includes('Overlay') ||
            elType === 'frame' ||
            elType === 'background') {
            return;
          }

          const matrix = getElementMatrix(el);
          const nextMatrix = new DOMMatrix().translate(dx, dy).multiply(matrix);
          el.setAttribute('transform', matrixToTransform(nextMatrix));

          const highlightType = (currentFrameIdRef?.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
          if (drawOverlayHighlight) drawOverlayHighlight(el, highlightType);
        });

        if (multiSelectedIdsRef?.current && multiSelectedIdsRef.current.size > 1) {
          if (drawMultiSelectionHighlight) {
            drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
          }
        }

        if (updatePageHtml) {
          const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
          const svg = activeContainer?.querySelector('svg');
          if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
        }

        if (!nodeEditModeRef?.current && isAltPressedRef?.current && drawMeasurementOverlayRef?.current && lastMousePosRef?.current && lastMousePosRef.current.target) {
          let currentTarget = lastMousePosRef.current.target;
          if (currentTarget && !document.contains(currentTarget)) {
            currentTarget = document.elementFromPoint(lastMousePosRef.current.x, lastMousePosRef.current.y) || currentTarget;
            lastMousePosRef.current.target = currentTarget;
          }
          drawMeasurementOverlayRef.current(currentTarget, true);
        }
      }
    };

    const handleTriggerGroup = () => {
      handleKeyDown({ key: 'g', ctrlKey: true, preventDefault: () => { } });
    };
    const handleTriggerUngroup = () => {
      handleKeyDown({ key: 'G', ctrlKey: true, shiftKey: true, preventDefault: () => { } });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('trigger-group', handleTriggerGroup);
    window.addEventListener('trigger-ungroup', handleTriggerUngroup);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('trigger-group', handleTriggerGroup);
      window.removeEventListener('trigger-ungroup', handleTriggerUngroup);
    };
  }, [activePageIndex, activeTopTool, activeMainTool, setActiveMainTool, selectedPenTool, setSelectedPenTool, pages, updatePageHtml, saveModifiedPageHtml, setSelectedLayerId, setMultiSelectedIds, setCurrentFrameId, currentFrameIdRef, selectedLayerIdRef, multiSelectedIdsRef, vectraPenSessionRef, drawingPathRef, commitAndExitPenDrawing, clearVectraOverlay, renderVectraOverlay, nodeEditModeRef, nodeEditPaperPathRef, nodeEditPathRef, nodeEditPageIndexRef, nodeEditSelectedSegIndicesRef, nodeEditSelectedSegIdxRef, nodeEditSelectedHandleSideRef, nodeEditSelectedCurveIdxRef, paperScopeRef, exitNodeEditMode, drawNodeEditOverlay, drawOverlayHighlight, drawMultiSelectionHighlight, isAltPressedRef, drawMeasurementOverlayRef, lastMousePosRef]);
};

export default useCanvasKeyboardShortcuts;
