import { getVisualBBox } from './geometryUtils';

/**
 * Computes an element's axis-aligned bounding box projected into the SVG coordinate space.
 */
export const getBoxInSvg = (el, svg) => {
  if (!el || typeof el.getBBox !== 'function' || !svg) return null;
  let bbox = null;
  try {
    bbox = getVisualBBox(el);
  } catch {
    /* fallback */
  }
  if (!bbox || (bbox.width === 0 && bbox.height === 0)) {
    try {
      bbox = el.getBBox();
    } catch {
      /* fallback */
    }
  }
  if (!bbox || (bbox.width === 0 && bbox.height === 0)) return null;

  try {
    const elCtm = el.getScreenCTM();
    const svgCtm = svg.getScreenCTM();
    if (!elCtm || !svgCtm) return null;

    const m = svgCtm.inverse().multiply(elCtm);
    const pts = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      { x: bbox.x, y: bbox.y + bbox.height }
    ];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      const tx = m.a * p.x + m.c * p.y + m.e;
      const ty = m.b * p.x + m.d * p.y + m.f;
      if (tx < minX) minX = tx;
      if (tx > maxX) maxX = tx;
      if (ty < minY) minY = ty;
      if (ty > maxY) maxY = ty;
    }

    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  } catch {
    return null;
  }
};

/**
 * Caches alignment candidate boxes, page boundaries, and screen scale factor on drag start.
 */
export const initSmartGuides = (dragState) => {
  if (!dragState || !dragState.svgElement || !dragState.element) return;
  const svg = dragState.svgElement;
  const target = dragState.element;

  // Page / Canvas bounds in SVG user units
  const viewBox = svg.viewBox?.baseVal;
  const pageW = (viewBox && viewBox.width > 0) ? viewBox.width : (parseFloat(svg.getAttribute('width')) || 595.28);
  const pageH = (viewBox && viewBox.height > 0) ? viewBox.height : (parseFloat(svg.getAttribute('height')) || 841.89);

  // Physical screen scale factor (screen pixels per canvas unit)
  let scaleFactor = 1;
  try {
    const svgCtm = svg.getScreenCTM();
    if (svgCtm && svgCtm.a) {
      scaleFactor = Math.hypot(svgCtm.a, svgCtm.b) || 1;
    }
  } catch {
    /* fallback */
  }

  // Initial box of the dragged element in SVG space
  const targetBox = getBoxInSvg(target, svg);
  if (!targetBox) return;

  // Collect IDs to exclude (target, children, multi-selected elements)
  const excludedIds = new Set();
  excludedIds.add(target.id);
  target.querySelectorAll('[id]').forEach(c => excludedIds.add(c.id));
  if (dragState.multiDragItems) {
    dragState.multiDragItems.forEach(item => {
      excludedIds.add(item.element.id);
      item.element.querySelectorAll('[id]').forEach(c => excludedIds.add(c.id));
    });
  }

  // Collect all candidate elements on this canvas
  const candidates = [];
  const allElements = svg.querySelectorAll('[id]:not(defs):not(clipPath):not(style):not(script)');
  allElements.forEach(el => {
    if (excludedIds.has(el.id)) return;
    const name = el.getAttribute('data-name') || '';
    const type = el.getAttribute('data-type') || '';
    if (name === 'Overlay' || name === 'Document Shield' || type === 'background' || type === 'shield') return;
    if (el.getAttribute('data-hidden') === 'true' || el.style.visibility === 'hidden' || el.style.display === 'none') return;
    if (el.closest('[data-name="Overlay"]') || el.closest('[data-type="background"]')) return;
    if (el === svg) return;

    // Skip nested children inside groups to align with group bounds
    const parentGroup = el.parentElement?.closest('g[id]');
    if (parentGroup && parentGroup !== svg && !excludedIds.has(parentGroup.id)) {
      if (
        parentGroup.getAttribute('data-type') === 'group' ||
        parentGroup.id.startsWith('group-') ||
        parentGroup.getAttribute('data-is-image-group') === 'true' ||
        parentGroup.getAttribute('data-is-video-group') === 'true' ||
        parentGroup.getAttribute('data-is-gif-group') === 'true'
      ) {
        return;
      }
    }

    const box = getBoxInSvg(el, svg);
    if (box && box.width > 0 && box.height > 0) {
      if (!candidates.some(c => c.id === el.id)) {
        candidates.push({ id: el.id, ...box });
      }
    }
  });

  dragState.smartGuidesData = {
    pageW,
    pageH,
    scaleFactor,
    targetInitialBox: targetBox,
    candidates
  };
};

