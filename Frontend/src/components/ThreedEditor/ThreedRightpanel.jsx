import React, { useState } from "react";
import MaterialList from "./MaterialList";
import Customized from "./Customized";
import { XRayToggleBar } from "./panels/common/XRayToggleBar";
import { ModelPanel } from "./panels/ModelTab/ModelPanel";
import { MaterialsPanel } from "./panels/MaterialsTab/MaterialsPanel";
import { TexturesPanel } from "./panels/MaterialsTab/TexturesPanel";
import { CameraPanel } from "./panels/CameraTab/CameraPanel";
import { HotspotsPanel } from "./panels/HotspotsTab/HotspotsPanel";
import { AnimationPanel } from "./panels/AnimationTab/AnimationPanel";

export default function RightPanel({
  onFileProcess,
  hasModel,
  onExport,
  onCaptureSnapshot,
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
  modelStats,
  onOpenMaterialDrawer
}) {
  const [activeRightTab, setActiveRightTab] = useState("tool"); // 'tool' | 'layers'

  // Determine Tab 1 Label based on active Left Sidebar Tab
  const getToolTabLabel = () => {
    switch (activeLeftTab) {
      case "textures":
        return "Textures";
      case "materials":
        return "Material";
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

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none font-sans">
      {/* ─── TOP TABS (matching Properties / Layers tabs) ─── */}
      <div className="flex border-b border-gray-200 bg-white shrink-0 px-[1vw]">
        <button
          onClick={() => setActiveRightTab("tool")}
          className={`flex-1 py-[0.75vw] text-center font-bold text-[0.82vw] relative transition-colors cursor-pointer ${
            activeRightTab === "tool" ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          {getToolTabLabel()}
          {activeRightTab === "tool" && (
            <span className="absolute bottom-0 left-[15%] right-[15%] h-[0.16vw] bg-[#ea543a] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveRightTab("layers")}
          className={`flex-1 py-[0.75vw] text-center font-bold text-[0.82vw] relative transition-colors cursor-pointer ${
            activeRightTab === "layers" ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-700"
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
        {/* TAB 2: LAYERS */}
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
            <XRayToggleBar
              selectedMaterial={selectedMaterial}
              xrayMode={xrayMode}
              setXrayMode={setXrayMode}
              xrayMaterials={xrayMaterials}
              onToggleXray={onToggleXray}
            />

            {/* ───── VIEW: TEXTURES ───── */}
            {activeLeftTab === "textures" && (
              <TexturesPanel
                selectedMaterial={selectedMaterial}
                onSelectMaterial={onSelectMaterial}
                materialList={materialList}
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                onMapUpload={onMapUpload}
              />
            )}

            {/* ───── VIEW: 3D MODEL (Properties) ───── */}
            {activeLeftTab === "model" && (
              <ModelPanel
                autoRotate={autoRotate}
                setAutoRotate={setAutoRotate}
                autoRotateSpeed={autoRotateSpeed}
                setAutoRotateSpeed={setAutoRotateSpeed}
                autoRotateAxis={autoRotateAxis}
                setAutoRotateAxis={setAutoRotateAxis}
                autoRotateRange={autoRotateRange}
                setAutoRotateRange={setAutoRotateRange}
                showGridLines={showGridLines}
                setShowGridLines={setShowGridLines}
                showAxis={showAxis}
                setShowAxis={setShowAxis}
                transformValues={transformValues}
                onManualTransformChange={onManualTransformChange}
              />
            )}

            {/* ───── VIEW: MATERIALS ───── */}
            {activeLeftTab === "materials" && (
              <MaterialsPanel
                selectedMaterial={selectedMaterial}
                onSelectMaterial={onSelectMaterial}
                materialList={materialList}
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                selectedTextureId={selectedTextureId}
                onOpenMaterialDrawer={onOpenMaterialDrawer}
              />
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
              <CameraPanel
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                onCaptureSnapshot={onCaptureSnapshot}
                modelName={modelName}
                hasModel={hasModel}
              />
            )}

            {/* ───── VIEW: ANIMATION ───── */}
            {activeLeftTab === "animation" && (
              <AnimationPanel
                hasAnimations={hasAnimations}
                isAnimationPlaying={isAnimationPlaying}
                onToggleAnimation={onToggleAnimation}
              />
            )}

            {/* ───── VIEW: HOTSPOTS ───── */}
            {activeLeftTab === "hotspots" && (
              <HotspotsPanel
                hotspots={hotspots}
                activeHotspotId={activeHotspotId}
                onHotspotClick={onHotspotClick}
                onAddHotspot={onAddHotspot}
                onEditHotspot={onEditHotspot}
                onDeleteHotspot={onDeleteHotspot}
              />
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
