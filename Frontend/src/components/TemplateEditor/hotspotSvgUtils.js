import { parseGradient } from './properties/ColorPicker';

export const generateSvgGradient = (colorStr, idPrefix) => {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('gradient')) {
    return { fillValue: colorStr, defsString: '' };
  }
  const parsed = parseGradient(colorStr);
  if (!parsed || !parsed.stops || parsed.stops.length === 0) {
    return { fillValue: colorStr, defsString: '' };
  }
  const id = `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`;
  let defsString = `<defs>`;
  if (parsed.type === 'Linear') {
    const angle = ((parsed.angle || 0) - 90) * (Math.PI / 180);
    const x1 = Math.round(50 + Math.cos(angle) * 50) + '%';
    const y1 = Math.round(50 + Math.sin(angle) * 50) + '%';
    const x2 = Math.round(50 - Math.cos(angle) * 50) + '%';
    const y2 = Math.round(50 - Math.sin(angle) * 50) + '%';
    defsString += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`;
    parsed.stops.forEach(stop => {
      defsString += `<stop offset="${stop.offset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity / 100}" />`;
    });
    defsString += `</linearGradient>`;
  } else {
    defsString += `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">`;
    parsed.stops.forEach(stop => {
      defsString += `<stop offset="${stop.offset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity / 100}" />`;
    });
    defsString += `</radialGradient>`;
  }
  defsString += `</defs>`;
  return { fillValue: `url(#${id})`, defsString };
};

export const PRESETS = [
  { id: 'preset1', type: 'solid-circle' },
  { id: 'preset2', type: 'dashed-circle' },
  { id: 'preset3', type: 'double-circle' },
  { id: 'preset4', type: 'dotted-circle' },
  { id: 'preset5', type: 'thick-circle' },
  { id: 'preset6', type: 'thin-circle' },
];

