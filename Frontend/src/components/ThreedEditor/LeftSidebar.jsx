import React, { useState } from "react";
import { Icon } from "@iconify/react";

export default function LeftSidebar({
  activeTab = "model",
  onSelectTab,
  modelName = "Flipibook Name",
  onRenameModel,
  meshCount = 0,
  pageCount = 10,
  disableRename = false,
  onExport,
  hasModel = true
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(modelName);

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

  const navItems = [
    {
      id: "model",
      label: "3D Model",
      icon: "f7:cube",
      lucideIcon: "lucide:box"
    },
    {
      id: "materials",
      label: "Materials",
      icon: "icon-park-outline:material-two",
      lucideIcon: "lucide:circle-dot"
    },
    {
      id: "lighting",
      label: "Lightning",
      icon: "ant-design:sun-outlined",
      lucideIcon: "lucide:sun-medium"
    },
    {
      id: "camera",
      label: "Camera",
      icon: "ant-design:camera-outlined",
      lucideIcon: "lucide:camera"
    },
    {
      id: "hotspots",
      label: "Hotspots",
      icon: "material-symbols:ads-click-rounded",
      lucideIcon: "lucide:map-pin"
    },
    {
      id: "animation",
      label: "Animation",
      icon: "ic:outline-slow-motion-video",
      lucideIcon: "lucide:disc"
    },
  ];

  return (
    <aside className="w-[15.5vw] min-w-[210px] max-w-[250px] h-full bg-white flex flex-col p-[1vw] select-none shrink-0 border-r border-gray-200">
      {/* Top Project Header (Straight, no card view) */}
      <div className="pb-[0.85vw] mb-[0.85vw] border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-[0.6vw] min-w-0 flex-1">
          <div className="w-[2.2vw] h-[2.2vw] rounded-[0.45vw] text-[#ea543a] flex items-center justify-center shrink-0">
            <Icon icon="basil:document-outline" className="w-[1.2vw] h-[1.2vw]" />
          </div>
          <div className="min-w-0 flex-1">
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
              <h3
                onClick={startEdit}
                title={modelName || "Flipibook Name"}
                className="text-[0.8vw] font-medium text-gray-900 cursor-pointer hover:text-[#ea543a] transition-colors leading-tight"
              >
                {modelName || "Flipibook Name"}
              </h3>
            )}
           
          </div>
        </div>

        <button
          onClick={startEdit}
          disabled={disableRename}
          className="w-[1.6vw] h-[1.6vw] flex items-center justify-center text-[#ea543a] hover:bg-[#fef2f2] rounded-[0.35vw] transition-colors cursor-pointer shrink-0 ml-[0.3vw]"
          title="Rename Model"
        >
          <Icon icon="heroicons:pencil-square-20-solid" className="w-[0.95vw] h-[0.95vw]" />
        </button>
      </div>

      {/* Vertical Navigation Tabs */}
      <nav className="flex flex-col gap-[0.35vw] flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              className={`w-full flex items-center gap-[0.75vw] px-[0.9vw] py-[0.7vw] rounded-[0.6vw] text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#EC5137] text-[#ffffff] font-medium shadow-2xs"
                  : "text-gray-700 hover:bg-gray-100/70 hover:text-gray-900 font-semibold"
              }`}
            >
              <Icon
                icon={item.icon || item.lucideIcon}
                className={`w-[1.25vw] h-[1.25vw] shrink-0 transition-colors ${
                  isActive ? "text-[#ffffff]" : "text-gray-700"
                }`}
              />
              <span className="text-[0.85vw] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Export 3D Button at bottom */}
      {onExport && (
        <div className="pt-[0.8vw] border-t border-gray-100 shrink-0">
          <button
            onClick={onExport}
            disabled={!hasModel}
            className={`w-full py-[0.6vw] px-[1vw] rounded-[0.55vw] text-[0.78vw] font-bold flex items-center justify-center gap-[0.45vw] transition-all cursor-pointer ${
              hasModel
                ? "bg-[#ea543a] hover:bg-[#d9442a] text-white shadow-md shadow-[#ea543a]/20 active:scale-98"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Icon icon="bitcoin-icons:export-outline" className="w-[1.1vw] h-[1.1vw] stroke-2" />
            <span>Export 3D</span>
          </button>
        </div>
      )}
    </aside>
  );
}
