import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "../../ColorPicker";
import { AxisInput } from "../common/PanelInputs";
import { builtInHdris, fetchHdris } from "../../../../data/hdriData";
import FloorPresetSelector from "../../Components/FloorPresetSelector";

// Reusable Slider Component styled with editable Axis-like input pill
const LightingSlider = ({
  label,
  value,
  onChange,
  unit = "%",
  min = 0,
  max = 100,
  step = 1,
}) => {
  const numericValue = typeof value === "number" && !isNaN(value) ? value : min;
  const percentage = Math.max(0, Math.min(100, ((numericValue - min) / (max - min)) * 100));

  const [isFocused, setIsFocused] = useState(false);
  const [inputText, setInputText] = useState(() => String(Math.round(numericValue)));

  useEffect(() => {
    if (!isFocused) {
      setInputText(String(Math.round(numericValue)));
    }
  }, [numericValue, isFocused]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputText(raw);
    if (raw === "" || raw === "-") return;
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange && onChange(clamped);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(inputText);
    if (isNaN(parsed) || !isFinite(parsed)) {
      parsed = numericValue;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    setInputText(String(Math.round(clamped)));
    onChange && onChange(clamped);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(inputText) || numericValue;
      const inc = e.shiftKey ? step * 5 : step;
      const next = Math.min(max, current + inc);
      setInputText(String(Math.round(next)));
      onChange && onChange(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(inputText) || numericValue;
      const dec = e.shiftKey ? step * 5 : step;
      const next = Math.max(min, current - dec);
      setInputText(String(Math.round(next)));
      onChange && onChange(next);
    }
  };

  // Drag scrub support on value pill
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  const handlePillPointerDown = (e) => {
    if (isFocused) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startValRef.current = numericValue;

    const handlePointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      const diff = moveEvt.clientX - startXRef.current;
      const multiplier = moveEvt.shiftKey ? 0.2 : 1;
      const delta = Math.round((diff / 4) * step * multiplier);
      const next = Math.max(min, Math.min(max, startValRef.current + delta));
      setInputText(String(Math.round(next)));
      onChange && onChange(next);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
  };

  return (
    <div className="flex items-center justify-between gap-[0.5vw] py-[0.15vw]">
      {/* Label */}
      <span className="text-[0.74vw] font-medium text-gray-700 w-[7.2vw] shrink-0 truncate">
        {label} :
      </span>

      {/* Slider track & thumb */}
      <div className="relative flex-1 h-[0.32vw] bg-gray-200 rounded-full cursor-pointer flex items-center mx-[0.2vw]">
        <div
          className="absolute left-0 top-0 h-full bg-[#ea543a] rounded-full pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute w-[0.85vw] h-[0.85vw] bg-[#ea543a] border-[0.12vw] border-white rounded-full shadow-md pointer-events-none -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
      </div>

      {/* Editable Value Pill */}
      <div
        onMouseDown={handlePillPointerDown}
        className={`w-[3.4vw] h-[1.55vw] bg-gray-100 hover:bg-gray-200/80 rounded-[0.3vw] flex items-center justify-center shrink-0 border transition-all cursor-ew-resize px-[0.2vw] ${
          isFocused
            ? "border-[#ea543a] bg-white ring-1 ring-[#ea543a]/25 shadow-2xs"
            : "border-transparent"
        }`}
        title="Click to edit or drag left/right to adjust"
      >
        <input
          type="text"
          value={isFocused ? inputText : `${inputText}${unit}`}
          onFocus={(e) => {
            setIsFocused(true);
            setInputText(String(Math.round(numericValue)));
            e.target.select();
          }}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-center text-[0.7vw] font-semibold text-gray-700 outline-none tabular-nums p-0 leading-none cursor-text"
        />
      </div>
    </div>
  );
};

// Base standard studio / daylight / softbox
const BASE_ENVIRONMENT_PRESETS = [
  {
    id: "studio",
    name: "Studio",
    preview: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    envValue: "studio",
  },
  {
    id: "daylight",
    name: "Daylight",
    preview: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    envValue: "builtin_day_outdoor",
  },
  {
    id: "softbox",
    name: "Soft Box",
    preview: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    envValue: "warehouse",
  },
];

export function LightingPanel({
  materialSettings,
  controls,
  onUpdateMaterialSetting,
  updateControl,
}) {
  const currentControls = materialSettings || controls || {};
  const handleUpdate = onUpdateMaterialSetting || updateControl || (() => {});

  // State for See All environments dropdown / expansion
  const [showAllEnvironments, setShowAllEnvironments] = useState(false);
  const [envFilterCategory, setEnvFilterCategory] = useState("all");

  // State for Color Picker popover
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const envDropdownRef = useRef(null);

  // Close environment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (envDropdownRef.current && !envDropdownRef.current.contains(e.target)) {
        setShowAllEnvironments(false);
      }
    };
    if (showAllEnvironments) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAllEnvironments]);

  // State for dynamic HDRI list loaded from backend database
  const [dynamicHdris, setDynamicHdris] = useState(() => [...builtInHdris]);

  useEffect(() => {
    fetchHdris().then((loaded) => {
      if (Array.isArray(loaded) && loaded.length > 0) {
        setDynamicHdris([...loaded]);
      }
    });
  }, []);

  const environmentOptions = useMemo(() => [
    ...BASE_ENVIRONMENT_PRESETS,
    ...(dynamicHdris || []).map((hdr) => ({
      id: `builtin_${hdr.id}`,
      name: hdr.name,
      category: hdr.category || "Other",
      preview: hdr.preview,
      envValue: `builtin_${hdr.id}`,
    })),
  ], [dynamicHdris]);

  const filteredEnvironments = useMemo(() => {
    if (envFilterCategory === "all") return environmentOptions;
    return environmentOptions.filter((opt) => {
      if (envFilterCategory === "Studio") {
        return opt.id === "studio" || opt.id === "softbox" || opt.category === "Indoor";
      }
      if (envFilterCategory === "Outdoor") {
        return opt.id === "daylight" || opt.category === "Day" || opt.category === "Evening";
      }
      if (envFilterCategory === "Night") {
        return opt.category === "Night";
      }
      return true;
    });
  }, [environmentOptions, envFilterCategory]);

  const colorPickerContainerRef = useRef(null);

  // Close color picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (colorPickerContainerRef.current && !colorPickerContainerRef.current.contains(e.target)) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isColorPickerOpen]);

  // Multi-light management
  const [activeLightIndex, setActiveLightIndex] = useState(0);

  // Fallback / legacy compatibility
  const lightsArray = useMemo(() => {
    if (Array.isArray(currentControls.lights) && currentControls.lights.length > 0) {
      return currentControls.lights;
    }
    return [
      {
        id: "light_1",
        name: "Key Light",
        enabled: true,
        position: currentControls.lightPosition || { x: 0, y: 10, z: 10 },
        color: currentControls.lightColor || "#EC5137",
        intensity: currentControls.lightIntensity ?? 100,
        shadowDensity: currentControls.shadowDensity ?? currentControls.shadow ?? 100,
        shadowSoftness: currentControls.shadowSoftness ?? currentControls.softness ?? 100,
        castShadow: true,
      },
    ];
  }, [currentControls.lights, currentControls.lightPosition, currentControls.lightColor, currentControls.lightIntensity, currentControls.shadowDensity, currentControls.shadow, currentControls.shadowSoftness, currentControls.softness]);

  const activeLight = lightsArray[activeLightIndex] || lightsArray[0] || {};

  // Update a single light's property
  const updateActiveLight = useCallback((key, value) => {
    const updated = lightsArray.map((l, i) => {
      if (i === activeLightIndex) {
        return { ...l, [key]: value };
      }
      return l;
    });
    handleUpdate("lights", updated);

    // Sync legacy properties for Light 1 for backward compatibility
    if (activeLightIndex === 0) {
      if (key === "position") handleUpdate("lightPosition", value);
      if (key === "color") handleUpdate("lightColor", value);
      if (key === "intensity") handleUpdate("lightIntensity", value);
      if (key === "shadowDensity") {
        handleUpdate("shadowDensity", value);
        handleUpdate("shadow", value);
      }
      if (key === "shadowSoftness") {
        handleUpdate("shadowSoftness", value);
        handleUpdate("softness", value);
      }
    }
  }, [lightsArray, activeLightIndex, handleUpdate]);

  // Add a new light (max 3)
  const handleAddLight = () => {
    if (lightsArray.length >= 3) return;
    const nextIdx = lightsArray.length + 1;
    const newLight = {
      id: `light_${Date.now()}`,
      name: nextIdx === 2 ? "Fill Light" : "Rim Light",
      enabled: true,
      position: nextIdx === 2 ? { x: -8, y: 8, z: 8 } : { x: 0, y: -10, z: 12 },
      color: nextIdx === 2 ? "#5D5EFC" : "#FFA500",
      intensity: 70,
      shadowDensity: 50,
      shadowSoftness: 80,
      castShadow: false,
    };
    const updated = [...lightsArray, newLight];
    handleUpdate("lights", updated);
    setActiveLightIndex(updated.length - 1);
  };

  // Remove a light (always keep at least 1)
  const handleRemoveLight = (indexToRemove, e) => {
    e.stopPropagation();
    if (lightsArray.length <= 1) return;
    const updated = lightsArray.filter((_, i) => i !== indexToRemove);
    handleUpdate("lights", updated);
    setActiveLightIndex((prev) => Math.min(prev, updated.length - 1));
  };

  // Toggle light enabled state
  const handleToggleLightEnabled = (indexToToggle, e) => {
    e.stopPropagation();
    const updated = lightsArray.map((l, i) => {
      if (i === indexToToggle) {
        return { ...l, enabled: !l.enabled };
      }
      return l;
    });
    handleUpdate("lights", updated);
  };

  // Active Light parameters
  const lightColor = activeLight.color || "#EC5137";
  const lightIntensity = activeLight.intensity ?? 100;
  const shadowDensity = activeLight.shadowDensity ?? 100;
  const shadowSoftness = activeLight.shadowSoftness ?? 100;
  const lightPos = activeLight.position || { x: 0, y: 10, z: 10 };
  const posX = lightPos.x ?? 0;
  const posY = lightPos.y ?? 10;
  const posZ = lightPos.z ?? 10;

  // Environment parameters
  const envRotation = currentControls.envRotation ?? 0;
  const envBrightness = currentControls.reflection ?? 100;
  const envBlur = currentControls.worldBlur ?? 0;
  const envOpacity = currentControls.worldOpacity ?? 100;
  const activeEnv = currentControls.environment || "studio";

  // Compass 2D dragging state
  const compassRef = useRef(null);
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Height slider dragging state
  const heightTrackRef = useRef(null);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);

  // Compass geometry & calculations (Radius maps to 20 units)
  const MAX_RADIUS_UNITS = 20;
  const compassRadiusNorm = Math.min(1, Math.sqrt(posX * posX + posY * posY) / MAX_RADIUS_UNITS);

  // Percentage from center for the sun icon inside the compass (center is 50%, 50%)
  const sunCompassX = 50 + (posX / MAX_RADIUS_UNITS) * 40;
  const sunCompassY = 50 - (posY / MAX_RADIUS_UNITS) * 40; // inverted Y for screen coords

  // Sun height visual percentage in vertical pill (Z: 1 to 50)
  const MIN_Z = 1;
  const MAX_Z = 50;
  const heightPercent = Math.max(0, Math.min(100, ((posZ - MIN_Z) / (MAX_Z - MIN_Z)) * 100));

  // Compass interaction
  const handleCompassPointer = (e) => {
    if (!compassRef.current) return;
    const rect = compassRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const maxVisual = radius * 0.85;
    let normX = dx / maxVisual;
    let normY = dy / maxVisual;

    const normDist = Math.sqrt(normX * normX + normY * normY);
    if (normDist > 1 && normDist > 0) {
      normX /= normDist;
      normY /= normDist;
    }

    const newX = Math.round(normX * MAX_RADIUS_UNITS * 10) / 10;
    const newY = Math.round(-normY * MAX_RADIUS_UNITS * 10) / 10;

    updateActiveLight("position", { ...lightPos, x: newX, y: newY });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDraggingCompass) {
        handleCompassPointer(e);
      }
    };
    const handleUp = () => {
      setIsDraggingCompass(false);
    };

    if (isDraggingCompass) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingCompass, lightPos]);

  // Height slider interaction
  const handleHeightPointer = (e) => {
    if (!heightTrackRef.current) return;
    const rect = heightTrackRef.current.getBoundingClientRect();
    const clickY = e.clientY;
    const bottomY = rect.bottom;
    const height = rect.height;

    const distFromBottom = Math.max(0, Math.min(height, bottomY - clickY));
    const fraction = distFromBottom / height;

    const newZ = Math.round((MIN_Z + fraction * (MAX_Z - MIN_Z)) * 10) / 10;
    updateActiveLight("position", { ...lightPos, z: newZ });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDraggingHeight) {
        handleHeightPointer(e);
      }
    };
    const handleUp = () => {
      setIsDraggingHeight(false);
    };

    if (isDraggingHeight) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingHeight, lightPos]);

  return (
    <div className="flex flex-col gap-[1.1vw] select-none">
      {/* ── 1. SECTION: ENVIRONMENT ── */}
      <div className="flex flex-col gap-[0.6vw] relative">
        {/* Section Header */}
        <div className="flex items-center gap-[0.5vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Environment</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Clean Dropdown Selector Bar */}
        <div ref={envDropdownRef} className="relative w-full">
          {/* Main Dropdown Button displaying Active Environment */}
          <button
            type="button"
            onClick={() => setShowAllEnvironments((prev) => !prev)}
            className={`w-full h-[2.8vw] px-[0.6vw] bg-white rounded-[0.45vw] border flex items-center justify-between transition-all cursor-pointer shadow-2xs group ${
              showAllEnvironments
                ? "border-[#ea543a] ring-2 ring-[#ea543a]/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Active Thumbnail + Name */}
            <div className="flex items-center gap-[0.6vw] min-w-0">
              <div className="w-[2.7vw] h-[1.8vw] rounded-[0.3vw] overflow-hidden border border-gray-200 shrink-0 bg-gray-100 shadow-2xs">
                <img
                  src={
                    environmentOptions.find(
                      (e) => e.envValue === activeEnv || (e.id === "studio" && activeEnv === "studio")
                    )?.preview || BASE_ENVIRONMENT_PRESETS[0].preview
                  }
                  alt="active env"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[0.82vw] font-bold text-gray-800 truncate">
                {environmentOptions.find(
                  (e) => e.envValue === activeEnv || (e.id === "studio" && activeEnv === "studio")
                )?.name || "Studio"}
              </span>
            </div>

            {/* Chevron Icon (Clearly visible with strong contrast) */}
            <div className="flex items-center shrink-0">
              <Icon
                icon="heroicons:chevron-up-down-20-solid"
                className={`w-[1.05vw] h-[1.05vw] transition-colors duration-200 ${
                  showAllEnvironments ? "text-[#ea543a]" : "text-gray-600 group-hover:text-gray-900"
                }`}
              />
            </div>
          </button>

          {/* Expanded Dropdown Menu with Categories & Grid */}
          {showAllEnvironments && (
            <div className="absolute top-[calc(100%+0.3vw)] left-0 right-0 z-50 bg-white rounded-[0.55vw] border border-gray-200 shadow-xl p-[0.6vw] flex flex-col gap-[0.45vw] animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Category Filter Tabs */}
              <div className="grid grid-cols-4 gap-[0.2vw] bg-gray-100/90 p-[0.15vw] rounded-[0.35vw]">
                {["all", "Studio", "Outdoor", "Night"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEnvFilterCategory(cat)}
                    className={`py-[0.16vw] rounded-[0.28vw] text-[0.62vw] font-semibold capitalize text-center transition-all cursor-pointer ${
                      envFilterCategory === cat
                        ? "bg-white text-gray-900 shadow-2xs font-bold"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Scrollable Environments Grid (3 Columns) */}
              <div className="grid grid-cols-3 gap-[0.4vw] max-h-[16vw] overflow-y-auto pr-[0.15vw] [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]">
                {filteredEnvironments.map((item) => {
                  const isSelected = activeEnv === item.envValue || (item.id === "studio" && activeEnv === "studio");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleUpdate("environment", item.envValue);
                        setShowAllEnvironments(false);
                      }}
                      className={`flex flex-col items-center gap-[0.2vw] p-[0.2vw] rounded-[0.38vw] group cursor-pointer text-left transition-all ${
                        isSelected ? "bg-orange-50/70" : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`relative w-full aspect-16/10 rounded-[0.35vw] overflow-hidden border transition-all duration-200 shadow-2xs ${
                          isSelected
                            ? "border-[#ea543a] ring-2 ring-[#ea543a]/30 scale-[1.02]"
                            : "border-gray-200 group-hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-[0.2vw] right-[0.2vw] w-[0.75vw] h-[0.75vw] bg-[#ea543a] rounded-full flex items-center justify-center shadow-xs">
                            <Icon icon="heroicons:check-20-solid" className="w-[0.5vw] h-[0.5vw] text-white" />
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[0.63vw] font-medium tracking-tight truncate w-full text-center transition-colors ${
                          isSelected ? "text-[#ea543a] font-bold" : "text-gray-700 group-hover:text-gray-900"
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Close Helper Footer */}
              <div className="flex items-center justify-between pt-[0.25vw] border-t border-gray-100">
                <span className="text-[0.58vw] text-gray-500">
                  {filteredEnvironments.length} environments
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllEnvironments(false)}
                  className="text-[0.62vw] font-bold text-[#ea543a] hover:text-[#d43f26] px-[0.35vw] py-[0.08vw] rounded hover:bg-orange-50/60 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Environment Adjustment Sliders */}
        <div className="flex flex-col gap-[0.4vw] mt-[0.3vw]">
          <LightingSlider
            label="Env Rotation"
            value={envRotation}
            onChange={(val) => handleUpdate("envRotation", val)}
            min={0}
            max={360}
            unit="°"
          />
          <LightingSlider
            label="Env Brightness"
            value={envBrightness}
            onChange={(val) => handleUpdate("reflection", val)}
            unit="%"
          />
          <LightingSlider
            label="Environment Blur"
            value={envBlur}
            onChange={(val) => handleUpdate("worldBlur", val)}
            unit="%"
          />
          <LightingSlider
            label="Env Opacity"
            value={envOpacity}
            onChange={(val) => handleUpdate("worldOpacity", val)}
            unit="%"
          />
        </div>
      </div>

      {/* ── 2. SECTION: LIGHTS (STUDIO MULTI-LIGHT CONTROLS) ── */}
      <div className="flex flex-col gap-[0.6vw]">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.5vw] flex-1">
            <span className="text-[0.82vw] font-bold text-gray-900">Lights & Shadows</span>
            <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
          </div>

          {lightsArray.length < 3 && (
            <button
              type="button"
              onClick={handleAddLight}
              className="flex items-center gap-[0.2vw] px-[0.45vw] py-[0.15vw] rounded-[0.35vw] text-gray-600 hover:text-[#ea543a] bg-gray-50 hover:bg-orange-50/50 border border-gray-200 hover:border-orange-200 text-[0.68vw] font-semibold transition-all cursor-pointer shadow-2xs ml-[0.6vw] shrink-0"
              title="Add another light source (up to 3)"
            >
              <Icon icon="heroicons:plus-20-solid" className="w-[0.75vw] h-[0.75vw] text-[#ea543a]" />
              <span>Add Light</span>
            </button>
          )}
        </div>

        {/* Studio Light Switcher (Clean, spacious tabs + dedicated active light controls) */}
        <div className="flex flex-col gap-[0.45vw]">
          {/* Light Tabs Row */}
          <div className="flex items-center gap-[0.3vw] p-[0.2vw] bg-gray-100/90 rounded-[0.55vw] border border-gray-200/70">
            {lightsArray.map((light, idx) => {
              const isSelected = activeLightIndex === idx;
              const isEnabled = light.enabled !== false;
              const roleName = idx === 0 ? "Key" : idx === 1 ? "Fill" : "Rim";
              return (
                <button
                  key={light.id || idx}
                  type="button"
                  onClick={() => setActiveLightIndex(idx)}
                  className={`flex-1 h-[2.1vw] px-[0.5vw] rounded-[0.42vw] flex items-center justify-center gap-[0.4vw] transition-all cursor-pointer select-none ${
                    isSelected
                      ? "bg-white text-gray-900 shadow-xs border border-gray-200/90 font-bold"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/60 border border-transparent font-medium"
                  }`}
                >
                  <span
                    className="w-[0.55vw] h-[0.55vw] rounded-full shrink-0 shadow-2xs border border-black/10 transition-colors"
                    style={{
                      backgroundColor: isEnabled ? (light.color || "#EC5137") : "#9ca3af",
                    }}
                  />
                  <span className="text-[0.73vw] whitespace-nowrap">
                    {roleName}
                  </span>
                  {!isEnabled && (
                    <span className="text-[0.55vw] font-bold px-[0.25vw] py-[0.02vw] rounded bg-gray-200/80 text-gray-500">
                      Off
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Light Status & Actions Sub-bar */}
          <div className="flex items-center justify-between px-[0.2vw]">
            <div className="flex items-center gap-[0.35vw]">
              <span className="text-[0.68vw] font-bold text-gray-700">
                Light {activeLightIndex + 1}:
              </span>
              <span className="text-[0.68vw] font-semibold text-gray-500">
                {activeLightIndex === 0 ? "Key Light" : activeLightIndex === 1 ? "Fill Light" : "Rim Light"}
              </span>
            </div>

            <div className="flex items-center gap-[0.3vw]">
              {/* Toggle Current Light ON/OFF Button */}
              <button
                type="button"
                onClick={(e) => handleToggleLightEnabled(activeLightIndex, e)}
                className={`h-[1.55vw] px-[0.45vw] rounded-[0.35vw] flex items-center gap-[0.2vw] border text-[0.63vw] font-bold transition-all cursor-pointer shadow-2xs ${
                  activeLight.enabled
                    ? "bg-emerald-50 border-emerald-300/80 text-emerald-700 hover:bg-emerald-100"
                    : "bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200"
                }`}
                title={activeLight.enabled ? "Turn Off this light" : "Turn On this light"}
              >
                <Icon
                  icon={activeLight.enabled ? "solar:sun-2-bold" : "solar:sun-dim-outline"}
                  className="w-[0.75vw] h-[0.75vw]"
                />
                <span>{activeLight.enabled ? "Enabled" : "Disabled"}</span>
              </button>

              {/* Delete Active Light (only if > 1 light) */}
              {lightsArray.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveLight(activeLightIndex, e)}
                  className="h-[1.55vw] px-[0.35vw] rounded-[0.35vw] bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 flex items-center gap-[0.15vw] text-[0.63vw] font-semibold transition-all cursor-pointer shadow-2xs"
                  title="Remove this light source"
                >
                  <Icon icon="heroicons:trash-20-solid" className="w-[0.75vw] h-[0.75vw]" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Position Presets (Equal 4-column Grid) */}
        <div className="grid grid-cols-4 gap-[0.3vw] w-full">
          <button
            type="button"
            onClick={() => updateActiveLight("position", { x: -8, y: 12, z: 12 })}
            className="py-[0.22vw] px-[0.2vw] rounded-[0.35vw] bg-[#f9fafb] hover:bg-orange-50 hover:text-[#ea543a] hover:border-orange-200 text-gray-600 text-[0.66vw] font-semibold border border-gray-200 shadow-2xs transition-all cursor-pointer text-center truncate"
            title="Front-Left Key Light"
          >
            Front-L
          </button>
          <button
            type="button"
            onClick={() => updateActiveLight("position", { x: 8, y: 8, z: 10 })}
            className="py-[0.22vw] px-[0.2vw] rounded-[0.35vw] bg-[#f9fafb] hover:bg-orange-50 hover:text-[#ea543a] hover:border-orange-200 text-gray-600 text-[0.66vw] font-semibold border border-gray-200 shadow-2xs transition-all cursor-pointer text-center truncate"
            title="Front-Right Fill Light"
          >
            Front-R
          </button>
          <button
            type="button"
            onClick={() => updateActiveLight("position", { x: 0, y: -12, z: 14 })}
            className="py-[0.22vw] px-[0.2vw] rounded-[0.35vw] bg-[#f9fafb] hover:bg-orange-50 hover:text-[#ea543a] hover:border-orange-200 text-gray-600 text-[0.66vw] font-semibold border border-gray-200 shadow-2xs transition-all cursor-pointer text-center truncate"
            title="Backlight / Rim Light"
          >
            Back Rim
          </button>
          <button
            type="button"
            onClick={() => updateActiveLight("position", { x: 0, y: 0, z: 25 })}
            className="py-[0.22vw] px-[0.2vw] rounded-[0.35vw] bg-[#f9fafb] hover:bg-orange-50 hover:text-[#ea543a] hover:border-orange-200 text-gray-600 text-[0.66vw] font-semibold border border-gray-200 shadow-2xs transition-all cursor-pointer text-center truncate"
            title="Overhead Top Light"
          >
            Overhead
          </button>
        </div>

        {/* Compass & Sun Height Widget for Active Light */}
        <div className="bg-[#fafafa] border border-gray-200/90 rounded-[0.6vw] p-[0.7vw] flex items-center justify-around shadow-2xs relative">
          {/* Compass Disk (2D Plane Position) */}
          <div className="flex flex-col items-center gap-[0.45vw]">
            <div
              ref={compassRef}
              onMouseDown={(e) => {
                setIsDraggingCompass(true);
                handleCompassPointer(e);
              }}
              className="relative w-[8.2vw] h-[8.2vw] rounded-full bg-white border border-gray-200 shadow-inner flex items-center justify-center cursor-crosshair select-none overflow-hidden"
            >
              {/* Polar Compass Rings */}
              <div className="absolute inset-[10%] rounded-full border border-gray-100 pointer-events-none" />
              <div className="absolute inset-[25%] rounded-full border border-gray-100 pointer-events-none" />
              <div className="absolute inset-[40%] rounded-full border border-gray-100 pointer-events-none" />

              {/* Cardinal axis crosshairs */}
              <div className="absolute w-full h-[1px] bg-gray-100 pointer-events-none" />
              <div className="absolute h-full w-[1px] bg-gray-100 pointer-events-none" />

              {/* Cardinal direction labels */}
              <span className="absolute top-[0.25vw] text-[0.55vw] font-bold text-gray-400 select-none pointer-events-none">N</span>
              <span className="absolute bottom-[0.25vw] text-[0.55vw] font-bold text-gray-400 select-none pointer-events-none">S</span>
              <span className="absolute right-[0.35vw] text-[0.55vw] font-bold text-gray-400 select-none pointer-events-none">E</span>
              <span className="absolute left-[0.35vw] text-[0.55vw] font-bold text-gray-400 select-none pointer-events-none">W</span>

              {/* Central Ray line towards sun */}
              <div
                className="absolute left-1/2 top-1/2 h-[1px] bg-amber-400/80 pointer-events-none origin-left"
                style={{
                  width: `${Math.min(100, Math.sqrt((sunCompassX - 50) ** 2 + (sunCompassY - 50) ** 2))}%`,
                  transform: `rotate(${Math.atan2(sunCompassY - 50, sunCompassX - 50)}rad)`
                }}
              />

              {/* Center Model Node */}
              <div className="relative z-2 w-[2.2vw] h-[2.2vw] rounded-[0.35vw] bg-white border border-gray-200 shadow-2xs flex flex-col items-center justify-center pointer-events-none">
                <Icon icon="f7:cube" className="w-[0.9vw] h-[0.9vw] text-gray-600" />
                <span className="text-[0.44vw] font-bold text-gray-500 tracking-wider">MODEL</span>
              </div>

              {/* Sun Node */}
              <div
                className="absolute w-[1.3vw] h-[1.3vw] rounded-full bg-amber-400/25 border border-amber-400/50 flex items-center justify-center z-3 pointer-events-none shadow-sm -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${sunCompassX}%`, top: `${sunCompassY}%` }}
              >
                <Icon icon="solar:sun-2-bold" className="w-[0.9vw] h-[0.9vw] text-amber-500" />
              </div>
            </div>

            <span className="text-[0.72vw] font-medium text-gray-500">Placement</span>
          </div>

          {/* Sun Height Vertical Slider Track */}
          <div className="flex flex-col items-center gap-[0.45vw]">
            <div
              ref={heightTrackRef}
              onMouseDown={(e) => {
                setIsDraggingHeight(true);
                handleHeightPointer(e);
              }}
              className="relative w-[1.8vw] h-[8.2vw] bg-[#fffaf5] border border-amber-200/70 rounded-full flex flex-col items-center justify-end cursor-ns-resize select-none overflow-hidden"
            >
              {/* Sun icon along the vertical track */}
              <div
                className="absolute w-[1.4vw] h-[1.4vw] rounded-full bg-amber-400/25 border border-amber-400/50 flex items-center justify-center shadow-xs -translate-x-1/2 -translate-y-1/2 left-1/2 pointer-events-none"
                style={{ bottom: `${heightPercent}%`, marginBottom: "-0.7vw" }}
              >
                <Icon icon="solar:sun-2-bold" className="w-[0.9vw] h-[0.9vw] text-amber-500" />
              </div>
            </div>

            <span className="text-[0.72vw] font-medium text-gray-500">Height</span>
          </div>
        </div>

        {/* Position X, Y, Z Controls */}
        <div className="flex items-center justify-between gap-[0.5vw] mt-[0.2vw]">
          <span className="text-[0.78vw] font-semibold text-gray-900 w-[4.5vw] shrink-0">
            Position
          </span>

          <div className="grid grid-cols-3 gap-[0.35vw] flex-1">
            <AxisInput
              axis="X"
              value={posX}
              onChange={(v) => updateActiveLight("position", { ...lightPos, x: v })}
              step={1}
            />
            <AxisInput
              axis="Y"
              value={posY}
              onChange={(v) => updateActiveLight("position", { ...lightPos, y: v })}
              step={1}
            />
            <AxisInput
              axis="Z"
              value={posZ}
              onChange={(v) => updateActiveLight("position", { ...lightPos, z: v })}
              step={1}
            />
          </div>
        </div>

        {/* Light Color Selector */}
        <div className="flex items-center justify-between gap-[0.5vw] mt-[0.3vw]">
          <span className="text-[0.74vw] font-medium text-gray-700 w-[7.2vw] shrink-0">
            Light Color :
          </span>

          <div className="flex items-center gap-[0.4vw] flex-1 min-w-0" ref={colorPickerContainerRef}>
            {/* Color Swatch */}
            <button
              type="button"
              onClick={() => setIsColorPickerOpen((prev) => !prev)}
              className="w-[2.2vw] h-[1.65vw] rounded-[0.35vw] border border-gray-200/80 shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: lightColor }}
              title="Click to change light color"
            />

            {/* Hex and percentage display pill */}
            <div className="flex-1 h-[1.65vw] bg-white border border-gray-200 rounded-[0.35vw] px-[0.55vw] flex items-center justify-between text-[0.72vw] text-gray-800 font-medium">
              <span className="uppercase">{lightColor}</span>
              <span className="text-gray-600 font-medium">100%</span>
            </div>

            {/* Color Picker Popover */}
            {isColorPickerOpen && (
              <div className="absolute z-50 right-[1.2vw] bottom-[4.5vw] bg-white rounded-[0.6vw] shadow-2xl border border-gray-100 p-[0.7vw]">
                <ColorPicker
                  color={lightColor}
                  onChange={(c) => updateActiveLight("color", c)}
                  onClose={() => setIsColorPickerOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sliders for Active Light */}
        <div className="flex flex-col gap-[0.45vw] mt-[0.2vw]">
          <LightingSlider
            label="Light Intensity"
            value={lightIntensity}
            onChange={(val) => updateActiveLight("intensity", val)}
            unit="%"
          />
          <LightingSlider
            label="Shadow Density"
            value={shadowDensity}
            onChange={(val) => updateActiveLight("shadowDensity", val)}
            unit="%"
          />
          <LightingSlider
            label="Shadow Softness"
            value={shadowSoftness}
            onChange={(val) => updateActiveLight("shadowSoftness", val)}
            unit="%"
          />
        </div>
      </div>

      {/* ── 3. SECTION: FLOOR & REFLECTION ── */}
      <FloorPresetSelector materialSettings={currentControls} onUpdateMaterialSetting={handleUpdate} />
    </div>
  );
}

export default LightingPanel;
