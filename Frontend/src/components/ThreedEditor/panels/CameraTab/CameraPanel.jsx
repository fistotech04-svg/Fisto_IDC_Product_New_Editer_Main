
function CameraSlider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "%" }) {
  const [inputText, setInputText] = useState(String(Math.round(value ?? 100)));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputText(String(Math.round(value ?? 100)));
    }
  }, [value, isFocused]);

  const numericValue = typeof value === "number" ? value : 100;
  const percentage = Math.max(0, Math.min(100, ((numericValue - min) / (max - min)) * 100));

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      setInputText(String(Math.round(clamped)));
      onChange && onChange(clamped);
    } else {
      setInputText(String(Math.round(numericValue)));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputText(String(Math.round(numericValue)));
      setIsFocused(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-[0.5vw] py-[0.15vw]">
      <span className="text-[0.74vw] font-medium text-gray-700 w-[7.2vw] shrink-0 truncate">
        {label} :
      </span>

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

      <div
        className={`w-[3.4vw] h-[1.55vw] bg-gray-100 hover:bg-gray-200/80 rounded-[0.3vw] flex items-center justify-center shrink-0 border transition-all px-[0.2vw] ${
          isFocused
            ? "border-[#ea543a] bg-white ring-1 ring-[#ea543a]/25 shadow-2xs"
            : "border-transparent"
        }`}
      >
        <input
          type="text"
          value={inputText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full text-center text-[0.72vw] font-semibold text-gray-800 bg-transparent outline-none"
        />
        <span className="text-[0.62vw] text-gray-500 font-medium select-none ml-[0.05vw]">{unit}</span>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import * as THREE from "three";
import ColorPicker from "../../ColorPicker";
import { AxisInput } from "../common/PanelInputs";

export const CAMERA_BG_PRESETS = [
  { id: "transparent", type: "pattern", value: "transparent" },
  { id: "white", type: "color", value: "#FFFFFF" },
  { id: "light-gray", type: "color", value: "#D1D5DB" },
  { id: "charcoal", type: "color", value: "#4B5563" },
  { id: "lavender", type: "color", value: "#D8D8E8" },
  { id: "dusty-rose", type: "color", value: "#C5A8A8" },
  { id: "sage", type: "color", value: "#9CB5B5" },
];

export const CAMERA_FRAME_OPTIONS = [
  { id: "frame_full_hd", name: "Full HD", ratio: "16:9", aspect: 16 / 9, icon: "solar:monitor-smartphone-linear" },
  { id: "frame_fullscreen", name: "Full Screen", ratio: "Full", aspect: null, icon: "solar:full-screen-square-linear" },
  { id: "frame_square", name: "Square", ratio: "1:1", aspect: 1 / 1, icon: "ant-design:instagram-outlined" },
];

export function CameraPanel({
  materialSettings,
  onUpdateMaterialSetting,
  cameraPosition = { x: 0, y: 0, z: 0 },
  onChangeCameraPosition,
  cameraBgType = "solid",
  onChangeCameraBgType,
  cameraBgColor = "#FFFFFF",
  onChangeCameraBgColor,
  cameraBgOpacity = 100,
  onChangeCameraBgOpacity,
  selectedFrameId = "frame_full_hd",
  onSelectFrameId,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorMode, setColorMode] = useState("HEX");
  const [isColorModeOpen, setIsColorModeOpen] = useState(false);
  const colorPickerContainerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        colorPickerContainerRef.current &&
        !colorPickerContainerRef.current.contains(e.target)
      ) {
        setShowColorPicker(false);
        setIsColorModeOpen(false);
      }
    };
    if (showColorPicker || isColorModeOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showColorPicker, isColorModeOpen]);

  const posX = typeof cameraPosition?.x === "number" ? cameraPosition.x : 0;
  const posY = typeof cameraPosition?.y === "number" ? cameraPosition.y : 0;
  const posZ = typeof cameraPosition?.z === "number" ? cameraPosition.z : 0;

  return (
    <div className="flex flex-col gap-[1.3vw] font-sans select-none pb-[1vw]">
      {/* ── 1. CAMERA ANGLE SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.88vw] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            Camera Angle
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        <div className="flex items-center justify-between gap-[0.5vw]">
          <span className="text-[0.78vw] font-medium text-gray-700 min-w-[3.6vw]">
            Position
          </span>

          <div className="grid grid-cols-3 gap-[0.3vw] flex-1 min-w-0">
            <AxisInput
              axis="X"
              value={posX}
              onChange={(v) => onChangeCameraPosition?.("x", v)}
              step={0.5}
            />
            <AxisInput
              axis="Y"
              value={posY}
              onChange={(v) => onChangeCameraPosition?.("y", v)}
              step={0.5}
            />
            <AxisInput
              axis="Z"
              value={posZ}
              onChange={(v) => onChangeCameraPosition?.("z", v)}
              step={0.5}
            />
          </div>
        </div>
      </div>

      {/* ── 2. BACKGROUND SECTION ── */}
      <div className="flex flex-col gap-[0.85vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.88vw] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            Background
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {/* Swatches Row */}
        <div className="flex items-center gap-[0.45vw] flex-wrap">
          {CAMERA_BG_PRESETS.map((preset) => {
            const isTransparent = preset.id === "transparent";
            const isSelected =
              (isTransparent && cameraBgType === "transparent") ||
              (!isTransparent &&
                cameraBgType === "solid" &&
                cameraBgColor?.toUpperCase() === preset.value?.toUpperCase());

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (isTransparent) {
                    onChangeCameraBgType?.("transparent");
                  } else {
                    onChangeCameraBgType?.("solid");
                    onChangeCameraBgColor?.(preset.value);
                  }
                }}
                className={`w-[2.35vw] h-[2.35vw] rounded-[0.5vw] border transition-all cursor-pointer relative shrink-0 active:scale-95 ${
                  isSelected
                    ? "border-[#EC5137] ring-2 ring-[#EC5137]/25 shadow-xs"
                    : "border-gray-200/90 hover:border-gray-300 hover:shadow-2xs"
                }`}
                style={
                  isTransparent
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db), linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db)",
                        backgroundPosition: "0 0, 0.25vw 0.25vw",
                        backgroundSize: "0.5vw 0.5vw",
                        backgroundColor: "#ffffff",
                      }
                    : {
                        backgroundColor: preset.value,
                      }
                }
              />
            );
          })}
        </div>

        {/* Choose Custom Color */}
        <div className="flex flex-col gap-[0.45vw] pt-[0.2vw]">
          <span className="text-[0.8vw] font-semibold text-gray-900">
            Choose Custom Color
          </span>

          <div
            className="flex items-center gap-[0.45vw] relative"
            ref={colorPickerContainerRef}
          >
            {/* Color preview box */}
            <button
              type="button"
              onClick={() => {
                onChangeCameraBgType?.("solid");
                setShowColorPicker((prev) => !prev);
              }}
              className="w-[3.8vw] h-[1.95vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-2xs shrink-0 relative overflow-hidden transition-all active:scale-95 hover:border-gray-300"
              style={{
                backgroundColor:
                  cameraBgType === "transparent" ? "#FFFFFF" : (cameraBgColor || "#FFFFFF"),
                opacity: (cameraBgOpacity ?? 100) / 100,
              }}
              title="Click to open color picker"
            />

            {/* Hex + Opacity input box */}
            <div className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] h-[1.95vw] focus-within:border-[#EC5137] transition-colors">
              <input
                type="text"
                value={
                  colorMode === "RGB"
                    ? (() => {
                        try {
                          const c = new THREE.Color(cameraBgColor || "#FFFFFF");
                          return `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
                        } catch {
                          return (cameraBgColor || "#FFFFFF").toUpperCase();
                        }
                      })()
                    : (cameraBgColor || "#FFFFFF").toUpperCase()
                }
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (colorMode === "RGB") {
                    const parts = val.split(",").map((p) => parseInt(p.trim(), 10));
                    if (parts.length === 3 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
                      const hex = `#${((1 << 24) + (parts[0] << 16) + (parts[1] << 8) + parts[2]).toString(16).slice(1).toUpperCase()}`;
                      onChangeCameraBgType?.("solid");
                      onChangeCameraBgColor?.(hex);
                    }
                  } else {
                    if (!val.startsWith("#")) val = `#${val}`;
                    onChangeCameraBgType?.("solid");
                    onChangeCameraBgColor?.(val);
                  }
                }}
                className="w-[5.2vw] text-[0.74vw] font-medium text-gray-800 bg-transparent outline-none uppercase font-mono"
              />
              <span className="text-[0.72vw] font-semibold text-gray-500">
                {cameraBgOpacity ?? 100}%
              </span>
            </div>

            {/* Mode selector dropdown (HEX / RGB / HSL) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorModeOpen((prev) => !prev)}
                className="flex items-center gap-[0.3vw] px-[0.65vw] h-[1.95vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.72vw] font-semibold text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>{colorMode}</span>
                <Icon
                  icon="heroicons:chevron-down-20-solid"
                  className="w-[0.8vw] h-[0.8vw] text-gray-400"
                />
              </button>

              {isColorModeOpen && (
                <div className="absolute right-0 top-full mt-[0.25vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.2vw] min-w-[4.5vw]">
                  {["HEX", "RGB", "HSL"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setColorMode(mode);
                        setIsColorModeOpen(false);
                      }}
                      className={`w-full text-left px-[0.6vw] py-[0.25vw] text-[0.7vw] hover:bg-gray-50 transition-colors cursor-pointer ${
                        colorMode === mode
                          ? "font-bold text-[#EC5137]"
                          : "text-gray-700"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popover ColorPicker */}
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-[0.4vw] z-50 shadow-2xl rounded-xl">
                <ColorPicker
                  color={cameraBgColor || "#FFFFFF"}
                  onChange={(c) => {
                    onChangeCameraBgType?.("solid");
                    onChangeCameraBgColor?.(c);
                  }}
                  opacity={cameraBgOpacity ?? 100}
                  onOpacityChange={(op) => onChangeCameraBgOpacity?.(op)}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. FRAME SECTION ── */}
      <div className="flex flex-col gap-[0.85vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.88vw] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            Frame
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {/* 3 Aspect Ratio Cards: Full HD, Full Screen, Square */}
        <div className="grid grid-cols-3 gap-[0.55vw]">
          {CAMERA_FRAME_OPTIONS.map((frame) => {
            const isSelected = selectedFrameId === frame.id || (!selectedFrameId && frame.id === "frame_full_hd");

            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => onSelectFrameId?.(frame.id)}
                className={`flex flex-col items-center justify-between p-[0.55vw] rounded-[0.55vw] border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-orange-50/60 border-[#EC5137] text-[#EC5137] shadow-sm ring-2 ring-[#EC5137]/15 opacity-100"
                    : "bg-white border-gray-200 text-gray-700 opacity-60 hover:opacity-90 hover:border-gray-300"
                }`}
              >
                {/* Frame Preview Box */}
                <div className="w-full aspect-4/3 rounded-[0.35vw] flex items-center justify-center p-[0.2vw]">
                  <div
                    className={`flex items-center justify-center border transition-all ${
                      isSelected
                        ? "border-[#EC5137] bg-white/80 shadow-2xs"
                        : "border-gray-300 bg-gray-50/50"
                    }`}
                    style={{
                      width: frame.id === "frame_full_hd" ? "92%" : frame.id === "frame_fullscreen" ? "96%" : "68%",
                      height: frame.id === "frame_full_hd" ? "56%" : frame.id === "frame_fullscreen" ? "88%" : "88%",
                      borderRadius: "0.2vw",
                      borderStyle: frame.id === "frame_fullscreen" ? "solid" : "dashed",
                    }}
                  >
                    <Icon
                      icon={frame.icon || "solar:camera-outline"}
                      className={`w-[0.95vw] h-[0.95vw] ${isSelected ? "text-[#EC5137]" : "text-gray-400"}`}
                    />
                  </div>
                </div>

                {/* Aspect ratio label & Name */}
                <div className="flex flex-col items-center mt-[0.25vw]">
                  <span className={`text-[0.72vw] font-bold ${isSelected ? "text-[#EC5137]" : "text-gray-800"}`}>
                    {frame.name}
                  </span>
                  <span className={`text-[0.6vw] font-semibold ${isSelected ? "text-[#EC5137]/80" : "text-gray-400"}`}>
                    {frame.ratio}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. SHADOWS & FLOOR SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.88vw] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            Shadows
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        <div className="flex flex-col gap-[0.45vw]">
          <CameraSlider
            label="Shadow Density"
            value={materialSettings?.shadowDensity ?? 100}
            onChange={(val) => {
              onUpdateMaterialSetting?.("shadowDensity", val);
              // Also update lights array if present
              if (Array.isArray(materialSettings?.lights) && materialSettings.lights.length > 0) {
                const updated = materialSettings.lights.map((l, i) => i === 0 ? { ...l, shadowDensity: val } : l);
                onUpdateMaterialSetting?.("lights", updated);
              }
            }}
            unit="%"
          />
          <CameraSlider
            label="Shadow Softness"
            value={materialSettings?.shadowSoftness ?? 100}
            onChange={(val) => {
              onUpdateMaterialSetting?.("shadowSoftness", val);
              if (Array.isArray(materialSettings?.lights) && materialSettings.lights.length > 0) {
                const updated = materialSettings.lights.map((l, i) => i === 0 ? { ...l, shadowSoftness: val } : l);
                onUpdateMaterialSetting?.("lights", updated);
              }
            }}
            unit="%"
          />
          <CameraSlider
            label="Floor Opacity"
            value={materialSettings?.floorOpacity ?? 100}
            onChange={(val) => onUpdateMaterialSetting?.("floorOpacity", val)}
            unit="%"
          />
          <CameraSlider
            label="Floor Blur"
            value={materialSettings?.floorBlur ?? 50}
            onChange={(val) => onUpdateMaterialSetting?.("floorBlur", val)}
            unit="%"
          />
        </div>
      </div>
    </div>
  );
}

export default CameraPanel;
