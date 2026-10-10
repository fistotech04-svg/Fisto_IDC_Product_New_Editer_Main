import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

// Helper functions for color conversion
const hexToHsv = (hex, currentHue = 0) => {
  if (!hex || typeof hex !== "string") return { h: currentHue, s: 0, v: 100 };
  let color = hex.startsWith("#") ? hex.substring(1) : hex;
  if (color.length === 3)
    color = color.split("").map((c) => c + c).join("");
  if (color.length !== 6) return { h: currentHue, s: 0, v: 100 };

  const r = parseInt(color.substring(0, 2), 16) / 255;
  const g = parseInt(color.substring(2, 4), 16) / 255;
  const b = parseInt(color.substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return { h: currentHue, s: 0, v: 100 };

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = currentHue;

  if (max !== min && d > 0.0001) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h * 60;
  }
  return { h, s: s * 100, v: v * 100 };
};

const hsvToHex = ({ h, s, v }) => {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h <= 360) { r = c; g = 0; b = x; }

  const toHex = (n) =>
    Math.round(Math.max(0, Math.min(255, (n + m) * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function ColorPicker({ color, onChange, onComplete, opacity = 100, onOpacityChange, onClose, className, style, ...props }) {
  const [hsv, setHsv] = useState(() => hexToHsv(color || "#000000", 0));
  const currentOpacity = typeof opacity === "number" ? opacity : 100;
  const pickerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setHsv(prev => hexToHsv(color, prev?.h ?? 0));
  }, [color]);

  const handleSaturationChange = useCallback((e, container) => {
    if (!container) return;
    const { width, height, left, top } = container.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - left) / width, 0), 1);
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    
    const curH = hsvRef.current?.h ?? 0;
    const newHsv = { h: curH, s: x * 100, v: (1 - y) * 100 };
    setHsv(newHsv);
    if (onChange) onChange(hsvToHex(newHsv));
  }, [onChange]);

  const handleHueChange = useCallback((e, container) => {
    if (!container) return;
    const { height, top } = container.getBoundingClientRect();
    const y = Math.min(Math.max((e.clientY - top) / height, 0), 1);
    
    const curS = hsvRef.current?.s ?? 100;
    const curV = hsvRef.current?.v ?? 100;
    const newHsv = { h: Math.min(360, Math.max(0, y * 360)), s: curS, v: curV };
    setHsv(newHsv);
    if (onChange) onChange(hsvToHex(newHsv));
  }, [onChange]);

  // Generic dragger hook
  const useDrag = (handler) => {
    const containerRef = useRef(null);
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      if (containerRef.current) {
        handlerRef.current(e, containerRef.current);
      }

      const onMouseMove = (moveEvent) => {
        if (isDraggingRef.current && containerRef.current) {
          moveEvent.preventDefault();
          handlerRef.current(moveEvent, containerRef.current);
        }
      };

      const onMouseUp = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          if (onComplete) onComplete();
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    return { onMouseDown, ref: containerRef };
  };

  const satDrag = useDrag(handleSaturationChange);
  const hueDrag = useDrag(handleHueChange);

  // Background color for saturation box based on current Hue
  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  return (
    <div 
        ref={pickerRef}
        className={`z-50 w-[15vw] bg-white rounded-[1vw] shadow-[0_0.5vw_2vw_-0.25vw_rgba(0,0,0,0.15)] border border-gray-100 p-[1vw] animate-in fade-in zoom-in-95 duration-200 select-none font-sans ${className || ""}`}
        style={style}
        {...props}
    >
       {/* Header */}
       <div className="flex items-center justify-between mb-[1vw]">
         <div className="flex items-center gap-[0.5vw] flex-grow">
           <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Colors Pallet</span>
           <div className="h-[1px] w-full bg-gray-200"></div>
         </div>
         {onClose && (
           <button 
             onClick={onClose}
             className="p-[0.35vw] rounded-[0.4vw] cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
           >
             <Icon icon="heroicons:x-mark" width="1vw" />
           </button>
         )}
       </div>

       {/* Main Area */}
       <div className="flex gap-[0.75vw] h-[9.375vw] mb-[1.25vw]">
          {/* Saturation/Value Box */}
          <div 
            ref={satDrag.ref}
            onMouseDown={satDrag.onMouseDown}
            className="flex-1 rounded-[0.6vw] relative cursor-crosshair overflow-hidden"
            style={{ backgroundColor: hueColor }}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
             
             {/* Circular Thumb */}
             <div 
               className="absolute w-[0.85vw] h-[0.85vw] border-2 border-white rounded-full shadow-lg -ml-[0.425vw] -mt-[0.425vw] pointer-events-none"
               style={{ 
                 left: `${Math.max(0, Math.min(100, hsv.s))}%`, 
                 top: `${Math.max(0, Math.min(100, 100 - hsv.v))}%`,
               }}
             />
          </div>

          {/* Vertical Hue Slider */}
          <div 
             ref={hueDrag.ref}
             onMouseDown={hueDrag.onMouseDown}
             className="w-[1.25vw] rounded-full relative cursor-pointer"
             style={{ 
               background: "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
             }}
          >
             {/* Thumb with lines */}
             <div 
               className="absolute left-1/2 -translate-x-1/2 w-[1.5vw] h-[1.5vw] pointer-events-none"
               style={{ top: `${Math.max(0, Math.min(100, (hsv.h / 360) * 100))}%`, marginTop: '-0.75vw' }}
             >
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.75vw] h-[0.75vw] bg-white border-2 border-white rounded-full shadow-md">
                   <div 
                     className="w-full h-full rounded-full border border-gray-200"
                     style={{ backgroundColor: hsvToHex(hsv) }}
                   ></div>
                </div>
             </div>
          </div>
       </div>

       {/* Controls */}
       <div className="space-y-[1vw]">
          {/* Hex Input */}
          <div className="flex items-center justify-between">
             <span className="text-[0.85vw] font-semibold text-gray-800">Color Code :</span>
             <div className="flex items-center gap-[0.5vw] border-2 border-gray-300 rounded-[0.6vw] px-[0.5vw] py-[0.35vw] w-[7vw] focus-within:border-[#5d5efc] transition-all">
                <span className="text-gray-400 text-[0.65vw] font-medium">#</span>
                <input 
                  type="text" 
                  value={color && typeof color === 'string' ? color.replace("#", "").toLowerCase() : ""}
                  onChange={(e) => onChange && onChange(`#${e.target.value}`)}
                  onBlur={() => onComplete && onComplete()}
                  className="w-full text-[0.7vw] font-semibold text-gray-700 outline-none lowercase"
                  maxLength={6}
                />
                <Icon 
                  icon="mingcute:color-picker-fill" 
                  width="1.1vw" 
                  className="text-gray-500 cursor-pointer hover:text-[#5d5efc] transition-colors" 
                  onClick={async () => {
                    if (!window.EyeDropper) {
                      alert("Your browser does not support the EyeDropper API");
                      return;
                    }
                    const eyeDropper = new window.EyeDropper();
                    try {
                      const result = await eyeDropper.open();
                      if (onChange) onChange(result.sRGBHex);
                      if (onComplete) onComplete();
                    } catch (e) {
                      console.log("EyeDropper cancelled or failed");
                    }
                  }}
                />
             </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center justify-between">
             <span className="text-[0.85vw] font-semibold text-gray-800">Opacity :</span>
             <div className="flex items-center gap-[0.75vw] w-[7vw]">
                <div className="relative flex-1 h-[0.35vw] bg-gray-100 rounded-full">
                   <div 
                     className="absolute top-0 left-0 h-full bg-[#7c5dff] rounded-full"
                     style={{ width: `${currentOpacity}%` }}
                   ></div>
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={currentOpacity} 
                      onChange={(e) => onOpacityChange && onOpacityChange(parseInt(e.target.value))}
                      onMouseUp={() => onComplete && onComplete()}
                      onTouchEnd={() => onComplete && onComplete()}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                   />
                   <div 
                      className="absolute top-1/2 -translate-y-1/2 w-[0.85vw] h-[0.85vw] bg-[#7c5dff] border-2 border-white rounded-full shadow-md pointer-events-none"
                      style={{ left: `${currentOpacity}%`, marginLeft: "-0.425vw" }}
                   ></div>
                </div>
             </div>
          </div>
       </div>
   </div>
  );
}
