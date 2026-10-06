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
    { id: "select", label: "Select", icon: "clarity:cursor-arrow-line", shortcut: "" },
    { id: "translate", label: "Move", icon: "iconamoon:move-thin", shortcut: "W" },
    { id: "rotate", label: "Rotate", icon: "hugeicons:rotate-01", shortcut: "R" },
    { id: "scale", label: "Scale", icon: "solar:scale-outline", shortcut: "S" }
  ];

  return (
    <>
      {/* ─── TOP LEFT: UNDO / REDO ─── */}
      <div className="absolute top-[1.2vw] left-[1.2vw] z-30 pointer-events-auto select-none flex items-center gap-[0.6vw]">
        {/* Undo / Redo controls */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-[0.2vw] bg-[#181b20]/90 backdrop-blur-md p-[0.25vw] rounded-[0.55vw] border border-white/10 shadow-xl">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${canUndo
                ? "text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                : "text-gray-600 cursor-not-allowed opacity-40"
                }`}
            >
              <Icon icon="lucide:undo-dot" className="w-[0.95vw] h-[0.95vw]" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`w-[1.6vw] h-[1.6vw] rounded-[0.4vw] flex items-center justify-center transition-colors ${canRedo
                ? "text-gray-200 hover:text-white hover:bg-white/10 cursor-pointer"
                : "text-gray-600 cursor-not-allowed opacity-40"
                }`}
            >
              <Icon icon="lucide:redo-dot" className="w-[0.95vw] h-[0.95vw]" />
            </button>
          </div>
        )}
      </div>

      {/* ─── TOP RIGHT: WIREFRAME & SHADING MUTUAL TOGGLE ─── */}
      <div className="absolute top-[1.2vw] right-[1.2vw] z-30 pointer-events-auto select-none">
        <div className="flex items-center gap-[0.25vw] bg-[#181b20]/90 backdrop-blur-md p-[0.25vw] rounded-[0.55vw] border border-white/10 shadow-xl">
          {/* Wireframe Button (Mutually exclusive with Shades) */}
          <button
            type="button"
            onClick={() => {
              if (!isWireframe) {
                onToggleWireframe && onToggleWireframe();
              }
            }}
            className={`flex items-center gap-[0.4vw] px-[0.75vw] py-[0.35vw] rounded-[0.45vw] text-[0.72vw] font-medium transition-all cursor-pointer ${isWireframe
              ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
              : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
          >
            <Icon icon="ph:polygon-light" className="w-[0.95vw] h-[0.95vw]" />
            <span>Wireframe</span>
          </button>

          {/* Shades Button (Mutually exclusive with Wireframe) */}
          <button
            type="button"
            onClick={() => {
              if (isWireframe) {
                onToggleWireframe && onToggleWireframe();
              } else if (!isShades) {
                onToggleShades && onToggleShades();
              }
            }}
            className={`flex items-center gap-[0.4vw] px-[0.75vw] py-[0.35vw] rounded-[0.45vw] text-[0.72vw] font-medium transition-all cursor-pointer ${!isWireframe && isShades
              ? "bg-[#ea543a] text-white shadow-md shadow-[#ea543a]/30"
              : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
          >
            <Icon icon="carbon:circle-solid" className="w-[0.85vw] h-[0.85vw]" />
            <span>Shades</span>
          </button>
        </div>
      </div>

      {/* ─── RIGHT FLOATING TRANSFORM DOCK ─── */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none">
        <div className="bg-[#181b20]/90 backdrop-blur-md p-[0.35vw] rounded-[0.7vw] border border-white/10 shadow-2xl flex flex-col items-center gap-[0.35vw]">
          {transformTools.map((tool) => {
            const isActive = transformMode === tool.id;
            const tooltip = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTransformMode && onSelectTransformMode(tool.id)}
                title={tooltip}
                className={`w-[2.5vw] h-[2.5vw] rounded-[0.5vw] flex flex-col items-center justify-center transition-all cursor-pointer ${isActive
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
            onClick={() =>
              onSelectNavMode &&
              onSelectNavMode(navMode === "pan" ? "orbit" : "pan")
            }
            className={`flex flex-col items-center justify-center transition-colors cursor-pointer group ${navMode === "pan" ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            title={navMode === "pan" ? "Disable Hand / Pan View (H)" : "Enable Hand / Pan View (H)"}
          >
            <Icon
              icon="famicons:hand-right-outline"
              className={`w-[1.15vw] h-[1.15vw] transition-transform group-hover:scale-110 ${navMode === "pan" ? "text-[#ea543a]" : "text-gray-200"
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

