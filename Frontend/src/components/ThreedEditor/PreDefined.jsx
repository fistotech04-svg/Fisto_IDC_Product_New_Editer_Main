import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";

// --- Reusable UI Components ---

const Accordion = ({ title, icon: iconName, children, isOpen, onToggle, iconSize = "1.04vw", onReset }) => {
  return (
    <div className="bg-white rounded-[0.75vw] shadow-sm border border-gray-100 overflow-hidden mb-[0.75vw] transition-all duration-200 hover:shadow-md">
      <div
        className={`flex items-center justify-between px-[1vw] py-[0.85vw] bg-white cursor-pointer select-none transition-colors duration-200 ${
          isOpen ? "border-b border-gray-100" : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-[0.75vw] text-gray-800 font-semibold text-[0.85vw]">
          {iconName && <Icon icon={iconName} width={iconSize} height={iconSize} className="text-gray-500" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-[0.75vw] text-gray-400">
          <button
            className="hover:text-[#5d5efc] hover:bg-indigo-50 p-[0.25vw] rounded-[0.35vw] transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              if (onReset) onReset();
            }}
          >
            <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
          </button>
          <Icon
            icon="heroicons:chevron-down"
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            width="0.85vw"
            height="0.85vw"
          />
        </div>
      </div>

      <div
        className={`bg-white transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-[1.25vw] pt-[0.5vw]">{children}</div>
      </div>
    </div>
  );
};

const MapUploadControl = ({ mapType, currentMap, onUpload }) => {
  const fileInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) {
      onUpload(mapType, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      onUpload(mapType, file);
    }
  };

  return (
    <div 
      className={`w-[2.25vw] h-[2.25vw] rounded-[0.25vw] border overflow-hidden shrink-0 cursor-pointer transition-all flex items-center justify-center relative group
        ${isDragging ? "border-[#5d5efc] bg-indigo-50 scale-110 shadow-sm" : "border-gray-200 bg-gray-50 text-gray-400 hover:border-[#5d5efc]"}
      `}
      onClick={() => fileInputRef.current.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} hidden accept=".hdr,.exr,image/*" onChange={handleFileChange} />
      {currentMap ? (
        <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[#5d5efc] relative">
           <Icon icon="heroicons:check-circle" width="1.25vw" />
           {/* Clear Button on Hover */}
           <div 
             onClick={(e) => {
               e.stopPropagation();
               if (onUpload) onUpload(mapType, null);
             }}
             className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
           >
              <Icon icon="heroicons:x-mark" width="1.25vw" />
           </div>
        </div>
      ) : (
        <Icon 
          icon={isDragging ? "heroicons:arrow-down-tray" : "heroicons:arrow-up-tray"} 
          width="0.85vw" 
          height="0.85vw" 
          className={isDragging ? "text-[#5d5efc]" : ""}
        />
      )}
    </div>
  );
};

const SectionHeader = ({ label, showLine = true }) => (
  <div className="flex items-center gap-[0.75vw] mb-[1vw] mt-[0.5vw]">
    <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">
      {label}
    </span>
    {showLine && <div className="h-[0.05vw] bg-gray-100 w-full flex-1"></div>}
  </div>
);

const CustomSlider = ({ label, value, onChange, unit = "%", min = 0, max = 100, step = 1 }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex items-center justify-between mb-[1.25vw] last:mb-0 h-[1.75vw]">
      <div className="w-[6vw] text-[0.75vw] font-medium text-gray-600 shrink-0 flex items-center justify-between pr-[0.5vw]">
        {label} <span>:</span>
      </div>
      <div className="relative flex-1 h-[0.4vw] bg-gray-100 rounded-full cursor-pointer group touch-none">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full transition-all duration-75"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        ></div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] bg-[#5d5efc] border-[0.15vw] border-white rounded-full shadow-md hover:scale-110 transition-transform duration-100"
          style={{ left: `${Math.max(0, Math.min(100, percentage))}%`, marginLeft: "-0.45vw" }}
        ></div>
        {/* Input Range (Hidden overlay for functionality) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>
      <div className="w-[2.5vw] text-right text-[0.62vw] font-medium text-gray-500 tabular-nums">
        {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value} <span className="text-[0.75vw] ml-[0.15vw] text-gray-400">{unit}</span>
      </div>
    </div>
  );
};

const NumberStepper = ({ label, value, axisLabel, compact, onChange, step = 1 }) => {
  const handleIncrement = () => {
    if (onChange) {
      onChange(parseFloat(value) + step);
    }
  };

  const handleDecrement = () => {
    if (onChange) {
      onChange(parseFloat(value) - step);
    }
  };

  return (
    <div
      className={`flex items-center ${
        label ? "justify-between" : "justify-center"
      } ${compact ? "gap-[0.25vw]" : "gap-[0.5vw] mb-[0.75vw]"}`}
    >
      {label && (
        <div className={`font-medium text-gray-600 ${compact ? "text-[0.65vw] w-[6vw]" : "text-[0.68vw] w-[6vw]"}`}>
           {label} :
        </div>
      )}

      <div className={`flex items-center ${compact ? "gap-[0.25vw]" : "gap-[0.5vw]"}`}>
        {axisLabel && (
          <span className={`${compact ? "text-[0.65vw] w-[0.75vw]" : "text-[0.58vw]"} text-gray-500 uppercase text-center font-bold`}>
            {axisLabel}:
          </span>
        )}
        <button 
          onClick={handleDecrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "" : "p-[0.15vw] hover:bg-indigo-50 rounded"}`}
        >
          <Icon
            icon="heroicons:chevron-left"
            width={compact ? "0.65vw" : "0.85vw"}
            height={compact ? "0.65vw" : "0.85vw"}
          />
        </button>
        <div
          className={`${
            compact ? "px-[0.4vw] py-[0.15vw] min-w-[1.65vw] text-[0.6vw] rounded" : "px-[0.75vw] py-[0.4vw] min-w-[2.3vw] text-[0.65vw] rounded-[0.35vw]"
          } border border-gray-200 text-gray-700 font-semibold text-center bg-white shadow-sm hover:border-[#5d5efc] transition-colors`}
        >
          {value}
        </div>
        <button 
          onClick={handleIncrement}
          className={`text-gray-400 hover:text-[#5d5efc] transition-colors ${compact ? "" : "p-[0.15vw] hover:bg-indigo-50 rounded"}`}
        >
          <Icon
            icon="heroicons:chevron-right"
            width={compact ? "0.65vw" : "0.85vw"}
            height={compact ? "0.65vw" : "0.85vw"}
          />
        </button>
      </div>
    </div>
  );
};

const CustomDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const dropdownRef = React.useRef(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const toggleDropdown = () => {
      if (!isOpen && dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceNeeded = 200; // max-h-48 is roughly 192px
          
          if (spaceBelow < spaceNeeded) {
              setDropdownPosition('top');
          } else {
              setDropdownPosition('bottom');
          }
      }
      setIsOpen(!isOpen);
  };

  return (
    <div className="relative mb-[1.25vw]" ref={dropdownRef}>
      {label && (
         <div className="text-[0.68vw] font-medium text-gray-600 mb-[0.5vw] flex items-center justify-between">
            {label} <span>:</span>
         </div>
      )}
      
      <div 
        className={`w-full px-[0.75vw] py-[0.5vw] flex items-center justify-between bg-white border ${isOpen ? 'border-[#5d5efc] ring-1 ring-[#5d5efc]/20' : 'border-gray-200'} rounded-[0.5vw] shadow-sm cursor-pointer transition-all hover:border-gray-300`}
        onClick={toggleDropdown}
      >
         <span className="text-[0.65vw] font-medium text-gray-700 capitalize">
            {selectedOption?.label || value}
         </span>
         <Icon 
            icon="heroicons:chevron-down" 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            width="0.75vw" 
            height="0.75vw" 
         />
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 max-h-[12vw] overflow-y-auto custom-scrollbar ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
            {options.map((opt) => (
                <div 
                    key={opt.value}
                    className={`px-[0.75vw] py-[0.5vw] text-[0.65vw] cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-50 text-[#5d5efc] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                    }}
                >
                    {opt.label}
                </div>
            ))}
        </div>
      )}
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};

// --- Main Application ---

export default function SettingsPanel({ 
    controls, 
    updateControl, 
    activePanel, 
    setActivePanel, 
    transformValues, 
    onManualTransformChange, 
    onResetFactor, 
    onResetTransform, 
    onUvUnwrap,
    onMapUpload
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 });

  const handleColorClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const topPos = Math.max(10, rect.top - 80);
      setPickerPos({ 
          top: topPos, 
          right: window.innerWidth - rect.left + 16 
      });
      setShowColorPicker(!showColorPicker);
  };
  
  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // Helper to format values safely
  const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toFixed(2) : "0.00";
  const fmtDeg = (rad) => (rad !== undefined && rad !== null) ? Math.round(rad * (180 / Math.PI)) : "0";

  return (
    <div className="flex flex-col gap-[0.25vw] pb-[2.5vw]">
      {/* 1. Factor Adjustment Section */}
      <Accordion
        title="Factor Adjustment"
        icon="icon-park-outline:texture-two"
        isOpen={activePanel === "factor"}
        onToggle={() => togglePanel("factor")}
        onReset={onResetFactor}
      >

        <div className="space-y-[1.5vw]">
          {/* Color & Transparency */}
          <div>
            <SectionHeader label="Color & Transparency" />

            <div className="flex items-center justify-between mb-[1.25vw] mt-[1vw] group relative">
              <span className="text-[0.75vw] font-medium text-gray-600 w-[6vw] flex items-center justify-between pr-[0.5vw]">
                Factor <span>:</span>
              </span>
              <div className="flex items-center gap-[0.65vw] flex-1">
                <div 
                    className="w-[2vw] h-[2vw] rounded-[0.35vw] border border-gray-200 shadow-sm cursor-pointer hover:border-[#5d5efc] transition-colors"
                    style={{ backgroundColor: controls.color || '#000000' }}
                    onClick={handleColorClick}
                >
                </div>
                <div 
                    className="flex-1 flex items-center justify-between border border-gray-200 rounded-[0.35vw] px-[0.75vw] py-[0.4vw] bg-white hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
                    onClick={handleColorClick}
                >
                  <span className="text-[0.75vw] text-gray-600 font-medium tracking-wide font-mono uppercase">{controls.color || '#000000'}</span>
                  <span className="text-[0.75vw] text-gray-400 font-medium">{controls.alpha}%</span>
                </div>
              </div>

              {showColorPicker && createPortal(
                  <>
                    <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setShowColorPicker(false)}></div>
                    <ColorPicker 
                        color={controls.color || '#000000'} 
                        onChange={(c) => {
                             updateControl('color', c);
                             updateControl('useFactorColor', true);
                        }}
                        opacity={controls.alpha}
                        onOpacityChange={(val) => updateControl('alpha', val)}
                        onClose={() => setShowColorPicker(false)}
                        className=""
                        style={{ 
                            position: 'fixed', 
                            top: pickerPos.top, 
                            right: pickerPos.right, 
                            zIndex: 9999 
                        }}
                    />
                  </>,
                  document.body
              )}
            </div>

            <CustomSlider
              label="Alpha Blend"
              value={controls.alpha}
              onChange={(v) => updateControl("alpha", v)}
            />
          </div>

          {/* Surface Finish */}
          <div>
            <SectionHeader label="Surface Finish" />
            <div className="space-y-[0.25vw]">
                <CustomSlider
                label="Metallic"
                value={controls.metallic}
                onChange={(v) => updateControl("metallic", v)}
                />
                <CustomSlider
                label="Roughness"
                value={controls.roughness}
                onChange={(v) => updateControl("roughness", v)}
                />
            </div>
          </div>

          {/* Surface Detail */}
          <div>
            <SectionHeader label="Surface Detail" />
            <div className="space-y-[0.25vw]">
                <CustomSlider
                label="Normal Map"
                value={controls.normal}
                min={0}
                max={200}
                onChange={(v) => updateControl("normal", v)}
                />
                <CustomSlider
                label="Bump"
                value={controls.bump}
                min={0}
                max={200}
                onChange={(v) => updateControl("bump", v)}
                />
            </div>
          </div>

          {/* Texture Placement */}
          <div>
            <SectionHeader label="Texture Placement" />
            
            <div className="mb-[1vw] px-[0.25vw] flex items-center gap-[0.4vw] text-[0.65vw] text-green-600 font-medium bg-green-50 p-[0.5vw] rounded-[0.35vw] border border-green-100">
                 <Icon icon="fluent:checkmark-circle-20-filled" width="0.75vw" />
                 <span>UV Unwrapped</span>
            </div>

            <div className="space-y-[0.25vw]">
                <CustomSlider
                label="Scale X"
                value={controls.scale}
                onChange={(v) => updateControl("scale", v)}
                min={-100}
                max={100}
                unit=""
                />
                <CustomSlider
                label="Scale Y"
                value={controls.scaleY !== undefined ? controls.scaleY : controls.scale}
                onChange={(v) => updateControl("scaleY", v)}
                min={-100}
                max={100}
                unit=""
                />
                <CustomSlider
                label="Rotation"
                value={controls.rotation}
                min={-180}
                max={180}
                onChange={(v) => updateControl("rotation", v)}
                unit="°"
                />
            
                <div className="mt-[1.5vw] space-y-[0.25vw]">
                    <CustomSlider
                        label="Offset X"
                        value={controls.offset?.x || 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), x: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit=""
                    />
                    <CustomSlider
                        label="Offset Y"
                        value={controls.offset?.y || 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), y: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit=""
                    />
                </div>
            </div>
          </div>
        </div>
      </Accordion>

      {/* 2. Position Section (Updated) */}
      <Accordion
        title="Model Position"
        icon="hugeicons:3d-move"
        iconSize="1.25vw"
        isOpen={activePanel === "position"}
        onToggle={() => togglePanel("position")}
        onReset={() => onResetTransform('all')}
      >
        <div className="flex flex-col gap-[0.25vw] pb-[0.5vw]">
           {/* Move Row */}
           <div className="flex flex-col items-start gap-[0.5vw] mb-[0.5vw] w-full">
              <div className="flex items-center w-full pr-[0.25vw]">
                 <span className="text-[0.75vw] font-medium text-black ml-[0.25vw]">Move :</span>
                 <button onClick={() => onResetTransform('position')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.25vw] rounded-[0.35vw] hover:bg-gray-100" title="Reset Move">
                    <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-[0.5vw] w-full">
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.position?.x)} compact onChange={(val) => onManualTransformChange('position', 'x', val)} step={0.5} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.position?.y)} compact onChange={(val) => onManualTransformChange('position', 'y', val)} step={0.5} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.position?.z)} compact onChange={(val) => onManualTransformChange('position', 'z', val)} step={0.5} />
                 </div>
              </div>
           </div>

           {/* Rotate Row */}
           <div className="flex flex-col items-start gap-[0.5vw] mb-[0.5vw] bg-gray-50 rounded-[0.5vw] py-[0.5vw] w-full">
              <div className="flex items-center w-full pr-[0.25vw]">
                 <span className="text-[0.75vw] font-medium text-black ml-[0.25vw]">Rotate :</span>
                 <button onClick={() => onResetTransform('rotation')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.25vw] rounded-[0.35vw] hover:bg-gray-100" title="Reset Rotation">
                    <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-[0.5vw] w-full">
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.x)} compact onChange={(val) => onManualTransformChange('rotation', 'x', val)} step={5} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.y)} compact onChange={(val) => onManualTransformChange('rotation', 'y', val)} step={5} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmtDeg(transformValues?.rotation?.z)} compact onChange={(val) => onManualTransformChange('rotation', 'z', val)} step={5} />
                 </div>
              </div>
           </div>

           {/* Scale Row */}
           <div className="flex flex-col items-start gap-[0.5vw] w-full">
              <div className="flex items-center w-full pr-[0.25vw]">
                 <span className="text-[0.75vw] font-medium text-black ml-[0.25vw]">Scale :</span>
                 <button onClick={() => onResetTransform('scale')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.25vw] rounded-[0.35vw] hover:bg-gray-100" title="Reset Scale">
                    <Icon icon="ix:reset" width="0.85vw" height="0.85vw" />
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-[0.5vw] w-full">
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">X</span>
                    <NumberStepper value={fmt(transformValues?.scale?.x)} compact onChange={(val) => onManualTransformChange('scale', 'x', val)} step={0.1} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Y</span>
                    <NumberStepper value={fmt(transformValues?.scale?.y)} compact onChange={(val) => onManualTransformChange('scale', 'y', val)} step={0.1} />
                 </div>
                 <div className="flex flex-col items-center gap-[0.35vw]">
                    <span className="text-[0.6vw] font-semibold text-gray-400 uppercase">Z</span>
                    <NumberStepper value={fmt(transformValues?.scale?.z)} compact onChange={(val) => onManualTransformChange('scale', 'z', val)} step={0.1} />
                 </div>
              </div>
           </div>
        </div>
      </Accordion>

      {/* 3. Lightning Controls Section */}
      <Accordion
        title="Lightning Controls"
        icon="ix:light-dark"
        isOpen={activePanel === "lighting"}
        onToggle={() => togglePanel("lighting")}
      >
        {/* Visualizer Box */}
        <div className="relative bg-[#f8fafc] h-[9.375vw] rounded-[0.5vw] border border-gray-100 mb-[1.5vw] flex flex-col items-center justify-center shadow-inner overflow-hidden group">
          {/* Dynamic Sun Position */}
          <div 
            className="absolute text-amber-400 drop-shadow-sm transition-all duration-300"
            style={{
              left: `${50 + (controls.lightPosition?.x || 10) * 2}%`,
              top: `${50 - (controls.lightPosition?.y || 10) * 2}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon icon="heroicons:sun" width="1.25vw" height="1.25vw" />
          </div>

          <div className="flex flex-col items-center text-gray-300 group-hover:text-gray-400 transition-colors">
            <Icon icon="heroicons:cube" width="2.08vw" height="2.08vw" className="stroke-1" />
          </div>

          {/* Light Effect */}
          <div className="absolute inset-0 bg-linear-to-br from-white/60 via-transparent to-indigo-50/10 pointer-events-none"></div>
        </div>

        <div className="flex justify-center gap-[0.5vw] mb-[2vw]">
          <NumberStepper 
            value={Math.round(controls.lightPosition?.x || 10)} 
            axisLabel="X" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, x: val })}
            step={1}
          />
          <NumberStepper 
            value={Math.round(controls.lightPosition?.y || 10)} 
            axisLabel="Y" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, y: val })}
            step={1}
          />
          <NumberStepper 
            value={Math.round(controls.lightPosition?.z || 10)} 
            axisLabel="Z" 
            compact 
            onChange={(val) => updateControl('lightPosition', { ...controls.lightPosition, z: val })}
            step={1}
          />
        </div>

        <div className="space-y-[1.5vw]">
            <div>
                 <SectionHeader label="Environment" />
                 <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
                    <div className="flex-1">
                        <CustomDropdown 
                            value={controls.environment || 'city'}
                            onChange={(val) => updateControl('environment', val)}
                            options={[
                                { label: 'City', value: 'city' },
                                { label: 'Apartment', value: 'apartment' },
                                { label: 'Dawn', value: 'dawn' },
                                { label: 'Forest', value: 'forest' },
                                { label: 'Lobby', value: 'lobby' },
                                { label: 'Night', value: 'night' },
                                { label: 'Park', value: 'park' },
                                { label: 'Studio', value: 'studio' },
                                { label: 'Sunset', value: 'sunset' },
                                { label: 'Warehouse', value: 'warehouse' },
                            ]}
                        />
                    </div>
                    <div className="mb-[1.25vw]">
                        <MapUploadControl 
                            mapType="envMap" 
                            currentMap={controls.maps?.envMap} 
                            onUpload={onMapUpload} 
                        />
                    </div>
                </div>
                 <div className="mt-[0.5vw]">
                     <CustomSlider
                        label="Env Rotation"
                        value={controls.envRotation || 0}
                        min={0}
                        max={360}
                        onChange={(v) => updateControl("envRotation", v)}
                        unit="°"
                     />
                 </div>
            </div>


            <div>
                <SectionHeader label="Lighting & Reflection" />
                <div className="space-y-[0.25vw]">
                    <CustomSlider
                    label="Specular"
                    value={controls.specular}
                    onChange={(v) => updateControl("specular", v)}
                    />
                    <CustomSlider
                    label="Reflection"
                    value={controls.reflection}
                    onChange={(v) => updateControl("reflection", v)}
                    />
                </div>
            </div>

            <div>
                <SectionHeader label="Adjust Shadow" />
                <div className="space-y-[0.25vw]">
                    <CustomSlider
                    label="Shadow"
                    value={controls.shadow}
                    onChange={(v) => updateControl("shadow", v)}
                    />
                    <CustomSlider
                    label="Softness"
                    value={controls.softness}
                    onChange={(v) => updateControl("softness", v)}
                    />
                    <CustomSlider
                    label="AO"
                    value={controls.ao}
                    onChange={(v) => updateControl("ao", v)}
                    />
                </div>
            </div>
        </div>
      </Accordion>
    </div>
  );
}