export const generateHotspotSVG = (preset, bgColor, iconColor, src, inlinedSvgInfo = null, idSuffix = '') => {
  const bgInfo = generateSvgGradient(bgColor, 'bg');
  const bgFill = bgInfo.fillValue;
  const fgInfo = generateSvgGradient(iconColor, 'fg');
  const fgFill = fgInfo.fillValue;
  let backgroundHTML = bgInfo.defsString + fgInfo.defsString;

  // Add invisible rect to stabilize SVG bounds and prevent jittering during resize
  backgroundHTML += `<rect x="0" y="0" width="48" height="48" fill="none" pointer-events="none" />`;
  
  if (preset === 'preset1') {
    // No extra rings, just the rich icon itself
  } else if (preset === 'preset2') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="24" fill="${bgFill}" opacity="0.3">
        <animate attributeName="r" values="20; 24; 20" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5; 0.1; 0.5" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset3') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="6 6">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset4') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="4 4">
        <animate attributeName="opacity" values="1; 0.3; 1" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset5') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="22" fill="none" stroke="${bgFill}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0 6">
        <animate attributeName="r" values="20; 24; 20" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset6') {
    const filterId = idSuffix ? `hotspot-glow-${idSuffix}` : `hotspot-glow-${Math.random().toString(36).substr(2, 6)}`;
    backgroundHTML += `
      <defs>
        <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="20" fill="none" stroke="${bgFill}" stroke-width="4" filter="url(#${filterId})">
        <animate attributeName="opacity" values="1; 0; 1" dur="1.5s" repeatCount="indefinite" />
      </circle>`;
  }

  // Draw the original image or the recolored inline SVG
  if (inlinedSvgInfo) {
    let innerSvgAttrs = `x="4" y="4" width="40" height="40"`; // Scaled down to create a comfortable gap from outer preset circles
    let extraBg = '';
    let fillAttr = '';
    let strokeAttr = '';
    let extraSvgAttrs = '';
    
    if (inlinedSvgInfo.strokeWidth) extraSvgAttrs += ` stroke-width="${inlinedSvgInfo.strokeWidth}"`;
    if (inlinedSvgInfo.strokeLinecap) extraSvgAttrs += ` stroke-linecap="${inlinedSvgInfo.strokeLinecap}"`;
    if (inlinedSvgInfo.strokeLinejoin) extraSvgAttrs += ` stroke-linejoin="${inlinedSvgInfo.strokeLinejoin}"`;

    if (inlinedSvgInfo.isRawIcon) {
      // Scale down raw icon background circle to match non-raw icon size perfectly
      extraBg = `<circle cx="24" cy="24" r="16" fill="${bgFill}" />`;
      innerSvgAttrs = `x="14" y="14" width="20" height="20"`;
      
      const origFill = inlinedSvgInfo.svgTagFill;
      const origStroke = inlinedSvgInfo.svgTagStroke;
      const isStrokeBased = inlinedSvgInfo.isStrokeBased || 
        (origFill && origFill.toLowerCase() === 'none') || 
        (origStroke && origStroke.toLowerCase() !== 'none');
      
      if (isStrokeBased) {
        strokeAttr = `stroke="${fgFill}"`;
        fillAttr = (origFill && origFill.toLowerCase() !== 'none') ? `fill="${fgFill}"` : 'fill="none"';
      } else {
        fillAttr = (origFill && origFill.toLowerCase() === 'none') ? 'fill="none"' : `fill="${fgFill}"`;
        strokeAttr = (origStroke && origStroke.toLowerCase() !== 'none') ? `stroke="${fgFill}"` : 'stroke="none"';
      }
    } else {
      const origFill = inlinedSvgInfo.svgTagFill;
      const origStroke = inlinedSvgInfo.svgTagStroke;
      
      if (origStroke) {
        strokeAttr = `stroke="${origStroke}"`;
      }
      if (origFill) {
        fillAttr = `fill="${origFill}"`;
      }
    }

    let innerHTML = inlinedSvgInfo.innerHTML;

    if (inlinedSvgInfo.isRawIcon) {
      innerHTML = innerHTML.replace(/<path[^>]*d\s*=\s*["']\s*M\s*0\s+0h\d+v\d+H0z\s*["'][^>]*\/?>/gi, '');
      innerHTML = innerHTML.replace(/<rect[^>]*fill\s*=\s*["']none["'][^>]*stroke\s*=\s*["']none["'][^>]*\/?>/gi, '');
    }

    if (!inlinedSvgInfo.isRawIcon && preset !== 'preset1') {
      try {
        if (typeof DOMParser !== 'undefined') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(`<svg>${innerHTML}</svg>`, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          const outerCircles = svg.querySelectorAll('rect[width="52"], rect[rx="26"], rect[fill-opacity], circle[r="26"]');
          if (outerCircles.length > 0) {
             outerCircles.forEach(el => el.remove());
             innerHTML = svg.innerHTML;
          }
        }
      } catch (e) {
        console.error("Failed to remove static outer circle:", e);
      }
    }

    const [minX, minY, vbW, vbH] = (inlinedSvgInfo.viewBox || '0 0 52 52').trim().split(/[\s,]+/).map(parseFloat);
    const targetW = inlinedSvgInfo.isRawIcon ? 20 : 40;
    const targetH = inlinedSvgInfo.isRawIcon ? 20 : 40;
    const targetX = inlinedSvgInfo.isRawIcon ? 14 : 4;
    const targetY = inlinedSvgInfo.isRawIcon ? 14 : 4;
    const s = Math.min(targetW / (vbW || 1), targetH / (vbH || 1));
    const tx = targetX - (minX || 0) * s;
    const ty = targetY - (minY || 0) * s;

    return `
      ${backgroundHTML}
      ${extraBg}
      <g transform="translate(${tx.toFixed(4)}, ${ty.toFixed(4)}) scale(${s.toFixed(6)})" ${fillAttr} ${strokeAttr}${extraSvgAttrs}>
        ${innerHTML}
      </g>
    `;
  } else {
    return `
      ${backgroundHTML}
      <image href="${src}" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet" pointer-events="none" />
    `;
  }
};

export const generateButtonSVG = (label, bgCol, textCol, hasIcon, btnIconCol = textCol, btnIconPlacement = 'Front', w = 80, h = 32, rx = 4, fontSize = 14, iconSrc = null) => {
  const bgInfo = generateSvgGradient(bgCol, 'btnBg');
  let html = bgInfo.defsString + `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${bgInfo.fillValue}" />`;
  const textY = h / 2 + (fontSize / 3);
  
  if (hasIcon) {
    const textWidth = label.length * (fontSize * 0.55);
    const contentWidth = 15 + 5 + textWidth; // icon 15px, gap 5px
    const startX = (w - contentWidth) / 2;
    
    let textX, iconTranslateX;
    if (btnIconPlacement === 'Front') {
      iconTranslateX = startX - 20;
      textX = startX + 20 + (textWidth / 2);
    } else {
      textX = startX + (textWidth / 2);
      iconTranslateX = startX + textWidth + 5 - 20;
    }

    if (iconSrc) {
      html += `<image href="${iconSrc}" x="${iconTranslateX + 20}" y="${(h - 14) / 2}" width="14" height="14" preserveAspectRatio="xMidYMid meet" />`;
    } else {
      html += `<g transform="translate(${iconTranslateX}, 0)">`;
      html += `<path d="M20 16 L25 21 L35 11" fill="none" stroke="${btnIconCol}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
      html += `</g>`;
    }
    html += `<text x="${textX}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  } else {
    html += `<text x="${w / 2}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  }
  return html;
};
