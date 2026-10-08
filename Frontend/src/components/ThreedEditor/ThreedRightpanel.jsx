import React, { useState } from "react";
import { Icon } from "@iconify/react";
import MaterialList from "./MaterialList";
import { ModelPanel } from "./panels/ModelTab/ModelPanel";
import { MaterialsPanel } from "./panels/MaterialsTab/MaterialsPanel";
import { TexturesPanel } from "./panels/MaterialsTab/TexturesPanel";
import { LightingPanel } from "./panels/LightingTab/LightingPanel";
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
  onOpenMaterialDrawer,
  cameraPosition,
  onChangeCameraPosition,
  cameraBgType,
  onChangeCameraBgType,
  cameraBgColor,
  onChangeCameraBgColor,
  cameraBgOpacity,
  onChangeCameraBgOpacity,
  selectedFrameId,
  onSelectFrameId
}) {
  // Determine Header Title based on active Left Sidebar Tab
  

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden select-none font-sans">
      {/* â”€â”€â”€ RIGHT PANEL HEADER â”€â”€â”€ */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white shrink-0 px-[1.2vw] py-[0.75vw]">
        <div className="flex items-center gap-[0.55vw]">
          <Icon
            icon="qlementine-icons:properties-16"
            className="w-[1.25vw] h-[1.25vw] text-[#ea543a] shrink-0"
          />
          <span className="text-[1vw] font-semibold text-gray-900 tracking-tight">
            Properties
          </span>
        </div>
      </div>

      {/* â”€â”€â”€ PANEL CONTENT â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
        <div className="flex flex-col gap-[1vw]">


            {/* â”€â”€â”€â”€â”€ VIEW: TEXTURES â”€â”€â”€â”€â”€ */}
            {activeLeftTab === "textures" && (
              <TexturesPanel
                selectedMaterial={selectedMaterial}
                onMapUpload={onMapUpload}
                onSelectMaterial={onSelectMaterial}
                materialList={materialList}
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                onMapUpload={onMapUpload}
              />
            )}

            {/* â”€â”€â”€â”€â”€ VIEW: 3D MODEL (Properties) â”€â”€â”€â”€â”€ */}
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
                onResetTransform={onResetTransform}
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                selectedTextureId={selectedTextureId}
                onOpenMaterialDrawer={onOpenMaterialDrawer}
                selectedMaterial={selectedMaterial}
                onMapUpload={onMapUpload}
              />
            )}

            {/* â”€â”€â”€â”€â”€ VIEW: MATERIALS â”€â”€â”€â”€â”€ */}
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

            {/* â”€â”€â”€â”€â”€ VIEW: LIGHTING â”€â”€â”€â”€â”€ */}
            {activeLeftTab === "lighting" && (
              <LightingPanel
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                savedHdrs={savedHdrs}
                onDeleteHdr={onDeleteHdr}
                onMapUpload={onMapUpload}
              />
            )}

            {/* â”€â”€â”€â”€â”€ VIEW: CAMERA â”€â”€â”€â”€â”€ */}
            {activeLeftTab === "camera" && (
              <CameraPanel
                materialSettings={materialSettings}
                onUpdateMaterialSetting={onUpdateMaterialSetting}
                onCaptureSnapshot={onCaptureSnapshot}
                modelName={modelName}
                hasModel={hasModel}
                cameraPosition={cameraPosition}
                onChangeCameraPosition={onChangeCameraPosition}
                cameraBgType={cameraBgType}
                onChangeCameraBgType={onChangeCameraBgType}
                cameraBgColor={cameraBgColor}
                onChangeCameraBgColor={onChangeCameraBgColor}
                cameraBgOpacity={cameraBgOpacity}
                onChangeCameraBgOpacity={onChangeCameraBgOpacity}
                selectedFrameId={selectedFrameId}
                onSelectFrameId={onSelectFrameId}
              />
            )}

            {/* â”€â”€â”€â”€â”€ VIEW: ANIMATION â”€â”€â”€â”€â”€ */}
            {activeLeftTab === "animation" && (
              <AnimationPanel
                hasAnimations={hasAnimations}
                isAnimationPlaying={isAnimationPlaying}
                onToggleAnimation={onToggleAnimation}
              />
            )}

            {/* â”€â”€â”€â”€â”€ VIEW: HOTSPOTS â”€â”€â”€â”€â”€ */}
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
