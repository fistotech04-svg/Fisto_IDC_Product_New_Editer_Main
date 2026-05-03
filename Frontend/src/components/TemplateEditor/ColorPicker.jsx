import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ArrowLeftRight, Minus, RotateCcw, X, Check } from "lucide-react";
import PremiumDropdown from "../CustomizedEditor/PremiumDropdown";
// Helper functions for color conversion
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export const hexToRgb = (hex) => {
  if (!hex) return { r: 255, g: 255, b: 255, a: 1 };
  let normalized = hex.replace('#', '');
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(normalized);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) / 255 : 1
  } : { r: 255, g: 255, b: 255, a: 1 };
};

export const getColorAtOffset = (offset, stops) => {
    if (!stops || stops.length === 0) return '#FFFFFF';
    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    if (offset <= sorted[0].offset) return sorted[0].color;
    if (offset >= sorted[sorted.length - 1].offset) return sorted[sorted.length - 1].color;
    for (let i = 0; i < sorted.length - 1; i++) {
        const s1 = sorted[i]; const s2 = sorted[i + 1];
        if (offset >= s1.offset && offset <= s2.offset) {
            const ratio = (offset - s1.offset) / (s2.offset - s1.offset);
            const c1 = hexToRgb(s1.color); const c2 = hexToRgb(s2.color);
            const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
            const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
            const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
            return rgbToHex(r, g, b);
        }
    }
    return '#FFFFFF';
};

