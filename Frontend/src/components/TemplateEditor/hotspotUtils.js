export const generateCompositeHotspotSvg = async (bgSrc, iconSrc, bgColor, iconColor) => {
  try {
    const [bgRes, iconRes] = await Promise.all([
      fetch(bgSrc).then(r => r.text()),
      fetch(iconSrc).then(r => r.text())
    ]);

    const parser = new DOMParser();
    const bgDoc = parser.parseFromString(bgRes, 'image/svg+xml');
    const iconDoc = parser.parseFromString(iconRes, 'image/svg+xml');

    // --- 1. Process Background SVG ---
    // Remove the inner play button path
    const paths = bgDoc.querySelectorAll('path');
    paths.forEach(p => {
       const fill = p.getAttribute('fill');
       if (fill && (fill.toLowerCase() === 'white' || fill.toLowerCase() === '#ffffff' || fill.toLowerCase() === '#3296fc')) {
           p.remove();
       }
    });

    // Apply colors to background
    const bgElements = bgDoc.querySelectorAll('*');
    bgElements.forEach(el => {
       const fill = el.getAttribute('fill');
       if (fill && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(fill)) {
          el.setAttribute('fill', bgColor);
       }
       const stroke = el.getAttribute('stroke');
       if (stroke && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(stroke)) {
          el.setAttribute('stroke', bgColor);
       }
       const stopColor = el.getAttribute('stop-color');
       if (stopColor && /#2782FC|#359CFD|#257EFC|#0081FF|#3296FC|#3297FD|#0052C0/i.test(stopColor)) {
          el.setAttribute('stop-color', bgColor);
       }
       
       if (fill && /#FFFFFF|white/i.test(fill)) {
          el.setAttribute('fill', iconColor);
       }
       if (stroke && /#FFFFFF|white/i.test(stroke)) {
          el.setAttribute('stroke', iconColor);
       }
    });

    const bgSvgEl = bgDoc.querySelector('svg');
    if (bgSvgEl) {
       bgSvgEl.setAttribute('width', '100%');
       bgSvgEl.setAttribute('height', '100%');
       bgSvgEl.style.display = 'block';
    }

    // --- 2. Process Icon SVG ---
    // Apply iconColor to all elements in iconDoc
    const iconElements = iconDoc.querySelectorAll('*');
    iconElements.forEach(el => {
      const fill = el.getAttribute('fill');
      if (fill && fill.toLowerCase() !== 'none') el.setAttribute('fill', iconColor);
      
      const stroke = el.getAttribute('stroke');
      if (stroke && stroke.toLowerCase() !== 'none') el.setAttribute('stroke', iconColor);
    });

    // --- 3. Composite Them ---
    // Create a nested SVG to hold the icon, perfectly centered
    const nestedSvg = bgDoc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    nestedSvg.setAttribute('x', '32%');
    nestedSvg.setAttribute('y', '32%');
    nestedSvg.setAttribute('width', '36%');
    nestedSvg.setAttribute('height', '36%');
    
    // Copy the viewBox from the original icon to the nested SVG
    const iconSvgEl = iconDoc.querySelector('svg');
    if (iconSvgEl && iconSvgEl.getAttribute('viewBox')) {
      nestedSvg.setAttribute('viewBox', iconSvgEl.getAttribute('viewBox'));
    } else {
      nestedSvg.setAttribute('viewBox', '0 0 24 24');
    }

    // Append all children of the icon SVG into our nested SVG
    if (iconSvgEl) {
      Array.from(iconSvgEl.childNodes).forEach(node => {
        nestedSvg.appendChild(bgDoc.importNode(node, true));
      });
    }

    // Append nested SVG to background SVG
    if (bgSvgEl) {
      bgSvgEl.appendChild(nestedSvg);
    }

    return new XMLSerializer().serializeToString(bgDoc);
  } catch (error) {
    console.error('Failed to generate composite hotspot SVG', error);
    return null;
  }
};
