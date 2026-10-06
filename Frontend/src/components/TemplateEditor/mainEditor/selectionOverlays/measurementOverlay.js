import { getVisualBBox } from '../geometryUtils';
import { getOverlayForElement } from './overlayDomUtils';

/**
 * Measurement overlay: draws Figma-style distance guides (mm values)
 * between the selected element and a hovered target (or parent frame).
 */
export const createMeasurementOverlay = ({
  zoom,
  baseWidth,
  baseHeight,
  isAltPressedRef,
  nodeEditModeRef,
  selectedLayerIdRef,
  multiSelectedIdsRef,
  drawMeasurementOverlayRef
}) => {

  const clearMeasurementOverlay = () => {
    document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
  };

  const drawMeasurementOverlay = (targetEl, forceDraw = false) => {
    clearMeasurementOverlay();
    if (nodeEditModeRef.current) return;
    if (!forceDraw && (!isAltPressedRef.current || !selectedLayerIdRef.current)) return;

    const selectedEl = document.getElementById(selectedLayerIdRef.current);
    if (!selectedEl) return;

    const svg = selectedEl.ownerSVGElement || selectedEl.closest('svg');
    if (!svg) return;

    const isSelectedBackgroundOrFrame = selectedEl.getAttribute('data-name') === 'Overlay' ||
      selectedEl.getAttribute('data-type') === 'background' ||
      selectedEl.getAttribute('data-type') === 'frame';
    if (isSelectedBackgroundOrFrame) return;

    let isMultiTarget = Array.isArray(targetEl);
    let firstTarget = isMultiTarget ? targetEl[0] : targetEl;

    if (firstTarget && selectedEl.contains(firstTarget)) return;

    if (firstTarget && multiSelectedIdsRef.current && multiSelectedIdsRef.current.size > 1) {
      if (multiSelectedIdsRef.current.has(firstTarget.id)) return;
      let isInsideSelection = false;
      multiSelectedIdsRef.current.forEach(id => {
        const el = svg.querySelector(`[id="${id}"]`);
        if (el && el.contains(firstTarget)) isInsideSelection = true;
      });
      if (isInsideSelection) return;
    }

    const isPageOrBackground = (target) => {
      if (!target) return true;
      if (target === svg) return true;
      if (typeof target.getAttribute === 'function') {
        const dType = target.getAttribute('data-type');
        const dName = target.getAttribute('data-name');
        if (dType === 'background' || dName === 'Overlay') return true;
        if (dType === 'frame') {
          if (target.parentElement === svg || target.querySelector?.('[data-type="background"], [data-name="Overlay"]')) {
            return true;
          }
        }
      }
      return false;
    };

    let measureTarget = null;
    let measureTargetArray = null;

    if (isMultiTarget) {
      measureTargetArray = targetEl;
      measureTarget = firstTarget;
    } else {
      let actualTarget = targetEl;
      if (actualTarget && actualTarget !== svg) {
        const layerEl = (typeof actualTarget.closest === 'function')
          ? actualTarget.closest('g[id], [data-type]:not([data-type="background"]):not([data-name="Overlay"]), [data-crop-data], [id]:not(svg):not(path):not(defs):not(clipPath)')
          : null;
        if (layerEl && layerEl !== svg) {
          actualTarget = layerEl;
        }
      }

      if (actualTarget && actualTarget !== svg && actualTarget !== selectedEl && !selectedEl.contains(actualTarget)) {
        const isOverlay = actualTarget.getAttribute && (
          actualTarget.getAttribute('data-name') === 'Overlay' ||
          actualTarget.getAttribute('data-type') === 'background' ||
          (actualTarget.getAttribute('class') && actualTarget.getAttribute('class').includes('overlay'))
        );
        if (!isOverlay) measureTarget = actualTarget;
      }

      if (!measureTarget) {
        const parentFrame = selectedEl.parentElement && selectedEl.parentElement.closest('[data-type="frame"]');
        measureTarget = parentFrame || svg.querySelector('[data-type="background"], [data-name="Overlay"]') || svg;
      }
      if (!measureTarget || measureTarget === selectedEl || selectedEl.contains(measureTarget)) return;
    }

    const overlay = getOverlayForElement(selectedEl);
    if (!overlay) return;

    const getPageCanvasRect = () => {
      // 1. Try to find background rect element
      const bgEl = svg.querySelector('[data-type="background"], [data-name="Overlay"]');
      if (bgEl && typeof bgEl.getBoundingClientRect === 'function') {
        const clientRect = bgEl.getBoundingClientRect();
        const overlayInverse = overlay.getScreenCTM()?.inverse();
        if (overlayInverse && clientRect.width > 0) {
          const pt = overlay.createSVGPoint();
          pt.x = clientRect.left; pt.y = clientRect.top;
          const tl = pt.matrixTransform(overlayInverse);
          pt.x = clientRect.right; pt.y = clientRect.bottom;
          const br = pt.matrixTransform(overlayInverse);
          return {
            left: Math.min(tl.x, br.x),
            right: Math.max(tl.x, br.x),
            top: Math.min(tl.y, br.y),
            bottom: Math.max(tl.y, br.y),
            width: Math.abs(br.x - tl.x),
            height: Math.abs(br.y - tl.y)
          };
        }
      }

      // 2. Direct transform from SVG (0, 0, w, h) to overlay space
      const overlayInverse = overlay.getScreenCTM()?.inverse();
      const svgCtm = svg.getScreenCTM();
      if (overlayInverse && svgCtm) {
        const svgMatrix = overlayInverse.multiply(svgCtm);
        const w = baseWidth || svg.viewBox?.baseVal?.width || parseFloat(svg.getAttribute('width')) || 800;
        const h = baseHeight || svg.viewBox?.baseVal?.height || parseFloat(svg.getAttribute('height')) || 600;
        const pt = overlay.createSVGPoint();
        pt.x = 0; pt.y = 0;
        const tl = pt.matrixTransform(svgMatrix);
        pt.x = w; pt.y = h;
        const br = pt.matrixTransform(svgMatrix);
        return {
          left: Math.min(tl.x, br.x),
          right: Math.max(tl.x, br.x),
          top: Math.min(tl.y, br.y),
          bottom: Math.max(tl.y, br.y),
          width: Math.abs(br.x - tl.x),
          height: Math.abs(br.y - tl.y)
        };
      }
      return null;
    };

    const getOverlayRect = (el) => {
      if (!el) return null;
      const isFrameOrBg = el.getAttribute && (
        el.getAttribute('data-type') === 'frame' ||
        el.getAttribute('data-type') === 'background' ||
        el.getAttribute('data-name') === 'Overlay'
      );
      if (isFrameOrBg) {
        const clientRect = el.getBoundingClientRect();
        const overlayInverse = overlay.getScreenCTM()?.inverse();
        if (overlayInverse && clientRect.width > 0) {
          const pt = overlay.createSVGPoint();
          pt.x = clientRect.left; pt.y = clientRect.top;
          const tl = pt.matrixTransform(overlayInverse);
          pt.x = clientRect.right; pt.y = clientRect.bottom;
          const br = pt.matrixTransform(overlayInverse);
          return {
            left: Math.min(tl.x, br.x),
            right: Math.max(tl.x, br.x),
            top: Math.min(tl.y, br.y),
            bottom: Math.max(tl.y, br.y),
            width: Math.abs(br.x - tl.x),
            height: Math.abs(br.y - tl.y)
          };
        }
      }

      let bbox = getVisualBBox(el);
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
        try {
          const bb = el.getBBox();
          if (bb && (bb.width > 0 || bb.height > 0)) {
            bbox = { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
          }
        } catch { /* ignored */ }
      }
      if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null;

      const ctmNode = el;
      const ctm = ctmNode.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) return null;

      const svgMatrix = overlayCtm.inverse().multiply(ctm);
      const pts = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        { x: bbox.x, y: bbox.y + bbox.height }
      ];

      const mapped = pts.map(p => {
        const pt = overlay.createSVGPoint();
        pt.x = p.x;
        pt.y = p.y;
        return pt.matrixTransform(svgMatrix);
      });

      const xs = mapped.map(p => p.x);
      const ys = mapped.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        left: minX,
        right: maxX,
        top: minY,
        bottom: maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    };

    let rect1 = getOverlayRect(selectedEl);
    if (multiSelectedIdsRef.current && multiSelectedIdsRef.current.size > 1) {
      const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      multiSelectedIdsRef.current.forEach(id => {
        const el = svg.querySelector(`[id="${id}"]`);
        if (el) {
          const r = getOverlayRect(el);
          if (r) {
            bounds.left = Math.min(bounds.left, r.left);
            bounds.top = Math.min(bounds.top, r.top);
            bounds.right = Math.max(bounds.right, r.right);
            bounds.bottom = Math.max(bounds.bottom, r.bottom);
          }
        }
      });
      if (bounds.left !== Infinity) {
        rect1 = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
      }
    }

    const isParent = !measureTargetArray && (isPageOrBackground(measureTarget) || (measureTarget && typeof measureTarget.contains === 'function' && measureTarget.contains(selectedEl)));

    let rect2 = null;
    if (measureTargetArray) {
      const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      measureTargetArray.forEach(el => {
        if (!el) return;
        const r = getOverlayRect(el);
        if (r) {
          bounds.left = Math.min(bounds.left, r.left);
          bounds.top = Math.min(bounds.top, r.top);
          bounds.right = Math.max(bounds.right, r.right);
          bounds.bottom = Math.max(bounds.bottom, r.bottom);
        }
      });
      if (bounds.left !== Infinity) {
        rect2 = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
      }
    } else if (isPageOrBackground(measureTarget)) {
      rect2 = getPageCanvasRect();
    } else {
      rect2 = getOverlayRect(measureTarget);
    }

    if (!rect1 || !rect2) return;

    // Map viewport pixels to mm using the actual base document dimensions
    const ptToMmScale = baseWidth / ((window.innerHeight * 0.78) * (baseWidth / baseHeight));
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'measurement-overlay-group');
    g.style.pointerEvents = 'none';

    const zoomScale = zoom / 100;
    const invScale = 1 / zoomScale;

    // ── SVG arrowhead marker – chevron style based on 24x24 icon, outer end only ──
    const overlayId = overlay.id || 'default';
    const markerEndId = `meas-arrow-end-${overlayId}`;
    const MEAS_COLOR = '#00a58e';
    const MARKER_SIZE = 10 * invScale;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Open chevron arrow (> shape) — stroke only, round cap & join
    const markerEnd = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    markerEnd.setAttribute('id', markerEndId);
    markerEnd.setAttribute('viewBox', '0 0 24 24');
    markerEnd.setAttribute('markerWidth', String(MARKER_SIZE));
    markerEnd.setAttribute('markerHeight', String(MARKER_SIZE));
    markerEnd.setAttribute('refX', '16');   // tip at line endpoint
    markerEnd.setAttribute('refY', '12');
    markerEnd.setAttribute('orient', 'auto');
    markerEnd.setAttribute('markerUnits', 'userSpaceOnUse');

    const endPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    endPath.setAttribute('d', 'M8 4l8 8l-8 8');
    endPath.setAttribute('fill', 'none');
    endPath.setAttribute('stroke', MEAS_COLOR);
    endPath.setAttribute('stroke-width', '2.5');
    endPath.setAttribute('stroke-linecap', 'round');
    endPath.setAttribute('stroke-linejoin', 'round');
    markerEnd.appendChild(endPath);
    defs.appendChild(markerEnd);
    g.appendChild(defs);

    const drawLineAndLabel = (x1, y1, x2, y2, value) => {
      // Use Math.abs so outside-page distances (negative values) still render correctly
      if (Math.abs(value) < 0.5) return;
      const mm = (Math.abs(value) * ptToMmScale).toFixed(1);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', MEAS_COLOR);
      line.setAttribute('stroke-width', String(1 * invScale));
      // Arrow only at the outer (canvas / target boundary) end — no inner arrow
      line.setAttribute('marker-end', `url(#${markerEndId})`);
      g.appendChild(line);

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;

      const tw = Math.max(24, mm.length * 6.5) * invScale;
      const th = 14 * invScale;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', cx - tw / 2);
      rect.setAttribute('y', cy - th / 2);
      rect.setAttribute('width', tw);
      rect.setAttribute('height', th);
      rect.setAttribute('rx', String(3.5 * invScale));
      rect.setAttribute('fill', MEAS_COLOR);
      g.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy + (3.5 * invScale));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', `${9 * invScale}px`);
      text.setAttribute('font-family', 'sans-serif');
      text.setAttribute('font-weight', '500');
      text.textContent = mm;
      g.appendChild(text);
    };

    const drawSolidLine = (x1, y1, x2, y2) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#00a58e');
      line.setAttribute('stroke-width', String(1 * invScale));
      line.setAttribute('stroke-dasharray', `${4 * invScale} ${2 * invScale}`);
      g.appendChild(line);
    };

    const cx1 = rect1.left + rect1.width / 2;
    const cy1 = rect1.top + rect1.height / 2;

    if (isParent) {
      // Horizontal measurement
      if (rect1.right <= rect2.left) {
        // Completely to the left of the page:
        const lineOffset = 28 * invScale;
        const innerY = (cy1 + lineOffset > rect2.bottom - 20 * invScale)
          ? Math.max(rect2.top + 20 * invScale, cy1 - lineOffset)
          : cy1 + lineOffset;

        // 1. External distance (from outer end of element to left page edge) on primary axis
        drawLineAndLabel(rect1.left, cy1, rect2.left, cy1, rect2.left - rect1.left);
        // 2. Inside measurement (distance across the page from left to right edge) on separate offset line
        drawLineAndLabel(rect2.left, innerY, rect2.right, innerY, rect2.right - rect2.left);
        // Vertical dashed extension line connecting the two measurement lines at the page edge
        drawSolidLine(rect2.left, Math.min(cy1, innerY), rect2.left, Math.max(cy1, innerY));
      } else if (rect1.left >= rect2.right) {
        // Completely to the right of the page:
        const lineOffset = 28 * invScale;
        const innerY = (cy1 + lineOffset > rect2.bottom - 20 * invScale)
          ? Math.max(rect2.top + 20 * invScale, cy1 - lineOffset)
          : cy1 + lineOffset;

        // 1. External distance (from outer end of element to right page edge) on primary axis
        drawLineAndLabel(rect1.right, cy1, rect2.right, cy1, rect1.right - rect2.right);
        // 2. Inside measurement (distance across the page from right to left edge) on separate offset line
        drawLineAndLabel(rect2.right, innerY, rect2.left, innerY, rect2.right - rect2.left);
        // Vertical dashed extension line connecting the two measurement lines at the page edge
        drawSolidLine(rect2.right, Math.min(cy1, innerY), rect2.right, Math.max(cy1, innerY));
      } else {
        // Partially outside or completely inside
        drawLineAndLabel(rect1.left, cy1, rect2.left, cy1, rect1.left - rect2.left);
        drawLineAndLabel(rect1.right, cy1, rect2.right, cy1, rect2.right - rect1.right);
      }

      // Vertical measurement
      if (rect1.bottom <= rect2.top) {
        // Completely above the page:
        const lineOffset = 28 * invScale;
        const innerX = (cx1 + lineOffset > rect2.right - 20 * invScale)
          ? Math.max(rect2.left + 20 * invScale, cx1 - lineOffset)
          : cx1 + lineOffset;

        // 1. External distance (from outer end of element to top page edge) on primary axis
        drawLineAndLabel(cx1, rect1.top, cx1, rect2.top, rect2.top - rect1.top);
        // 2. Inside measurement (distance across the page from top to bottom edge) on separate offset line
        drawLineAndLabel(innerX, rect2.top, innerX, rect2.bottom, rect2.bottom - rect2.top);
        // Horizontal dashed extension line connecting the two measurement lines at the page edge
        drawSolidLine(Math.min(cx1, innerX), rect2.top, Math.max(cx1, innerX), rect2.top);
      } else if (rect1.top >= rect2.bottom) {
        // Completely below the page:
        const lineOffset = 28 * invScale;
        const innerX = (cx1 + lineOffset > rect2.right - 20 * invScale)
          ? Math.max(rect2.left + 20 * invScale, cx1 - lineOffset)
          : cx1 + lineOffset;

        // 1. External distance (from outer end of element to bottom page edge) on primary axis
        drawLineAndLabel(cx1, rect1.bottom, cx1, rect2.bottom, rect1.bottom - rect2.bottom);
        // 2. Inside measurement (distance across the page from bottom to top edge) on separate offset line
        drawLineAndLabel(innerX, rect2.bottom, innerX, rect2.top, rect2.bottom - rect2.top);
        // Horizontal dashed extension line connecting the two measurement lines at the page edge
        drawSolidLine(Math.min(cx1, innerX), rect2.bottom, Math.max(cx1, innerX), rect2.bottom);
      } else {
        // Partially outside or completely inside
        drawLineAndLabel(cx1, rect1.top, cx1, rect2.top, rect1.top - rect2.top);
        drawLineAndLabel(cx1, rect1.bottom, cx1, rect2.bottom, rect2.bottom - rect1.bottom);
      }

      // Extension dashed lines if element center is outside the page boundaries
      if (cx1 < rect2.left) {
        drawSolidLine(rect2.left, rect2.top, cx1, rect2.top);
        drawSolidLine(rect2.left, rect2.bottom, cx1, rect2.bottom);
      } else if (cx1 > rect2.right) {
        drawSolidLine(rect2.right, rect2.top, cx1, rect2.top);
        drawSolidLine(rect2.right, rect2.bottom, cx1, rect2.bottom);
      }
      if (cy1 < rect2.top) {
        drawSolidLine(rect2.left, rect2.top, rect2.left, cy1);
        drawSolidLine(rect2.right, rect2.top, rect2.right, cy1);
      } else if (cy1 > rect2.bottom) {
        drawSolidLine(rect2.left, rect2.bottom, rect2.left, cy1);
        drawSolidLine(rect2.right, rect2.bottom, rect2.right, cy1);
      }
    } else {
      const cx2 = rect2.left + rect2.width / 2;
      const cy2 = rect2.top + rect2.height / 2;

      const drawY = cy2;
      const drawX = cx2;

      // Horizontal measurement
      if (rect1.left >= rect2.right) {
        drawLineAndLabel(rect1.left, drawY, rect2.right, drawY, rect1.left - rect2.right);
        if (drawY < rect1.top) drawSolidLine(rect1.left, rect1.top, rect1.left, drawY);
        else if (drawY > rect1.bottom) drawSolidLine(rect1.left, rect1.bottom, rect1.left, drawY);
      } else if (rect1.right <= rect2.left) {
        drawLineAndLabel(rect1.right, drawY, rect2.left, drawY, rect2.left - rect1.right);
        if (drawY < rect1.top) drawSolidLine(rect1.right, rect1.top, rect1.right, drawY);
        else if (drawY > rect1.bottom) drawSolidLine(rect1.right, rect1.bottom, rect1.right, drawY);
      } else {
        const isCompletelyInsideX = rect1.left >= rect2.left && rect1.right <= rect2.right;

        if ((isCompletelyInsideX || rect1.left < rect2.left) && Math.abs(rect1.left - rect2.left) >= 0.5) {
          drawLineAndLabel(rect1.left, drawY, rect2.left, drawY, Math.abs(rect1.left - rect2.left));
          if (drawY < rect1.top) drawSolidLine(rect1.left, rect1.top, rect1.left, drawY);
          else if (drawY > rect1.bottom) drawSolidLine(rect1.left, rect1.bottom, rect1.left, drawY);
        }
        if ((isCompletelyInsideX || rect1.right > rect2.right) && Math.abs(rect1.right - rect2.right) >= 0.5) {
          drawLineAndLabel(rect1.right, drawY, rect2.right, drawY, Math.abs(rect1.right - rect2.right));
          if (drawY < rect1.top) drawSolidLine(rect1.right, rect1.top, rect1.right, drawY);
          else if (drawY > rect1.bottom) drawSolidLine(rect1.right, rect1.bottom, rect1.right, drawY);
        }
      }

      // Vertical measurement
      if (rect1.top >= rect2.bottom) {
        drawLineAndLabel(drawX, rect1.top, drawX, rect2.bottom, rect1.top - rect2.bottom);
        if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.top, drawX, rect1.top);
        else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.top, drawX, rect1.top);
      } else if (rect1.bottom <= rect2.top) {
        drawLineAndLabel(drawX, rect1.bottom, drawX, rect2.top, rect2.top - rect1.bottom);
        if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.bottom, drawX, rect1.bottom);
        else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.bottom, drawX, rect1.bottom);
      } else {
        const isCompletelyInsideY = rect1.top >= rect2.top && rect1.bottom <= rect2.bottom;

        if ((isCompletelyInsideY || rect1.top < rect2.top) && Math.abs(rect1.top - rect2.top) >= 0.5) {
          drawLineAndLabel(drawX, rect1.top, drawX, rect2.top, Math.abs(rect1.top - rect2.top));
          if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.top, drawX, rect1.top);
          else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.top, drawX, rect1.top);
        }
        if ((isCompletelyInsideY || rect1.bottom > rect2.bottom) && Math.abs(rect1.bottom - rect2.bottom) >= 0.5) {
          drawLineAndLabel(drawX, rect1.bottom, drawX, rect2.bottom, Math.abs(rect1.bottom - rect2.bottom));
          if (drawX < rect1.left) drawSolidLine(rect1.left, rect1.bottom, drawX, rect1.bottom);
          else if (drawX > rect1.right) drawSolidLine(rect1.right, rect1.bottom, drawX, rect1.bottom);
        }
      }
    }

    // Draw green AABB outline around the hovered/target element (rect2) ONLY when hovering an actual element, NOT the page
    if (!isParent && !isPageOrBackground(measureTarget)) {
      const targetRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      targetRect.setAttribute('x', rect2.left);
      targetRect.setAttribute('y', rect2.top);
      targetRect.setAttribute('width', rect2.width);
      targetRect.setAttribute('height', rect2.height);
      targetRect.setAttribute('fill', 'none');
      targetRect.setAttribute('stroke', '#00a58e');
      targetRect.setAttribute('stroke-width', String(1 * invScale));
      g.appendChild(targetRect);
    }

    // Draw green AABB outline around the selected element (rect1) when it is rotated.
    // A rotated element's visual selection box follows its angle, so without this AABB
    // the measurement lines appear to float — the green box makes the anchor clear.
    try {
      const ctm = selectedEl.getScreenCTM();
      if (ctm) {
        // Detect rotation: if a ≠ 1 or b ≠ 0 the element has a rotation or scale
        const angleRad = Math.atan2(ctm.b, ctm.a);
        const isRotated = Math.abs(angleRad) > 0.01; // > ~0.6 degrees
        if (isRotated) {
          const selectedAABB = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          selectedAABB.setAttribute('x', rect1.left);
          selectedAABB.setAttribute('y', rect1.top);
          selectedAABB.setAttribute('width', rect1.width);
          selectedAABB.setAttribute('height', rect1.height);
          selectedAABB.setAttribute('fill', 'none');
          selectedAABB.setAttribute('stroke', '#00a58e');
          selectedAABB.setAttribute('stroke-width', String(1 * invScale));
          selectedAABB.removeAttribute('stroke-dasharray');
          selectedAABB.setAttribute('opacity', '0.7');
          g.appendChild(selectedAABB);
        }
      }
    } catch { /* non-critical */ }

    overlay.appendChild(g);
  };

  // Wire to ref so it can be called imperatively from other hooks
  drawMeasurementOverlayRef.current = drawMeasurementOverlay;

  return { drawMeasurementOverlay, clearMeasurementOverlay };
};
