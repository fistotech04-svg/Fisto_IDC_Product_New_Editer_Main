import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@iconify/react';
import { RotateCcw, ArrowLeftRight, Minus, X, Pipette, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import backgroundComponents from './Backgrounds'; // Import new React Bits backgrounds
import animationComponents from './Animations';
import PremiumDropdown from './PremiumDropdown';

// Helper Functions
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const getColorAtOffset = (offset, stops) => {
  if (!stops || stops.length === 0) return '#FFFFFF';
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  if (offset <= sorted[0].offset) return sorted[0].color;
  if (offset >= sorted[sorted.length - 1].offset) return sorted[sorted.length - 1].color;
  for (let i = 0; i < sorted.length - 1; i++) {
    const s1 = sorted[i]; const s2 = sorted[i+1];
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

const generateGradientString = (type, stops) => {
  if (!stops || stops.length < 2) return '';
  const stopsStr = stops.map(s => {
    const rgb = hexToRgb(s.color);
    const opacity = (s.opacity || 100) / 100;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
  }).join(', ');
  switch (type) {
    case 'Radial': return `radial-gradient(circle, ${stopsStr})`;
    case 'Angular': return `conic-gradient(from 0deg, ${stopsStr})`;
    case 'Diamond': return `radial-gradient(circle at center, ${stopsStr})`;
    default: return `linear-gradient(to right, ${stopsStr})`;
  }
};

const hexToRgb = (hex) => {
  if (!hex) return { r: 255, g: 255, b: 255 };
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h, s, v) => {
  h /= 360; s /= 100; v /= 100;
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const CustomColorPicker = React.memo(({ color, onChange, onClose, position, opacity, onOpacityChange }) => {
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(100);
  const [bright, setBright] = useState(100);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (color && color.startsWith('#')) {
      const rgbObj = hexToRgb(color);
      const hsvObj = rgbToHsv(rgbObj.r, rgbObj.g, rgbObj.b);
      setHue(hsvObj.h);
      setSat(hsvObj.s);
      setBright(hsvObj.v);
    }
  }, [color]);

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const moveHandler = (moveEvent) => {
      if (type === 'sat-bright') {
        const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (moveEvent.clientY - rect.top) / rect.height));
        updateColor(hue, x * 100, y * 100);
      } else if (type === 'hue') {
        const h = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
        updateColor(h * 360, sat, bright);
      }
    };
    const upHandler = () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
    };
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
  }, [hue, sat, bright]);

  const updateColor = (h, s, v) => {
    setHue(h);
    setSat(s);
    setBright(v);
    const rgbObj = hsvToRgb(h, s, v);
    const hexVal = rgbToHex(rgbObj.r, rgbObj.g, rgbObj.b);
    onChange(hexVal);
  };

  const handleEyedropper = async () => {
    if (!window.EyeDropper) return;
    const eyeDropper = new window.EyeDropper();
    try {
      const result = await eyeDropper.open();
      onChange(result.sRGBHex.toUpperCase());
    } catch (e) {}
  };

  return (
    <div 
      ref={pickerRef}
      className="fixed z-[100] color-picker-popup bg-white rounded-[0.5vw] shadow-[0_1.25vw_3.125vw_rgba(0,0,0,0.15)] border border-gray-100 p-[0.75vw] w-[13.75vw] animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex items-center justify-between mb-[1vw]">
        <span className="text-[0.7875vw] font-semibold text-gray-800">Color Picker</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size="1vw" />
        </button>
      </div>
      
      <div className="flex gap-[0.5vw] mb-[1vw]">
        <div 
          className="flex-1 aspect-square rounded-[0.75vw] cursor-crosshair overflow-hidden relative"
          style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
          onMouseDown={(e) => handleMouseDown(e, 'sat-bright')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <div 
            className="absolute w-[1vw] h-[1vw] border-[0.125vw] border-white rounded-full shadow-lg -translate-x-1/2 translate-y-1/2 pointer-events-none"
            style={{ left: `${sat}%`, bottom: `${bright}%` }}
          />
        </div>
        <div 
          className="w-[2.5vw] rounded-[0.75vw] cursor-pointer relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'hue')}
        >
          <div 
            className="absolute left-0 right-0 h-[0.375vw] border-y border-white bg-black/20 pointer-events-none"
            style={{ top: `${(hue / 360) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-[1vw]">
        <div className="flex items-center justify-between gap-[0.75vw]">
          <span className="text-[0.625vw] font-semibold text-gray-500 ">Hex:</span>
          <div className="flex-1 flex items-center border border-gray-200 rounded-[0.5vw] px-[0.5vw] py-[0.375vw] bg-gray-50">
            <input 
              type="text" 
              value={color} 
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-transparent text-[0.75vw] font-bold text-gray-700 outline-none"
            />
            <button onClick={handleEyedropper} className="p-[0.25vw] hover:bg-gray-200 rounded-[0.25vw] transition-colors">
              <Pipette size="0.875vw" className="text-gray-500" />
            </button>
          </div>
        </div>

        {onOpacityChange && (
          <div className="space-y-[0.375vw]">
            <div className="flex justify-between items-center">
              <span className="text-[0.625vw] font-bold text-gray-500">Opacity:</span>
              <span className="text-[0.625vw] font-bold text-gray-700">{opacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => onOpacityChange(parseInt(e.target.value))}
              className="w-full h-[0.375vw] rounded-[0.5vw] appearance-none cursor-pointer accent-indigo-600 bg-gray-100"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${color} 100%)`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

const EffectControlRow = ({ label, value, onChange, min = -100, max = 100 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <div className="flex items-center justify-start ">
      <span className="text-[0.625vw] font-medium text-gray-600 w-[3vw] cursor-ew-resize select-none" onMouseDown={onMouseDown}>{label} :</span>
      <div className="flex items-center gap-[0.75vw]">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="text-gray-400 hover:text-gray-600  p-[0.125vw]"><Icon icon="lucide:chevron-left" className="w-[0.75vw] h-[0.75vw]" /></button>
        <div 
           onMouseDown={onMouseDown} 
           className="w-[3vw] h-[1.95vw] border border-gray-200 rounded-[0.25vw] flex items-center justify-center bg-white cursor-ew-resize select-none text-[0.6875vw] text-gray-600 font-medium"
        >
           {value}
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="text-gray-400 hover:text-gray-600 p-[0.125vw]"><Icon icon="lucide:chevron-right" className="w-[0.75vw] h-[0.75vw]" /></button>
      </div>
    </div>
  );
};


const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const Appearance = ({ onBack, activeSub, backgroundSettings, onUpdateBackground, bookAppearanceSettings, onUpdateBookAppearance }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showGallery, setShowGallery] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [localGallerySelected, setLocalGallerySelected] = useState(null);
  const [activeTab, setActiveTab] = useState('Background');
  const [selectedTheme, setSelectedTheme] = useState(null);

  // Book Appearance states
  const [showShadowColorPicker, setShowShadowColorPicker] = useState(false);
  const [shadowPickerPos, setShadowPickerPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
     if (backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType) {
         setSelectedTheme(backgroundSettings.reactBitType);
     } else {
         setSelectedTheme(null);
     }
  }, [backgroundSettings.style, backgroundSettings.reactBitType]);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // React Bits Theme Selector Logic
  useEffect(() => {
    if (!selectedTheme) return;
    
    // Guard: Only update if the style or theme type is actually different
    if (backgroundSettings?.style === 'ReactBits' && backgroundSettings?.reactBitType === selectedTheme) return;

    const updates = { 
         ...backgroundSettings, 
         style: 'ReactBits', 
         reactBitType: selectedTheme,
         color: '#000000'
    };

    // Store the original color if we're switching FROM Solid style
    if (backgroundSettings.style === 'Solid') {
       updates.savedSolidColor = backgroundSettings.color;
    }

    onUpdateBackground(updates);
  }, [selectedTheme, backgroundSettings.style, backgroundSettings.reactBitType]);

  const bgStyle = (backgroundSettings?.style === 'ReactBits' || !backgroundSettings?.style) ? 'Solid' : backgroundSettings.style;

  // Gradient States
  const [editingGradientStopIndex, setEditingGradientStopIndex] = useState(null);
  const [gradientStopHex, setGradientStopHex] = useState('#FFFFFF');
  const [gradientStopRgb, setGradientStopRgb] = useState({ r: 255, g: 255, b: 255 });
  const [gradientStopHsv, setGradientStopHsv] = useState({ h: 0, s: 0, v: 100 });
  const [pendingNewStopOffset, setPendingNewStopOffset] = useState(null);

  // Synchronize gradient string if missing or in sync
  useEffect(() => {
    if (bgStyle === 'Gradient' && backgroundSettings.gradientStops && !backgroundSettings.gradient) {
      const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', backgroundSettings.gradientStops);
      onUpdateBackground({ ...backgroundSettings, gradient });
    }
  }, [bgStyle, backgroundSettings.gradientStops, backgroundSettings.gradient, onUpdateBackground]);

  // Initialize gradient stops if they don't exist
  useEffect(() => {
    if (bgStyle === 'Gradient' && !backgroundSettings.gradientStops) {
      const stops = [
        { color: '#63D0CD', offset: 0, opacity: 100 },
        { color: '#4B3EFE', offset: 100, opacity: 100 }
      ];
      onUpdateBackground({
        ...backgroundSettings,
        gradientType: 'Linear',
        gradientStops: stops,
        gradient: generateGradientString('Linear', stops)
      });
    }
  }, [bgStyle, backgroundSettings.gradientStops, onUpdateBackground]);

  // Effect to handle opening picker for newly added stop
  useEffect(() => {
    if (pendingNewStopOffset !== null && backgroundSettings.gradientStops) {
      // Find the stop with the matching offset
      // Since offsets are integers 0-100, exact match should work given we set it from rounded val
      const index = backgroundSettings.gradientStops.findIndex(s => s.offset === pendingNewStopOffset);
      if (index !== -1) {
        openGradientStopPicker(index);
        setPendingNewStopOffset(null);
      }
    }
  }, [backgroundSettings.gradientStops, pendingNewStopOffset]);

  const updateGradientStop = (index, updates) => {
    const newStops = [...(backgroundSettings.gradientStops || [])];
    newStops[index] = { ...newStops[index], ...updates };
    const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', newStops);
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const removeGradientStop = (index) => {
    if (backgroundSettings.gradientStops.length <= 2) return;
    const newStops = backgroundSettings.gradientStops.filter((_, i) => i !== index);
    const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', newStops);
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const addGradientStop = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)));
    const color = getColorAtOffset(offset, backgroundSettings.gradientStops || []);
    const newStop = { color: color, offset, opacity: 100 };
    const newStops = [...(backgroundSettings.gradientStops || []), newStop].sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', newStops);
    
    // Set position for picker to open
    setPickerPos({ x: e.clientX - 100, y: rect.top - 100 });
    setPendingNewStopOffset(offset);
    
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const reverseGradient = () => {
    const newStops = [...(backgroundSettings.gradientStops || [])].map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', newStops);
    onUpdateBackground({ ...backgroundSettings, gradientStops: newStops, gradient });
  };

  const resetGradient = () => {
    const newStops = [
      { color: '#63D0CD', offset: 0, opacity: 100 },
      { color: '#4B3EFE', offset: 100, opacity: 100 }
    ];
    const gradient = generateGradientString('Linear', newStops);
    onUpdateBackground({
      ...backgroundSettings,
      gradientType: 'Linear',
      gradientStops: newStops,
      gradient
    });
  };

  const openGradientStopPicker = (index) => {
    const stop = backgroundSettings.gradientStops[index];
    setGradientStopHex(stop.color);
    const rgbObj = hexToRgb(stop.color);
    const hsvObj = rgbToHsv(rgbObj.r, rgbObj.g, rgbObj.b);
    setGradientStopRgb(rgbObj);
    setGradientStopHsv(hsvObj);
    setEditingGradientStopIndex(index);
  };





  const handleModalFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImageData = { id: Date.now(), url: event.target.result };
      setUploadedImages((prev) => [newImageData, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const setBgStyle = (style) => {
    setSelectedTheme(null);
    if (style === 'Gradient' && backgroundSettings.gradientStops) {
      const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', backgroundSettings.gradientStops);
      onUpdateBackground({ ...backgroundSettings, style, gradient });
    } else if (style === 'Solid' && backgroundSettings.savedSolidColor) {
      onUpdateBackground({ ...backgroundSettings, style, color: backgroundSettings.savedSolidColor });
    } else {
      onUpdateBackground({ ...backgroundSettings, style });
    }
  };

  const handleColorSelect = (color) => {
    setSelectedTheme(null);
    onUpdateBackground({ ...backgroundSettings, style: 'Solid', color });
  };





  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Remove calls to undefined state setters (setShowBgStyleDropdown, etc.)
      if (!e.target.closest('.dropdown-container') && !e.target.closest('.color-picker-trigger') && !e.target.closest('.gradient-stop-trigger')) {
        if (!e.target.closest('.color-picker-popup')) {
          setShowColorPicker(false);
          setShowShadowColorPicker(false);
          setEditingGradientStopIndex(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white font-sans relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw] text-gray-700">
          <Icon 
            icon={activeSub === 'background' ? 'mdi:texture' : activeSub === 'layout' ? 'lucide:layout-dashboard' : 'lucide:settings-2'} 
            className="w-[1vw] h-[1vw] font-semibold" 
          />
          <span className="text-[1.1vw] font-semibold text-gray-900">
            {activeSub === 'background' ? 'Background' : activeSub === 'layout' ? 'Layout' : 'Book Appearance'}
          </span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white pb-[2.5vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(activeSub === 'background' || activeSub === 'background_fetch') ? (
          <>
            <div className="p-[1vw] flex flex-col">
              {/* Tabs */}
              <div className="flex items-center gap-[0.55vw] mb-[1.5vw]">
                <button 
                  onClick={() => setActiveTab('Background')} 
                  className={`px-[1.1vw] py-[0.50vw] text-[0.80vw] font-semibold rounded-[0.75vw] transition-all active:scale-95 border border-transparent ${
                    activeTab === 'Background' 
                      ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-500/20' 
                      : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] border-white-800/20 hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                  }`}
                >
                  Background
                </button>
                <button 
                  onClick={() => setActiveTab('Themes')} 
                  className={`px-[1.1vw] py-[0.50vw] text-[0.80vw] font-semibold rounded-[0.75vw] transition-all active:scale-95 border border-transparent ${
                    activeTab === 'Themes' 
                      ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-100/20' 
                      : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                  }`}
                >
                  Themes
                </button>
                <button 
                  onClick={() => setActiveTab('Animations')} 
                  className={`px-[1.1vw] py-[0.50vw] text-[0.80vw] font-semibold rounded-[0.75vw] transition-all active:scale-95 border border-transparent ${
                    activeTab === 'Animations' 
                      ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-100/20' 
                      : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'
                  }`}
                >
                  Animations
                </button>
              </div>

              {activeTab === 'Background' && (
                <>
                   <div className="flex items-center gap-[3.5vw] mb-[0.5vw]">
                    {/* Background Style Dropdown */}
                    <PremiumDropdown 
                      options={['Solid', 'Gradient', 'Image']}
                      value={bgStyle}
                      onChange={(style) => setBgStyle(style)}
                      width="7vw"
                    />

                    {bgStyle === 'Gradient' && (
                      <PremiumDropdown 
                        options={['Linear', 'Radial', 'Angular', 'Diamond']}
                        value={backgroundSettings.gradientType || 'Linear'}
                        onChange={(type) => onUpdateBackground({ ...backgroundSettings, gradientType: type })}
                        width="8vw"
                      />
                    )}

                    {/* Image Fit Dropdown */}
                    {bgStyle === 'Image' && (
                      <PremiumDropdown 
                        options={['Fit', 'Fill', 'Stretch']}
                        value={backgroundSettings.fit}
                        onChange={(fill) => onUpdateBackground({ ...backgroundSettings, fit: fill })}
                        width="8vw"
                      />
                    )}
                  </div>

                  {bgStyle === 'Solid' ? (
                    <>
                      {/* Pick Colors From Pallet */}
                      <div className="mb-[2vw]">
                        <div className="flex items-center gap-[0.75vw] mb-[1.25vw] pt-[1vw]">
                          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Pick Colors From Pallet</span>
                          <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                        </div>
                        
                        <div className="flex items-center justify-between pl-[0.5vw]">
                          <span className="text-[0.85vw] font-semibold text-gray-700 w-[3vw]">Fill :</span>
                          <div className="flex-1 flex gap-[0.5vw] items-center color-picker-trigger">
                            <div 
                              className="w-[2vw] h-[1.75vw] rounded-[0.275vw] border-gray-200 shadow-inner cursor-pointer hover:border-indigo-400 transition-colors" 
                              style={{ backgroundColor: (backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color }}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setPickerPos({ x: rect.left - 100, y: rect.top - 100 });
                                setShowColorPicker(true);
                              }}
                            />
                            <div className="flex-1 h-[2.25vw] border border-gray-100/50 rounded-[0.75vw] flex items-center px-[0.75vw] justify-between bg-white shadow-[inset_0.15vw_0.15vw_0.4vw_rgba(0,0,0,0.04)]">
                              <span className="text-[0.8vw] font-bold text-gray-400">{(backgroundSettings.style === 'ReactBits' && backgroundSettings.savedSolidColor) ? backgroundSettings.savedSolidColor : backgroundSettings.color}</span>
                              <span className="text-[0.8vw] font-bold text-gray-400">100%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Solid Colors Section */}
                      <div className="mb-[1.5vw]">
                        <div className="flex items-center gap-[0.75vw] mb-[1.25vw]">
                          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Solid Colors</span>
                          <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                        </div>
                        
                        <div className="grid grid-cols-6 gap-[0.625vw] px-[0.25vw]">
                          {solidPalette.map((color, i) => (
                            <button 
                              key={i}
                              onClick={() => handleColorSelect(color)}
                              className={`aspect-square rounded-[0.5vw] border shadow-sm transition-all hover:scale-110 ${backgroundSettings.color.toLowerCase() === color.toLowerCase() ? 'border-[#3E4491] border-[0.125vw] ring-[0.125vw] ring-indigo-100 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : bgStyle === 'Gradient' ? (
                    <div className="space-y-[1.5vw] pt-[1vw]">
                      {/* Customize your Color Section */}
                      <div>
                        <div className="flex items-center gap-[0.75vw] mb-[2vw]">
                          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Customize your Color</span>
                          <div className="h-[0.1vw] bg-gray-200 flex-1"></div>
                          <div className="flex gap-[0.5vw]">
                            <button 
                              onClick={resetGradient} 
                              className="w-[2.25vw] h-[2.25vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors"
                              title="Reset Gradient"
                            >
                              <RotateCcw size="1.2vw" className="text-gray-600" />
                            </button>
                            <button 
                              onClick={reverseGradient} 
                              className="w-[2.25vw] h-[2.25vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.5vw] shadow-[0_0.2vw_0.4vw_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors"
                              title="Swap Directions"
                            >
                              <ArrowLeftRight size="1.2vw" className="text-gray-600" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Gradient Bar */}
                        <div className="relative pt-[1.5vw] pb-[0.5vw] px-[0.25vw] mb-[1.5vw]">
                          <div className="absolute top-0 left-0 w-full h-[2vw] flex items-center pointer-events-none px-[0.25vw]">
                            {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                              <div
                                key={idx}
                                className="absolute -translate-x-1/2 flex flex-col items-center group pointer-events-auto cursor-grab active:cursor-grabbing"
                                style={{ left: `${stop.offset}%`, bottom: '0.5vw' }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const startX = e.clientX;
                                  const startOffset = stop.offset;
                                  let hasDragged = false;
                                  const barElement = e.currentTarget.parentElement.parentElement;
                                  const rect = barElement.getBoundingClientRect();
                                  const handleMouseMove = (moveEvent) => {
                                    const deltaX = moveEvent.clientX - startX;
                                    if (Math.abs(deltaX) > 3) { // Threshold for drag
                                      hasDragged = true;
                                      const deltaPercent = (deltaX / rect.width) * 100;
                                      const newOffset = Math.min(100, Math.max(0, startOffset + deltaPercent));
                                      updateGradientStop(idx, { offset: Math.round(newOffset) });
                                    }
                                  };
                                  const handleMouseUp = () => {
                                    window.removeEventListener('mousemove', handleMouseMove);
                                    window.removeEventListener('mouseup', handleMouseUp);
                                    if (!hasDragged) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setPickerPos({ x: rect.left - 100, y: rect.top - 100 });
                                      openGradientStopPicker(idx);
                                    }
                                  };
                                  window.addEventListener('mousemove', handleMouseMove);
                                  window.addEventListener('mouseup', handleMouseUp);
                                }}
                              >
                                <div className="w-[1.5vw] h-[1.5vw] rounded-[0.4vw] border-2 border-white shadow-md relative hover:scale-110 transition-transform" style={{ backgroundColor: stop.color }}>
                                  <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[0.3vw] border-l-transparent border-r-[0.3vw] border-r-transparent border-t-[0.4vw] border-t-white"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div
                            className="w-full h-[1.5vw] rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy"
                            onClick={addGradientStop}
                            style={{
                              background: `linear-gradient(to right, ${(backgroundSettings.gradientStops || []).map(s => {
                                const rgb = hexToRgb(s.color);
                                const opacity = (s.opacity || 100) / 100;
                                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity}) ${s.offset}%`;
                              }).join(', ')})`
                            }}
                          ></div>
                        </div>

                        <div className="space-y-[0.75vw]">
                          {(backgroundSettings.gradientStops || []).map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-[0.75vw]">
                              <div 
                                className="w-[2.25vw] h-[2.25vw] rounded-[0.5vw] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors" 
                                style={{ backgroundColor: stop.color }}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPickerPos({ x: rect.left - 240, y: rect.top - 100 });
                                  openGradientStopPicker(idx);
                                }}
                              />
                              <div className="flex-1 h-[2.25vw] border border-gray-600 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white">
                                <span className="text-[0.85vw] font-medium text-gray-700 font-mono">{stop.color.toUpperCase()}</span>
                                <span className="text-[0.85vw] font-medium text-gray-700">{stop.opacity || 100}%</span>
                              </div>
                              <button 
                                onClick={() => removeGradientStop(idx)}
                                className="w-[2.25vw] h-[2.25vw] flex items-center justify-center border border-red-500 rounded-[0.5vw] text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Minus size="1.2vw" strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gradient Colors Section */}
                      <div>
                        <div className="flex items-center gap-[0.75vw] mb-[1.5vw]">
                          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Gradient Colors</span>
                          <div className="h-[0.0925vw] bg-gray-200 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-[0.625vw] px-[0.25vw]">
                          {[
                            ['#FF5F6D', '#FFC371'], ['#6366F1', '#A855F7'], ['#2DD4BF', '#22D3EE'], 
                            ['#84CC16', '#4ADE80'], ['#FDE047', '#FEF08A'], ['#EC4899', '#F472B6'],
                            ['#A5B4FC', '#E0E7FF'], ['#D946EF', '#F0ABFC'], ['#06B6D4', '#67E8F9'],
                            ['#9CA3AF', '#D1D5DB'], ['#A48D00', '#71AA13'], ['#DB2777', '#F43F5E']
                          ].map((colors, i) => (
                            <button 
                              key={i}
                              onClick={() => {
                                const newStops = [
                                  { color: colors[0], offset: 0, opacity: 100 },
                                  { color: colors[1], offset: 100, opacity: 100 }
                                ];
                                const gradient = generateGradientString(backgroundSettings.gradientType || 'Linear', newStops);
                                onUpdateBackground({
                                  ...backgroundSettings,
                                  gradientStops: newStops,
                                  gradient
                                });
                              }}
                              className="aspect-square rounded-[0.5vw] border border-gray-200 shadow-sm transition-all hover:scale-110"
                              style={{ background: `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="pr-4 pl-4 space-y-2">
                        {/* Upload Image Section */}
                        <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs pt-[1vw] font-semibold text-gray-800 whitespace-nowrap">Upload Image to background</span>
                          <div className="h-[1px] flex-grow bg-gray-100"></div>
                        </div>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                onUpdateBackground({ ...backgroundSettings, image: event.target.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
 
                        {backgroundSettings.image ? (
                          <div className="flex items-center justify-between gap-2 px-1">
                            {/* Thumbnail with Delete Overlay */}
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className="relative w-[85px] h-[55px] rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={backgroundSettings.image} alt="Thumbnail" className="w-full h-full object-cover" />
                                <div 
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateBackground({ ...backgroundSettings, image: null });
                                  }}
                                >
                                  <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 text-center">Image</span>
                            </div>
 
                            <div className="flex items-center justify-center">
                              <Icon icon="lucide:arrow-right-left" className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            
                            {/* Replacement Box */}
                            <div className="flex flex-col items-center">
                              <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-[110px] h-[55px] border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500  transition-all"
                              >
                                <Icon icon="lucide:upload" className="w-4 h-4 text-gray-400 mb-0.5" />
                                <p className="text-[9px] font-semibold text-gray-500 text-center">drag & drop or <span className="text-indigo-500 text-center ">Upload</span></p>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-1 font-semibold text-center">Supported File Format : JPG, PNG</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center w-full">
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full max-w-[210px] h-30 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500 transition-all group"
                            >
                              <Icon icon="lucide:upload" className="w-6 h-6 text-gray-400 mb-0.5" strokeWidth={2.5} />
                              <p className="text-xs font-semibold text-gray-500 text-center">drag & drop or <span className="text-indigo-500 text-center">Upload</span></p>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1.5 font-semibold text-center">Supported File Format : JPG, PNG</p>
                          </div>
                        )}
 
                        <button 
                          onClick={() => setShowGallery(true)}
                          className="w-full h-12 bg-black text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-zinc-800 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95 active:shadow-inner"
                        >
                          <Icon icon="lucide:layout-grid" className="w-5 h-5" />
                          Image Gallery
                        </button>
                      </div>

                  {/* Opacity Slider - Only show when image is uploaded */}
                  {backgroundSettings.image && (
                    <div className="space-y-1 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800 ">Opacity</span>
                       <div className="h-[2px] flex-grow bg-gray-200"></div>
                        </div>
                    <div className="relative h-6 flex items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={backgroundSettings.opacity} 
                        onChange={(e) => onUpdateBackground({ ...backgroundSettings, opacity: parseInt(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                              style={{ 
                                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${backgroundSettings.opacity}%, #f3f4f6 ${backgroundSettings.opacity}%, #f3f4f6 100%)` 
                              }}
                      />
                      <span className="text-xs font-semibold text-gray-600">{backgroundSettings.opacity}%</span>
                   </div>
                  </div>
                  )}

                  {/* Adjustments Section - Only show when image is uploaded */}
                  {backgroundSettings.image && (
                    <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-xs font-semibold text-gray-800 mb-3 whitespace-nowrap">Adjustments</span>
                      <div className="h-[2px] flex-grow bg-gray-200"></div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { label: 'Exposure', key: 'exposure', min: -100, max: 100 },
                        { label: 'Contrast', key: 'contrast', min: -100, max: 100 },
                        { label: 'Saturation', key: 'saturation', min: -100, max: 100 },
                        { label: 'Temperature', key: 'temperature', min: -100, max: 100 },
                        { label: 'Tint', key: 'tint', min: -180, max: 180 },
                        { label: 'Highlights', key: 'highlights', min: -100, max: 100 },
                        { label: 'Shadows', key: 'shadows', min: -100, max: 100 },
                      ].map((adj) => {
                        const val = backgroundSettings.adjustments?.[adj.key] || 0;
                        const percentage = ((val - adj.min) / (adj.max - adj.min)) * 100;
                        return (
                          <div key={adj.key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DraggableSpan 
                                  label={adj.label} 
                                  value={val} 
                                  onChange={(v) => {
                                    onUpdateBackground({
                                      ...backgroundSettings,
                                      adjustments: {
                                        ...backgroundSettings.adjustments,
                                        [adj.key]: v
                                      }
                                    });
                                  }}
                                  min={adj.min} 
                                  max={adj.max} 
                                  className="text-xs font-semibold text-gray-600" 
                                />
                                <button 
                                  onClick={() => {
                                    onUpdateBackground({
                                      ...backgroundSettings,
                                      adjustments: {
                                        ...backgroundSettings.adjustments,
                                        [adj.key]: 0
                                      }
                                    });
                                  }}
                                  className="text-gray-300 hover:text-indigo-600 transition-colors"
                                  title={`Reset ${adj.label}`}
                                >
                                  <Icon icon="lucide:rotate-ccw" className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400">{val}</span>
                            </div>
                            <input 
                              type="range" 
                              min={adj.min} 
                              max={adj.max} 
                              value={val} 
                              onChange={(e) => {
                                onUpdateBackground({
                                  ...backgroundSettings,
                                  adjustments: {
                                    ...backgroundSettings.adjustments,
                                    [adj.key]: parseInt(e.target.value)
                                  }
                                });
                              }}
                              className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                              style={{ 
                                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, #f3f4f6 ${percentage}%, #f3f4f6 100%)` 
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}
                    </div>
                  </div>
                  )}
                </>
              )}

              {activeTab === 'Themes' && (
                <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                  {/* None Option */}
                  <div 
                    onClick={() => {
                      setSelectedTheme(null);
                      onUpdateBackground({ 
                        ...backgroundSettings, 
                        style: 'Solid', 
                        reactBitType: null,
                        color: backgroundSettings.savedSolidColor || backgroundSettings.color 
                      });
                    }} 
                    className="group cursor-pointer flex flex-col gap-2"
                  >
                    <div className={`aspect-video w-full h-20 rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${!selectedTheme ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                      <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
                      <div className="absolute inset-x-0 bottom-0 py-1 px-2 text-center bg-gray/40 backdrop-blur-md ">
                        <span className="text-[9px] font-semibold text-center text-gray-800">None</span>
                      </div>
                    </div>
                  </div>

                   {Object.keys(backgroundComponents).sort().map((name) => (
                     <div key={name} onClick={() => setSelectedTheme(name)} className="group cursor-pointer flex flex-col gap-2">
                        <div className={`aspect-video w-full h-20 rounded-lg bg-black border-2 relative overflow-hidden transition-all ${selectedTheme === name ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                           {/* Preview Miniatures (Simplified) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               {name === 'Antigravity' && <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-pink-400 rotate-45"></div><div className="w-1.5 h-1.5 rounded-full bg-pink-300 -rotate-12"></div><div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div></div>}
                               {name === 'ColorBlends' && <div className="w-full h-full bg-gradient-to-bl from-pink-400 via-purple-500 to-blue-600 opacity-50"></div>}
                               {name === 'DarkVeil' && <div className="w-full h-full bg-black/80 flex items-center justify-center"><div className="w-full h-[1px] bg-red-500/30 blur-[1px]"></div></div>}
                               {name === 'DotGrid' && <div className="grid grid-cols-3 gap-1 opacity-40"><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>}
                               {name === 'FloatingLines' && <div className="flex flex-col gap-1.5 opacity-40"><div className="w-8 h-[1px] bg-blue-300"></div><div className="w-8 h-[1px] bg-pink-300 translate-x-2"></div><div className="w-8 h-[1px] bg-blue-300"></div></div>}
                               {name === 'Galaxy' && <div className="text-white text-[10px] opacity-60">✨🌌</div>}
                               {name === 'GridScan' && <div className="w-full h-full bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:8px_8px]"><div className="w-full h-[2px] bg-cyan-400/30"></div></div>}
                               {name === 'Hyperspeed' && <div className="flex gap-0.5"><div className="w-10 h-[1px] bg-blue-400/50"></div><div className="w-10 h-[1px] bg-red-400/50"></div></div>}
                               {name === 'Iridescence' && <div className="w-full h-full bg-gradient-to-tr from-green-300 via-blue-300 to-purple-300 opacity-40 blur-sm"></div>}
                                {name === 'LightPillar' && <div className="flex gap-1.5 items-end"><div className="w-[2px] h-8 bg-white/40 shadow-[0_0_5px_white]"></div><div className="w-[1.5px] h-6 bg-white/20"></div></div>}
                               {name === 'LightRays' && <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1),transparent)] flex items-end justify-center"><div className="w-[1px] h-full bg-white/20 rotate-12"></div></div>}
                               {name === 'LiquidEther' && <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#5227FF33,_#000)] blur-[3px]"></div>}
                               {name === 'Orb' && <div className="w-6 h-6 rounded-full bg-indigo-500/40 blur-[4px]"></div>}
                                {name === 'Particles' && <div className="grid grid-cols-4 gap-1 opacity-50"><div className="w-1 h-1 bg-white rounded-full translate-x-1 translate-y-2"></div><div className="w-0.5 h-0.5 bg-blue-300 rounded-full"></div><div className="w-1 h-1 bg-white rounded-full"></div></div>}
                               {name === 'PixelSnow' && <div className="grid grid-cols-4 gap-2 opacity-60"><div className="w-0.5 h-0.5 bg-white"></div><div className="w-0.5 h-0.5 bg-white"></div><div className="w-0.5 h-0.5 bg-white"></div></div>}
                               {name === 'Prism' && <div className="w-4 h-4 rotate-45 border border-white/30 bg-white/5"></div>}
                               {name === 'PrismaticBurst' && <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)]"></div>}
                               {name === 'Silk' && <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 opacity-50 blur-[2px]"></div>}
                               {name === 'SplashCursor' && <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,100,0.1),transparent)]"></div>}
                               {name === 'Threads' && <div className="w-full h-full opacity-40 overflow-hidden flex flex-col gap-0.5"><div className="w-full h-[1px] bg-white opacity-20 -rotate-12 translate-y-2"></div><div className="w-full h-[1px] bg-white opacity-40 -rotate-12 translate-y-1"></div><div className="w-full h-[1px] bg-white opacity-30 -rotate-12"></div></div>}
                               {name === 'Waves' && <div className="w-full h-full border-t border-white/20 mt-4 rounded-full"></div>}
                            </div>
                           
                           <div className="absolute inset-x-0 bottom-0 py-1 px-2 text-center bg-black/10 backdrop-blur-sm ">
                              <span className="text-[9px] font-semibold text-center text-white">{name}</span>
                           </div>
                        </div>
                     </div>
                  ))}
                </div>
              )}

              {activeTab === 'Animations' && (
                <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                  {/* None Option */}
                  <div 
                    onClick={() => onUpdateBackground({ ...backgroundSettings, animation: 'None' })} 
                    className="group cursor-pointer flex flex-col gap-2"
                  >
                    <div className={`aspect-video w-full h-20 rounded-lg bg-gray-50 border-2 relative overflow-hidden transition-all flex items-center justify-center ${backgroundSettings.animation === 'None' || !backgroundSettings.animation ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}>
                      <Icon icon="lucide:ban" className="w-6 h-6 text-gray-300" />
                      <div className="absolute inset-x-0 bottom-0 py-1 px-2 text-center bg-gray/40 backdrop-blur-md ">
                        <span className="text-[9px] font-semibold text-center text-gray-800">None</span>
                      </div>
                    </div>
                  </div>

                  {Object.keys(animationComponents).sort().map((name) => (
                    <div 
                      key={name} 
                      onClick={() => onUpdateBackground({ ...backgroundSettings, animation: name })} 
                      className="group cursor-pointer flex flex-col gap-2"
                    >
                      <div className={`aaspect-video w-full h-20 rounded-lg bg-black border-2 relative overflow-hidden transition-all ${backgroundSettings.animation === name ? 'border-gray shadow-md ring-2 ring-gray-100 scale-[1.09]' : 'border-gray-100 hover:border-gray-200'}`}>
                        {/* Animation Miniatures */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/10">
                          {name === 'FallingLeaves' && <div className="text-red-500 text-[10px] animate-bounce">🍂</div>}
                          {name === 'Snow' && <div className="text-white text-[12px] animate-pulse">❄️</div>}
                          {name === 'Bubbles' && <div className="w-4 h-2 rounded-full border border-blue-300/50 bg-blue-100/20"></div>}
                          {name === 'Confetti' && <div className="flex gap-0.5"><div className="w-1 h-1 bg-red-400"></div><div className="w-1 h-1 bg-yellow-400"></div><div className="w-1 h-1 bg-blue-400"></div></div>}
                          {name === 'Rain' && <div className="w-[1px] h-3 bg-blue-400 rotate-[15deg] opacity-50"></div>}
                          {name === 'Fireflies' && <div className="w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_5px_#fef08a]"></div>}
                          {name === 'Matrix' && <div className="text-[8px] text-green-500 font-mono">1010</div>}
                          {name === 'Hearts' && <div className="text-red-400 text-[10px]">❤</div>}
                          {name === 'TwinklingStars' && <div className="text-white text-[10px]">⭐</div>}
                          {name === 'Petals' && <div className="text-pink-300 text-[10px]">🌸</div>}
                          {name === 'BinaryRain' && <div className="text-[6px] text-green-700 font-mono">0110</div>}
                          {name === 'Balloons' && <div className="w-5 h-3 bg-red-600 rounded-t-full"></div>}
                          {name === 'Lightning' && <Icon icon="lucide:zap" className="w-4 h-4 text-yellow-300" />}
                          {name === 'Orbs' && <div className="w-4 h-4 rounded-full bg-indigo-400/30 blur-[2px]"></div>}
                          {name === 'Scanlines' && <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]"></div>}
                          {name === 'Fireworks' && <div className="text-orange-400 text-[10px]">🎆</div>}
                          {name === 'Glitch' && <div className="w-4 h-2 bg-blue-500/30 skew-x-12"></div>}
                          {name === 'Butterflies' && <div className="text-purple-400 text-[10px]">🦋</div>}
                          {name === 'Clouds' && <Icon icon="lucide:cloud" className="w-4 h-4 text-white opacity-40" />}
                          {name === 'SpaceWarp' && <div className="text-white text-[8px]">✨🚀</div>}
                          {name === 'Jellyfish' && <div className="text-cyan-400 text-[10px]">🏮</div>}
                          {name === 'PaperPlanes' && <Icon icon="lucide:send" className="w-4 h-4 text-white/40" />}
                          {name === 'MusicalNotes' && <div className="text-white/40 text-[10px]">♪♫</div>}
                          {name === 'AutumnMix' && <div className="text-orange-600 text-[10px]">🍂🎃</div>}
                          {name === 'FloatingGeo' && <div className="w-3 h-3 border border-white/20 rotate-45"></div>}
                          {name === 'DustMotes' && <div className="w-0.5 h-0.5 bg-white/40 rounded-full"></div>}
                          {name === 'Nebula' && <div className="w-6 h-6 rounded-full bg-purple-500/20 blur-[4px]"></div>}
                          {name === 'Birds' && <div className="text-black/40 text-[10px]">🐦</div>}
                          {name === 'Plankton' && <div className="w-1 h-1 bg-cyan-200/30 rounded-full"></div>}
                          {name === 'FireEmbers' && <div className="w-1 h-1 bg-orange-500 rounded-full"></div>}
                          {name === 'WaterDrops' && <div className="w-2 h-3 bg-blue-200/20 rounded-full"></div>}
                          {name === 'Mist' && <div className="w-full h-2 bg-white/20 blur-[2px] mt-4"></div>}
                          {name === 'Disco' && <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-blue-500 opacity-40"></div>}
                          {name === 'Meteors' && <div className="w-4 h-[1px] bg-white rotate-45"></div>}
                          {name === 'Sparkles' && <div className="text-yellow-200 text-[10px]">✨</div>}
                        </div>
                        
                       <div className="absolute inset-x-0 bottom-0 py-1 px-2 text-center bg-black/10 backdrop-blur-sm ">
                              <span className="text-[9px] font-semibold text-center text-white">{name}</span>
                           </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : activeSub === 'bookappearance' ? (
          <div className="p-[1vw] space-y-[2vw]">
            {/* Book Paper Texture */}
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
                <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Book Paper Texture</span>
                <div className="h-[0.0925vw] bg-gray-200 flex-grow"></div>
              </div>
              <p className="text-[0.625vw] text-gray-400 mb-[0.75vw]">
                The chosen paper texture will be applied to every page of the flipbook.
              </p>
              
              <div className="flex items-center justify-between gap-[0.75vw]">
                 <div className="w-[3vw] h-[3vw] bg-gray-100 rounded-[0.5vw] border border-gray-200"></div>
                 
                 <div className="flex-1 space-y-[0.75vw]">
                    <div className="flex items-center justify-between">
                       <span className="text-[0.85vw] font-semibold text-gray-700">Texture :</span>
                        <PremiumDropdown 
                          options={['Plain White', 'Soft Matte Paper', 'Premium Art Paper', 'Photo Album Paper', 'Soft Linen Paper', 'Light Grain Paper', 'Fine Texture Paper', 'Smooth Print Paper']}
                          value={bookAppearanceSettings?.texture || 'Soft Matte Paper'}
                          onChange={(opt) => onUpdateBookAppearance({...bookAppearanceSettings, texture: opt})}
                          width="11.5vw"
                        />
                     </div>
                    
                    <div className="flex items-center justify-between">
                       <span className="text-[0.85vw] font-semibold text-gray-700">Hard Cover Pages</span>
                       <div className="flex items-center gap-[0.5vw]">
                          <Icon icon="lucide:info" className="text-gray-400 w-[0.875vw] h-[0.875vw]" />
                          <button 
                            onClick={() => onUpdateBookAppearance({...bookAppearanceSettings, hardCover: !bookAppearanceSettings?.hardCover})}
                            className={`w-[2.25vw] h-[1.125vw] rounded-full relative transition-colors ${bookAppearanceSettings?.hardCover ? 'bg-indigo-500' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute top-[0.125vw] w-[0.875vw] h-[0.875vw] bg-white rounded-full shadow-sm transition-transform ${bookAppearanceSettings?.hardCover ? 'left-[1.25vw]' : 'left-[0.125vw]'}`} />
                          </button>
                       </div>
                    </div>
                  </div>
               </div>

              {['Grain Intensity', 'Warmth', 'Texture Scale'].map((label) => {
                 const key = label.toLowerCase().replace(' ', '');
                 const mapKey = label === 'Grain Intensity' ? 'grainIntensity' : label === 'Texture Scale' ? 'textureScale' : 'warmth';
                 const val = bookAppearanceSettings?.[mapKey] || 0;
                 
                 return (
                   <div key={label} className="flex items-center justify-between gap-[0.75vw]">
                     <div className="flex items-center gap-[0.5vw] w-[7vw]">
                       <span className="text-[0.85vw] font-semibold text-gray-700">{label}</span>
                       <Icon icon="lucide:rotate-ccw" className="w-[0.75vw] h-[0.75vw] text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => onUpdateBookAppearance({...bookAppearanceSettings, [mapKey]: 0})} />
                     </div>
                     <input
                        type="range"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => onUpdateBookAppearance({...bookAppearanceSettings, [mapKey]: parseInt(e.target.value)})}
                        className="flex-1 h-[0.25vw] bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        style={{ background: `linear-gradient(to right, #6366f1 ${val}%, #e5e7eb ${val}%)` }}
                     />
                     <span className="text-[0.6875vw] font-medium text-gray-500 w-[2vw] text-right">{val}%</span>
                   </div>
                 )
              })}
              
               <div className="flex items-center justify-between gap-[0.75vw]">
                   <div className="flex items-center gap-[0.5vw] w-[7vw]">
                     <span className="text-[0.85vw] font-semibold text-gray-700">Opacity</span>
                     <Icon icon="lucide:rotate-ccw" className="w-[0.75vw] h-[0.75vw] text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => onUpdateBookAppearance({...bookAppearanceSettings, opacity: 0})} />
                   </div>
                   <input
                      type="range"
                      min="0"
                      max="100"
                      value={bookAppearanceSettings?.opacity || 0}
                      onChange={(e) => onUpdateBookAppearance({...bookAppearanceSettings, opacity: parseInt(e.target.value)})}
                      className="flex-1 h-[0.25vw] bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      style={{ background: `linear-gradient(to right, #6366f1 ${(bookAppearanceSettings?.opacity || 0)}%, #e5e7eb ${(bookAppearanceSettings?.opacity || 0)}%)` }}
                   />
                   <span className="text-[0.6875vw] font-medium text-gray-500 w-[2vw] text-right">{bookAppearanceSettings?.opacity || 0}%</span>
               </div>
            </div>

            {/* Page Flipping Styles */}
            <div className="space-y-[0.75vw]">
               <div className="flex items-center gap-[0.75vw]">
                 <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Page Flipping Styles</span>
                 <div className="h-[0.0925vw] bg-gray-200 flex-grow"></div>
               </div>
               
               <div className="flex items-center justify-between">
                  <span className="text-[0.85vw] font-semibold text-gray-700">Select Flip Style :</span>
                  <PremiumDropdown 
                    options={['Classic Flip', 'Smooth Flip', 'Fast Flip', 'Page Curl', '3D Flip', 'Slide Pages']}
                    value={bookAppearanceSettings?.flipStyle || 'Classic Flip'}
                    onChange={(opt) => onUpdateBookAppearance({...bookAppearanceSettings, flipStyle: opt})}
                    width="10vw"
                  />
               </div>
               
               <div className="flex items-center justify-between">
                  <span className="text-[0.85vw] font-semibold text-gray-700">Page Flip Speed :</span>
                  <PremiumDropdown 
                    options={['Slow', 'Medium', 'Fast']}
                    value={bookAppearanceSettings?.flipSpeed || 'Slow'}
                    onChange={(opt) => onUpdateBookAppearance({...bookAppearanceSettings, flipSpeed: opt})}
                    width="10vw"
                  />
               </div>
            </div>

            {/* Book Corner Radius */}
            <div className="space-y-[0.75vw]">
               <div className="flex items-center gap-[0.75vw]">
                 <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Book Corner Radius</span>
                 <div className="h-[0.0925vw] bg-gray-200 flex-grow"></div>
               </div>
               
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[0.5vw]">
                     <Icon icon="lucide:scan" className="text-gray-400 w-[1vw] h-[1vw]" />
                     <span className="text-[0.85vw] font-semibold text-gray-700">Corner Radius :</span>
                  </div>
                  <PremiumDropdown 
                    options={['Sharp', 'Soft', 'Round']}
                    value={bookAppearanceSettings?.corner || 'Sharp'}
                    onChange={(opt) => onUpdateBookAppearance({...bookAppearanceSettings, corner: opt})}
                    width="10vw"
                  />
               </div>
            </div>

            {/* Drop Shadow */}
            <div className="space-y-[0.75vw]">
               <div className="flex items-center gap-[0.75vw]">
                 <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Drop Shadow</span>
                 <div className="h-[0.0925vw] bg-gray-200 flex-grow"></div>
               </div>

                <div className="flex items-center gap-[0.75vw]">
                   <div 
                      className="w-[4vw] h-[4vw] bg-gradient-to-br from-gray-800 to-black rounded-[0.5vw] flex items-center justify-center text-white/50 text-[0.6vw]"
                      style={{ background: `linear-gradient(135deg, ${bookAppearanceSettings?.dropShadow?.color || '#000'}, transparent)` }}
                       onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setShadowPickerPos({ x: rect.left - 100, y: rect.top - 100 });
                                setShowShadowColorPicker(true);
                            }}
                   >
                      {bookAppearanceSettings?.dropShadow?.opacity || 0}%
                   </div>
                   
                   <div className="flex-1 space-y-[0.5vw]">
                      <div className="flex items-center justify-start bg-white border border-gray-200 rounded-[0.375vw] p-[0.25vw]">
                         <span className="text-[0.725vw] text-gray-500 pl-[0.25vw]">Code :</span>
                         <div className="flex items-center gap-[6.25vw]">
                            <span className="text-[0.725vw] font-mono text-gray-700">{bookAppearanceSettings?.dropShadow?.color || '#000000'}</span>
                            <div className="w-[1vw] h-[1vw] relative cursor-pointer color-picker-trigger" 
                               >
                               <Icon icon="lucide:pen-line" className="w-[0.75vw] h-[0.75vw] text-gray-400" />
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-[0.5vw]">
                         <span className="text-[0.75vw] font-semibold text-gray-700 w-[3vw]">Opacity :</span>
                         <input
                            type="range"
                            min="0"
                            max="100"
                            value={bookAppearanceSettings?.dropShadow?.opacity || 0}
                            onChange={(e) => onUpdateBookAppearance({
                                ...bookAppearanceSettings, 
                                dropShadow: { ...bookAppearanceSettings.dropShadow, opacity: parseInt(e.target.value) }
                            })}
                            className="flex-1 h-[0.25vw] bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            style={{ background: `linear-gradient(to right, #6366f1 ${(bookAppearanceSettings?.dropShadow?.opacity || 0)}%, #e5e7eb ${(bookAppearanceSettings?.dropShadow?.opacity ||0)}%)` }}
                         />
                         <span className="text-[0.625vw] text-gray-500 w-[1.5vw] text-right">{bookAppearanceSettings?.dropShadow?.opacity || 0}%</span>
                      </div>
                   </div>
                </div>
                
                
                <div className="space-y-[0.5vw]">
                   <EffectControlRow 
                        label="X Axis" 
                        value={bookAppearanceSettings?.dropShadow?.xAxis || 0} 
                        onChange={(v) => onUpdateBookAppearance({...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, xAxis: v }})} 
                        min={-50} max={50} 
                   />
                   <EffectControlRow 
                        label="Y Axis" 
                        value={bookAppearanceSettings?.dropShadow?.yAxis || 0} 
                        onChange={(v) => onUpdateBookAppearance({...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, yAxis: v }})} 
                        min={-50} max={50} 
                   />
                   <EffectControlRow 
                        label="Blur %" 
                        value={bookAppearanceSettings?.dropShadow?.blur || 0} 
                        onChange={(v) => onUpdateBookAppearance({...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, blur: v }})} 
                        min={0} max={100} 
                   />
                   <EffectControlRow 
                        label="Spread" 
                        value={bookAppearanceSettings?.dropShadow?.spread || 0} 
                        onChange={(v) => onUpdateBookAppearance({...bookAppearanceSettings, dropShadow: { ...bookAppearanceSettings.dropShadow, spread: v }})} 
                        min={-20} max={50} 
                   />
                </div>
            </div>

            {/* Flipbook Instructions */}
            <div className="space-y-[0.75vw]">
               <div className="flex items-center gap-[0.75vw]">
                 <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Flipbook Instructions</span>
                 <div className="h-[0.0925vw] bg-gray-200 flex-grow"></div>
               </div>
               
               <div className="space-y-[0.5vw]">
                  <label className="flex items-center gap-[0.5vw] cursor-pointer">
                     <div className={`w-[0.875vw] h-[0.875vw] rounded-full border flex items-center justify-center ${bookAppearanceSettings?.instructions === 'first' ? 'border-indigo-500' : 'border-gray-300'}`}>
                        {bookAppearanceSettings?.instructions === 'first' && <div className="w-[0.4vw] h-[0.4vw] bg-indigo-500 rounded-full" />}
                     </div>
                     <input 
                        type="radio" 
                        name="instructions" 
                        checked={bookAppearanceSettings?.instructions === 'first'} 
                        onChange={() => onUpdateBookAppearance({...bookAppearanceSettings, instructions: 'first'})}
                        className="hidden" 
                     />
                     <span className="text-[0.8175vw] text-gray-700">Provide on Very first time only</span>
                  </label>
                  
                  <label className="flex items-center gap-[0.5vw] cursor-pointer">
                     <div className={`w-[0.875vw] h-[0.875vw] rounded-full border flex items-center justify-center ${bookAppearanceSettings?.instructions === 'every' ? 'border-indigo-500' : 'border-gray-300'}`}>
                        {bookAppearanceSettings?.instructions === 'every' && <div className="w-[0.4vw] h-[0.4vw] bg-indigo-500 rounded-full" />}
                     </div>
                     <input 
                        type="radio" 
                        name="instructions" 
                        checked={bookAppearanceSettings?.instructions === 'every'} 
                        onChange={() => onUpdateBookAppearance({...bookAppearanceSettings, instructions: 'every'})}
                        className="hidden" 
                     />
                     <span className="text-[0.8175vw] text-gray-700">Provide on Every time they open</span>
                  </label>
               </div>
            </div>
            
            {showShadowColorPicker && (
               <CustomColorPicker
                 color={bookAppearanceSettings?.dropShadow?.color || '#000000'}
                 opacity={100}
                 onChange={(newColor) => {
                    onUpdateBookAppearance({
                        ...bookAppearanceSettings,
                        dropShadow: { ...bookAppearanceSettings.dropShadow, color: newColor }
                    });
                 }}
                 onClose={() => setShowShadowColorPicker(false)}
                 position={shadowPickerPos}
               />
            )}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4 text-gray-400">
            <Icon icon={activeSub === 'layout' ? 'lucide:layout-dashboard' : 'lucide:settings-2'} className="w-16 h-16 opacity-20" />
            <p className="text-sm font-semibold">{activeSub} Settings<br/>Coming Soon</p>
          </div>
        )}
      </div>

       {showColorPicker && (
         <CustomColorPicker 
            color={backgroundSettings.color}
            onChange={(newColor) => {
              handleColorSelect(newColor);
            }}
            onClose={() => {
              setShowColorPicker(false);
            }}
            position={pickerPos}
          />
       )}

       {editingGradientStopIndex !== null && backgroundSettings.gradientStops && (
         <CustomColorPicker
           color={backgroundSettings.gradientStops[editingGradientStopIndex].color}
           opacity={backgroundSettings.gradientStops[editingGradientStopIndex].opacity}
           onChange={(newColor) => updateGradientStop(editingGradientStopIndex, { color: newColor })}
           onOpacityChange={(newOpacity) => updateGradientStop(editingGradientStopIndex, { opacity: newOpacity })}
           onClose={() => setEditingGradientStopIndex(null)}
           position={pickerPos}
         />
       )}

      {showGallery && (
        <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '50%', left: '120%', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 className="text-mg font-bold text-gray-900">Image Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <Icon icon="lucide:x" className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="px-4 py-2">
            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Upload your Image</h3>
            <p className="text-[11px] text-gray-400 mb-4">
              <span>You Can Reuse The File Which Is Uploaded In Gallery</span>
              <span className="text-red-500">*</span>
            </p>
            <div 
              onClick={() => galleryInputRef.current?.click()} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  handleModalFileUpload({ target: { files: [file] } });
                }
              }}
              className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group mb-2"
            >
              <p className="text-[13px] text-gray-500 font-normal mb-3">Drag & Drop or <span className="text-blue-600 font-semibold">Upload</span></p>
              <Icon icon="lucide:upload" className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-[11px] text-gray-400 text-center">Supported File : <span className="font-medium">JPG, PNG, WEBP</span></p>
            </div>
            <input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" />
          </div>

          <div className="custom-scrollbar overflow-y-auto max-h-[250px] px-4 py-2 flex-1">
            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Uploaded Images</h3>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {uploadedImages.map((img, index) => (
                  <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                    <div className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${localGallerySelected?.url === img.url ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No uploaded images yet</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex justify-end gap-2 bg-white mt-auto">
            <button onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50">
              <Icon icon="lucide:x" className="w-4 h-4" /> Close
            </button>
            <button 
              onClick={() => { 
                if (localGallerySelected) {
                  onUpdateBackground({ ...backgroundSettings, image: localGallerySelected.url });
                  setShowGallery(false);
                  setLocalGallerySelected(null);
                }
              }} 
              disabled={!localGallerySelected}
              className={`flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Icon icon="lucide:check" className="w-4 h-4" /> Place
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Palettes - Matching screenshot colors exactly
const solidPalette = [
  '#FFFFFF', '#FF0000', '#FF9F00', '#C13030', '#FFFF00', '#9EE100', 
  '#2E7D32', '#1B5E20', '#63D0CD', '#00BFA5', '#006064', '#BBDEFB', 
  '#42A5F5', '#2979FF', '#304FFE', '#1A237E', '#D1C4E9', '#FF4081', 
  '#F50057', '#9E9E9E', '#E0E0E0', '#F5F5F5', '#424242', '#000000'
];

export default Appearance;
