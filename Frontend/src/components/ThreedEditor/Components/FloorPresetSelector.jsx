import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { FLOOR_PRESETS, FLOOR_CATEGORIES } from "../data/floorPresets";
import ColorPicker from "../ColorPicker";
import { SliderRow } from "../panels/common/PanelInputs";

export default function FloorPresetSelector({
  materialSettings,
  onUpdateMaterialSetting,
  showGridLines,
  setShowGridLines,
  showAxis,
  setShowAxis,
  compact = false
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAllModal, setShowAllModal] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const currentFloorType = materialSettings?.floorType || "grid";
  const currentPreset = FLOOR_PRESETS.find((p) => p.id === currentFloorType || p.floorType === currentFloorType) || FLOOR_PRESETS[0];

  const filteredPresets = selectedCategory === "All"
    ? FLOOR_PRESETS
    : FLOOR_PRESETS.filter((p) => p.category === selectedCategory);

  const handleSelectPreset = (preset) => {
    if (!onUpdateMaterialSetting) return;
    onUpdateMaterialSetting("floorType", preset.floorType || preset.id);
    if (preset.floorColor) onUpdateMaterialSetting("floorColor", preset.floorColor);
    if (preset.floorRoughness !== undefined) onUpdateMaterialSetting("floorRoughness", preset.floorRoughness);
    if (preset.floorReflectivity !== undefined) onUpdateMaterialSetting("floorReflectivity", preset.floorReflectivity);
    if (preset.floorBlur !== undefined) onUpdateMaterialSetting("floorBlur", preset.floorBlur);
  };

  const isReflective = [
    "glass",
    "glass_dark",
    "glass_clear",
    "frosted_glass",
    "checkerboard",
    "marble_dark",
    "marble_white",
    "wood_parquet",
    "carbon_fiber",
    "cyber_neon"
  ].includes(currentFloorType);

  return (
    <div className="flex flex-col gap-[0.55vw] pt-[0.2vw]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[0.78vw] font-bold text-gray-900">Floor Preset</span>
        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="text-[0.68vw] font-bold text-[#ea543a] hover:text-[#d43d24] flex items-center gap-[0.2vw] transition-colors cursor-pointer"
        >
          <span>See All ({FLOOR_PRESETS.length})</span>
          <Icon icon="solar:alt-arrow-right-bold" className="w-[0.75vw] h-[0.75vw]" />
        </button>
      </div>

      {/* Top 5 Quick Presets */}
      <div className="grid grid-cols-5 gap-[0.3vw]">
        {FLOOR_PRESETS.slice(0, 5).map((preset) => {
          const active = currentPreset.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`flex flex-col items-center justify-center gap-[0.25vw] py-[0.5vw] px-[0.2vw] rounded-[0.5vw] border transition-all cursor-pointer ${active
                  ? "bg-[#ea543a]/10 border-[#ea543a] text-[#ea543a] font-bold shadow-2xs"
                  : "bg-[#f8f9fb] hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"
                }`}
              title={preset.description}
            >
              <Icon icon={preset.icon} className="w-[1.1vw] h-[1.1vw]" />
              <span className="text-[0.6vw] leading-none truncate max-w-full px-[0.1vw]">
                {preset.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Preset Pill & Description */}
      <div className="flex items-center justify-between px-[0.6vw] py-[0.35vw] bg-gray-50 border border-gray-200/80 rounded-[0.45vw]">
        <div className="flex items-center gap-[0.4vw] min-w-0">
          <Icon icon={currentPreset.icon} className="w-[0.9vw] h-[0.9vw] text-[#ea543a] shrink-0" />
          <span className="text-[0.72vw] font-bold text-gray-800 truncate">
            {currentPreset.name}
          </span>
        </div>
        <span className="text-[0.62vw] px-[0.35vw] py-[0.1vw] bg-white border border-gray-200 rounded text-gray-500 font-medium shrink-0">
          {currentPreset.category}
        </span>
      </div>

      {/* Dynamic Sub-Controls for Fine Tuning */}
      {isReflective && (
        <div className="flex flex-col gap-[0.4vw] p-[0.6vw] bg-[#fcfcfd] rounded-[0.5vw] border border-gray-100">
          <SliderRow
            label="Reflectivity"
            value={materialSettings?.floorReflectivity ?? currentPreset.floorReflectivity ?? 65}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorReflectivity", v)}
          />
          <SliderRow
            label="Blur"
            value={materialSettings?.floorBlur ?? currentPreset.floorBlur ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorBlur", v)}
          />
          <SliderRow
            label="Roughness"
            value={materialSettings?.floorRoughness ?? currentPreset.floorRoughness ?? 20}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorRoughness", v)}
          />
          {/* Color Tint */}
          <div className="flex items-center justify-between gap-[0.5vw] pt-[0.1vw]">
            <span className="text-[0.72vw] font-medium text-gray-700">Surface Tint</span>
            <div className="flex items-center gap-[0.35vw] relative">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen((prev) => !prev)}
                className="w-[1.8vw] h-[1.4vw] rounded-[0.3vw] border border-gray-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20" }}
                title="Change floor color"
              />
              <span className="text-[0.68vw] font-mono text-gray-600 uppercase">
                {materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20"}
              </span>
              {isColorPickerOpen && (
                <div className="absolute right-0 bottom-full mb-[0.4vw] z-[130] shadow-2xl rounded-xl">
                  <ColorPicker
                    color={materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20"}
                    onChange={(c) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorColor", c)}
                    onClose={() => setIsColorPickerOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-reflective solid/studio/cyclorama controls */}
      {!isReflective && currentFloorType !== "grid" && currentFloorType !== "shadow" && (
        <div className="flex flex-col gap-[0.4vw] p-[0.6vw] bg-[#fcfcfd] rounded-[0.5vw] border border-gray-100">
          <SliderRow
            label="Roughness"
            value={materialSettings?.floorRoughness ?? currentPreset.floorRoughness ?? 60}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorRoughness", v)}
          />
          <div className="flex items-center justify-between gap-[0.5vw] pt-[0.1vw]">
            <span className="text-[0.72vw] font-medium text-gray-700">Floor Color</span>
            <div className="flex items-center gap-[0.35vw] relative">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen((prev) => !prev)}
                className="w-[1.8vw] h-[1.4vw] rounded-[0.3vw] border border-gray-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20" }}
                title="Change floor color"
              />
              <span className="text-[0.68vw] font-mono text-gray-600 uppercase">
                {materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20"}
              </span>
              {isColorPickerOpen && (
                <div className="absolute right-0 bottom-full mb-[0.4vw] z-[130] shadow-2xl rounded-xl">
                  <ColorPicker
                    color={materialSettings?.floorColor || currentPreset.floorColor || "#1a1a20"}
                    onChange={(c) => onUpdateMaterialSetting && onUpdateMaterialSetting("floorColor", c)}
                    onClose={() => setIsColorPickerOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL 15 PRESETS MODAL / POPUP ─── */}
      {showAllModal && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/65 backdrop-blur-xs flex items-center justify-center p-[2vw] animate-in fade-in duration-150">
          <div className="bg-white rounded-[1.1vw] shadow-2xl border border-gray-200 w-[44vw] max-w-[660px] h-[78vh] max-h-[720px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-[1.2vw] py-[0.9vw] border-b border-gray-100 bg-gray-50/70 shrink-0">
              <div className="flex items-center gap-[0.5vw]">
                <Icon icon="solar:widget-bold" className="w-[1.2vw] h-[1.2vw] text-[#ea543a]" />
                <h3 className="text-[0.95vw] font-bold text-gray-900">Floor & Ground Presets</h3>
                <span className="text-[0.68vw] font-semibold bg-[#ea543a]/10 text-[#ea543a] px-[0.5vw] py-[0.1vw] rounded-full">
                  15 Styles
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="w-[1.8vw] h-[1.8vw] rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" className="w-[1.2vw] h-[1.2vw]" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-[0.35vw] px-[1.2vw] py-[0.6vw] border-b border-gray-100 overflow-x-auto custom-scrollbar bg-white shrink-0">
              {FLOOR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-[0.65vw] py-[0.25vw] rounded-[0.4vw] text-[0.7vw] font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                      ? "bg-[#ea543a] text-white shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-[1.2vw] grid grid-cols-3 gap-[0.8vw] custom-scrollbar bg-[#fcfcfd]">
              {filteredPresets.map((preset) => {
                const active = currentPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      handleSelectPreset(preset);
                      setShowAllModal(false);
                    }}
                    className={`flex flex-col text-left p-[0.75vw] rounded-[0.7vw] border transition-all cursor-pointer group ${active
                        ? "bg-[#ea543a]/5 border-[#ea543a] ring-2 ring-[#ea543a]/20 shadow-sm"
                        : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-2xs hover:scale-[1.02]"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-[0.4vw]">
                      <div className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-gray-100 group-hover:bg-[#ea543a]/10 flex items-center justify-center transition-colors">
                        <Icon
                          icon={preset.icon}
                          className={`w-[1.1vw] h-[1.1vw] ${active ? "text-[#ea543a]" : "text-gray-700 group-hover:text-[#ea543a]"}`}
                        />
                      </div>
                      <span className="text-[0.58vw] font-semibold text-gray-600 bg-gray-50 px-[0.35vw] py-[0.1vw] rounded">
                        {preset.category}
                      </span>
                    </div>
                    <span className="text-[0.78vw] font-bold text-gray-900 leading-tight">
                      {preset.name}
                    </span>
                    <p className="text-[0.62vw] text-gray-700 leading-snug mt-[0.2vw] line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-[1.2vw] py-[0.7vw] border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-[1.2vw] py-[0.4vw] rounded-[0.45vw] bg-gray-900 hover:bg-gray-800 text-white text-[0.76vw] font-bold cursor-pointer transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
