export const formatSmoothPathD = (pts) => {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  const mid0x = (pts[0].x + pts[1].x) / 2;
  const mid0y = (pts[0].y + pts[1].y) / 2;
  d += ` L ${mid0x.toFixed(2)} ${mid0y.toFixed(2)}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}, ${xc.toFixed(2)} ${yc.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
};

export const getVisualBBox = (el) => {
  if (!el || typeof el.getBBox !== 'function') return { x: 0, y: 0, width: 0, height: 0 };

  const isUserGroup = el.tagName?.toLowerCase() === 'g' && (
    el.getAttribute('data-type') === 'group' ||
    (el.getAttribute('data-name') || '').toLowerCase() === 'group' ||
    (el.id || '').startsWith('group-')
  );

  if (!isUserGroup) {
    let cropStr = el.getAttribute('data-crop-data');
    let targetCropEl = null;

    if (!cropStr && el.tagName?.toLowerCase() === 'g') {
      const childWithCrop = el.querySelector('[data-crop-data]');
      if (childWithCrop) {
        cropStr = childWithCrop.getAttribute('data-crop-data');
        targetCropEl = childWithCrop;
      }
    }

    if (cropStr) {
      let bboxW = 0, bboxH = 0, bboxX = 0, bboxY = 0;
      const targetForOrig = targetCropEl || el;
      if (targetForOrig.hasAttribute('data-crop-orig-w')) {
        bboxW = parseFloat(targetForOrig.getAttribute('data-crop-orig-w') || '0');
        bboxH = parseFloat(targetForOrig.getAttribute('data-crop-orig-h') || '0');
        bboxX = parseFloat(targetForOrig.getAttribute('data-crop-orig-x') || '0');
        bboxY = parseFloat(targetForOrig.getAttribute('data-crop-orig-y') || '0');
      } else {
        try {
          const bbox = el.getBBox();
          bboxW = bbox.width; bboxH = bbox.height; bboxX = bbox.x; bboxY = bbox.y;
        } catch { /* ignored */ }
      }
      try {
        const crop = JSON.parse(cropStr);
        if (bboxW > 0 && bboxH > 0) {
          return {
            x: bboxX + (parseFloat(crop.left || 0) / 100) * bboxW,
            y: bboxY + (parseFloat(crop.top || 0) / 100) * bboxH,
            width: bboxW * (parseFloat(crop.width || 100) / 100),
            height: bboxH * (parseFloat(crop.height || 100) / 100)
          };
        }
      } catch { /* ignored */ }
    }
  }

  const clipAttr = el.getAttribute('clip-path') || el.style?.clipPath || '';
  if (clipAttr.includes('clip-') || clipAttr.includes('crop-')) {
    const clipMatch = clipAttr.match(/url\(['"']?#([^)'"]+)['"']?\)/);
    if (clipMatch && clipMatch[1]) {
      const clipEl = document.getElementById(clipMatch[1]);
      if (clipEl && clipEl.firstElementChild && typeof clipEl.firstElementChild.getBBox === 'function') {
        try {
          const bb = clipEl.firstElementChild.getBBox();
          if (bb && (bb.width > 0 || bb.height > 0)) return bb;
        } catch { /* ignored */ }
      }
    }
  }

  const isImgGrp = el.getAttribute('data-is-image-group') === 'true' || el.getAttribute('data-is-video-group') === 'true' || el.getAttribute('data-is-gif-group') === 'true';
  if (el.tagName.toLowerCase() === 'g' && (el.querySelector('[data-crop-data]') || isImgGrp)) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const children = Array.from(el.children);
    let hasValidChild = false;

    for (const child of children) {
      if (child.classList && (
        child.classList.contains('svg-image-stroke-overlay') ||
        child.classList.contains('svg-gif-stroke-overlay') ||
        child.classList.contains('svg-shape-stroke-overlay') ||
        child.classList.contains('svg-drop-shadow-caster')
      )) {
        continue;
      }
      if (typeof child.getBBox === 'function' && child.style.display !== 'none' && child.style.visibility !== 'hidden' && child.tagName.toLowerCase() !== 'defs') {
        const childBBox = getVisualBBox(child);
        let childMatrix = new DOMMatrix();
        try {
          const parentCTM = el.getCTM();
          const childCTM = child.getCTM();
          if (parentCTM && childCTM) {
            childMatrix = parentCTM.inverse().multiply(childCTM);
          }
        } catch { /* ignored */ }

        const pt1 = new DOMPoint(childBBox.x, childBBox.y).matrixTransform(childMatrix);
        const pt2 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y).matrixTransform(childMatrix);
        const pt3 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y + childBBox.height).matrixTransform(childMatrix);
        const pt4 = new DOMPoint(childBBox.x, childBBox.y + childBBox.height).matrixTransform(childMatrix);

        const pts = [pt1, pt2, pt3, pt4];
        for (const pt of pts) {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
        }
        hasValidChild = true;
      }
    }

    if (hasValidChild) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }

  // For all other <g> groups (user-created groups, icon groups, vector groups, etc.),
  // iterate children to get a tight bounding box. This prevents the "full sheet" effect
  // when a group's getBBox() includes page-spanning background elements.
  const isNonFrameGroup = el.tagName.toLowerCase() === 'g' &&
    el.getAttribute('data-type') !== 'frame' &&
    el.getAttribute('data-type') !== 'background' &&
    el.getAttribute('data-name') !== 'Overlay';
  if (isNonFrameGroup) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const children = Array.from(el.children);
    let hasValidChild = false;

    for (const child of children) {
      if (child.classList && (
        child.classList.contains('svg-image-stroke-overlay') ||
        child.classList.contains('svg-gif-stroke-overlay') ||
        child.classList.contains('svg-shape-stroke-overlay') ||
        child.classList.contains('svg-drop-shadow-caster')
      )) {
        continue;
      }
      if (child.tagName.toLowerCase() === 'defs') continue;
      if (child.style.display === 'none' || child.style.visibility === 'hidden') continue;
      if (typeof child.getBBox !== 'function') continue;

      try {
        const childBBox = getVisualBBox(child);
        if (!childBBox || (childBBox.width === 0 && childBBox.height === 0)) continue;

        let childMatrix = new DOMMatrix();
        try {
          const parentCTM = el.getCTM();
          const childCTM = child.getCTM();
          if (parentCTM && childCTM) {
            childMatrix = parentCTM.inverse().multiply(childCTM);
          }
        } catch { /* ignored */ }

        const pt1 = new DOMPoint(childBBox.x, childBBox.y).matrixTransform(childMatrix);
        const pt2 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y).matrixTransform(childMatrix);
        const pt3 = new DOMPoint(childBBox.x + childBBox.width, childBBox.y + childBBox.height).matrixTransform(childMatrix);
        const pt4 = new DOMPoint(childBBox.x, childBBox.y + childBBox.height).matrixTransform(childMatrix);

        const pts = [pt1, pt2, pt3, pt4];
        for (const pt of pts) {
          if (isFinite(pt.x) && isFinite(pt.y)) {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
            hasValidChild = true;
          }
        }
      } catch { /* ignored */ }
    }

    if (hasValidChild && isFinite(minX) && isFinite(minY)) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }

  const tag = el.tagName?.toLowerCase();
  if (tag === 'image' || tag === 'rect' || tag === 'foreignobject') {
    const w = parseFloat(el.getAttribute('width') || '0');
    const h = parseFloat(el.getAttribute('height') || '0');
    if (w > 0 && h > 0) {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      return { x, y, width: w, height: h };
    }
  }

  return el.getBBox();
};

export const getCanvasBounds = (svgElement, baseWidth = 210, baseHeight = 297) => {
  const pW = baseWidth || 210;
  const pH = baseHeight || 297;

  let svgW = pW, svgH = pH;
  if (svgElement) {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        svgW = parts[2];
        svgH = parts[3];
      }
    }
  }

  const scaleX = svgW / pW;
  const scaleY = svgH / pH;

  // Dynamically scale canvas width to match actual MainEditor container viewport aspect ratio exactly
  let aspect = 1.6;
  const containerEl = typeof document !== 'undefined' ? document.getElementById('main-zoom-container')?.parentElement : null;
  if (containerEl && containerEl.clientWidth > 0 && containerEl.clientHeight > 0) {
    aspect = Math.max(1.0, containerEl.clientWidth / containerEl.clientHeight);
  } else if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
    const availW = window.innerWidth * 0.8;
    const availH = window.innerHeight * 0.78;
    if (availH > 0) aspect = Math.max(1.0, availW / availH);
  }

  const canvasHeightMM = 1000;
  const canvasWidthMM = Math.max(1000, Math.round(1000 * aspect));

  const extraLeftMM = Math.max(0, (canvasWidthMM - pW) / 2);
  const extraRightMM = Math.max(0, (canvasWidthMM - pW) / 2);
  const extraTopMM = Math.max(0, (canvasHeightMM - pH) / 2);
  const extraBottomMM = Math.max(0, (canvasHeightMM - pH) / 2);

  const minX = -extraLeftMM * scaleX;
  const maxX = svgW + extraRightMM * scaleX;
  const minY = -extraTopMM * scaleY;
  const maxY = svgH + extraBottomMM * scaleY;

  return { minX, maxX, minY, maxY, extraLeftMM, extraRightMM, extraTopMM, extraBottomMM, scaleX, scaleY, pW, pH, svgW, svgH, canvasWidthMM, canvasHeightMM };
};

export const syncDOM = (oldNode, newNode) => {
  if (!oldNode || !newNode) return;
  if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode.cloneNode(true));
    return;
  }
  if (oldNode.nodeType === Node.TEXT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue;
    }
    return;
  }

  const oldAttrs = oldNode.attributes;
  const newAttrs = newNode.attributes;

  if (oldAttrs && newAttrs) {
    for (let i = oldAttrs.length - 1; i >= 0; i--) {
      const name = oldAttrs[i].name;
      if (!newNode.hasAttribute(name)) {
        oldNode.removeAttribute(name);
      }
    }
    for (let i = 0; i < newAttrs.length; i++) {
      const name = newAttrs[i].name;
      const val = newAttrs[i].value;
      if (oldNode.getAttribute(name) !== val) {
        oldNode.setAttribute(name, val);
      }
    }
  }

  const oldChildren = Array.from(oldNode.childNodes);
  const newChildren = Array.from(newNode.childNodes);
  const maxLength = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLength; i++) {
    if (!oldChildren[i]) {
      oldNode.appendChild(newChildren[i].cloneNode(true));
    } else if (!newChildren[i]) {
      oldNode.removeChild(oldChildren[i]);
    } else {
      syncDOM(oldChildren[i], newChildren[i]);
    }
  }
};

export const matrixToTransform = (matrix) => {
  return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
};

export const toDOMMatrix = (m) => {
  if (!m) return new DOMMatrix();
  if (m instanceof DOMMatrix) return m;
  const a = m.a ?? 1;
  const b = m.b ?? 0;
  const c = m.c ?? 0;
  const d = m.d ?? 1;
  const e = m.e ?? 0;
  const f = m.f ?? 0;
  return new DOMMatrix([a, b, c, d, e, f]);
};

export const getElementMatrix = (element) => {
  const baseTransform = element?.transform?.baseVal?.consolidate();

  if (!baseTransform?.matrix) {
    return new DOMMatrix();
  }

  const { a, b, c, d, e, f } = baseTransform.matrix;
  return new DOMMatrix([a, b, c, d, e, f]);
};

export const getVisualCornersAndRotation = (mapped, matrix, el) => {
  if (!mapped || mapped.length < 4) {
    return {
      cornersMap: { nw: mapped?.[0], ne: mapped?.[1], se: mapped?.[2], sw: mapped?.[3] },
      visualRotation: 0,
      flipH: false,
      flipV: false
    };
  }

  const isFlipH = el?.getAttribute('data-flip-h') === 'true';
  const isFlipV = el?.getAttribute('data-flip-v') === 'true';

  const a = matrix?.a ?? 1;
  const b = matrix?.b ?? 0;
  const c = matrix?.c ?? 0;
  const d = matrix?.d ?? 1;
  const det = a * d - b * c;

  // If flip data attributes are not yet present, infer from negative determinant and diagonal signs
  const flipH = isFlipH || (!isFlipV && det < 0 && a < 0);
  const flipV = isFlipV || (!isFlipH && det < 0 && d < 0);

  let nw = mapped[0];
  let ne = mapped[1];
  let se = mapped[2];
  let sw = mapped[3];

  if (flipH && !flipV) {
    nw = mapped[1];
    ne = mapped[0];
    se = mapped[3];
    sw = mapped[2];
  } else if (!flipH && flipV) {
    nw = mapped[3];
    ne = mapped[2];
    se = mapped[1];
    sw = mapped[0];
  } else if (flipH && flipV) {
    nw = mapped[2];
    ne = mapped[3];
    se = mapped[0];
    sw = mapped[1];
  }

  // Calculate visual rotation from top edge vector (from visual nw to visual ne)
  const topEdgeX = ne.x - nw.x;
  const topEdgeY = ne.y - nw.y;
  let visualRotation = (Math.atan2(topEdgeY, topEdgeX) * 180) / Math.PI;
  visualRotation = ((visualRotation % 360) + 360) % 360;

  return {
    cornersMap: { nw, ne, se, sw },
    visualRotation,
    flipH,
    flipV
  };
};

export const getSvgPoint = (svgElement, clientX, clientY) => {
  const ctm = svgElement?.getScreenCTM();
  if (!ctm) return null;

  const point = svgElement.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  return point.matrixTransform(ctm.inverse());
};

export const clearOverlayType = (typePattern) => {
  document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
    overlay.querySelectorAll(`.overlay-pattern-${typePattern}`).forEach(p => p.remove());
    overlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
    if (typePattern.includes('selected')) {
      overlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
    }
  });

  document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
    htmlOverlay.querySelectorAll(`.overlay-type-${typePattern}`).forEach(p => p.remove());
    if (typePattern.includes('selected')) {
      htmlOverlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      if (!window.__isRotatingActive) {
        htmlOverlay.querySelectorAll('.corner-value-badge, [id^="rotation-degree-badge-"], [id^="rotate-handle-"], [id^="rotate-hotspot-"]').forEach(h => h.remove());
      }
    }
  });
};

export const getLocalPoint = (svg, element, clientX, clientY) => {
  if (!svg || !element || typeof element.getScreenCTM !== 'function') {
    return { x: clientX, y: clientY };
  }
  try {
    const ctm = element.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const localPt = pt.matrixTransform(ctm.inverse());
    return { x: localPt.x, y: localPt.y };
  } catch {
    return { x: clientX, y: clientY };
  }
};
