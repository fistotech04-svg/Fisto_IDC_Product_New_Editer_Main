import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function CanvasFloatingToolbar({
  cameraMode = "Perspective",
  onSelectCameraView,
  isWireframe = false,
  onToggleWireframe,
  isShades = true,
  onToggleShades,
  transformMode = "select",
  onSelectTransformMode,
  canTransform = true,
  navMode = "orbit",
  onSelectNavMode,
  onZoomIn,
  onZoomOut,
  onResetView,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setIsViewMenuOpen(false);
      }
    };
    if (isViewMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isViewMenuOpen]);

  const cameraOptions = [
    { label: "Perspective", id: "perspective" },
    { label: "Orthographic", id: "orthographic" },
    { label: "Front View", id: "front" },
    { label: "Top View", id: "top" },
    { label: "Right Side View", id: "right" },
    { label: "Reset View", id: "reset" }
  ];

  const transformTools = [
    { id: "select", label: "Select", icon: "clarity:cursor-arrow-line" },
    { id: "translate", label: "Move", icon: "iconamoon:move-thin" },
    { id: "rotate", label: "Rotate", icon: "hugeicons:rotate-01" },
    { id: "scale", label: "Scale", icon: "solar:scale-outline" }
  ];

  return (
    <>
      {/* ─── TOP CENTER FLOATING TOOLBAR ─── */}
      <div className="absolute top-[1.2vw] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none flex items-center gap-[0.6vw]">
        {/* Perspective Dropdown Capsule */}
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="flex items-center gap-[0.45vw] bg-[#181b20]/90 backdrop-blur-md px-[0.75vw] py-[0.4vw] rounded-[0.55vw] border border-white/10 shadow-xl text-gray-200 hover:text-white hover:bg-[#23272e]/90 transition-colors cursor-pointer"
          >
            <Icon icon="ant-design:camera-outlined" className="w-[1vw] h-[1vw] text-gray-300" />
            <span className="font-medium text-[0.75vw]">{cameraMode}</span>
            <Icon icon="heroicons:chevron-down-20-solid" className={`w-[0.8vw] h-[0.8vw] transition-transform duration-200 ${isViewMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isViewMenuOpen && (
            <div className="absolute top-full left-0 mt-[0.4vw] w-[9.5vw] bg-[#1a1d22]/95 backdrop-blur-lg border border-white/15 rounded-[0.6vw] shadow-2xl py-[0.3vw] z-50 text-white animate-in fade-in zoom-in-95 duration-150">
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIsViewMenuOpen(false);
                    onSelectCameraView && onSelectCameraView(opt.id);
                  }}
                  className={`w-full text-left px-[0.75vw] py-[0.4vw] text-[0.72vw] font-medium hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between ${
                    cameraMode.toLowerCase().includes(opt.id) ? "text-[#ea543a]" : "text-gray-200"
                  }`}
                >
                  <span>{opt.label}</span>
                  {cameraMode.toLowerCase().includes(opt.id) && (
                    <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-[#ea543a]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wireframe & Shades Capsule */}
        <div className="flex items-center gap-[0.3vw] bg-[#181b20]/90 backdrop-blur-md p-[0.25vw] rounded-[0.55vw] border border-white/10 shadow-xl">
          {/* Wireframe Button */}
          <button
            onClick={onToggleWireframe}
            className={`flex items-center gap-[0.4vw] px-[0.75vw] py-[0.35vw] rounded-[0.45vw] text-[0.72vw] font-medium transition-all cursor-pointer ${
              isWireframe
                ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon icon="ph:polygon-light" className="w-[0.95vw] h-[0.95vw]" />
            <span>Wireframe</span>
          </button>

          {/* Shades Button */}
          <button
            onClick={onToggleShades}
            className={`flex items-center gap-[0.4vw] px-[0.75vw] py-[0.35vw] rounded-[0.45vw] text-[0.72vw] font-medium transition-all cursor-pointer ${
              isShades
                ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon icon="carbon:circle-solid" className="w-[0.85vw] h-[0.85vw]" />
            <span>Shades</span>
          </button>
        </div>

        {/* Optional Undo / Redo controls if provided */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-[0.2vw] bg-[#181b20]/90 backdrop-blur-md p-[0.25vw] rounded-[0.55vw] border border-white/10 shadow-xl">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${
                canUndo
                  ? "text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                  : "text-gray-600 cursor-not-allowed opacity-40"
              }`}
            >
              <Icon icon="lucide:undo-dot" className="w-[0.95vw] h-[0.95vw]" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${
                canRedo
                  ? "text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                  : "text-gray-600 cursor-not-allowed opacity-40"
              }`}
            >
              <Icon icon="lucide:redo-dot" className="w-[0.95vw] h-[0.95vw]" />
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT FLOATING TRANSFORM DOCK ─── */}
      <div className="absolute right-[1.2vw] top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none">
        <div className="bg-[#181b20]/90 backdrop-blur-md p-[0.35vw] rounded-[0.7vw] border border-white/10 shadow-2xl flex flex-col items-center gap-[0.35vw]">
          {transformTools.map((tool) => {
            const isActive = transformMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTransformMode && onSelectTransformMode(tool.id)}
                title={tool.label}
                className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon icon={tool.icon} className="w-[1.05vw] h-[1.05vw]" />
                <span className="text-[0.48vw] font-medium leading-none mt-[0.18vw]">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM FLOATING NAVIGATION BAR ─── */}
      <div className="absolute bottom-[1.2vw] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
        <div className="bg-[#181b20]/90 backdrop-blur-md px-[1.2vw] py-[0.55vw] rounded-[0.8vw] border border-white/10 shadow-2xl flex items-center gap-[1.6vw] text-white">
          {/* Hand / Pan Button */}
          <button
            type="button"
            onClick={() => onSelectNavMode && onSelectNavMode("pan")}
            className={`flex flex-col items-center justify-center transition-colors cursor-pointer group ${
              navMode === "pan" ? "text-white" : "text-gray-300 hover:text-white"
            }`}
            title="Hand / Pan View"
          >
            <Icon
              icon="famicons:hand-right-outline"
              className={`w-[1.15vw] h-[1.15vw] transition-transform group-hover:scale-110 ${
                navMode === "pan" ? "text-[#ea543a]" : "text-gray-200"
              }`}
            />
            <span className="text-[0.62vw] font-normal mt-[0.2vw]">Hand</span>
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={onZoomIn}
            className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer group"
            title="Zoom In"
          >
            <Icon icon="f7:zoom-in" className="w-[1.15vw] h-[1.15vw] text-gray-200 transition-transform group-hover:scale-110" />
            <span className="text-[0.62vw] font-normal mt-[0.2vw]">Zoom in</span>
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={onZoomOut}
            className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer group"
            title="Zoom Out"
          >
            <Icon icon="f7:zoom-out" className="w-[1.15vw] h-[1.15vw] text-gray-200 transition-transform group-hover:scale-110" />
            <span className="text-[0.62vw] font-normal mt-[0.2vw]">Zoom out</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onResetView}
            className="flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer group"
            title="Reset View"
          >
            <Icon icon="fluent-mdl2:full-view" className="w-[1.15vw] h-[1.15vw] text-gray-200 transition-transform group-hover:scale-110" />
            <span className="text-[0.62vw] font-normal mt-[0.2vw]">Reset</span>
          </button>
        </div>
      </div>
    </>
  );
}

