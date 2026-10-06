import { isElementCropped } from '../properties/Crop';
import { getVisualBBox } from './geometryUtils';

/**
 * Returns direct children of the SVG root that represent selectable top-level frames/layers.
 */
export const getTopLevelFrames = (svg) => {
  if (!svg || !svg.children) return [];
  return Array.from(svg.children).filter(el =>
    el.id &&
    el.tagName.toLowerCase() !== 'style' &&
    el.tagName.toLowerCase() !== 'defs' &&
    el.getAttribute('data-hidden') !== 'true' &&
    el.getAttribute('data-locked') !== 'true'
  );
};

/**
 * Returns direct children of a given container element that have IDs and act as child frames.
 */
export const getDirectChildFrames = (el) => {
  if (!el || !el.children) return [];
  const tag = el.tagName?.toLowerCase();
  if (tag !== 'g' && tag !== 'svg' && tag !== 'multi') {
    return [];
  }

  // If this element is an image/video/gif group, it acts as a single layer
  if (el.getAttribute('data-is-image-group') || el.getAttribute('data-is-video-group') || el.getAttribute('data-is-gif-group')) {
    return [];
  }

  return Array.from(el.children).filter(child =>
    child.id &&
    child.tagName.toLowerCase() !== 'style' &&
    child.tagName.toLowerCase() !== 'defs' &&
    child.getAttribute('data-hidden') !== 'true' &&
    child.getAttribute('data-locked') !== 'true' &&
    child.getAttribute('data-name') !== 'Overlay'
  );
};

/**
 * Checks if a point (clientX, clientY) hits an element's bounding box or visual boundaries.
 */
export const hitTest = (el, clientX, clientY, buffer = 0, selectedLayerId = null, multiSelectedIds = null) => {
  if (!el) return false;

  // If element is completely outside in Trim View and NOT currently selected, NEVER hit test it
  const isTrimOutside = el.getAttribute?.('data-trim-outside') === 'true' || (typeof el.closest === 'function' && el.closest('[data-trim-outside="true"]'));
  if (isTrimOutside) {
    const isSelected = (selectedLayerId && (selectedLayerId === el.id || el.closest?.(`[id="${selectedLayerId}"]`))) ||
      (multiSelectedIds && (multiSelectedIds.has(el.id) || (el.id && multiSelectedIds.has(el.id))));
    if (!isSelected) {
      return false;
    }
  }

  const isCroppedEl = isElementCropped(el);

  // 1. Native browser hit testing
  const hitElements = document.elementsFromPoint(clientX, clientY);
  const isHit = hitElements.includes(el) || (typeof el.contains === 'function' && hitElements.some(he => el.contains(he)));
  if (isHit) {
    if (!isCroppedEl) return true;
  }

  const isVectorPath = el.getAttribute('data-type') === 'vector-path' || (el.tagName && el.tagName.toLowerCase() === 'path');
  if (isVectorPath) {
    const isSelected = (selectedLayerId && selectedLayerId === el.id) ||
      (multiSelectedIds && multiSelectedIds.has(el.id));
    if (!isSelected) {
      return false;
    }
  }

  // 2. Extrapolated local Bounding Box hit testing
  if (typeof el.getScreenCTM === 'function') {
    const svg = el.ownerSVGElement || (el.tagName && el.tagName.toLowerCase() === 'svg' ? el : null);
    if (svg && typeof svg.createSVGPoint === 'function') {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      try {
        const ctm = el.getScreenCTM();
        if (ctm) {
          const localPt = pt.matrixTransform(ctm.inverse());
          const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
          const localBuffer = buffer / scale;

          let bbox = getVisualBBox(el);
          if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
            try { bbox = el.getBBox(); } catch { /* ignored */ }
          }

          if (bbox) {
            return (
              localPt.x >= bbox.x - localBuffer &&
              localPt.x <= bbox.x + bbox.width + localBuffer &&
              localPt.y >= bbox.y - localBuffer &&
              localPt.y <= bbox.y + bbox.height + localBuffer
            );
          }
        }
      } catch {
        /* fallback to visual bounds */
      }
    }
  }

  // 3. Fallback check using visual bbox mapped to screen coordinates if getScreenCTM fails
  try {
    const bbox = getVisualBBox(el);
    const ctm = el.getScreenCTM ? el.getScreenCTM() : null;
    if (ctm && bbox && bbox.width > 0 && bbox.height > 0) {
      const pt1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm);
      const pt2 = new DOMPoint(bbox.x + bbox.width, bbox.y).matrixTransform(ctm);
      const pt3 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm);
      const pt4 = new DOMPoint(bbox.x, bbox.y + bbox.height).matrixTransform(ctm);
      const minX = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
      const maxX = Math.max(pt1.x, pt2.x, pt3.x, pt4.x);
      const minY = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
      const maxY = Math.max(pt1.y, pt2.y, pt3.y, pt4.y);

      return clientX >= minX - buffer && clientX <= maxX + buffer &&
        clientY >= minY - buffer && clientY <= maxY + buffer;
    }
  } catch { /* ignored */ }

  const rect = el.getBoundingClientRect();
  return clientX >= rect.left - buffer && clientX <= rect.right + buffer &&
    clientY >= rect.top - buffer && clientY <= rect.bottom + buffer;
};
