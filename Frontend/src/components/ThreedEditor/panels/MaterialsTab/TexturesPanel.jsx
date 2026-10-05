import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { resolveUploadsPath } from "../../../../utils/supabaseUtils";
import { SliderRow } from "../common/PanelInputs";

const getItemDisplayName = (item) => {
  if (!item) return "Part";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if (typeof item.name === "string" && item.name.trim()) return item.name.trim();
    if (typeof item.meshName === "string" && item.meshName.trim()) return item.meshName.trim();
    if (typeof item.group === "string" && item.group.trim()) return item.group.trim();
    if (typeof item.material === "string" && item.material.trim()) return item.material.trim();
    if (typeof item.id === "string" && item.id.trim()) return item.id.trim();
  }
  return "Part";
};

export function TexturesPanel({
  selectedMaterial,
  onSelectMaterial,
  materialList = [],
  materialSettings,
  onUpdateMaterialSetting,
  onMapUpload
}) {
  const [isPartMenuOpen, setIsPartMenuOpen] = useState(false);
  const [selectedMapType, setSelectedMapType] = useState("normalMap");
  const mapInputRef = useRef(null);
  const partMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (partMenuRef.current && !partMenuRef.current.contains(e.target)) {
        setIsPartMenuOpen(false);
      }
    };
    if (isPartMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPartMenuOpen]);

  const handleMapFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onMapUpload) {
      onMapUpload(selectedMapType, file);
    }
    e.target.value = null;
  };

  const handleClearMap = (mapType) => {
    if (onUpdateMaterialSetting) {
      const nextMaps = { ...(materialSettings?.maps || {}) };
      delete nextMaps[mapType];
      onUpdateMaterialSetting("maps", nextMaps);
    }
  };

  const currentPartName = (() => {
    if (!selectedMaterial) return "All Meshes / Model";
    return getItemDisplayName(selectedMaterial);
  })();

  const activeMapUrl = (() => {
    const maps = materialSettings?.maps || {};
    const url = maps[selectedMapType];
    if (!url) return null;
    return resolveUploadsPath(url);
  })();

  return (
    <>
      {/* Selected Part Dropdown */}
      <div className="flex flex-col gap-[0.35vw]" ref={partMenuRef}>
        <label className="text-[0.78vw] font-bold text-gray-800">Selected Part</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPartMenuOpen(!isPartMenuOpen)}
            className="w-full flex items-center justify-between px-[0.8vw] py-[0.55vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] font-medium text-gray-800 hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="truncate">{currentPartName}</span>
            <Icon
              icon="heroicons:chevron-down-20-solid"
              className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform ${isPartMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isPartMenuOpen && (
            <div className="absolute top-full left-0 mt-[0.3vw] w-full max-h-[14vw] overflow-y-auto bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-50 py-[0.2vw] custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  onSelectMaterial && onSelectMaterial(null);
                  setIsPartMenuOpen(false);
                }}
                className={`w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer ${
                  !selectedMaterial ? "font-bold text-[#ea543a]" : "text-gray-700"
                }`}
              >
                All Meshes / Model
              </button>
              {materialList.map((item, idx) => {
                const itemName = getItemDisplayName(item);
                const isSel = selectedMaterial && (
                  selectedMaterial === item ||
                  selectedMaterial.name === itemName ||
                  selectedMaterial.group === itemName ||
                  (typeof selectedMaterial === "string" && selectedMaterial === itemName) ||
                  (item.id && selectedMaterial.id === item.id) ||
                  (item.uuid && selectedMaterial.uuid === item.uuid) ||
                  (item.meshUuid && selectedMaterial.meshUuid === item.meshUuid)
                );
                return (
                  <button
                    key={item.id || item.uuid || idx}
                    type="button"
                    onClick={() => {
                      onSelectMaterial && onSelectMaterial(item);
                      setIsPartMenuOpen(false);
                    }}
                    className={`w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer truncate ${
                      isSel ? "font-bold text-[#ea543a]" : "text-gray-700"
                    }`}
                  >
                    {itemName}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Texture Map Card */}
      <div className="flex flex-col gap-[0.6vw]">
        <div className="flex items-center justify-between">
          <span className="text-[0.82vw] font-bold text-gray-900">Texture</span>
        </div>

        {/* Straight Normal Map block */}
        <div className="border-b border-gray-100 pb-[0.8vw] bg-white flex flex-col gap-[0.6vw]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.4vw]">
              <span className="text-[0.78vw] font-bold text-gray-800 capitalize">
                {selectedMapType === "normalMap" ? "Normal" : selectedMapType.replace("Map", "")}
              </span>
              <Icon icon="heroicons:chevron-up-20-solid" className="w-[0.8vw] h-[0.8vw] text-gray-400" />
            </div>

            {/* Map selector pills */}
            <div className="flex items-center gap-[0.2vw] text-[0.6vw]">
              {["normalMap", "map", "roughnessMap", "metalnessMap", "bumpMap"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMapType(m)}
                  className={`px-[0.35vw] py-[0.1vw] rounded-[0.25vw] transition-colors cursor-pointer ${
                    selectedMapType === m ? "bg-[#ea543a] text-white font-bold" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {m === "normalMap" ? "Norm" : m === "map" ? "Color" : m === "roughnessMap" ? "Rough" : m === "metalnessMap" ? "Metal" : "Bump"}
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview and Buttons */}
          <div className="flex items-center gap-[0.75vw]">
            <div className="w-[3.2vw] h-[3.2vw] rounded-[0.45vw] bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {activeMapUrl ? (
                <img src={activeMapUrl} alt="Map" className="w-full h-full object-cover" />
              ) : selectedMapType === "normalMap" ? (
                <div className="w-full h-full bg-[#8080ff] flex items-center justify-center text-white/50 text-[0.55vw] font-bold">
                  Normal
                </div>
              ) : (
                <Icon icon="solar:gallery-linear" className="w-[1.2vw] h-[1.2vw] text-gray-300" />
              )}
            </div>

            <div className="flex flex-col gap-[0.3vw] flex-1 min-w-0">
              <span className="text-[0.72vw] font-medium text-gray-700 truncate">
                {activeMapUrl ? "Image Map Loaded" : "Default Shader Map"}
              </span>
              <div className="flex items-center gap-[0.4vw]">
                <button
                  type="button"
                  onClick={() => mapInputRef.current?.click()}
                  className="px-[0.6vw] py-[0.25vw] rounded-[0.35vw] border border-gray-200 text-[0.65vw] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  Replace Image
                </button>
                <button
                  type="button"
                  onClick={() => handleClearMap(selectedMapType)}
                  className="w-[1.4vw] h-[1.4vw] rounded-[0.35vw] border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove Map"
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="w-[0.8vw] h-[0.8vw]" />
                </button>
              </div>
            </div>
          </div>

          <input
            ref={mapInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMapFileChange}
          />
        </div>

        {/* Sliders Block */}
        <div className="flex flex-col gap-[0.75vw] pt-[0.4vw]">
          <SliderRow
            label="Metalic"
            value={materialSettings?.metallic ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("metallic", v)}
          />
          <SliderRow
            label="Roughness"
            value={materialSettings?.roughness ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("roughness", v)}
          />
          <SliderRow
            label="Bump"
            value={materialSettings?.bump ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("bump", v)}
          />
          <SliderRow
            label="A/O"
            value={materialSettings?.ao ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("ao", v)}
          />
          <SliderRow
            label="Opacity"
            value={materialSettings?.alpha ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("alpha", v)}
          />
        </div>
      </div>
    </>
  );
}

export default TexturesPanel;
