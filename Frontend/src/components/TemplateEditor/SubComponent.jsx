import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import {
  ArrowLeftRight, Minus, ChevronLeft, ChevronRight, Link2, Link2Off, Trash2, Plus, Pipette, ChevronUp, ChevronDown, SlidersHorizontal, Palette, Eye, RotateCcw, X
} from 'lucide-react';

const handleScrubHelper = (e, initialVal, updateFn, sensitivity = 5) => {
  const sValue = parseFloat(initialVal) || 0;
  let accumulatedDelta = 0;
  let virtualX = e.clientX;
  let virtualY = e.clientY;

  document.body.classList.add('is-scrubbing');

  // Use Pointer Capture instead of Pointer Lock to avoid browser "Press Esc" message
  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
  }

  // Create virtual cursor
  const vCursor = document.createElement('div');
  vCursor.className = 'virtual-scrub-cursor';
  vCursor.style.left = `${virtualX}px`;
  vCursor.style.top = `${virtualY}px`;
  vCursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L21 12L18 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 15L21 12L18 9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(vCursor);

  const onMouseMove = (moveEvent) => {
    // movementX is still available in pointer/mouse events in most modern browsers
    // even without pointer lock, but it might stop at screen edges.
    const dx = moveEvent.movementX || 0;
    accumulatedDelta += dx;

    // Update and Wrap Virtual Cursor
    virtualX += dx;
    if (virtualX < 0) virtualX = window.innerWidth;
    if (virtualX > window.innerWidth) virtualX = 0;
    vCursor.style.left = `${virtualX}px`;

    const newVal = sValue + Math.round(accumulatedDelta / sensitivity);
    updateFn(newVal.toString());
  };

  const onMouseUp = (moveEvent) => {
    if (moveEvent.pointerId !== undefined) {
      try { moveEvent.target.releasePointerCapture(moveEvent.pointerId); } catch (e) { }
    }
    if (vCursor.parentNode) vCursor.parentNode.removeChild(vCursor);
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };

  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
};

