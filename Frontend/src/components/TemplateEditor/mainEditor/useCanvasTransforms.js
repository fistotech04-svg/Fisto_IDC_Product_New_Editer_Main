import { useState, useEffect, useCallback, useRef } from 'react';
import { getElementMatrix, getVisualBBox, matrixToTransform } from './geometryUtils';

/**
 * Hook managing canvas element transformation actions:
 * - Tracking current selection rotation angle from its DOM matrix
 * - Multi-element and single-element rotation around bounding box centers
 * - Horizontal and vertical flipping around bounding box centers
 */
export const useCanvasTransforms = ({
  selectedLayerId,
  multiSelectedIds = new Set(),
  activePageIndex = 0,
  currentFrameId,
  updatePageHtml,
  drawOverlayHighlight,
  drawMultiSelectionHighlight
}) => {
  const [rotation, setRotation] = useState(0);
  const groupRotationStateRef = useRef(null);

  // Synchronize rotation with DOM selection
  useEffect(() => {
    const selId = selectedLayerId;
    if (selId && multiSelectedIds.size <= 1) {
      const el = document.getElementById(selId);
      if (el) {
        const matrix = getElementMatrix(el);
        const isFlipH = el.getAttribute('data-flip-h') === 'true';
        const isFlipV = el.getAttribute('data-flip-v') === 'true';
        let angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
        if (isFlipH && !isFlipV) {
          angle = Math.round(Math.atan2(-matrix.b, -matrix.a) * (180 / Math.PI));
        }
        setRotation(((angle % 360) + 360) % 360);
      }
    } else {
      setRotation(0);
    }
  }, [selectedLayerId, multiSelectedIds]);

  const handleRotate = useCallback((newAngle, isFinal = true, options = {}) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    const isGroupRotate = options.isGroupRotate && ids.length > 1;

    if (isGroupRotate) {
      // ── GROUP ROTATION (canvas corner handle): keep exact relative alignment ──
      // Elements rotate together around the common group center
      const centerScreen = options.centerScreen;

      if (!groupRotationStateRef.current) {
        groupRotationStateRef.current = {
          elements: ids.map(id => {
            const el = document.getElementById(id);
            if (!el) return null;
            const parentCTM = typeof el.parentNode?.getScreenCTM === 'function' ? el.parentNode.getScreenCTM() : el.ownerSVGElement?.getScreenCTM();
            const groupCenterInParent = (parentCTM && centerScreen)
              ? new DOMPoint(centerScreen.x, centerScreen.y).matrixTransform(parentCTM.inverse())
              : null;
            return {
              el,
              initialMatrix: getElementMatrix(el),
              groupCenterInParent
            };
          }).filter(item => item && item.groupCenterInParent)
        };
      }

      const { elements } = groupRotationStateRef.current;
      const delta = options.delta || 0;

      elements.forEach(({ el, initialMatrix, groupCenterInParent }) => {
        const rotateMatrix = new DOMMatrix()
          .translate(groupCenterInParent.x, groupCenterInParent.y)
          .rotate(delta)
          .translate(-groupCenterInParent.x, -groupCenterInParent.y);

        const nextMatrix = rotateMatrix.multiply(initialMatrix);
        el.setAttribute('transform', matrixToTransform(nextMatrix));

        if (drawOverlayHighlight) {
          drawOverlayHighlight(el, 'multi-child-selected');
        }
      });

      // Update multi-selection bounding box and all handles live on every frame
      if (drawMultiSelectionHighlight) {
        drawMultiSelectionHighlight(multiSelectedIds);
      }

      if (isFinal) {
        groupRotationStateRef.current = null;
        setRotation(newAngle);
        if (updatePageHtml) {
          const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
          const svg = activeContainer?.querySelector('svg');
          if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
        }
      }
      return;
    }

    // ── INDIVIDUAL / SEPARATE ROTATION (from TopToolbar, or single element) ──
    groupRotationStateRef.current = null;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try { bbox = el.getBBox(); } catch { /* ignored */ }
      }

      // Calculate local center
      const localCx = bbox.x + bbox.width / 2;
      const localCy = bbox.y + bbox.height / 2;

      // Transform local center by current matrix to get world center
      const worldCenter = new DOMPoint(localCx, localCy).matrixTransform(matrix);

      const isFlipH = el.getAttribute('data-flip-h') === 'true';
      const isFlipV = el.getAttribute('data-flip-v') === 'true';

      let currentAngle = (Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
      if (isFlipH && !isFlipV) {
        currentAngle = (Math.atan2(-matrix.b, -matrix.a) * (180 / Math.PI));
      }
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
      if (drawOverlayHighlight) {
        drawOverlayHighlight(el, highlightType);
      }
    });

    if (multiSelectedIds.size > 1 && drawMultiSelectionHighlight) {
      drawMultiSelectionHighlight(multiSelectedIds);
    }

    if (isFinal) {
      setRotation(newAngle);
      if (updatePageHtml) {
        const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const svg = activeContainer?.querySelector('svg');
        if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
      }
    }
  }, [multiSelectedIds, selectedLayerId, currentFrameId, drawOverlayHighlight, drawMultiSelectionHighlight, updatePageHtml, activePageIndex]);

  const handleFlip = useCallback((direction) => {
    const ids = multiSelectedIds.size > 0 ? Array.from(multiSelectedIds) : (selectedLayerId ? [selectedLayerId] : []);
    if (ids.length === 0) return;

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const matrix = getElementMatrix(el);
      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try { bbox = el.getBBox(); } catch { /* ignored */ }
      }

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

      // Toggle flip tracking attributes
      if (direction === 'h') {
        const curH = el.getAttribute('data-flip-h') === 'true';
        el.setAttribute('data-flip-h', curH ? 'false' : 'true');
      } else if (direction === 'v') {
        const curV = el.getAttribute('data-flip-v') === 'true';
        el.setAttribute('data-flip-v', curV ? 'false' : 'true');
      }

      // Sync toolbar rotation state with the post-flip visual rotation
      const nextIsFlipH = el.getAttribute('data-flip-h') === 'true';
      const nextIsFlipV = el.getAttribute('data-flip-v') === 'true';
      let nextVisualAngle = Math.round(Math.atan2(nextMatrix.b, nextMatrix.a) * (180 / Math.PI));
      if (nextIsFlipH && !nextIsFlipV) {
        nextVisualAngle = Math.round(Math.atan2(-nextMatrix.b, -nextMatrix.a) * (180 / Math.PI));
      }
      setRotation(((nextVisualAngle % 360) + 360) % 360);

      // Force-sync the highlight overlay immediately after flip
      const highlightType = (currentFrameId && el.id !== currentFrameId) ? 'child-selected' : 'selected';
      if (drawOverlayHighlight) {
        drawOverlayHighlight(el, highlightType);
      }
    });

    if (updatePageHtml) {
      const activeContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const svg = activeContainer?.querySelector('svg');
      if (svg) updatePageHtml(activePageIndex, svg.outerHTML);
    }
  }, [multiSelectedIds, selectedLayerId, currentFrameId, drawOverlayHighlight, updatePageHtml, activePageIndex]);

  return {
    rotation,
    setRotation,
    handleRotate,
    handleFlip
  };
};

export default useCanvasTransforms;