/**
 * Calculates smart snapping against page boundaries and candidate elements.
 * Returns snapped translations, active guide lines, and coordinate badge data.
 */
export const computeSmartGuides = ({
  dragState,
  rawDx,
  rawDy,
  zoomScale = 1,
  disabled = false
}) => {
  if (disabled || !dragState?.smartGuidesData) {
    return {
      snappedDx: rawDx,
      snappedDy: rawDy,
      guides: [],
      badge: null
    };
  }

  const { pageW, pageH, scaleFactor = 1, targetInitialBox, candidates } = dragState.smartGuidesData;

  // Proposed dragged box before snapping
  let curLeft = targetInitialBox.left + rawDx;
  let curRight = targetInitialBox.right + rawDx;
  let curTop = targetInitialBox.top + rawDy;
  let curBottom = targetInitialBox.bottom + rawDy;
  let curCenterX = (curLeft + curRight) / 2;
  let curCenterY = (curTop + curBottom) / 2;

  // Snap threshold in canvas units (normalized to exactly 5 screen pixels)
  const threshold = 5 / (scaleFactor || 1);

  let snappedDx = rawDx;
  let snappedDy = rawDy;
  let bestDiffX = Infinity;

  // ── 1. Horizontal Snapping (X Axis) ──
  const pageXSnaps = [
    { val: 0, isPage: true },
    { val: pageW / 2, isPage: true },
    { val: pageW, isPage: true }
  ];

  // Test against canvas page bounds & center
  for (const p of pageXSnaps) {
    for (const myX of [curLeft, curCenterX, curRight]) {
      const diff = myX - p.val;
      if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffX)) {
        bestDiffX = diff;
      }
    }
  }

  // Test against other candidate elements
  for (const cand of candidates) {
    const candXPoints = [cand.left, cand.centerX, cand.right];
    for (const cX of candXPoints) {
      for (const myX of [curLeft, curCenterX, curRight]) {
        const diff = myX - cX;
        if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffX)) {
          bestDiffX = diff;
        }
      }
    }
  }

  if (Math.abs(bestDiffX) <= threshold) {
    snappedDx = rawDx - bestDiffX;
    curLeft -= bestDiffX;
    curRight -= bestDiffX;
    curCenterX -= bestDiffX;
  }

  // ── 2. Vertical Snapping (Y Axis) ──
  let bestDiffY = Infinity;

  const pageYSnaps = [
    { val: 0, isPage: true },
    { val: pageH / 2, isPage: true },
    { val: pageH, isPage: true }
  ];

  // Test against canvas page bounds & center
  for (const p of pageYSnaps) {
    for (const myY of [curTop, curCenterY, curBottom]) {
      const diff = myY - p.val;
      if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffY)) {
        bestDiffY = diff;
      }
    }
  }

  // Test against other candidate elements
  for (const cand of candidates) {
    const candYPoints = [cand.top, cand.centerY, cand.bottom];
    for (const cY of candYPoints) {
      for (const myY of [curTop, curCenterY, curBottom]) {
        const diff = myY - cY;
        if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffY)) {
          bestDiffY = diff;
        }
      }
    }
  }

  if (Math.abs(bestDiffY) <= threshold) {
    snappedDy = rawDy - bestDiffY;
    curTop -= bestDiffY;
    curBottom -= bestDiffY;
    curCenterY -= bestDiffY;
  }

  // ── 3. Build Active Guide Line Coordinates ──
  const guides = [];
  const alignEpsilon = 1.5 / (scaleFactor || 1);
  const overhang = 20 / (scaleFactor || 1);

  // Vertical guidelines (X Alignment) - Exactly 1 line per aligned dragged axis
  const vAxes = [
    { val: curLeft, isCenter: false },
    { val: curCenterX, isCenter: true },
    { val: curRight, isCenter: false }
  ];

  for (const axis of vAxes) {
    let matched = false;
    let isPageSnap = false;
    let guideX = axis.val;
    let minY = curTop - overhang;
    let maxY = curBottom + overhang;

    // Check canvas page snaps
    for (const p of pageXSnaps) {
      if (Math.abs(axis.val - p.val) < alignEpsilon) {
        matched = true;
        isPageSnap = true;
        guideX = p.val;
      }
    }

    // Check candidate elements
    for (const cand of candidates) {
      const candXPoints = [cand.left, cand.centerX, cand.right];
      for (const cX of candXPoints) {
        if (Math.abs(axis.val - cX) < alignEpsilon) {
          matched = true;
          minY = Math.min(minY, cand.top - overhang);
          maxY = Math.max(maxY, cand.bottom + overhang);
        }
      }
    }

    if (matched) {
      if (isPageSnap) {
        minY = 0;
        maxY = pageH;
      }
      guides.push({ type: 'v', x1: guideX, y1: minY, x2: guideX, y2: maxY });
    }
  }

  // Horizontal guidelines (Y Alignment) - Exactly 1 line per aligned dragged axis
  const hAxes = [
    { val: curTop, isCenter: false },
    { val: curCenterY, isCenter: true },
    { val: curBottom, isCenter: false }
  ];

  for (const axis of hAxes) {
    let matched = false;
    let isPageSnap = false;
    let guideY = axis.val;
    let minX = curLeft - overhang;
    let maxX = curRight + overhang;

    // Check canvas page snaps
    for (const p of pageYSnaps) {
      if (Math.abs(axis.val - p.val) < alignEpsilon) {
        matched = true;
        isPageSnap = true;
        guideY = p.val;
      }
    }

    // Check candidate elements
    for (const cand of candidates) {
      const candYPoints = [cand.top, cand.centerY, cand.bottom];
      for (const cY of candYPoints) {
        if (Math.abs(axis.val - cY) < alignEpsilon) {
          matched = true;
          minX = Math.min(minX, cand.left - overhang);
          maxX = Math.max(maxX, cand.right + overhang);
        }
      }
    }

    if (matched) {
      if (isPageSnap) {
        minX = 0;
        maxX = pageW;
      }
      guides.push({ type: 'h', x1: minX, y1: guideY, x2: maxX, y2: guideY });
    }
  }

  return {
    snappedDx,
    snappedDy,
    guides,
    badge: {
      x: curLeft,
      y: curTop,
      width: targetInitialBox.width,
      height: targetInitialBox.height
    }
  };
};

