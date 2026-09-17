// Utility functions for the template editor

export const getCleanHTML = (html) => {
  return html || '';
};


// Reset properties to default values
export const resetProperties = (setProperties) => {
  setProperties({
    fontSize: 16,
    fontFamily: "Arial",
    fontWeight: 400,
    color: "#000000",
    backgroundColor: "#ffffff",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0,
    textDecoration: "none",
    textTransform: "none",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "#000000",
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 0,
    animation: "none",
    animationDuration: 0,
    animationDelay: 0,
    animationIterationCount: 1,
    animationDirection: "normal",
    animationFillMode: "none",
    animationTimingFunction: "ease",
    interaction: "none",
    link: "",
    tooltip: "",
    altText: "",
    src: "",
    videoSrc: "",
    autoplay: false,
    loop: false,
    muted: true,
    controls: true,
    poster: "",
  });
};

// Update properties from an object
export const updatePropertiesFromObject = (setProperties, obj) => {
  setProperties((prev) => ({ ...prev, ...obj }));
};

// Update a single property
export const updateProperty = (setProperties, key, value) => {
  setProperties((prev) => ({ ...prev, [key]: value }));
};

// History management functions
export const saveToHistory = (history, setHistory, currentState) => {
  setHistory([...history, currentState]);
};

export const undo = (history, setHistory, setCurrentState) => {
  if (history.length > 0) {
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentState(previousState);
  }
};

export const redo = (redoStack, setRedoStack, setCurrentState) => {
  if (redoStack.length > 0) {
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setCurrentState(nextState);
  }
};

/**
 * Formats a raw SVG string from a template file into a valid Page SVG structure
 * matching TemplateEditor's expected format (viewBox, root frame <g>, Overlay rect, scoped IDs).
 */
