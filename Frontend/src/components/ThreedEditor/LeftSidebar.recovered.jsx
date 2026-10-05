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

  const currentActiveModelId = activeModelId || modelItems[0]?.id;

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
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Main "3D Model" Tab Button */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("model")}
          className={`w-full flex items-center gap-[0.65vw] px-[0.85vw] py-[0.6vw] rounded-[0.55vw] text-left transition-all duration-200 cursor-pointer shrink-0 mb-[0.4vw] ${
            activeTab === "model"
              ? "bg-[#ea543a] text-white font-bold shadow-xs"
              : "text-gray-800 hover:bg-gray-100 font-semibold"
          }`}
        >
          <Icon icon="f7:cube" className="w-[1.15vw] h-[1.15vw] shrink-0" />
          <span className="text-[0.82vw]">3D Model</span>
        </button>

        {/* Scrollable Model + Layers Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-[0.2vw] custom-left-scrollbar flex flex-col gap-[0.4vw]">
          {modelItems.map((item, idx) => {
            const isModelActive = activeTab === "model" && currentActiveModelId === item.id;
            const displayName = item.name || `3D Model ${idx > 0 ? idx + 1 : ""}`;
            const isExpanded = expandedModelIds[item.id] ?? true;

            return (
              <div key={item.id || idx} className="flex flex-col gap-[0.2vw]">
                {/* Model Capsule / Header */}
                <div
                  onClick={() => {
                    onSelectTab && onSelectTab("model");
                    onSelectModel && onSelectModel(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-[0.75vw] py-[0.5vw] rounded-[0.5vw] text-left transition-all duration-150 cursor-pointer ${
                    isModelActive
                      ? "bg-[#fdeee9] text-[#ea543a] font-semibold border border-[#ea543a]/25"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-950 font-medium border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-[0.55vw] min-w-0 flex-1">
                    <Icon
                      icon="f7:cube"
                      className={`w-[1vw] h-[1vw] shrink-0 ${
                        isModelActive ? "text-[#ea543a]" : "text-gray-600"
                      }`}
                    />
                    <span className="text-[0.78vw] truncate">{displayName}</span>
                  </div>

                  {/* Layers / Chevron Toggle */}
                  <div className="flex items-center gap-[0.3vw] shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleModelExpand(item.id, e)}
                      className={`w-[1.2vw] h-[1.2vw] flex items-center justify-center rounded-[0.25vw] hover:bg-black/5 transition-transform ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                      title={isExpanded ? "Collapse layers" : "Expand layers"}
                    >
                      <Icon
                        icon="heroicons:chevron-down-20-solid"
                        className={`w-[0.9vw] h-[0.9vw] ${
                          isModelActive ? "text-[#ea543a]" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Nested Layers (MaterialList) inside this Model */}
                {isExpanded && (
                  <div className="pl-[0.3vw] pr-[0.1vw] py-[0.2vw] border-l-2 border-[#ea543a]/20 ml-[0.65vw] my-[0.1vw] bg-gray-50/40 rounded-r-[0.4vw]">
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
                      modelName={displayName}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ Add Model" Button */}
          <button
            type="button"
            onClick={() => {
              if (onAddModel) {
                onAddModel();
              }
            }}
            className="w-full flex items-center gap-[0.55vw] px-[0.75vw] py-[0.45vw] rounded-[0.5vw] text-left text-gray-800 hover:bg-gray-100 hover:text-gray-950 font-medium transition-colors cursor-pointer group mt-[0.2vw]"
          >
            <Icon
              icon="solar:add-circle-linear"
              className="w-[1.05vw] h-[1.05vw] text-gray-800 group-hover:text-[#ea543a] transition-colors shrink-0"
            />
            <span className="text-[0.78vw]">Add Model</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-gray-100 my-[0.6vw] w-full shrink-0"></div>

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

      {/* Export 3D Button at bottom */}
      {onExport && (
        <div className="pt-[0.6vw] border-t border-gray-100 shrink-0 mt-[0.4vw]">
          <button
            type="button"
            onClick={onExport}
            disabled={!hasModel}
            className={`w-full py-[0.55vw] px-[0.8vw] rounded-[0.5vw] text-[0.78vw] font-bold flex items-center justify-center gap-[0.45vw] transition-all cursor-pointer ${
              hasModel
                ? "bg-[#ea543a] hover:bg-[#d9442a] text-white shadow-md shadow-[#ea543a]/20 active:scale-98"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Icon
              icon="bitcoin-icons:export-outline"
              className="w-[1.05vw] h-[1.05vw] stroke-2"
            />
            <span>Export 3D</span>
          </button>
        </div>
      )}

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