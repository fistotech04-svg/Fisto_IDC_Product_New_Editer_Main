/**
 * useElementAttributeSync.js
 * Hook providing central DOM attribute synchronization (fill, stroke, opacity,
 * gradients, filters, transform) and page background color updates.
 */

import { parseLayersFromSVG, syncGradient, syncFilters } from './svgFilterUtils';

export const useElementAttributeSync = ({ setPages, saveToHistory }) => {
    const updateElementAttribute = (pageIndex, elementId, attribute, value) => {
    saveToHistory();
    // Special case: ImageEditor serializes the whole SVG and passes it directly
    if (attribute === '__dom_sync__') {
      const safeParseSVG = (htmlStr) => {
        let safeStr = htmlStr;
        if (!safeStr.includes('xmlns:xlink=')) {
          safeStr = safeStr.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
        }
        const parser = new DOMParser();
        let doc = parser.parseFromString(safeStr, 'image/svg+xml');
        if (doc.querySelector('parsererror')) {
          console.warn("Strict XML parsing failed, falling back to HTML parsing for layers");
          doc = parser.parseFromString(safeStr, 'text/html');
        }
        return doc;
      };
      setPages(prev => {
        const updated = [...prev];
        const page = updated[pageIndex];
        if (!page) return updated;

        let newLayers = page.layers;
        if (value) {
          const doc = safeParseSVG(value);
          const svgEl = doc.querySelector('svg');
          if (svgEl) {
            newLayers = parseLayersFromSVG(svgEl);
          }
        }

        updated[pageIndex] = { ...page, html: value, layers: newLayers };
        return updated;
      });
      return;
    }
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html) return prev;

      const parser = new DOMParser();
      let safeStr = page.html;
      if (!safeStr.includes('xmlns:xlink=')) safeStr = safeStr.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
      let doc = parser.parseFromString(safeStr, 'image/svg+xml');
      if (doc.querySelector('parsererror')) doc = parser.parseFromString(safeStr, 'text/html');
      let element = doc.getElementById(elementId);
      if (!element) {
        element = doc.querySelector(`[data-name="${elementId}"]`);
      }
      if (element) {
        const updates = (typeof attribute === 'object' && attribute !== null)
          ? Object.entries(attribute)
          : [[attribute, value]];

        // ── Pass 1: Write all attribute values onto the element first ──────────
        // This is critical for batch corner-radius updates: we must ensure every
        // data-tl/tr/bl/br and rx value is committed before any shape redraw
        // reads them, otherwise redraws triggered mid-loop see stale values.
        updates.forEach(([attr, val]) => {
          if (val === null || val === 'none' || val === '#') {
            if (attr === 'fill' || attr === 'stroke') {
              element.setAttribute(attr, 'none');
            } else {
              element.removeAttribute(attr);
            }
            if (attr === 'stroke-width') element.setAttribute('stroke', 'none');
          } else {
            if (attr === 'innerHTML' || attr === 'hotspotHtml') {
              element.innerHTML = val;
            } else {
              element.setAttribute(attr, val);
              if ((attr === 'fill' || attr === 'stroke' || attr === 'stroke-width' || attr === 'stroke-dasharray') && element.getAttribute('data-type') === 'icon') {
                const children = element.querySelectorAll('*');
                children.forEach(c => {
                  const tag = c.tagName.toLowerCase();
                  if (['path', 'rect', 'circle', 'polygon', 'ellipse', 'line', 'polyline'].includes(tag)) {
                    if (tag === 'rect' && !c.hasAttribute('fill')) {
                      c.setAttribute('fill', 'none');
                    }
                    if (attr === 'fill' && c.hasAttribute('fill') && c.getAttribute('fill') !== 'none') {
                      c.setAttribute('fill', val);
                    }
                    if (attr === 'stroke' && c.hasAttribute('stroke') && c.getAttribute('stroke') !== 'none') {
                      c.setAttribute('stroke', val);
                    }
                    if (attr === 'stroke-width' && c.hasAttribute('stroke') && c.getAttribute('stroke') !== 'none') {
                      c.setAttribute('stroke-width', val);
                    }
                    if (attr === 'stroke-dasharray' && c.hasAttribute('stroke') && c.getAttribute('stroke') !== 'none') {
                      c.setAttribute('stroke-dasharray', val);
                    }
                  }
                });
              }
            }
            if (attr === 'stroke-width' && val !== '0' && (element.getAttribute('stroke') === 'none' || !element.getAttribute('stroke'))) {
              element.setAttribute('stroke', '#000000');
            }
          }
        });

        // ── Pass 2: Shape redraws — all attrs are now committed ───────────────
        // Track whether a rect has already been redrawn in this batch so we
        // don't emit multiple redundant path rewrites for the same element.
        let rectRedrawnThisBatch = false;

        updates.forEach(([attr, val]) => {
          if (val === null || val === 'none' || val === '#') return; // no redraw needed

          // --- DYNAMIC SHAPE REDRAW (FOR POLYGON/STAR/ROUNDED RECT) ---
          const isRectCorner = ['data-tl', 'data-tr', 'data-bl', 'data-br'].includes(attr);
          if (attr === 'data-count' || attr === 'data-rx' || attr === 'data-ry' || attr === 'data-ratio' || attr === 'data-radius' || isRectCorner || attr === 'rx') {
            const shapeType = element.getAttribute('data-shape-type') || (element.tagName === 'rect' ? 'rectangle' : null);

            if (shapeType === 'polygon' || shapeType === 'star') {
              const cx = parseFloat(element.getAttribute('data-cx') || 0);
              const cy = parseFloat(element.getAttribute('data-cy') || 0);
              const rx = parseFloat(element.getAttribute('data-rx') || 0);
              const count = parseInt(element.getAttribute('data-count') || 3);
              const cr = parseFloat(element.getAttribute('data-radius') || 0);

              const pts = [];
              if (shapeType === 'polygon') {
                for (let i = 0; i < count; i++) {
                  const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
                  pts.push({ x: cx + rx * Math.cos(angle), y: cy + rx * Math.sin(angle) });
                }
              } else if (shapeType === 'star') {
                const ratio = parseFloat(element.getAttribute('data-ratio') || 40) / 100;
                const ri = rx * ratio;
                const sides = count * 2;
                for (let i = 0; i < sides; i++) {
                  const r = (i % 2 === 0) ? rx : ri;
                  const angle = (Math.PI / count) * i - Math.PI / 2;
                  pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
                }
              }

              if (cr > 0 && pts.length > 2) {
                let pathData = "";
                const cornerPoints = pts.map((curr, i) => {
                  const prev = pts[(i + pts.length - 1) % pts.length];
                  const next = pts[(i + 1) % pts.length];
                  const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
                  const d2 = { x: next.x - curr.x, y: next.y - curr.y };
                  const l1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
                  const l2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
                  const limit = Math.min(cr, l1 / 2, l2 / 2);
                  return {
                    q: { x: curr.x, y: curr.y },
                    p1: { x: curr.x - (d1.x / l1) * limit, y: curr.y - (d1.y / l1) * limit },
                    p2: { x: curr.x + (d2.x / l2) * limit, y: curr.y + (d2.y / l2) * limit }
                  };
                });
                cornerPoints.forEach((cp, i) => {
                  if (i === 0) pathData += `M ${cp.p1.x} ${cp.p1.y}`;
                  else pathData += ` L ${cp.p1.x} ${cp.p1.y}`;
                  pathData += ` Q ${cp.q.x} ${cp.q.y}, ${cp.p2.x} ${cp.p2.y}`;
                });
                pathData += " Z";
                element.setAttribute('d', pathData);
              } else {
                element.setAttribute('d', `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} Z`);
              }
            }
            else if (shapeType === 'rectangle' && (isRectCorner || attr === 'rx') && !rectRedrawnThisBatch) {
              // All corner attrs are already written in Pass 1 — read them fresh.
              rectRedrawnThisBatch = true;
              const x = parseFloat(element.getAttribute('x') || 0);
              const y = parseFloat(element.getAttribute('y') || 0);
              const w = parseFloat(element.getAttribute('width') || 0);
              const h = parseFloat(element.getAttribute('height') || 0);
              const defR = parseFloat(element.getAttribute('rx') || 0);

              // Clamp each corner radius to at most half the rect's shorter dimension.
              // Without clamping, radii > w/2 or h/2 cause bezier arcs to cross,
              // producing the unwanted eye/lens shape (matching CSS border-radius behaviour).
              const maxR = Math.min(w / 2, h / 2);
              const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
              const tl = Math.min(parseR(element.getAttribute('data-tl'), defR), maxR);
              const tr = Math.min(parseR(element.getAttribute('data-tr'), defR), maxR);
              const bl = Math.min(parseR(element.getAttribute('data-bl'), defR), maxR);
              const br = Math.min(parseR(element.getAttribute('data-br'), defR), maxR);

              const d = `
                    M ${x + tl},${y}
                    L ${x + w - tr},${y}
                    A ${tr},${tr} 0 0 1 ${x + w},${y + tr}
                    L ${x + w},${y + h - br}
                    A ${br},${br} 0 0 1 ${x + w - br},${y + h}
                    L ${x + bl},${y + h}
                    A ${bl},${bl} 0 0 1 ${x},${y + h - bl}
                    L ${x},${y + tl}
                    A ${tl},${tl} 0 0 1 ${x + tl},${y}
                    Z
                 `.replace(/\s+/g, ' ').trim();

              if (element.tagName === 'rect') {
                const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                Array.from(element.attributes).forEach(a => path.setAttribute(a.name, a.value));
                path.setAttribute('d', d);
                path.setAttribute('data-shape-type', 'rectangle');
                element.parentNode.replaceChild(path, element);
              } else {
                element.setAttribute('d', d);
              }
            }
          }
        });

        // --- GRADIENT SYNC ---
        const checkGrad = (attr) => attr.startsWith('fill') || attr.startsWith('stroke') || attr.includes('-stops') || attr.includes('-gradient-type') || attr.includes('-type') || attr.includes('stroke-');
        const hasGradRelated = typeof attribute === 'object' && attribute !== null
          ? Object.keys(attribute).some(checkGrad)
          : checkGrad(attribute);

        if (hasGradRelated) {
          const primaryAttr = typeof attribute === 'object' && attribute !== null ? Object.keys(attribute)[0] : attribute;
          const base = (primaryAttr.startsWith('fill') || primaryAttr.includes('fill-')) ? 'fill' : 'stroke';
          syncGradient(doc, element, base);

          if (element.tagName.toLowerCase() === 'g') {
            const children = element.querySelectorAll('path, rect, circle, ellipse, polyline, polygon');
            children.forEach(child => {
              updates.forEach(([attr]) => {
                if (element.getAttribute('data-type') !== 'icon') {
                  if (attr === 'fill' || attr === 'stroke' || attr === 'stroke-width' || attr === 'stroke-dasharray' || attr === 'opacity') {
                    child.removeAttribute(attr);
                    if (child.style) child.style.removeProperty(attr);
                  }
                }
              });
              if (typeof attribute === 'object' && attribute !== null ? Object.keys(attribute).some(a => a.includes('-stops') || a.includes('-gradient-type') || a.includes('-type')) : (attribute.includes('-stops') || attribute.includes('-gradient-type') || attribute.includes('-type'))) {
                child.removeAttribute(base);
                if (child.style) child.style.removeProperty(base);
              }
            });
          }

          updates.forEach(([attr, val]) => {
            if (attr === 'stroke' && val !== 'none' && val !== '#') {
              const currentWidth = element.getAttribute('stroke-width');
              if (!currentWidth || currentWidth === '0') {
                element.setAttribute('stroke-width', '1');
              }
            }
          });
        }

        const hasEffectRelated = typeof attribute === 'object' && attribute !== null
          ? Object.keys(attribute).some(a => a.startsWith('data-effect-'))
          : attribute.startsWith('data-effect-');
        if (hasEffectRelated) {
          syncFilters(doc, element);
        }

        const serializer = new XMLSerializer();
        updated[pageIndex] = { ...page, html: serializer.serializeToString(doc.documentElement) };
      }
      return updated;
    });
  };

    const updatePageBackground = (pageIndex, color) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (page && page.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(page.html, 'image/svg+xml');
        const overlay = doc.querySelector('[data-name="Overlay"]');
        if (overlay) {
          overlay.setAttribute('fill', color);
          page.html = new XMLSerializer().serializeToString(doc);
        }
        updated[pageIndex] = { ...page };
      }
      return updated;
    });
  };

  return {
    updateElementAttribute,
    updatePageBackground
  };
};
