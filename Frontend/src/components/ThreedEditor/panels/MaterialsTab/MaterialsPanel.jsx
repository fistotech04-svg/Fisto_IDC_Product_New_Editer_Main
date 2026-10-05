import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { resolveUploadsPath } from "../../../../utils/supabaseUtils";
import { textureData } from "../../../../data/textureData";
import ColorPicker from "../../ColorPicker";
import { SliderRow, DualAxisInput } from "../common/PanelInputs";

// Helper to extract all selectable parts and materials recursively
const extractSelectableItems = (rawList) => {
  if (!rawList || !Array.isArray(rawList)) return [];
  const items = [];
  const seenKeys = new Set();

  const addUnique = (it) => {
    if (!it) return;
    const key = it.uuid || it.meshUuid || it.id || (typeof it === "string" ? it : it.name || it.material);
    if (!key || seenKeys.has(key)) return;
    seenKeys.add(key);
    items.push(it);
  };

  const walkNode = (node, parentModelName = "") => {
    if (!node) return;
    if (typeof node === "string") {
      addUnique({
        id: node,
        name: node,
        material: node,
        isMesh: false,
        parentGroup: parentModelName
      });
      return;
    }

    if (node.isMesh || (!node.isGroup && (node.meshUuid || node.uuid))) {
      addUnique({
        id: node.id || node.uuid || node.meshUuid || node.name,
        uuid: node.uuid || node.meshUuid || node.id,
        meshUuid: node.meshUuid || node.uuid || node.id,
        name: node.name || node.meshName || node.material || "Mesh",
        meshName: node.meshName || node.name || "Mesh",
        material: node.material || node.name,
        materials: Array.isArray(node.materials) ? node.materials : (node.material ? [node.material] : []),
        isMesh: true,
        parentGroup: node.parentGroup || parentModelName
      });
    } else if (node.isGroup) {
      if (Array.isArray(node.children) && node.children.length > 0) {
        node.children.forEach(c => walkNode(c, node.name || parentModelName));
      } else {
        addUnique({
          id: node.id || node.uuid || node.name,
          uuid: node.uuid || node.id,
          name: node.name || "Group",
          isGroup: true,
          isMesh: false,
          materials: node.materials || [],
          parentGroup: parentModelName
        });
      }
    }

    if (Array.isArray(node.tree)) {
      node.tree.forEach(t => walkNode(t, node.group || node.name || parentModelName));
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(c => walkNode(c, node.name || parentModelName));
    }
    if (Array.isArray(node.materials)) {
      node.materials.forEach(m => {
        const mName = typeof m === "string" ? m : (m?.name || m?.material);
        if (mName) {
          addUnique({
            id: `mat_${mName}`,
            name: mName,
            material: mName,
            isMesh: false,
            parentGroup: parentModelName
          });
        }
      });
    }
  };

  rawList.forEach(item => walkNode(item, item.group || item.name || "Model"));
  return items;
};

const isItemActive = (item, selectedMaterial) => {
  if (!item && !selectedMaterial) return true;
  if (!item || !selectedMaterial) return false;

  if (typeof selectedMaterial === "string") {
    const itName = typeof item === "string" ? item : (item.name || item.material || item.id || "");
    return itName.toLowerCase() === selectedMaterial.toLowerCase();
  }

  if (typeof item === "string") {
    const selName = selectedMaterial.name || selectedMaterial.material || selectedMaterial.id || "";
    return item.toLowerCase() === selName.toLowerCase();
  }

  const itemUuid = item.uuid || item.meshUuid || item.id;
  const selUuid = selectedMaterial.uuid || selectedMaterial.meshUuid || selectedMaterial.id;
  if (itemUuid && selUuid && itemUuid === selUuid) return true;

  const itemName = item.name || item.meshName || item.material;
  const selName = selectedMaterial.name || selectedMaterial.meshName || selectedMaterial.material;
  if (itemName && selName && itemName.toLowerCase() === selName.toLowerCase()) return true;

  if (Array.isArray(selectedMaterial.items)) {
    return selectedMaterial.items.some(si => isItemActive(item, si));
  }
  if (Array.isArray(selectedMaterial.uuids) && itemUuid) {
    return selectedMaterial.uuids.includes(itemUuid);
  }

  return false;
};

