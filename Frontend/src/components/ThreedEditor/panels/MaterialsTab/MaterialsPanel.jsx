import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { resolveUploadsPath } from "../../../../utils/supabaseUtils";
import { textureData } from "../../../../data/textureData";
import { SliderRow, DualAxisInput } from "../common/PanelInputs";

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

export function MaterialsPanel({
  selectedMaterial,
  onSelectMaterial,
  materialList = [],
  materialSettings,
  onUpdateMaterialSetting,
  selectedTextureId,
  onOpenMaterialDrawer
}) {
  const [isPartMenuOpen, setIsPartMenuOpen] = useState(false);
  const [colorMode, setColorMode] = useState("HEX");
  const [isColorModeOpen, setIsColorModeOpen] = useState(false);
  const [isTileLinked, setIsTileLinked] = useState(true);
  const [isOffsetLinked, setIsOffsetLinked] = useState(true);
  const [isScaleLinked, setIsScaleLinked] = useState(true);
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

  const currentPartName = (() => {
    if (!selectedMaterial) return "All Meshes / Model";
    return getItemDisplayName(selectedMaterial);
  })();

  const activeMaterialPreview = (() => {
    if (materialSettings?.appliedTexture?.preview) {
      return resolveUploadsPath(materialSettings.appliedTexture.preview);
    }
    if (materialSettings?.appliedTexture?.thumb) {
      return resolveUploadsPath(materialSettings.appliedTexture.thumb);
    }
    const texName = materialSettings?.materialName;
    if (texName && textureData) {
      const found = textureData.find(t => t.name?.toLowerCase() === texName.toLowerCase() || t.id?.toLowerCase() === texName.toLowerCase());
      if (found?.preview) {
        return resolveUploadsPath(found.preview);
      }
    }
    if (selectedTextureId && textureData) {
      const found = textureData.find(t => t.id === selectedTextureId);
      if (found?.preview) {
        return resolveUploadsPath(found.preview);
      }
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-[1.1vw]">
      {/* ── 1. SELECTED PART ── */}
      <div className="flex flex-col gap-[0.4vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Selected Part</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        <div className="relative" ref={partMenuRef}>
          <button
            type="button"
            onClick={() => setIsPartMenuOpen(!isPartMenuOpen)}
            className="w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.78vw] font-medium text-gray-800 hover:border-gray-300 transition-colors shadow-2xs cursor-pointer"
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
                const isSel =
                  selectedMaterial &&
                  (selectedMaterial === item ||
                    selectedMaterial.name === itemName ||
                    selectedMaterial.group === itemName ||
                    (typeof selectedMaterial === "string" && selectedMaterial === itemName) ||
                    (item.id && selectedMaterial.id === item.id) ||
                    (item.uuid && selectedMaterial.uuid === item.uuid) ||
                    (item.meshUuid && selectedMaterial.meshUuid === item.meshUuid));
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

      {/* ── 2. MATERIAL SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Material</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Material Thumbnail + Name + Change Material Button */}
        <div className="flex items-center gap-[0.75vw]">
          <button
            type="button"
            onClick={() => onOpenMaterialDrawer && onOpenMaterialDrawer()}
            className="w-[3.6vw] h-[3.6vw] rounded-[0.6vw] p-[0.2vw] bg-[#f3f4f6] border border-gray-200 flex items-center justify-center shadow-2xs hover:border-[#ea543a] hover:ring-2 hover:ring-[#ea543a]/20 hover:scale-105 transition-all duration-200 shrink-0 cursor-pointer overflow-hidden"
            title="Click to Change Material"
          >
            {activeMaterialPreview ? (
              <img
                src={activeMaterialPreview}
                alt="Material"
                className="w-full h-full object-cover rounded-full shadow-inner"
              />
            ) : (
              <div
                className="w-full h-full rounded-full shadow-inner"
                style={{
                  background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${materialSettings?.color || "#c0c0c0"} 45%, #1a1a1a 100%)`,
                  boxShadow: "inset -2px -4px 6px rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.15)"
                }}
              />
            )}
          </button>

          <div className="flex flex-col gap-[0.35vw] flex-1 min-w-0">
            <span className="text-[0.85vw] font-bold text-gray-800 truncate">
              {materialSettings?.materialName || (selectedMaterial ? getItemDisplayName(selectedMaterial) : 'Sliver Material')}
            </span>
            <button
              type="button"
              onClick={() => onOpenMaterialDrawer && onOpenMaterialDrawer()}
              className="w-fit px-[0.7vw] py-[0.25vw] bg-white hover:bg-gray-50 border border-gray-200 rounded-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
            >
              Change Material
            </button>
          </div>
        </div>

        {/* Alpha Factor */}
        <div className="flex items-center justify-between gap-[0.6vw] pt-[0.2vw]">
          <span className="text-[0.75vw] font-medium text-gray-700 w-[6vw] shrink-0">
            Alpha Factor :
          </span>
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(Number(materialSettings?.alpha ?? 100))}
              onChange={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("alpha", Number(e.target.value))}
              className="w-full h-[0.22vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
            />
          </div>
          <span className="text-[0.72vw] font-semibold text-gray-700 bg-gray-100 px-[0.45vw] py-[0.12vw] rounded min-w-[2.3vw] text-center">
            {Math.round(Number(materialSettings?.alpha ?? 100))}%
          </span>
        </div>

        {/* Base Color row */}
        <div className="flex items-center justify-between gap-[0.5vw]">
          <span className="text-[0.75vw] font-medium text-gray-700 w-[3.5vw] shrink-0">
            Base
          </span>
          
          <div className="flex-1 flex items-center gap-[0.4vw]">
            <label
              className="w-[3.6vw] h-[1.7vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-2xs shrink-0 block relative overflow-hidden"
              style={{ backgroundColor: materialSettings?.color || "#EC5137" }}
            >
              <input
                type="color"
                value={materialSettings?.color || "#EC5137"}
                onChange={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value)}
                onBlur={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value, false, true)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>

            <div className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-[0.4vw] px-[0.45vw] py-[0.2vw]">
              <input
                type="text"
                value={(materialSettings?.color || "#EC5137").toUpperCase()}
                onChange={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value)}
                className="w-[4.5vw] text-[0.72vw] font-medium text-gray-800 bg-transparent outline-none uppercase"
              />
              <span className="text-[0.68vw] text-gray-500 font-medium">100%</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorModeOpen(!isColorModeOpen)}
                className="flex items-center gap-[0.2vw] px-[0.5vw] py-[0.28vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.68vw] font-semibold text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>{colorMode}</span>
                <Icon icon="heroicons:chevron-down-20-solid" className="w-[0.7vw] h-[0.7vw] text-gray-400" />
              </button>
              {isColorModeOpen && (
                <div className="absolute right-0 top-full mt-[0.2vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 py-[0.2vw] min-w-[4vw]">
                  {["HEX", "RGB", "HSL"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setColorMode(m);
                        setIsColorModeOpen(false);
                      }}
                      className={`w-full text-left px-[0.5vw] py-[0.2vw] text-[0.68vw] hover:bg-gray-50 transition-colors cursor-pointer ${
                        colorMode === m ? "font-bold text-[#ea543a]" : "text-gray-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sliders: Normal, Metallic, Roughness, Bump, A/O */}
        <div className="flex flex-col gap-[0.7vw] pt-[0.2vw]">
          <SliderRow
            label="Normal"
            value={materialSettings?.normal ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("normal", v)}
          />
          <SliderRow
            label="Metallic"
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
        </div>
      </div>

      {/* ── 3. TEXTURE PLACEMENT SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Texture Placement</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        <div className="flex flex-col gap-[0.6vw]">
          {/* Tile */}
          <DualAxisInput
            label="Tile"
            xVal={materialSettings?.tile?.x ?? 210}
            yVal={materialSettings?.tile?.y ?? 210}
            isLinked={isTileLinked}
            onToggleLink={() => setIsTileLinked(!isTileLinked)}
            onChangeX={(v) => {
              const next = { ...(materialSettings?.tile || { x: 210, y: 210 }), x: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("tile", next);
            }}
            onChangeY={(v) => {
              const next = { ...(materialSettings?.tile || { x: 210, y: 210 }), y: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("tile", next);
            }}
          />

          {/* Offset */}
          <DualAxisInput
            label="Offset"
            xVal={materialSettings?.offset?.x ?? 210}
            yVal={materialSettings?.offset?.y ?? 210}
            isLinked={isOffsetLinked}
            onToggleLink={() => setIsOffsetLinked(!isOffsetLinked)}
            onChangeX={(v) => {
              const next = { ...(materialSettings?.offset || { x: 210, y: 210 }), x: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("offset", next);
            }}
            onChangeY={(v) => {
              const next = { ...(materialSettings?.offset || { x: 210, y: 210 }), y: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("offset", next);
            }}
          />

          {/* Scale */}
          <DualAxisInput
            label="Scale"
            xVal={materialSettings?.textureScale?.x ?? (typeof materialSettings?.scale === 'number' ? materialSettings.scale : 210)}
            yVal={materialSettings?.textureScale?.y ?? (typeof materialSettings?.scale === 'number' ? materialSettings.scale : 210)}
            isLinked={isScaleLinked}
            onToggleLink={() => setIsScaleLinked(!isScaleLinked)}
            onChangeX={(v) => {
              const next = { ...(materialSettings?.textureScale || { x: 210, y: 210 }), x: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("textureScale", next);
              onUpdateMaterialSetting && onUpdateMaterialSetting("scale", v);
            }}
            onChangeY={(v) => {
              const next = { ...(materialSettings?.textureScale || { x: 210, y: 210 }), y: v };
              onUpdateMaterialSetting && onUpdateMaterialSetting("textureScale", next);
            }}
          />

          {/* Rotate Slider */}
          <SliderRow
            label="Rotate"
            value={materialSettings?.rotation ?? 50}
            onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("rotation", v)}
          />
        </div>
      </div>
    </div>
  );
}

export default MaterialsPanel;
