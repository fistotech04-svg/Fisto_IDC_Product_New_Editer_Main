import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { resolveUploadsPath } from "../../../../utils/supabaseUtils";
import { textureData } from "../../../../data/textureData";
import ColorPicker from "../../ColorPicker";
import { AxisInput, SliderRow, DualAxisInput, ToggleSwitch } from "../common/PanelInputs";
import FloorPresetSelector from "../../Components/FloorPresetSelector";

export function ModelPanel({
  // Position & View transforms
  autoRotate,
  setAutoRotate,
  autoRotateSpeed = 1.0,
  setAutoRotateSpeed,
  autoRotateAxis = "X",
  setAutoRotateAxis,
  autoRotateRange = 360,
  setAutoRotateRange,
  showGridLines = true,
  setShowGridLines,
  showAxis = true,
  setShowAxis,
  transformValues,
  onManualTransformChange,
  onResetTransform,
  // Material & Texture settings
  materialSettings,
  onUpdateMaterialSetting,
  selectedTextureId,
  onOpenMaterialDrawer,
  selectedMaterial,
  onMapUpload
}) {
  const [isUniformScale, setIsUniformScale] = useState(true);
  const [colorMode, setColorMode] = useState("HEX");
  const [isColorModeOpen, setIsColorModeOpen] = useState(false);
  const [isTileLinked, setIsTileLinked] = useState(true);
  const [isOffsetLinked, setIsOffsetLinked] = useState(true);
  const [isScaleLinked, setIsScaleLinked] = useState(true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerContainerRef = useRef(null);
  const [isFloorColorPickerOpen, setIsFloorColorPickerOpen] = useState(false);
  const floorColorPickerRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (colorPickerContainerRef.current && !colorPickerContainerRef.current.contains(e.target)) {
        setIsColorPickerOpen(false);
      }
      if (floorColorPickerRef.current && !floorColorPickerRef.current.contains(e.target)) {
        setIsFloorColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen || isFloorColorPickerOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isColorPickerOpen, isFloorColorPickerOpen]);

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

  // Resolve thumbnail / sphere preview
  const activeMaterialPreview = (() => {
    const rawMap = materialSettings?.maps?.map || materialSettings?.maps?.base;
    if (rawMap && rawMap !== "existing") {
      return resolveUploadsPath(rawMap);
    }
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

  const materialDisplayName =
    materialSettings?.materialName ||
    (typeof selectedMaterial === "string"
      ? selectedMaterial
      : selectedMaterial?.name || selectedMaterial?.material || "Sliver Material");

  // Check if current material contains an image/texture
  const hasImageTexture = Boolean(
    (materialSettings?.maps?.map && materialSettings.maps.map !== "existing") ||
    (materialSettings?.maps && (materialSettings.maps.base || materialSettings.maps.diffuse)) ||
    materialSettings?.appliedTexture?.map ||
    materialSettings?.appliedTexture?.preview ||
    activeMaterialPreview
  );

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onMapUpload) {
      onMapUpload("map", file);
    }
    e.target.value = "";
  };

  // Check if a specific material or mesh is selected (hide on initial model load, model selection, or folder group selection)
  const isMaterialSelected = Boolean(
    selectedMaterial &&
    typeof selectedMaterial === "object" &&
    !selectedMaterial.isModel &&
    !selectedMaterial.isGroup &&
    (selectedMaterial.isMesh === true || Boolean(selectedMaterial.meshUuid) || Boolean(selectedMaterial.uuid))
  );

  return (
    <div className="flex flex-col gap-[1.3vw]">
      {/* ── 1. POSITION SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center justify-between gap-[0.6vw]">
          <div className="flex items-center gap-[0.6vw] flex-1 min-w-0">
            <span className="text-[0.82vw] font-bold text-gray-900">Position</span>
            <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
          </div>
          <button
            type="button"
            onClick={() => onResetTransform && onResetTransform('all')}
            className="flex items-center gap-[0.2vw] px-[0.4vw] py-[0.15vw] rounded text-[0.68vw] font-semibold text-gray-500 hover:text-[#ea543a] hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
            title="Reset model position, rotation and scale to imported state"
          >
            <Icon icon="solar:restart-linear" className="w-[0.75vw] h-[0.75vw]" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Move */}
        <div className="flex items-center justify-between gap-[0.4vw]">
          <div className="flex items-center gap-[0.2vw] w-[3.8vw] shrink-0">
            <span className="text-[0.75vw] font-medium text-gray-800">Move</span>
            <button
              type="button"
              onClick={() => onResetTransform && onResetTransform('position')}
              className="p-[0.1vw] text-gray-400 hover:text-[#ea543a] transition-colors cursor-pointer rounded"
              title="Reset Position to imported state"
            >
              <Icon icon="solar:restart-linear" className="w-[0.7vw] h-[0.7vw]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-[0.3vw] flex-1 min-w-0">
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

        {/* Rotate */}
        <div className="flex items-center justify-between gap-[0.4vw]">
          <div className="flex items-center gap-[0.2vw] w-[3.8vw] shrink-0">
            <span className="text-[0.75vw] font-medium text-gray-800">Rotate</span>
            <button
              type="button"
              onClick={() => onResetTransform && onResetTransform('rotation')}
              className="p-[0.1vw] text-gray-400 hover:text-[#ea543a] transition-colors cursor-pointer rounded"
              title="Reset Rotate to imported state"
            >
              <Icon icon="solar:restart-linear" className="w-[0.7vw] h-[0.7vw]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-[0.3vw] flex-1 min-w-0">
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

        {/* Scale */}
        <div className="flex items-center justify-between gap-[0.4vw]">
          <div className="flex items-center gap-[0.2vw] w-[3.8vw] shrink-0">
            <span className="text-[0.75vw] font-medium text-gray-800">Scale</span>
            <button
              type="button"
              onClick={() => setIsUniformScale(!isUniformScale)}
              className={`p-[0.1vw] rounded transition-colors cursor-pointer ${
                isUniformScale ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-600"
              }`}
              title={isUniformScale ? "All axes linked" : "Individual axes"}
            >
              <Icon icon={isUniformScale ? "solar:link-bold" : "solar:link-broken-linear"} className="w-[0.8vw] h-[0.8vw]" />
            </button>
            <button
              type="button"
              onClick={() => onResetTransform && onResetTransform('scale')}
              className="p-[0.1vw] text-gray-400 hover:text-[#ea543a] transition-colors cursor-pointer rounded ml-[0.05vw]"
              title="Reset Scale to imported state"
            >
              <Icon icon="solar:restart-linear" className="w-[0.7vw] h-[0.7vw]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-[0.3vw] flex-1 min-w-0">
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
      </div>

      {/* ── 2. MATERIAL & 3. TEXTURE PLACEMENT SECTIONS (Only show when a model/mesh/material is selected) ── */}
      {isMaterialSelected && (
        <>
          {/* ── 2. MATERIAL SECTION ── */}
          <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Material</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Material Sphere / Thumbnail + Title + Change Material Button */}
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
              {materialDisplayName}
            </span>
            <div className="flex items-center gap-[0.4vw] flex-wrap">
              <button
                type="button"
                onClick={() => onOpenMaterialDrawer && onOpenMaterialDrawer()}
                className="w-fit px-[0.6vw] py-[0.25vw] bg-white hover:bg-gray-50 border border-gray-200 rounded-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
              >
                Change Material
              </button>

              {hasImageTexture && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-fit px-[0.6vw] py-[0.25vw] bg-white hover:bg-orange-50/50 border border-gray-200 hover:border-[#ea543a] rounded-[0.4vw] text-[0.7vw] font-semibold text-[#ea543a] transition-colors shadow-2xs cursor-pointer flex items-center gap-[0.25vw]"
                  title="Replace Image Texture"
                >
                  <Icon icon="solar:gallery-edit-linear" className="w-[0.85vw] h-[0.85vw] shrink-0" />
                  <span>Replace Image</span>
                </button>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
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

        {/* Base Color swatch + HEX input + Custom ColorPicker */}
        <div className="flex flex-col gap-[0.35vw] pt-[0.1vw] relative" ref={colorPickerContainerRef}>
          <span className="text-[0.75vw] font-medium text-gray-700">Base</span>
          <div className="flex items-center gap-[0.4vw]">
            <button
              type="button"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="w-[3.6vw] h-[1.7vw] rounded-[0.4vw] border border-gray-200 cursor-pointer shadow-2xs shrink-0 block relative overflow-hidden transition-transform active:scale-95 hover:border-gray-300"
              style={{ backgroundColor: materialSettings?.color || "#EC5137" }}
              title="Click to open Color Picker"
            />

            <div className="flex-1 flex items-center justify-between bg-white border border-gray-200 rounded-[0.4vw] px-[0.45vw] py-[0.2vw] focus-within:border-[#ea543a]">
              <input
                type="text"
                value={(materialSettings?.color || "#EC5137").toUpperCase()}
                onChange={(e) => onUpdateMaterialSetting && onUpdateMaterialSetting("color", e.target.value)}
                className="w-[4.5vw] text-[0.72vw] font-medium text-gray-800 bg-transparent outline-none uppercase"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(Number(materialSettings?.colorIntensity ?? materialSettings?.colorOpacity ?? 100))}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    onUpdateMaterialSetting && onUpdateMaterialSetting("colorIntensity", val);
                  }}
                  className="w-[2vw] text-right text-[0.68vw] text-gray-700 font-semibold bg-transparent outline-none p-0"
                />
                <span className="text-[0.68vw] text-gray-400 font-medium ml-[0.1vw]">%</span>
              </div>
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

          {/* Floating Custom ColorPicker Popover */}
          {isColorPickerOpen && (
            <div className="absolute left-0 top-full mt-[0.4vw] z-[120] shadow-2xl rounded-xl">
              <ColorPicker
                color={materialSettings?.color || "#EC5137"}
                onChange={(newColor) => {
                  onUpdateMaterialSetting && onUpdateMaterialSetting("color", newColor);
                }}
                opacity={Math.round(Number(materialSettings?.colorIntensity ?? materialSettings?.colorOpacity ?? 100))}
                onOpacityChange={(newOpacity) => {
                  onUpdateMaterialSetting && onUpdateMaterialSetting("colorIntensity", newOpacity);
                }}
                onClose={() => setIsColorPickerOpen(false)}
              />
            </div>
          )}
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
    </>
  )}

  {/* ── 4. VIEW SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">View</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Auto Rotate Toggle */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-medium text-gray-800">Auto Rotate</span>
          <ToggleSwitch
            checked={!!autoRotate}
            onChange={(val) => setAutoRotate && setAutoRotate(val)}
            title="Auto Rotate"
          />
        </div>

        {/* Rotate Speed */}
        <div className="flex flex-col gap-[0.2vw]">
          <div className="flex items-center justify-between">
            <span className="text-[0.72vw] font-medium text-gray-500">Rotate Speed</span>
            <span className="text-[0.68vw] font-semibold text-gray-700 bg-gray-100 px-[0.4vw] py-[0.1vw] rounded">
              {(autoRotateSpeed || 1.0).toFixed(1)}X
            </span>
          </div>
          <div className="relative flex items-center w-full">
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={autoRotateSpeed || 1.0}
              onChange={(e) => setAutoRotateSpeed && setAutoRotateSpeed(parseFloat(e.target.value))}
              className="w-full h-[0.25vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
            />
          </div>
        </div>

        <FloorPresetSelector materialSettings={materialSettings} onUpdateMaterialSetting={onUpdateMaterialSetting} />

        {/* Show Grid Lines */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-medium text-gray-800">Show Grid Lines</span>
          <ToggleSwitch
            checked={!!showGridLines}
            onChange={(val) => setShowGridLines && setShowGridLines(val)}
            title="Show Grid Lines"
          />
        </div>

        {/* Show Axis */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-medium text-gray-800">Show Axis Lines</span>
          <ToggleSwitch
            checked={!!showAxis}
            onChange={(val) => setShowAxis && setShowAxis(val)}
            title="Show Axis"
          />
        </div>
      </div>
    </div>
  );
}

export default ModelPanel;