const PropertySlider = ({ label, value, onChange, min = 0, max = 100, disabled = false }) => {
  // Use local state for the input to allow smooth multi-digit typing
  const [localVal, setLocalVal] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value);
    }
  }, [value]);

  const handleManualInput = (val) => {
    if (disabled) return;
    setLocalVal(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      onChange(val);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (disabled) return;
    let num = parseInt(localVal);
    if (isNaN(num)) num = min;

    // Explicitly enforce min/max constraints on focus lost
    const corrected = Math.min(Math.max(num, min), max);
    setLocalVal(corrected);
    onChange(corrected.toString());
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  return (
    <div className={`flex items-center gap-[1vw] py-[0.4vw] transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <span
        className="text-[0.8vw] font-semibold text-gray-600 w-[4vw] flex-shrink-0 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
        onPointerDown={(e) => {
          handleScrubHelper(e, value, (v) => {
            const num = parseFloat(v);
            const corrected = Math.min(Math.max(num, min), max);
            onChange(corrected.toString());
          });
        }}
      >{label} :</span>
      <div className="flex-grow flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value || 0}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="flex-grow h-[0.3vw] accent-[#5d5efc] cursor-pointer outline-none disabled:cursor-not-allowed"
        />
        <div className="w-[2.8vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm overflow-hidden">
          <input
            type="number"
            min={min}
            max={max}
            value={localVal === undefined ? '' : localVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-full text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent no-spin disabled:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

const NumberInput = ({ value, onChange }) => (
  <div className="flex items-center gap-[0.2vw]">
    <button
      className="p-[0.15vw] hover:bg-gray-100 rounded text-gray-400 transition-colors cursor-pointer"
      onClick={() => onChange(Math.max(0, parseInt(value || 0) - 1))}
    >
      <ChevronLeft size="1vw" />
    </button>
    <div className="w-[3.5vw] h-[2vw] border border-gray-200 rounded-[0.4vw] bg-white flex items-center justify-center shadow-sm">
      <input
        className="w-full text-center bg-transparent outline-none text-[0.8vw] font-semibold text-gray-700"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
      />
    </div>
    <button
      className="p-[0.15vw] hover:bg-gray-100 rounded text-gray-400 transition-colors cursor-pointer"
      onClick={() => onChange(parseInt(value || 0) + 1)}
    >
      <ChevronRight size="1vw" />
    </button>
  </div>
);

const AdjustmentSlider = ({ label, value, onChange, onReset, min = -100, max = 100 }) => {
  const num = parseFloat(value) || 0;
  const percentage = ((num - min) / (max - min)) * 100;

  const isNegative = num < 0;
  const activeLeft = isNegative ? percentage : 50;
  const activeWidth = Math.abs(percentage - 50);

  return (
    <div className="flex flex-col gap-[0.2vw] mb-[0.2vw]">
      <style>{`
        .invisible-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: transparent;
        }
        .invisible-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0;
          height: 0;
        }
      `}</style>
      <div className="flex items-center justify-between gap-[0.1vw]">
        <div className="flex items-center gap-[0.3vw]">
          <span className="text-[0.75vw] text-gray-600 font-medium">{label}</span>
          <button
            onClick={onReset}
            className="text-gray-400 hover:text-gray-700 transition-colors p-[0.1vw] cursor-pointer"
            title="Reset"
          >
            <RotateCcw size="0.65vw" strokeWidth={2.5} />
          </button>
        </div>
        <span className="text-[0.7vw] font-normal text-gray-500">{num}</span>
      </div>

      <div className="relative flex items-center h-[1vw] w-full">
        {/* Inactive thin gray track */}
        <div className="absolute w-full h-[0.2vw] bg-gray-200 rounded-full" />

        {/* Active thick blue track */}
        {num !== 0 && (
          <div
            className="absolute h-[0.25vw] bg-[#6366f1] pointer-events-none"
            style={{
              left: `${activeLeft}%`,
              width: `${activeWidth}%`,
              borderTopLeftRadius: isNegative ? '999px' : '0',
              borderBottomLeftRadius: isNegative ? '999px' : '0',
              borderTopRightRadius: isNegative ? '0' : '999px',
              borderBottomRightRadius: isNegative ? '0' : '999px',
            }}
          />
        )}

        {/* Thumb */}
        <div
          className="absolute w-[0.7vw] h-[0.7vw] bg-[#6366f1] rounded-full pointer-events-none shadow-sm"
          style={{ left: `calc(${percentage}% - 0.35vw)` }}
        />

        {/* Invisible range input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={num}
          onChange={(e) => onChange(e.target.value)}
          className="invisible-range absolute w-full h-full opacity-0 cursor-pointer m-0"
        />
      </div>
    </div>
  );
};

const ColorField = ({ label, color, opacity, onColorChange, onOpacityChange, onPickerToggle, baseAttr, selectedElementProps }) => (
  <div className="flex items-center gap-[0.4vw] py-[0.4vw]">
    <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">{label} :</span>
    <div
      className="w-[2.5vw] h-[2.5vw] rounded-[0.75vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center"
    >
      <div
        onClick={onPickerToggle}
        className="w-full h-full border border-gray-200 cursor-pointer color-field-trigger transition-transform flex-shrink-0"
        style={{
          background: (color === 'none' || color === 'transparent' || color === '#' || !color)
            ? 'white'
            : (color.toString().toLowerCase().includes('url(#')
              ? (selectedElementProps && selectedElementProps[`${baseAttr}-stops`]
                ? `linear-gradient(to right, ${JSON.parse(selectedElementProps[`${baseAttr}-stops`]).map(s => s.color).join(', ')})`
                : '#ccc')
              : color)
        }}
      />
      {(color === 'none' || color === 'transparent' || color === '#' || !color) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
      )}
    </div>

    <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.7vw]">
      <input
        type="text"
        value={(color === 'none' || color === 'transparent' || !color) ? '#' : color?.toUpperCase()}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || val === '#') {
            onColorChange('none');
          } else {
            const finalVal = val.startsWith('#') ? val : '#' + val;
            onColorChange(finalVal);
          }
        }}
        className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] font-mono tracking-tight"
        maxLength={7}
      />
      <div
        className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
        onPointerDown={(e) => {
          const currentPct = Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100);
          handleScrubHelper(e, currentPct, (val) => {
            const num = parseInt(val);
            const clamped = Math.min(Math.max(num, 0), 100);
            onOpacityChange(clamped / 100);
          });
        }}
      >
        <span className="text-[0.75vw] font-semibold text-gray-700">
          {Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100)}
        </span>
        <span className="text-[0.75vw] font-medium text-gray-500">%</span>
      </div>
    </div>
  </div>
);

const ShapePropertiesUI = ({
  selectedElementProps,
  activePageIndex,
  selectedLayerId,
  updateElementAttribute,
  openSubSection,
  setOpenSubSection
}) => {
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'fill' | 'stroke' | null
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const openAccordion = openSubSection;
  const setOpenAccordion = setOpenSubSection;
  const [activeEffectPopupId, setActiveEffectPopupId] = useState(null);
  const [effectPopupPos, setEffectPopupPos] = useState({ top: 0, right: '16.5vw' });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [isStrokeTypeOpen, setIsStrokeTypeOpen] = useState(false);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const reverseGradient = (baseAttr) => {
    const stops = JSON.parse(selectedElementProps[`${baseAttr}-stops`] || JSON.stringify(defaultStops));
    const reversed = stops.map(s => ({ ...s, offset: 100 - s.offset })).sort((a, b) => a.offset - b.offset);
    updateAttr(`${baseAttr}-stops`, JSON.stringify(reversed));
  };

  const colorsOnPage = React.useMemo(() => {
    const doc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
    const elements = doc.querySelectorAll('[data-fill-color], [data-stroke-color]');
    const colors = new Set();
    elements.forEach(el => {
      const fill = el.getAttribute('data-fill-color');
      const stroke = el.getAttribute('data-stroke-color');
      if (fill && fill !== 'none' && fill !== '#' && !fill.includes('gradient')) colors.add(fill.toUpperCase());
      if (stroke && stroke !== 'none' && stroke !== '#' && !stroke.includes('gradient')) colors.add(stroke.toUpperCase());
    });
    colors.add('#FFFFFF');
    colors.add('#000000');
    return Array.from(colors).slice(0, 12);
  }, [selectedElementProps, activePageIndex]);

  // Default gradient stops if none exist
  const defaultStops = [
    { color: '#63D0CD', offset: 0, opacity: 1 },
    { color: '#4B3EFE', offset: 100, opacity: 1 }
  ];

  if (!selectedElementProps) return null;

  const updateAttr = (attribute, value) => {
    updateElementAttribute(activePageIndex, selectedLayerId, attribute, value);
    // If we're toggling an effect off, and it's the one currently being edited in a popup, close the popup.
    if (value === 'false' && attribute.startsWith('data-effect-')) {
      const effectId = attribute.replace('data-effect-', '');
      if (activeEffectPopupId === effectId) {
        setActiveEffectPopupId(null);
      }
    }
  };

  const handleScrub = (e, initialVal, updateFn, sensitivity = 5) => {
    handleScrubHelper(e, initialVal, updateFn, sensitivity);
  };

  const handleEffectRowClick = (e, effectId) => {
    const target = e.currentTarget.closest('.effect-row') || e.currentTarget;
    const rect = target.getBoundingClientRect();
    // Shadow popups are taller than blur popups
    const popupHeight = effectId.includes('shadow') ? 350 : 220;
    const centerY = rect.top + (rect.height / 2) - (popupHeight / 2);
    // Keep within bounds (top of screen near navbar and bottom of screen)
    const finalTop = Math.max(90, Math.min(centerY, window.innerHeight - popupHeight - 20));

    setEffectPopupPos({
      top: finalTop,
      right: `calc(100vw - ${rect.left}px + 0.1vw)`
    });
    setActiveEffectPopupId(effectId);
  };

  // --- CLICK OUTSIDE HANDLER (Replced Overlay) ---
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeEffectPopupId || activeColorPicker || showStrokeSettings) {
          setActiveEffectPopupId(null);
          setActiveColorPicker(null);
          setShowStrokeSettings(false);
          setShowDetailedPicker(false);
          setIsTypeDropdownOpen(false);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (activeColorPicker || showStrokeSettings || activeEffectPopupId) {
        const isSelector = e.target.closest('#main-color-selector');
        const isPicker = e.target.closest('#deep-color-picker');
        const isTrigger = e.target.closest('.color-field-trigger');
        const isStrokePopup = e.target.closest('#stroke-settings-popup');

        const isEffectPopup = e.target.closest('.effect-popup-container');
        const isEffectRow = e.target.closest('.effect-row');
        if (!isSelector && !isPicker && !isTrigger && !isStrokePopup && !isEffectPopup && !isEffectRow) {
          setActiveColorPicker(null);
          setShowStrokeSettings(false);
          setShowDetailedPicker(false);
          setIsTypeDropdownOpen(false);
          setActiveEffectPopupId(null);
        } else if (!e.target.closest('.type-dropdown-container')) {
          setIsTypeDropdownOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeColorPicker, activeEffectPopupId, showStrokeSettings]);

  return (
    <div className="flex flex-col space-y-[0.60vw] font-sans">

      {/* TOP LEVEL SLIDERS */}
      {(selectedElementProps['data-shape-type'] === 'polygon' || selectedElementProps['data-shape-type'] === 'star') && (
        <div className="px-[0.2vw] space-y-[0.3vw] py-[0.5vw]">
          {/* Count/Sides for Polygons and Stars */}
          <PropertySlider
            label={selectedElementProps['data-shape-type'] === 'polygon' ? "Sides" : "Points"}
            value={parseInt(selectedElementProps['data-count'] || (selectedElementProps['data-shape-type'] === 'polygon' ? 3 : 5))}
            onChange={(val) => updateAttr('data-count', val.toString())}
            min={3}
            max={selectedElementProps['data-shape-type'] === 'polygon' ? 50 : 24}
          />

          {/* Ratio Slider for Stars Pointiness */}
          <PropertySlider
            label="Ratio"
            value={
              selectedElementProps['data-shape-type'] === 'star'
                ? Math.round(parseFloat(selectedElementProps['data-ratio'] || 40))
                : 0
            }
            onChange={(val) => updateAttr('data-ratio', val)}
            disabled={selectedElementProps['data-shape-type'] === 'polygon'}
          />

          {/* Corner/Rounding control: Smoothing for Polygons/Stars only (Hidden for Rects) */}
          <PropertySlider
            label="Corner"
            value={Math.round(parseFloat(
              selectedElementProps['data-radius'] || 0
            ))}
            onChange={(val) => updateAttr('data-radius', val)}
            max={50}
          />
        </div>
      )}

      {/* COLOR ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenAccordion(openAccordion === 'color' ? null : 'color')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openAccordion === 'color' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-semibold text-gray-900 text-[0.85vw]">Color</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openAccordion === 'color' ? '' : 'rotate-180'}`} />
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'color' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1vw] pt-[0.75vw] space-y-[0.5vw]">
              <ColorField
                label="Fill"
                color={selectedElementProps.fill}
                opacity={selectedElementProps.opacity}
                onColorChange={(val) => updateAttr('fill', val)}
                onOpacityChange={(val) => updateAttr('opacity', val.toString())}
                onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                baseAttr="fill"
                selectedElementProps={selectedElementProps}
              />
              <ColorField
                label="Stroke"
                color={selectedElementProps.stroke}
                opacity={selectedElementProps['stroke-opacity']}
                onColorChange={(val) => updateAttr('stroke', val)}
                onOpacityChange={(val) => updateAttr('stroke-opacity', val.toString())}
                onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
                baseAttr="stroke"
                selectedElementProps={selectedElementProps}
              />

              {/* STROKE SETTINGS (ONLY SHOW IF STROKE IS NOT NONE) */}
              {(selectedElementProps.stroke && selectedElementProps.stroke !== 'none' && selectedElementProps.stroke !== '#' && selectedElementProps.stroke !== 'transparent') && (
                <div className="flex items-center gap-[0.4vw] py-[0.1vw]">
                  {/* Aligns with the labels above (3vw + 0.4vw gap) */}
                  <div className="w-[3vw]"></div>

                  {/* Aligns with the color swatches above (2.5vw) */}
                  <div className="w-[2.5vw] flex items-center justify-center">
                    <div
                      className={`flex items-center justify-center h-[2vw] w-[2vw] rounded-[0.5vw] cursor-pointer transition-colors shadow-sm ${showStrokeSettings ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white text-gray-500'}`}
                      onClick={(e) => {
                        const row = e.currentTarget.closest('.flex.items-center.gap-\\[0\\.4vw\\].py-\\[0\\.1vw\\]') || e.currentTarget;
                        const rowRect = row.getBoundingClientRect();
                        const btnRect = e.currentTarget.getBoundingClientRect();
                        const popupHeight = 250; // Estimated height for dash popup

                        // Add 1.5vw to offset the popup cleanly from the sidebar's left edge
                        const pos = { right: `calc(100vw - ${rowRect.left}px + 1.5vw)` };

                        // Vertically center relative to the button, keeping within screen bounds
                        const centerY = btnRect.top + (btnRect.height / 2) - (popupHeight / 2);
                        pos.top = Math.max(90, Math.min(centerY, window.innerHeight - popupHeight - 20));

                        setStrokeSettingsPos(pos);
                        setShowStrokeSettings(!showStrokeSettings);
                      }}
                    >
                      <SlidersHorizontal size="1.1vw" className="currentColor" />
                    </div>
                  </div>

                  {/* This right part matches the ColorField input box width exactly */}
                  <div className="flex-grow flex items-center gap-[0.4vw]">
                    <div className="relative flex-grow h-[2.5vw]">
                      <div
                        className={`h-full px-[0.7vw] border-[0.1vw] rounded-[0.75vw] flex items-center gap-[0.5vw] cursor-pointer justify-between bg-white transition-all font-semibold ${isStrokeTypeOpen ? 'border-indigo-500 shadow-sm' : 'border-gray-400 hover:border-indigo-400'}`}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                          setIsStrokeStyleOpen(!isStrokeStyleOpen);
                        }}
                      >
                        <span className="text-[0.75vw] text-gray-700 whitespace-nowrap overflow-hidden">
                          {(selectedElementProps.strokeDasharray && selectedElementProps.strokeDasharray !== 'none') ? 'Dashed' : 'Solid'}
                        </span>
                        <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${isStrokeStyleOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isStrokeStyleOpen && createPortal(
                        <div
                          className="absolute py-1 bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-[9999] animate-in fade-in zoom-in duration-200"
                          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                        >
                          {['Solid', 'Dashed'].map((type) => (
                            <div
                              key={type}
                              className={`px-[1vw] py-[0.5vw] text-[0.8vw] cursor-pointer transition-colors ${(type === 'Solid' && (!selectedElementProps.strokeDasharray || selectedElementProps.strokeDasharray === 'none')) ||
                                (type === 'Dashed' && selectedElementProps.strokeDasharray && selectedElementProps.strokeDasharray !== 'none')
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-semibold'
                                }`}
                              onClick={() => {
                                updateAttr('stroke-dasharray', type === 'Dashed' ? '5,5' : 'none');
                                setIsStrokeStyleOpen(false);
                              }}
                            >
                              {type}
                            </div>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>

                    <div className="h-[2.5vw] w-[4.5vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center px-[0.6vw] gap-[0.3vw] bg-white hover:border-indigo-400 transition-colors flex-shrink-0">
                      <div
                        className="cursor-ew-resize hover:bg-gray-50 p-[0.2vw] rounded-[0.3vw] transition-colors"
                        onPointerDown={(e) => {
                          const initialVal = parseFloat(selectedElementProps.strokeWidth !== undefined ? selectedElementProps.strokeWidth : 0);
                          handleScrubHelper(e, initialVal, (val) => {
                            const newVal = Math.max(0, parseInt(val));
                            updateAttr('stroke-width', newVal.toString());
                          }, 8);
                        }}
                      >
                        <Icon icon="material-symbols:line-weight" width="1vw" height="1vw" className="text-gray-500 flex-shrink-0" />
                      </div>
                      <input
                        type="number"
                        value={selectedElementProps.strokeWidth !== undefined && !isNaN(parseFloat(selectedElementProps.strokeWidth)) ? parseFloat(selectedElementProps.strokeWidth) : 0}
                        onChange={(e) => updateAttr('stroke-width', e.target.value)}
                        className="w-full text-[0.8vw] font-semibold outline-none text-right bg-transparent text-gray-700 no-spin"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CORNER RADIUS ACCORDION (FIGMA STYLE) */}
      {(selectedElementProps.tagName === 'rect' || selectedElementProps['data-shape-type'] === 'rectangle') && (
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => setOpenAccordion(openAccordion === 'corner' ? null : 'corner')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openAccordion === 'corner' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-semibold text-gray-900 text-[0.85vw]">Corner Radius</span>
            </div>
            <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openAccordion === 'corner' ? '' : 'rotate-180'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'corner' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1.5vw] relative flex flex-col items-center justify-center min-h-[9vw] bg-white">
                {/* 2x2 Grid of Inputs */}
                <div className="grid grid-cols-2 gap-x-[2.5vw] gap-y-[1.5vw] relative">
                  {[
                    { key: 'data-tl', roundedClass: 'rounded-tl-[1vw] rounded-tr-0 rounded-bl-0 rounded-br-0' },
                    { key: 'data-tr', roundedClass: 'rounded-tr-[1vw] rounded-tl-0 rounded-bl-0 rounded-br-0' },
                    { key: 'data-bl', roundedClass: 'rounded-bl-[1vw] rounded-tl-0 rounded-tr-0 rounded-br-0' },
                    { key: 'data-br', roundedClass: 'rounded-br-[1vw] rounded-tl-0 rounded-tr-0 rounded-bl-0' }
                  ].map((corner, idx) => {
                    const val = parseInt(selectedElementProps[corner.key] !== undefined ? selectedElementProps[corner.key] : (selectedElementProps.rx || 0));
                    const updateVal = (newVal) => {
                      const clamped = Math.max(0, newVal);
                      if (selectedElementProps['data-corner-linked'] !== 'false') {
                        updateAttr('rx', clamped);
                        updateAttr('ry', clamped);
                        updateAttr('data-tl', clamped);
                        updateAttr('data-tr', clamped);
                        updateAttr('data-bl', clamped);
                        updateAttr('data-br', clamped);
                      } else {
                        updateAttr(corner.key, clamped);
                      }
                    };

                    return (
                      <div key={corner.key} className="flex flex-col items-center">
                        <div
                          onPointerDown={(e) => {
                            // Only initiate drag if not clicking directly inside the numeric input
                            if (e.target.tagName === 'INPUT') return;
                            handleScrubHelper(e, val, (newVal) => updateVal(parseInt(newVal)));
                          }}
                          className={`w-[5.2vw] h-[2.8vw] border border-gray-400 ${corner.roundedClass} flex items-center justify-between px-[0.4vw] bg-white relative transition-colors hover:border-gray-600 cursor-ew-resize select-none`}
                        >
                          <button
                            onClick={() => updateVal(val - 1)}
                            className="text-gray-300 hover:text-gray-600 transition-colors pointer-events-auto"
                          >
                            <ChevronLeft size="0.9vw" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => updateVal(parseInt(e.target.value) || 0)}
                            className="w-full text-center text-[1vw] font-semibold text-gray-700 outline-none no-spin bg-transparent cursor-text"
                            onClick={(e) => e.stopPropagation()} // Prevent drag start when clicking input
                          />

                          <button
                            onClick={() => updateVal(val + 1)}
                            className="text-gray-300 hover:text-gray-600 transition-colors pointer-events-auto"
                          >
                            <ChevronRight size="0.9vw" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Link Button in Center Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <button
                      onClick={() => updateAttr('data-corner-linked', selectedElementProps['data-corner-linked'] === 'false' ? 'true' : 'false')}
                      className="bg-white p-[0.3vw] transition-all hover:scale-110 active:scale-95 rounded-full shadow-sm border border-gray-50 pointer-events-auto"
                    >
                      {selectedElementProps['data-corner-linked'] !== 'false' ? (
                        <Link2 size="1.4vw" className="text-black" />
                      ) : (
                        <Link2Off size="1.4vw" className="text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENTS ACCORDION */}
      {(selectedElementProps.tagName === 'image' || selectedElementProps.tagName === 'video' || selectedElementProps.tagName === 'img' || selectedElementProps.tagName === 'rect' || selectedElementProps['data-shape-type']) && (
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
          <div
            onClick={() => setOpenAccordion(openAccordion === 'adjustment' ? null : 'adjustment')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openAccordion === 'adjustment' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-semibold text-gray-900 text-[0.85vw]">Adjustments</span>
            </div>
            <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openAccordion === 'adjustment' ? '' : 'rotate-180'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'adjustment' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1.5vw] space-y-[0.8vw]">
                {['exposure', 'contrast', 'saturation', 'temperature', 'tint', 'highlights', 'shadows'].map((filter) => (
                  <AdjustmentSlider
                    key={filter}
                    label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                    value={selectedElementProps[`data-filter-${filter}`] || 0}
                    onChange={(val) => updateElementAttribute(activePageIndex, selectedLayerId, `data-filter-${filter}`, val)}
                    onReset={() => updateElementAttribute(activePageIndex, selectedLayerId, `data-filter-${filter}`, 0)}
                    min={-100}
                    max={100}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EFFECT ACCORDION CARDS (EXACT TEXT EDITOR STYLE) */}
      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm">
        <div
          onClick={() => setOpenAccordion(openAccordion === 'effect' ? null : 'effect')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${openAccordion === 'effect' ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-semibold text-gray-900 text-[0.85vw]">Effect</span>
          </div>
          <ChevronUp size="1vw" className={`text-gray-500 transition-transform duration-200 ${openAccordion === 'effect' ? '' : 'rotate-180'}`} />
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'effect' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1vw] space-y-[0.6vw]">
              {[
                { id: 'drop-shadow', label: 'Drop Shadow' },
                { id: 'inner-shadow', label: 'Inner Shadow' },
                { id: 'blur', label: 'Blur' },
                { id: 'background-blur', label: 'Background Blur' }
              ].map(effect => {
                const isActive = selectedElementProps[`data-effect-${effect.id}`] === 'true';
                return (
                  <div
                    key={effect.id}
                    onClick={(e) => {
                      if (!isActive) {
                        updateAttr(`data-effect-${effect.id}`, 'true');
                      }
                      handleEffectRowClick(e, effect.id);
                    }}
                    className={`effect-row flex items-center justify-between px-[1vw] py-[0.8vw] bg-gray-50/50 rounded-[0.8vw] border transition-all group cursor-pointer ${activeEffectPopupId === effect.id ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <span className={`text-[0.85vw] font-semibold transition-colors ${activeEffectPopupId === effect.id ? 'text-indigo-600' : 'text-gray-800'}`}>{effect.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) {
                          // When adding, both enable the effect and open the properties
                          updateAttr(`data-effect-${effect.id}`, 'true');
                          handleEffectRowClick(e, effect.id);
                        } else {
                          // When removing, just disable it
                          updateAttr(`data-effect-${effect.id}`, 'false');
                        }
                      }}
                      className={`transition-colors ${isActive ? 'text-red-500 hover:text-red-700' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                      {isActive ? <Trash2 size="1vw" /> : <Plus size="1vw" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PORTALED EFFECT PROPERTIES */}
      {activeEffectPopupId && createPortal(
        <div
          className="effect-popup-container fixed z-[4000] w-[18vw] bg-white rounded-[1vw] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-gray-100 p-[1.2vw] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: effectPopupPos.top,
            right: effectPopupPos.right
          }}
        >
          <div className="flex flex-col space-y-[1vw]">
            {/* Header with Close */}
            <div className="flex items-center gap-[0.5vw]">
              <span className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">
                {{
                  'drop-shadow': 'Drop Shadow',
                  'inner-shadow': 'Inner Shadow',
                  'blur': 'Blur',
                  'background-blur': 'Background Blur'
                }[activeEffectPopupId]}
              </span>
              <div className="h-px flex-grow bg-gray-200"></div>
              <button
                onClick={() => {
                  setActiveEffectPopupId(null);
                  if (activeColorPicker?.includes('effect-')) {
                    setActiveColorPicker(null);
                    setShowDetailedPicker(false);
                  }
                }}
                className="p-[0.3vw] hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
              >
                <X size="1.1vw" className="text-gray-400" />
              </button>
            </div>

            {/* Main Controls Overlay (Matches User Image) */}
            {activeEffectPopupId.includes('shadow') && (
              <>
                <div className="flex items-center">
                  {/* 1. Extra Compact Color Preview Box */}
                  <div
                    className={`w-[4.5vw] h-[4vw] rounded-[0.5vw] border relative overflow-hidden flex items-center justify-center text-[0.9vw] font-semibold text-white shadow-inner cursor-pointer transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${activeColorPicker === `data-effect-${activeEffectPopupId}-color` ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-300'}`}
                    style={{
                      backgroundColor: 'white',
                      backgroundImage: `linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)`,
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 3px 3px'
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPickerPosition({ top: rect.top, right: window.innerWidth - rect.left + 15 });
                      setActiveColorPicker(`data-effect-${activeEffectPopupId}-color`);
                      setShowDetailedPicker(true);
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: selectedElementProps[`data-effect-${activeEffectPopupId}-color`] || '#000000',
                        opacity: (selectedElementProps[`data-effect-${activeEffectPopupId}-opacity`] || 35) / 100
                      }}
                    />
                    <span className="relative z-10 drop-shadow-md">
                      {selectedElementProps[`data-effect-${activeEffectPopupId}-opacity`] || 35}%
                    </span>
                  </div>

                  {/* 2. Code & Opacity Right Side */}
                  <div className="flex-grow min-w-0 flex flex-col justify-center space-y-[0.4vw] w-full ml-[0.6vw]">
                    <div className="flex items-center gap-[0.3vw] w-full">
                      <span className="text-[0.8vw] font-semibold text-gray-800 w-[3vw] flex-shrink-0 text-left whitespace-nowrap">Code :</span>
                      <div className={`flex-grow flex items-center h-[2.2vw] bg-white border rounded-[0.5vw] px-[0.4vw] transition-all overflow-hidden ${activeColorPicker === `data-effect-${activeEffectPopupId}-color` ? 'border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}>
                        <input
                          type="text"
                          value={(selectedElementProps[`data-effect-${activeEffectPopupId}-color`] || '#000000').toUpperCase()}
                          onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-color`, e.target.value)}
                          className="w-full bg-transparent outline-none text-[0.75vw] font-mono font-semibold text-gray-700 min-w-0"
                        />
                        <Pipette size="0.9vw" className="text-gray-400 rotate-90 flex-shrink-0" />
                      </div>
                    </div>

                    <div className="flex items-center gap-[0.4vw] w-full">
                      <span
                        className="text-[0.8vw] font-medium text-gray-800 w-[3vw] flex-shrink-0 text-left whitespace-nowrap cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                        onPointerDown={(e) => {
                          const currentVal = selectedElementProps[`data-effect-${activeEffectPopupId}-opacity`] || 35;
                          handleScrub(e, currentVal, (val) => {
                            const clamped = Math.max(0, Math.min(100, parseInt(val)));
                            updateAttr(`data-effect-${activeEffectPopupId}-opacity`, clamped.toString());
                          });
                        }}
                      >Opacity :</span>
                      <div className="flex-grow flex items-center gap-[0.4vw] min-w-0">
                        <input
                          type="range"
                          min="0" max="100"
                          value={selectedElementProps[`data-effect-${activeEffectPopupId}-opacity`] || 35}
                          onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-opacity`, e.target.value)}
                          className="flex-grow h-[0.3vw] accent-[#5d5efc] cursor-pointer outline-none min-w-[5.5vw]"
                        />
                        <span className="text-[0.5vw] font-semibold text-gray-800 min-w-[2vw] text-left whitespace-nowrap flex-shrink-0">
                          {selectedElementProps[`data-effect-${activeEffectPopupId}-opacity`] || 35}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Axis, Blur, Spread Grid */}
                <div className="space-y-[0.8vw] pt-[0.2vw]">
                  {[
                    { id: 'x', label: 'X Axis :', default: 4 },
                    { id: 'y', label: 'Y Axis :', default: 4 },
                    { id: 'blur', label: 'Blur % :', default: 1 },
                    { id: 'spread', label: 'Spread :', default: 0 }
                  ].map((row) => (
                    <div key={row.id} className="flex items-center">
                      <span
                        className="text-[0.8vw] font-medium text-gray-800 w-[5.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                        onPointerDown={(e) => {
                          const currentVal = selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default;
                          handleScrub(e, currentVal, (val) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, val));
                        }}
                      >{row.label}</span>
                      <div className="flex items-center justify-center gap-[0.8vw] flex-grow">
                        <ChevronLeft
                          size="1vw"
                          className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            const val = parseInt(selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default);
                            updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, (val - 1).toString());
                          }}
                        />
                        <div
                          className="w-[4.5vw] h-[2.2vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-gray-50/50 shadow-sm hover:border-indigo-200 transition-all cursor-ew-resize select-none"
                          onPointerDown={(e) => {
                            if (e.target.tagName === 'INPUT') return;
                            const currentVal = selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default;
                            handleScrubHelper(e, currentVal, (val) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, val));
                          }}
                        >
                          <input
                            type="number"
                            value={selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default}
                            onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center text-[0.85vw] font-semibold text-gray-800 outline-none no-spin bg-transparent cursor-text"
                          />
                        </div>
                        <ChevronRight
                          size="1vw"
                          className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                          onClick={() => {
                            const val = parseInt(selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default);
                            updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, (val + 1).toString());
                          }}
                        />
                      </div>
                      <div className="w-[0.5vw]"></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Blur Only Style (Simplified) */}
            {/* Blur Style (Matches User Image) */}
            {(activeEffectPopupId === 'blur' || activeEffectPopupId === 'background-blur') && (
              <div className="space-y-[0.8vw] pt-[0.2vw]">
                {[
                  { id: 'value', label: 'Blur % :', default: 1 },
                  { id: 'spread', label: 'Spread :', default: 0 }
                ].map((row) => (
                  <div key={row.id} className="flex items-center">
                    <span
                      className="text-[0.8vw] font-medium text-gray-800 w-[5.5vw] cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                      onPointerDown={(e) => {
                        const currentVal = selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default;
                        handleScrub(e, currentVal, (val) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, val));
                      }}
                    >{row.label}</span>
                    <div className="flex items-center justify-center gap-[0.8vw] flex-grow">
                      <ChevronLeft
                        size="1vw"
                        className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                        onClick={() => {
                          const val = parseInt(selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default);
                          updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, (val - 1).toString());
                        }}
                      />
                      <div
                        className="w-[4.5vw] h-[2.2vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-gray-50/50 shadow-sm hover:border-indigo-200 transition-all cursor-ew-resize select-none"
                        onPointerDown={(e) => {
                          if (e.target.tagName === 'INPUT') return;
                          const currentVal = selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default;
                          handleScrubHelper(e, currentVal, (val) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, val));
                        }}
                      >
                        <input
                          type="number"
                          value={selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default}
                          onChange={(e) => updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-center text-[0.85vw] font-semibold text-gray-800 outline-none no-spin bg-transparent cursor-text"
                        />
                      </div>
                      <ChevronRight
                        size="1vw"
                        className="text-gray-400 cursor-pointer hover:text-indigo-500 transition-colors"
                        onClick={() => {
                          const val = parseInt(selectedElementProps[`data-effect-${activeEffectPopupId}-${row.id}`] || row.default);
                          updateAttr(`data-effect-${activeEffectPopupId}-${row.id}`, (val + 1).toString());
                        }}
                      />
                    </div>
                    <div className="w-[0.5vw]"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* PORTALED COLOR SELECTOR PANELS (EXACT TEXT EDITOR STYLE) */}
      {showStrokeSettings && createPortal(
        <div
          id="stroke-settings-popup"
          className="fixed z-[4000] w-[15vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col p-[1vw] space-y-[1vw] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: strokeSettingsPos.top,
            bottom: strokeSettingsPos.bottom,
            right: strokeSettingsPos.right
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-800">Properties</span>
            <div className="h-px flex-grow bg-gray-100"></div>
            <button
              onClick={() => {
                setShowStrokeSettings(false);
                if (activeColorPicker?.includes('stroke')) {
                  setActiveColorPicker(null);
                  setShowDetailedPicker(false);
                }
              }}
              className="p-[0.3vw] hover:bg-gray-100 rounded-[0.5vw] transition-colors"
            >
              <X size="1vw" className="text-gray-400" />
            </button>
          </div>

          {/* Position Selection */}
          <div className="flex items-center justify-between">
            <span className="text-[0.75vw] font-semibold text-gray-600">Position :</span>
            <div className="relative flex-grow ml-[1vw]">
              <div
                className="h-[2vw] px-[0.7vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-white min-w-[5.5vw]"
                onClick={() => setIsDashPosOpen(!isDashPosOpen)}
              >
                <span className="text-[0.7vw] font-semibold text-gray-700 capitalize">{selectedElementProps['data-stroke-position'] || 'Center'}</span>
                <ChevronDown size="0.8vw" className="text-gray-400" />
              </div>
              {isDashPosOpen && (
                <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                  {['Inside', 'Center', 'Outside'].map(pos => (
                    <div
                      key={pos}
                      onClick={() => {
                        updateAttr('data-stroke-position', pos);
                        setIsDashPosOpen(false);
                      }}
                      className="px-[1vw] py-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[0.1vw] bg-gray-50 w-full" />

          {/* Length & Gap Steppers */}
          <div className={`space-y-[0.75vw] ${(!selectedElementProps.strokeDasharray || selectedElementProps.strokeDasharray === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
            {[
              { label: 'Length', key: 'dash' },
              { label: 'Gap', key: 'gap' }
            ].map(item => {
              const dashArray = (selectedElementProps.strokeDasharray || '5,5').split(',');
              const val = parseInt(item.key === 'dash' ? dashArray[0] : (dashArray[1] || dashArray[0]));

              const updateValue = (newVal) => {
                const v = Math.max(0, newVal);
                const d = item.key === 'dash' ? v : dashArray[0];
                const g = item.key === 'gap' ? v : (dashArray[1] || dashArray[0]);
                updateAttr('stroke-dasharray', `${d},${g}`);
              };

              return (
                <div key={item.key} className="flex items-center justify-between">
                  <span
                    className="text-[0.75vw] font-semibold text-gray-600 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
                    onPointerDown={(e) => handleScrub(e, val, (v) => updateValue(parseInt(v)))}
                  >{item.label} :</span>
                  <div
                    className="flex items-center gap-[0.4vw] h-[2vw] cursor-ew-resize select-none"
                    onPointerDown={(e) => {
                      if (e.target.tagName === 'INPUT') return;
                      handleScrubHelper(e, val, (newVal) => updateValue(parseInt(newVal)));
                    }}
                  >
                    <button onClick={() => updateValue(val - 1)} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronLeft size="0.9vw" /></button>
                    <div className="w-[3.5vw] h-full border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-sm pointer-events-auto">
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => updateValue(parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-center text-[0.75vw] font-semibold text-gray-700 outline-none no-spin bg-transparent cursor-text"
                      />
                    </div>
                    <button onClick={() => updateValue(val + 1)} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronRight size="0.9vw" /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-[0.1vw] bg-gray-50 w-full" />

          {/* Round Corners Toggle */}
          <div className={`flex items-center justify-between ${(!selectedElementProps.strokeDasharray || selectedElementProps.strokeDasharray === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-[0.75vw] font-semibold text-gray-600">Round Corners :</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentCap = selectedElementProps.strokeLinecap || selectedElementProps['stroke-linecap'];
                const isRound = currentCap === 'round';
                updateAttr('stroke-linecap', isRound ? 'butt' : 'round');
                updateAttr('stroke-linejoin', isRound ? 'miter' : 'round');
              }}
              className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${selectedElementProps.strokeLinecap === 'round' || selectedElementProps['stroke-linecap'] === 'round' ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
            >
              <div className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${(selectedElementProps.strokeLinecap === 'round' || selectedElementProps['stroke-linecap'] === 'round') ? 'left-[0.9vw]' : 'left-[0.1vw]'}`} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* UNIFIED COLOR PICKER PORTAL */}
      {activeColorPicker && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: activeColorPicker.includes('effect-') ? `${effectPopupPos.top}px` : '50%',
            right: activeColorPicker.includes('effect-') ? `calc(${effectPopupPos.right} - 15.8vw)` : '10vw',
            transform: activeColorPicker.includes('effect-') ? 'none' : 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              color={(() => {
                if (activeColorPicker.includes('effect-')) {
                  return selectedElementProps[activeColorPicker] || '#000000';
                }
                const type = selectedElementProps[`${activeColorPicker}-type`] || 'solid';
                const currentVal = selectedElementProps[activeColorPicker] || '#000000';
                const stopsJson = selectedElementProps[`${activeColorPicker}-stops`];
                if (type === 'gradient' || currentVal.toLowerCase().includes('url(#')) {
                  const stops = stopsJson ? JSON.parse(stopsJson) : defaultStops;
                  const gType = selectedElementProps[`${activeColorPicker}-gradient-type`] || 'linear';
                  // Convert back to CSS string for the picker
                  return generateGradientString(
                    gType.charAt(0).toUpperCase() + gType.slice(1),
                    stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
                    parseInt(selectedElementProps[`${activeColorPicker}-angle`] || '0'),
                    parseInt(selectedElementProps[`${activeColorPicker}-radius`] || '100')
                  );
                }
                return selectedElementProps[activeColorPicker] || '#000000';
              })()}
              onChange={(newVal) => {
                if (activeColorPicker.includes('effect-')) {
                  updateAttr(activeColorPicker, newVal);
                  return;
                }

                if (newVal.includes('gradient')) {
                  const parsed = parseGradient(newVal);
                  if (parsed) {
                    updateAttr(`${activeColorPicker}-type`, 'gradient');
                    updateAttr(`${activeColorPicker}-gradient-type`, parsed.type.toLowerCase());
                    updateAttr(`${activeColorPicker}-stops`, JSON.stringify(parsed.stops.map(s => ({
                      color: s.color,
                      offset: s.offset,
                      opacity: s.opacity / 100
                    }))));
                    updateAttr(`${activeColorPicker}-angle`, (parsed.angle || 0).toString());
                    updateAttr(`${activeColorPicker}-radius`, (parsed.radius || 100).toString());
                    updateAttr(activeColorPicker, newVal);
                  }
                } else {
                  updateAttr(activeColorPicker, newVal);
                  updateAttr(`${activeColorPicker}-type`, 'solid');
                }
              }}
              opacity={(() => {
                if (activeColorPicker.includes('effect-')) {
                  const effectId = activeColorPicker.match(/effect-(.*)-color/)?.[1];
                  return selectedElementProps[`data-effect-${effectId}-opacity`] || 35;
                }
                return activeColorPicker === 'fill' ? (parseFloat(selectedElementProps.opacity || 1) * 100) : 100;
              })()}
              onOpacityChange={(newOpacity) => {
                if (activeColorPicker.includes('effect-')) {
                  const effectId = activeColorPicker.match(/effect-(.*)-color/)?.[1];
                  updateAttr(`data-effect-${effectId}-opacity`, newOpacity.toString());
                  return;
                }
                if (activeColorPicker === 'fill') {
                  updateAttr('opacity', (newOpacity / 100).toString());
                }
              }}
              onClose={() => setActiveColorPicker(null)}
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM CSS */}
      <style>{`
        .hide-opacity-bar .space-y-\\[1vw\\] > div:nth-child(2) {
          display: none !important;
        }

        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        body.is-scrubbing, body.is-scrubbing * {
          cursor: none !important;
          user-select: none !important;
        }
        .hide-cursor, .hide-cursor * {
          cursor: none !important;
        }
        .virtual-scrub-cursor {
          position: fixed;
          pointer-events: none;
          z-index: 100000;
          width: 2vw;
          height: 2vw;
          margin-left: -1vw;
          margin-top: -1vw;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0.1vw 0.2vw rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
};

const SubComponent = ({
  openSubSection, setOpenSubSection,
  backgroundColor, setBackgroundColor,
  filters, setFilters,
  radius, setRadius,
  isRadiusLinked, setIsRadiusLinked,
  activeEffects, setActiveEffects,
  effectSettings, setEffectSettings,
  activeColorPicker, setActiveColorPicker,
  showStrokeSettings, setShowStrokeSettings,
  isStrokeStyleOpen, setIsStrokeStyleOpen,
  dropdownPos, setDropdownPos,
  strokeSettingsPos, setStrokeSettingsPos,
  isDashPosOpen, setIsDashPosOpen,
  activePopup, setActivePopup,
  colorsOnPage,
  showDetailedPicker, setShowDetailedPicker,
  tagName = 'rect'
}) => {
  const pseudoProps = {
    fill: backgroundColor?.fill || '#000000',
    opacity: (backgroundColor?.fillOpacity || 100) / 100,
    stroke: backgroundColor?.stroke || 'none',
    'stroke-opacity': (backgroundColor?.strokeOpacity !== undefined ? backgroundColor.strokeOpacity : 100) / 100,
    'fill-type': backgroundColor?.fillType || 'solid',
    'fill-gradient-type': backgroundColor?.fillGradientType || 'linear',
    'fill-stops': backgroundColor?.fillStops,
    'fill-angle': backgroundColor?.fillAngle || 0,
    'fill-radius': backgroundColor?.fillRadius || 100,
    'stroke-type': backgroundColor?.strokeType || 'solid',
    'stroke-gradient-type': backgroundColor?.strokeGradientType || 'linear',
    'stroke-stops': backgroundColor?.strokeStops,
    'stroke-angle': backgroundColor?.strokeAngle || 0,
    'stroke-radius': backgroundColor?.strokeRadius || 100,
    'stroke-width': backgroundColor?.strokeWeight || 0,
    strokeWidth: backgroundColor?.strokeWeight || 0,
    'stroke-dasharray': backgroundColor?.strokeDashStyle === 'Dashed' ? `${backgroundColor?.strokeDashLength ?? 5},${backgroundColor?.strokeDashGap ?? 5}` : 'none',
    strokeDasharray: backgroundColor?.strokeDashStyle === 'Dashed' ? `${backgroundColor?.strokeDashLength ?? 5},${backgroundColor?.strokeDashGap ?? 5}` : 'none',
    'stroke-linecap': backgroundColor?.strokeLinecap || 'butt',
    'data-stroke-position': backgroundColor?.strokePosition || 'Center',
    'data-tl': radius?.tl || 0,
    'data-tr': radius?.tr || 0,
    'data-bl': radius?.bl || 0,
    'data-br': radius?.br || 0,
    'data-corner-linked': isRadiusLinked ? 'true' : 'false',
    rx: Math.max(radius?.tl || 0, radius?.tr || 0, radius?.bl || 0, radius?.br || 0),
    ry: Math.max(radius?.tl || 0, radius?.tr || 0, radius?.bl || 0, radius?.br || 0),
    'data-effect-drop-shadow': activeEffects?.includes('Drop Shadow') ? 'true' : 'false',
    'data-effect-inner-shadow': activeEffects?.includes('Inner Shadow') ? 'true' : 'false',
    'data-effect-blur': activeEffects?.includes('Blur') ? 'true' : 'false',
    'data-effect-background-blur': activeEffects?.includes('Background Blur') ? 'true' : 'false',
    'data-effect-drop-shadow-color': effectSettings?.['Drop Shadow']?.color || '#000000',
    'data-effect-drop-shadow-opacity': effectSettings?.['Drop Shadow']?.opacity || 35,
    'data-effect-drop-shadow-x': effectSettings?.['Drop Shadow']?.x || 4,
    'data-effect-drop-shadow-y': effectSettings?.['Drop Shadow']?.y || 4,
    'data-effect-drop-shadow-blur': effectSettings?.['Drop Shadow']?.blur || 1,
    'data-effect-drop-shadow-spread': effectSettings?.['Drop Shadow']?.spread || 0,
    'data-effect-inner-shadow-color': effectSettings?.['Inner Shadow']?.color || '#000000',
    'data-effect-inner-shadow-opacity': effectSettings?.['Inner Shadow']?.opacity || 35,
    'data-effect-inner-shadow-x': effectSettings?.['Inner Shadow']?.x || 4,
    'data-effect-inner-shadow-y': effectSettings?.['Inner Shadow']?.y || 4,
    'data-effect-inner-shadow-blur': effectSettings?.['Inner Shadow']?.blur || 1,
    'data-effect-inner-shadow-spread': effectSettings?.['Inner Shadow']?.spread || 0,
    'data-effect-blur-value': effectSettings?.['Blur']?.blur || 1,
    'data-effect-blur-spread': effectSettings?.['Blur']?.spread || 0,
    'data-effect-background-blur-value': effectSettings?.['Background Blur']?.blur || 1,
    'data-effect-background-blur-spread': effectSettings?.['Background Blur']?.spread || 0,
    'data-filter-exposure': filters?.exposure || 0,
    'data-filter-contrast': filters?.contrast || 0,
    'data-filter-saturation': filters?.saturation || 0,
    'data-filter-temperature': filters?.temperature || 0,
    'data-filter-tint': filters?.tint || 0,
    'data-filter-highlights': filters?.highlights || 0,
    'data-filter-shadows': filters?.shadows || 0,
    tagName: tagName
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (typeof attr === 'object' && attr !== null) {
      Object.entries(attr).forEach(([k, v]) => {
        handleUpdate(page, layer, k, v);
      });
      return;
    }
    if (attr === 'fill' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fill: value }));
    if (attr === 'fill-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillType: value }));
    if (attr === 'fill-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillGradientType: value }));
    if (attr === 'fill-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillStops: value }));
    if (attr === 'fill-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillAngle: parseFloat(value) }));
    if (attr === 'fill-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillRadius: parseFloat(value) }));
    if (attr === 'opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke' && setBackgroundColor) setBackgroundColor(p => ({ ...p, stroke: value, strokeWeight: (p.strokeWeight === 0 && value !== 'transparent' && value !== 'none') ? 2 : p.strokeWeight }));
    if (attr === 'stroke-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeType: value }));
    if (attr === 'stroke-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeGradientType: value }));
    if (attr === 'stroke-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeStops: value }));
    if (attr === 'stroke-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeAngle: parseFloat(value) }));
    if (attr === 'stroke-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeRadius: parseFloat(value) }));
    if (attr === 'stroke-opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke-width' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeWeight: parseFloat(value) }));
    if (attr === 'stroke-dasharray' && setBackgroundColor) {
      if (value === 'none') {
        setBackgroundColor(p => ({ ...p, strokeDashStyle: 'Solid' }));
      } else {
        const parts = value.split(',');
        const parsedLen = parseInt(parts[0]);
        const dashLen = isNaN(parsedLen) ? 5 : parsedLen;
        const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
        const dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
        setBackgroundColor(p => ({
          ...p,
          strokeDashStyle: 'Dashed',
          strokeDashLength: dashLen,
          strokeDashGap: dashGap
        }));
      }
    }
    if (attr === 'data-stroke-position' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokePosition: value }));
    if (attr === 'stroke-linecap' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeLinecap: value }));


    if (attr === 'data-tl' && setRadius) setRadius(p => ({ ...p, tl: parseFloat(value) }));
    if (attr === 'data-tr' && setRadius) setRadius(p => ({ ...p, tr: parseFloat(value) }));
    if (attr === 'data-bl' && setRadius) setRadius(p => ({ ...p, bl: parseFloat(value) }));
    if (attr === 'data-br' && setRadius) setRadius(p => ({ ...p, br: parseFloat(value) }));
    if ((attr === 'rx' || attr === 'ry') && setRadius) {
      setRadius(p => ({ ...p, tl: parseFloat(value), tr: parseFloat(value), bl: parseFloat(value), br: parseFloat(value) }));
    }
    if (attr === 'data-corner-linked' && setIsRadiusLinked) setIsRadiusLinked(value === 'true');

    if (attr.startsWith('data-filter-') && setFilters) {
      const filterName = attr.replace('data-filter-', '');
      setFilters(p => ({ ...p, [filterName]: parseFloat(value) }));
    }

    if (attr.startsWith('data-effect-')) {
      if (attr === 'data-effect-drop-shadow') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Drop Shadow'])] : p.filter(e => e !== 'Drop Shadow'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Drop Shadow': {
              color: p['Drop Shadow']?.color || '#000000',
              opacity: p['Drop Shadow']?.opacity ?? 35,
              x: p['Drop Shadow']?.x ?? 4,
              y: p['Drop Shadow']?.y ?? 4,
              blur: p['Drop Shadow']?.blur ?? 1,
              spread: p['Drop Shadow']?.spread ?? 0
            }
          }));
        }
      } else if (attr === 'data-effect-inner-shadow') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Inner Shadow'])] : p.filter(e => e !== 'Inner Shadow'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Inner Shadow': {
              color: p['Inner Shadow']?.color || '#000000',
              opacity: p['Inner Shadow']?.opacity ?? 35,
              x: p['Inner Shadow']?.x ?? 4,
              y: p['Inner Shadow']?.y ?? 4,
              blur: p['Inner Shadow']?.blur ?? 1,
              spread: p['Inner Shadow']?.spread ?? 0
            }
          }));
        }
      } else if (attr === 'data-effect-blur') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Blur'])] : p.filter(e => e !== 'Blur'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Blur': {
              blur: p['Blur']?.blur ?? 4,
              spread: p['Blur']?.spread ?? 0
            }
          }));
        }
      } else if (attr === 'data-effect-background-blur') {
        if (setActiveEffects) setActiveEffects(p => value === 'true' ? [...new Set([...p, 'Background Blur'])] : p.filter(e => e !== 'Background Blur'));
        if (value === 'true' && setEffectSettings) {
          setEffectSettings(p => ({
            ...p,
            'Background Blur': {
              blur: p['Background Blur']?.blur ?? 4,
              spread: p['Background Blur']?.spread ?? 0
            }
          }));
        }
      } else {
        let effectName = '';
        let setting = '';
        if (attr.startsWith('data-effect-drop-shadow-')) {
          effectName = 'Drop Shadow';
          setting = attr.replace('data-effect-drop-shadow-', '');
        } else if (attr.startsWith('data-effect-inner-shadow-')) {
          effectName = 'Inner Shadow';
          setting = attr.replace('data-effect-inner-shadow-', '');
        } else if (attr.startsWith('data-effect-background-blur-')) {
          effectName = 'Background Blur';
          setting = attr.replace('data-effect-background-blur-', '');
        } else if (attr.startsWith('data-effect-blur-')) {
          effectName = 'Blur';
          setting = attr.replace('data-effect-blur-', '');
        }
        if (effectName && setEffectSettings) {
          if (setting === 'value') setting = 'blur';
          setEffectSettings(p => ({
            ...p,
            [effectName]: { ...p[effectName], [setting]: setting === 'color' ? value : parseFloat(value) }
          }));
        }
      }
    }
  };

  return <ShapePropertiesUI selectedElementProps={pseudoProps} updateElementAttribute={handleUpdate} openSubSection={openSubSection} setOpenSubSection={setOpenSubSection} />;
};

export default SubComponent;




