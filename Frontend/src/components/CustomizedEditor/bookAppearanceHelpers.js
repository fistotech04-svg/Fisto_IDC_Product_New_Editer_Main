
export const processBookAppearanceSettings = (settings) => {
  if (!settings) return {};

  const hexToRgba = (hex, opacity = 100) => {
    if (!hex) return '#6B6868';
    let c = hex.substring(1).split('');
    if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    const val = parseInt(c.join(''), 16);
    return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity / 100})`;
  };

  const shadow = settings.dropShadow || {};
  const shadowColor = hexToRgba(shadow.color || '#6B6868', shadow.opacity);
  const shadowStyle = shadow.active
    ? `${shadow.xAxis || 0}px ${shadow.yAxis || 0}px ${shadow.blur || 0}px ${shadow.spread || 0}px ${shadowColor}`
    : 'none';

  const cornerMap = { 'Sharp': '0px', 'Soft': '5px', 'Round': '10px' };
  const cornerRadius = cornerMap[settings.corner] || '0px';

  // Base Flip Time Maps
  const speedMap = { 'Slow': 1700, 'Medium': 1200, 'Fast': 800 };
  let flipTime = speedMap[settings.flipSpeed] || 1000;

  // Add flip style alterations to flip time / stiffness where possible
  const styleMapTimeModifiers = {
    'Fast Flip': 0.7,
    'Smooth Flip': 1.2,
    'Slide Pages': 1.0, 
    '3D Flip': 1.3,
    'Page Curl': 1.0,
    'Classic Flip': 1.0
  };
  
  if (settings.flipStyle && styleMapTimeModifiers[settings.flipStyle]) {
      flipTime = Math.max(300, flipTime * styleMapTimeModifiers[settings.flipStyle]);
  }

  // Paper Textures mapping using SVG Data URIs for distinct textural feels
  const textureImageMap = {
    'Soft Matte Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Premium Art Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'1.5\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Soft Linen Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Canvas Texture': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'canvas\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8 0.1\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'matrix\' values=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23canvas)\'/%3E%3C/svg%3E")',
    'Kraft Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.08\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'matrix\' values=\'0.6 0 0 0 0 0 0.4 0 0 0 0 0 0.2 0 0 0 0 0 0.5 0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Felt Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.4\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'matrix\' values=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Watermarked Paper': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Cpattern id=\'mark\' width=\'200\' height=\'200\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'40\' fill=\'none\' stroke=\'rgba(0,0,0,0.05)\' stroke-width=\'1\' /%3E%3C/pattern%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23mark)\' /%3E%3C/svg%3E")',
    'Premium Vellum': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeGaussianBlur stdDeviation=\'0.5\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
    'Plain White': 'none'
  };

  const scaleValue = (100 + (settings.textureScale || 0)) + "%";
  const grainOpacity = Math.max(0, (Math.abs(settings.grainIntensity || 0) / 100) * 0.8);
  const baseOpacity = typeof settings.opacity !== 'undefined' ? settings.opacity / 100 : 1;

  // Basic texture style logic
  const textureStyle = {
    opacity: baseOpacity * (settings.texture && settings.texture !== 'Plain White' ? grainOpacity : 1),
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    backgroundImage: textureImageMap[settings.texture] || 'none',
    backgroundSize: scaleValue
  };

  const warmth = settings.warmth || 0;
  if (warmth !== 0) {
      if (warmth > 0) {
          // Warming (Yellowish)
          const warmthAmount = warmth / 250; 
          textureStyle.backgroundColor = `rgba(244, 230, 180, ${warmthAmount})`;
      } else {
          // Cooling (Bluish)
          const coolAmount = Math.abs(warmth) / 250;
          textureStyle.backgroundColor = `rgba(200, 230, 255, ${coolAmount})`;
      }
      
      if(!textureStyle.backgroundImage || textureStyle.backgroundImage === 'none') {
        textureStyle.opacity = baseOpacity; 
      }
  }

  return {
    shadowStyle,
    cornerRadius,
    pageOpacity: typeof settings.opacity !== 'undefined' ? settings.opacity / 100 : 1, // Modified to carry layout visual opacity rather than strictly 1
    textureStyle,
    flipTime,
    flipStyle: settings.flipStyle || 'Classic Flip',
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
