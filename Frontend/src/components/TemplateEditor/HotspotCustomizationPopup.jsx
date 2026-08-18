import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import ColorPicker, { parseGradient } from './ColorPicker';
import { presets as hotspotPresets } from './HotspotPresetPopup';

const ALL_ICON_ASSETS = import.meta.glob('../../assets/hotspot preset icon/**/*.svg', { as: 'url', eager: true });

const getCategoryKeywords = (actionId) => {
  const map = {
    'zoom': ['zoom'],
    'download': ['download'],
    'info': ['info']
  };
  return map[actionId] || [];
};

const getIconsForAction = (actionId) => {
  if (!actionId) return [];
  
  const folderMap = {
    'whatsapp': 'whatsapp',
    'open-link': 'open link',
    'video': 'video',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'x': 'x',
    'youtube': 'youtube',
    'popup': 'popup',
    'slideshow': 'slideshow',
    '3d-viewer': '3d viewer',
    'email': 'email',
    'call': 'call',
    'location': 'location',
    'navigate-to': 'navigation page'
  };

  const folder = folderMap[actionId];
  const matched = [];
  
  if (folder) {
    const prefix = `../../assets/hotspot preset icon/${folder}/`.toLowerCase();
    for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
      if (path.toLowerCase().startsWith(prefix)) {
        matched.push({ id: path, src: url });
      }
    }
  } else {
    const keywords = getCategoryKeywords(actionId);
    if (keywords.length > 0) {
      for (const [path, url] of Object.entries(ALL_ICON_ASSETS)) {
        const lowerPath = path.toLowerCase();
        if (keywords.some(kw => lowerPath.includes(kw))) {
          matched.push({ id: path, src: url });
        }
      }
    }
  }
  
  return matched;
};

const generateSvgGradient = (colorStr, idPrefix) => {
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

const PRESETS = [
  { id: 'preset1', type: 'solid-circle' },
  { id: 'preset2', type: 'dashed-circle' },
  { id: 'preset3', type: 'double-circle' },
  { id: 'preset4', type: 'dotted-circle' },
  { id: 'preset5', type: 'thick-circle' },
  { id: 'preset6', type: 'thin-circle' },
];

export const generateHotspotSVG = (preset, bgColor, iconColor, src, inlinedSvgInfo = null) => {
  const bgInfo = generateSvgGradient(bgColor, 'bg');
  const bgFill = bgInfo.fillValue;
  const fgInfo = generateSvgGradient(iconColor, 'fg');
  const fgFill = fgInfo.fillValue;
  let backgroundHTML = bgInfo.defsString + fgInfo.defsString;
  
  if (preset === 'preset1') {
    // No extra rings, just the rich icon itself
  } else if (preset === 'preset2') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="24" fill="${bgFill}" opacity="0.3">
        <animate attributeName="r" values="22; 28; 22" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5; 0.1; 0.5" dur="2s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset3') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="26" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="6 6">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="8s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset4') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="26" fill="none" stroke="${bgFill}" stroke-width="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="30" fill="none" stroke="${bgFill}" stroke-width="2" stroke-dasharray="18 16">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="6s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset5') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="26" fill="none" stroke="${bgFill}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0 8" opacity="0.8">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="10s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="24" r="31" fill="none" stroke="${bgFill}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0 6" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="15s" repeatCount="indefinite" />
      </circle>`;
  } else if (preset === 'preset6') {
    backgroundHTML += `
      <circle cx="24" cy="24" r="26" fill="none" stroke="${bgFill}" stroke-width="1" opacity="0.5"/>
      <circle cx="24" cy="24" r="30" fill="none" stroke="${bgFill}" stroke-width="1" opacity="0.3"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="4s" repeatCount="indefinite" />
        <circle cx="24" cy="5" r="2.5" fill="${bgFill}" />
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 24 24" to="0 24 24" dur="6s" repeatCount="indefinite" />
        <circle cx="24" cy="1" r="1.5" fill="${bgFill}" opacity="0.8"/>
      </g>`;
  }

  // Draw the original image or the recolored inline SVG
  if (inlinedSvgInfo) {
    let innerSvgAttrs = `x="0" y="0" width="48" height="48"`;
    let extraBg = '';
    let fillAttr = '';
    let strokeAttr = '';
    
    if (inlinedSvgInfo.isRawIcon) {
      extraBg = `<circle cx="24" cy="24" r="20" fill="${bgFill}" />`;
      innerSvgAttrs = `x="12" y="12" width="24" height="24"`;
      
      const origFill = inlinedSvgInfo.svgTagFill;
      const origStroke = inlinedSvgInfo.svgTagStroke;
      
      if (origStroke === 'none') {
        strokeAttr = 'stroke="none"';
      } else if (origStroke) {
        strokeAttr = `stroke="${fgFill}"`;
      }

      if (origFill === 'none') {
        fillAttr = 'fill="none"';
      } else if (origFill) {
        fillAttr = `fill="${fgFill}"`;
      }
      
      if (!origFill && !origStroke) {
        fillAttr = `fill="${fgFill}"`;
      }
    }

    return `
      ${backgroundHTML}
      ${extraBg}
      <svg ${innerSvgAttrs} viewBox="${inlinedSvgInfo.viewBox}" overflow="visible" ${fillAttr} ${strokeAttr}>
        ${inlinedSvgInfo.innerHTML}
      </svg>
    `;
  } else {
    return `
      ${backgroundHTML}
      <image href="${src}" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid meet" pointer-events="none" />
    `;
  }
};

export const generateButtonSVG = (label, bgCol, textCol, hasIcon, w = 80, h = 32, rx = 4, fontSize = 14) => {
  const bgInfo = generateSvgGradient(bgCol, 'btnBg');
  let html = bgInfo.defsString + `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${bgInfo.fillValue}" />`;
  const textY = h / 2 + (fontSize / 3);
  if (hasIcon) {
    const textWidth = label.length * (fontSize * 0.55);
    const contentWidth = 15 + 5 + textWidth; // icon 15px, gap 5px
    const startX = (w - contentWidth) / 2;
    const textX = startX + 20 + (textWidth / 2);

    html += `<g transform="translate(${startX - 20}, 0)">`;
    html += `<path d="M20 16 L25 21 L35 11" fill="none" stroke="${textCol}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
    html += `</g>`;
    html += `<text x="${textX}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  } else {
    html += `<text x="${w / 2}" y="${textY}" fill="${textCol}" font-size="${fontSize}" font-family="sans-serif" font-weight="bold" text-anchor="middle" data-type="text">${label}</text>`;
  }
  return html;
};

