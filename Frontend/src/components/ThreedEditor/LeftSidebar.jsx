import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MaterialList from "./MaterialList";

export default function LeftSidebar({
  activeTab = "model",
  onSelectTab,
  modelName = "Electric motor",
  onRenameModel,
  fileSize = "18MB",
  models = [],
  activeModelId,
  onSelectModel,
  onAddModel,
  disableRename = false,
  onExport,
  hasModel = true,
  materialList = [],
  modelMaterialLists = {},
  selectedMaterial,
  onSelectMaterial,
  hiddenMaterials = new Set(),
  xrayMaterials = new Set(),
  onToggleVisibility,
  onToggleXray,
  onDeleteMaterial,
  onDeleteModel,
  onRenameMaterial,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(modelName);
  const [expandedModelIds, setExpandedModelIds] = useState({ default: true });

  const startEdit = () => {
    if (disableRename) return;
    setTempName(modelName);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (tempName.trim() && tempName !== modelName && onRenameModel) {
      onRenameModel(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setIsEditing(false);
  };

  const toggleModelExpand = (id, e) => {
    e.stopPropagation();
    setExpandedModelIds((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  // Determine model items to display
  const modelItems =
    models && models.length > 0
      ? models
      : [{ id: "model_1", name: modelName || "3D Model" }];

  // Helper to check if a specific model item is selected
  const isModelSelected = (item) => {
    if (!item) return false;
    if (activeTab !== "model") return false;

    // Check if selectedMaterial belongs to or matches this model
    if (selectedMaterial) {
      if (typeof selectedMaterial === "string") {
        if (selectedMaterial === item.name || selectedMaterial === item.id) return true;
      } else if (typeof selectedMaterial === "object") {
        if (selectedMaterial.id === item.id) return true;
        if (selectedMaterial.parentGroup && (selectedMaterial.parentGroup === item.name || selectedMaterial.parentGroup === item.id)) {
          return true;
        }
        if (selectedMaterial.name === item.name || selectedMaterial.group === item.name) {
          return true;
        }
      }
    }

    return activeModelId === item.id;
  };

  // Helper to get materials for a specific model
  const getModelMaterials = (item) => {
    if (!item) return [];
    if (Array.isArray(materialList) && materialList.length > 0) {
      const match = materialList.find(
        (m) => m.id === item.id || m.group === item.name || m.name === item.name
      );
      if (match) return [match];
    }
    if (modelMaterialLists && modelMaterialLists[item.id]) {
      return modelMaterialLists[item.id];
    }
    return materialList;
  };

  return (
    <aside className="w-[18vw] min-w-[240px] max-w-[300px] h-full bg-white flex flex-col p-[0.75vw] select-none shrink-0 border-r border-gray-200">
      {/* ── 1. TOP HEADER CARD (File Name + Size + Edit Pencil) ── */}
      <div className="bg-white border border-gray-200/80 rounded-[0.75vw] p-[0.7vw] shadow-2xs hover:shadow-xs transition-shadow mb-[0.8vw] relative flex items-center justify-between group shrink-0">
        <div className="flex items-center gap-[0.6vw] min-w-0 flex-1 pr-[1.2vw]">
          {/* Red/Orange File Icon */}
          <div className="w-[2.2vw] h-[2.2vw] rounded-[0.45vw] flex items-center justify-center shrink-0">
            <Icon
              icon="solar:document-text-outline"
              className="w-[1.8vw] h-[1.8vw] text-[#ea543a]"
            />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleKeyDown}
                className="w-full text-[0.82vw] font-bold text-gray-900 bg-gray-50 border border-[#ea543a] rounded px-[0.3vw] py-[0.1vw] outline-none"
              />
            ) : (
              <>
                <h3
                  onClick={startEdit}
                  title={modelName || "Electric motor"}
                  className="text-[0.82vw] font-bold text-gray-900 cursor-pointer hover:text-[#ea543a] transition-colors leading-tight truncate"
                >
                  {modelName || "Electric motor"}
                </h3>
                <span className="text-[0.65vw] text-gray-400 font-medium leading-tight mt-[0.2vw] block">
                  Total Size : {fileSize || "18MB"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Edit Pencil Icon (Bottom-Right of Card) */}
        <button
          type="button"
          onClick={startEdit}
          disabled={disableRename}
          className="absolute bottom-[0.55vw] right-[0.55vw] text-[#ea543a] hover:scale-110 active:scale-95 transition-transform cursor-pointer p-[0.1vw]"
          title="Rename Model"
        >
          <Icon icon="solar:pen-new-square-bold" className="w-[0.95vw] h-[0.95vw]" />
        </button>
      </div>

      <div className="h-[1px] bg-gray-100 mb-[0.7vw] w-full shrink-0"></div>

      {/* ── 2. SECTION: 3D MODELS + NESTED LAYERS ── */}
      <div className="flex flex-col min-h-0">
        {/* Main "3D Model" Tab Button */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("model")}
          className={`w-full flex items-center gap-[0.65vw] px-[0.85vw] py-[0.6vw] rounded-[0.55vw] text-left transition-all duration-200 cursor-pointer shrink-0 ${
            activeTab === "model"
              ? "bg-[#ea543a] text-white font-bold shadow-xs"
              : "text-gray-800 hover:bg-gray-100 font-semibold"
          }`}
        >
          <Icon icon="f7:cube" className="w-[1.15vw] h-[1.15vw] shrink-0" />
          <span className="text-[0.82vw]">3D Model</span>
        </button>

        {/* Scrollable Model + Layers Container - Nested inside 3D Model */}
        <div className="overflow-y-auto overflow-x-hidden max-h-[30vh] ml-[0.85vw] pl-[0.75vw] pr-[0.2vw] pt-[0.45vw] pb-[0.2vw] custom-left-scrollbar flex flex-col gap-[0.35vw]">
          {modelItems.map((item, idx) => {
            const isModelActive = isModelSelected(item);
            const displayName = item.name || `3D Model ${idx > 0 ? idx + 1 : ""}`;
            const isExpanded = expandedModelIds[item.id] ?? true;
            const itemMaterials = getModelMaterials(item);
            const isLast = idx === modelItems.length - 1;

            return (
              <div key={item.id || idx} className="flex flex-col gap-[0.2vw] relative">
                {/* Vertical branch line segment: full height if not last, stops at horizontal connector (0.85vw) if last */}
                <div
                  className={`absolute -left-[0.75vw] w-[2px] bg-[#ea543a]/30 pointer-events-none ${
                    idx === 0 ? "top-[-0.45vw]" : "top-[-0.35vw]"
                  } ${isLast ? "h-[calc(0.85vw+0.45vw)]" : "bottom-[-0.35vw]"}`}
                />

                {/* Horizontal branch connector indicator */}
                <div className="absolute -left-[0.75vw] top-[0.85vw] w-[0.6vw] h-[2px] bg-[#ea543a]/30 pointer-events-none rounded-r-full" />

                {/* Model Capsule / Header - Entire row click selects and toggles expand */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab && onSelectTab("model");
                    onSelectModel && onSelectModel(item.id, item);
                    setExpandedModelIds((prev) => ({
                      ...prev,
                      [item.id]: prev[item.id] === undefined ? false : !prev[item.id],
                    }));
                  }}
                  className={`w-full flex items-center justify-between px-[0.7vw] py-[0.48vw] rounded-[0.5vw] text-left transition-all duration-150 cursor-pointer ${
                    isModelActive
                      ? "bg-[#fdeee9] text-[#ea543a] font-semibold border border-[#ea543a]/35 shadow-2xs"
                      : "text-gray-700 hover:bg-gray-100/90 hover:text-gray-950 font-medium border border-gray-200/60 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-[0.55vw] min-w-0 flex-1">
                    <Icon
                      icon="f7:cube"
                      className={`w-[1vw] h-[1vw] shrink-0 ${
                        isModelActive ? "text-[#ea543a]" : "text-gray-500"
                      }`}
                    />
                    <span className="text-[0.78vw] truncate">{displayName}</span>
                  </div>

                  {/* Layers / Chevron Toggle Indicator */}
                  <div className="flex items-center gap-[0.3vw] shrink-0">
                    <div
                      className={`w-[1.2vw] h-[1.2vw] flex items-center justify-center rounded-[0.25vw] transition-transform ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    >
                      <Icon
                        icon="heroicons:chevron-down-20-solid"
                        className={`w-[0.9vw] h-[0.9vw] ${
                          isModelActive ? "text-[#ea543a]" : "text-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Nested Layers (MaterialList) inside this Model */}
                {isExpanded && (
                  <div className="pl-[0.35vw] pr-[0.1vw] py-[0.2vw] border-l-2 border-[#ea543a]/30 ml-[0.55vw] my-[0.1vw] bg-gray-50/50 rounded-r-[0.4vw]">
                    <MaterialList
                      variant="panel"
                      materials={itemMaterials}
                      selectedMaterial={selectedMaterial}
                      hiddenMaterials={hiddenMaterials}
                      xrayMaterials={xrayMaterials}
                      onSelect={onSelectMaterial}
                      onToggleVisibility={onToggleVisibility}
                      onToggleXray={onToggleXray}
                      onDeleteMaterial={onDeleteMaterial}
                      onDeleteModel={onDeleteModel}
                      onRenameMaterial={onRenameMaterial}
                      modelName={displayName}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* "+ Add Model" Button - Placed directly below/near 3D Model section (outside the tree) */}
        {modelItems.length < 5 ? (
          <button
            type="button"
            onClick={() => {
              if (onAddModel) {
                onAddModel();
              }
            }}
            className="w-full flex items-center gap-[0.65vw] px-[0.85vw] py-[0.5vw] rounded-[0.55vw] text-left text-gray-700 hover:bg-gray-100 hover:text-gray-950 font-medium transition-colors cursor-pointer group mt-[0.35vw] shrink-0"
          >
            <Icon
              icon="solar:add-circle-linear"
              className="w-[1.1vw] h-[1.1vw] text-gray-500 group-hover:text-[#ea543a] transition-colors shrink-0"
            />
            <span className="text-[0.82vw]">Add Model</span>
            <span className="ml-auto text-[0.65vw] text-gray-400 font-normal">
              ({modelItems.length}/5)
            </span>
          </button>
        ) : (
          <div className="text-[0.65vw] text-gray-400 px-[0.85vw] py-[0.3vw] italic">
            Max 5 models reached
          </div>
        )}
      </div>

      <div className="h-[1px] bg-gray-100 my-[0.5vw] w-full shrink-0"></div>

      {/* ── 3. SECTION: LIGHTING & CAMERA ── */}
      <nav className="flex flex-col gap-[0.3vw] shrink-0">
        {/* Lighting Tab */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("lighting")}
          className={`w-full flex items-center gap-[0.65vw] px-[0.85vw] py-[0.55vw] rounded-[0.55vw] text-left transition-all duration-200 cursor-pointer ${
            activeTab === "lighting"
              ? "bg-[#ea543a] text-white font-bold shadow-xs"
              : "text-gray-800 hover:bg-gray-100 font-medium"
          }`}
        >
          <Icon
            icon="ant-design:sun-outlined"
            className="w-[1.15vw] h-[1.15vw] shrink-0"
          />
          <span className="text-[0.82vw]">Lighting</span>
        </button>

        {/* Camera Tab */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("camera")}
          className={`w-full flex items-center gap-[0.65vw] px-[0.85vw] py-[0.55vw] rounded-[0.55vw] text-left transition-all duration-200 cursor-pointer ${
            activeTab === "camera"
              ? "bg-[#ea543a] text-white font-bold shadow-xs"
              : "text-gray-800 hover:bg-gray-100 font-medium"
          }`}
        >
          <Icon
            icon="ant-design:camera-outlined"
            className="w-[1.15vw] h-[1.15vw] shrink-0"
          />
          <span className="text-[0.82vw]">Camera</span>
        </button>
      </nav>

      <style>{`
        .custom-left-scrollbar::-webkit-scrollbar {
          width: 0.25vw;
        }
        .custom-left-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-left-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </aside>
  );
}