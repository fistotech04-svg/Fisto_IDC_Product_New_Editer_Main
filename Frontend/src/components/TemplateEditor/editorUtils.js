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

export const getEmbedVideoUrl = (rawUrl) => {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  // YouTube
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
    else if (url.includes("watch?v=")) videoId = url.split("v=")[1]?.split("&")[0];
    else if (url.includes("shorts/")) videoId = url.split("shorts/")[1]?.split("?")[0]?.split("&")[0];
    else if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0]?.split("&")[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  }

  // Vimeo
  if (lower.includes("vimeo.com")) {
    let videoId = url.split("vimeo.com/")[1]?.split("?")[0]?.split("/")[0];
    if (videoId && !isNaN(videoId)) return `https://player.vimeo.com/video/${videoId}`;
  }

  // Dailymotion
  if (lower.includes("dailymotion.com") || lower.includes("dai.ly")) {
    let videoId = "";
    if (url.includes("dai.ly/")) videoId = url.split("dai.ly/")[1]?.split("?")[0];
    else if (url.includes("video/")) videoId = url.split("video/")[1]?.split("?")[0];
    if (videoId) return `https://www.dailymotion.com/embed/video/${videoId}`;
  }

  // Loom
  if (lower.includes("loom.com")) {
    let videoId = url.split("share/")[1]?.split("?")[0];
    if (videoId) return `https://www.loom.com/embed/${videoId}`;
  }

  // Wistia
  if (lower.includes("wistia.com")) {
    let videoId = url.split("medias/")[1]?.split("?")[0];
    if (videoId) return `https://fast.wistia.net/embed/iframe/${videoId}`;
  }

  // Google Drive
  if (lower.includes("drive.google.com")) {
    const match = url.match(/\/d\/([^\/]+)/);
    if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return url;
};

export const detectMediaType = (inputUrl) => {
  if (!inputUrl) return 'image';
  const lower = inputUrl.toLowerCase().trim();

  // Direct Image Extensions
  if (
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.avif') ||
    lower.endsWith('.ico')
  ) {
    return 'image';
  }

  // Direct PDF Extension
  if (lower.endsWith('.pdf')) {
    return 'pdf';
  }

  // Video Platforms or Video Extensions / Keywords
  if (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.mkv') ||
    lower.endsWith('.avi') ||
    lower.endsWith('.m3u8') ||
    lower.endsWith('.flv') ||
    lower.endsWith('.wmv') ||
    lower.includes('youtube') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo') ||
    lower.includes('dailymotion') ||
    lower.includes('dai.ly') ||
    lower.includes('loom.com') ||
    lower.includes('wistia') ||
    lower.includes('tiktok') ||
    lower.includes('facebook.com/watch') ||
    lower.includes('fb.watch') ||
    lower.includes('video') ||
    lower.includes('embed') ||
    lower.includes('stream') ||
    lower.includes('player') ||
    lower.includes('v=') ||
    lower.includes('watch') ||
    lower.includes('shorts') ||
    lower.includes('reel') ||
    lower.includes('clip')
  ) {
    return 'video';
  }

  return 'image';
};

export const checkIsAnimatedWebp = async (fileOrBlob) => {
  if (!fileOrBlob || !fileOrBlob.type.includes('webp')) return false;
  try {
    const buffer = await fileOrBlob.slice(0, 256).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 &&
        bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) {
      for (let i = 12; i < bytes.length - 4; i++) {
        if (bytes[i] === 65 && bytes[i+1] === 78 && bytes[i+2] === 77 && bytes[i+3] === 70) {
          return true;
        }
        if (bytes[i] === 65 && bytes[i+1] === 78 && bytes[i+2] === 73 && bytes[i+3] === 77) {
          return true;
        }
      }
      if (bytes[12] === 86 && bytes[13] === 80 && bytes[14] === 56 && bytes[15] === 88) {
         const flags = bytes[20];
         if ((flags & 2) !== 0) return true;
      }
    }
  } catch (e) {
    console.error("Error checking WebP animation", e);
  }
  return false;
};

/**
 * Internal helper to parse layers from SVG content recursively.
 * Ensures the layer panel stays in sync with the SVG DOM structure.
 */
