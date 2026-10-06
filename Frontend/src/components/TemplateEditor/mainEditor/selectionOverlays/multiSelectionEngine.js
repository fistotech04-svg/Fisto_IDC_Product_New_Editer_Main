import { getVisualBBox, getElementMatrix } from '../geometryUtils';
import {
  getOverlayForElement,
  getHtmlOverlayForElement,
  getRotatingCursor,
  createOrUpdateEdgeHandles,
  applyCrispSelectionStroke,
  isElementHidden,
  purgeElementOverlays
} from './overlayDomUtils';

/**
 * Handles the multi-selection bounding box:
 *  - syncMultiSelectionBox: live-sync the AABB polygon + resize handles during drag/resize
 *  - drawMultiSelectionHighlight: compute AABB from selected element set and draw it
 */
export const createMultiSelectionEngine = ({
  zoom,
  multiSelectedIdsRef,
  createOrUpdateRotateHandle,
  activeRotateCornersRef
}) => {

  /**
   * syncMultiSelectionBox – live-syncs the overall bounding-box polygon and resize
   * handles for a multi-selection during drag/resize WITHOUT re-reading the DOM.
   */
  const syncMultiSelectionBox = (canvasSvg, overlay, htmlOverlay, svgRootBBox) => {
    if (!overlay || !canvasSvg || !svgRootBBox) return;
    try {
      const svgCTM = canvasSvg.getScreenCTM();
      const overlayCTM = overlay.getScreenCTM();
      if (!svgCTM || !overlayCTM) return;

      // Convert four SVG-root corners → overlay pixel coords
      const toOverlay = (rx, ry) => {
        const screen = new DOMPoint(rx, ry).matrixTransform(svgCTM);
        return new DOMPoint(screen.x, screen.y).matrixTransform(overlayCTM.inverse());
      };

      const tl = toOverlay(svgRootBBox.x, svgRootBBox.y);
      const tr = toOverlay(svgRootBBox.x + svgRootBBox.width, svgRootBBox.y);
      const br = toOverlay(svgRootBBox.x + svgRootBBox.width, svgRootBBox.y + svgRootBBox.height);
      const bl = toOverlay(svgRootBBox.x, svgRootBBox.y + svgRootBBox.height);

      // Axis-aligned bounding box in overlay space
      const minX = Math.min(tl.x, tr.x, br.x, bl.x);
      const maxX = Math.max(tl.x, tr.x, br.x, bl.x);
      const minY = Math.min(tl.y, tr.y, br.y, bl.y);
      const maxY = Math.max(tl.y, tr.y, br.y, bl.y);

      // Update the dummy rect position (used by the resize hit-test code)
      const dummyId = 'multi-selection-bounds';
      const dummy = overlay.querySelector(`[id="${dummyId}"]`);
      if (dummy) {
        dummy.setAttribute('x', minX);
        dummy.setAttribute('y', minY);
        dummy.setAttribute('width', maxX - minX);
        dummy.setAttribute('height', maxY - minY);
      }

      // Update (or create) the selection outline polygon
      const zoomScale = zoom / 100;
      const polyId = `overlay-poly-selected-${dummyId}`;
      let selPoly = overlay.querySelector(`[id="${polyId}"]`);
      if (!selPoly) {
        selPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        selPoly.id = polyId;
        selPoly.setAttribute('class', 'overlay-type-selected');
        selPoly.setAttribute('fill', 'none');
        selPoly.setAttribute('stroke', '#5255CA');
        selPoly.setAttribute('pointer-events', 'none');
        overlay.appendChild(selPoly);
      }
      overlay.appendChild(selPoly);
      applyCrispSelectionStroke(selPoly, `${minX.toFixed(2)},${minY.toFixed(2)} ${maxX.toFixed(2)},${minY.toFixed(2)} ${maxX.toFixed(2)},${maxY.toFixed(2)} ${minX.toFixed(2)},${maxY.toFixed(2)}`, zoomScale);

      // Update resize handles
      if (htmlOverlay) {
        const handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const allPts = [
          { x: minX, y: minY }, { x: maxX, y: minY },
          { x: maxX, y: maxY }, { x: minX, y: maxY },
          { x: cx, y: minY }, { x: maxX, y: cy },
          { x: cx, y: maxY }, { x: minX, y: cy }
        ];
        const cornersMap = {
          nw: { x: minX, y: minY },
          ne: { x: maxX, y: minY },
          se: { x: maxX, y: maxY },
          sw: { x: minX, y: maxY }
        };

        const isDragging = !document.body.classList.contains('resizing-active') && (document.body.classList.contains('dragging-active') || !!document.querySelector('[data-dragging="true"]'));
        if (isDragging) {
          htmlOverlay.querySelectorAll(`[id^="resize-handle-${dummyId}-"], [id^="rotate-handle-${dummyId}"], [id^="rotation-degree-badge-${dummyId}"], [id^="rotate-hotspot-${dummyId}-"]`).forEach(h => {
            h.style.display = 'none';
          });
          return;
        }

        allPts.forEach((p, i) => {
          const name = handleNames[i];
          const isSide = ['n', 'e', 's', 'w'].includes(name);
          const handleId = `resize-handle-${dummyId}-${name}`;
          let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
          if (!handle) {
            handle = document.createElement('div');
            handle.id = handleId;
            handle.className = `resize-handle overlay-type-selected absolute`;
            handle.style.boxSizing = 'border-box';
            handle.style.pointerEvents = 'auto';
            handle.style.zIndex = isSide ? '999' : '1000';
            handle.style.position = 'absolute';
            handle.style.left = '0px';
            handle.style.top = '0px';
            handle.style.transformOrigin = '0 0';
            handle.style.willChange = 'transform';
            handle.style.transition = 'none';
            htmlOverlay.appendChild(handle);
          }
          handle.style.display = '';
          const targetStyle = isSide ? (name === 'n' || name === 's' ? 'side-h' : 'side-v') : 'corner';
          if (handle.dataset.styled !== targetStyle) {
            handle.dataset.styled = targetStyle;
            if (handle.hasChildNodes()) handle.innerHTML = '';
            handle.style.backgroundColor = '#FFFFFF';
            handle.style.border = '1.5px solid #5255CA';
            handle.style.boxShadow = 'none';
            if (isSide) {
              const isHorizontal = (name === 'n' || name === 's');
              handle.style.borderRadius = '9999px';
              handle.style.width = isHorizontal ? '12.5px' : '5.5px';
              handle.style.height = isHorizontal ? '5.5px' : '12.5px';
            } else {
              handle.style.borderRadius = '50%';
              handle.style.width = '8.5px';
              handle.style.height = '8.5px';
            }
          }
          const posX = p.x.toFixed(2);
          const posY = p.y.toFixed(2);
          handle.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;

          const cursorMap = { nw: 'nwse-resize', ne: 'nesw-resize', se: 'nwse-resize', sw: 'nesw-resize', n: 'ns-resize', e: 'ew-resize', s: 'ns-resize', w: 'ew-resize' };
          handle.style.cursor = cursorMap[name] || 'pointer';
        });

        // Add 4-side full line resize handles for multi-selection
        createOrUpdateEdgeHandles({
          htmlOverlay,
          targetId: dummyId,
          cornersMap,
          rotation: 0,
          zoomScale,
          show: true
        });

        // Rotate handle for multi-selection
        createOrUpdateRotateHandle({
          handleId: `rotate-handle-${dummyId}`,
          htmlOverlay,
          cx,
          cy,
          cornersMap,
          rotation: 0,
          zoomScale,
          targetIds: Array.from(multiSelectedIdsRef.current),
          targetKey: dummyId,
          show: false
        });
      }
    } catch { /* non-critical */ }
  };

  const drawMultiSelectionHighlight = (ids, drawOverlayHighlight) => {
    const purgeMultiSelectionOverlays = () => {
      document.querySelectorAll('[id*="multi-selection-bounds"], [id*="overlay-poly-selected-multi"], [id^="resize-handle-multi"], [id^="rotate-handle-multi"], [id^="rotation-degree-badge-multi"], [id^="rotate-hotspot-multi"]').forEach(h => h.remove());
    };

    purgeMultiSelectionOverlays();
    document.querySelectorAll('.overlay-type-multi-child-selected').forEach(el => el.remove());
    // Also remove any leftover individual resize or rotate handles on multi-selected elements
    ids.forEach(id => {
      try {
        const escaped = CSS.escape(id);
        document.querySelectorAll(`[id^="resize-handle-${escaped}-"], [id^="rotate-handle-${escaped}"], [id^="rotate-hotspot-${escaped}-"]`).forEach(h => h.remove());
      } catch { /* ignored */ }
    });

    const elementsByOverlay = new Map();

    ids.forEach(id => {
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
        const overlay = getOverlayForElement(el);
        if (!overlay) return;
        if (!elementsByOverlay.has(overlay)) elementsByOverlay.set(overlay, []);
        elementsByOverlay.get(overlay).push(el);
      });
    });

    if (elementsByOverlay.size === 0) {
      purgeMultiSelectionOverlays();
      return;
    }

    elementsByOverlay.forEach((elements, overlay) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidBox = false;

      // Check if all elements share a common rotation
      const angles = elements.map(el => {
        const matrix = getElementMatrix(el);
        const isFlipH = el.getAttribute('data-flip-h') === 'true';
        const isFlipV = el.getAttribute('data-flip-v') === 'true';
        let angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        if (isFlipH && !isFlipV) {
          angle = Math.atan2(-matrix.b, -matrix.a) * (180 / Math.PI);
        }
        return ((angle % 360) + 360) % 360;
      });

      const firstAngle = angles[0] ?? 0;
      const isCommonRotation = angles.every(a => {
        const diff = Math.abs(a - firstAngle);
        const normalizedDiff = Math.min(diff, 360 - diff);
        return normalizedDiff < 1.0;
      });
      const commonRotation = isCommonRotation ? firstAngle : 0;
      const rad = commonRotation * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      let minRotX = Infinity, maxRotX = -Infinity, minRotY = Infinity, maxRotY = -Infinity;

      elements.forEach(el => {
        try {
          let bbox = getVisualBBox(el);
          const ctm = el.getScreenCTM();
          const overlayCtm = overlay.getScreenCTM();
          if (!ctm || !overlayCtm) return;

          const isFrame = el.getAttribute('data-type') === 'frame';
          if (isFrame || ((bbox.width < 5 || bbox.height < 5) && el.tagName.toLowerCase() !== 'line')) {
            const clientRect = el.getBoundingClientRect();
            const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
            if (isFrame || clientRect.width / scale > 10 || clientRect.height / scale > 10 || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'foreignobject') {
              if (clientRect.width > 0 && clientRect.height > 0) {
                const elInverse = ctm.inverse();
                const pt = overlay.createSVGPoint();
                pt.x = clientRect.left; pt.y = clientRect.top;
                const localTL = pt.matrixTransform(elInverse);
                pt.x = clientRect.right; pt.y = clientRect.bottom;
                const localBR = pt.matrixTransform(elInverse);
                bbox = {
                  x: Math.min(localTL.x, localBR.x),
                  y: Math.min(localTL.y, localBR.y),
                  width: Math.abs(localBR.x - localTL.x),
                  height: Math.abs(localBR.y - localTL.y)
                };
              }
            }
          }

          if (bbox.width === 0 && bbox.height === 0) return;

          const svgMatrix = overlayCtm.inverse().multiply(ctm);

          const pt1 = overlay.createSVGPoint(); pt1.x = bbox.x; pt1.y = bbox.y;
          const pt2 = overlay.createSVGPoint(); pt2.x = bbox.x + bbox.width; pt2.y = bbox.y;
          const pt3 = overlay.createSVGPoint(); pt3.x = bbox.x + bbox.width; pt3.y = bbox.y + bbox.height;
          const pt4 = overlay.createSVGPoint(); pt4.x = bbox.x; pt4.y = bbox.y + bbox.height;

          const pts = [pt1, pt2, pt3, pt4];

          pts.forEach(p => {
            const mapped = p.matrixTransform(svgMatrix);
            if (mapped.x < minX) minX = mapped.x;
            if (mapped.x > maxX) maxX = mapped.x;
            if (mapped.y < minY) minY = mapped.y;
            if (mapped.y > maxY) maxY = mapped.y;

            // Project into rotated coordinate frame
            const rx = mapped.x * cos + mapped.y * sin;
            const ry = -mapped.x * sin + mapped.y * cos;
            if (rx < minRotX) minRotX = rx;
            if (rx > maxRotX) maxRotX = rx;
            if (ry < minRotY) minRotY = ry;
            if (ry > maxRotY) maxRotY = ry;
          });
          hasValidBox = true;
        } catch (e) {
          console.error(e);
        }
      });

      if (!hasValidBox) {
        purgeMultiSelectionOverlays();
        return;
      }

      const dummyId = 'multi-selection-bounds';
      let dummy = overlay.querySelector(`[id="${dummyId}"]`);
      if (!dummy) {
        dummy = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dummy.id = dummyId;
        dummy.setAttribute('fill', 'none');
        dummy.setAttribute('pointer-events', 'none');
        overlay.appendChild(dummy);
      }

      dummy.setAttribute('x', minX);
      dummy.setAttribute('y', minY);
      dummy.setAttribute('width', maxX - minX);
      dummy.setAttribute('height', maxY - minY);

      // Compute corners of the oriented bounding box in overlay space
      const nw = {
        x: minRotX * cos - minRotY * sin,
        y: minRotX * sin + minRotY * cos
      };
      const ne = {
        x: maxRotX * cos - minRotY * sin,
        y: maxRotX * sin + minRotY * cos
      };
      const se = {
        x: maxRotX * cos - maxRotY * sin,
        y: maxRotX * sin + maxRotY * cos
      };
      const sw = {
        x: minRotX * cos - maxRotY * sin,
        y: minRotX * sin + maxRotY * cos
      };

      const cornersMap = { nw, ne, se, sw };
      const cx = (nw.x + se.x) / 2;
      const cy = (nw.y + se.y) / 2;

      const midN = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
      const midE = { x: (ne.x + se.x) / 2, y: (ne.y + se.y) / 2 };
      const midS = { x: (sw.x + se.x) / 2, y: (sw.y + se.y) / 2 };
      const midW = { x: (nw.x + sw.x) / 2, y: (nw.y + sw.y) / 2 };

      const zoomScale = zoom / 100;
      const polyId = `overlay-poly-selected-${dummyId}`;
      let selPoly = overlay.querySelector(`[id="${polyId}"]`);
      if (!selPoly) {
        selPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        selPoly.id = polyId;
        selPoly.setAttribute('class', 'overlay-type-selected');
        selPoly.setAttribute('fill', 'none');
        selPoly.setAttribute('stroke', '#5255CA');
        selPoly.setAttribute('pointer-events', 'none');
        overlay.appendChild(selPoly);
      }
      applyCrispSelectionStroke(selPoly, `${nw.x.toFixed(2)},${nw.y.toFixed(2)} ${ne.x.toFixed(2)},${ne.y.toFixed(2)} ${se.x.toFixed(2)},${se.y.toFixed(2)} ${sw.x.toFixed(2)},${sw.y.toFixed(2)}`, zoomScale);

      // Draw resize handles for the multi-selection bounding box
      const firstEl = elements[0];
      const htmlOverlay = firstEl ? getHtmlOverlayForElement(firstEl) : null;
      if (htmlOverlay) {
        const handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
        const allPts = [nw, ne, se, sw, midN, midE, midS, midW];

        const isDragging = !document.body.classList.contains('resizing-active') && (document.body.classList.contains('dragging-active') || !!document.querySelector('[data-dragging="true"]'));
        if (isDragging) {
          htmlOverlay.querySelectorAll(`[id^="resize-handle-${dummyId}-"], [id^="rotate-handle-${dummyId}"], [id^="rotation-degree-badge-${dummyId}"], [id^="rotate-hotspot-${dummyId}-"]`).forEach(h => {
            h.style.display = 'none';
          });
        } else {
          allPts.forEach((p, i) => {
            const name = handleNames[i];
            const isSide = ['n', 'e', 's', 'w'].includes(name);
            const handleId = `resize-handle-${dummyId}-${name}`;
            let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
            if (!handle) {
              handle = document.createElement('div');
              handle.id = handleId;
              handle.className = `resize-handle overlay-type-selected absolute`;
              handle.style.boxSizing = 'border-box';
              handle.style.pointerEvents = 'auto';
              handle.style.zIndex = isSide ? '999' : '1000';
              handle.style.position = 'absolute';
              handle.style.left = '0px';
              handle.style.top = '0px';
              handle.style.transformOrigin = '0 0';
              handle.style.willChange = 'transform';
              handle.style.transition = 'none';
              htmlOverlay.appendChild(handle);
            }
            handle.style.display = '';
            const targetStyle = isSide ? (name === 'n' || name === 's' ? 'side-h' : 'side-v') : 'corner';
            if (handle.dataset.styled !== targetStyle) {
              handle.dataset.styled = targetStyle;
              if (handle.hasChildNodes()) handle.innerHTML = '';
              handle.style.backgroundColor = '#FFFFFF';
              handle.style.border = '1.5px solid #5255CA';
              handle.style.boxShadow = 'none';
              if (isSide) {
                const isHorizontal = (name === 'n' || name === 's');
                handle.style.borderRadius = '9999px';
                handle.style.width = isHorizontal ? '12.5px' : '5.5px';
                handle.style.height = isHorizontal ? '5.5px' : '12.5px';
              } else {
                handle.style.borderRadius = '50%';
                handle.style.width = '8.5px';
                handle.style.height = '8.5px';
              }
            }
            handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${commonRotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;

            if (!isSide) {
              handle.onpointerenter = () => {
                if (!window.__isRotatingActive && !document.querySelector('[data-dragging="true"]')) {
                  if (activeRotateCornersRef?.current) {
                    activeRotateCornersRef.current[dummyId] = name;
                  }
                  createOrUpdateRotateHandle({
                    handleId: `rotate-handle-${dummyId}`,
                    htmlOverlay,
                    cx,
                    cy,
                    cornersMap,
                    rotation: commonRotation,
                    zoomScale,
                    targetIds: Array.from(multiSelectedIdsRef.current),
                    targetKey: dummyId,
                    show: true
                  });
                }
              };
            }
            handle.style.cursor = getRotatingCursor(name, commonRotation);
          });

          // Add 4-side full line resize handles for multi-selection
          createOrUpdateEdgeHandles({
            htmlOverlay,
            targetId: dummyId,
            cornersMap,
            rotation: commonRotation,
            zoomScale,
            show: true
          });

          // Rotate handle for multi-selection
          createOrUpdateRotateHandle({
            handleId: `rotate-handle-${dummyId}`,
            htmlOverlay,
            cx,
            cy,
            cornersMap,
            rotation: commonRotation,
            zoomScale,
            targetIds: Array.from(multiSelectedIdsRef.current),
            targetKey: dummyId,
            show: false
          });
        }
      }

      elements.forEach(el => {
        drawOverlayHighlight(el, 'multi-child-selected');
      });

      if (selPoly) {
        overlay.appendChild(selPoly);
      }
    });
  };

  return { syncMultiSelectionBox, drawMultiSelectionHighlight };
};
