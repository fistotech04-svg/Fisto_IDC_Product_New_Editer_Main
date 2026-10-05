import React from "react";
import { Icon } from "@iconify/react";

export function XRayToggleBar({
  selectedMaterial,
  xrayMode,
  setXrayMode,
  xrayMaterials,
  onToggleXray
}) {
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
          <div className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${
            isSwitchActive ? "bg-[#00BFFF]/15 text-[#00BFFF]" : "bg-gray-100 text-gray-400"
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
          className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.15vw] cursor-pointer transition-all duration-300 ${
            isSwitchActive ? "bg-[#00BFFF] shadow-sm shadow-[#00BFFF]/30" : "bg-gray-200"
          }`}
        >
          <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${
            isSwitchActive ? "translate-x-[1.1vw]" : "translate-x-0"
          }`} />
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
}