const getItemDisplayName = (item) => {
  if (!item) return "All Meshes / Model";
  if (typeof item === "string") return item;
  return item.name || item.meshName || item.material || item.id || "Unnamed Part";
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
  const [searchFilter, setSearchFilter] = useState("");
  const [colorMode, setColorMode] = useState("HEX");
  const [isColorModeOpen, setIsColorModeOpen] = useState(false);
  const [isTileLinked, setIsTileLinked] = useState(true);
  const [isOffsetLinked, setIsOffsetLinked] = useState(true);
  const [isScaleLinked, setIsScaleLinked] = useState(true);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerContainerRef = useRef(null);
  const partMenuRef = useRef(null);

  useEffect(() => {
    const handleColorPickerOutside = (e) => {
      if (colorPickerContainerRef.current && !colorPickerContainerRef.current.contains(e.target)) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener("mousedown", handleColorPickerOutside);
    }
    return () => document.removeEventListener("mousedown", handleColorPickerOutside);
  }, [isColorPickerOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (partMenuRef.current && !partMenuRef.current.contains(e.target)) {
        setIsPartMenuOpen(false);
        setSearchFilter("");
      }
    };
    if (isPartMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPartMenuOpen]);

  const allParts = React.useMemo(() => {
    return extractSelectableItems(materialList);
  }, [materialList]);

  const filteredParts = React.useMemo(() => {
    if (!searchFilter.trim()) return allParts;
    const q = searchFilter.toLowerCase().trim();
    return allParts.filter(p => {
      const name = (p.name || p.meshName || p.material || "").toLowerCase();
      const group = (p.parentGroup || "").toLowerCase();
      const mat = (p.material || "").toLowerCase();
      return name.includes(q) || group.includes(q) || mat.includes(q);
    });
  }, [allParts, searchFilter]);

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
      {/* ── 1. SELECTED PART / MATERIAL ── */}
      <div className="flex flex-col gap-[0.4vw]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.6vw] flex-1">
            <span className="text-[0.82vw] font-bold text-gray-900">Selected Part</span>
            <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
          </div>
          {selectedMaterial && (
            <button
              type="button"
              onClick={() => onSelectMaterial && onSelectMaterial(null)}
              className="ml-[0.5vw] text-[0.68vw] font-semibold text-[#ea543a] hover:underline cursor-pointer flex items-center gap-[0.2vw]"
              title="Select whole model"
            >
              <Icon icon="heroicons:arrow-path-20-solid" className="w-[0.75vw] h-[0.75vw]" />
              Select All
            </button>
          )}
        </div>

        <div className="relative" ref={partMenuRef}>
          <button
            type="button"
            onClick={() => setIsPartMenuOpen(!isPartMenuOpen)}
            className={`w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] bg-white border rounded-[0.5vw] text-[0.78vw] font-medium transition-all shadow-2xs cursor-pointer ${
              isPartMenuOpen ? "border-[#ea543a] ring-2 ring-[#ea543a]/20" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-[0.4vw] min-w-0 flex-1">
              <Icon
                icon={!selectedMaterial ? "lucide:box" : "icon-park-outline:material-two"}
                className={`w-[0.9vw] h-[0.9vw] shrink-0 ${!selectedMaterial ? "text-gray-500" : "text-[#ea543a]"}`}
              />
              <span className={`truncate font-semibold ${!selectedMaterial ? "text-gray-800" : "text-[#ea543a]"}`}>
                {currentPartName}
              </span>
            </div>
            <Icon
              icon="heroicons:chevron-down-20-solid"
              className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform duration-200 shrink-0 ${
                isPartMenuOpen ? "rotate-180 text-[#ea543a]" : ""
              }`}
            />
          </button>

          {isPartMenuOpen && (
            <div className="absolute top-full left-0 mt-[0.3vw] w-full max-h-[16vw] overflow-hidden flex flex-col bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Search filter if there are several parts */}
              {allParts.length > 5 && (
                <div className="p-[0.4vw] border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-[0.3vw] px-[0.5vw] py-[0.25vw] bg-white border border-gray-200 rounded-[0.35vw]">
                    <Icon icon="heroicons:magnifying-glass-20-solid" className="w-[0.75vw] h-[0.75vw] text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search parts or materials..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full text-[0.72vw] bg-transparent outline-none text-gray-800 placeholder-gray-400"
                      autoFocus
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter("")}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Icon icon="heroicons:x-mark-20-solid" className="w-[0.7vw] h-[0.7vw]" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-y-auto flex-1 custom-scrollbar py-[0.2vw]">
                {/* 1. All Meshes / Model Option */}
                {!searchFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMaterial && onSelectMaterial(null);
                      setIsPartMenuOpen(false);
                      setSearchFilter("");
                    }}
                    className={`w-full flex items-center justify-between px-[0.8vw] py-[0.45vw] text-[0.75vw] transition-colors cursor-pointer border-b border-gray-100 ${
                      !selectedMaterial
                        ? "bg-[#ea543a]/10 text-[#ea543a] font-bold border-l-3 border-l-[#ea543a]"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-[0.45vw] min-w-0">
                      <Icon icon="lucide:box" className="w-[0.85vw] h-[0.85vw] text-gray-500 shrink-0" />
                      <span className="truncate">All Meshes / Model</span>
                    </div>
                    {!selectedMaterial && (
                      <Icon icon="heroicons:check-20-solid" className="w-[0.85vw] h-[0.85vw] text-[#ea543a] shrink-0 ml-[0.3vw]" />
                    )}
                  </button>
                )}

                {/* 2. List of All Extracted Parts / Materials */}
                {filteredParts.length > 0 ? (
                  filteredParts.map((item, idx) => {
                    const itemName = getItemDisplayName(item);
                    const isSel = isItemActive(item, selectedMaterial);
                    const subLabel = item.material && item.material !== itemName ? item.material : item.parentGroup;

                    return (
                      <button
                        key={item.uuid || item.meshUuid || item.id || idx}
                        type="button"
                        onClick={() => {
                          onSelectMaterial && onSelectMaterial(item);
                          setIsPartMenuOpen(false);
                          setSearchFilter("");
                        }}
                        className={`w-full flex items-center justify-between px-[0.8vw] py-[0.4vw] text-[0.75vw] transition-colors cursor-pointer ${
                          isSel
                            ? "bg-[#ea543a]/10 text-[#ea543a] font-bold border-l-3 border-l-[#ea543a]"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                        }`}
                      >
                        <div className="flex items-center gap-[0.45vw] min-w-0 flex-1">
                          <Icon
                            icon={item.isMesh ? "icon-park-outline:material-two" : "lucide:circle-dot"}
                            className={`w-[0.8vw] h-[0.8vw] shrink-0 ${isSel ? "text-[#ea543a]" : "text-gray-400"}`}
                          />
                          <span className="truncate">{itemName}</span>
                          {subLabel && subLabel !== itemName && (
                            <span className="text-[0.62vw] text-gray-400 font-normal truncate max-w-[5vw]">
                              ({subLabel})
                            </span>
                          )}
                        </div>

                        {isSel && (
                          <Icon icon="heroicons:check-20-solid" className="w-[0.85vw] h-[0.85vw] text-[#ea543a] shrink-0 ml-[0.3vw]" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-[0.8vw] py-[0.8vw] text-center text-gray-400 text-[0.72vw]">
                    No matching parts or materials found
                  </div>
                )}
              </div>
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
        <div className="flex flex-col gap-[0.35vw] relative" ref={colorPickerContainerRef}>
          <div className="flex items-center justify-between gap-[0.5vw]">
            <span className="text-[0.75vw] font-medium text-gray-700 w-[3.5vw] shrink-0">
              Base
            </span>
            
            <div className="flex-1 flex items-center gap-[0.4vw]">
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
    </div>
  );
}

export default MaterialsPanel;