/**
 * Calculates smart snapping for resize handles against page boundaries and candidate elements.
 * Returns snapped currentPoint in parent coordinate space.
 */
export const computeResizeSmartGuides = ({
  resizeState,
  currentPoint,
  parentCTM,
  dir,
  zoomScale = 1,
  disabled = false
}) => {
  if (disabled || !resizeState?.smartGuidesData || !currentPoint || !parentCTM) {
    return { snappedPoint: currentPoint };
  }

  const { pageW, pageH, scaleFactor = 1, candidates } = resizeState.smartGuidesData;
  const svg = resizeState.svgElement || resizeState.svg;
  if (!svg) {
    return { snappedPoint: currentPoint };
  }

  const threshold = 5 / (scaleFactor || 1);

  // Convert currentPoint (in parent coordinate space) to SVG root space
  let svgPoint = { x: currentPoint.x, y: currentPoint.y };
  let svgCtm = null;
  let parentToSvg = null;
  let svgToParent = null;

  try {
    svgCtm = svg.getScreenCTM();
    if (svgCtm && parentCTM) {
      parentToSvg = svgCtm.inverse().multiply(parentCTM);
      svgToParent = parentCTM.inverse().multiply(svgCtm);
      const pt = svg.createSVGPoint();
      pt.x = currentPoint.x;
      pt.y = currentPoint.y;
      const transformed = pt.matrixTransform(parentToSvg);
      svgPoint = { x: transformed.x, y: transformed.y };
    }
  } catch {
    /* fallback to raw currentPoint */
  }

  const pageXSnaps = [
    { val: 0, isPage: true },
    { val: pageW / 2, isPage: true },
    { val: pageW, isPage: true }
  ];
  const pageYSnaps = [
    { val: 0, isPage: true },
    { val: pageH / 2, isPage: true },
    { val: pageH, isPage: true }
  ];

  const movesX = dir && (dir.includes('e') || dir.includes('w'));
  const movesY = dir && (dir.includes('s') || dir.includes('n'));

  let snappedSvgX = svgPoint.x;
  let snappedSvgY = svgPoint.y;
  let bestDiffX = Infinity;
  let bestDiffY = Infinity;

  // 1. Horizontal Snapping (X Axis)
  if (movesX) {
    for (const p of pageXSnaps) {
      const diff = svgPoint.x - p.val;
      if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffX)) {
        bestDiffX = diff;
      }
    }
    for (const cand of candidates) {
      for (const cX of [cand.left, cand.centerX, cand.right]) {
        const diff = svgPoint.x - cX;
        if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffX)) {
          bestDiffX = diff;
        }
      }
    }
    if (Math.abs(bestDiffX) <= threshold) {
      snappedSvgX = svgPoint.x - bestDiffX;
    }
  }

  // 2. Vertical Snapping (Y Axis)
  if (movesY) {
    for (const p of pageYSnaps) {
      const diff = svgPoint.y - p.val;
      if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffY)) {
        bestDiffY = diff;
      }
    }
    for (const cand of candidates) {
      for (const cY of [cand.top, cand.centerY, cand.bottom]) {
        const diff = svgPoint.y - cY;
        if (Math.abs(diff) <= threshold && Math.abs(diff) < Math.abs(bestDiffY)) {
          bestDiffY = diff;
        }
      }
    }
    if (Math.abs(bestDiffY) <= threshold) {
      snappedSvgY = svgPoint.y - bestDiffY;
    }
  }

  // Convert snapped SVG point back to parent coordinate space
  let snappedPoint = { x: currentPoint.x, y: currentPoint.y };
  if (svgToParent && (snappedSvgX !== svgPoint.x || snappedSvgY !== svgPoint.y)) {
    try {
      const pt = svg.createSVGPoint();
      pt.x = snappedSvgX;
      pt.y = snappedSvgY;
      const back = pt.matrixTransform(svgToParent);
      snappedPoint = { x: back.x, y: back.y };
    } catch {
      /* fallback */
    }
  }

  return { snappedPoint };
};

