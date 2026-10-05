import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import ColorPicker from "../../ColorPicker";

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
  { id: "frame_1_1_a", ratio: "1 : 1", aspect: 1 / 1 },
  { id: "frame_2_1_a", ratio: "2 : 1", aspect: 2 / 1 },
  { id: "frame_4_5_a", ratio: "4 : 5", aspect: 4 / 5 },
  { id: "frame_1_1_b", ratio: "1 : 1", aspect: 1 / 1 },
  { id: "frame_2_1_b", ratio: "2 : 1", aspect: 2 / 1 },
  { id: "frame_4_5_b", ratio: "4 : 5", aspect: 4 / 5 },
  { id: "frame_1_1_c", ratio: "1 : 1", aspect: 1 / 1 },
  { id: "frame_2_1_c", ratio: "2 : 1", aspect: 2 / 1 },
  { id: "frame_4_5_c", ratio: "4 : 5", aspect: 4 / 5 },
];

export function CameraPanel({
  materialSettings,
  onUpdateMaterialSetting,
  cameraPosition = { x: 0, y: 0, z: 0 },
  onChangeCameraPosition,
  cameraBgType = "transparent",
  onChangeCameraBgType,
  cameraBgColor = "#F3F3F3",
  onChangeCameraBgColor,
  cameraBgOpacity = 100,
  onChangeCameraBgOpacity,
  selectedFrameId = "frame_2_1_a",
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
      {/* â”€â”€ 1. CAMERA ANGLE SECTION â”€â”€ */}
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

          <div className="flex items-center gap-[0.45vw] flex-1">
            {[
              { axis: "X", val: posX },
              { axis: "Y", val: posY },
              { axis: "Z", val: posZ },
            ].map(({ axis, val }) => (
              <div
                key={axis}
                className="flex-1 flex items-center justify-between bg-[#f3f4f6] hover:bg-[#eaecef] rounded-[0.4vw] px-[0.55vw] py-[0.38vw] transition-colors"
              >
                <span className="text-[0.72vw] font-medium text-gray-600 select-none">
                  {axis}
                </span>
                <input
                  type="text"
                  readOnly
                  value={Math.round(val)}
                  className="w-[1.8vw] text-right bg-transparent border-none outline-none text-[0.75vw] font-semibold text-gray-800 pointer-events-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ 2. BACKGROUND SECTION â”€â”€ */}
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
                cameraBgColor.toUpperCase() === preset.value.toUpperCase());

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
                    ? "border-[#ea543a] ring-2 ring-[#ea543a]/25 shadow-xs"
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
                  cameraBgType === "transparent" ? "#F3F3F3" : cameraBgColor,
                opacity: (cameraBgOpacity ?? 100) / 100,
              }}
              title="Click to open color picker"
            />

            {/* Hex + Opacity input box */}
            <div className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] h-[1.95vw] focus-within:border-[#ea543a] transition-colors">
              <input
                type="text"
                value={(cameraBgColor || "#F3F3F3").toUpperCase()}
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (!val.startsWith("#")) val = `#${val}`;
                  onChangeCameraBgType?.("solid");
                  onChangeCameraBgColor?.(val);
                }}
                className="w-[4.8vw] text-[0.74vw] font-medium text-gray-800 bg-transparent outline-none uppercase font-mono"
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
                          ? "font-bold text-[#ea543a]"
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
                  color={cameraBgColor || "#F3F3F3"}
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

      {/* â”€â”€ 3. FRAME SECTION â”€â”€ */}
      <div className="flex flex-col gap-[0.85vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.88vw] font-semibold text-gray-900 tracking-tight whitespace-nowrap">
            Frame
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        {/* 3x3 Aspect Ratio Cards Grid */}
        <div className="grid grid-cols-3 gap-[0.55vw]">
          {CAMERA_FRAME_OPTIONS.map((frame) => {
            const isSelected = selectedFrameId === frame.id;

            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => onSelectFrameId?.(frame.id)}
                className={`flex flex-col items-center justify-between p-[0.55vw] rounded-[0.55vw] transition-all cursor-pointer bg-white ${
                  isSelected
                    ? "border border-gray-100 shadow-[0_0.2vw_0.8vw_rgba(0,0,0,0.08)] ring-1 ring-gray-100"
                    : "hover:bg-gray-50/70"
                }`}
              >
                {/* Frame Dashed Card Area */}
                <div
                  className={`w-full aspect-square rounded-[0.35vw] flex items-center justify-center p-[0.3vw]`}
                >
                  <div
                    className={`flex items-center justify-center border transition-all ${
                      isSelected
                        ? "border-dashed border-[#ea543a] bg-transparent"
                        : "border-dashed border-gray-300"
                    }`}
                    style={{
                      width: frame.ratio === "2 : 1" ? "100%" : frame.ratio === "4 : 5" ? "76%" : "84%",
                      height: frame.ratio === "2 : 1" ? "68%" : frame.ratio === "4 : 5" ? "95%" : "84%",
                      borderRadius: "0.2vw",
                    }}
                  >
                    <Icon
                      icon="solar:camera-outline"
                      className={`w-[1.1vw] h-[1.1vw] transition-colors ${
                        isSelected ? "text-[#ea543a]" : "text-gray-300"
                      }`}
                    />
                  </div>
                </div>

                {/* Aspect ratio label */}
                <span
                  className={`text-[0.68vw] font-medium mt-[0.35vw] transition-colors ${
                    isSelected ? "text-gray-900 font-semibold" : "text-gray-600"
                  }`}
                >
                  {frame.ratio}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CameraPanel;