export function formatTemplateSvgToPageSvg(svgContent, targetW = 210, targetH = 297, pageName = 'Page 1') {
  if (!svgContent || typeof svgContent !== 'string') return '';

  try {
    const parser = new DOMParser();

    // 0. Detect and dynamically load any new fonts used in the template
    try {
      const fontsToLoad = new Set();
      const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
      let match;
      while ((match = cssRegex.exec(svgContent)) !== null) {
        let f = match[1] || match[2];
        f = f.split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }
      const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
      while ((match = attrRegex.exec(svgContent)) !== null) {
        let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }

      fontsToLoad.forEach(font => {
        const fontId = `dynamic-font-${font.replace(/\s+/g, '-')}`;
        if (typeof document !== 'undefined' && !document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.href = `https://fonts.googleapis.com/css?family=${font.replace(/\s+/g, '+')}:300,400,500,600,700,800,900&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });
    } catch (fontErr) {
      console.warn('Dynamic font load notice:', fontErr);
    }

    const templateDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const templateSvg = templateDoc.querySelector('svg');
    if (!templateSvg) return '';

    // Scope all IDs and classes in template to avoid collisions
    const tplPrefix = `tpl-${Math.random().toString(36).substr(2, 4)}`;
    const allTplElements = Array.from(templateSvg.querySelectorAll('*'));
    const idRefRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;

    const idMap = new Map();
    // 1. Identify all elements with existing IDs and create sanitized prefixed IDs
    allTplElements.forEach(el => {
      if (el.id) {
        const safeOld = el.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const newId = `${tplPrefix}-${safeOld}`;
        idMap.set(el.id, newId);
        el.id = newId;
      }
    });

    // 2. Replace all url(#id) and href="#id" references
    allTplElements.forEach(el => {
      const classVal = el.getAttribute('class');
      if (classVal) {
        const prefixedClasses = classVal.split(/\s+/).map(c => c ? `${tplPrefix}-${c}` : c).join(' ');
        el.setAttribute('class', prefixedClasses);
      }

      const refAttrs = ['fill', 'stroke', 'filter', 'mask', 'clip-path'];
      refAttrs.forEach(attr => {
        const val = el.getAttribute(attr);
        if (val) {
          const newVal = val.replace(idRefRegex, (m, oldRef) => {
            const mapped = idMap.get(oldRef);
            return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
          });
          if (newVal !== val) el.setAttribute(attr, newVal);
        }
      });

      const styleText = el.getAttribute('style');
      if (styleText && styleText.includes('url(#')) {
        el.setAttribute('style', styleText.replace(idRefRegex, (m, oldRef) => {
          const mapped = idMap.get(oldRef);
          return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
        }));
      }

      ['xlink:href', 'href'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val && val.startsWith('#')) {
          const oldRef = val.substring(1);
          const mapped = idMap.get(oldRef);
          el.setAttribute(attr, `#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`}`);
        }
      });
    });

    const tplStyles = templateSvg.querySelectorAll('style');
    tplStyles.forEach(style => {
      if (style.textContent) {
        let css = style.textContent.replace(idRefRegex, (m, oldRef) => {
          const mapped = idMap.get(oldRef);
          return `url(#${mapped || `${tplPrefix}-${oldRef.replace(/[^a-zA-Z0-9_-]/g, '_')}`})`;
        });
        css = css.replace(/\.([a-zA-Z0-9_-]+)(?=[^{}]*\{)/g, `.${tplPrefix}-$1`);
        style.textContent = css;
      }
    });

    // Create target Page SVG document
    const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
    const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
    const defaultHtml = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${targetW} ${targetH}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${pageName}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${targetW}" height="${targetH}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
  </g>
</svg>`;

    const pageDoc = parser.parseFromString(defaultHtml, 'image/svg+xml');
    const pageSvg = pageDoc.querySelector('svg');
    const rootFolder = pageSvg.querySelector('g[data-type="frame"]') || pageSvg.querySelector('g');

    // Calculate dimensions, viewBox, scaling
    let templateWidth = parseFloat(templateSvg.getAttribute('width'));
    let templateHeight = parseFloat(templateSvg.getAttribute('height'));
    const viewBoxStr = templateSvg.getAttribute('viewBox');
    let viewBoxX = 0;
    let viewBoxY = 0;

    if (viewBoxStr) {
      const parts = viewBoxStr.trim().split(/[ ,]+/).map(parseFloat);
      if (parts.length === 4) {
        viewBoxX = parts[0];
        viewBoxY = parts[1];
        templateWidth = parts[2];
        templateHeight = parts[3];
      }
    }

    if (!templateWidth) templateWidth = targetW;
    if (!templateHeight) templateHeight = targetH;

    const scale = Math.min(targetW / templateWidth, targetH / templateHeight);
    const offsetX = (targetW - templateWidth * scale) / 2;
    const offsetY = (targetH - templateHeight * scale) / 2;

    // Merge resource tags into defs
    const RESOURCE_TAGS = ['mask', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'marker'];
    const allResources = templateSvg.querySelectorAll(RESOURCE_TAGS.join(','));
    let targetDefs = pageSvg.querySelector('defs');

    if (allResources.length > 0) {
      if (!targetDefs) {
        targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
      }
      allResources.forEach(res => {
        targetDefs.appendChild(pageDoc.importNode(res, true));
      });
    }

    const templateDefs = templateSvg.querySelector('defs');
    if (templateDefs) {
      if (!targetDefs) {
        targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
      }
      Array.from(templateDefs.children).forEach(child => {
        targetDefs.appendChild(pageDoc.importNode(child, true));
      });
    }

    const templateStyles = templateSvg.querySelectorAll('style');
    if (templateStyles.length > 0) {
      let targetStyle = pageSvg.querySelector('style');
      if (!targetStyle) {
        targetStyle = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
        pageSvg.insertBefore(targetStyle, pageSvg.firstChild);
      }
      templateStyles.forEach(s => {
        targetStyle.textContent += s.textContent + '\n';
      });
    }

    // Helper: unwrap a group and inherit its properties to its children
    const unwrapGroup = (g) => {
      const children = Array.from(g.children);
      const attrsToInherit = [
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'opacity', 'visibility', 'filter', 'color',
        'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
      ];
      attrsToInherit.forEach(attr => {
        const val = g.getAttribute(attr);
        if (val) {
          children.forEach(child => {
            if (!child.hasAttribute(attr)) child.setAttribute(attr, val);
          });
        }
      });

      const gStyle = g.getAttribute('style');
      if (gStyle) {
        children.forEach(child => {
          const cStyle = child.getAttribute('style');
          child.setAttribute('style', cStyle ? `${gStyle}; ${cStyle}` : gStyle);
        });
      }

      const gClass = g.getAttribute('class');
      if (gClass) {
        children.forEach(child => {
          const cClass = child.getAttribute('class');
          child.setAttribute('class', cClass ? `${gClass} ${cClass}` : gClass);
        });
      }

      const gTransform = g.getAttribute('transform');
      if (gTransform) {
        children.forEach(child => {
          const cTransform = child.getAttribute('transform') || '';
          child.setAttribute('transform', `${gTransform} ${cTransform}`.trim());
        });
      }

      const gClip = g.getAttribute('clip-path');
      if (gClip) {
        children.forEach(child => {
          if (!child.hasAttribute('clip-path')) child.setAttribute('clip-path', gClip);
        });
      }

      const parent = g.parentNode;
      if (parent) {
        children.forEach(child => {
          parent.insertBefore(child, g);
        });
        parent.removeChild(g);
      }
    };

    // Recursively unwrap all structural/container groups so individual elements are directly accessible
    let unwrappedAny = true;
    let maxPasses = 25;
    while (unwrappedAny && maxPasses-- > 0) {
      unwrappedAny = false;
      const groups = Array.from(templateSvg.querySelectorAll('g'));
      for (const g of groups) {
        if (!g.parentNode) continue;

        // 1. Empty group
        if (g.children.length === 0) {
          g.parentNode.removeChild(g);
          unwrappedAny = true;
          continue;
        }

        // 2. Single child group: always unwrap
        if (g.children.length === 1) {
          unwrapGroup(g);
          unwrappedAny = true;
          continue;
        }

        // 3. Groups containing text elements: always unwrap so text can be directly clicked and edited
        const hasText = g.querySelector('text, tspan, foreignObject') !== null;
        if (hasText) {
          unwrapGroup(g);
          unwrappedAny = true;
          continue;
        }

        // 4. Groups containing nested groups: unwrap outer container
        const hasNestedGroup = Array.from(g.children).some(c => c.tagName.toLowerCase() === 'g');
        if (hasNestedGroup) {
          unwrapGroup(g);
          unwrappedAny = true;
          continue;
        }

        // 5. Keep small vector-only groups (e.g. icons with <= 5 paths) as icon units; unwrap other containers
        const isSmallVectorIcon = g.children.length <= 5 && Array.from(g.children).every(c =>
          ['path', 'circle', 'line', 'polygon', 'polyline'].includes(c.tagName.toLowerCase())
        );
        if (!isSmallVectorIcon) {
          unwrapGroup(g);
          unwrappedAny = true;
          continue;
        }
      }
    }

    // Children of template after unwrapping
    let infants = Array.from(templateSvg.children).filter(child =>
      !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
      !RESOURCE_TAGS.includes(child.tagName.toLowerCase())
    );

    const targetParent = rootFolder || pageSvg;
    const overlayChild = Array.from(targetParent.children).find(el => el.getAttribute('data-name') === 'Overlay');

    // Background rectangle detection: if the first element is a full-page rectangle, transfer its fill to Overlay
    if (infants.length > 0 && infants[0].tagName.toLowerCase() === 'rect') {
      const firstRect = infants[0];
      const rW = parseFloat(firstRect.getAttribute('width')) || 0;
      const rH = parseFloat(firstRect.getAttribute('height')) || 0;
      const rX = parseFloat(firstRect.getAttribute('x')) || 0;
      const rY = parseFloat(firstRect.getAttribute('y')) || 0;

      const isFullBg = (rX === 0 || isNaN(rX)) && (rY === 0 || isNaN(rY)) &&
        (rW >= templateWidth * 0.9) && (rH >= templateHeight * 0.9);

      if (isFullBg) {
        const bgFill = firstRect.getAttribute('fill');
        if (overlayChild && bgFill && bgFill !== 'none') {
          overlayChild.setAttribute('fill', bgFill);
          const bgOpacity = firstRect.getAttribute('fill-opacity') || firstRect.getAttribute('opacity');
          if (bgOpacity) overlayChild.setAttribute('fill-opacity', bgOpacity);
        }
        firstRect.parentNode?.removeChild(firstRect);
        infants = infants.slice(1);
      }
    }

    // Assign IDs and semantic data-type / data-name to EVERY element
    let elemCounter = 1;
    infants.forEach(child => {
      const tag = child.tagName.toLowerCase();

      // Ensure every element has a unique, clean ID
      if (!child.id || child.id.trim() === '') {
        child.id = `${tag}-${tplPrefix}-${elemCounter++}`;
      }

      // Assign data-type and human-readable data-name
      if (tag === 'text') {
        child.setAttribute('data-type', 'text');
        const textStr = (child.textContent || '').trim().replace(/\s+/g, ' ');
        child.setAttribute('data-name', textStr ? `Text - ${textStr.slice(0, 24)}` : 'Text');
      } else if (tag === 'image') {
        child.setAttribute('data-type', 'image');
        child.setAttribute('data-name', 'Image');
      } else if (tag === 'rect') {
        const fill = child.getAttribute('fill') || '';
        if (fill.startsWith('url(#')) {
          child.setAttribute('data-type', 'image');
          child.setAttribute('data-name', 'Image');
        } else {
          child.setAttribute('data-type', 'shape');
          child.setAttribute('data-name', 'Rectangle');
        }
      } else if (tag === 'circle') {
        child.setAttribute('data-type', 'shape');
        child.setAttribute('data-name', 'Circle');
      } else if (tag === 'ellipse') {
        child.setAttribute('data-type', 'shape');
        child.setAttribute('data-name', 'Ellipse');
      } else if (tag === 'line') {
        child.setAttribute('data-type', 'shape');
        child.setAttribute('data-name', 'Line');
      } else if (tag === 'path') {
        child.setAttribute('data-type', 'shape');
        child.setAttribute('data-name', 'Shape');
      } else if (tag === 'polygon' || tag === 'polyline') {
        child.setAttribute('data-type', 'shape');
        child.setAttribute('data-name', 'Polygon');
      } else if (tag === 'g') {
        child.setAttribute('data-type', 'icon');
        child.setAttribute('data-name', 'Icon');
      }
    });

    const svgAttrs = [
      'fill', 'stroke', 'stroke-width', 'opacity', 'visibility', 'filter', 'color',
      'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
    ];

    infants.forEach(child => {
      const imported = pageDoc.importNode(child, true);
      svgAttrs.forEach(attr => {
        const val = templateSvg.getAttribute(attr);
        if (val && !imported.hasAttribute(attr)) imported.setAttribute(attr, val);
      });
      const svgStyle = templateSvg.getAttribute('style');
      if (svgStyle) {
        const importedStyle = imported.getAttribute('style');
        imported.setAttribute('style', importedStyle ? `${svgStyle}; ${importedStyle}` : svgStyle);
      }
      const svgClass = templateSvg.getAttribute('class');
      if (svgClass) {
        const importedClass = imported.getAttribute('class');
        imported.setAttribute('class', importedClass ? `${svgClass} ${importedClass}` : svgClass);
      }
      const currentTransform = imported.getAttribute('transform') || '';
      const fittingTransform = `translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-viewBoxX}, ${-viewBoxY})`;
      imported.setAttribute('transform', `${fittingTransform} ${currentTransform}`.trim());

      targetParent.appendChild(imported);
    });

    return new XMLSerializer().serializeToString(pageSvg);
  } catch (err) {
    console.error('Error formatting template SVG to page SVG:', err);
    return '';
  }
}