import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import MaterialProperties from "./Customized";

export default function RightPanel({ 
    onFileProcess, 
    hasModel, 
    onExport,
    autoRotate, 
    setAutoRotate, 
    isLoading, 
    materialSettings, 
    onUpdateMaterialSetting,
    activeTab = "pre",
    setActiveTab,
    activeAccordion,
    setActiveAccordion,
    transformValues,
    onManualTransformChange,
    onResetTransform,
    onResetFactorSettings,
    onUvUnwrap,
    onMapUpload,
    selectedTextureId,
    onSelectTexture
}) {
  const fileRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        onFileProcess(file);
        e.target.value = null; // Reset input
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
        onFileProcess(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-gray-300">
      {/* TOP CONTROLS BAR (Always Visible) */}
      <div className="p-[1vw] flex items-center justify-between bg-white shrink-0">
        {/* Auto Rotate Toggle */}
        <div className="flex items-center gap-[0.75vw]">
          <div
            onClick={() => hasModel && setAutoRotate(!autoRotate)}
            className={`w-[2.75vw] h-[1.5vw] rounded-full flex items-center px-[0.25vw] transition-all duration-300 ${
              hasModel 
                ? `cursor-pointer ${autoRotate ? "bg-[#5d5efc]" : "bg-gray-200"}` 
                : "bg-gray-100 cursor-not-allowed opacity-50"
            }`}
          >
            <div className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform duration-300 ${autoRotate ? "translate-x-[1.25vw]" : "translate-x-0"}`} />
          </div>
          <span className={`text-[0.75vw] font-semibold ${hasModel ? "text-gray-800" : "text-gray-400"}`}>Auto Rotate</span>
        </div>

        {/* Export Button */}
        <button 
          onClick={onExport}
          disabled={!hasModel}
          className={`py-[0.65vw] px-[1.5vw] rounded-[0.5vw] text-[0.75vw] font-semibold flex items-center gap-[0.5vw] transition-all ${
            hasModel 
              ? "bg-[#5d5efc] text-white shadow-lg shadow-[#5d5efc]/20 active:scale-95 cursor-pointer hover:bg-[#4d4eec]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
          }`}
        >
          <Icon icon="bitcoin-icons:export-outline" width="1.25vw" height="1.25vw" className="stroke-2" />
          Export 3D
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasModel ? (
          <div className="flex-1 bg-[#f5f6f7] rounded-t-[1.25vw] p-[2vw] flex flex-col">
            {/* Header */}
            <h1 className="text-[1.1vw] font-semibold text-gray-900 mb-[2vw] leading-tight">
              Upload your 3D Object
            </h1>

            {/* Subtitle with line */}
            <div className="flex items-center gap-[0.75vw] mb-[2.5vw]">
              <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap">Your Model</span>
              <div className="h-[0.1vw] flex-1 bg-gray-300"></div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => !isLoading && fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`w-[90%] mx-auto h-[10vw] border-2 border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1vw] transition-all group shadow-sm 
                ${isLoading 
                    ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-300 grayscale" 
                    : isDragOver 
                        ? "border-blue-500 bg-blue-50 cursor-copy scale-[1.02]" 
                        : "border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
                }`}
            >
              <div className="text-[0.75vw] font-semibold text-gray-500 mb-[1.5vw] tracking-tight">
                {isDragOver ? (
                    <span className="text-blue-600 font-bold">Drop to Upload</span>
                ) : (
                    <>Drag & Drop or <span className="text-blue-600 font-bold">Upload</span></>
                )}
              </div>

              <div className={`mb-[1.5vw] transition-colors ${isDragOver ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"}`}>
                <Icon icon="heroicons:arrow-up-tray" width="2vw" />
              </div>

              <div className="text-center">
                <div className="text-[0.65vw] font-bold text-gray-600 uppercase tracking-wide mb-[0.25vw]">
                  Supported File
                </div>
                <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[12vw] font-medium text-center">
                  STEP, OBJ, FBX, GLB, GLTF
                </div>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".glb,.gltf,.obj,.fbx,.stl,.step,.stp"
              hidden
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
              <MaterialProperties 
                  controls={materialSettings} 
                  updateControl={onUpdateMaterialSetting}
                  activePanel={activeAccordion}
                  setActivePanel={setActiveAccordion}
                  transformValues={transformValues}
                  onManualTransformChange={onManualTransformChange}
                  onResetTransform={onResetTransform}
                  onResetFactor={onResetFactorSettings}
                  onMapUpload={onMapUpload}
                  selectedTextureId={selectedTextureId}
                  onSelectTexture={onSelectTexture}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.35vw;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 0.5vw;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
