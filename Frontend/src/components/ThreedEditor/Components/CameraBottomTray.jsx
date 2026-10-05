import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

export default function CameraBottomTray({
  snapshots = [],
  onDeleteSnapshot,
  onRenameSnapshot,
  onExportSnapshots,
  modelName = "Model",
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [quality, setQuality] = useState("Medium");
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [fileType, setFileType] = useState("PNG");
  const [isFileTypeOpen, setIsFileTypeOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const qualityDropdownRef = useRef(null);
  const fileTypeDropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-select latest snapshot or all by default if newly captured
  useEffect(() => {
    if (snapshots.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(snapshots.map((s) => s.id)));
    }
  }, [snapshots]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        qualityDropdownRef.current &&
        !qualityDropdownRef.current.contains(e.target)
      ) {
        setIsQualityOpen(false);
      }
      if (
        fileTypeDropdownRef.current &&
        !fileTypeDropdownRef.current.contains(e.target)
      ) {
        setIsFileTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartRename = (snap, e) => {
    e.stopPropagation();
    setEditingId(snap.id);
    setEditingTitle(snap.title || "Top Angle");
  };

  const handleSaveRename = (id) => {
    if (editingTitle.trim()) {
      onRenameSnapshot?.(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  // Helper to load image
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Internal export handler
  const handleExportClick = async () => {
    const toExport = snapshots.filter((s) => selectedIds.has(s.id));
    if (toExport.length === 0 || isExporting) return;

    if (onExportSnapshots) {
      onExportSnapshots({ selectedSnapshots: toExport, quality, fileType });
      return;
    }

    setIsExporting(true);
    const cleanName = (modelName || "model")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_");
    const timestamp = Date.now();
    const fmt = fileType.toLowerCase();

    try {
      if (toExport.length === 1) {
        const snap = toExport[0];
        const filename = `${cleanName}_${(snap.title || "angle").replace(/\s+/g, "_")}_${timestamp}`;

        if (fmt === "pdf") {
          const img = await loadImage(snap.dataUrl);
          const w = img.naturalWidth || 1920;
          const h = img.naturalHeight || 1080;
          const orientation = w >= h ? "l" : "p";
          const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
          pdf.addImage(snap.dataUrl, "PNG", 0, 0, w, h);
          pdf.save(`${filename}.pdf`);
        } else if (fmt === "jpg" || fmt === "jpeg") {
          const img = await loadImage(snap.dataUrl);
          const w = img.naturalWidth || 1920;
          const h = img.naturalHeight || 1080;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = snap.solidColor || "#FFFFFF";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = `${filename}.jpg`;
          link.click();
        } else {
          // PNG
          const link = document.createElement("a");
          link.href = snap.dataUrl;
          link.download = `${filename}.png`;
          link.click();
        }
      } else {
        // Multi-image export
        if (fmt === "pdf") {
          let pdf = null;
          for (let i = 0; i < toExport.length; i++) {
            const snap = toExport[i];
            const img = await loadImage(snap.dataUrl);
            const w = img.naturalWidth || 1920;
            const h = img.naturalHeight || 1080;
            const orientation = w >= h ? "l" : "p";
            if (i === 0) {
              pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
              pdf.addImage(snap.dataUrl, "PNG", 0, 0, w, h);
            } else {
              pdf.addPage([w, h], orientation);
              pdf.addImage(snap.dataUrl, "PNG", 0, 0, w, h);
            }
          }
          if (pdf) {
            pdf.save(`${cleanName}_saved_angles_${toExport.length}_pages_${timestamp}.pdf`);
          }
        } else {
          // Zip
          const zip = new JSZip();
          const folder = zip.folder(`${cleanName}_saved_angles`);
          for (let i = 0; i < toExport.length; i++) {
            const snap = toExport[i];
            const titleSlug = (snap.title || `angle_${i + 1}`).replace(/\s+/g, "_");
            if (fmt === "jpg" || fmt === "jpeg") {
              const img = await loadImage(snap.dataUrl);
              const w = img.naturalWidth || 1920;
              const h = img.naturalHeight || 1080;
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.fillStyle = snap.solidColor || "#FFFFFF";
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
              const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
              folder.file(`${titleSlug}_${i + 1}.jpg`, base64Data, { base64: true });
            } else {
              const base64Data = snap.dataUrl.replace(/^data:image\/png;base64,/, "");
              folder.file(`${titleSlug}_${i + 1}.png`, base64Data, { base64: true });
            }
          }
          const content = await zip.generateAsync({ type: "blob" });
          const zipUrl = URL.createObjectURL(content);
          const link = document.createElement("a");
          link.href = zipUrl;
          link.download = `${cleanName}_saved_angles_${fmt.toUpperCase()}_bundle_${timestamp}.zip`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);
        }
      }
    } catch (err) {
      console.error("Failed to export angle snapshots:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fb] border-t border-gray-200/90 px-[1.5vw] py-[0.85vw] flex flex-col gap-[0.8vw] shrink-0 font-sans select-none z-30">
      {/* ── TOP HEADER ROW ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-[1.1vw] font-bold text-gray-900 tracking-tight">
          Saved Angles Preview
        </h3>

        {/* Controls: Quality, Type, Export */}
        <div className="flex items-center gap-[1.2vw]">
          {/* Quality dropdown */}
          <div className="flex items-center gap-[0.55vw] relative" ref={qualityDropdownRef}>
            <span className="text-[0.8vw] font-medium text-gray-800">Quality</span>
            <button
              type="button"
              onClick={() => setIsQualityOpen((prev) => !prev)}
              className="flex items-center justify-between gap-[0.8vw] px-[0.75vw] py-[0.32vw] bg-white border border-gray-200 rounded-[0.45vw] text-[0.78vw] font-medium text-gray-700 min-w-[6.2vw] hover:border-gray-300 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{quality}</span>
              <Icon
                icon="heroicons:chevron-down-20-solid"
                className={`w-[0.85vw] h-[0.85vw] text-gray-400 transition-transform ${
                  isQualityOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isQualityOpen && (
              <div className="absolute right-0 top-full mt-[0.25vw] bg-white border border-gray-200 rounded-[0.45vw] shadow-lg z-50 py-[0.25vw] min-w-[6.5vw]">
                {["Low", "Medium", "High", "Ultra"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setQuality(q);
                      setIsQualityOpen(false);
                    }}
                    className={`w-full text-left px-[0.75vw] py-[0.3vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer ${
                      quality === q ? "font-bold text-[#ea543a]" : "text-gray-700"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type dropdown */}
          <div className="flex items-center gap-[0.55vw] relative" ref={fileTypeDropdownRef}>
            <span className="text-[0.8vw] font-medium text-gray-800">Type</span>
            <button
              type="button"
              onClick={() => setIsFileTypeOpen((prev) => !prev)}
              className="flex items-center justify-between gap-[0.8vw] px-[0.75vw] py-[0.32vw] bg-white border border-gray-200 rounded-[0.45vw] text-[0.78vw] font-medium text-gray-700 min-w-[5.4vw] hover:border-gray-300 transition-colors cursor-pointer shadow-2xs"
            >
              <span>{fileType}</span>
              <Icon
                icon="heroicons:chevron-down-20-solid"
                className={`w-[0.85vw] h-[0.85vw] text-gray-400 transition-transform ${
                  isFileTypeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isFileTypeOpen && (
              <div className="absolute right-0 top-full mt-[0.25vw] bg-white border border-gray-200 rounded-[0.45vw] shadow-lg z-50 py-[0.25vw] min-w-[5.5vw]">
                {["PNG", "JPG", "PDF"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFileType(t);
                      setIsFileTypeOpen(false);
                    }}
                    className={`w-full text-left px-[0.75vw] py-[0.3vw] text-[0.75vw] hover:bg-gray-50 transition-colors cursor-pointer ${
                      fileType === t ? "font-bold text-[#ea543a]" : "text-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            disabled={selectedIds.size === 0 || isExporting}
            onClick={handleExportClick}
            className={`flex items-center gap-[0.4vw] px-[1.2vw] py-[0.42vw] rounded-[0.45vw] text-[0.82vw] font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95 ${
              selectedIds.size === 0 || isExporting
                ? "bg-gray-300 cursor-not-allowed shadow-none"
                : "bg-[#ea543a] hover:bg-[#d9442a]"
            }`}
          >
            <Icon
              icon="solar:export-linear"
              className="w-[1vw] h-[1vw] stroke-2"
            />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── SNAPSHOT CARDS SCROLLABLE ROW ── */}
      <div className="relative flex items-center w-full min-h-[9vw]">
        {snapshots.length === 0 ? (
          <div className="w-full h-[9vw] rounded-[0.8vw] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-[0.4vw] text-gray-400">
            <Icon icon="solar:camera-outline" className="w-[1.8vw] h-[1.8vw] text-gray-300" />
            <span className="text-[0.78vw] font-medium">
              No saved angles yet. Click "Save Current Angle" on the canvas to add one.
            </span>
          </div>
        ) : (
          <>
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-[1.1vw] overflow-x-auto w-full py-[0.3vw] pr-[2.5vw] custom-bottom-scroll scroll-smooth"
            >
              {snapshots.map((snap) => {
                const isSelected = selectedIds.has(snap.id);
                const isEditing = editingId === snap.id;

                return (
                  <div
                    key={snap.id}
                    onClick={(e) => handleToggleSelect(snap.id, e)}
                    className="w-[12.5vw] shrink-0 bg-white rounded-[0.7vw] p-[0.6vw] shadow-[0_0.15vw_0.6vw_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col gap-[0.55vw] transition-all hover:shadow-[0_0.25vw_0.9vw_rgba(0,0,0,0.08)] cursor-pointer relative group"
                  >
                    {/* Image Preview Box with Selection Dot */}
                    <div className="w-full aspect-[4/3] rounded-[0.5vw] bg-[#fbfbfb] overflow-hidden relative flex items-center justify-center border border-gray-100">
                      {/* Selection Indicator Top-Right */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(snap.id, e)}
                        className="absolute top-[0.45vw] right-[0.45vw] z-10 w-[1.15vw] h-[1.15vw] flex items-center justify-center transition-transform active:scale-90"
                      >
                        {isSelected ? (
                          <div className="w-[1.1vw] h-[1.1vw] rounded-full bg-[#ea543a] flex items-center justify-center shadow-xs">
                            <Icon
                              icon="solar:check-read-bold"
                              className="w-[0.7vw] h-[0.7vw] text-white"
                            />
                          </div>
                        ) : (
                          <div className="w-[1.1vw] h-[1.1vw] rounded-full border-[1.5px] border-[#ea543a] bg-white/90 shadow-2xs" />
                        )}
                      </button>

                      {/* Delete Snapshot button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSnapshot?.(snap.id);
                        }}
                        className="absolute top-[0.45vw] left-[0.45vw] z-10 w-[1.1vw] h-[1.1vw] rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        title="Delete angle"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="w-[0.65vw] h-[0.65vw]" />
                      </button>

                      {/* Snapshot Image */}
                      <img
                        src={snap.dataUrl}
                        alt={snap.title || "Top Angle"}
                        className="w-full h-full object-contain pointer-events-none group-hover:scale-103 transition-transform duration-200"
                      />
                    </div>

                    {/* Footer Title & Rename Icon */}
                    <div className="flex items-center justify-between px-[0.2vw] pt-[0.1vw]">
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(snap.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(snap.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[0.78vw] font-semibold text-gray-800 bg-gray-50 border border-[#ea543a] rounded px-[0.3vw] py-[0.1vw] outline-none w-full mr-[0.3vw]"
                        />
                      ) : (
                        <span className="text-[0.78vw] font-semibold text-gray-800 truncate">
                          {snap.title || "Top Angle"}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleStartRename(snap, e)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-[0.2vw] cursor-pointer ml-[0.3vw] shrink-0"
                        title="Rename angle"
                      >
                        <Icon
                          icon="solar:pen-linear"
                          className="w-[0.9vw] h-[0.9vw] stroke-2"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Right Arrow Circle Button */}
            {snapshots.length > 3 && (
              <button
                type="button"
                onClick={handleScrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-[1.8vw] h-[1.8vw] rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-md flex items-center justify-center text-[#ea543a] transition-all cursor-pointer active:scale-90 z-20"
                title="Scroll next"
              >
                <Icon
                  icon="heroicons:arrow-right-20-solid"
                  className="w-[1.05vw] h-[1.05vw]"
                />
              </button>
            )}
          </>
        )}
      </div>

      <style>{`
        .custom-bottom-scroll::-webkit-scrollbar {
          height: 0.28vw;
        }
        .custom-bottom-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }
        .custom-bottom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
