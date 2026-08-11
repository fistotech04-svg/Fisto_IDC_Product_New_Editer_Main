import { parseGradient } from './ColorPicker';

const getSvgFill = (colorStr, defsArr, idPrefix) => {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  if (!colorStr.includes('gradient')) return colorStr;
  
  try {
    const parsed = parseGradient(colorStr);
    if (!parsed || !parsed.stops) return colorStr;
    
    const gradId = `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (parsed.type === 'Linear') {
      const angle = parsed.angle || 0;
      // CSS 0deg is bottom->top, 90deg is left->right
      const rad = (angle - 90) * (Math.PI / 180);
      const x1 = Math.round(50 - Math.cos(rad) * 50) + '%';
      const y1 = Math.round(50 - Math.sin(rad) * 50) + '%';
      const x2 = Math.round(50 + Math.cos(rad) * 50) + '%';
      const y2 = Math.round(50 + Math.sin(rad) * 50) + '%';
      
      let stopsHtml = parsed.stops.map(s => `<stop offset="${s.offset}%" stop-color="${s.color}" stop-opacity="${s.opacity / 100}" />`).join('');
      defsArr.push(`<linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsHtml}</linearGradient>`);
      return `url(#${gradId})`;
    } else {
      let stopsHtml = parsed.stops.map(s => `<stop offset="${s.offset}%" stop-color="${s.color}" stop-opacity="${s.opacity / 100}" />`).join('');
      defsArr.push(`<radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">${stopsHtml}</radialGradient>`);
      return `url(#${gradId})`;
    }
  } catch(e) {
    return colorStr;
  }
};