const HotspotCustomizationPopup = ({ isOpen, onClose, initialData, onSave }) => {
  const [customSrc, setCustomSrc] = useState(null);
  const [selectedIconStyle, setSelectedIconStyle] = useState(null);
  const [iconStyles, setIconStyles] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[2].id);
  const [iconColor, setIconColor] = useState('#FFFFFF');
  const [iconOpacity, setIconOpacity] = useState(100);
  const [bgColor, setBgColor] = useState('#359CFD');
  const [bgOpacity, setBgOpacity] = useState(100);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'icon' or 'bg'

  const [fetchedSvgDoc, setFetchedSvgDoc] = useState(null);

  // Button Customization States
  const isButtonMode = initialData?.preset === 'interactive-button';
  const [btnLabel, setBtnLabel] = useState('Button');
  const [btnHasIcon, setBtnHasIcon] = useState(false);
  const [btnWidth, setBtnWidth] = useState(80);
  const [btnHeight, setBtnHeight] = useState(32);
  const [btnRx, setBtnRx] = useState(4);
  const [btnFontSize, setBtnFontSize] = useState(14);
  
  const [bareDefaultSrc, setBareDefaultSrc] = useState(null);

  useEffect(() => {
    if (initialData?.src) {
      fetch(initialData.src)
        .then(res => res.text())
        .then(text => {
          if (text.includes('<svg')) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(text, 'image/svg+xml');
            const svg = svgDoc.querySelector('svg');
            if (svg) {
              const bgElements = Array.from(svg.querySelectorAll('rect, circle, path, ellipse, polygon')).filter(el => {
                const fill = el.getAttribute('fill');
                if (!fill) return false;
                const f = fill.toLowerCase();
                if (f.startsWith('url(')) return true;
                return f !== 'none' && f !== 'white' && f !== '#ffffff' && f !== '#fff';
              });
              
              bgElements.forEach(el => el.remove());

              const fgElements = Array.from(svg.querySelectorAll('rect, circle, path, ellipse, polygon')).filter(el => {
                const fill = el.getAttribute('fill');
                if (!fill) return false;
                const f = fill.toLowerCase();
                return f === 'white' || f === '#ffffff' || f === '#fff';
              });
              
              fgElements.forEach(el => el.setAttribute('fill', '#000000'));
              
              const svgString = new XMLSerializer().serializeToString(svg);
              const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
              setBareDefaultSrc(dataUrl);
            }
          }
        })
        .catch(() => {});
    }
  }, [initialData?.src]);
  
  const getCurrentIconSrc = () => {
    if (selectedIconStyle === 'custom') return customSrc;
    const style = iconStyles.find(s => s.id === selectedIconStyle);
    return style ? style.src : (iconStyles[0] ? iconStyles[0].src : null);
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    const src = getCurrentIconSrc();
    if (src) {
      fetch(src)
        .then(res => res.text())
        .then(text => {
          if (text.includes('<svg')) {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(text, 'image/svg+xml');
            setFetchedSvgDoc(svgDoc);

            // Extract dominant color from the SVG to update the color palette
            if (!isInitialMount.current || !initialData?.bgColor || initialData.bgColor === '#359CFD') {
              const bgElements = Array.from(svgDoc.querySelectorAll('rect, circle, path, ellipse, polygon')).filter(el => {
                const f = el.getAttribute('fill');
                if (!f) return false;
                const fl = f.toLowerCase();
                return fl !== 'none' && fl !== 'white' && fl !== '#ffffff' && fl !== '#fff';
              });

              if (bgElements.length > 0) {
                let colorToSet = bgElements[0].getAttribute('fill');
                
                // If it's a gradient, fetch the first stop-color
                if (colorToSet.startsWith('url(')) {
                  const match = colorToSet.match(/url\(#([^)]+)\)/);
                  if (match && match[1]) {
                    const gradientEl = svgDoc.getElementById(match[1]);
                    if (gradientEl) {
                      const stop = gradientEl.querySelector('stop');
                      if (stop) {
                        const stopColor = stop.getAttribute('stop-color');
                        if (stopColor) colorToSet = stopColor;
                      }
                    }
                  }
                }
                
                // If it's a valid hex color, update the Bg Color palette
                if (colorToSet && colorToSet.startsWith('#')) {
                  // Only update if it's a valid hex (length 4, 7, or 9)
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(colorToSet)) {
                    setBgColor(colorToSet.toUpperCase());
                  }
                }
              }
            }
            if (isInitialMount.current) {
              isInitialMount.current = false;
            }
          } else {
            setFetchedSvgDoc(null);
          }
        })
        .catch(() => setFetchedSvgDoc(null));
    }
  }, [selectedIconStyle, customSrc]);

  const getRecoloredSvg = (overrideBg = null, overrideFg = null) => {
    if (!fetchedSvgDoc) return null;
    const doc = fetchedSvgDoc.cloneNode(true);
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    const bg = overrideBg || applyOpacity(bgColor, bgOpacity);
    const fg = overrideFg || applyOpacity(iconColor, iconOpacity);

    const bgInfo = generateSvgGradient(bg, 'svgBg');
    const fgInfo = generateSvgGradient(fg, 'svgFg');

    const isRawIcon = selectedIconStyle !== 'default';
    const allShapes = Array.from(svg.querySelectorAll('rect, circle, path, ellipse, polygon'));

    if (isRawIcon) {
      allShapes.forEach(el => {
        const fill = el.getAttribute('fill') || el.style.fill;
        const stroke = el.getAttribute('stroke') || el.style.stroke;

        if (fill && fill.toLowerCase() !== 'none') {
           el.setAttribute('fill', fgInfo.fillValue);
           el.style.fill = '';
        }
        
        if (stroke && stroke.toLowerCase() !== 'none') {
           el.setAttribute('stroke', fgInfo.fillValue);
           el.style.stroke = '';
        }
      });
    } else {
      // Original logic for built-in preset SVGs
      const bgElements = allShapes.filter(el => {
        const fill = el.getAttribute('fill');
        if (!fill) return false;
        const f = fill.toLowerCase();
        return f !== 'none' && f !== 'white' && f !== '#ffffff' && f !== '#fff';
      });
      
      bgElements.forEach(el => {
        el.setAttribute('fill', bgInfo.fillValue);
      });

      if (fg && fg.toLowerCase() !== '#ffffff' && fg !== 'white') {
        const fgElements = allShapes.filter(el => {
          const fill = el.getAttribute('fill');
          if (!fill) return false;
          const f = fill.toLowerCase();
          return f === 'white' || f === '#ffffff' || f === '#fff';
        });
        fgElements.forEach(el => {
          el.setAttribute('fill', fgInfo.fillValue);
        });
      }
    }

    return {
      innerHTML: bgInfo.defsString + fgInfo.defsString + svg.innerHTML,
      viewBox: svg.getAttribute('viewBox') || '0 0 52 52',
      isRawIcon,
      svgTagFill: svg.getAttribute('fill'),
      svgTagStroke: svg.getAttribute('stroke')
    };
  };

  const handleScrubOpacity = (e, initialVal, setFn) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    let accumulatedDelta = 0;
    const sensitivity = 2;

    document.body.classList.add('is-scrubbing');

    const onMouseMove = (moveEvent) => {
      accumulatedDelta += moveEvent.movementX || 0;
      let newVal = initialVal + Math.round(accumulatedDelta / sensitivity);
      if (newVal < 0) newVal = 0;
      if (newVal > 100) newVal = 100;
      setFn(newVal);
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-scrubbing');
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
    };

    window.addEventListener('pointermove', onMouseMove);
    window.addEventListener('pointerup', onMouseUp);
  };

  const extractOpacity = (colorStr) => {
    if (colorStr && typeof colorStr === 'string' && colorStr.length === 9 && colorStr.startsWith('#')) {
      return Math.round((parseInt(colorStr.substring(7, 9), 16) / 255) * 100);
    }
    return 100;
  };

  const stripOpacity = (colorStr) => {
    if (colorStr && typeof colorStr === 'string' && colorStr.length === 9 && colorStr.startsWith('#')) {
      return colorStr.substring(0, 7);
    }
    return colorStr;
  };

  const applyOpacity = (colorStr, op) => {
    if (!colorStr || typeof colorStr !== 'string' || !colorStr.startsWith('#') || colorStr.length !== 7) return colorStr;
    if (op === 100) return colorStr;
    const alphaHex = Math.round((op / 100) * 255).toString(16).padStart(2, '0');
    return `${colorStr}${alphaHex}`;
  };

  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.preset) setSelectedPreset(initialData.preset);
      
      let styles = [];
      if (initialData.src) {
        styles.push({ id: 'default', src: initialData.src });
      }
      
      const lookupKey = (initialData.preset && getIconsForAction(initialData.preset).length > 0) 
        ? initialData.preset 
        : initialData.actionId;
        
      if (lookupKey) {
        const actionIcons = getIconsForAction(lookupKey);
        actionIcons.forEach(icon => {
          if (!styles.some(s => s.src === icon.src)) {
            styles.push(icon);
          }
        });
      }
      setIconStyles(styles);

      if (initialData.src) {
        const match = styles.find(s => s.src === initialData.src);
        if (match) {
          setSelectedIconStyle(match.id);
        } else {
          setCustomSrc(initialData.src);
          setSelectedIconStyle('custom');
        }
      } else if (initialData.iconStyle) {
        setSelectedIconStyle(initialData.iconStyle);
      }
      if (initialData.iconColor) {
        setIconColor(stripOpacity(initialData.iconColor));
        setIconOpacity(extractOpacity(initialData.iconColor));
      }
      if (initialData.bgColor) {
        setBgColor(stripOpacity(initialData.bgColor));
        setBgOpacity(extractOpacity(initialData.bgColor));
      }

      if (initialData.preset === 'interactive-button' && initialData.hotspotHtml) {
        const textMatch = initialData.hotspotHtml.match(/<text[^>]*>([\s\S]*?)<\/text>/);
        if (textMatch) setBtnLabel(textMatch[1]);
        
        const pathMatch = initialData.hotspotHtml.match(/<path/);
        setBtnHasIcon(!!pathMatch);

        const wMatch = initialData.hotspotHtml.match(/width="([\d.]+)"/);
        if (wMatch) setBtnWidth(parseFloat(wMatch[1]));

        const hMatch = initialData.hotspotHtml.match(/height="([\d.]+)"/);
        if (hMatch) setBtnHeight(parseFloat(hMatch[1]));

        const rxMatch = initialData.hotspotHtml.match(/rx="([\d.]+)"/);
        if (rxMatch) setBtnRx(parseFloat(rxMatch[1]));

        const fMatch = initialData.hotspotHtml.match(/font-size="([\d.]+)"/);
        if (fMatch) setBtnFontSize(parseFloat(fMatch[1]));
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    let finalHtml;
    if (isButtonMode) {
      finalHtml = generateButtonSVG(btnLabel, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), btnHasIcon, btnWidth, btnHeight, btnRx, btnFontSize);
    } else {
      finalHtml = generateHotspotSVG(selectedPreset, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), getCurrentIconSrc(), getRecoloredSvg());
    }

    onSave({
      preset: selectedPreset,
      iconStyle: selectedIconStyle,
      src: getCurrentIconSrc(),
      iconColor: applyOpacity(iconColor, iconOpacity),
      bgColor: applyOpacity(bgColor, bgOpacity),
      customHtml: finalHtml
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
      <div 
        className="bg-white rounded-[0.6vw] w-[38vw] h-auto p-[1.5vw] max-h-[85vh] flex flex-col overflow-visible shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-[1vh] flex items-center border-b border-gray-100">
          <h2 className="text-[1vw] font-semibold text-black">Hotspot Customization</h2>
          <div className="flex-1 border-t border-gray-200 ml-[1vw]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 flex pt-[1.5vw] gap-[1.5vw]">
          {/* Left Preview */}
          <div className="flex flex-col w-[42%] h-full">
            {!isButtonMode && (
              <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider mb-[1vh]">Preview</span>
            )}
            
            <div className={`flex-1 border border-gray-100 rounded-[0.5vw] flex flex-col ${isButtonMode ? 'overflow-hidden' : ''}`}>
              {isButtonMode && (
                <div className="px-[1vw] pt-[1vh]">
                  <span className="text-[0.7vw] text-gray-700 font-medium">Preview</span>
                </div>
              )}
              {/* Preview Area */}
              <div className="flex-1 flex items-center justify-center bg-white py-[1vh] px-[2vw]">
                <div className="relative w-[10vw] h-[10vw] flex items-center justify-center">
                  <svg 
                    viewBox={isButtonMode ? `0 0 ${btnWidth} ${btnHeight}` : "0 0 48 48"}
                    className={isButtonMode ? "w-full max-h-[8vw] transition-all duration-300 overflow-visible" : "w-[100%] h-[100%] transition-all duration-300 overflow-visible"}
                    dangerouslySetInnerHTML={{ __html: isButtonMode ? generateButtonSVG(btnLabel, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), btnHasIcon, btnWidth, btnHeight, btnRx, btnFontSize) : generateHotspotSVG(selectedPreset, applyOpacity(bgColor, bgOpacity), applyOpacity(iconColor, iconOpacity), getCurrentIconSrc(), getRecoloredSvg()) }}
                  />
                </div>
              </div>
              
              {isButtonMode && (
                <div className="bg-[#F8F9FA] border-t border-gray-100 p-[1.5vh] flex justify-center items-center">
                  <label className="flex items-center gap-[0.5vw] cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-[1vw] h-[1vw] accent-black cursor-pointer"
                      checked={btnHasIcon}
                      onChange={(e) => setBtnHasIcon(e.target.checked)}
                    />
                    <span className="text-[0.7vw] font-medium text-gray-700 select-none">Add Icon to the Button</span>
                  </label>
                </div>
              )}

              {/* Presets Row */}
              {!isButtonMode && (
                <div className="border-t border-gray-100 p-[1vw] flex flex-col gap-[0.5vh]">
                  <span className="text-[0.6vw] text-gray-400 font-medium uppercase tracking-wider">Preset</span>
                  <div className="flex items-center gap-[0.5vw] justify-between">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPreset(p.id)}
                        className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.4vw] border transition-all ${selectedPreset === p.id ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                      >
                        <svg viewBox="0 0 48 48" className="w-[1.8vw] h-[1.8vw] overflow-visible" dangerouslySetInnerHTML={{ __html: generateHotspotSVG(p.id, bgColor, '#FFFFFF', '', getRecoloredSvg(bgColor, '#FFFFFF')) }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-[3.5vh] mt-[4vh]">
              {isButtonMode ? (
                <>
                  {/* Label */}
                  <div className="flex items-center">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Label :</span>
                    <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center px-[0.5vw]">
                      <input
                        type="text"
                        className="text-[0.75vw] text-gray-600 font-medium bg-transparent outline-none flex-1 min-w-0"
                        value={btnLabel}
                        maxLength={20}
                        onChange={(e) => setBtnLabel(e.target.value)}
                      />
                      <span className="text-[0.6vw] text-gray-400 select-none">{btnLabel.length}/20</span>
                    </div>
                  </div>

                  {/* Text Color (using iconColor state) */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Text Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(iconColor, iconOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'icon' ? null : 'icon')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={iconColor}
                          onChange={(e) => setIconColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, iconOpacity, setIconOpacity)}
                        >
                          {iconOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'icon' && (
                      <div className="absolute top-[-11vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={iconColor} onChange={setIconColor} opacity={iconOpacity} onOpacityChange={setIconOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(bgColor, bgOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, bgOpacity, setBgOpacity)}
                        >
                          {bgOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'bg' && (
                      <div className="absolute top-[-15vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={bgColor} onChange={setBgColor} opacity={bgOpacity} onOpacityChange={setBgOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Icon Style */}
                  <div className="flex items-center">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Style :</span>
                    <div className="flex items-center gap-[0.4vw] ml-[0.5vw] overflow-x-auto custom-scrollbar pb-1 max-w-[15vw]">
                      {customSrc && (
                        <button
                          className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${selectedIconStyle === 'custom' ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                          onClick={() => setSelectedIconStyle('custom')}
                        >
                          <img src={customSrc} className="w-[1.2vw] h-[1.2vw] object-contain" />
                        </button>
                      )}
                      {iconStyles.map(style => (
                        <button
                          key={style.id}
                          className={`w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-[0.3vw] border transition-colors ${selectedIconStyle === style.id ? 'border-gray-800 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                          onClick={() => setSelectedIconStyle(style.id)}
                        >
                          <img src={style.id === 'default' && bareDefaultSrc ? bareDefaultSrc : style.src} className="w-[1.4vw] h-[1.4vw] object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Icon Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(iconColor, iconOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'icon' ? null : 'icon')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={iconColor}
                          onChange={(e) => setIconColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, iconOpacity, setIconOpacity)}
                        >
                          {iconOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'icon' && (
                      <div className="absolute top-[-11vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={iconColor} onChange={setIconColor} opacity={iconOpacity} onOpacityChange={setIconOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bg Color */}
                  <div className="flex items-center relative">
                    <span className="text-[0.8vw] font-medium text-gray-700 w-[5vw]">Bg Color :</span>
                    <div className="flex items-center gap-[0.8vw] ml-[0.5vw] flex-1">
                      <div 
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.3vw] border border-gray-200 cursor-pointer shadow-sm flex-shrink-0"
                        style={{ background: applyOpacity(bgColor, bgOpacity) }}
                        onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                      ></div>
                      <div className="flex-1 bg-white border border-gray-200 rounded-[0.3vw] h-[1.8vw] flex items-center justify-between px-[0.5vw] min-w-0">
                        <input
                          type="text"
                          className="text-[0.65vw] text-gray-600 uppercase font-mono bg-transparent outline-none flex-1 min-w-0"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                        />
                        <span 
                          className="text-[0.6vw] flex-shrink-0 ml-[0.5vw] text-gray-400 cursor-ew-resize select-none"
                          onPointerDown={(e) => handleScrubOpacity(e, bgOpacity, setBgOpacity)}
                        >
                          {bgOpacity}%
                        </span>
                      </div>
                    </div>
                    {activeColorPicker === 'bg' && (
                      <div className="absolute top-[-15vw] left-[8vw] z-50">
                        <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
                        <div className="relative">
                          <ColorPicker color={bgColor} onChange={setBgColor} opacity={bgOpacity} onOpacityChange={setBgOpacity} onClose={() => setActiveColorPicker(null)} />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Buttons inside Right Controls aligned with Presets */}
            <div className="flex justify-end gap-[0.6vw] mt-auto mb-[2.5vh]">
              <button 
                className="px-[1vw] py-[0.5vh] text-[0.7vw] font-medium text-gray-700 bg-white border border-gray-200 rounded-[0.3vw] hover:bg-gray-50 flex items-center gap-[0.3vw] transition-colors"
                onClick={onClose}
              >
                <Icon icon="lucide:x" className="text-[0.8vw]" /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-[1.5vw] py-[0.8vh] bg-black text-white text-[0.8vw] font-medium rounded-[0.3vw] hover:bg-gray-800 transition-colors flex items-center gap-[0.4vw]"
              >
                <Icon icon="lucide:check" className="text-[0.8vw]" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        body.is-scrubbing, body.is-scrubbing * {
          cursor: ew-resize !important;
          user-select: none !important;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default HotspotCustomizationPopup;
