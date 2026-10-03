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

import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import MaterialList from "./MaterialList";
import Customized from "./Customized";
import CameraSnapshotSection from "./Components/CameraSnapshotSection";
import { resolveUploadsPath } from "../../utils/supabaseUtils";

export default function RightPanel({
  onFileProcess,
  hasModel,
  onExport,
  onCaptureSnapshot,
  autoRotate,
  setAutoRotate,
  xrayMode,
  setXrayMode,
  xrayMaterials,
  onToggleXray,
  isLoading,
  materialSettings,
  onUpdateMaterialSetting,
  activeAccordion,
  setActiveAccordion,
  transformValues,
  onManualTransformChange,
  onResetTransform,
  onResetFactorSettings,
  onUvUnwrap,
  onMapUpload,
  selectedTextureId,
  onSelectTexture,
  savedHdrs = [],
  onDeleteHdr,
  hasAnimations,
  isAnimationPlaying,
  onToggleAnimation,
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick,
  onAddHotspot,
  onEditHotspot,
  onDeleteHotspot,
  selectedMaterial,
  onSelectMaterial,
  materialList = [],
  hiddenMaterials = new Set(),
  onToggleVisibility,
  onDeleteMaterial,
  onDeleteModel,
  onRenameMaterial,
  modelName = "Model",
  activeLeftTab = "textures",
  onAddClick,
  onGalleryClick,
  onClearModel,
  modelStats
}) {
  const [activeRightTab, setActiveRightTab] = useState("tool"); // 'tool' | 'layers'
  const [isPartMenuOpen, setIsPartMenuOpen] = useState(false);
  const [selectedMapType, setSelectedMapType] = useState("normalMap");
  const [isUniformScale, setIsUniformScale] = useState(true);
  const fileInputRef = useRef(null);
  const mapInputRef = useRef(null);
  const partMenuRef = useRef(null);

  // Close part dropdown on click outside
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

  // Determine Tab 1 Label based on active Left Sidebar Tab
  const getToolTabLabel = () => {
    switch (activeLeftTab) {
      case "textures":
        return "Textures";
      case "materials":
      case "model":
        return "Properties";
      case "lighting":
        return "Lighting";
      case "camera":
        return "Camera";
      case "animation":
        return "Animation";
      case "hotspots":
        return "Hotspots";
      default:
        return "Properties";
    }
  };

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

  const radToDeg = (rad) => {
    const r = Number(rad) || 0;
    return Math.round((r * (180 / Math.PI)) * 10) / 10;
  };

  const handleScaleChange = (axis, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return;
    if (isUniformScale) {
      onManualTransformChange && onManualTransformChange("scale", "all", num);
    } else {
      onManualTransformChange && onManualTransformChange("scale", axis, num);
    }
  };

  // Safe selected material display name
  const currentPartName = (() => {
    if (!selectedMaterial) return "All Meshes / Model";
    return getItemDisplayName(selectedMaterial);
  })();

  // Current active map image
  const activeMapUrl = (() => {
    const maps = materialSettings?.maps || {};
    const url = maps[selectedMapType];
    if (!url) return null;
    return resolveUploadsPath(url);
  })();

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none font-sans">
      {/* ─── TOP TABS (matching Image 1 & 2) ─── */}
      <div className="flex border-b border-gray-200 bg-white shrink-0 px-[1vw]">
        <button
          onClick={() => setActiveRightTab("tool")}
          className={`flex-1 py-[0.75vw] text-center font-bold text-[0.82vw] relative transition-colors cursor-pointer ${activeRightTab === "tool" ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-700"
            }`}
        >
          {getToolTabLabel()}
          {activeRightTab === "tool" && (
            <span className="absolute bottom-0 left-[15%] right-[15%] h-[0.16vw] bg-[#ea543a] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveRightTab("layers")}
          className={`flex-1 py-[0.75vw] text-center font-bold text-[0.82vw] relative transition-colors cursor-pointer ${activeRightTab === "layers" ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-700"
            }`}
        >
          Layers
          {activeRightTab === "layers" && (
            <span className="absolute bottom-0 left-[15%] right-[15%] h-[0.16vw] bg-[#ea543a] rounded-full" />
          )}
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
        {/* TAB 2: LAYERS (Image 3) */}
        {activeRightTab === "layers" ? (
          <div className="h-full flex flex-col bg-white">
            <MaterialList
              variant="panel"
              materials={materialList}
              selectedMaterial={selectedMaterial}
              hiddenMaterials={hiddenMaterials}
              xrayMaterials={xrayMaterials}
              onSelect={onSelectMaterial}
              onToggleVisibility={onToggleVisibility}
              onToggleXray={onToggleXray}
              onDeleteMaterial={onDeleteMaterial}
              onDeleteModel={onDeleteModel}
              onRenameMaterial={onRenameMaterial}
              modelName={modelName}
            />
          </div>
        ) : (
          /* TAB 1: TOOL CONTROLS */
          <div className="flex flex-col gap-[1vw]">
            {/* ─── X-Ray View Toggle Bar (Persistent across all tool views) ─── */}
            {(() => {
              const isSpecificSelection = Boolean(
                selectedMaterial &&
                selectedMaterial.name &&
                selectedMaterial.name !== "Scene" &&
                selectedMaterial.name !== "Model" &&
                selectedMaterial.name !== "All Meshes / Model"
              );

              let isSelectedInXray = false;
              if (xrayMode) {
                isSelectedInXray = true;
              } else if (isSpecificSelection && xrayMaterials && xrayMaterials.size > 0) {
                const selUuid = selectedMaterial.meshUuid || selectedMaterial.uuid;
                const selName = selectedMaterial.meshName || selectedMaterial.name;
                isSelectedInXray = Boolean(
                  (selUuid && xrayMaterials.has(selUuid)) ||
                  (selName && xrayMaterials.has(selName)) ||
                  (Array.isArray(selectedMaterial.uuids) && selectedMaterial.uuids.some(u => xrayMaterials.has(u))) ||
                  (Array.isArray(selectedMaterial.meshNames) && selectedMaterial.meshNames.some(n => xrayMaterials.has(n)))
                );
              }

              const isSwitchActive = isSpecificSelection ? isSelectedInXray : (xrayMode || (xrayMaterials && xrayMaterials.size > 0));

              const handleSwitchClick = () => {
                if (isSpecificSelection && onToggleXray) {
                  onToggleXray(selectedMaterial, isSelectedInXray);
                } else if (setXrayMode) {
                  setXrayMode(!xrayMode);
                }
              };

              return (
                <div className="flex flex-col border-b border-gray-100 pb-[0.8vw] bg-white">
                  <div className="py-[0.35vw] bg-white flex items-center justify-between select-none">
                    <div className="flex items-center gap-[0.5vw]">
                      <div className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${isSwitchActive ? "bg-[#00BFFF]/15 text-[#00BFFF]" : "bg-gray-100 text-gray-400"
                        }`}>
                        <Icon icon="solar:scanner-bold-duotone" width="1vw" height="1vw" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.75vw] font-bold text-gray-800 leading-tight">
                          {isSpecificSelection ? "X-Ray View (Selected)" : "X-Ray View"}
                        </span>
                        <span className="text-[0.58vw] text-gray-400 leading-tight">
                          {isSpecificSelection ? "Translucent inspection for part" : "Translucent 3D inspection"}
                        </span>
                      </div>
                    </div>
                    <div
                      onClick={handleSwitchClick}
                      className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.15vw] cursor-pointer transition-all duration-300 ${isSwitchActive ? "bg-[#00BFFF] shadow-sm shadow-[#00BFFF]/30" : "bg-gray-200"
                        }`}
                    >
                      <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${isSwitchActive ? "translate-x-[1.1vw]" : "translate-x-0"}`} />
                    </div>
                  </div>

                  {/* Active X-Ray Properties Card */}
                  {isSwitchActive && (
                    <div className="px-[0.8vw] py-[0.5vw] bg-sky-50/80 border-t border-sky-100 flex flex-col gap-[0.3vw] animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.58vw] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-[0.25vw]">
                          <span className="w-[0.35vw] h-[0.35vw] rounded-full bg-[#00BFFF] animate-pulse" />
                          Fresnel Rim Glow
                        </span>
                        <span className="text-[0.5vw] text-sky-700 font-bold bg-sky-100 px-[0.35vw] py-[0.06vw] rounded-full border border-sky-200">
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-[0.25vw] text-[0.55vw]">
                        <div className="flex items-center gap-[0.2vw] bg-white px-[0.3vw] py-[0.18vw] rounded border border-sky-100">
                          <span className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#00BFFF] shrink-0" />
                          <span className="text-gray-700 font-semibold truncate">#00BFFF</span>
                        </div>
                        <div className="flex items-center justify-center bg-white px-[0.3vw] py-[0.18vw] rounded border border-sky-100 text-sky-800 font-semibold">
                          <span>Emis: 4.0</span>
                        </div>
                        <div className="flex items-center justify-center bg-white px-[0.3vw] py-[0.18vw] rounded border border-sky-100 text-sky-800 font-semibold">
                          <span>Alpha: 35%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ───── VIEW: TEXTURES (Image 1) ───── */}
            {activeLeftTab === "textures" && (
              <>
                {/* Selected Part Dropdown */}
                <div className="flex flex-col gap-[0.35vw]" ref={partMenuRef}>
                  <label className="text-[0.78vw] font-bold text-gray-800">Selected Part</label>
                  <div className="relative">
                    <button
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
                          onClick={() => {
                            onSelectMaterial && onSelectMaterial(null);
                            setIsPartMenuOpen(false);
                          }}
                          className={`w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer ${!selectedMaterial ? "font-bold text-[#ea543a]" : "text-gray-700"
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
                              onClick={() => {
                                onSelectMaterial && onSelectMaterial(item);
                                setIsPartMenuOpen(false);
                              }}
                              className={`w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer truncate ${isSel ? "font-bold text-[#ea543a]" : "text-gray-700"
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

                  {/* Straight Normal Map block (No card view) */}
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
                            onClick={() => setSelectedMapType(m)}
                            className={`px-[0.35vw] py-[0.1vw] rounded-[0.25vw] transition-colors cursor-pointer ${selectedMapType === m ? "bg-[#ea543a] text-white font-bold" : "text-gray-500 hover:bg-gray-100"
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
                            onClick={() => mapInputRef.current?.click()}
                            className="px-[0.6vw] py-[0.25vw] rounded-[0.35vw] border border-gray-200 text-[0.65vw] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
                          >
                            Replace Image
                          </button>
                          <button
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

                  {/* Sliders Block 1 (matching Image 1) */}
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

                {/* Section 2: Texture / Fine Tuning */}
                <div className="flex flex-col gap-[0.75vw] pt-[0.4vw] border-t border-gray-100">
                  <span className="text-[0.82vw] font-bold text-gray-900">Texture</span>
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
              </>
            )}

            {/* ───── VIEW: PROPERTIES / MATERIALS (Image 2) ───── */}
            {(activeLeftTab === "materials" || activeLeftTab === "model") && (
              <div className="flex flex-col gap-[1.2vw]">
                {/* Move Section */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.78vw] font-bold text-gray-800">Move</label>
                    <span className="text-[0.55vw] text-gray-400 font-medium">Drag label to scrub / arrows</span>
                  </div>
                  <div className="grid grid-cols-3 gap-[0.5vw]">
                    <AxisInput
                      axis="X"
                      value={transformValues?.position?.x ?? 0}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("position", "x", v)}
                      step={0.1}
                    />
                    <AxisInput
                      axis="Y"
                      value={transformValues?.position?.y ?? 0}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("position", "y", v)}
                      step={0.1}
                    />
                    <AxisInput
                      axis="Z"
                      value={transformValues?.position?.z ?? 0}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("position", "z", v)}
                      step={0.1}
                    />
                  </div>
                </div>

                {/* Rotate Section (Displayed in degrees, stored in radians) */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.78vw] font-bold text-gray-800">Rotate</label>
                    <span className="text-[0.55vw] text-gray-400 font-medium">Degrees (0° - 360°)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-[0.5vw]">
                    <AxisInput
                      axis="X"
                      value={radToDeg(transformValues?.rotation?.x)}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "x", v)}
                      step={1}
                    />
                    <AxisInput
                      axis="Y"
                      value={radToDeg(transformValues?.rotation?.y)}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "y", v)}
                      step={1}
                    />
                    <AxisInput
                      axis="Z"
                      value={radToDeg(transformValues?.rotation?.z)}
                      onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "z", v)}
                      step={1}
                    />
                  </div>
                </div>

                {/* Scale Section with Link Icon */}
                <div className="flex flex-col gap-[0.4vw]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[0.3vw]">
                      <label className="text-[0.78vw] font-bold text-gray-800">Scale</label>
                      <button
                        type="button"
                        onClick={() => setIsUniformScale(!isUniformScale)}
                        className={`p-[0.2vw] rounded transition-colors cursor-pointer ${isUniformScale ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-600"
                          }`}
                        title={isUniformScale ? "Uniform Scale (All axes linked)" : "Free Scale (Individual axes)"}
                      >
                        <Icon icon={isUniformScale ? "solar:link-bold" : "solar:link-broken-linear"} className="w-[0.9vw] h-[0.9vw]" />
                      </button>
                    </div>
                    <span className="text-[0.55vw] text-gray-400 font-medium">
                      {isUniformScale ? "All axes linked" : "Individual axes"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-[0.5vw]">
                    <AxisInput
                      axis="X"
                      value={transformValues?.scale?.x ?? 1}
                      onChange={(v) => handleScaleChange("x", v)}
                      step={0.05}
                      min={0.01}
                    />
                    <AxisInput
                      axis="Y"
                      value={transformValues?.scale?.y ?? 1}
                      onChange={(v) => handleScaleChange("y", v)}
                      step={0.05}
                      min={0.01}
                    />
                    <AxisInput
                      axis="Z"
                      value={transformValues?.scale?.z ?? 1}
                      onChange={(v) => handleScaleChange("z", v)}
                      step={0.05}
                      min={0.01}
                    />
                  </div>
                </div>

                {/* Base Color Picker */}
                <div className="flex items-center justify-between pt-[0.4vw] border-t border-gray-100">
                  <span className="text-[0.78vw] font-bold text-gray-800">Base Color</span>
                  <div className="flex items-center gap-[0.4vw]">
                    <input
                      type="color"
                      value={materialSettings?.color || "#ffffff"}
                      onChange={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value)}
                      onBlur={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value, false, true)}
                      className="w-[1.6vw] h-[1.6vw] rounded-[0.35vw] border border-gray-200 cursor-pointer"
                    />
                    <span className="text-[0.72vw] font-semibold text-gray-600">
                      {materialSettings?.color || "#ffffff"}
                    </span>
                  </div>
                </div>

                {/* Texture Placement Section (Scale, Rotation, Offset X/Y) */}
                <div className="flex flex-col gap-[0.6vw] pt-[0.4vw] border-t border-gray-100">
                  <span className="text-[0.78vw] font-bold text-gray-800">Texture Placement</span>
                  <div className="flex flex-col gap-[0.5vw]">
                    <SliderRow
                      label="Scale"
                      value={materialSettings?.scale ?? 100}
                      onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("scale", v)}
                    />
                    <SliderRow
                      label="Rotation"
                      value={Math.round((((materialSettings?.rotation ?? 0) + 180) / 360) * 100)}
                      onChange={(pct) => {
                        const deg = Math.round((pct / 100) * 360 - 180);
                        onUpdateMaterialSetting && onUpdateMaterialSetting("rotation", deg);
                      }}
                    />
                    <SliderRow
                      label="Offset X"
                      value={Math.round(((materialSettings?.offset?.x ?? 0) + 100) / 2)}
                      onChange={(pct) => {
                        const val = Math.round(pct * 2 - 100);
                        onUpdateMaterialSetting && onUpdateMaterialSetting("offset", { ...(materialSettings?.offset || { x: 0, y: 0 }), x: val });
                      }}
                    />
                    <SliderRow
                      label="Offset Y"
                      value={Math.round(((materialSettings?.offset?.y ?? 0) + 100) / 2)}
                      onChange={(pct) => {
                        const val = Math.round(pct * 2 - 100);
                        onUpdateMaterialSetting && onUpdateMaterialSetting("offset", { ...(materialSettings?.offset || { x: 0, y: 0 }), y: val });
                      }}
                    />
                  </div>
                </div>

                {/* Reset Transform Button */}
                <button
                  onClick={onResetTransform}
                  className="w-full py-[0.55vw] rounded-[0.5vw] border border-gray-200 hover:bg-gray-50 text-[0.75vw] font-semibold text-gray-700 transition-colors flex items-center justify-center gap-[0.4vw] cursor-pointer mt-[0.5vw]"
                >
                  <Icon icon="solar:restart-bold" className="w-[0.9vw] h-[0.9vw]" />
                  <span>Reset Position & Scale</span>
                </button>
              </div>
            )}

            {/* ───── VIEW: LIGHTNING ───── */}
            {activeLeftTab === "lighting" && (
              <div className="flex flex-col gap-[1vw]">
                <Customized
                  controls={materialSettings}
                  updateControl={onUpdateMaterialSetting}
                  activePanel="lighting"
                  setActivePanel={() => { }}
                  transformValues={transformValues}
                  onManualTransformChange={onManualTransformChange}
                  onResetTransform={onResetTransform}
                  onResetFactor={onResetFactorSettings}
                  onMapUpload={onMapUpload}
                  selectedTextureId={selectedTextureId}
                  onSelectTexture={onSelectTexture}
                  savedHdrs={savedHdrs}
                  onDeleteHdr={onDeleteHdr}
                  hasAnimations={hasAnimations}
                  isAnimationPlaying={isAnimationPlaying}
                  onToggleAnimation={onToggleAnimation}
                />
              </div>
            )}

            {/* ───── VIEW: CAMERA ───── */}
            {activeLeftTab === "camera" && (
              <div className="flex flex-col gap-[1vw]">
                <div className="flex items-center justify-between p-[0.7vw] bg-gray-50 rounded-[0.6vw] border border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-[0.78vw] font-bold text-gray-800">Auto Rotate Camera</span>
                    <span className="text-[0.62vw] text-gray-500">Smooth 360-degree rotation</span>
                  </div>
                  <button
                    onClick={() => setAutoRotate && setAutoRotate(!autoRotate)}
                    className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.2vw] transition-colors cursor-pointer ${autoRotate ? "bg-[#ea543a]" : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`w-[0.9vw] h-[0.9vw] rounded-full bg-white transition-transform ${autoRotate ? "translate-x-[1.1vw]" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-[0.75vw]">
                  <SliderRow
                    label="FOV (Field of View)"
                    value={materialSettings?.fov ?? 45}
                    onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("fov", v)}
                  />
                </div>

                {/* Camera Snapshot & Multi-format Export with Card View & Custom Background */}
                <CameraSnapshotSection
                  onCaptureSnapshot={onCaptureSnapshot}
                  modelName={modelName}
                  disabled={!hasModel}
                />
              </div>
            )}

            {/* ───── VIEW: ANIMATION ───── */}
            {activeLeftTab === "animation" && (
              <div className="flex flex-col gap-[1vw]">
                <div className="flex items-center justify-between pb-[0.8vw] border-b border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[0.78vw] font-bold text-gray-800">Model Animation</span>
                    <span className="text-[0.62vw] text-gray-500">
                      {hasAnimations ? "Animation tracks detected" : "No animations in this model"}
                    </span>
                  </div>
                  <button
                    disabled={!hasAnimations}
                    onClick={() => onToggleAnimation && onToggleAnimation(!isAnimationPlaying)}
                    className={`px-[0.8vw] py-[0.4vw] rounded-[0.4vw] text-[0.75vw] font-bold text-white transition-colors flex items-center gap-[0.3vw] ${!hasAnimations
                        ? "bg-gray-300 cursor-not-allowed"
                        : isAnimationPlaying
                          ? "bg-amber-500 hover:bg-amber-600"
                          : "bg-[#ea543a] hover:bg-[#d9442a]"
                      }`}
                  >
                    <Icon icon={isAnimationPlaying ? "solar:pause-bold" : "solar:play-bold"} className="w-[0.9vw] h-[0.9vw]" />
                    <span>{isAnimationPlaying ? "Pause" : "Play"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ───── VIEW: HOTSPOTS ───── */}
            {activeLeftTab === "hotspots" && (
              <div className="flex flex-col gap-[0.8vw]">
                {/* Hotspot Header (Straight) */}
                <div className="flex items-center justify-between pb-[0.8vw] border-b border-gray-100">
                  <div className="flex items-center gap-[0.5vw]">
                    <div className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a]">
                      <Icon icon="solar:map-point-wave-bold-duotone" width="1vw" height="1vw" />
                    </div>
                    <div>
                      <div className="flex items-center gap-[0.3vw]">
                        <h4 className="text-[0.78vw] font-bold text-gray-900 leading-tight">Hotspots</h4>
                        {hotspots.length > 0 && (
                          <span className="text-[0.55vw] font-bold px-[0.35vw] py-[0.06vw] rounded-full bg-[#ea543a]/10 text-[#ea543a] border border-[#ea543a]/20">
                            {hotspots.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[0.55vw] text-gray-500 leading-tight">
                        Pin interactive points on 3D surface
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
                    className="flex items-center gap-[0.3vw] px-[0.7vw] py-[0.35vw] rounded-[0.45vw] bg-[#ea543a] hover:bg-[#d9442a] text-white text-[0.7vw] font-bold shadow-sm shadow-[#ea543a]/20 active:scale-95 transition-all cursor-pointer"
                    title="Click Add then click anywhere on model to place a pin"
                  >
                    <Icon icon="solar:add-circle-bold" width="0.85vw" height="0.85vw" />
                    <span>Add Pin</span>
                  </button>
                </div>

                {/* Hotspot items list */}
                <div className="space-y-[0.4vw]">
                  {hotspots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-[1.5vw] text-center bg-gray-50/60 rounded-[0.6vw] border border-dashed border-gray-200">
                      <Icon icon="solar:map-point-add-bold-duotone" width="1.6vw" height="1.6vw" className="text-gray-400 mb-[0.4vw]" />
                      <p className="text-[0.72vw] font-bold text-gray-700">No Hotspots Added</p>
                      <p className="text-[0.6vw] text-gray-400 max-w-[14vw] mb-[0.8vw]">
                        Click "Add Pin" and click anywhere on the 3D model to place a label.
                      </p>
                      <button
                        type="button"
                        onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
                        className="px-[0.8vw] py-[0.35vw] rounded-[0.4vw] bg-[#ea543a] text-white text-[0.7vw] font-bold shadow-sm"
                      >
                        Place First Hotspot
                      </button>
                    </div>
                  ) : (
                    hotspots.map((hs, i) => {
                      const hsId = hs.id || `hs_${i}`;
                      const isAct = activeHotspotId != null && (
                        String(activeHotspotId) === String(hs.id) ||
                        String(activeHotspotId) === String(hsId) ||
                        activeHotspotId === i
                      );
                      return (
                        <div
                          key={hsId}
                          onClick={() => typeof onHotspotClick === 'function' && onHotspotClick(hs)}
                          className={`flex items-center gap-[0.5vw] p-[0.6vw] rounded-[0.55vw] border cursor-pointer transition-all ${isAct
                              ? "bg-[#ea543a]/10 border-[#ea543a] shadow-xs"
                              : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                        >
                          <div
                            className={`w-[1.4vw] h-[1.4vw] rounded-full flex items-center justify-center text-[0.62vw] font-bold shrink-0 ${isAct ? "bg-[#ea543a] text-white" : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {i + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[0.72vw] font-bold truncate text-gray-900 leading-tight">
                              {hs.label || `Hotspot ${i + 1}`}
                            </p>
                            <p className="text-[0.55vw] text-gray-400 truncate leading-tight mt-[0.05vw]">
                              Mesh: <span className="text-gray-600 font-medium">{hs.meshName || "Surface"}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-[0.2vw] shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => typeof onEditHotspot === 'function' && onEditHotspot(hs)}
                              className="p-[0.25vw] rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                              title="Edit Label"
                            >
                              <Icon icon="solar:pen-bold" width="0.75vw" height="0.75vw" />
                            </button>
                            <button
                              type="button"
                              onClick={() => typeof onDeleteHotspot === 'function' && onDeleteHotspot(hs.id || hsId)}
                              className="p-[0.25vw] rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" width="0.75vw" height="0.75vw" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.3vw;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}

// ─── HELPER COMPONENTS ───

function SliderRow({ label, value = 50, onChange }) {
  const numVal = Math.round(Number(value) || 0);

  return (
    <div className="flex items-center justify-between gap-[0.6vw]">
      <div className="flex items-center gap-[0.2vw] w-[5.5vw] shrink-0">
        <span className="text-[0.75vw] font-semibold text-gray-700">{label}</span>
        <Icon icon="heroicons:chevron-down-20-solid" className="w-[0.7vw] h-[0.7vw] text-gray-400" />
      </div>

      <div className="flex-1 relative flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={numVal}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          className="w-full h-[0.25vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
        />
      </div>

      <span className="text-[0.72vw] font-bold text-gray-700 w-[2vw] text-right shrink-0">
        {numVal}%
      </span>
    </div>
  );
}

function AxisInput({ axis, value = 0, onChange, step = 0.1, min, max }) {
  const [isFocused, setIsFocused] = useState(false);
  const [textVal, setTextVal] = useState(() => {
    const num = Number(value) || 0;
    return String(Math.round(num * 100) / 100);
  });

  // Sync external changes when not actively typing
  useEffect(() => {
    if (!isFocused) {
      const num = Number(value) || 0;
      setTextVal(String(Math.round(num * 100) / 100));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const val = e.target.value;
    setTextVal(val);
    if (val === "" || val === "-" || val === "." || val === "-.") return;
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && isFinite(parsed)) {
      onChange && onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(textVal);
    if (isNaN(parsed) || !isFinite(parsed)) {
      parsed = Number(value) || 0;
    }
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    const formatted = String(Math.round(parsed * 100) / 100);
    setTextVal(formatted);
    onChange && onChange(parsed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(textVal) || 0;
      const inc = e.shiftKey ? (step * 10) : step;
      let nextVal = Math.round((current + inc) * 100) / 100;
      if (max !== undefined) nextVal = Math.min(max, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(textVal) || 0;
      const dec = e.shiftKey ? (step * 10) : step;
      let nextVal = Math.round((current - dec) * 100) / 100;
      if (min !== undefined) nextVal = Math.max(min, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    }
  };

  // Mouse drag-scrub on axis label (X, Y, Z)
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartValRef = useRef(0);

  const handleLabelPointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartValRef.current = parseFloat(textVal) || Number(value) || 0;

    const onPointerMove = (ev) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartXRef.current;
      const multiplier = ev.shiftKey ? 0.02 : 0.05;
      const change = dx * multiplier * (step || 0.1);
      let nextVal = Math.round((dragStartValRef.current + change) * 100) / 100;
      if (min !== undefined) nextVal = Math.max(min, nextVal);
      if (max !== undefined) nextVal = Math.min(max, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div className={`flex items-center bg-gray-50 border rounded-[0.45vw] px-[0.4vw] py-[0.3vw] transition-colors ${isFocused ? "border-[#ea543a] ring-1 ring-[#ea543a]/20 bg-white" : "border-gray-200 hover:border-gray-300"
      }`}>
      <span
        onPointerDown={handleLabelPointerDown}
        title="Drag horizontally to scrub value"
        className="text-[0.7vw] font-bold text-gray-400 hover:text-[#ea543a] w-[1vw] text-center cursor-ew-resize select-none shrink-0"
      >
        {axis}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={textVal}
        onFocus={() => setIsFocused(true)}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-center text-[0.75vw] font-semibold text-gray-800 bg-transparent outline-none"
      />
    </div>
  );
}