/**
 * Builds active smart guidelines and dimension badge for an element during resize.
 */
export const collectResizeGuideLines = ({
  resizeState,
  currentBox,
  dir
}) => {
  if (!resizeState?.smartGuidesData || !currentBox) {
    return { guides: [], badge: null };
  }

  const { pageW, pageH, scaleFactor = 1, candidates } = resizeState.smartGuidesData;
  const alignEpsilon = 2.5 / (scaleFactor || 1);
  const overhang = 20 / (scaleFactor || 1);

  const pageXSnaps = [
    { val: 0, isPage: true },
    { val: pageW / 2, isPage: true },
    { val: pageW, isPage: true }
  ];
  const pageYSnaps = [
    { val: 0, isPage: true },
    { val: pageH / 2, isPage: true },
    { val: pageH, isPage: true }
  ];

  const guides = [];

  // Active vertical axes based on handle direction
  const vAxes = [];
  if (!dir || dir.includes('w')) vAxes.push({ val: currentBox.left, isCenter: false });
  if (!dir || dir.includes('e')) vAxes.push({ val: currentBox.right, isCenter: false });
  vAxes.push({ val: currentBox.centerX, isCenter: true });

  for (const axis of vAxes) {
    let matched = false;
    let isPageSnap = false;
    let guideX = axis.val;
    let minY = currentBox.top - overhang;
    let maxY = currentBox.bottom + overhang;

    for (const p of pageXSnaps) {
      if (Math.abs(axis.val - p.val) < alignEpsilon) {
        matched = true;
        isPageSnap = true;
        guideX = p.val;
      }
    }

    for (const cand of candidates) {
      for (const cX of [cand.left, cand.centerX, cand.right]) {
        if (Math.abs(axis.val - cX) < alignEpsilon) {
          matched = true;
          minY = Math.min(minY, cand.top - overhang);
          maxY = Math.max(maxY, cand.bottom + overhang);
        }
      }
    }

    if (matched) {
      if (isPageSnap) {
        minY = 0;
        maxY = pageH;
      }
      guides.push({ type: 'v', x1: guideX, y1: minY, x2: guideX, y2: maxY });
    }
  }

  // Active horizontal axes based on handle direction
  const hAxes = [];
  if (!dir || dir.includes('n')) hAxes.push({ val: currentBox.top, isCenter: false });
  if (!dir || dir.includes('s')) hAxes.push({ val: currentBox.bottom, isCenter: false });
  hAxes.push({ val: currentBox.centerY, isCenter: true });

  for (const axis of hAxes) {
    let matched = false;
    let isPageSnap = false;
    let guideY = axis.val;
    let minX = currentBox.left - overhang;
    let maxX = currentBox.right + overhang;

    for (const p of pageYSnaps) {
      if (Math.abs(axis.val - p.val) < alignEpsilon) {
        matched = true;
        isPageSnap = true;
        guideY = p.val;
      }
    }

    for (const cand of candidates) {
      for (const cY of [cand.top, cand.centerY, cand.bottom]) {
        if (Math.abs(axis.val - cY) < alignEpsilon) {
          matched = true;
          minX = Math.min(minX, cand.left - overhang);
          maxX = Math.max(maxX, cand.right + overhang);
        }
      }
    }

    if (matched) {
      if (isPageSnap) {
        minX = 0;
        maxX = pageW;
      }
      guides.push({ type: 'h', x1: minX, y1: guideY, x2: maxX, y2: guideY });
    }
  }

  return {
    guides,
    badge: {
      x: currentBox.left,
      y: currentBox.top,
      width: currentBox.width,
      height: currentBox.height,
      text: `${Math.round(currentBox.width)} × ${Math.round(currentBox.height)}`
    }
  };
};

