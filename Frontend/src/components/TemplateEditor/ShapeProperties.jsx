import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import ColorPicker from './ColorPicker';
import { ChevronUp, ChevronDown, SlidersHorizontal, Palette, Eye } from 'lucide-react';

const ShapeProperties = ({ 
  selectedElementProps, 
  activePageIndex, 
  selectedLayerId, 
  updateElementAttribute 
}) => {
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [isColorOpen, setIsColorOpen] = useState(true);
  const [isEffectOpen, setIsEffectOpen] = useState(false);
  const [isStrokeTypeOpen, setIsStrokeTypeOpen] = useState(false);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  const reverseGradient = (baseAttr) => {
    const stops = JSON.parse(selectedElementProps[`${baseAttr}-stops`] || JSON.stringify(defaultStops));
    const reversed = stops.map(s => ({ ...s, offset: 100 - s.offset })).sort((a,b) => a.offset - b.offset);
    updateAttr(`${baseAttr}-stops`, JSON.stringify(reversed));
  };

  // Default gradient stops if none exist
  const defaultStops = [
    { color: '#63D0CD', offset: 0, opacity: 1 },
    { color: '#4B3EFE', offset: 100, opacity: 1 }
  ];

  if (!selectedElementProps) return null;

  const updateAttr = (attr, val) => {
    updateElementAttribute(activePageIndex, selectedLayerId, attr, val);
  };

  // --- CLICK OUTSIDE HANDLER (Replced Overlay) ---
  React.useEffect(() => {
     const handleClickOutside = (e) => {
        if (activeColorPicker) {
           const isSelector = e.target.closest('#main-color-selector');
           const isPicker = e.target.closest('#deep-color-picker');
           const isTrigger = e.target.closest('.color-field-trigger');
           
           if (!isSelector && !isPicker && !isTrigger) {
              setActiveColorPicker(null);
              setShowDetailedPicker(false);
              setIsTypeDropdownOpen(false);
           } else if (!e.target.closest('.type-dropdown-container')) {
              setIsTypeDropdownOpen(false);
           }
        }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeColorPicker]);

  const PropertySlider = ({ label, value, onChange, min = 0, max = 100 }) => (
    <div className="flex items-center gap-[1vw] py-[0.4vw]">
       <span className="text-[0.8vw] font-semibold text-gray-600 w-[4vw] flex-shrink-0">{label} :</span>
       <div className="flex-grow flex items-center gap-[1vw]">
          <input
            type="range"
            min={min}
            max={max}
            step="1"
            value={value || 0}
            onChange={(e) => onChange(e.target.value)}
            className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb ${((value || 0) - min) / (max - min) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <div className="w-[2.8vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm text-[0.8vw] text-gray-700 font-semibold">
             {value || 0}
          </div>
       </div>
    </div>
  );

  const ColorField = ({ label, color, opacity, onColorChange, onOpacityChange, onPickerToggle }) => (
    <div className="flex items-center gap-[0.4vw] py-[0.4vw]">
       <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">{label} :</span>
       <div 
         onClick={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           setPickerPosition({ top: rect.top, right: window.innerWidth - rect.left + 10 });
           onPickerToggle();
         }} 
         className="w-[2.5vw] h-[2.5vw] rounded-[0.5vw] border border-gray-200 cursor-pointer flex-shrink-0 shadow-sm relative overflow-hidden color-field-trigger" 
         style={{ background: (color === 'none' || color === '#' || !color) ? 'white' : color }}
       >
         {(color === 'none' || color === '#' || !color) && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
         )}
       </div>
       
       <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.7vw]">
         <input
           type="text"
           value={color === 'none' ? '#' : color.toUpperCase()}
           onChange={(e) => {
             const val = e.target.value;
             if (val === '' || val === '#') onColorChange('none');
             else if (val.startsWith('#')) onColorChange(val);
             else onColorChange('#' + val);
           }}
           className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] font-mono tracking-tight"
           maxLength={7}
         />
         <div className="flex items-center gap-[0.1vw] ml-[0.5vw]">
           <input
              type="number"
              value={Math.round(opacity * 100)}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value) / 100)}
              className="w-[1.5vw] text-right text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent appearance-none no-spin"
           />
           <span className="text-[0.75vw] font-medium text-gray-500">%</span>
         </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-[0.60vw] font-sans">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-[0.75vw] mb-[0.2vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Shape Property</span>
        <div className="h-px flex-grow bg-gray-200"></div>
      </div>

      {/* TOP LEVEL SLIDERS */}
      <div className="px-[0.2vw] space-y-[0.3vw] py-[0.5vw]">
         <PropertySlider label="Count" value={3} onChange={() => {}} /> 
         <PropertySlider 
           label="Radius" 
           value={Math.round(parseFloat(selectedElementProps.r || 0))} 
           onChange={(val) => updateAttr(selectedElementProps.tagName === 'rect' ? 'rx' : 'r', val)} 
         />
         <PropertySlider 
           label="Corner" 
           value={Math.round(parseFloat(selectedElementProps.opacity || 1) * 10)} 
           onChange={(val) => updateAttr('opacity', (parseFloat(val) / 10).toString())} 
         />
      </div>

      {/* COLOR ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <div className={`bg-white border border-gray-200 rounded-[0.75vw] shadow-sm ${!isStrokeTypeOpen ? 'overflow-hidden' : ''}`}>
        <div 
          onClick={() => setIsColorOpen(!isColorOpen)}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${isColorOpen ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <Palette size="1vw" className="text-gray-600" />
            <span className="font-semibold text-gray-900 text-[0.85vw]">Color</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${isColorOpen ? '' : 'rotate-180'}`} />
        </div>

        {isColorOpen && (
          <div className="p-[1vw] pt-[0.75vw] space-y-[0.5vw]">
             <ColorField 
               label="Fill" 
               color={selectedElementProps.fill} 
               opacity={parseFloat(selectedElementProps.opacity || 1)}
               onColorChange={(val) => updateAttr('fill', val)}
               onOpacityChange={(val) => updateAttr('opacity', val.toString())}
               onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
             />
             <ColorField 
               label="Stoke" 
               color={selectedElementProps.stroke} 
               opacity={1}
               onColorChange={(val) => updateAttr('stroke', val)}
               onOpacityChange={() => {}}
               onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
             />

              {/* STROKE SETTINGS (MATCHED WITH COLOR INPUTS) */}
              <div className="flex items-center gap-[0.4vw] py-[0.1vw]">
                 {/* Aligns with the labels above (3vw + 0.4vw gap) */}
                 <div className="w-[3vw]"></div>

                 {/* Aligns with the color swatches above (2.5vw) */}
                 <div className="w-[2.5vw] flex items-center justify-center">
                    <div className="flex items-center justify-center h-[2vw] w-[2vw] hover:bg-white rounded-[0.5vw] cursor-pointer transition-colors shadow-sm" onClick={() => setActiveColorPicker('stroke')}>
                       <SlidersHorizontal size="1.1vw" className="text-gray-500" />
                    </div>
                 </div>

                 {/* This right part matches the ColorField input box width exactly */}
                 <div className="flex-grow flex items-center gap-[0.4vw]">
                    <div className="relative flex-grow h-[2.5vw]">
                       <div 
                          className={`h-full px-[0.7vw] border-[0.1vw] rounded-[0.75vw] flex items-center gap-[0.5vw] cursor-pointer justify-between bg-white transition-all font-semibold ${isStrokeTypeOpen ? 'border-indigo-500 shadow-sm' : 'border-gray-400 hover:border-indigo-400'}`}
                          onClick={() => setIsStrokeTypeOpen(!isStrokeTypeOpen)}
                       >
                          <span className="text-[0.75vw] text-gray-700 whitespace-nowrap overflow-hidden">
                            {selectedElementProps.strokeDasharray === '5,5' ? 'Dashed' : 'Solid'}
                          </span>
                          <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${isStrokeTypeOpen ? 'rotate-180' : ''}`} />
                       </div>

                       {isStrokeTypeOpen && (
                          <div className="absolute top-[110%] left-0 right-0 py-1 bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-50 animate-in fade-in zoom-in duration-200">
                             {['Solid', 'Dashed'].map((type) => (
                                <div
                                   key={type}
                                   className={`px-[1vw] py-[0.5vw] text-[0.8vw] cursor-pointer transition-colors ${
                                      (type === 'Solid' && (selectedElementProps.strokeDasharray === 'none' || !selectedElementProps.strokeDasharray)) ||
                                      (type === 'Dashed' && selectedElementProps.strokeDasharray === '5,5')
                                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-semibold'
                                   }`}
                                   onClick={() => {
                                      updateAttr('stroke-dasharray', type === 'Dashed' ? '5,5' : 'none');
                                      setIsStrokeTypeOpen(false);
                                   }}
                                >
                                   {type}
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    <div className="h-[2.5vw] w-[4.5vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center px-[0.6vw] gap-[0.3vw] bg-white hover:border-indigo-400 transition-colors flex-shrink-0">
                        <div 
                          className="cursor-ew-resize hover:bg-gray-50 p-[0.2vw] rounded-[0.3vw] transition-colors"
                          onMouseDown={(e) => {
                            const startX = e.clientX;
                            const initialVal = parseFloat(selectedElementProps.strokeWidth || 1);
                            
                            const onMouseMove = (moveEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const newVal = Math.max(0, initialVal + Math.round(deltaX / 8));
                              updateAttr('stroke-width', newVal.toString());
                              document.body.style.cursor = 'ew-resize';
                            };
                            
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                              document.body.style.cursor = 'default';
                            };
                            
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                           <Icon icon="material-symbols:line-weight" width="1vw" height="1vw" className="text-gray-500 flex-shrink-0" />
                        </div>
                        <input
                          type="number"
                          value={parseFloat(selectedElementProps.strokeWidth) || 0}
                          onChange={(e) => updateAttr('stroke-width', e.target.value)}
                          className="w-full text-[0.8vw] font-semibold outline-none text-right bg-transparent text-gray-700 no-spin"
                        />
                    </div>
                 </div>
              </div>
          </div>
        )}
      </div>

      {/* EFFECT ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm">
        <div 
          onClick={() => setIsEffectOpen(!isEffectOpen)}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${isEffectOpen ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <Eye size="1vw" className="text-gray-600" />
            <span className="font-semibold text-gray-900 text-[0.85vw]">Effect</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${isEffectOpen ? '' : 'rotate-180'}`} />
        </div>
      </div>

      {/* PORTALED COLOR SELECTOR PANELS (EXACT TEXT EDITOR STYLE) */}
      {activeColorPicker && createPortal(
        <>
          {/* LEVEL 1: MAIN COLOR SELECTOR */}
          <div 
            id="main-color-selector"
            className="fixed z-[3000] w-[19.4vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: Math.min(pickerPosition.top - 120, window.innerHeight - 550), 
              right: '19vw', 
            }}
          >
              <div className="flex items-center justify-between p-[1vw] border-b border-gray-50">
                <div className="flex items-center gap-[0.5vw]">
                   <div className="relative type-dropdown-container">
                     <button
                       onClick={(e) => {
                          e.stopPropagation();
                          setIsTypeDropdownOpen(!isTypeDropdownOpen);
                       }}
                       className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] border border-gray-200 text-[0.75vw] font-bold text-gray-700 hover:bg-gray-50 transition-all bg-white shadow-sm min-w-[5.5vw] justify-between"
                     >
                       <span className="capitalize">{selectedElementProps[`${activeColorPicker}-type`] || 'solid'}</span>
                       <ChevronDown size="0.9vw" className="text-gray-400" />
                     </button>

                     {isTypeDropdownOpen && (
                        <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[3100] py-1 animate-in fade-in zoom-in-95 duration-200">
                           {['solid', 'gradient'].map(type => (
                              <div
                                key={type}
                                onClick={() => {
                                   updateAttr(`${activeColorPicker}-type`, type);
                                   if (type === 'gradient' && !selectedElementProps[`${activeColorPicker}-stops`]) {
                                      updateAttr(`${activeColorPicker}-stops`, JSON.stringify(defaultStops));
                                      updateAttr(`${activeColorPicker}-gradient-type`, 'linear');
                                   }
                                   setIsTypeDropdownOpen(false);
                                }}
                                className={`px-[0.75vw] py-[0.4vw] text-[0.75vw] font-semibold cursor-pointer transition-colors ${
                                   (selectedElementProps[`${activeColorPicker}-type`] || 'solid') === type 
                                   ? 'bg-indigo-50 text-indigo-700' 
                                   : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </div>
                           ))}
                        </div>
                     )}
                   </div>

                   {(selectedElementProps[`${activeColorPicker}-type`] || 'solid') === 'gradient' && (
                      <div className="relative type-dropdown-container">
                        <button
                          onClick={(e) => {
                             e.stopPropagation();
                             setIsStrokeTypeOpen(!isStrokeTypeOpen); // re-using state for second dropdown
                          }}
                          className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] border border-gray-200 text-[0.75vw] font-bold text-gray-700 hover:bg-gray-50 transition-all bg-white shadow-sm min-w-[5.5vw] justify-between"
                        >
                          <span className="capitalize">{selectedElementProps[`${activeColorPicker}-gradient-type`] || 'linear'}</span>
                          <ChevronDown size="0.9vw" className="text-gray-400" />
                        </button>
                        {isStrokeTypeOpen && (
                           <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[3100] py-1 animate-in fade-in zoom-in-95 duration-200">
                              {['linear', 'radial'].map(type => (
                                 <div
                                   key={type}
                                   onClick={() => {
                                      updateAttr(`${activeColorPicker}-gradient-type`, type);
                                      setIsStrokeTypeOpen(false);
                                   }}
                                   className={`px-[0.75vw] py-[0.4vw] text-[0.75vw] font-semibold cursor-pointer transition-colors ${
                                      (selectedElementProps[`${activeColorPicker}-gradient-type`] || 'linear') === type 
                                      ? 'bg-indigo-50 text-indigo-700' 
                                      : 'text-gray-600 hover:bg-gray-50'
                                   }`}
                                 >
                                   {type.charAt(0).toUpperCase() + type.slice(1)}
                                 </div>
                              ))}
                           </div>
                        )}
                      </div>
                   )}
                </div>

                <div className="flex items-center gap-[0.5vw]">
                   {(selectedElementProps[`${activeColorPicker}-type`] || 'solid') === 'gradient' && (
                      <button 
                        onClick={() => reverseGradient(activeColorPicker)}
                        className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                        title="Reverse Gradient"
                      >
                        <Icon icon="lucide:arrow-left-right" width="1vw" />
                      </button>
                   )}
                   <button 
                     onClick={() => {
                        updateAttr(`${activeColorPicker}-stops`, JSON.stringify(defaultStops));
                     }}
                     className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                     title="Reset Colors"
                   >
                     <Icon icon="lucide:rotate-ccw" width="1vw" />
                   </button>
                   <button 
                     onClick={() => {
                       setActiveColorPicker(null);
                       setShowDetailedPicker(false);
                     }} 
                     className="p-[0.4vw] rounded-[0.5vw] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                   >
                     <Icon icon="heroicons:x-mark" width="1.1vw" />
                   </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto no-scrollbar p-[1vw] space-y-[1.5vw]">
                {/* CONDITIONAL RENDERING: SOLID VS GRADIENT UI */}
                {(selectedElementProps[`${activeColorPicker}-type`] || 'solid') === 'gradient' ? (
                   <div className="space-y-[1.2vw]">
                      {/* GRADIENT BAR */}
                      <div className="space-y-[0.75vw]">
                         <div className="flex items-center justify-between">
                            <span className="text-[0.8vw] font-bold text-gray-800">Customize</span>
                            <div className="h-[1px] flex-grow bg-gray-100 mx-[0.5vw]"></div>
                         </div>
                         
                         <div className="relative h-[2.5vw] px-[0.25vw] py-[0.25vw] mb-[0.5vw]">
                            {/* NATIVE SVG PREVIEW BAR (Ensures perfect parity) */}
                            <svg className="w-full h-full rounded-[0.4vw] shadow-inner border border-gray-100 cursor-copy overflow-hidden" onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const offset = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                                  const stops = JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops));
                                  // Find neighborhood colors for smoother addition
                                  const newStops = [...stops, { color: '#ffffff', offset, opacity: 1 }].sort((a,b) => a.offset - b.offset);
                                  updateAttr(`${activeColorPicker}-stops`, JSON.stringify(newStops));
                                  setActiveStopIndex(newStops.findIndex(s => s.offset === offset));
                               }}>
                               <defs>
                                  <linearGradient id="preview-grad-bar" x1="0%" y1="0%" x2="100%" y2="0%">
                                     {JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops)).map((s, i) => (
                                        <stop key={i} offset={`${s.offset}%`} stopColor={s.color} stopOpacity={s.opacity || 1} />
                                     ))}
                                  </linearGradient>
                               </defs>
                               <rect width="100%" height="100%" fill="url(#preview-grad-bar)" />
                            </svg>
                            {/* STOP HANDLES */}
                            {JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops)).map((stop, idx) => (
                               <div 
                                  key={idx}
                                  className={`absolute top-0 w-[0.8vw] h-full cursor-grab active:cursor-grabbing group ${activeStopIndex === idx ? 'z-10' : ''}`}
                                  style={{ left: `${stop.offset}%`, transform: 'translateX(-50%)' }}
                                  onMouseDown={(e) => {
                                     e.stopPropagation();
                                     setActiveStopIndex(idx);
                                     const startX = e.clientX;
                                     const startOffset = stop.offset;
                                     
                                     const onMove = (moveEv) => {
                                        const delta = ((moveEv.clientX - startX) / e.currentTarget.parentElement.offsetWidth) * 100;
                                        const newOffset = Math.min(100, Math.max(0, Math.round(startOffset + delta)));
                                        const stops = JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops));
                                        stops[idx].offset = newOffset;
                                        updateAttr(`${activeColorPicker}-stops`, JSON.stringify(stops.sort((a,b) => a.offset - b.offset)));
                                        // Update active index if order changed
                                     };
                                     const onUp = () => {
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                     };
                                     window.addEventListener('mousemove', onMove);
                                     window.addEventListener('mouseup', onUp);
                                  }}
                               >
                                  <div className={`w-[1.2vw] h-[1.2vw] rounded-full border-[0.15vw] shadow-md absolute top-1/2 -translate-y-1/2 -translate-x-[0.2vw] transition-transform ${activeStopIndex === idx ? 'border-indigo-600 scale-125' : 'border-white group-hover:scale-110'}`} style={{ backgroundColor: stop.color }} />
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* STOP LIST */}
                      <div className="space-y-[0.5vw]">
                         <span className="text-[0.75vw] font-bold text-gray-500 uppercase tracking-wider px-[0.1vw]">Stops</span>
                         <div className="max-h-[15vw] overflow-y-auto no-scrollbar space-y-[0.4vw]">
                            {JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops)).map((stop, idx) => (
                               <div 
                                  key={idx} 
                                  onClick={() => setActiveStopIndex(idx)}
                                  className={`flex items-center gap-[0.5vw] p-[0.4vw] rounded-[0.6vw] border transition-all cursor-pointer ${activeStopIndex === idx ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                               >
                                  <div className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-100 shadow-sm" style={{ backgroundColor: stop.color }} />
                                  <span className="text-[0.75vw] font-bold text-gray-700 min-w-[4vw] font-mono">{stop.color.toUpperCase()}</span>
                                  
                                  {/* STOP OPACITY SLIDER */}
                                  <div className="flex-grow max-w-[5vw] px-[0.5vw]">
                                     {activeStopIndex === idx && (
                                        <input 
                                           type="range" 
                                           min="0" max="1" step="0.01" 
                                           value={stop.opacity || 1}
                                           onChange={(e) => {
                                              const stops = JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops));
                                              stops[idx].opacity = parseFloat(e.target.value);
                                              updateAttr(`${activeColorPicker}-stops`, JSON.stringify(stops));
                                           }}
                                           className="w-full h-[0.15vw] appearance-none bg-gray-200 rounded-full accent-indigo-600"
                                        />
                                     )}
                                  </div>

                                  <span className="text-[0.7vw] font-bold text-gray-400">{stop.offset}%</span>
                                  <button 
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        const stops = JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops));
                                        if (stops.length <= 2) return;
                                        const newStops = stops.filter((_, i) => i !== idx);
                                        updateAttr(`${activeColorPicker}-stops`, JSON.stringify(newStops));
                                        setActiveStopIndex(Math.max(0, idx - 1));
                                     }}
                                     className="p-[0.3vw] text-gray-300 hover:text-red-500 transition-colors"
                                  >
                                     <Icon icon="tabler:trash" width="1vw" />
                                  </button>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* GRADIENT PRESETS */}
                      <div className="space-y-[0.75vw]">
                         <div className="flex items-center gap-[0.75vw]">
                            <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Gradient Presets</span>
                            <div className="h-[1px] flex-grow bg-gray-100"></div>
                         </div>
                         <div className="grid grid-cols-6 gap-[0.5vw]">
                           {[
                             ['#ff5f6d', '#ffc371'], ['#6366f1', '#a855f7'], ['#2dd4bf', '#22d3ee'], 
                             ['#84cc16', '#4ade80'], ['#fde047', '#fef08a'], ['#ec4899', '#f472b6'],
                             ['#a5b4fc', '#e0e7ff'], ['#d946ef', '#f0abfc'], ['#06b6d4', '#67e8f9'],
                             ['#9ca3af', '#d1d5db'], ['#a48d00', '#71aa13'], ['#db2777', '#f43f5e']
                           ].map((colors, i) => (
                             <div
                               key={i}
                               onClick={() => {
                                 const newStops = [
                                   { color: colors[0], offset: 0, opacity: 1 },
                                   { color: colors[1], offset: 100, opacity: 1 }
                                 ];
                                 updateAttr(`${activeColorPicker}-stops`, JSON.stringify(newStops));
                               }}
                               className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                               style={{ background: `linear-gradient(to bottom, ${colors[0]}, ${colors[1]})` }}
                             />
                           ))}
                         </div>
                      </div>
                   </div>
                ) : (
                   <>
                      {/* COLORS ON THIS PAGE */}
                      <div className="space-y-[0.75vw]">
                         <div className="flex items-center gap-[0.75vw]">
                            <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Colors on this page</span>
                            <div className="h-[1px] flex-grow bg-gray-100"></div>
                         </div>
                         <div className="grid grid-cols-6 gap-[0.5vw]">
                            {['#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00' ].map((c, i) => (
                              <div
                                key={i}
                                onClick={() => updateAttr(activeColorPicker, c)}
                                style={{ backgroundColor: c }}
                                className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                              ></div>
                            ))}
                         </div>
                      </div>

                      {/* SOLID COLORS */}
                      <div className="space-y-[0.75vw]">
                         <div className="flex items-center gap-[0.75vw]">
                            <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Solid Colors</span>
                            <div className="h-[1px] flex-grow bg-gray-100"></div>
                         </div>
                         <div className="grid grid-cols-6 gap-[0.5vw]">
                            {[
                              '#FFFFFF', '#000000', '#FF0000', '#FF9500', '#BF2121', '#FFFF00',
                              '#ADFF2F', '#228B22', '#008080', '#40E0D0', '#00CED1', '#008B8B',
                              '#ADD8E6', '#87CEEB', '#0000FF', '#000080', '#E6E6FA', '#FF00FF'
                            ].map((c, i) => (
                              <div
                                key={i}
                                onClick={() => updateAttr(activeColorPicker, c)}
                                style={{ backgroundColor: c }}
                                className="w-full aspect-square rounded-[0.5vw] border border-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm active:scale-95"
                              ></div>
                            ))}
                         </div>
                      </div>
                   </>
                )}
              </div>

             {/* CUSTOMIZE COLORS BUTTON (FOOTER) */}
             <div className="mt-auto p-[0.75vw] border-t border-gray-100 font-semibold">
                <button 
                  className={`flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] transition-all rounded-[0.75vw] w-full group ${showDetailedPicker ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}`}
                  onClick={() => setShowDetailedPicker(!showDetailedPicker)}
                >
                   <div className="w-[1.8vw] h-[1.8vw] rounded-full shadow-md group-hover:scale-110 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}></div>
                   <span className="text-[0.85vw] font-bold">Customize Colors</span>
                </button>
             </div>
          </div>
 
          {/* LEVEL 2: DEEPER CUSTOM COLOR PICKER */}
          {showDetailedPicker && (
             <div 
               id="deep-color-picker"
               className="fixed z-[3001] w-[15vw] animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-[1vw]"
               style={{ 
                 top: Math.min(pickerPosition.top - 120, window.innerHeight - 550), 
                 right: '3vw', 
               }}
             >
               <ColorPicker 
                 color={
                   (selectedElementProps[`${activeColorPicker}-type`] || 'solid') === 'gradient'
                   ? (JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops))[activeStopIndex]?.color || '#ffffff')
                   : (selectedElementProps[activeColorPicker] || '#000000')
                 }
                 onChange={(newColor) => {
                    if ((selectedElementProps[`${activeColorPicker}-type`] || 'solid') === 'gradient') {
                       const stops = JSON.parse(selectedElementProps[`${activeColorPicker}-stops`] || JSON.stringify(defaultStops));
                       stops[activeStopIndex].color = newColor;
                       updateAttr(`${activeColorPicker}-stops`, JSON.stringify(stops));
                    } else {
                       updateAttr(activeColorPicker, newColor);
                    }
                 }}
                 onClose={() => setShowDetailedPicker(false)}
                 opacity={100}
                 onOpacityChange={() => {}}
               />
             </div>
          )}
        </>,
        document.body
      )}

      {/* CUSTOM CSS */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 1.1vw;
          width: 1.1vw;
          border-radius: 50%;
          background: #ffffff;
          border: 0.1vw solid #e5e7eb;
          box-shadow: 0 0.1vw 0.3vw rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default ShapeProperties;
