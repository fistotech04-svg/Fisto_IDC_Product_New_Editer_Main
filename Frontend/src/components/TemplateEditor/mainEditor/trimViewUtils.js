/**
 * Trim View utilities for template canvas.
 *
 * In Trim View:
 * - Elements partially outside the page boundary render with 50% opacity in the outside area
 *   via the Trim View backdrop mat overlay with a page boundary dashed line, while the inside
 *   portion remains at 100% opacity.
 * - Elements completely outside the page boundary render with 0% opacity (invisible).
 * - Selection box (bounding polygon, 8 resize handles, rotate handle) remains at 100% opacity
 *   with all functions (resize, rotate, move) fully operational everywhere.
 * - If an element is completely outside and selected in the layers panel, only its selection box
 *   is shown at 100% opacity so the user can drag it back onto the canvas, while the element itself stays at 0% opacity.
 */

export const isExcludedFromTrim = (el) => {
  if (!el || !el.getAttribute) return true;
  const dn = el.getAttribute('data-name');
  const dt = el.getAttribute('data-type');
  const id = el.id || '';
  const tag = el.tagName?.toLowerCase() || '';
  return (
    tag === 'defs' ||
    tag === 'style' ||
    dn === 'Overlay' ||
    dt === 'background' ||
    dt === 'frame' ||
    dn === 'Document Shield' ||
    id.startsWith('shield-') ||
    id.startsWith('trim-view-')
  );
};

export const isElementCompletelyOutside = (el, svg) => {
  if (!el) return false;
  const svgEl = svg || el.ownerSVGElement || el.closest?.('svg');
  if (!svgEl) return false;

  const pageRect = svgEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (!pageRect || pageRect.width === 0 || pageRect.height === 0) return false;
  if (!elRect || (elRect.width === 0 && elRect.height === 0)) return false;

  // Return true if the element has zero overlap with the page rectangle (1px tolerance)
  return (
    elRect.right <= pageRect.left + 1 ||
    elRect.left >= pageRect.right - 1 ||
    elRect.bottom <= pageRect.top + 1 ||
    elRect.top >= pageRect.bottom - 1
  );
};

export const applyTrimViewToSvg = (svg, isTrimView) => {
  if (!svg) return;

  if (!isTrimView) {
    svg.querySelectorAll('[data-trim-outside]').forEach(el => {
      el.removeAttribute('data-trim-outside');
    });
    return;
  }

  const processNode = (node) => {
    if (isExcludedFromTrim(node)) return;

    if (isElementCompletelyOutside(node, svg)) {
      node.setAttribute('data-trim-outside', 'true');
    } else {
      node.removeAttribute('data-trim-outside');
    }

    if (node.children && node.children.length > 0) {
      Array.from(node.children).forEach(child => {
        if (isExcludedFromTrim(child)) return;
        if (isElementCompletelyOutside(child, svg)) {
          child.setAttribute('data-trim-outside', 'true');
        } else {
          child.removeAttribute('data-trim-outside');
        }
      });
    }
  };

  Array.from(svg.children).forEach(child => processNode(child));
};

export const cleanTrimViewFromHtml = (containerOrSvg) => {
  if (!containerOrSvg) return;
  containerOrSvg.querySelectorAll('[data-trim-outside]').forEach(el => {
    el.removeAttribute('data-trim-outside');
  });
};