export const parseLayersFromSVG = (element) => {
  if (!element || !element.children) return [];
  return Array.from(element.children)
    .filter(child => {
      if (['defs', 'metadata', 'style', 'title', 'desc', 'parsererror'].includes(child.tagName.toLowerCase())) return false;
      if (child.getAttribute('data-name') === 'Overlay') return false;
      if (child.getAttribute('style')?.includes('display:none') || child.getAttribute('style')?.includes('display: none')) return false;
      if (child.classList.contains('svg-drop-shadow-caster')) return false;
      if (child.classList.contains('internal-crop-rect')) return false;
      if (child.classList.contains('internal-crop-pattern')) return false;

      if (child.getAttribute('data-is-mask-image') === 'true' || child.getAttribute('id')?.startsWith('masked-img-')) return false;

      const isEffectNode = Array.from(child.classList).some(cls =>
        cls.includes('-stroke-overlay') ||
        cls.includes('-inner-shadow') ||
        cls.includes('-fill-layer') ||
        cls === 'inner-shadow-overlay'
      );
      if (isEffectNode) return false;

      return true;
    })
    .flatMap(child => {
      // If this is an inner crop wrapper, unwrap it by returning its children directly
      if (child.tagName.toLowerCase() === 'svg' && child.classList.contains('svg-crop-wrapper')) {
        return parseLayersFromSVG(child);
      }
      // Ensure element has a unique ID for selection and state tracking
      let id = child.getAttribute('id') || child.id;
      if (!id) {
        id = `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
        child.setAttribute('id', id);
        if ('id' in child) {
          try { child.id = id; } catch (e) { }
        }
      }

      const rawName = child.getAttribute('data-name') || id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
      const cleanName = rawName.replace(/^tpl-[a-z0-9]{4}-/, '');

      const layer = {
        id,
        name: cleanName,
        type: child.tagName.toLowerCase(),
        visible: child.getAttribute('data-hidden') !== 'true',
        locked: child.getAttribute('data-locked') === 'true'
      };

      // If shape has masked image, group it as a nested masked image layer
      if (child.getAttribute('data-masked-image-url')) {
        layer.isMaskedShape = true;
        layer.children = [{
          id: `masked-img-${id.replace(/[^a-zA-Z0-9-_]/g, '_')}`,
          name: 'Masked Image',
          type: 'image',
          parentId: id,
          isVirtualImageChild: true,
          visible: layer.visible,
          locked: layer.locked
        }];
      }

      // VIRTUAL EFFECT LAYERS FOR IMAGE/VIDEO/GIF GROUP
      const isGroup = child.getAttribute('data-is-image-group') === 'true' ||
        child.getAttribute('data-is-video-group') === 'true' ||
        child.getAttribute('data-is-gif-group') === 'true';

      const isPdfVector = child.getAttribute('data-type') === 'pdf-vector-layer';

      if (child.tagName.toLowerCase() === 'g' && child.children.length > 0 && !isGroup && !isPdfVector) {
        const subLayers = parseLayersFromSVG(child);
        if (subLayers.length > 0) layer.children = subLayers;
      } else if (isGroup) {
        // Strip IDs from all descendants of an Image Group so they can't be selected individually
        const stripIds = (node) => {
          Array.from(node.children).forEach(descendant => {
            descendant.removeAttribute('id');
            stripIds(descendant);
          });
        };
        stripIds(child);
      }

      const isText = child.tagName.toLowerCase() === 'text' ||
        (child.tagName.toLowerCase() === 'foreignobject' && child.getAttribute('data-type') !== 'video' && child.getAttribute('data-type') !== 'iframe');

      if (isGroup || isText) {
        let coreName = 'Image';
        let coreType = 'image';
        if (child.getAttribute('data-is-video-group') === 'true') {
          coreName = 'Video';
          coreType = 'video';
        } else if (child.getAttribute('data-is-gif-group') === 'true') {
          coreName = 'GIF';
          coreType = 'image';
        } else if (isText) {
          const customName = child.getAttribute('data-name');
          coreName = customName ? customName.replace(/^tpl-[a-z0-9]{4}-/, '') : 'Text';
          coreType = 'text';
        }
        layer.name = coreName;
        layer.type = coreType;
        // Strip children to show as a single flat element in the layers panel
        delete layer.children;
      }

      return [layer];
    });
};

// Global listener to track active text selection range inside contenteditable elements
if (typeof window !== 'undefined' && !window.__textSelectionTrackingInitialized) {
  window.__textSelectionTrackingInitialized = true;
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const r = sel.getRangeAt(0);
      const container = r.commonAncestorContainer.nodeType === 1 
        ? r.commonAncestorContainer 
        : r.commonAncestorContainer.parentElement;
      const editableDiv = container?.closest('[contenteditable="true"]');
      if (editableDiv) {
        const fo = editableDiv.closest('foreignObject') || editableDiv.closest('[id]');
        if (fo && fo.id) {
          window.__savedTextSelection = {
            elementId: fo.id,
            range: r.cloneRange()
          };
        }
      }
    }
  });

  document.addEventListener('mousedown', (e) => {
    const target = e.target;
    if (target && (
      target.closest('.right-sidebar') ||
      target.closest('#right-sidebar') ||
      target.closest('[data-panel]') ||
      target.closest('.z-50') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select')
    )) {
      window.__isInteractingWithSidebar = true;
      setTimeout(() => {
        window.__isInteractingWithSidebar = false;
      }, 350);
    }
  }, true);
}

/**
 * Applies character-level style properties (color, fontSize, fontFamily, etc.)
 * specifically to the active or saved text selection range inside a contenteditable text box.
 * Returns true if a text selection range was styled, or false if no selection exists.
 */
export const applyStyleToActiveTextSelection = (elementId, attribute, value) => {
  if (!elementId) return false;
  const sel = window.getSelection();
  let range = null;

  const fo = document.getElementById(elementId);
  if (!fo) return false;
  const contentDiv = fo.querySelector('[contenteditable="true"]') || fo.firstElementChild;
  if (!contentDiv) return false;

  // 1. Check current live selection in browser window
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const r = sel.getRangeAt(0);
    if (contentDiv.contains(r.commonAncestorContainer)) {
      range = r;
    }
  }

  // 2. Check saved selection if focus shifted to sidebar property controls
  if (!range && window.__savedTextSelection && window.__savedTextSelection.elementId === elementId) {
    const savedRange = window.__savedTextSelection.range;
    if (savedRange && contentDiv.contains(savedRange.commonAncestorContainer)) {
      range = savedRange;
    }
  }

  if (!range || range.collapsed) return false;

  const cssPropMap = {
    fill: 'color',
    color: 'color',
    fontSize: 'font-size',
    fontFamily: 'font-family',
    fontWeight: 'font-weight',
    fontStyle: 'font-style',
    textDecoration: 'text-decoration',
    textTransform: 'text-transform'
  };

  const cssProp = cssPropMap[attribute];
  if (!cssProp) return false;

  let finalVal = value;
  if (attribute === 'fontSize' && typeof finalVal === 'number') {
    finalVal = `${finalVal}px`;
  } else if (attribute === 'fontFamily' && typeof finalVal === 'string' && !finalVal.includes("'") && !finalVal.includes('"')) {
    finalVal = `'${finalVal}'`;
  }

  try {
    const span = document.createElement('span');
    span.style.setProperty(cssProp, finalVal, 'important');

    const contents = range.extractContents();
    
    // Clean up any nested instances of the same property to prevent override conflicts
    const nestedElements = contents.querySelectorAll('*');
    nestedElements.forEach(el => {
      if (el.style) {
        el.style.removeProperty(cssProp);
        
        // Also remove camelCase version just in case
        const camelProp = cssProp.replace(/-([a-z])/g, g => g[1].toUpperCase());
        el.style.removeProperty(camelProp);
      }
    });

    span.appendChild(contents);
    range.insertNode(span);

    // Restore focus and range selection
    contentDiv.focus();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    window.__savedTextSelection = {
      elementId,
      range: newRange.cloneRange()
    };

    return true;
  } catch (err) {
    console.error('[applyStyleToActiveTextSelection] Error applying inline selection style:', err);
    return false;
  }
};

/**
 * Ensures that <image data-name="Page Background Image"> exists and is in sync
 * with overlay data-bg-image attributes in the SVG markup.
 * Used across Editor, Preview, and Share View.
 */
export const ensurePageBackgroundImage = (svgMarkup) => {
  if (!svgMarkup || typeof svgMarkup !== 'string' || !svgMarkup.includes('data-bg-image=')) {
    return svgMarkup;
  }
  try {
    let safeXml = svgMarkup;
    if (!safeXml.includes('xmlns:xlink=')) {
      safeXml = safeXml.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(safeXml, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    const ov = doc.querySelector('[data-bg-image]') || doc.querySelector('[data-name="Overlay"]') || doc.querySelector('[data-type="background"]') || doc.querySelector('rect');
    const bgUrl = ov?.getAttribute('data-bg-image');
    let imgNode = doc.querySelector('image[data-name="Page Background Image"]') || doc.querySelector('[data-type="page-background-image"]');

    if (svg && bgUrl) {
      const getCleanNameFromUrl = (urlStr) => {
        if (!urlStr) return 'Background Image.jpg';
        try {
          const cleanPath = urlStr.split('?')[0].split('#')[0];
          const lastPart = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
          if (lastPart) {
            const decoded = decodeURIComponent(lastPart);
            const cleanName = decoded.replace(/^[0-9a-fA-F-]+_/, '').replace(/^\d{10,}_/, '');
            return cleanName || decoded;
          }
        } catch (e) {}
        return 'Background Image.jpg';
      };

      let name = ov.getAttribute('data-bg-image-name') || imgNode?.getAttribute('data-filename') || '';
      if (!name || name === 'Background Image.jpg') {
        name = getCleanNameFromUrl(bgUrl);
      }
      let dim = ov.getAttribute('data-bg-image-dim') || imgNode?.getAttribute('data-dimensions') || '';
      if (dim === '1920 X 1080 • 24MB') dim = '';
      const fit = ov.getAttribute('data-bg-fit') || ov.getAttribute('data-fix-type') || (imgNode?.getAttribute('data-fix-type')) || 'Fit';
      let op = '1';
      if (ov.getAttribute('data-bg-opacity')) {
        op = (parseFloat(ov.getAttribute('data-bg-opacity')) / 100).toString();
      } else if (ov.getAttribute('opacity')) {
        op = ov.getAttribute('opacity');
        ov.setAttribute('data-bg-opacity', Math.round(parseFloat(op) * 100).toString());
        ov.removeAttribute('opacity');
      } else if (imgNode?.getAttribute('opacity')) {
        op = imgNode.getAttribute('opacity');
      }
      const aspect = fit === 'Fit' ? 'xMidYMid meet' : (fit === 'Fill' ? 'xMidYMid slice' : 'none');

      const ovW = parseFloat(ov.getAttribute('width') || '');
      const ovH = parseFloat(ov.getAttribute('height') || '');
      const svgW = parseFloat(svg.getAttribute('width') || '');
      const svgH = parseFloat(svg.getAttribute('height') || '');
      let baseW = (!isNaN(ovW) && ovW > 0) ? ovW : ((!isNaN(svgW) && svgW > 0) ? svgW : 794);
      let baseH = (!isNaN(ovH) && ovH > 0) ? ovH : ((!isNaN(svgH) && svgH > 0) ? svgH : 1123);
      if (svg.getAttribute('viewBox')) {
        const vbParts = svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(parseFloat);
        if (vbParts.length >= 4 && !isNaN(vbParts[2]) && !isNaN(vbParts[3]) && vbParts[2] > 0 && vbParts[3] > 0) {
          baseW = vbParts[2];
          baseH = vbParts[3];
        }
      }

      if (!imgNode) {
        imgNode = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
        imgNode.setAttribute('id', `page-bg-img-${Date.now()}`);
        imgNode.setAttribute('data-name', 'Page Background Image');
        imgNode.setAttribute('data-type', 'page-background-image');
        imgNode.setAttribute('x', '0');
        imgNode.setAttribute('y', '0');
        imgNode.setAttribute('width', baseW.toString());
        imgNode.setAttribute('height', baseH.toString());
        imgNode.setAttribute('style', 'pointer-events: none;');
        imgNode.setAttribute('href', bgUrl);
        imgNode.setAttribute('xlink:href', bgUrl);
        imgNode.setAttribute('data-filename', name);
        imgNode.setAttribute('data-dimensions', dim);
        imgNode.setAttribute('data-fix-type', fit);
        imgNode.setAttribute('opacity', op);
        imgNode.setAttribute('preserveAspectRatio', aspect);

        const borderNode = doc.querySelector('[data-name="Page Border"]');
        if (borderNode) {
          borderNode.parentNode.insertBefore(imgNode, borderNode);
        } else if (ov && ov.nextSibling) {
          ov.parentNode.insertBefore(imgNode, ov.nextSibling);
        } else if (ov) {
          ov.parentNode.appendChild(imgNode);
        } else {
          svg.insertBefore(imgNode, svg.firstChild);
        }
        return new XMLSerializer().serializeToString(doc);
      } else {
        let modified = false;
        if (imgNode.getAttribute('preserveAspectRatio') !== aspect) {
          imgNode.setAttribute('preserveAspectRatio', aspect);
          modified = true;
        }
        if (imgNode.getAttribute('data-fix-type') !== fit) {
          imgNode.setAttribute('data-fix-type', fit);
          modified = true;
        }
        if (op && imgNode.getAttribute('opacity') !== op) {
          imgNode.setAttribute('opacity', op);
          modified = true;
        }
        if (!imgNode.getAttribute('href') && bgUrl) {
          imgNode.setAttribute('href', bgUrl);
          imgNode.setAttribute('xlink:href', bgUrl);
          modified = true;
        }
        if (modified) {
          return new XMLSerializer().serializeToString(doc);
        }
      }
    }
  } catch (err) {
    console.warn('[ensurePageBackgroundImage] Error:', err);
  }
  return svgMarkup;
};

