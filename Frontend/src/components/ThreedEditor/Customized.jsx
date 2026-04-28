import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "./ColorPicker";
import { createPortal } from "react-dom";
import { textureData } from "../../data/textureData";
import { useRef } from "react";
import { useEffect } from "react";

// --- Reusable UI Components (Matched to PreDefined.jsx) ---

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
          isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-[0.65vw] pt-[0.5vw]">{children}</div>
      </div>
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
const backendUrlGlobal = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const resolveMapUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return `${backendUrlGlobal}${url}`;
    return url;
};

const MapUploadControl = ({ mapType, currentMap, onUpload, overlay = false, disabled = false }) => {
  const fileInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e) => {
    if (disabled) return;
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
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      onUpload(mapType, file);
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target) && 
            buttonRef.current && !buttonRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (overlay) {
    return (
        <div 
            className={`absolute inset-0 group/upload ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={() => !disabled && fileInputRef.current.click()}
            onDragOver={disabled ? null : handleDragOver}
            onDragLeave={disabled ? null : handleDragLeave}
            onDrop={disabled ? null : handleDrop}
        >
            <input type="file" ref={fileInputRef} hidden accept=".hdr,.exr,image/*" onChange={handleFileChange} disabled={disabled} />
            
            {/* Menu Button */}
                <div 
                    ref={buttonRef}
                    className={`absolute top-[0.4vw] right-[0.4vw] w-[1.5vw] h-[1.5vw] bg-white/95 backdrop-blur-sm rounded-[0.4vw] border border-gray-300 flex items-center justify-center text-gray-500 shadow-sm hover:text-[#5d5efc] hover:bg-white transition-all z-20 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'} ${disabled ? 'pointer-events-none' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({ top: rect.bottom + 5, left: rect.left - 40 });
                        setShowMenu(!showMenu);
                    }}
                >
                    <Icon icon="heroicons:ellipsis-vertical-20-solid" width="1vw" />
                </div>

            {/* Dropdown Menu Portaled */}
            {showMenu && createPortal(
                <div 
                    ref={menuRef}
                    className="fixed w-[6vw] bg-white rounded-[0.65vw] shadow-2xl border border-gray-500 py-[0.4vw] z-[9999] animate-in fade-in zoom-in duration-200"
                    style={{ top: menuPos.top, left: menuPos.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        className="w-full flex items-center cursor-pointer gap-[0.5vw] px-[0.75vw] py-[0.5vw] hover:bg-gray-50 text-gray-700 transition-colors"
                        onClick={() => {
                            fileInputRef.current.click();
                            setShowMenu(false);
                        }}
                    >
                        <Icon icon="ix:replace" className="w-[1vw] h-[1vw]" />
                        <span className="text-[0.7vw] font-semibold">Replace</span>
                    </button>
                    <button 
                        className="w-full flex items-center cursor-pointer gap-[0.5vw] px-[0.75vw] py-[0.5vw] hover:bg-red-50 text-red-500 transition-colors"
                        onClick={() => {
                            if (onUpload) onUpload(mapType, null);
                            setShowMenu(false);
                        }}
                    >
                        <Icon icon="solar:trash-bin-trash-linear" className="w-[1vw] h-[1vw]" />
                        <span className="text-[0.7vw] font-semibold">Delete</span>
                    </button>
                </div>,
                document.body
            )}

            {/* Hover state overlay */}
            <div className="absolute inset-0 bg-[#5d5efc]/5 opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-[0.5vw]" />
        </div>
    );
  }

  return (
    <div 
      className={`w-[2.25vw] h-[2.25vw] rounded-[0.25vw] border overflow-hidden shrink-0 transition-all flex items-center justify-center relative group
        ${disabled ? "border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed opacity-60" : isDragging ? "border-[#5d5efc] bg-indigo-50 scale-110 shadow-sm" : "border-gray-200 bg-gray-50 text-gray-400 hover:border-[#5d5efc] cursor-pointer"}
      `}
      onClick={() => !disabled && fileInputRef.current.click()}
      onDragOver={disabled ? null : handleDragOver}
      onDragLeave={disabled ? null : handleDragLeave}
      onDrop={disabled ? null : handleDrop}
    >
      <input type="file" ref={fileInputRef} hidden accept=".hdr,.exr,image/*" onChange={handleFileChange} disabled={disabled} />
      {currentMap ? (
        <div className="w-full h-full relative group/thumb">
           <img 
              src={resolveMapUrl ? resolveMapUrl(currentMap) : (typeof currentMap === 'string' ? currentMap : '')} 
              alt="Texture Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                  // Fallback if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
              }}
           />
           <div className="hidden absolute inset-0 bg-indigo-50 items-center justify-center text-[#5d5efc]">
               <Icon icon="heroicons:check-circle" width="1.25vw" />
           </div>
           {/* Clear Button on Hover */}
           <div 
             onClick={(e) => {
               e.stopPropagation();
               if (onUpload) onUpload(mapType, null);
             }}
             className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity z-10"
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

const MapAccordion = ({ title, value, onChange, mapType, currentMap, onUpload, description, isOpen, onToggle, isIntensityDisabled = false, extra, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        if (disabled) return;
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
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/') && onUpload) {
            onUpload(mapType, file);
        }
    };

    return (
      <div 
        className={`border rounded-[0.5vw] mb-[0.65vw] bg-white transition-all duration-200 relative
            ${isDragging ? 'border-[#5d5efc] bg-indigo-50/30 scale-[1.02] z-10 shadow-lg' : 'border-gray-300'}
            ${isOpen ? 'shadow-sm' : 'hover:bg-gray-50/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 border-[0.15vw] border-dashed border-[#5d5efc] rounded-[0.5vw] pointer-events-none flex items-center justify-center bg-indigo-50/50 backdrop-blur-[1px] z-20">
                <div className="flex flex-col items-center gap-[0.5vw] animate-bounce">
                    <Icon icon="heroicons:arrow-up-tray" className="text-[#5d5efc] w-[1.5vw] h-[1.5vw]" />
                    <span className="text-[0.7vw] font-bold text-[#5d5efc] uppercase tracking-wider">Drop to upload {title}</span>
                </div>
            </div>
        )}

        <div 
          className={`flex items-center justify-between px-[0.65vw] py-[0.75vw] cursor-pointer group select-none ${isOpen ? 'border-b border-gray-200' : ''}`}
          onClick={onToggle}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className={`text-[0.75vw] font-semibold transition-colors ${isOpen ? 'text-[#5d5efc]' : 'text-gray-700 group-hover:text-gray-950'}`}>{title}</span>
          </div>
          <Icon 
             icon="heroicons:chevron-down" 
             className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
             width="0.85vw" 
          />
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[30vw] opacity-100 p-[0.65vw]' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-[1.25vw]">
                {!isIntensityDisabled && (
                    <CustomSlider
                        label=""
                        value={value}
                        onChange={onChange}
                    />
                )}
                
                <div className="flex gap-[0.65vw] items-start">
                    <div className={`w-[7vw] h-[7vw] rounded-[0.5vw] shrink-0 overflow-hidden relative group border border-gray-300 shadow-inner transition-colors ${disabled ? 'bg-black cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#5d5efc]'}`}>
                        {currentMap ? (
                            <img src={resolveMapUrl(currentMap)} className="w-full h-full object-cover" alt={title} />
                        ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center gap-[0.4vw] ${disabled ? 'text-white/40' : 'text-gray-300'}`}>
                                <Icon icon={disabled ? "mdi:block" : "glyphs:image-duo"} width={disabled ? "2.5vw" : "5.5vw"} />
                                {!disabled && <span className="text-[0.7vw] text-gray-400 font-semibold -mt-[0.5vw]">No Image Found</span>}
                            </div>
                        )}
                        <MapUploadControl 
                            mapType={mapType} 
                            currentMap={currentMap} 
                            onUpload={onUpload} 
                            overlay={true}
                            disabled={disabled}
                        />
                    </div>
                    <div className="flex-1 space-y-[1vw]">
                        {extra}
                        <div className="space-y-[1vw]">
                            {description.split('\n\n').map((paragraph, pIdx) => (
                                <p key={pIdx} className="text-[0.68vw] text-gray-500 leading-relaxed font-medium whitespace-pre-line">
                                    {paragraph.split(/(metal|main color|surface appearance|surface details|bumps and grooves|rough or smooth|shiny surface|ridges or dots|soft shadows|crevices|visibility|emits light|glow effect|additional surface depth|Enhances shadows|crevices and corners|depth and realism|glowing areas)/g).map((part, i) => {
                                        const highlight = ["metal", "main color", "surface appearance", "surface details", "bumps and grooves", "rough or smooth", "shiny surface", "ridges or dots", "soft shadows", "crevices", "visibility", "emits light", "glow effect", "additional surface depth", "Enhances shadows", "crevices and corners", "depth and realism", "glowing areas"].includes(part);
                                        return (
                                            <span key={i} className={highlight ? "text-[#5d5efc]" : ""}>
                                                {part}
                                            </span>
                                        );
                                    })}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};

const CustomSlider = ({ label, value, onChange, unit = "%", min = 0, max = 100, step = 1 }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center justify-between mb-[1.25vw] last:mb-0 h-[1.75vw] px-[0.5vw]">
      {label && (
        <div className="w-[6vw] text-[0.75vw] font-medium text-gray-600 shrink-0 flex items-center justify-between pr-[0.5vw]">
          {label} <span>:</span>
        </div>
      )}
      <div className="relative flex-1 h-[0.4vw] bg-gray-100 rounded-full cursor-pointer group touch-none">
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        ></div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] bg-[#5d5efc] border-[0.15vw] border-white rounded-full shadow-md hover:scale-110"
          style={{ left: `${Math.max(0, Math.min(100, percentage))}%`, marginLeft: "-0.45vw" }}
        ></div>
        {/* Input Range (Hidden overlay for functionality) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? 0}
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

const StackedSliderBox = ({ label, val, onChange, children, min = 0, max = 100, step = 1 }) => {
  const percentage = ((val - min) / (max - min)) * 100;
  return (
    <div className="mb-[1.5vw]">
      <div className="text-[0.68vw] font-medium text-gray-600 mb-[0.75vw] flex items-center justify-between">
        {label} :
      </div>
      <div className="flex items-center gap-[1vw]">
        {/* Reusing CustomSlider logic but horizontal layout inside flex */}
        <div className="relative flex-1 h-[0.4vw] bg-gray-100 rounded-full cursor-pointer group touch-none">
          <div
            className="absolute top-0 left-0 h-full bg-[#5d5efc] rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          ></div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[0.9vw] h-[0.9vw] bg-[#5d5efc] border-[0.15vw] border-white rounded-full shadow-md hover:scale-110"
            style={{ left: `${Math.max(0, Math.min(100, percentage))}%`, marginLeft: "-0.45vw" }}
          ></div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={val ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>
        {/* Value Display */}
        <div className="w-[2.5vw] text-right text-[0.62vw] font-medium text-gray-500 tabular-nums">
          {typeof val === 'number' ? val.toFixed(step < 1 ? 1 : 0) : val} <span className="text-[0.52vw] ml-[0.15vw] text-gray-400">%</span>
        </div>
        {/* Extra Child (Box/Image) */}
        {children}
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
        <div className={`font-medium text-gray-600 ${compact ? "text-[0.65vw] w-[4vw]" : "text-[0.68vw] w-[6vw]"}`}>
           {label} :
        </div>
      )}

      <div className={`flex items-center ${compact ? "gap-[0.2vw]" : "gap-[0.5vw]"}`}>
        {axisLabel && (
          <span className={`${compact ? "text-[0.6vw] w-[0.8vw]" : "text-[0.58vw] w-[1vw]"} text-gray-400 uppercase text-center font-black tracking-tighter`}>
            {axisLabel}
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
            compact ? "w-[2.8vw] py-[0.15vw] text-[0.6vw] rounded-[0.25vw]" : "w-[3.5vw] py-[0.4vw] text-[0.65vw] rounded-[0.35vw]"
          } border border-gray-200 text-gray-700 font-bold text-center bg-white shadow-xs hover:border-[#5d5efc] transition-colors tabular-nums overflow-hidden`}
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
          const spaceNeeded = 200; 
          
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
      
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
};

export default function Customized({ 
    controls, 
    updateControl, 
    activePanel, 
    setActivePanel, 
    transformValues, 
    onManualTransformChange, 
    onResetFactor, 
    onResetTransform,
    onUvUnwrap,
    onMapUpload,
    selectedTextureId,
    onSelectTexture
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorType, setActiveColorType] = useState('color');
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 });
  const lightPadRef = useRef(null);
  const [isDraggingLight, setIsDraggingLight] = useState(false);

  const currentGalleryTexture = useMemo(() => {
    if (!selectedTextureId) return null;
    const predefined = textureData.find((t) => t.id === selectedTextureId);
    if (predefined) return predefined;

    // Support Uploaded Textures: Fallback to current selection if ID matches
    const applied = controls.appliedTexture;
    if (applied && (applied.id === selectedTextureId || applied._id === selectedTextureId)) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      return {
        ...applied,
        // Resolve preview if it's a relative path
        preview: typeof applied.thumb === "string" && applied.thumb.startsWith("/uploads")
          ? `${backendUrl}${applied.thumb}`
          : applied.preview || applied.thumb,
      };
    }
    return null;
  }, [selectedTextureId, controls.appliedTexture]);

  const handleColorClick = (e, type = 'color') => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const topPos = Math.max(10, rect.top - 80);
      setPickerPos({ 
          top: topPos, 
          right: window.innerWidth - rect.left + 16 
      });
      setActiveColorType(type);
      setShowColorPicker(!showColorPicker);
  };

  const [openInnerAccordion, setOpenInnerAccordion] = useState("base");

  const handlePanelToggle = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const toggleInnerAccordion = (name) => {
    setOpenInnerAccordion(openInnerAccordion === name ? null : name);
  };

  const handleLightPadInteraction = (e) => {
      if (!lightPadRef.current) return;
      
      const rect = lightPadRef.current.getBoundingClientRect();
      const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
      
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      
      // Calculate percentages (0 to 100)
      const perX = (offsetX / rect.width) * 100;
      const perY = (offsetY / rect.height) * 100;
      
      // Map back to -25 to +25 range (since it uses * 2 to fill 100% space)
      const newX = (perX - 50) / 2;
      const newY = (50 - perY) / 2;
      
      updateControl('lightPosition', { 
          ...(controls.lightPosition || { x: 10, y: 10, z: 10 }), 
          x: Math.round(newX), 
          y: Math.round(newY) 
      });
  };

  const handleLightWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      updateControl('lightPosition', {
          ...(controls.lightPosition || { x: 10, y: 10, z: 10 }),
          z: Math.round((controls.lightPosition?.z || 10) + delta)
      });
  };

  // Drag listener
  useEffect(() => {
      if (!isDraggingLight) return;
      
      const handleMove = (e) => {
          handleLightPadInteraction(e);
      };
      
      const handleUp = () => {
          setIsDraggingLight(false);
      };
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
      
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove);
          window.removeEventListener('touchend', handleUp);
      };
  }, [isDraggingLight]);

  // Helper to format values safely
  const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toFixed(2) : "0.00";
  const fmtDeg = (rad) => (rad !== undefined && rad !== null) ? Math.round(rad * (180 / Math.PI)) : "0";
  const isNoneSelected = selectedTextureId === 'none';

  return (
    <div className={`flex flex-col gap-[0.25vw] pb-[2.5vw] ${isDraggingLight ? 'select-none' : ''}`}>
      <Accordion
        title="Material Properties"
        icon="icon-park-outline:texture-two"
        isOpen={activePanel === "factor"}
        onToggle={() => handlePanelToggle("factor")}
        onReset={onResetFactor}
      >
        <div className="space-y-[1.2vw]">
            {/* Texture Maps Section */}
            <div>
                <div className="flex items-center justify-between mb-[1vw]">
                   <div className="flex items-center gap-[0.75vw] flex-1">
                      <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">
                        Textures : <span className="text-gray-600 ml-[0.25vw]">{currentGalleryTexture?.name || "Default"}</span>
                      </span>
                      <div className="h-[0.05vw] bg-gray-100 flex-1"></div>
                   </div>
                   <button 
                    onClick={() => onSelectTexture({ id: null, maps: {} })}
                    className="flex items-center gap-[0.4vw] ml-[0.5vw] px-[0.65vw] py-[0.35vw] bg-gray-100 rounded-[0.4vw] text-gray-700 hover:bg-gray-200 transition-colors shrink-0 group"
                   >
                      <span className="text-[0.75vw] font-semibold">Reset</span>
                      <Icon icon="solar:restart-bold" className="text-gray-500 group-hover:rotate-[-90deg] transition-transform duration-300 w-[1vw] h-[1vw]" />
                   </button>
                </div>

                <div className="flex flex-col">
                    <MapAccordion 
                        title="Base Map"
                        isOpen={openInnerAccordion === "base"}
                        onToggle={() => toggleInnerAccordion("base")}
                        value={controls.colorIntensity || 100}
                        onChange={(v) => updateControl("colorIntensity", v)}
                        mapType="map"
                        currentMap={controls.maps?.map || currentGalleryTexture?.preview}
                        onUpload={onMapUpload}
                        description="Defines the main color and surface appearance of the material."
                        disabled={isNoneSelected}
                        extra={
                            <div className="flex items-center gap-[0.5vw]">
                                <div 
                                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                                    style={{ backgroundColor: controls.color || '#000000' }}
                                    onClick={(e) => handleColorClick(e, 'color')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <div 
                                    className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white cursor-pointer hover:border-[#5d5efc] transition-colors shadow-xs"
                                    onClick={(e) => handleColorClick(e, 'color')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input 
                                        type="text"
                                        className="text-[0.68vw] text-gray-700 font-bold uppercase tracking-tight bg-transparent border-none outline-none w-[3.2vw] p-0 cursor-text"
                                        value={controls?.color || '#ffffff'}
                                        onChange={(e) => updateControl('color', e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        spellCheck="false"
                                    />
                                    <span className="text-[0.68vw] text-gray-400 font-bold ml-[0.25vw] shrink-0">{controls.colorIntensity ?? 100}%</span>
                                </div>
                            </div>
                        }
                    />
                    <MapAccordion 
                        title="Normal Map"
                        isOpen={openInnerAccordion === "normal"}
                        onToggle={() => toggleInnerAccordion("normal")}
                        value={controls.normal}
                        onChange={(v) => updateControl("normal", v)}
                        mapType="normalMap"
                        currentMap={controls.maps?.normalMap}
                        onUpload={onMapUpload}
                        description="Adds surface details like bumps and grooves without changing the model geometry."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Metallic Map"
                        isOpen={openInnerAccordion === "metallic"}
                        onToggle={() => toggleInnerAccordion("metallic")}
                        value={controls.metallic}
                        onChange={(v) => updateControl("metallic", v)}
                        mapType="metalnessMap"
                        currentMap={controls.maps?.metalnessMap}
                        onUpload={onMapUpload}
                        description={"Determines which parts of the material behave like metal.\nWhite areas appear metallic, black areas remain non-metal."}
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Roughness Map"
                        isOpen={openInnerAccordion === "roughness"}
                        onToggle={() => toggleInnerAccordion("roughness")}
                        value={controls.roughness}
                        onChange={(v) => updateControl("roughness", v)}
                        mapType="roughnessMap"
                        currentMap={controls.maps?.roughnessMap}
                        onUpload={onMapUpload}
                        description={"Controls how rough or smooth the material surface appears.\n\nLower values create a shiny surface."}
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Height/Bump Map"
                        isOpen={openInnerAccordion === "bump"}
                        onToggle={() => toggleInnerAccordion("bump")}
                        value={controls.bump}
                        onChange={(v) => updateControl("bump", v)}
                        mapType="displacementMap"
                        currentMap={controls.maps?.displacementMap}
                        onUpload={onMapUpload}
                        description="Physically displaces the vertices of the model to create real surface depth and topology."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="A/O Map"
                        isOpen={openInnerAccordion === "ao"}
                        onToggle={() => toggleInnerAccordion("ao")}
                        value={controls.ao || 100}
                        onChange={(v) => updateControl("ao", v)}
                        mapType="aoMap"
                        currentMap={controls.maps?.aoMap}
                        onUpload={onMapUpload}
                        description="Enhances shadows in small crevices and corners to add depth and realism to the material."
                        disabled={isNoneSelected}
                    />
                    <MapAccordion 
                        title="Emissive Map"
                        isOpen={openInnerAccordion === "emissive"}
                        onToggle={() => toggleInnerAccordion("emissive")}
                        value={controls.emissiveIntensity || 0}
                        onChange={(v) => updateControl("emissiveIntensity", v)}
                        mapType="emissiveMap"
                        currentMap={controls.maps?.emissiveMap}
                        onUpload={onMapUpload}
                        description="Adds glowing areas to the material."
                        disabled={isNoneSelected}
                        extra={
                            <div className="flex items-center gap-[0.5vw]">
                                <div 
                                    className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
                                    style={{ backgroundColor: controls.emissiveColor || '#ffffff' }}
                                    onClick={(e) => handleColorClick(e, 'emissiveColor')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <div 
                                    className="flex-1 flex items-center justify-between border border-gray-300 rounded-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white cursor-pointer hover:border-[#5d5efc] transition-colors shadow-xs"
                                    onClick={(e) => handleColorClick(e, 'emissiveColor')}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input 
                                        type="text"
                                        className="text-[0.68vw] text-gray-700 font-bold uppercase tracking-tight bg-transparent border-none outline-none w-[3.2vw] p-0 cursor-text"
                                        value={controls?.emissiveColor || '#ffffff'}
                                        onChange={(e) => updateControl('emissiveColor', e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        spellCheck="false"
                                    />
                                    <span className="text-[0.68vw] text-gray-400 font-bold ml-[0.25vw] shrink-0">{controls.emissiveIntensity ?? 0}%</span>
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Opacity Section */}
            <div>
                <SectionHeader label="Opacity" />
                <p className="text-[0.7vw] text-gray-500 mb-[1vw] -mt-[0.5vw]">
                    Controls the <span className="text-[#5d5efc]">transparency</span> of the material.
                </p>
                <CustomSlider
                    label=""
                    value={controls.alpha}
                    onChange={(v) => updateControl("alpha", v)}
                />
            </div>

            {/* Texture Placement Section */}
            <div className="pt-[0.5vw]">
                <SectionHeader label="Texture Placement" />
                
                <div className="space-y-[0.5vw] mt-[0.5vw]">
                    <CustomSlider
                        label="Scale"
                        value={controls.scale}
                        onChange={(v) => updateControl("scale", v)}
                        min={-100}
                        max={100}
                        unit="%"
                    />
                    <CustomSlider
                        label="Rotation"
                        value={controls.rotation}
                        min={-180}
                        max={180}
                        onChange={(v) => updateControl("rotation", v)}
                        unit="%"
                    />
                    <CustomSlider
                        label="Offset (X)"
                        value={controls.offset?.x || 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), x: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit="%"
                    />
                    <CustomSlider
                        label="Offset (Y)"
                        value={controls.offset?.y || 0}
                        onChange={(val) => updateControl('offset', { ...(controls.offset || {x:0,y:0}), y: val })}
                        min={-100}
                        max={100}
                        step={0.1}
                        unit="%"
                    />
                </div>
                
                <div className="flex items-center justify-between mt-[1.25vw] bg-[#f8fafc] px-[0.75vw] py-[0.5vw] rounded-[0.5vw] border border-gray-100">
                    <div className="flex items-center gap-[0.5vw]">
                        <Icon icon="fluent:checkmark-circle-20-filled" className="text-green-500 w-[1vw] h-[1vw]" />
                        <span className="text-[0.75vw] font-bold text-gray-700">UV Protection</span>
                    </div>
                    <button 
                        onClick={onUvUnwrap}
                        className="text-[0.65vw] font-bold text-[#5d5efc] hover:underline cursor-pointer"
                    >
                        Unwrap UV
                    </button>
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
        onToggle={() => handlePanelToggle("position")}
        onReset={() => onResetTransform('all')}
      >
        <div className="flex flex-col gap-[0.25vw] pb-[0.5vw]">
           {/* Move Row */}
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Move:</span>
                <button onClick={() => onResetTransform('position')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-gray-100">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
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

           {/* Rotate Row - with subtle background */}
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw] bg-gray-50 rounded-[0.5vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Rotate:</span>
                <button onClick={() => onResetTransform('rotation')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-white">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
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
           <div className="flex items-end justify-between py-[0.5vw] px-[0.25vw]">
              <div className="flex items-center gap-[0.25vw] w-[3.5vw] mb-[0.25vw]">
                <span className="text-[0.75vw] font-medium text-gray-600">Scale:</span>
                <button onClick={() => onResetTransform('scale')} className="text-gray-400 hover:text-[#5d5efc] transition-colors p-[0.1vw] rounded hover:bg-gray-100">
                   <Icon icon="ix:reset" width="0.75vw" height="0.75vw" />
                </button>
              </div>
              <div className="flex gap-[0.5vw]">
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

      {/* --- LIGHTING CONTROLS --- */}
      <Accordion
        title="Lighting Controls"
        icon="ix:light-dark"
        isOpen={activePanel === "lighting"}
        onToggle={() => handlePanelToggle("lighting")}
      >
        {/* Visual Preview Box */}
        <div 
            ref={lightPadRef}
            onMouseDown={(e) => {
                setIsDraggingLight(true);
                handleLightPadInteraction(e);
            }}
            onTouchStart={(e) => {
                setIsDraggingLight(true);
                handleLightPadInteraction(e);
            }}
            onWheel={handleLightWheel}
            className={`relative bg-[#f8fafc] h-[9.375vw] rounded-[0.5vw] border border-gray-100 mb-[1.5vw] flex flex-col items-center justify-center shadow-inner overflow-hidden group ${isDraggingLight ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        >
            {/* Dynamic Sun Position based on lightPosition */}
            <div 
                className={`absolute text-amber-400 drop-shadow-sm pointer-events-none ${isDraggingLight ? '' : 'transition-all duration-300'}`}
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
                <span className="text-[0.58vw] mt-[0.5vw] font-medium tracking-wide uppercase">Model Preview</span>
            </div>
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

                <div className="mt-[1.5vw]">
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
                </div>
            </div>
        </div>
      </Accordion>
       {showColorPicker && createPortal(
            <ColorPicker
                color={controls[activeColorType] || (activeColorType === 'emissiveColor' ? '#ffffff' : '#000000')}
                onChange={(color) => updateControl(activeColorType, color)}
                opacity={activeColorType === 'color' ? (controls.colorIntensity ?? 100) : (controls.emissiveIntensity ?? 0)}
                onOpacityChange={(v) => updateControl(activeColorType === 'color' ? "colorIntensity" : "emissiveIntensity", v)}
                onClose={() => setShowColorPicker(false)}
                style={{ 
                    position: 'fixed', 
                    top: pickerPos.top, 
                    right: pickerPos.right, 
                    zIndex: 9999 
                }}
            />,
            document.body
        )}
    </div>
  );
}
