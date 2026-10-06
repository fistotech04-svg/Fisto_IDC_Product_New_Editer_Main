import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../../CustomizedEditor/AppearanceShared";

export const getDocumentInfo = (w, h) => {
  const roundedW = Math.round(w || 210);
  const roundedH = Math.round(h || 297);
  const minDim = Math.min(roundedW, roundedH);
  const maxDim = Math.max(roundedW, roundedH);

  let formatName = 'Custom Sheet';
  if (Math.abs(minDim - 210) <= 3 && Math.abs(maxDim - 297) <= 3) {
    formatName = 'A4';
  } else if (Math.abs(minDim - 297) <= 3 && Math.abs(maxDim - 420) <= 3) {
    formatName = 'A3';
  } else if (Math.abs(minDim - 148) <= 3 && Math.abs(maxDim - 210) <= 3) {
    formatName = 'A5';
  } else if (Math.abs(minDim - 216) <= 3 && Math.abs(maxDim - 279) <= 3) {
    formatName = 'Letter';
  } else if (Math.abs(minDim - 216) <= 3 && Math.abs(maxDim - 356) <= 3) {
    formatName = 'Legal';
  } else if (Math.abs(minDim - 99) <= 3 && Math.abs(maxDim - 210) <= 3) {
    formatName = 'DL';
  } else if (Math.abs(roundedW - roundedH) <= 3) {
    formatName = 'Square';
  }

  let orientationName = 'Portrait';
  if (roundedW > roundedH) {
    orientationName = 'Landscape';
  } else if (roundedW === roundedH) {
    orientationName = 'Square';
  }

  return {
    format: formatName,
    orientation: orientationName,
    dimensions: `${roundedW} x ${roundedH} mm`
  };
};

const DEFAULT_PRESET_COLORS = [
  '#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
];

const PageProperties = ({
  pages,
  overlay,
  activePageIndex,
  updateElementAttribute,
  baseWidth,
  baseHeight,
  presetColors = DEFAULT_PRESET_COLORS
}) => {
  const [isPageBgPickerOpen, setIsPageBgPickerOpen] = useState(false);

  let effectiveOverlay = overlay;
  if (!effectiveOverlay && pages && pages[activePageIndex]) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(pages[activePageIndex]?.html || '', 'image/svg+xml');
      effectiveOverlay = doc.querySelector('[data-name="Overlay"]');
    } catch (e) {
      console.error('Error parsing overlay in PageProperties', e);
    }
  }

  const currentBg = effectiveOverlay?.getAttribute('fill') || '#ffffff';
  const fillType = effectiveOverlay?.getAttribute('fill-type') || 'solid';

  let currentBgStr = currentBg;
  if (fillType === 'gradient' || currentBg.toLowerCase().includes('url(#')) {
    const stopsJson = effectiveOverlay?.getAttribute('fill-stops');
    const stops = stopsJson ? JSON.parse(stopsJson) : [];
    const gType = effectiveOverlay?.getAttribute('fill-gradient-type') || 'linear';
    if (stops.length > 0) {
      currentBgStr = generateGradientString(
        gType.charAt(0).toUpperCase() + gType.slice(1),
        stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
        parseInt(effectiveOverlay?.getAttribute('fill-angle') || '0', 10),
        parseInt(effectiveOverlay?.getAttribute('fill-radius') || '100', 10)
      );
    }
  }

  const info = getDocumentInfo(baseWidth, baseHeight);

  return (
    <div className="flex flex-col gap-[3vh]">
      {/* Page Background Section */}
      <div className="flex flex-col gap-[1.5vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
            Page Background
          </span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>

        <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm">
          <div className="flex items-center justify-between mb-[1.5vh]">
            <span className="text-[0.75vw] text-gray-500 font-medium">Background Color</span>
            <div
              className="flex items-center gap-[0.5vw] cursor-pointer hover:bg-gray-50 p-[0.3vw] rounded-[0.4vw] transition-colors"
              onClick={() => setIsPageBgPickerOpen(!isPageBgPickerOpen)}
            >
              <div className="w-[1.2vw] h-[1.2vw] rounded-full border border-gray-200 shadow-inner flex-shrink-0" style={{ background: currentBgStr }} />
              <span className="text-[0.7vw] font-mono text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[8vw]">
                {currentBgStr.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-[0.4vw]">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  updateElementAttribute(activePageIndex, 'Overlay', {
                    'fill-type': 'solid',
                    'fill': color
                  });
                }}
                className={`w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-100 transition-all hover:scale-110 shadow-sm ${currentBg.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-blue-500 scale-110 z-10 ring-offset-1' : 'hover:z-10'}`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {isPageBgPickerOpen && createPortal(
            <div
              className="fixed z-[5000]"
              style={{
                top: '50%',
                right: '19.5vw',
                transform: 'translateY(-50%)'
              }}
            >
              <div className="animate-in fade-in zoom-in-95 duration-200 relative">
                <ColorPicker
                  color={currentBgStr}
                  onChange={(newVal) => {
                    if (newVal.includes('gradient')) {
                      const parsed = parseGradient(newVal);
                      if (parsed) {
                        updateElementAttribute(activePageIndex, 'Overlay', {
                          'fill-type': 'gradient',
                          'fill-gradient-type': parsed.type.toLowerCase(),
                          'fill-stops': JSON.stringify(parsed.stops.map(s => ({
                            color: s.color,
                            offset: s.offset,
                            opacity: s.opacity / 100
                          }))),
                          'fill-angle': (parsed.angle || 0).toString(),
                          'fill-radius': (parsed.radius || 100).toString(),
                          'fill': newVal
                        });
                      }
                    } else {
                      updateElementAttribute(activePageIndex, 'Overlay', {
                        'fill-type': 'solid',
                        'fill': newVal
                      });
                    }
                  }}
                  opacity={100}
                  onClose={() => setIsPageBgPickerOpen(false)}
                />
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Document Info Section */}
      <div className="flex flex-col gap-[1.5vh]">
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Document info</span>
          <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
        </div>
        <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1vh]">
          <div className="flex justify-between items-center text-[0.75vw]">
            <span className="text-gray-500 font-medium">Format</span>
            <span className="text-gray-900 font-semibold">{info.format}</span>
          </div>
          <div className="flex justify-between items-center text-[0.75vw]">
            <span className="text-gray-500 font-medium">Orientation</span>
            <span className="text-gray-900 font-semibold">{info.orientation}</span>
          </div>
          <div className="flex justify-between items-center text-[0.75vw]">
            <span className="text-gray-500 font-medium">Dimensions</span>
            <span className="text-gray-900 font-semibold">{info.dimensions}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageProperties;
