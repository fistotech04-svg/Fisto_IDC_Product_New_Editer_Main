
export const processBookAppearanceSettings = (settings) => {
  if (!settings) return {};

  const hexToRgba = (hex, opacity = 100) => {
    if (!hex) return 'rgba(0,0,0,0)';
    let c = hex.substring(1).split('');
    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    const val = parseInt(c.join(''), 16);
    return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity / 100})`;
  };

  const shadow = settings.dropShadow || {};
  const shadowColor = hexToRgba(shadow.color || '#000000', shadow.opacity);
  const shadowStyle = shadow.active
    ? `${shadow.xAxis || 0}px ${shadow.yAxis || 0}px ${shadow.blur || 0}px ${shadow.spread || 0}px ${shadowColor}`
    : 'none';

  const cornerMap = { 'Sharp': '0px', 'Soft': '8px', 'Round': '20px' };
  const cornerRadius = cornerMap[settings.corner] || '0px';

  const speedMap = { 'Slow': 1500, 'Medium': 1000, 'Fast': 600 };
  const flipTime = speedMap[settings.flipSpeed] || 1000;

  // Basic texture style logic
  const textureStyle = {
    opacity: (settings.opacity || 100) / 100,
    mixBlendMode: 'multiply',
    pointerEvents: 'none'
  };
  
  if (settings.warmth > 0) {
      textureStyle.backgroundColor = `rgba(244, 230, 180, ${settings.warmth / 200})`;
  }

  return {
    shadowStyle,
    cornerRadius,
    pageOpacity: (settings.opacity || 100) / 100,
    textureStyle,
    flipTime,
    hardCover: !!settings.hardCover,
    shadowActive: !!shadow.active
  };
};

export const getShadowWidth = (currentIndex, totalPages, singlePageWidth) => {
  // Cover (Page 0)
  if (currentIndex === 0) return singlePageWidth;
  
  // Last Page
  if (totalPages > 0 && currentIndex >= totalPages - 1) {
      return singlePageWidth;
  }
  
  // Inner Spreads
  return singlePageWidth * 2;
};

export const getShadowOffset = (currentIndex, totalPages) => {
  // Front Cover (Right side)
  if (currentIndex === 0) return '75%';

  // Last Page
  if (totalPages > 0 && currentIndex >= totalPages - 1) {
      // If index is Even, it's on Right. If Odd, on Left.
      return (currentIndex % 2 === 0) ? '75%' : '25%';
  }

  // Inner Spreads (Centered)
  return '50%';
};
