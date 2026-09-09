import opentype from 'opentype.js';

// Cache for loaded opentype font instances
const fontCache = new Map();

/**
 * Resolves local font URL based on fontFamily, weight, and style.
 */
export const getFontUrl = (fontFamily, fontWeight = 'normal', fontStyle = 'normal') => {
  const normFamily = (fontFamily || '').replace(/['"]/g, '').trim().toLowerCase();
  const isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600;
  const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

  if (normFamily.includes('poppins')) {
    if (isBold && isItalic) return '/lib/Fonts/Poppins/Poppins-BoldItalic.ttf';
    if (isBold) return '/lib/Fonts/Poppins/Poppins-Bold.ttf';
    if (isItalic) return '/lib/Fonts/Poppins/Poppins-Italic.ttf';
    return '/lib/Fonts/Poppins/Poppins-Regular.ttf';
  }
  if (normFamily.includes('open sans') || normFamily.includes('opensans')) {
    return '/lib/Fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf';
  }
  if (normFamily.includes('lato')) return '/lib/Fonts/Lato/Lato-Regular.ttf';
  if (normFamily.includes('oswald')) return '/lib/Fonts/Oswald/Oswald-VariableFont_wght.ttf';
  if (normFamily.includes('merriweather')) return '/lib/Fonts/Merriweather/Merriweather-VariableFont_opsz,wdth,wght.ttf';
  if (normFamily.includes('allura')) return '/lib/Fonts/Allura/Allura-Regular.ttf';
  if (normFamily.includes('parisienne')) return '/lib/Fonts/Parisienne/Parisienne-Regular.ttf';
  if (normFamily.includes('satisfy')) return '/lib/Fonts/Satisfy/Satisfy-Regular.ttf';
  if (normFamily.includes('public sans') || normFamily.includes('publicsans')) {
    if (isItalic) return '/lib/Fonts/Public_Sans/PublicSans-Italic-VariableFont_wght.ttf';
    return '/lib/Fonts/Public_Sans/PublicSans-VariableFont_wght.ttf';
  }
  if (normFamily.includes('lora')) {
    if (isItalic) return '/lib/Fonts/Lora/Lora-Italic-VariableFont_wght.ttf';
    return '/lib/Fonts/Lora/Lora-VariableFont_wght.ttf';
  }
  if (normFamily.includes('cabin')) {
    if (isItalic) return '/lib/Fonts/Cabin/Cabin-Italic-VariableFont_wdth,wght.ttf';
    return '/lib/Fonts/Cabin/Cabin-VariableFont_wdth,wght.ttf';
  }
  if (normFamily.includes('designer_signature') || normFamily.includes('designer signature')) {
    return '/lib/Fonts/designer_signature/Designer_Signature.otf';
  }
  // Default project font fallback
  return '/lib/Fonts/Poppins/Poppins-Regular.ttf';
};

/**
 * Loads an opentype font with caching.
 */
export const loadOpentypeFont = async (fontUrl) => {
  if (!fontUrl) return null;
  if (fontCache.has(fontUrl)) return fontCache.get(fontUrl);

  try {
    const fullUrl = fontUrl.startsWith('http') ? fontUrl : `${window.location.origin}${fontUrl}`;
    const font = await new Promise((resolve, reject) => {
      opentype.load(fullUrl, (err, f) => {
        if (err) reject(err);
        else resolve(f);
      });
    });
    fontCache.set(fontUrl, font);
    return font;
  } catch (e) {
    console.warn(`[vectorTextConverter] Could not load font from ${fontUrl}:`, e.message);
    return null;
  }
};

/**
 * Converts text into a pure SVG <path> vector bezier outline.
 */
export const textToVectorPath = (font, text, x, y, fontSize, options = {}) => {
  if (!font || !text) return '';
  const path = font.getPath(text, x, y, fontSize, options);
  return path.toPathData(2);
};

/**
 * Pre-processes an SVG string:
 * 1. Finds all <foreignObject> elements containing text.
 * 2. Converts them to pure vector <path> bezier curves (using opentype.js if font matches)
 *    or clean native SVG <text> elements (so Inkscape --export-text-to-path can outline them).
 * 3. Removes editor-only attributes and elements.
 *
 * @param {string} svgString
 * @returns {Promise<string>}
 */
export const convertSvgTextToOutlines = async (svgString) => {
  if (!svgString || typeof svgString !== 'string') return svgString;

  // Quick check: if SVG doesn't have foreignObject, return as-is
  if (!svgString.includes('<foreignObject') && !svgString.includes('<foreignobject')) {
    return svgString;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  if (svgEl.tagName.toLowerCase() !== 'svg') {
    return svgString;
  }

  const foreignObjects = Array.from(svgEl.querySelectorAll('foreignObject, foreignobject'));
  if (foreignObjects.length === 0) {
    return svgString;
  }

  // Pre-load necessary fonts for all foreignObjects
  const fontLoadPromises = foreignObjects.map(async (fo) => {
    const innerDiv = fo.querySelector('div') || fo.firstElementChild;
    const fontFamily = innerDiv?.style?.fontFamily || fo.getAttribute('font-family') || 'Poppins';
    const fontWeight = innerDiv?.style?.fontWeight || fo.getAttribute('font-weight') || 'normal';
    const fontStyle = innerDiv?.style?.fontStyle || fo.getAttribute('font-style') || 'normal';
    const fontUrl = getFontUrl(fontFamily, fontWeight, fontStyle);
    if (fontUrl) {
      await loadOpentypeFont(fontUrl);
    }
  });

  await Promise.all(fontLoadPromises);

  // Process each foreignObject
  for (const fo of foreignObjects) {
    const x = parseFloat(fo.getAttribute('x') || '0');
    const y = parseFloat(fo.getAttribute('y') || '0');
    const w = parseFloat(fo.getAttribute('width') || '100');
    const h = parseFloat(fo.getAttribute('height') || '50');
    const transform = fo.getAttribute('transform') || '';
    const foId = fo.getAttribute('id') || '';

    const innerDiv = fo.querySelector('div') || fo.firstElementChild;
    if (!innerDiv) continue;

    // Extract text and styles
    const fontFamily = innerDiv.style.fontFamily || fo.getAttribute('font-family') || 'Poppins';
    const fontSize = parseFloat(innerDiv.style.fontSize || fo.getAttribute('font-size') || '16');
    const fontWeight = innerDiv.style.fontWeight || fo.getAttribute('font-weight') || 'normal';
    const fontStyle = innerDiv.style.fontStyle || fo.getAttribute('font-style') || 'normal';
    const fill = innerDiv.style.color || fo.getAttribute('fill') || '#000000';
    const rawTextAlign = innerDiv.style.textAlign || fo.getAttribute('text-anchor') || 'left';
    const textAlign = rawTextAlign === 'middle' ? 'center' : (rawTextAlign === 'end' ? 'right' : rawTextAlign);
    const lineHeightRatio = parseFloat(innerDiv.style.lineHeight || fo.getAttribute('data-line-height') || '1.2') || 1.2;

    // Extract text lines
    // Replace <br> tags with newline markers
    const clone = innerDiv.cloneNode(true);
    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    clone.querySelectorAll('p, div').forEach((p) => {
      p.prepend(doc.createTextNode('\n'));
    });
    const rawText = clone.textContent || '';
    const rawLines = rawText.split('\n').map((l) => l.replace(/\r/g, ''));
    
    // Filter out leading/trailing empty lines while keeping intentional inner blank lines
    let firstNonEmpty = 0;
    while (firstNonEmpty < rawLines.length && rawLines[firstNonEmpty].trim() === '') firstNonEmpty++;
    let lastNonEmpty = rawLines.length - 1;
    while (lastNonEmpty >= 0 && rawLines[lastNonEmpty].trim() === '') lastNonEmpty--;

    const lines = (firstNonEmpty <= lastNonEmpty) ? rawLines.slice(firstNonEmpty, lastNonEmpty + 1) : [''];

    // Check if we have an opentype font loaded
    const fontUrl = getFontUrl(fontFamily, fontWeight, fontStyle);
    const font = fontCache.get(fontUrl);

    if (font) {
      // ── Method A: True Vector Outlines via opentype.js ───────────────────
      // Converts all text glyphs into pure <path d="..." fill="..." /> bezier curves.
      // Zero font dependency in Adobe Illustrator!
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (foId) g.setAttribute('id', foId);
      if (transform) g.setAttribute('transform', transform);
      g.setAttribute('data-type', 'vector-text');

      const ascenderRatio = (font.ascender && font.unitsPerEm) ? (font.ascender / font.unitsPerEm) : 0.82;
      const lineStep = fontSize * lineHeightRatio;

      let combinedPathData = '';

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        if (!lineText || !lineText.trim()) continue;

        const baselineY = y + (ascenderRatio * fontSize) + (i * lineStep);
        let lineX = x;

        if (textAlign === 'center') {
          const textW = font.getAdvanceWidth(lineText, fontSize);
          lineX = x + Math.max(0, (w - textW) / 2);
        } else if (textAlign === 'right') {
          const textW = font.getAdvanceWidth(lineText, fontSize);
          lineX = x + Math.max(0, w - textW);
        }

        const pathData = font.getPath(lineText, lineX, baselineY, fontSize).toPathData(2);
        if (pathData) {
          combinedPathData += (combinedPathData ? ' ' : '') + pathData;
        }
      }

      if (combinedPathData) {
        const pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', combinedPathData);
        pathEl.setAttribute('fill', fill);
        g.appendChild(pathEl);
        fo.replaceWith(g);
      } else {
        fo.remove();
      }
    } else {
      // ── Method B: Native SVG <text> fallback for Inkscape --export-text-to-path ──
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (foId) g.setAttribute('id', foId);
      if (transform) g.setAttribute('transform', transform);

      const textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      const textAnchor = textAlign === 'center' ? 'middle' : (textAlign === 'right' ? 'end' : 'start');
      const anchorX = textAlign === 'center' ? (x + w / 2) : (textAlign === 'right' ? (x + w) : x);
      const lineStep = fontSize * lineHeightRatio;
      const baselineOffset = fontSize * 0.85;

      textEl.setAttribute('x', anchorX.toFixed(2));
      textEl.setAttribute('y', (y + baselineOffset).toFixed(2));
      textEl.setAttribute('font-family', fontFamily);
      textEl.setAttribute('font-size', fontSize.toString());
      textEl.setAttribute('font-weight', fontWeight);
      textEl.setAttribute('font-style', fontStyle);
      textEl.setAttribute('fill', fill);
      textEl.setAttribute('text-anchor', textAnchor);

      lines.forEach((lineText, idx) => {
        const tspan = doc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', anchorX.toFixed(2));
        tspan.setAttribute('y', (y + baselineOffset + idx * lineStep).toFixed(2));
        tspan.textContent = lineText;
        textEl.appendChild(tspan);
      });

      g.appendChild(textEl);
      fo.replaceWith(g);
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};
