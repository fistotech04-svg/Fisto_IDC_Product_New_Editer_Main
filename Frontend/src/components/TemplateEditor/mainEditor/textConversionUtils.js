/**
 * Utility to convert raw SVG <text> elements to responsive, multi-line <foreignObject> elements
 * with computed CSS styles, font-families, line-heights, letter-spacing, and text alignments.
 */
export const convertTextToForeignObject = (el) => {
    if (!el || el.tagName.toLowerCase() !== 'text') return null;

    const bbox = el.getBBox();
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.id = el.id;

    // Copy all attributes except positional/size/clip ones (we'll set those from bbox, and clip-path causes issues on resize)
    Array.from(el.attributes).forEach(attr => {
      if (!['x', 'y', 'width', 'height', 'clip-path'].includes(attr.name)) {
        fo.setAttribute(attr.name, attr.value);
      }
    });

    fo.setAttribute('data-auto-wrap', 'true');
    fo.setAttribute('data-type', 'text');
    fo.setAttribute('x', bbox.x);
    fo.setAttribute('y', bbox.y);
    fo.setAttribute('width', Math.max(bbox.width, 10) + 0.1); // 2px micro-buffer to prevent Chrome zoom wrap bugs without altering layout
    fo.setAttribute('height', Math.max(bbox.height, 10));
    fo.setAttribute('overflow', 'visible');
    // Preserve transform if any
    const transform = el.getAttribute('transform');
    if (transform) fo.setAttribute('transform', transform);

    const div = document.createElement('div');
    const isScrollable = el.getAttribute('data-scrollable') === 'true';
    div.style.width = '100%';
    div.style.minHeight = '100%';
    if (isScrollable) {
      div.style.overflowY = 'auto';
      div.style.overflowX = 'hidden';
    }
    div.style.color = el.getAttribute('fill') || '#000000';
    div.style.fontFamily = el.getAttribute('font-family') || 'Inter, sans-serif';
    div.style.fontSize = (el.getAttribute('font-size') || '10') + 'px';
    div.style.fontWeight = el.style.fontWeight || el.getAttribute('font-weight') || 'normal';
    div.style.fontStyle = el.style.fontStyle || el.getAttribute('font-style') || 'normal';
    div.style.textDecoration = el.style.textDecoration || el.getAttribute('text-decoration') || 'none';
    const textAnchor = el.style.textAlign || el.getAttribute('text-anchor') || 'start';
    div.style.textAlign = textAnchor === 'middle' ? 'center' : (textAnchor === 'end' ? 'right' : 'left');
    div.style.lineHeight = el.getAttribute('data-line-height') || '1';
    div.style.letterSpacing = el.style.letterSpacing || el.getAttribute('letter-spacing') || '';
    div.style.wordSpacing = el.style.wordSpacing || el.getAttribute('word-spacing') || '';
    div.style.wordBreak = 'normal';
    div.style.overflowWrap = 'anywhere';
    const sizingMode = el.getAttribute('data-sizing-mode') || 'auto-height';
    // Use pre-wrap to allow paragraphs to reflow correctly (unless auto-width)
    div.style.whiteSpace = sizingMode === 'auto-width' ? 'nowrap' : 'pre-wrap';
    div.style.padding = '0px'; // Push down 1.5px and right 1px to match SVG baseline
    div.style.margin = '0';
    div.style.boxSizing = 'border-box';
    div.style.outline = 'none';
    div.style.background = 'transparent';
    div.style.userSelect = 'none';
    div.style.pointerEvents = 'none';

    if (!isScrollable) {
      if (sizingMode === 'fixed') {
        div.style.display = 'block';
      } else {
        // Vertically center the text to match SVG bbox placement and prevent upward shift
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.justifyContent = 'center';
      }
    }

    // Smart tspan-to-lines conversion: group tspans by Y coordinate change
    const tspans = Array.from(el.querySelectorAll('tspan'));
    if (tspans.length > 0) {
      let linesData = [];
      let currentLineTspans = [];
      let lastY = null;
      let lineHeights = [];

      const fontSizeStr = el.getAttribute('font-size') || el.style.fontSize;
      const fontSize = parseFloat(fontSizeStr) || 10;

      tspans.forEach((t, i) => {
        const y = t.getAttribute('y');
        const dy = t.getAttribute('dy');
        const isNewLine = i > 0 && (dy || (y !== null && lastY !== null && Math.abs(parseFloat(y) - parseFloat(lastY)) > 2));

        if (isNewLine) {
          let deltaY = null;
          if (dy) {
            if (dy.endsWith('em')) deltaY = parseFloat(dy) * fontSize;
            else deltaY = parseFloat(dy);
          } else if (y !== null && lastY !== null) {
            deltaY = Math.abs(parseFloat(y) - parseFloat(lastY));
          }
          if (deltaY !== null && !isNaN(deltaY) && deltaY > 0) {
            // Ignore massive jumps (e.g. paragraph gaps) so they don't inflate the average line-height
            if (deltaY < fontSize * 3) {
              lineHeights.push(deltaY);
            }
          }
        }

        if (isNewLine) {
          linesData.push(currentLineTspans);
          currentLineTspans = [];
        }
        currentLineTspans.push(t);
        if (y !== null) lastY = y;
      });
      if (currentLineTspans.length > 0) {
        linesData.push(currentLineTspans);
      }

      // Apply dynamic line height if multiple tspans exist and data-line-height is absent
      if (!el.hasAttribute('data-line-height') && lineHeights.length > 0) {
        // Use the minimum deltaY instead of the average to prevent paragraph breaks from inflating the line-height
        const minPx = Math.min(...lineHeights);
        div.style.lineHeight = (minPx / fontSize).toFixed(2);
      }

      let linesBounds = linesData.map(lineTspans => {
        let minX = Infinity;
        let maxX = -Infinity;
        let textContent = '';
        lineTspans.forEach(t => {
          try {
            const x = parseFloat(t.getAttribute('x'));
            if (!isNaN(x)) {
              const w = t.getComputedTextLength ? t.getComputedTextLength() : t.textContent.length * (fontSize * 0.5);
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x + w);
            } else {
              const b = t.getBBox();
              minX = Math.min(minX, b.x);
              maxX = Math.max(maxX, b.x + b.width);
            }
          } catch { /* ignored */ }
          textContent += t.textContent;
        });
        return { minX, maxX, textContent };
      });

      const validBounds = linesBounds.filter(l => l.minX !== Infinity && l.maxX !== -Infinity);
      const globalMinX = validBounds.length > 0 ? Math.min(...validBounds.map(l => l.minX)) : 0;
      const globalMaxX = validBounds.length > 0 ? Math.max(...validBounds.map(l => l.maxX)) : 0;

      // Chrome's getBBox() often incorrectly includes trailing whitespace or newlines, inflating the width.
      // We override it here with the exact calculated mathematical bounds of the ink to ensure perfect wrapping.
      if (validBounds.length > 0) {
        const trueWidth = globalMaxX - globalMinX;
        fo.setAttribute('x', globalMinX);
        fo.setAttribute('width', Math.max(trueWidth, 10) + 0.5);
      }

      let detectedAlign = 'left';
      if (validBounds.length > 1) {
        let leftMatchCount = 0;
        let rightMatchCount = 0;
        let centerMatchCount = 0;
        const tolerance = fontSize * 0.8;

        validBounds.forEach(l => {
          if (Math.abs(l.minX - globalMinX) < tolerance) leftMatchCount++;
          if (Math.abs(globalMaxX - l.maxX) < tolerance) rightMatchCount++;
          const mid = (l.minX + l.maxX) / 2;
          const gMid = (globalMinX + globalMaxX) / 2;
          if (Math.abs(mid - gMid) < tolerance) centerMatchCount++;
        });

        const thresh = Math.max(1, validBounds.length * 0.8);

        if (centerMatchCount >= thresh) {
          detectedAlign = 'center';
        } else if (rightMatchCount >= thresh && leftMatchCount < thresh) {
          detectedAlign = 'right';
        } else if (leftMatchCount >= thresh && validBounds.length > 1) {
          // Strict justify detection: All "full lines" must perfectly hit the right edge
          let fullLineCount = 0;
          let justifiedFullLineCount = 0;
          const strictTolerance = 3; // 3 pixels max deviation for a true justified edge

          validBounds.forEach((l, idx) => {
            const isLastInParagraph = (idx === validBounds.length - 1) || (l.maxX < globalMaxX - (fontSize * 2.0));
            if (!isLastInParagraph) {
              fullLineCount++;
              if (Math.abs(globalMaxX - l.maxX) <= strictTolerance) {
                justifiedFullLineCount++;
              }
            }
          });

          if (fullLineCount > 0 && justifiedFullLineCount >= fullLineCount * 0.9) {
            detectedAlign = 'justify';
          } else {
            detectedAlign = 'left';
          }
        } else {
          detectedAlign = 'left';
        }
      }

      // Paragraph reconstruction
      let htmlContent = '';
      for (let i = 0; i < linesBounds.length; i++) {
        const l = linesBounds[i];
        let text = l.textContent.replace(/[\r\n]+/g, ' '); // Strip literal newlines because pre-wrap will render them, causing double newlines
        let isHardBreak = true;

        if (i < linesBounds.length - 1 && l.minX !== Infinity) {
          const lineWidth = l.maxX - l.minX;
          const globalWidth = globalMaxX - globalMinX;
          if (lineWidth > globalWidth - (fontSize * 2.5)) {
            isHardBreak = false;
          }
        }

        htmlContent += text;
        if (i < linesBounds.length - 1) {
          if (isHardBreak) {
            htmlContent = htmlContent.replace(/\s+$/, '') + '<br/>';
          } else {
            if (!text.endsWith(' ') && !text.endsWith('-')) {
              htmlContent += ' ';
            }
          }
        }
      }
      div.innerHTML = htmlContent;

      const textAnchor = el.getAttribute('text-anchor');
      const textAlignStyle = el.style.textAlign;

      // Use visual detection as primary truth for paragraphs, since exporters 
      // often just use text-anchor="start" and manually position lines.
      let finalAlign = detectedAlign;

      if (textAlignStyle && ['left', 'center', 'right', 'justify'].includes(textAlignStyle)) {
        finalAlign = textAlignStyle;
      } else if (textAnchor === 'middle') {
        finalAlign = 'center';
      } else if (textAnchor === 'end') {
        finalAlign = 'right';
      }

      div.style.textAlign = finalAlign;

    } else {
      div.textContent = el.textContent || '';
      const textAnchor = el.style.textAlign || el.getAttribute('text-anchor') || 'start';
      const finalAlign = textAnchor === 'middle' ? 'center' : (textAnchor === 'end' ? 'right' : 'left');
      div.style.textAlign = finalAlign;
    }

    fo.appendChild(div);
    return fo;
  };

  // ── Helper: set single selection and clear multi-selection ───────────────────
