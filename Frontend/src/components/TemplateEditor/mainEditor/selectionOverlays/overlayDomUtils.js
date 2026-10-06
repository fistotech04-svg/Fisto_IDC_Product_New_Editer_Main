/**
 * DOM and cursor utilities for selection overlays.
 */

/**
 * Make a selection polygon render as a crisp, uniform 1 screen-pixel line on all 4 sides
 * at any zoom level, matching smart-guide line strength without asymmetric raster artifacts.
 */
export const applyCrispSelectionStroke = (polygon, pointsStr, zoomScale, thickness = 1.25) => {
  if (!polygon) return;
  if (pointsStr != null) polygon.setAttribute('points', pointsStr);
  polygon.removeAttribute('vector-effect');
  polygon.setAttribute('stroke-linejoin', 'miter');
  polygon.setAttribute('stroke-miterlimit', '4');
  polygon.removeAttribute('stroke-dasharray');
  polygon.setAttribute('shape-rendering', 'geometricPrecision');

  let scale = zoomScale;
  if (!scale) {
    try {
      const ctm = polygon.getScreenCTM();
      if (ctm) scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b);
    } catch {
      scale = 1;
    }
  }
  const strokeW = scale ? (thickness / scale).toFixed(3) : String(thickness);
  polygon.setAttribute('stroke-width', strokeW);
};

export const isElementHidden = (target) => {
  if (!target) return true;
  if (
    target.getAttribute?.('data-hidden') === 'true' ||
    target.style?.display === 'none' ||
    target.getAttribute?.('display') === 'none' ||
    target.style?.visibility === 'hidden' ||
    target.getAttribute?.('visibility') === 'hidden' ||
    target.getAttribute?.('opacity') === '0' ||
    (target.style?.opacity === '0' && !target.hasAttribute?.('data-trim-outside'))
  ) {
    return true;
  }
  if (typeof target.closest === 'function') {
    if (
      target.closest('[data-hidden="true"]') ||
      target.closest('[style*="display: none"]') ||
      target.closest('[style*="display:none"]') ||
      target.closest('[visibility="hidden"]') ||
      target.closest('[display="none"]')
    ) {
      return true;
    }
  }
  return false;
};

export const purgeElementOverlays = (elOrId) => {
  if (!elOrId) return;
  const id = typeof elOrId === 'string' ? elOrId : elOrId.id;
  if (!id) return;
  document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
    overlay.querySelectorAll(`[id*="${id}"]`).forEach(n => n.remove());
  });
  document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
    htmlOverlay.querySelectorAll(`[id*="${id}"], [id^="resize-handle-${id}-"], [id^="rotate-handle-${id}"], [id^="rotation-degree-badge-${id}"], [id^="rotate-hotspot-${id}-"]`).forEach(h => h.remove());
  });
};

export const getOverlayForElement = (el) => {
  if (!el || typeof el.closest !== 'function') return null;
  const container = el.closest('.page-svg-container');
  if (!container) return null;
  const pageIdx = container.getAttribute('data-page-index');
  return document.getElementById(`highlight-overlay-${pageIdx}`);
};

export const getHtmlOverlayForElement = (el) => {
  if (!el || typeof el.closest !== 'function') return null;
  const container = el.closest('.page-svg-container');
  if (!container) return null;
  const pageIdx = container.getAttribute('data-page-index');
  return document.getElementById(`highlight-overlay-html-${pageIdx}`);
};

export const getRotatingCursor = (dir, rotation) => {
  if (dir === 'linestart' || dir === 'lineend') return 'all-scroll';

  // Map base directions to their local angles (0 is East/Right)
  const baseAngles = { 'e': 0, 'se': 45, 's': 90, 'sw': 135, 'w': 180, 'nw': 225, 'n': 270, 'ne': 315 };
  const angle = (baseAngles[dir] + rotation + 360) % 180;

  if (angle >= 22.5 && angle < 67.5) return 'nwse-resize';
  if (angle >= 67.5 && angle < 112.5) return 'ns-resize';
  if (angle >= 112.5 && angle < 157.5) return 'nesw-resize';
  return 'ew-resize';
};

/**
 * Creates or updates invisible hitbox strips along the 4 edges of the selection box,
 * allowing four-side resize anywhere along each border line, not only the side dots.
 */
export const createOrUpdateEdgeHandles = ({
  htmlOverlay,
  targetId,
  cornersMap,
  rotation = 0,
  zoomScale = 1,
  show = true
}) => {
  if (!htmlOverlay || !cornersMap) return;

  const edgeNames = ['n', 'e', 's', 'w'];
  if (!show) {
    edgeNames.forEach(dir => {
      const h = htmlOverlay.querySelector(`[id="resize-handle-${CSS.escape(targetId)}-edge-${dir}"]`) ||
        htmlOverlay.querySelector(`[id="resize-handle-${targetId}-edge-${dir}"]`);
      if (h) h.remove();
    });
    return;
  }

  const edges = [
    { dir: 'n', p1: cornersMap.nw, p2: cornersMap.ne },
    { dir: 'e', p1: cornersMap.ne, p2: cornersMap.se },
    { dir: 's', p1: cornersMap.sw, p2: cornersMap.se },
    { dir: 'w', p1: cornersMap.nw, p2: cornersMap.sw }
  ];

  // Hitbox thickness in overlay space (approx 10 screen pixels thick)
  const hitThickness = 10 / (zoomScale || 1);

  edges.forEach(({ dir, p1, p2 }) => {
    if (!p1 || !p2) return;
    const handleId = `resize-handle-${targetId}-edge-${dir}`;
    let handle = null;
    try {
      handle = htmlOverlay.querySelector(`[id="${CSS.escape(handleId)}"]`);
    } catch {
      handle = htmlOverlay.querySelector(`[id="${handleId}"]`);
    }

    if (!handle) {
      handle = document.createElement('div');
      handle.id = handleId;
      handle.className = 'resize-handle overlay-type-selected absolute';
      handle.style.position = 'absolute';
      handle.style.left = '0px';
      handle.style.top = '0px';
      handle.style.transformOrigin = '0 0';
      handle.style.willChange = 'transform';
      handle.style.boxSizing = 'border-box';
      handle.style.pointerEvents = 'auto';
      handle.style.backgroundColor = 'transparent';
      handle.style.border = 'none';
      handle.style.boxShadow = 'none';
      handle.style.outline = 'none';
      handle.style.zIndex = '998'; // Below corner handles (1000) and side dots (999)
      htmlOverlay.appendChild(handle);
    }

    handle.style.display = '';

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len <= 0) {
      handle.style.display = 'none';
      return;
    }

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const edgeAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    handle.style.width = `${len.toFixed(2)}px`;
    handle.style.height = `${hitThickness.toFixed(2)}px`;
    handle.style.transform = `translate3d(${midX.toFixed(2)}px, ${midY.toFixed(2)}px, 0) rotate(${edgeAngle.toFixed(2)}deg) translate(-50%, -50%)`;
    handle.style.cursor = getRotatingCursor(dir, rotation);
  });
};