export const generateGradientString = (type, stops, angle = 0, radius = 100) => {
    if (!stops || stops.length < 2) return '';
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);

    const stopsStr = (scale = 100) => sortedStops.map(s => {
        const rgb = hexToRgb(s.color);
        const opacity = ((s.opacity || 100) / 100) * (rgb.a ?? 1);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset * (scale / 100)}%`;
    }).join(', ');

    switch (type) {
        case 'Radial': 
            return `radial-gradient(circle at center, ${stopsStr(radius)})`;
        case 'Angular': 
            return `conic-gradient(from ${angle}deg at center, ${stopsStr(100)})`;
        case 'Diamond': {
            const sStr = stopsStr(radius);
            return `
                linear-gradient(to top left, ${sStr}) 0 0/51% 51% no-repeat,
                linear-gradient(to top right, ${sStr}) 100% 0/51% 51% no-repeat,
                linear-gradient(to bottom left, ${sStr}) 0 100%/51% 51% no-repeat,
                linear-gradient(to bottom right, ${sStr}) 100% 100%/51% 51% no-repeat
            `.replace(/\s+/g, ' ').trim();
        }
        default: 
            return `linear-gradient(${angle}deg, ${stopsStr(100)})`;
    }
};

export const solidPalette = [
    '#DADBE8','#ffe0ffff','#FFD1DC',  '#F8C8DC','#FFB7C5','#FFFACD', '#FFF4B5',
    '#FFE5B4', '#FFD8B1', '#FFCBA4',
      '#e0ffd0ff','#c9fcceff','#C1F0C1',
      '#dceaf8ff', '#B3E5FC','#d3d2fdff','#dfd1ffff',  '#E0BBE4', 
    '#FFFFFF', '#E0E0E0', '#9E9E9E', '#424242', '#000000',
];

export const parseGradient = (gradientStr) => {
  if (!gradientStr || typeof gradientStr !== 'string' || !gradientStr.includes('gradient')) {
    return null;
  }

  const type = gradientStr.includes('radial') ? 'Radial' : 
               gradientStr.includes('conic') ? 'Angular' : 
               gradientStr.includes('linear-gradient(to top left') ? 'Diamond' : 'Linear';

  // For Diamond, we only want to parse the first gradient's stops
  const parseStr = type === 'Diamond' ? gradientStr.split('),')[0] : gradientStr;

  // Extract stops
  const stops = [];
  const stopRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)\s+([\d.]+)%/g;
  let match;
  while ((match = stopRegex.exec(parseStr)) !== null) {
    stops.push({
      color: rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])),
      offset: parseFloat(match[5]),
      opacity: match[4] ? Math.round(parseFloat(match[4]) * 100) : 100
    });
  }

  // Extract angle/radius
  let angle = 0;
  let radius = 100;

  if (type === 'Linear' || type === 'Angular') {
    const angleMatch = gradientStr.match(/(\d+)deg/);
    if (angleMatch) angle = parseInt(angleMatch[1]);
  }
  
  // For Radial, radius is encoded in stopsStr(radius) in generateGradientString
  // It's a bit complex to reverse exactly if it's scaled. 
  // For now, we'll assume 100 if not found, or try to infer from the last stop if it was scaled.
  
  return { type, stops: stops.length > 0 ? stops : null, angle, radius };
};


const hexToHsv = (hex) => {
  if (!hex || hex === "transparent" || hex.includes("gradient")) return { h: 0, s: 0, v: 100 };
  let color = hex.toString();
  if (!color.startsWith("#")) return { h: 0, s: 0, v: 100 };
  color = color.substring(1);
  if (color.length === 3)
    color = color.split("").map((c) => c + c).join("");
  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function ColorPicker({ color, onChange, opacity, onOpacityChange, onClose, className, style, colorsOnPage = [], ...props }) {
  const [view, setView] = useState("palette"); // "palette" or "custom"
  const [mode, setMode] = useState(color?.includes("gradient") ? "gradient" : "solid"); 
  const [hsv, setHsv] = useState(() => hexToHsv(color || "#ffffff"));
  
  // Gradient state
  const [gradientType, setGradientType] = useState("Linear");
  const [gradientStops, setGradientStops] = useState([
    { color: '#63D0CD', offset: 0, opacity: 100 },
    { color: '#4B3EFE', offset: 100, opacity: 100 }
  ]);
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientRadius, setGradientRadius] = useState(100);
  const [editingStopIndex, setEditingStopIndex] = useState(null);

  useEffect(() => {
    if (color) {
      if (color.includes("gradient")) {
        setMode("gradient");
        const parsed = parseGradient(color);
        if (parsed) {
          setGradientType(parsed.type);
          if (parsed.stops) setGradientStops(parsed.stops);
          setGradientAngle(parsed.angle);
          setGradientRadius(parsed.radius);
        }
      } else if (color !== "transparent") {
        setMode("solid");
        setHsv(hexToHsv(color));
      }
    }
  }, [color]);

  const updateGradient = useCallback((type, stops, angle, radius) => {
    const gradientStr = generateGradientString(type, stops, angle, radius);
    onChange(gradientStr);
  }, [onChange]);

  const handleSaturationChange = useCallback((e, container) => {
    const { width, height, left, top } = container.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    const newHsv = { ...hsv, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv);
    if (editingStopIndex !== null) {
      const newStops = [...gradientStops];
      newStops[editingStopIndex] = { ...newStops[editingStopIndex], color: newColor };
      setGradientStops(newStops);
      updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
    } else {
      onChange(newColor);
    }
  }, [hsv, onChange, editingStopIndex, gradientStops, gradientType, gradientAngle, gradientRadius, updateGradient]);

  const handleHueChange = useCallback((e, container) => {
    const { height, top } = container.getBoundingClientRect();
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    const newHsv = { ...hsv, h: y * 360 };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv);
    if (editingStopIndex !== null) {
      const newStops = [...gradientStops];
      newStops[editingStopIndex] = { ...newStops[editingStopIndex], color: newColor };
      setGradientStops(newStops);
      updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
    } else {
      onChange(newColor);
    }
  }, [hsv, onChange, editingStopIndex, gradientStops, gradientType, gradientAngle, gradientRadius, updateGradient]);

  const useDrag = (handler) => {
    const isDragging = useRef(false);
    const containerRef = useRef(null);
    const onMouseDown = (e) => {
      isDragging.current = true;
      handler(e, containerRef.current);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };
    const onMouseMove = (e) => {
      if (isDragging.current) {
        e.preventDefault();
        handler(e, containerRef.current);
      }
    };
    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    return { onMouseDown, ref: containerRef };
  };

  const satDrag = useDrag(handleSaturationChange);
  const hueDrag = useDrag(handleHueChange);
  const hexInputRef = useRef(null);
  const nativeColorRef = useRef(null);

  const displayOpacity = Math.round(((opacity || 100) / 100) * 100);
  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  const resetGradient = () => {
    const newStops = [
      { color: '#63D0CD', offset: 0, opacity: 100 },
      { color: '#4B3EFE', offset: 100, opacity: 100 }
    ];
    setGradientStops(newStops);
    setGradientType('Linear');
    setGradientAngle(0);
    setGradientRadius(100);
    updateGradient('Linear', newStops, 0, 100);
  };

  const reverseGradient = () => {
    const newStops = [...gradientStops].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const color = getColorAtOffset(offset, gradientStops);
    const newStop = { color, offset, opacity: 100 };
    const newStops = [...gradientStops, newStop].sort((a, b) => a.offset - b.offset);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return;
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  const updateGradientStop = (index, updates) => {
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], ...updates };
    setGradientStops(newStops);
    updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
  };

  return (
    <div 
        className={`w-[19vw] bg-white rounded-[0.6vw] shadow-[0_1vw_3vw_-0.5vw_rgba(0,0,0,0.2)] border border-gray-100 p-[1.2vw] animate-in fade-in zoom-in-95 duration-200 select-none font-sans pointer-events-auto color-picker-container ${className || ""}`}
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...props}
    >
      {view === "palette" ? (
        <div className="flex flex-col gap-[1vw]">
          {/* Header Controls */}
          <div className="flex items-center justify-between w-full mb-[0.5vw]">
            <PremiumDropdown 
              options={['Solid', 'Gradient']}
              value={mode.charAt(0).toUpperCase() + mode.slice(1)}
              onChange={(m) => {
                const newMode = m.toLowerCase();
                setMode(newMode);
                if (newMode === 'solid') {
                  onChange(gradientStops[0].color);
                } else {
                  updateGradient(gradientType, gradientStops, gradientAngle, gradientRadius);
                }
              }}
              width="5.5vw"
              align="left"
            />

            {mode === 'gradient' && (
              <PremiumDropdown 
                options={['Linear', 'Radial', 'Angular', 'Diamond']}
                value={gradientType}
                onChange={(type) => {
                  setGradientType(type);
                  updateGradient(type, gradientStops, gradientAngle, gradientRadius);
                }}
                width="6.5vw"
                align="right"
              />
            )}
            
            {onClose && (
              <button onClick={onClose} className="p-[0.1vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-100 transition-all">
                <X size="1.2vw" />
              </button>
            )}
          </div>

          {mode === 'solid' ? (
            <div className="flex flex-col gap-[1.5vw]">
              {/* Colors on this page */}
              {colorsOnPage && colorsOnPage.length > 0 && (
                <div className="mb-[0.5vw]">
                  <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                    <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Colors on this page</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-6 gap-[0.6vw]">
                    {colorsOnPage.map((c, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => onChange(c)}
                        className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 cursor-pointer ${color?.toLowerCase() === c.toLowerCase() ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Pick Colors From Pallet</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                </div>
                
                <div className="flex items-center justify-between gap-[1vw]">
                  <span className="text-[0.75vw] font-semibold text-gray-700">Fill :</span>
                  <div className="flex-1 flex gap-[0.5vw] items-center">
                    <div 
                      className="w-[2vw] h-[2vw] border border-gray-300 rounded-[0.5vw] shadow-sm cursor-pointer hover:border-[#5d5efc] transition-colors" 
                      style={{ background: color }}
                      onClick={() => setView("custom")}
                    />
                    <div className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-[#5d5efc] transition-colors">
                      <input 
                        type="text"
                        value={color?.toUpperCase() || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="text-[0.8vw] font-medium text-gray-700 font-mono bg-transparent w-[5vw] outline-none"
                      />
                      <span className="text-[0.8vw] font-medium text-gray-400">{displayOpacity}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-[0.5vw]">
                <div className="flex items-center gap-[1vw] mb-[1.25vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Solid Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-6 gap-[0.6vw]">
                  <button 
                    type="button"
                    onClick={() => onChange('none')}
                    className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 relative overflow-hidden cursor-pointer ${color === 'none' ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45"></div>
                  </button>
                  {solidPalette.map((c, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => onChange(c)}
                      className={`aspect-square rounded-[0.5vw] border transition-all hover:scale-110 cursor-pointer ${color?.toLowerCase() === c.toLowerCase() ? 'border-[#5d5efc] border-2 shadow-sm scale-110' : 'border-gray-100'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-[1.5vw]">
              <div>
                <div className="flex items-center gap-[0.75vw] mb-[1.5vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Customize your Color</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                  <div className="flex gap-[0.4vw]">
                    <button onClick={resetGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors" title="Reset">
                      <RotateCcw size="1vw" className="text-gray-600" />
                    </button>
                    <button onClick={reverseGradient} className="w-[2vw] h-[2vw] flex items-center justify-center bg-white border border-gray-200 rounded-[0.5vw] hover:bg-gray-50 transition-colors" title="Reverse">
                      <ArrowLeftRight size="1vw" className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-[1vw] mb-[1vw]">
                  <div 
                    className="relative w-[3vw] h-[3vw] shadow-md border border-gray-100 flex-shrink-0" 
                    style={{ 
                      background: color,
                      borderRadius: gradientType === 'Radial' ? '50%' : '0.4vw'
                    }} 
                  />
                  <div className="flex-1 flex flex-col gap-[0.5vw] justify-between">
                    <span className="text-[0.65vw] font-bold text-gray-400 uppercase tracking-wider">{gradientType} GRADIENT</span>
                    {(gradientType === 'Linear' || gradientType === 'Angular') && (
                      <div className="flex items-center gap-[0.5vw]">
                        <span className="text-[0.75vw] font-semibold text-gray-700 w-[2.5vw]">Angle</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={gradientAngle}
                          onChange={(e) => {
                            const a = parseInt(e.target.value);
                            setGradientAngle(a);
                            updateGradient(gradientType, gradientStops, a, gradientRadius);
                          }}
                          className="flex-1 h-[0.3vw] accent-[#5d5efc]"
                        />
                        <span className="text-[0.65vw] font-semibold text-gray-500 w-[1.5vw] text-right">{gradientAngle}°</span>
                      </div>
                    )}
                    {(gradientType === 'Radial' || gradientType === 'Diamond') && (
                      <div className="flex items-center gap-[0.5vw]">
                        <span className="text-[0.75vw] font-semibold text-gray-700 w-[2.5vw]">Radius</span>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={gradientRadius}
                          onChange={(e) => {
                            const r = parseInt(e.target.value);
                            setGradientRadius(r);
                            updateGradient(gradientType, gradientStops, gradientAngle, r);
                          }}
                          className="flex-1 h-[0.3vw] accent-[#5d5efc]"
                        />
                        <span className="text-[0.65vw] font-semibold text-gray-500 w-[1.5vw] text-right">{gradientRadius}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gradient Bar with Stops */}
                <div className="relative pt-[1.5vw] pb-[1vw] mb-[1.5vw]">
                  <div className="absolute top-0 left-0 w-full h-[2vw] pointer-events-none">
                    {gradientStops.map((stop, idx) => (
                      <div
                        key={idx}
                        className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                        style={{ left: `${stop.offset}%`, bottom: '1.2vw' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startOffset = stop.offset;
                          const rect = e.currentTarget.parentElement.parentElement.getBoundingClientRect();
                          
                          const handleMouseMove = (moveEvent) => {
                            const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
                            const newOffset = Math.min(100, Math.max(0, Math.round(startOffset + dx)));
                            updateGradientStop(idx, { offset: newOffset });
                          };
                          
                          const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          window.addEventListener('mousemove', handleMouseMove);
                          window.addEventListener('mouseup', handleMouseUp);
                        }}
                      >
                        <div 
                          className={`w-[1.2vw] h-[1.2vw] border-2 border-white shadow-md rounded-[0.3vw] transition-transform hover:scale-110 ${editingStopIndex === idx ? 'ring-2 ring-[#5d5efc]' : ''}`}
                          style={{ backgroundColor: stop.color }}
                          onClick={() => {
                            setEditingStopIndex(idx);
                            setHsv(hexToHsv(stop.color));
                            setView("custom");
                          }}
                        />
                        <div className="w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.4vw] border-t-white mt-[0.1vw]"></div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="w-full h-[1.2vw] rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy"
                    onClick={addGradientStop}
                    style={{ background: color }}
                  />
                </div>

                {/* Stop List */}
                <div className="space-y-[0.8vw] max-h-[6vw] overflow-y-auto custom-scrollbar pr-[0.4vw]">
                  {gradientStops.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-[0.6vw]">
                      <div 
                        className="w-[2vw] h-[2vw] rounded-[0.5vw] border border-gray-200 cursor-pointer"
                        style={{ backgroundColor: stop.color }}
                        onClick={() => {
                          setEditingStopIndex(idx);
                          setHsv(hexToHsv(stop.color));
                          setView("custom");
                        }}
                      />
                      <div 
                        className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] flex items-center px-[0.6vw] bg-white cursor-pointer"
                        onClick={() => {
                          setEditingStopIndex(idx);
                          setHsv(hexToHsv(stop.color));
                          setView("custom");
                        }}
                      >
                        <span className="text-[0.75vw] font-medium text-gray-700 font-mono">{stop.color.toUpperCase()}</span>
                      </div>
                      <button onClick={() => removeGradientStop(idx)} className="w-[2vw] h-[2vw] flex items-center justify-center border border-red-200 rounded-[0.5vw] text-red-500 hover:bg-red-50 transition-colors">
                        <Minus size="1vw" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-[1vw] mb-[1.2vw]">
                  <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Gradient Colors</span>
                  <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-6 gap-[0.6vw]">
                  {[
                    ['#FFE2BB', '#FFBBC1'], ['#4DBA55', '#A2D357'], ['#FF0581', '#FFB5DC'],
                    ['#7F073D', '#F967C8'], ['#ff3969', '#faccc5'], ['#FDBB2D', '#22C1C3'],
                    ['#FFB0DC', '#DFCBFF'], ['#82ABFF', '#43D3DA'], ['#A5B4FC', '#E0E7FF'],
                    ['#fa709a', '#D5A7FF'], ['#30cfd0', '#713EAE'], ['#a18cd1', '#fbc2eb'],
                  ].map((colors, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        const newStops = colors.map((c, idx) => ({
                          color: c,
                          offset: idx === 0 ? 0 : 100,
                          opacity: 100
                        }));
                        setGradientStops(newStops);
                        updateGradient(gradientType, newStops, gradientAngle, gradientRadius);
                      }}
                      className="aspect-square rounded-[0.5vw] border border-gray-100 shadow-sm transition-all hover:scale-110"
                      style={{ background: `linear-gradient(to bottom right, ${colors.join(', ')})` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Custom Picker Header (Back Button) */}
          <div className="flex items-center justify-between mb-[1.2vw]">
            <button 
              onClick={() => {
                setView("palette");
                setEditingStopIndex(null);
              }}
              className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Icon icon="heroicons:chevron-left" className="w-[1vw] h-[1vw]" />
              {editingStopIndex !== null ? `Edit Stop ${editingStopIndex + 1}` : 'Back to Palette'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-100 transition-all"
              >
                <Icon icon="heroicons:x-mark" width="1.2vw" />
              </button>
            )}
          </div>
       
          {/* Main Area */}
          <div className="flex gap-[0.75vw] h-[9.375vw] mb-[1.25vw]">
            <div
              ref={satDrag.ref}
              onMouseDown={satDrag.onMouseDown}
              className="flex-1 rounded-[0.6vw] relative cursor-crosshair overflow-hidden"
              style={{ backgroundColor: hueColor }}
            >
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>
              <div
                className="absolute w-[0.85vw] h-[0.85vw] border-2 border-white rounded-full shadow-lg -ml-[0.425vw] -mt-[0.425vw] pointer-events-none"
                style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
              />
            </div>
    
            <div
              ref={hueDrag.ref}
              onMouseDown={hueDrag.onMouseDown}
              className="w-[1.25vw] rounded-full relative cursor-pointer"
              style={{ background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)" }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[1.5vw] h-[1.5vw] pointer-events-none"
                style={{ top: `${(hsv.h / 360) * 100}%`, marginTop: '-0.75vw' }}
              >
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.75vw] h-[0.75vw] bg-white border-2 border-white rounded-full shadow-md">
                  <div className="w-full h-full rounded-full border border-gray-200" style={{ backgroundColor: hsvToHex(hsv) }} />
                </div>
              </div>
            </div>
          </div>
    
          {/* Controls */}
          <div className="space-y-[1vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.85vw] font-semibold text-gray-800">Color Code :</span>
              <div className="flex items-center gap-[0.5vw] border-2 border-gray-300 rounded-[0.6vw] px-[0.5vw] py-[0.35vw] w-[7vw] focus-within:border-[#5d5efc] transition-all relative">
                <span className="text-gray-400 text-[0.65vw] font-medium">#</span>
                <input
                  type="text"
                  ref={hexInputRef}
                  value={(editingStopIndex !== null ? gradientStops[editingStopIndex].color : color)?.replace("#", "").toLowerCase() || ""}
                  onChange={(e) => {
                    const newColor = `#${e.target.value}`;
                    if (editingStopIndex !== null) {
                      updateGradientStop(editingStopIndex, { color: newColor });
                    } else {
                      onChange(newColor);
                    }
                  }}
                  className="w-full text-[0.7vw] font-semibold text-gray-700 outline-none lowercase font-mono"
                  maxLength={6}
                />
                <button 
                  onClick={async () => {
                    if ('EyeDropper' in window) {
                      const eyeDropper = new window.EyeDropper();
                      try {
                        const result = await eyeDropper.open();
                        if (editingStopIndex !== null) {
                          updateGradientStop(editingStopIndex, { color: result.sRGBHex });
                        } else {
                          onChange(result.sRGBHex);
                        }
                      } catch (e) {}
                    } else {
                      nativeColorRef.current?.click();
                    }
                  }}
                  className="flex items-center justify-center p-[0.2vw] hover:bg-gray-100 rounded-[0.3vw] transition-colors group/btn"
                >
                  <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-400 group-hover/btn:text-gray-700" />
                </button>
                <input 
                  type="color" 
                  ref={nativeColorRef} 
                  className="hidden" 
                  onChange={(e) => {
                    const newColor = e.target.value;
                    if (editingStopIndex !== null) {
                      updateGradientStop(editingStopIndex, { color: newColor });
                    } else {
                      onChange(newColor);
                    }
                  }} 
                />
              </div>
            </div>
    
            <div className="flex items-center justify-between">
              <span className="text-[0.85vw] font-semibold text-gray-800">Opacity :</span>
              <div className="flex items-center gap-[0.75vw] w-[7vw]">
                <div className="relative flex-1 h-[0.35vw] bg-gray-100 rounded-full">
                  <div className="absolute top-0 left-0 h-full bg-[#7c5dff] rounded-full" style={{ width: `${displayOpacity}%` }} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={displayOpacity}
                    onChange={(e) => {
                      const op = parseInt(e.target.value);
                      if (editingStopIndex !== null) {
                        updateGradientStop(editingStopIndex, { opacity: op });
                      } else if (onOpacityChange) {
                        onOpacityChange(op);
                      }
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw] bg-[#7c5dff] border-2 border-white rounded-full shadow-md pointer-events-none" style={{ left: `${displayOpacity}%`, marginLeft: "-0.425vw" }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
