import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

export function SliderRow({ label, value = 50, onChange }) {
  const numVal = Math.round(Number(value) || 0);

  return (
    <div className="flex items-center justify-between gap-[0.6vw]">
      <div className="flex items-center gap-[0.2vw] w-[5.5vw] shrink-0">
        <span className="text-[0.75vw] font-semibold text-gray-700">{label}</span>
        <Icon icon="heroicons:chevron-down-20-solid" className="w-[0.7vw] h-[0.7vw] text-gray-400" />
      </div>

      <div className="flex-1 relative flex items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={numVal}
          onChange={(e) => onChange && onChange(Number(e.target.value))}
          className="w-full h-[0.25vw] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ea543a]"
        />
      </div>

      <span className="text-[0.72vw] font-bold text-gray-700 w-[2vw] text-right shrink-0">
        {numVal}%
      </span>
    </div>
  );
}

export function AxisInput({ axis, value = 0, onChange, step = 0.1, min, max, className = "" }) {
  const [isFocused, setIsFocused] = useState(false);
  const [textVal, setTextVal] = useState(() => {
    const num = Number(value) || 0;
    return String(Math.round(num * 100) / 100);
  });

  // Sync external changes when not actively typing
  useEffect(() => {
    if (!isFocused) {
      const num = Number(value) || 0;
      setTextVal(String(Math.round(num * 100) / 100));
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const val = e.target.value;
    setTextVal(val);
    if (val === "" || val === "-" || val === "." || val === "-.") return;
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && isFinite(parsed)) {
      onChange && onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = parseFloat(textVal);
    if (isNaN(parsed) || !isFinite(parsed)) {
      parsed = Number(value) || 0;
    }
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    const formatted = String(Math.round(parsed * 100) / 100);
    setTextVal(formatted);
    onChange && onChange(parsed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(textVal) || 0;
      const inc = e.shiftKey ? (step * 10) : step;
      let nextVal = Math.round((current + inc) * 100) / 100;
      if (max !== undefined) nextVal = Math.min(max, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(textVal) || 0;
      const dec = e.shiftKey ? (step * 10) : step;
      let nextVal = Math.round((current - dec) * 100) / 100;
      if (min !== undefined) nextVal = Math.max(min, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    }
  };

  // Mouse drag-scrub on axis label (X, Y, Z)
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartValRef = useRef(0);

  const handleLabelPointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartValRef.current = parseFloat(textVal) || Number(value) || 0;

    const onPointerMove = (ev) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartXRef.current;
      const multiplier = ev.shiftKey ? 0.02 : 0.05;
      const change = dx * multiplier * (step || 0.1);
      let nextVal = Math.round((dragStartValRef.current + change) * 100) / 100;
      if (min !== undefined) nextVal = Math.max(min, nextVal);
      if (max !== undefined) nextVal = Math.min(max, nextVal);
      setTextVal(String(nextVal));
      onChange && onChange(nextVal);
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      className={`flex items-center bg-[#f4f5f7] rounded-[0.45vw] px-[0.4vw] py-[0.3vw] transition-all min-w-0 ${
        isFocused ? "ring-1 ring-[#ea543a] bg-white border border-[#ea543a]" : "hover:bg-[#ebedf1]"
      } ${className}`}
    >
      <span
        onPointerDown={handleLabelPointerDown}
        title="Drag horizontally to scrub value"
        className="text-[0.68vw] font-semibold text-gray-400 hover:text-[#ea543a] w-[0.85vw] text-center cursor-ew-resize select-none shrink-0"
      >
        {axis}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={textVal}
        onFocus={() => setIsFocused(true)}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-right text-[0.74vw] font-medium text-gray-900 bg-transparent outline-none pl-[0.1vw] pr-[0.1vw] min-w-0"
      />
    </div>
  );
}

export function DualAxisInput({
  label,
  xVal = 210,
  yVal = 210,
  onChangeX,
  onChangeY,
  isLinked = true,
  onToggleLink,
  step = 1,
  min,
  max
}) {
  return (
    <div className="flex items-center justify-between gap-[0.4vw]">
      <span className="text-[0.75vw] font-medium text-gray-800 w-[3.5vw] shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center gap-[0.4vw]">
        <div className="flex-1">
          <AxisInput
            axis="X"
            value={xVal}
            onChange={(v) => {
              onChangeX && onChangeX(v);
              if (isLinked && onChangeY) onChangeY(v);
            }}
            step={step}
            min={min}
            max={max}
          />
        </div>
        <button
          type="button"
          onClick={onToggleLink}
          className={`p-[0.2vw] transition-transform hover:scale-110 active:scale-95 cursor-pointer shrink-0 ${
            isLinked ? "text-gray-700" : "text-gray-300 hover:text-gray-500"
          }`}
          title={isLinked ? "Linked proportions" : "Unlinked proportions"}
        >
          <Icon icon={isLinked ? "solar:link-bold" : "solar:link-broken-linear"} className="w-[0.9vw] h-[0.9vw]" />
        </button>
        <div className="flex-1">
          <AxisInput
            axis="Y"
            value={yVal}
            onChange={(v) => {
              onChangeY && onChangeY(v);
              if (isLinked && onChangeX) onChangeX(v);
            }}
            step={step}
            min={min}
            max={max}
          />
        </div>
      </div>
    </div>
  );
}
