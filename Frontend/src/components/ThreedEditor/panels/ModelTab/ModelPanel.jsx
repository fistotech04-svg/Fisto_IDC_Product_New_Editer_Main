import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { AxisInput } from "../common/PanelInputs";

export function ModelPanel({
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
  transformValues,
  onManualTransformChange
}) {
  const [isUniformScale, setIsUniformScale] = useState(true);

  const radToDeg = (rad) => {
    const r = Number(rad) || 0;
    return Math.round((r * (180 / Math.PI)) * 10) / 10;
  };

  const handleScaleChange = (axis, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return;
    if (isUniformScale) {
      onManualTransformChange && onManualTransformChange("scale", "all", num);
    } else {
      onManualTransformChange && onManualTransformChange("scale", axis, num);
    }
  };

  return (
    <div className="flex flex-col gap-[1.2vw]">
      {/* ── 1. VIEW SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">View</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Auto Rotate Toggle */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-bold text-gray-800">Auto Rotate</span>
          <button
            type="button"
            onClick={() => setAutoRotate && setAutoRotate(!autoRotate)}
            className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.18vw] transition-colors cursor-pointer ${
              autoRotate ? "bg-[#ea543a]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-[0.9vw] h-[0.9vw] rounded-full bg-white transition-transform ${
                autoRotate ? "translate-x-[1.1vw]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Rotate Speed */}
        <div className="flex flex-col gap-[0.2vw]">
          <div className="flex items-center justify-between">
            <span className="text-[0.72vw] font-medium text-gray-500">Rotate Speed</span>
            <span className="text-[0.68vw] font-semibold text-gray-700 bg-gray-100 px-[0.4vw] py-[0.1vw] rounded">
              {(autoRotateSpeed || 1.0).toFixed(1)}X
            </span>
          </div>
          <div className="relative flex items-center w-full">
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.1"
              value={autoRotateSpeed || 1.0}
              onChange={(e) => setAutoRotateSpeed && setAutoRotateSpeed(parseFloat(e.target.value))}
              className="w-full h-[0.25vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
            />
          </div>
        </div>

        {/* Rotate Axis */}
        <div className="flex items-center justify-between pt-[0.2vw]">
          <span className="text-[0.78vw] font-bold text-gray-800">Rotate Axis</span>
          <div className="flex items-center gap-[0.4vw]">
            {["X", "Y", "Z"].map((axis) => {
              const isSelected = (autoRotateAxis || "X") === axis;
              return (
                <button
                  key={axis}
                  type="button"
                  onClick={() => setAutoRotateAxis && setAutoRotateAxis(axis)}
                  className={`w-[2.6vw] py-[0.25vw] text-[0.75vw] font-bold rounded-[0.4vw] border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#ea543a] text-white border-[#ea543a] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {axis}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotate Range */}
        <div className="flex flex-col gap-[0.2vw]">
          <div className="flex items-center justify-between">
            <span className="text-[0.72vw] font-medium text-gray-500">Rotate Range</span>
            <span className="text-[0.68vw] font-semibold text-gray-700 bg-gray-100 px-[0.4vw] py-[0.1vw] rounded">
              {autoRotateRange || 360}°
            </span>
          </div>
          <div className="relative flex items-center w-full">
            <input
              type="range"
              min="45"
              max="360"
              step="15"
              value={autoRotateRange || 360}
              onChange={(e) => setAutoRotateRange && setAutoRotateRange(parseInt(e.target.value))}
              className="w-full h-[0.25vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
            />
          </div>
        </div>

        {/* Show Grid Lines */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-bold text-gray-800">Show Grid Lines</span>
          <button
            type="button"
            onClick={() => setShowGridLines && setShowGridLines(!showGridLines)}
            className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.18vw] transition-colors cursor-pointer ${
              showGridLines ? "bg-[#ea543a]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-[0.9vw] h-[0.9vw] rounded-full bg-white transition-transform ${
                showGridLines ? "translate-x-[1.1vw]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Show Axis */}
        <div className="flex items-center justify-between py-[0.1vw]">
          <span className="text-[0.78vw] font-bold text-gray-800">Show Axis</span>
          <button
            type="button"
            onClick={() => setShowAxis && setShowAxis(!showAxis)}
            className={`w-[2.4vw] h-[1.3vw] rounded-full flex items-center px-[0.18vw] transition-colors cursor-pointer ${
              showAxis ? "bg-[#ea543a]" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-[0.9vw] h-[0.9vw] rounded-full bg-white transition-transform ${
                showAxis ? "translate-x-[1.1vw]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 2. POSITION SECTION ── */}
      <div className="flex flex-col gap-[0.75vw]">
        <div className="flex items-center gap-[0.6vw]">
          <span className="text-[0.82vw] font-bold text-gray-900">Position</span>
          <div className="h-[0.08vw] bg-gray-200 flex-1"></div>
        </div>

        {/* Move */}
        <div className="flex items-center justify-between">
          <span className="text-[0.78vw] font-bold text-gray-800 w-[4.5vw]">Move</span>
          <div className="grid grid-cols-3 gap-[0.4vw] flex-1">
            <AxisInput
              axis="X"
              value={transformValues?.position?.x ?? 0}
              onChange={(v) => onManualTransformChange && onManualTransformChange("position", "x", v)}
              step={0.1}
            />
            <AxisInput
              axis="Y"
              value={transformValues?.position?.y ?? 0}
              onChange={(v) => onManualTransformChange && onManualTransformChange("position", "y", v)}
              step={0.1}
            />
            <AxisInput
              axis="Z"
              value={transformValues?.position?.z ?? 0}
              onChange={(v) => onManualTransformChange && onManualTransformChange("position", "z", v)}
              step={0.1}
            />
          </div>
        </div>

        {/* Rotate */}
        <div className="flex items-center justify-between">
          <span className="text-[0.78vw] font-bold text-gray-800 w-[4.5vw]">Rotate</span>
          <div className="grid grid-cols-3 gap-[0.4vw] flex-1">
            <AxisInput
              axis="X"
              value={radToDeg(transformValues?.rotation?.x)}
              onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "x", v)}
              step={1}
            />
            <AxisInput
              axis="Y"
              value={radToDeg(transformValues?.rotation?.y)}
              onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "y", v)}
              step={1}
            />
            <AxisInput
              axis="Z"
              value={radToDeg(transformValues?.rotation?.z)}
              onChange={(v) => onManualTransformChange && onManualTransformChange("rotation", "z", v)}
              step={1}
            />
          </div>
        </div>

        {/* Scale */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.2vw] w-[4.5vw]">
            <span className="text-[0.78vw] font-bold text-gray-800">Scale</span>
            <button
              type="button"
              onClick={() => setIsUniformScale(!isUniformScale)}
              className={`p-[0.15vw] rounded transition-colors cursor-pointer ${
                isUniformScale ? "text-[#ea543a]" : "text-gray-400 hover:text-gray-600"
              }`}
              title={isUniformScale ? "All axes linked" : "Individual axes"}
            >
              <Icon icon={isUniformScale ? "solar:link-bold" : "solar:link-broken-linear"} className="w-[0.85vw] h-[0.85vw]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-[0.4vw] flex-1">
            <AxisInput
              axis="X"
              value={transformValues?.scale?.x ?? 1}
              onChange={(v) => handleScaleChange("x", v)}
              step={0.05}
              min={0.01}
            />
            <AxisInput
              axis="Y"
              value={transformValues?.scale?.y ?? 1}
              onChange={(v) => handleScaleChange("y", v)}
              step={0.05}
              min={0.01}
            />
            <AxisInput
              axis="Z"
              value={transformValues?.scale?.z ?? 1}
              onChange={(v) => handleScaleChange("z", v)}
              step={0.05}
              min={0.01}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelPanel;
