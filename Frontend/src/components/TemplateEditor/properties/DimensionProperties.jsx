import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getVisualBBox } from '../mainEditor/geometryUtils';

export const DimensionInput = ({ targetId, targetAttr, value, readOnly, onChange, className }) => {
  const [localVal, setLocalVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [liveVal, setLiveVal] = useState(null);

  useEffect(() => {
    if (!targetId || readOnly) {
      setLiveVal(null);
      return;
    }

    let frameId;
    const poll = () => {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
      const el = editorDoc.getElementById(targetId);
      if (el && typeof el.getBBox === 'function') {
        try {
          let bbox;
          if (el.getAttribute('data-is-hotspot') === 'true') {
            bbox = { x: 0, y: 0, width: 52, height: 52 };
          } else {
            bbox = getVisualBBox(el);
          }
          let rawVal = 0;
          let m = [1, 0, 0, 1, 0, 0];
          const transform = el.getAttribute('transform');
          if (transform) {
            try {
              const domM = new DOMMatrix(transform);
              m = [domM.a, domM.b, domM.c, domM.d, domM.e, domM.f];
            } catch (_) {
              if (transform.includes('matrix')) {
                const match = transform.match(/matrix\(([^)]+)\)/);
                if (match) {
                  const parsedM = match[1].split(/[\s,]+/).map(parseFloat);
                  if (parsedM.length === 6) m = parsedM;
                }
              }
            }
          }

          if (targetAttr === 'width') rawVal = bbox.width * Math.abs(m[0]);
          else if (targetAttr === 'height') rawVal = bbox.height * Math.abs(m[3]);
          else if (targetAttr === 'x') rawVal = bbox.x * m[0] + (m[0] < 0 ? bbox.width * m[0] : 0) + m[4];
          else if (targetAttr === 'y') rawVal = bbox.y * m[3] + (m[3] < 0 ? bbox.height * m[3] : 0) + m[5];

          if (el.tagName === 'circle' && (!transform || !transform.includes('matrix'))) {
            const r = parseFloat(el.getAttribute('r')) || 0;
            if (targetAttr === 'width' || targetAttr === 'height') rawVal = r * 2;
            else if (targetAttr === 'x') rawVal = (parseFloat(el.getAttribute('cx')) || 0) - r;
            else if (targetAttr === 'y') rawVal = (parseFloat(el.getAttribute('cy')) || 0) - r;
          }

          const finalLiveVal = Number(rawVal.toFixed(1)).toString();

          setLiveVal((prev) => (prev !== finalLiveVal ? finalLiveVal : prev));
        } catch { /* ignore */ }
      } else {
        setLiveVal(null);
      }
      frameId = requestAnimationFrame(poll);
    };
    poll();
    return () => cancelAnimationFrame(frameId);
  }, [targetId, targetAttr, readOnly]);

  const displayValue = isEditing ? localVal : (liveVal !== null ? liveVal : value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      return;
    }
    const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    if (e.key === '-' && (targetAttr === 'x' || targetAttr === 'y')) {
      if (e.target.value.includes('-')) e.preventDefault();
      return;
    }
    if (e.key === '.') {
      if (e.target.value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (targetAttr === 'x' || targetAttr === 'y') {
      val = val.replace(/[^0-9.-]/g, '');
    } else {
      val = val.replace(/[^0-9.]/g, '');
    }
    setLocalVal(val);
  };

  return (
    <input
      className={className}
      value={displayValue}
      readOnly={readOnly}
      disabled={readOnly}
      tabIndex={readOnly ? -1 : 0}
      onFocus={() => {
        if (readOnly) return;
        setIsEditing(true);
        setLocalVal(displayValue);
      }}
      onBlur={() => {
        if (readOnly) return;
        setIsEditing(false);
        if (localVal !== '' && localVal !== (liveVal !== null ? liveVal : value).toString()) {
          onChange(localVal);
        }
      }}
      onChange={(e) => {
        if (readOnly) return;
        handleChange(e);
      }}
      onKeyDown={(e) => {
        if (readOnly) return;
        handleKeyDown(e);
      }}
    />
  );
};

const DimensionProperties = ({
  selectedLayerId,
  selectedElementProps,
  isDimensionDisabled,
  updatePosition,
  updateDimensionWithScale,
  convertValue,
  flipbookDimensions
}) => {
  return (
    <div className="bg-white px-[1.5vw] pt-[1.4vw] pb-[0.85vw] border-b border-gray-100 flex-shrink-0">
      <div className="space-y-[0.8vw]">
        <div className="flex flex-col gap-[1vw]">
          {/* Position Row */}
          <div className="flex items-center gap-[2vw]">
            <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Position :</span>
            <div className="flex items-center gap-[1.5vw]">
              {/* X Input */}
              <div className="flex items-center gap-[0.2vw]">
                {!isDimensionDisabled ? (
                  <ChevronLeft
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.x || 0) - 1;
                      updatePosition(val.toString(), 'x');
                    }}
                  />
                ) : (
                  <ChevronLeft size="0.85vw" className="text-transparent" />
                )}
                <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">X</span>
                  <DimensionInput
                    targetId={selectedLayerId}
                    targetAttr="x"
                    className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                    value={convertValue(selectedElementProps?.x || 0)}
                    readOnly={isDimensionDisabled}
                    onChange={(val) => updatePosition(val, 'x')}
                  />
                </div>
                {!isDimensionDisabled ? (
                  <ChevronRight
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.x || 0) + 1;
                      updatePosition(val.toString(), 'x');
                    }}
                  />
                ) : (
                  <ChevronRight size="0.85vw" className="text-transparent" />
                )}
              </div>

              {/* Y Input */}
              <div className="flex items-center gap-[0.2vw]">
                {!isDimensionDisabled ? (
                  <ChevronLeft
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.y || 0) - 1;
                      updatePosition(val.toString(), 'y');
                    }}
                  />
                ) : (
                  <ChevronLeft size="0.85vw" className="text-transparent" />
                )}
                <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">Y</span>
                  <DimensionInput
                    targetId={selectedLayerId}
                    targetAttr="y"
                    className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                    value={convertValue(selectedElementProps?.y || 0)}
                    readOnly={isDimensionDisabled}
                    onChange={(val) => updatePosition(val, 'y')}
                  />
                </div>
                {!isDimensionDisabled ? (
                  <ChevronRight
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.y || 0) + 1;
                      updatePosition(val.toString(), 'y');
                    }}
                  />
                ) : (
                  <ChevronRight size="0.85vw" className="text-transparent" />
                )}
              </div>
            </div>
          </div>

          {/* Resizing Row */}
          <div className="flex items-center gap-[2vw]">
            <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Resizing :</span>
            <div className="flex items-center gap-[1.5vw]">
              {/* W Input */}
              <div className="flex items-center gap-[0.2vw]">
                {!isDimensionDisabled ? (
                  <ChevronLeft
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.w || 0) - 1;
                      updateDimensionWithScale(val.toString(), 'width');
                    }}
                  />
                ) : (
                  <ChevronLeft size="0.85vw" className="text-transparent" />
                )}
                <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">W</span>
                  <DimensionInput
                    targetId={selectedLayerId}
                    targetAttr="width"
                    className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                    value={convertValue(selectedElementProps?.w || flipbookDimensions.width)}
                    readOnly={isDimensionDisabled}
                    onChange={(val) => updateDimensionWithScale(val, 'width')}
                  />
                </div>
                {!isDimensionDisabled ? (
                  <ChevronRight
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.w || 0) + 1;
                      updateDimensionWithScale(val.toString(), 'width');
                    }}
                  />
                ) : (
                  <ChevronRight size="0.85vw" className="text-transparent" />
                )}
              </div>

              {/* H Input */}
              <div className="flex items-center gap-[0.2vw]">
                {!isDimensionDisabled ? (
                  <ChevronLeft
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.h || 0) - 1;
                      updateDimensionWithScale(val.toString(), 'height');
                    }}
                  />
                ) : (
                  <ChevronLeft size="0.85vw" className="text-transparent" />
                )}
                <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${isDimensionDisabled ? 'bg-gray-50/50' : 'bg-white'}`}>
                  <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">H</span>
                  <DimensionInput
                    targetId={selectedLayerId}
                    targetAttr="height"
                    className={`w-full text-center outline-none text-[0.85vw] font-semibold ${isDimensionDisabled ? 'text-gray-400 cursor-not-allowed bg-transparent' : 'text-[#111827] bg-white'}`}
                    value={convertValue(selectedElementProps?.h || flipbookDimensions.height)}
                    readOnly={isDimensionDisabled}
                    onChange={(val) => updateDimensionWithScale(val, 'height')}
                  />
                </div>
                {!isDimensionDisabled ? (
                  <ChevronRight
                    size="0.85vw"
                    className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors"
                    onClick={() => {
                      const val = parseFloat(selectedElementProps?.h || 0) + 1;
                      updateDimensionWithScale(val.toString(), 'height');
                    }}
                  />
                ) : (
                  <ChevronRight size="0.85vw" className="text-transparent" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DimensionProperties;
