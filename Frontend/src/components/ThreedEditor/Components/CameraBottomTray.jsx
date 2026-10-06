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
  const lastSelectedIdRef = useRef(null);

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

  const handleToggleSelect = (id, e, index) => {
    e.stopPropagation();
    const isShift = Boolean(e.shiftKey);

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (isShift && lastSelectedIdRef.current) {
        // Find range from last selected card to clicked card
        const lastIndex = snapshots.findIndex((s) => s.id === lastSelectedIdRef.current);
        const currentIndex = index !== undefined ? index : snapshots.findIndex((s) => s.id === id);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeItems = snapshots.slice(start, end + 1);

          // Standard multi-select behavior:
          // If the clicked card is already selected, unselect range; otherwise select range.
          const shouldSelect = !prev.has(id);
          rangeItems.forEach((snap) => {
            if (shouldSelect) {
              next.add(snap.id);
            } else {
              next.delete(snap.id);
            }
          });

          lastSelectedIdRef.current = id;
          return next;
        }
      }

      // Normal toggle single selection
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      lastSelectedIdRef.current = id;
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

  const isAllSelected = snapshots.length > 0 && selectedIds.size === snapshots.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < snapshots.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
      lastSelectedIdRef.current = null;
    } else {
      setSelectedIds(new Set(snapshots.map((s) => s.id)));
      lastSelectedIdRef.current = snapshots[snapshots.length - 1]?.id || null;
    }
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollability, { passive: true });
      window.addEventListener("resize", checkScrollability);
      return () => {
        el.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [snapshots]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: "smooth" });
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

  // Helper to render image with the card title badge burned onto the export
  const renderSnapshotWithTitle = async (snap, format = "png") => {
    const img = await loadImage(snap.dataUrl);
    const w = img.naturalWidth || 1920;
    const h = img.naturalHeight || 1080;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (format === "jpg" || format === "jpeg") {
      ctx.fillStyle = snap.solidColor || "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(img, 0, 0, w, h);

    const titleText = (snap.title || "").trim();
    if (titleText) {
      ctx.save();
      const fontSize = Math.max(26, Math.round(h * 0.038));
      ctx.font = `600 ${fontSize}px sans-serif`;
      const paddingX = Math.round(fontSize * 0.85);
      const paddingY = Math.round(fontSize * 0.45);
      const textMetrics = ctx.measureText(titleText);
      const textWidth = textMetrics.width;
      const badgeWidth = textWidth + paddingX * 2;
      const badgeHeight = fontSize + paddingY * 2;
      const margin = Math.round(h * 0.04);
      const badgeX = margin;
      const badgeY = h - margin - badgeHeight;
      const radius = Math.round(badgeHeight * 0.28);

      // Sleek rounded badge with backdrop
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "rgba(23, 32, 44, 0.85)";

      ctx.beginPath();
      ctx.moveTo(badgeX + radius, badgeY);
      ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
      ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
      ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
      ctx.lineTo(badgeX, badgeY + radius);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
      ctx.closePath();
      ctx.fill();

      // Card title text in white
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(titleText, badgeX + paddingX, badgeY + badgeHeight / 2 + 1);
      ctx.restore();
    }

    const mime = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
    const dataUrl = canvas.toDataURL(mime, 0.95);
    return { dataUrl, width: w, height: h };
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
        const rendered = await renderSnapshotWithTitle(snap, fmt);

        if (fmt === "pdf") {
          const orientation = rendered.width >= rendered.height ? "l" : "p";
          const pdf = new jsPDF({ orientation, unit: "px", format: [rendered.width, rendered.height] });
          pdf.addImage(rendered.dataUrl, "PNG", 0, 0, rendered.width, rendered.height);
          pdf.save(`${filename}.pdf`);
        } else if (fmt === "jpg" || fmt === "jpeg") {
          const link = document.createElement("a");
          link.href = rendered.dataUrl;
          link.download = `${filename}.jpg`;
          link.click();
        } else {
          // PNG
          const link = document.createElement("a");
          link.href = rendered.dataUrl;
          link.download = `${filename}.png`;
          link.click();
        }
      } else {
        // Multi-image export
        if (fmt === "pdf") {
          let pdf = null;
          for (let i = 0; i < toExport.length; i++) {
            const snap = toExport[i];
            const rendered = await renderSnapshotWithTitle(snap, "png");
            const orientation = rendered.width >= rendered.height ? "l" : "p";
            if (i === 0) {
              pdf = new jsPDF({ orientation, unit: "px", format: [rendered.width, rendered.height] });
              pdf.addImage(rendered.dataUrl, "PNG", 0, 0, rendered.width, rendered.height);
            } else {
              pdf.addPage([rendered.width, rendered.height], orientation);
              pdf.addImage(rendered.dataUrl, "PNG", 0, 0, rendered.width, rendered.height);
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
            const rendered = await renderSnapshotWithTitle(snap, fmt);
            const isJpg = fmt === "jpg" || fmt === "jpeg";
            const base64Data = rendered.dataUrl.replace(isJpg ? /^data:image\/jpeg;base64,/ : /^data:image\/png;base64,/, "");
            folder.file(`${titleSlug}_${i + 1}.${isJpg ? "jpg" : "png"}`, base64Data, { base64: true });
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
        <div className="flex items-center gap-[1vw]">
          <h3 className="text-[0.9vw] font-medium text-gray-900 tracking-normal">
            Saved Angles Preview
          </h3>

          {snapshots.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-[0.35vw] px-[0.6vw] py-[0.22vw] rounded-[0.4vw] bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer group"
              title={isAllSelected ? "Unselect all angles" : "Select all angles"}
            >
              {isAllSelected ? (
                <Icon
                  icon="ant-design:check-circle-filled"
                  className="w-[1vw] h-[1vw] text-[#EC5137]"
                />
              ) : isPartiallySelected ? (
                <Icon
                  icon="ant-design:minus-circle-filled"
                  className="w-[1vw] h-[1vw] text-[#EC5137]"
                />
              ) : (
                <div className="w-[0.9vw] h-[0.9vw] rounded-full border-[1.5px] border-gray-300 bg-white group-hover:border-gray-400" />
              )}
              <span className="text-[0.73vw] font-medium">
                {isAllSelected ? "Unselect All" : "Select All"}
              </span>
              <span className="text-[0.65vw] text-gray-400 font-semibold">
                ({selectedIds.size}/{snapshots.length})
              </span>
            </button>
          )}
        </div>

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
                      quality === q ? "font-bold text-[#EC5137]" : "text-gray-700"
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
                      fileType === t ? "font-bold text-[#EC5137]" : "text-gray-700"
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
                : "bg-[#EC5137] hover:bg-[#d9442a]"
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
            {/* Scroll Left Arrow Circle Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={handleScrollLeft}
                className="absolute left-[-0.6vw] top-1/2 -translate-y-1/2 w-[1.8vw] h-[1.8vw] rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-md flex items-center justify-center text-[#EC5137] transition-all cursor-pointer active:scale-90 z-20"
                title="Scroll previous"
              >
                <Icon
                  icon="heroicons:arrow-left-20-solid"
                  className="w-[1.05vw] h-[1.05vw]"
                />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className="flex items-center gap-[1.1vw] overflow-x-auto w-full py-[0.3vw] px-[0.2vw] custom-bottom-scroll scroll-smooth"
            >
              {snapshots.map((snap, index) => {
                const isSelected = selectedIds.has(snap.id);
                const isEditing = editingId === snap.id;

                return (
                  <div
                    key={snap.id}
                    onClick={(e) => handleToggleSelect(snap.id, e, index)}
                    className="w-[12.5vw] shrink-0 bg-white rounded-[0.7vw] p-[0.6vw] shadow-[0_0.15vw_0.6vw_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col gap-[0.55vw] transition-all hover:shadow-[0_0.25vw_0.9vw_rgba(0,0,0,0.08)] cursor-pointer relative group select-none"
                  >
                    {/* Image Preview Box with Selection Dot */}
                    <div className="w-full aspect-[4/3] rounded-[0.5vw] bg-[#fbfbfb] overflow-hidden relative flex items-center justify-center border border-gray-100">
                      {/* Selection Indicator Top-Right */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(snap.id, e, index)}
                        className="absolute top-[0.45vw] right-[0.45vw] z-10 w-[1.15vw] h-[1.15vw] flex items-center justify-center transition-transform active:scale-90"
                      >
                        {isSelected ? (
                          <Icon
                            icon="ant-design:check-circle-filled"
                            className="w-[1.25vw] h-[1.25vw] text-[#EC5137]"
                          />
                        ) : (
                          <div className="w-[1.1vw] h-[1.1vw] rounded-full border-[1.5px] border-gray-300 bg-white/90 shadow-2xs" />
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
                      {snap.dataUrl ? (
                        <img
                          src={snap.dataUrl}
                          alt={snap.title || "Angle"}
                          className="w-full h-full object-contain pointer-events-none group-hover:scale-103 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                          <Icon icon="solar:camera-broken" className="w-[1.6vw] h-[1.6vw]" />
                        </div>
                      )}
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
                          className="text-[0.78vw] font-semibold text-gray-800 bg-gray-50 border border-[#EC5137] rounded px-[0.3vw] py-[0.1vw] outline-none w-full mr-[0.3vw]"
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
                          icon="mdi:rename"
                          className="w-[0.95vw] h-[0.95vw]"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Right Arrow Circle Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={handleScrollRight}
                className="absolute right-[-0.6vw] top-1/2 -translate-y-1/2 w-[1.8vw] h-[1.8vw] rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-md flex items-center justify-center text-[#EC5137] transition-all cursor-pointer active:scale-90 z-20"
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
