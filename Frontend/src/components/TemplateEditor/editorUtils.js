export const syncGradient = (doc, element, baseAttr) => {
  const type = element.getAttribute(`${baseAttr}-type`);
  const currentValue = element.getAttribute(baseAttr);
  const isUrl = currentValue && currentValue.toLowerCase().startsWith('url(#');
  const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear';
  const stopsJson = element.getAttribute(`${baseAttr}-stops`);

  if (type === 'solid' || type === 'none') return;

  if (isUrl && !stopsJson) {
    if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
      Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.setAttribute(baseAttr, currentValue);
        if (child.style) child.style.setProperty(baseAttr, currentValue, 'important');
      });
    }
    return;
  }

  if (!type && !isUrl) return;
  if (!stopsJson) return;

  let stops = [];
  try { stops = JSON.parse(stopsJson); } catch (e) { return; }
  if (!stops || !Array.isArray(stops)) return;

  const svgRoot = element.closest('svg') || doc.querySelector('svg') || (doc.tagName?.toLowerCase() === 'svg' ? doc : null);
  if (!svgRoot) return;

  const ownerDoc = doc.ownerDocument || doc;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (!element.id) {
    element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const gradIdPrefix = `grad-${element.id}-${baseAttr}`;
  Array.from(defs.querySelectorAll(`[id^="${gradIdPrefix}"]`)).forEach(oldGrad => oldGrad.remove());

  const gradId = `${gradIdPrefix}-${Math.random().toString(36).substr(2, 4)}`;
  let gradEl = null;

  const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

  if (!gradEl) {
    gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
    gradEl.id = gradId;
    if (svgGradType === 'linear') {
      const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
      const angleRad = (angle * Math.PI) / 180;
      // CSS gradient angle uses bearings (0deg = up, 90deg = right)
      // SVG y-axis points down
      const dx = Math.sin(angleRad) * 50;
      const dy = -Math.cos(angleRad) * 50;
      gradEl.setAttribute('x1', Math.round(50 - dx) + '%');
      gradEl.setAttribute('y1', Math.round(50 - dy) + '%');
      gradEl.setAttribute('x2', Math.round(50 + dx) + '%');
      gradEl.setAttribute('y2', Math.round(50 + dy) + '%');
    } else {
      const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', radius + '%');
    }
    defs.appendChild(gradEl);
  }

  while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
  stops.forEach(s => {
    const stop = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute('offset', `${s.offset}%`);
    stop.setAttribute('stop-color', s.color);
    stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
    gradEl.appendChild(stop);
  });

  const finalUrl = `url(#${gradId})`;
  element.setAttribute(baseAttr, finalUrl);
  if (element.style) {
    element.style.setProperty(baseAttr, finalUrl, 'important');
  }

  if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
    Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
      child.setAttribute(baseAttr, finalUrl);
      if (child.style) child.style.setProperty(baseAttr, finalUrl, 'important');
    });
  }
};

export const getSvgImageEl = (el) => {
  if (!el) return null;
  const tag = el.tagName?.toLowerCase();

  // 1. Check if the element itself is an image
  if (tag === 'image' || tag === 'img') return el;

  const resolveUse = (node) => {
    const useEl = node.tagName?.toLowerCase() === 'use' ? node : node.querySelector('use');
    if (useEl) {
      const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
      if (refId) {
        const doc = useEl.ownerDocument;
        const ownerSvg = useEl.closest('svg');
        const refEl = doc?.getElementById(refId) || ownerSvg?.querySelector(`[id="${refId}"]`);
        if (refEl && (refEl.tagName?.toLowerCase() === 'image' || refEl.tagName?.toLowerCase() === 'img')) {
          return refEl;
        }
      }
    }
    return null;
  };

  const useTarget = resolveUse(el);
  if (useTarget) return useTarget;

  // 2. Helper to find image inside a pattern fill
  const findInPattern = (node) => {
    const fill = node.getAttribute?.('fill') || '';
    if (fill?.startsWith('url(#')) {
      const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
      if (patternId) {
        const doc = node.ownerDocument;
        // Try finding within its own SVG root first (best for templates)
        const ownerSvg = node.closest('svg');
        const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`) || doc?.getElementById(patternId);

        if (pattern) {
          // SVG patterns might have an <image> directly or a <use> pointing to one
          const img = pattern.querySelector('image');
          if (img) return img;
          return resolveUse(pattern);
        }
      }
    }
    return null;
  };

  // 3. Check for pattern on the element itself
  const patternTarget = findInPattern(el);
  if (patternTarget) return patternTarget;

  // 4. Search within children (if it's a group)
  const childImg = el.querySelector('image, img');
  if (childImg) return childImg;

  // 5. Check children for patterns
  const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
  for (const child of Array.from(childrenWithPatterns)) {
    const target = findInPattern(child);
    if (target) return target;
  }

  return null;
};
