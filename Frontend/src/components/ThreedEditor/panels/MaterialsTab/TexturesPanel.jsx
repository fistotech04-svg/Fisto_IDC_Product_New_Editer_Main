import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { resolveUploadsPath } from "../../../../utils/supabaseUtils";
import { SliderRow } from "../common/PanelInputs";

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

export function TexturesPanel({
  selectedMaterial,
  onSelectMaterial,
  materialList = [],
  materialSettings,
  onUpdateMaterialSetting,
  onMapUpload
}) {
  const [isPartMenuOpen, setIsPartMenuOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedMapType, setSelectedMapType] = useState("normalMap");
  const mapInputRef = useRef(null);
  const partMenuRef = useRef(null);

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
        <div className="flex items-center justify-between">
          <label className="text-[0.78vw] font-bold text-gray-800">Selected Part</label>
          {selectedMaterial && (
            <button
              type="button"
              onClick={() => onSelectMaterial && onSelectMaterial(null)}
              className="text-[0.68vw] font-semibold text-[#ea543a] hover:underline cursor-pointer flex items-center gap-[0.2vw]"
              title="Select whole model"
            >
              <Icon icon="heroicons:arrow-path-20-solid" className="w-[0.75vw] h-[0.75vw]" />
              Select All
            </button>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPartMenuOpen(!isPartMenuOpen)}
            className={`w-full flex items-center justify-between px-[0.8vw] py-[0.55vw] bg-white border rounded-[0.5vw] text-[0.78vw] font-medium transition-all shadow-2xs cursor-pointer ${
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
