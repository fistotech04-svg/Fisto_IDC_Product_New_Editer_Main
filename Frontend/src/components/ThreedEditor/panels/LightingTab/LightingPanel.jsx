import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "../../ColorPicker";
import { AxisInput } from "../common/PanelInputs";
import { builtInHdris } from "../../../../data/hdriData";

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

// Standard studio / daylight / softbox + all built-in HDRIs
const allEnvironments = [
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
  ...(builtInHdris || []).map((hdr) => ({
    id: `builtin_${hdr.id}`,
    name: hdr.name,
    preview: hdr.preview,
    envValue: `builtin_${hdr.id}`,
  })),
];

export function LightingPanel({
  materialSettings,
  controls,
  onUpdateMaterialSetting,
  updateControl,
}) {
  const currentControls = materialSettings || controls || {};
  const handleUpdate = onUpdateMaterialSetting || updateControl || (() => {});

  // State for See All environments expansion
  const [showAllEnvironments, setShowAllEnvironments] = useState(false);

  // State for Color Picker popover
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
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

  // Current values
  const lightColor = currentControls.lightColor || "#EC5137";
  const lightIntensity = currentControls.lightIntensity ?? 100;
  const shadowDensity = currentControls.shadowDensity ?? currentControls.shadow ?? 100;
  const shadowSoftness = currentControls.shadowSoftness ?? currentControls.softness ?? 100;

  const envRotation = currentControls.envRotation ?? 0;
  const envBrightness = currentControls.reflection ?? 100;
  const envBlur = currentControls.worldBlur ?? 0;
  const envOpacity = currentControls.worldOpacity ?? 100;

  const activeEnv = currentControls.environment || "studio";

  // Light position (Sun placement in compass + Sun height)
  const lightPos = currentControls.lightPosition || { x: 0, y: 10, z: 10 };
  const posX = lightPos.x ?? 0;
  const posY = lightPos.y ?? 10;
  const posZ = lightPos.z ?? 10;

  // Compass 2D dragging state
  const compassRef = useRef(null);
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Height slider dragging state
  const heightTrackRef = useRef(null);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);

  // Compass geometry & calculations (Radius maps to 20 units)
  const MAX_RADIUS_UNITS = 20;
  const compassRadiusNorm = Math.min(1, Math.sqrt(posX * posX + posY * posY) / MAX_RADIUS_UNITS);
  const compassAngle = Math.atan2(posY, posX); // radians

  // Percentage from center for the sun icon inside the compass (center is 50%, 50%)
  // Max visual radius is 40% of container width
  const visualRadiusPercent = 40 * compassRadiusNorm;
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
    const dist = Math.sqrt(dx * dx + dy * dy);

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

    handleUpdate("lightPosition", {
      ...lightPos,
      x: newX,
      y: newY,
    });
  };

  // Height slider interaction
  const handleHeightPointer = (e) => {
    if (!heightTrackRef.current) return;
    const rect = heightTrackRef.current.getBoundingClientRect();
    const clientY = e.clientY;
    const top = rect.top;
    const height = rect.height;

    // Invert: top is high (MAX_Z), bottom is low (MIN_Z)
    const ratio = Math.max(0, Math.min(1, (rect.bottom - clientY) / height));
    const newZ = Math.round(MIN_Z + ratio * (MAX_Z - MIN_Z));

    handleUpdate("lightPosition", {
      ...lightPos,
      z: newZ,
    });
  };

  // Global mousemove/mouseup listeners for dragging
  useEffect(() => {
    if (!isDraggingCompass && !isDraggingHeight) return;

    const handleMouseMove = (e) => {
      if (isDraggingCompass) handleCompassPointer(e);
      if (isDraggingHeight) handleHeightPointer(e);
    };

    const handleMouseUp = () => {
      setIsDraggingCompass(false);
      setIsDraggingHeight(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingCompass, isDraggingHeight, lightPos]);

  return (
    <div className="flex flex-col gap-[1.3vw] pb-[2vw] text-gray-800">
      {/* ── 1. SECTION: ENVIRONMENT ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.84vw] font-bold text-gray-900 shrink-0">Environment</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1 min-w-[1vw]"></div>

          {/* "See All" Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAllEnvironments((prev) => !prev)}
            className="flex items-center gap-[0.25vw] text-[#ea543a] hover:text-[#d43d23] text-[0.74vw] font-medium transition-colors cursor-pointer shrink-0"
          >
            <span>See All</span>
            <Icon
              icon="heroicons:chevron-down-20-solid"
              className={`w-[0.9vw] h-[0.9vw] transition-transform duration-200 ${
                showAllEnvironments ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* 3-Column Environment Grid (Shows first 3 or all based on showAllEnvironments) */}
        <div
          className={`grid grid-cols-3 gap-[0.65vw] pt-[0.2vw] ${
            showAllEnvironments
              ? "max-h-[16vw] overflow-y-auto pr-[0.2vw] custom-left-scrollbar"
              : ""
          }`}
        >
          {(showAllEnvironments ? allEnvironments : allEnvironments.slice(0, 3)).map((env) => {
            const isSelected =
              activeEnv === env.envValue ||
              activeEnv === env.id ||
              (env.id === "daylight" && activeEnv.includes("day"));

            return (
              <button
                key={env.id}
                type="button"
                onClick={() => handleUpdate("environment", env.envValue)}
                className="flex flex-col items-center gap-[0.35vw] group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-full aspect-[16/9] rounded-[0.45vw] overflow-hidden border-2 transition-all bg-gray-100 ${
                    isSelected
                      ? "border-[#ea543a] shadow-sm ring-1 ring-[#ea543a]/30"
                      : "border-gray-200 group-hover:border-gray-300"
                  }`}
                >
                  <img
                    src={env.preview}
                    alt={env.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.opacity = "0.7";
                    }}
                  />
                </div>
                <span
                  className={`text-[0.74vw] font-medium transition-colors truncate w-full text-center ${
                    isSelected ? "text-[#ea543a] font-semibold" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                  title={env.name}
                >
                  {env.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Environment Sliders */}
        <div className="flex flex-col gap-[0.45vw] mt-[0.3vw]">
          <LightingSlider
            label="Env Rotation"
            value={Math.round((envRotation / 360) * 100)}
            onChange={(pct) => handleUpdate("envRotation", Math.round((pct / 100) * 360))}
            unit="%"
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

      {/* ── 2. SECTION: SHADOW PROPERTIES ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.84vw] font-bold text-gray-900">Shadow Properties</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Compass & Height Card */}
        <div className="w-full bg-[#fdfdfd] border border-gray-100 rounded-[0.7vw] p-[0.9vw] shadow-xs flex items-center justify-around gap-[0.5vw]">
          {/* Sun Placement Dial (Compass) */}
          <div className="flex flex-col items-center gap-[0.45vw]">
            <div
              ref={compassRef}
              onMouseDown={(e) => {
                setIsDraggingCompass(true);
                handleCompassPointer(e);
              }}
              className="relative w-[8.2vw] h-[8.2vw] rounded-full border border-gray-200/90 flex items-center justify-center cursor-crosshair select-none bg-white shadow-inner"
            >
              {/* Outer guide orbit */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-amber-200/40 pointer-events-none" />
              {/* Inner guide orbit */}
              <div className="absolute w-[44%] h-[44%] rounded-full border border-gray-200/70 pointer-events-none" />

              {/* Crosshair lines */}
              <div className="absolute w-full h-[1px] bg-gray-200/70 pointer-events-none" />
              <div className="absolute h-full w-[1px] bg-gray-200/70 pointer-events-none" />

              {/* Direction Labels */}
              <span className="absolute top-[0.2vw] text-[0.55vw] font-bold text-gray-400 pointer-events-none">N</span>
              <span className="absolute bottom-[0.2vw] text-[0.55vw] font-bold text-gray-400 pointer-events-none">S</span>
              <span className="absolute left-[0.35vw] text-[0.55vw] font-bold text-gray-400 pointer-events-none">W</span>
              <span className="absolute right-[0.35vw] text-[0.55vw] font-bold text-gray-400 pointer-events-none">E</span>

              {/* Sun dashed connecting line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-1">
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${sunCompassX}%`}
                  y2={`${sunCompassY}%`}
                  stroke="#ea543a"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  strokeOpacity="0.75"
                />
              </svg>

              {/* Center Model Icon */}
              <div className="flex flex-col items-center justify-center z-2 pointer-events-none text-gray-600">
                <Icon icon="f7:cube" className="w-[1.05vw] h-[1.05vw] text-gray-600" />
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

            <span className="text-[0.72vw] font-medium text-gray-500">Sun Placement</span>
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

            <span className="text-[0.72vw] font-medium text-gray-500">Sun Height</span>
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
              onChange={(v) => handleUpdate("lightPosition", { ...lightPos, x: v })}
              step={1}
            />
            <AxisInput
              axis="Y"
              value={posY}
              onChange={(v) => handleUpdate("lightPosition", { ...lightPos, y: v })}
              step={1}
            />
            <AxisInput
              axis="Z"
              value={posZ}
              onChange={(v) => handleUpdate("lightPosition", { ...lightPos, z: v })}
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
                  onChange={(c) => handleUpdate("lightColor", c)}
                  onClose={() => setIsColorPickerOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Remaining Lighting Sliders */}
        <div className="flex flex-col gap-[0.45vw] mt-[0.2vw]">
          <LightingSlider
            label="Light Intensity"
            value={lightIntensity}
            onChange={(val) => handleUpdate("lightIntensity", val)}
            unit="%"
          />
          <LightingSlider
            label="Shadow Density"
            value={shadowDensity}
            onChange={(val) => {
              handleUpdate("shadowDensity", val);
              handleUpdate("shadow", val);
            }}
            unit="%"
          />
          <LightingSlider
            label="Shadow Softness"
            value={shadowSoftness}
            onChange={(val) => {
              handleUpdate("shadowSoftness", val);
              handleUpdate("softness", val);
            }}
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}

export default LightingPanel;