export const generateCompositeHotspotSvg = async (bgSrc, iconSrc, bgColor, iconColor, bgStyleIdx = 0) => {
  try {
    const iconRes = await fetch(iconSrc).then(r => r.text());

    const parser = new DOMParser();
    const iconDoc = parser.parseFromString(iconRes, 'image/svg+xml');

    const defsArr = [];
    const svgBgFill = getSvgFill(bgColor, defsArr, 'bg');
    const svgIconFill = getSvgFill(iconColor, defsArr, 'icon');

    const defsHtml = defsArr.length > 0 ? `<defs>${defsArr.join('')}</defs>` : '';

    // --- 1. Process Background SVG ---
    let bgSvgString = '';
    const innerCircle = `<circle cx="26" cy="26" r="18" fill="${svgBgFill}" />`;
    
    switch (bgStyleIdx) {
      case 1:
        // Dashed rotating ring
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            ${defsHtml}
            <circle cx="26" cy="26" r="24" fill="none" stroke="${svgBgFill}" stroke-width="2" stroke-dasharray="6 6">
              <animateTransform attributeName="transform" type="rotate" from="0 26 26" to="360 26 26" dur="5s" repeatCount="indefinite" />
            </circle>
            ${innerCircle}
          </svg>
        `;
        break;
      case 2:
        // Ripple expanding rings
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            ${defsHtml}
            <circle cx="26" cy="26" r="18" fill="none" stroke="${svgBgFill}" stroke-width="1.5">
              <animate attributeName="r" values="18; 26" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1; 0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="26" cy="26" r="18" fill="none" stroke="${svgBgFill}" stroke-width="1.5">
              <animate attributeName="r" values="18; 26" begin="0.75s" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1; 0" begin="0.75s" dur="1.5s" repeatCount="indefinite" />
            </circle>
            ${innerCircle}
          </svg>
        `;
        break;
      case 3:
        // Segmented thick ring rotating
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            ${defsHtml}
            <circle cx="26" cy="26" r="23" fill="none" stroke="${svgBgFill}" stroke-width="4" stroke-dasharray="2 4" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" from="360 26 26" to="0 26 26" dur="8s" repeatCount="indefinite" />
            </circle>
            ${innerCircle}
          </svg>
        `;
        break;
      case 4:
        // Dotted/Glow pulse
        const glowId = `glow-${svgBgFill.replace(/[^a-zA-Z0-9]/g, '')}`;
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            <defs>
              <filter id="${glowId}">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              ${defsArr.join('')}
            </defs>
            <circle cx="26" cy="26" r="23" fill="none" stroke="${svgBgFill}" stroke-width="2" stroke-dasharray="1 3" stroke-linecap="round" filter="url(#${glowId})">
              <animate attributeName="opacity" values="0.3; 1; 0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            ${innerCircle}
          </svg>
        `;
        break;
      case 5:
        // Orbital rings
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            ${defsHtml}
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 26 26" to="360 26 26" dur="4s" repeatCount="indefinite" />
              <circle cx="26" cy="26" r="24" fill="none" stroke="${svgBgFill}" stroke-width="1" opacity="0.5" />
              <circle cx="50" cy="26" r="2" fill="${svgBgFill}" />
              <circle cx="2" cy="26" r="2" fill="${svgBgFill}" />
            </g>
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360 26 26" to="0 26 26" dur="6s" repeatCount="indefinite" />
              <circle cx="26" cy="26" r="21" fill="none" stroke="${svgBgFill}" stroke-width="1" opacity="0.3" />
              <circle cx="26" cy="5" r="1.5" fill="${svgBgFill}" />
            </g>
            ${innerCircle}
          </svg>
        `;
        break;
      case 0:
      default:
        // Solid outer circle (Existing Default)
        bgSvgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="100%" height="100%" style="display: block;">
            ${defsHtml}
            <circle cx="26" cy="26" r="26" fill="${svgBgFill}" opacity="0.4" />
            ${innerCircle}
          </svg>
        `;
        break;
    }

    const bgDoc = parser.parseFromString(bgSvgString, 'image/svg+xml');
    const bgSvgEl = bgDoc.querySelector('svg');

    // --- 2. Process Icon SVG ---
    // Apply svgIconFill to all elements in iconDoc
    const iconElements = iconDoc.querySelectorAll('*');
    iconElements.forEach(el => {
      const tagName = el.tagName.toLowerCase();
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      
      if (fill && fill.toLowerCase() !== 'none') {
        el.setAttribute('fill', svgIconFill);
      }
      
      if (stroke && stroke.toLowerCase() !== 'none') {
        el.setAttribute('stroke', svgIconFill);
      }
      
      if (!fill && !stroke && ['path', 'circle', 'rect', 'polygon', 'ellipse', 'polyline'].includes(tagName)) {
        // Check if any ancestor provides a fill or stroke
        let hasInheritedStyle = false;
        let parent = el.parentElement;
        while (parent) {
          const pFill = parent.getAttribute('fill');
          const pStroke = parent.getAttribute('stroke');
          if ((pFill && pFill.toLowerCase() !== 'none') || (pStroke && pStroke.toLowerCase() !== 'none')) {
            hasInheritedStyle = true;
            break;
          }
          parent = parent.parentElement;
        }
        
        if (!hasInheritedStyle) {
          // Defaults to black in standard SVG if no fill or stroke is anywhere. Force our color.
          el.setAttribute('fill', svgIconFill);
        }
      }
    });

    // --- 3. Composite Them ---
    // Create a nested <svg> to hold the icon, positioned at center (24x24 icon inside 52x52 canvas)
    const nestedSvg = bgDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    nestedSvg.setAttribute('x', '14');
    nestedSvg.setAttribute('y', '14');
    nestedSvg.setAttribute('width', '24');
    nestedSvg.setAttribute('height', '24');
    
    const iconSvgEl = iconDoc.querySelector('svg');

    // Append all children of the icon SVG into our nested SVG and preserve its viewBox
    if (iconSvgEl) {
      const viewBox = iconSvgEl.getAttribute('viewBox');
      if (viewBox) {
        nestedSvg.setAttribute('viewBox', viewBox);
      } else {
        nestedSvg.setAttribute('viewBox', '0 0 24 24'); // Fallback
      }

      // Copy stylistic attributes from the original root SVG
      Array.from(iconSvgEl.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        if (!['xmlns', 'class', 'viewbox', 'x', 'y', 'width', 'height', 'style'].includes(name)) {
          nestedSvg.setAttribute(attr.name, attr.value);
        }
      });

      Array.from(iconSvgEl.childNodes).forEach(node => {
        nestedSvg.appendChild(bgDoc.importNode(node, true));
      });
    }

    // Append nested SVG to background SVG
    if (bgSvgEl) {
      bgSvgEl.appendChild(nestedSvg);
    }

    return {
      fullSvg: new XMLSerializer().serializeToString(bgDoc),
      innerSvg: `<svg viewBox="0 0 52 52" width="52" height="52" preserveAspectRatio="xMidYMid meet" style="display: block;">${bgSvgEl.innerHTML}</svg>`
    };
  } catch (error) {
    console.error('Failed to generate composite hotspot SVG', error);
    return null;
  }
};
