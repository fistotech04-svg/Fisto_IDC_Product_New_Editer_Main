import React from "react";
import { Icon } from "@iconify/react";

export function HotspotsPanel({
  hotspots = [],
  activeHotspotId = null,
  onHotspotClick,
  onAddHotspot,
  onEditHotspot,
  onDeleteHotspot
}) {
  return (
    <div className="flex flex-col gap-[0.8vw]">
      {/* Hotspot Header */}
      <div className="flex items-center justify-between pb-[0.8vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <div className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] bg-[#ea543a]/10 flex items-center justify-center text-[#ea543a]">
            <Icon icon="solar:map-point-wave-bold-duotone" width="1vw" height="1vw" />
          </div>
          <div>
            <div className="flex items-center gap-[0.3vw]">
              <h4 className="text-[0.78vw] font-bold text-gray-900 leading-tight">Hotspots</h4>
              {hotspots.length > 0 && (
                <span className="text-[0.55vw] font-bold px-[0.35vw] py-[0.06vw] rounded-full bg-[#ea543a]/10 text-[#ea543a] border border-[#ea543a]/20">
                  {hotspots.length}
                </span>
              )}
            </div>
            <p className="text-[0.55vw] text-gray-500 leading-tight">
              Pin interactive points on 3D surface
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
          className="flex items-center gap-[0.3vw] px-[0.7vw] py-[0.35vw] rounded-[0.45vw] bg-[#ea543a] hover:bg-[#d9442a] text-white text-[0.7vw] font-bold shadow-sm shadow-[#ea543a]/20 active:scale-95 transition-all cursor-pointer"
          title="Click Add then click anywhere on model to place a pin"
        >
          <Icon icon="solar:add-circle-bold" width="0.85vw" height="0.85vw" />
          <span>Add Pin</span>
        </button>
      </div>

      {/* Hotspot items list */}
      <div className="space-y-[0.4vw]">
        {hotspots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-[1.5vw] text-center bg-gray-50/60 rounded-[0.6vw] border border-dashed border-gray-200">
            <Icon icon="solar:map-point-add-bold-duotone" width="1.6vw" height="1.6vw" className="text-gray-400 mb-[0.4vw]" />
            <p className="text-[0.72vw] font-bold text-gray-700">No Hotspots Added</p>
            <p className="text-[0.6vw] text-gray-400 max-w-[14vw] mb-[0.8vw]">
              Click "Add Pin" and click anywhere on the 3D model to place a label.
            </p>
            <button
              type="button"
              onClick={() => typeof onAddHotspot === 'function' && onAddHotspot()}
              className="px-[0.8vw] py-[0.35vw] rounded-[0.4vw] bg-[#ea543a] text-white text-[0.7vw] font-bold shadow-sm"
            >
              Place First Hotspot
            </button>
          </div>
        ) : (
          hotspots.map((hs, i) => {
            const hsId = hs.id || `hs_${i}`;
            const isAct = activeHotspotId != null && (
              String(activeHotspotId) === String(hs.id) ||
              String(activeHotspotId) === String(hsId) ||
              activeHotspotId === i
            );
            return (
              <div
                key={hsId}
                onClick={() => typeof onHotspotClick === 'function' && onHotspotClick(hs)}
                className={`flex items-center gap-[0.5vw] p-[0.6vw] rounded-[0.55vw] border cursor-pointer transition-all ${
                  isAct
                    ? "bg-[#ea543a]/10 border-[#ea543a] shadow-xs"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-[1.4vw] h-[1.4vw] rounded-full flex items-center justify-center text-[0.62vw] font-bold shrink-0 ${
                    isAct ? "bg-[#ea543a] text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[0.72vw] font-bold truncate text-gray-900 leading-tight">
                    {hs.label || `Hotspot ${i + 1}`}
                  </p>
                  <p className="text-[0.55vw] text-gray-400 truncate leading-tight mt-[0.05vw]">
                    Mesh: <span className="text-gray-600 font-medium">{hs.meshName || "Surface"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-[0.2vw] shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => typeof onEditHotspot === 'function' && onEditHotspot(hs)}
                    className="p-[0.25vw] rounded text-gray-400 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                    title="Edit Label"
                  >
                    <Icon icon="solar:pen-bold" width="0.75vw" height="0.75vw" />
                  </button>
                  <button
                    type="button"
                    onClick={() => typeof onDeleteHotspot === 'function' && onDeleteHotspot(hs.id || hsId)}
                    className="p-[0.25vw] rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Delete"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width="0.75vw" height="0.75vw" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HotspotsPanel;