/**
 * Projects and renders smart guidelines into the SVG overlay and the dark coordinate badge into the HTML overlay.
 * Converts from canvas SVG coordinates to overlay screen coordinates seamlessly.
 */
export const renderSmartGuides = (pageIndex, guides, badge, zoomScale = 1, canvasSvg = null) => {
  const zoomContainer = document.getElementById('main-zoom-container');
  const editorContainer = zoomContainer?.parentElement;

  // Locate the target SVG on canvas
  const svgTarget = canvasSvg ||
    document.querySelector(`.page-svg-container[data-page-index="${pageIndex}"] [id^="canvas-content-"] > svg`) ||
    document.querySelector(`.page-svg-container[data-page-index="${pageIndex}"] svg:not([id^="highlight-overlay-"])`);

  if (!svgTarget) return;

  // Ensure unscaled screen-space overlay container exists inside editor container (scale = 1:1)
  let screenOverlay = document.getElementById('smart-guides-screen-overlay');
  if (!screenOverlay && editorContainer) {
    screenOverlay = document.createElement('div');
    screenOverlay.id = 'smart-guides-screen-overlay';
    screenOverlay.style.cssText = 'position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 35;';
    editorContainer.appendChild(screenOverlay);
  }

  // Lines sub-container
  let linesContainer = screenOverlay?.querySelector('#smart-guides-lines');
  if (screenOverlay && !linesContainer) {
    linesContainer = document.createElement('div');
    linesContainer.id = 'smart-guides-lines';
    linesContainer.style.cssText = 'position: absolute; inset: 0; pointer-events: none;';
    screenOverlay.appendChild(linesContainer);
  }

  if (linesContainer) {
    linesContainer.innerHTML = '';
  }

  // Also clean any legacy SVG group if present
  const svgOverlay = document.getElementById(`highlight-overlay-${pageIndex}`);
  if (svgOverlay) {
    const legacyGroup = svgOverlay.querySelector('#smart-guides-group');
    if (legacyGroup) legacyGroup.innerHTML = '';
  }

  if (screenOverlay && linesContainer && guides && guides.length > 0) {
    let ctm = null;
    try {
      ctm = svgTarget.getScreenCTM();
    } catch {
      /* fallback */
    }

    const overlayRect = screenOverlay.getBoundingClientRect();
    const toScreen = (x, y) => {
      if (!ctm) return { x, y };
      const clientX = ctm.a * x + ctm.c * y + ctm.e;
      const clientY = ctm.b * x + ctm.d * y + ctm.f;
      return {
        x: clientX - overlayRect.left,
        y: clientY - overlayRect.top
      };
    };

    // 1. Merge collinear vertical guidelines within 2px in screen space
    const mergedV = [];
    const vGuides = guides.filter(g => g.type === 'v');
    for (const g of vGuides) {
      const p1 = toScreen(g.x1, g.y1);
      const p2 = toScreen(g.x2, g.y2);
      const x = Math.round(p1.x);
      const minY = Math.round(Math.min(p1.y, p2.y));
      const maxY = Math.round(Math.max(p1.y, p2.y));

      const existing = mergedV.find(m => Math.abs(m.x - x) <= 2);
      if (existing) {
        existing.minY = Math.min(existing.minY, minY);
        existing.maxY = Math.max(existing.maxY, maxY);
      } else {
        mergedV.push({ x, minY, maxY });
      }
    }

    // 2. Merge collinear horizontal guidelines within 2px in screen space
    const mergedH = [];
    const hGuides = guides.filter(g => g.type === 'h');
    for (const g of hGuides) {
      const p1 = toScreen(g.x1, g.y1);
      const p2 = toScreen(g.x2, g.y2);
      const y = Math.round(p1.y);
      const minX = Math.round(Math.min(p1.x, p2.x));
      const maxX = Math.round(Math.max(p1.x, p2.x));

      const existing = mergedH.find(m => Math.abs(m.y - y) <= 2);
      if (existing) {
        existing.minX = Math.min(existing.minX, minX);
        existing.maxX = Math.max(existing.maxX, maxX);
      } else {
        mergedH.push({ y, minX, maxX });
      }
    }

    // Shared style for crisp 1px lines — round all positions to integer pixels
    // to prevent sub-pixel blur that makes some lines look thicker than others.
    const GUIDE_COLOR = '#E6007A';
    const GUIDE_BASE = 'position:absolute; background-color:' + GUIDE_COLOR + '; pointer-events:none; will-change:transform;';

    // Render merged 1px vertical lines
    for (const v of mergedV) {
      const line = document.createElement('div');
      const x = Math.round(v.x);
      const top = Math.round(v.minY);
      const height = Math.max(1, Math.round(v.maxY) - top);
      line.style.cssText = `${GUIDE_BASE} left:${x}px; top:${top}px; width:1px; height:${height}px;`;
      linesContainer.appendChild(line);
    }

    // Render merged 1px horizontal lines
    for (const h of mergedH) {
      const line = document.createElement('div');
      const y = Math.round(h.y);
      const left = Math.round(h.minX);
      const width = Math.max(1, Math.round(h.maxX) - left);
      line.style.cssText = `${GUIDE_BASE} left:${left}px; top:${y}px; width:${width}px; height:1px;`;
      linesContainer.appendChild(line);
    }
  }

  // ── 2. Render Dark Floating Coordinate Badge in Screen Space ──
  if (screenOverlay) {
    let badgeEl = screenOverlay.querySelector('#smart-guides-badge');
    if (!badge) {
      if (badgeEl) badgeEl.style.display = 'none';
      return;
    }

    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.id = 'smart-guides-badge';
      badgeEl.style.position = 'absolute';
      badgeEl.style.left = '0px';
      badgeEl.style.top = '0px';
      badgeEl.style.transformOrigin = '0 0';
      badgeEl.style.transition = 'none';
      badgeEl.style.pointerEvents = 'none';
      badgeEl.style.zIndex = '2000';
      badgeEl.style.backgroundColor = 'rgba(40, 40, 40, 0.95)';
      badgeEl.style.color = '#FFFFFF';
      badgeEl.style.fontSize = '11px';
      badgeEl.style.fontWeight = '500';
      badgeEl.style.letterSpacing = '0.3px';
      badgeEl.style.lineHeight = '14px';
      badgeEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      badgeEl.style.padding = '3px 6px';
      badgeEl.style.borderRadius = '4px';
      badgeEl.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.35)';
      badgeEl.style.whiteSpace = 'nowrap';
      screenOverlay.appendChild(badgeEl);
    }

    badgeEl.style.display = 'block';
    badgeEl.textContent = badge.text ? badge.text : `${Math.round(badge.x)},${Math.round(badge.y)}`;

    let ctm = null;
    try {
      ctm = svgTarget.getScreenCTM();
    } catch {
      /* fallback */
    }
    const overlayRect = screenOverlay.getBoundingClientRect();
    const clientX = ctm ? (ctm.a * badge.x + ctm.c * badge.y + ctm.e) : badge.x;
    const clientY = ctm ? (ctm.b * badge.x + ctm.d * badge.y + ctm.f) : badge.y;
    const bX = Math.round(clientX - overlayRect.left);
    const bY = Math.round(clientY - overlayRect.top);

    const flipY = bY < 35;
    const flipX = bX < 65;
    const shiftX = flipX ? '6px' : 'calc(-100% - 6px)';
    const shiftY = flipY ? '6px' : 'calc(-100% - 6px)';

    badgeEl.style.transform = `translate3d(${bX}px, ${bY}px, 0) translate(${shiftX}, ${shiftY})`;
  }
};

/**
 * Universally clears all smart guidelines and coordinate badges from all overlays.
 */
export const clearSmartGuides = () => {
  const linesContainer = document.getElementById('smart-guides-lines');
  if (linesContainer) {
    linesContainer.innerHTML = '';
  }
  const badgeEl = document.getElementById('smart-guides-badge');
  if (badgeEl) {
    badgeEl.style.display = 'none';
  }
  document.querySelectorAll('#smart-guides-group').forEach(g => {
    g.innerHTML = '';
  });
  document.querySelectorAll('#smart-guides-badge').forEach(b => {
    b.style.display = 'none';
  });
};

// Global safety cleanup on pointerup or window blur so guides never linger
if (typeof window !== 'undefined') {
  window.addEventListener('pointerup', () => clearSmartGuides(), { passive: true });
  window.addEventListener('mouseup', () => clearSmartGuides(), { passive: true });
}

