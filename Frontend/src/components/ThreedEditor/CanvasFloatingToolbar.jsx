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
  xrayMode = false,
  onToggleXray,
  hasXrayActive = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  targetPosition = { x: 0, y: 0, z: 0 },
  onResetPosition
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
    { id: "select", label: "Select", icon: "solar:cursor-bold-duotone" },
    { id: "translate", label: "Move", icon: "si:move-line" },
    { id: "rotate", label: "Rotate", icon: "mdi:rotate-orbit" },
    { id: "scale", label: "Scale", icon: "solar:scale-outline" }
  ];

  return (
    <>
      {/* ─── TOP FLOATING TOOLBAR PILL ─── */}
      <div className="absolute top-[1.2vw] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
        <div className="flex items-center gap-[0.7vw] bg-[#1a1d21]/90 backdrop-blur-md px-[0.9vw] py-[0.4vw] rounded-full border border-white/10 shadow-2xl text-white text-[0.75vw]">
          
          {/* Perspective Dropdown */}
          <div className="relative" ref={viewMenuRef}>
            <button
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className="flex items-center gap-[0.4vw] text-gray-200 hover:text-white px-[0.4vw] py-[0.2vw] rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Icon icon="solar:camera-bold-duotone" className="w-[1vw] h-[1vw] text-gray-300" />
              <span className="font-medium text-[0.75vw]">{cameraMode}</span>
              <Icon icon="heroicons:chevron-down-20-solid" className={`w-[0.8vw] h-[0.8vw] transition-transform ${isViewMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isViewMenuOpen && (
              <div className="absolute top-full left-0 mt-[0.5vw] w-[9vw] bg-[#1f2329]/95 backdrop-blur-lg border border-white/15 rounded-[0.6vw] shadow-2xl py-[0.3vw] z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                {cameraOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setIsViewMenuOpen(false);
                      onSelectCameraView && onSelectCameraView(opt.id);
                    }}
                    className={`w-full text-left px-[0.7vw] py-[0.35vw] text-[0.72vw] font-medium hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between ${
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

          <div className="w-[1px] h-[1.1vw] bg-white/15" />

          {/* Wireframe Button (Turns bright coral/orange when active) */}
          <button
            onClick={onToggleWireframe}
            className={`flex items-center gap-[0.35vw] px-[0.7vw] py-[0.25vw] rounded-full text-[0.72vw] font-semibold transition-all cursor-pointer ${
              isWireframe
                ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon icon="solar:box-minimalistic-linear" className="w-[0.9vw] h-[0.9vw]" />
            <span>Wireframe</span>
          </button>



          <div className="w-[1px] h-[1.1vw] bg-white/15" />

          {/* Shades Switch */}
          <div className="flex items-center gap-[0.45vw] px-[0.2vw]">
            <button
              onClick={onToggleShades}
              className={`w-[1.8vw] h-[1vw] rounded-full flex items-center px-[0.15vw] transition-colors cursor-pointer ${
                isShades ? "bg-white" : "bg-white/30"
              }`}
            >
              <div
                className={`w-[0.75vw] h-[0.75vw] rounded-full transition-transform ${
                  isShades ? "bg-[#1a1d21] translate-x-[0.75vw]" : "bg-white translate-x-0"
                }`}
              />
            </button>
            <span className="text-[0.72vw] font-medium text-gray-200">Shades</span>
          </div>

          {(onUndo || onRedo) && (
            <>
              <div className="w-[1px] h-[1.1vw] bg-white/15" />
              <div className="flex items-center gap-[0.15vw]">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  className={`w-[1.6vw] h-[1.6vw] rounded-full flex items-center justify-center transition-colors ${
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
                  className={`w-[1.6vw] h-[1.6vw] rounded-full flex items-center justify-center transition-colors ${
                    canRedo
                      ? "text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                      : "text-gray-600 cursor-not-allowed opacity-40"
                  }`}
                >
                  <Icon icon="lucide:redo-dot" className="w-[0.95vw] h-[0.95vw]" />
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ─── RIGHT FLOATING TOOL DOCK ─── */}
      <div className="absolute right-[1.2vw] top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none">
        <div className="bg-[#1a1d21]/90 backdrop-blur-md p-[0.35vw] rounded-[0.8vw] border border-white/10 shadow-2xl flex flex-col items-center gap-[0.35vw]">
          {transformTools.map((tool) => {
            const isActive = transformMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTransformMode && onSelectTransformMode(tool.id)}
                title={tool.id.toUpperCase()}
                className={`w-[2.4vw] h-[2.4vw] rounded-[0.55vw] flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon icon={tool.icon} className="w-[1.05vw] h-[1.05vw]" />
                <span className="text-[0.45vw] font-semibold leading-none mt-[0.1vw]">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM-LEFT COORDINATES & RESET BADGE ─── */}
      {targetPosition && (
        <div className="absolute left-[1.2vw] bottom-[1.2vw] z-30 pointer-events-auto select-none">
          <div className="bg-[#1a1d21]/90 backdrop-blur-md px-[0.8vw] py-[0.35vw] rounded-[0.6vw] border border-white/10 shadow-2xl flex items-center gap-[0.8vw] text-white">
            <div className="text-[0.68vw] font-semibold flex items-baseline gap-[0.3vw]">
              <span className="text-gray-400 uppercase tracking-widest text-[0.52vw]">X</span>
              <span className="text-gray-200 min-w-[1.2vw] text-left">{targetPosition?.x ?? 0}</span>
            </div>
            <div className="text-[0.68vw] font-semibold flex items-baseline gap-[0.3vw]">
              <span className="text-gray-400 uppercase tracking-widest text-[0.52vw]">Y</span>
              <span className="text-gray-200 min-w-[1.2vw] text-left">{targetPosition?.y ?? 0}</span>
            </div>
            <div className="text-[0.68vw] font-semibold flex items-baseline gap-[0.3vw]">
              <span className="text-gray-400 uppercase tracking-widest text-[0.52vw]">Z</span>
              <span className="text-gray-200 min-w-[1.2vw] text-left">{targetPosition?.z ?? 0}</span>
            </div>
            {onResetPosition && (
              <>
                <div className="h-[0.9vw] w-[1px] bg-white/15" />
                <button
                  onClick={onResetPosition}
                  className="text-[0.65vw] font-bold text-[#ea543a] hover:text-[#ff6b52] uppercase tracking-wider transition-colors cursor-pointer"
                  title="Reset Coordinates"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
