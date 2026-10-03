import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import ColorPicker from "../ColorPicker";

export default function CameraSnapshotSection({
  onCaptureSnapshot,
  modelName = "Model",
  disabled = false
}) {
  // Snapshot cards state
  const [snapshots, setSnapshots] = useState([]);
  // Multi-select state: Set of selected snapshot IDs
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Background Options: 'transparent' | 'solid' | 'customImage'
  const [bgType, setBgType] = useState("transparent");
  const [solidColor, setSolidColor] = useState("#FFFFFF");
  const [bgOpacity, setBgOpacity] = useState(100);
  const [customImage, setCustomImage] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 100, right: 360 });

  // Export format: 'png' | 'jpg' | 'pdf'
  const [exportFormat, setExportFormat] = useState("png");

  // File input ref
  const fileInputRef = useRef(null);

  // Preset swatches for solid background
  const solidColorPresets = [
    { name: "White", value: "#FFFFFF" },
    { name: "Light Gray", value: "#F3F4F6" },
    { name: "Studio Gray", value: "#9CA3AF" },
    { name: "Dark Slate", value: "#1F2937" },
    { name: "Deep Black", value: "#0B0F19" },
    { name: "Warm Cream", value: "#FEF3C7" },
  ];

  // Handle custom image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImage(event.target.result);
      setBgType("customImage");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Trigger snapshot capture
  const handleCapture = async () => {
    if (!onCaptureSnapshot || isCapturing || disabled) return;
    setIsCapturing(true);

    try {
      const dataUrl = await onCaptureSnapshot({
        bgType,
        solidColor,
        bgOpacity,
        customImage
      });

      if (dataUrl) {
        const newSnapshot = {
          id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          dataUrl,
          bgType,
          solidColor,
          bgOpacity,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          dateStr: new Date().toISOString().slice(0, 10),
          aspectRatio: "1:1"
        };

        setSnapshots((prev) => [newSnapshot, ...prev]);
        // Automatically select the new capture
        setSelectedSnapshotIds((prev) => new Set([...prev, newSnapshot.id]));
      }
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Multi-select toggle handler
  const handleToggleCardSelection = (e, id) => {
    e.stopPropagation();
    setSelectedSnapshotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all or Deselect all
  const handleSelectAllToggle = () => {
    if (selectedSnapshotIds.size === snapshots.length) {
      setSelectedSnapshotIds(new Set());
    } else {
      setSelectedSnapshotIds(new Set(snapshots.map((s) => s.id)));
    }
  };

  // Delete snapshot card
  const handleDeleteSnapshot = (e, id) => {
    e.stopPropagation();
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setSelectedSnapshotIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Delete all selected snapshots
  const handleDeleteSelected = () => {
    if (selectedSnapshotIds.size === 0) return;
    setSnapshots((prev) => prev.filter((s) => !selectedSnapshotIds.has(s.id)));
    setSelectedSnapshotIds(new Set());
  };

  // Helper to load image as HTMLImageElement
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper to process a snapshot image into format data (Blob/dataURL)
  const processSnapshotToCanvas = async (snap, targetFormat) => {
    const img = await loadImage(snap.dataUrl);
    const w = img.naturalWidth || img.width || 1920;
    const h = img.naturalHeight || img.height || 1080;

    const offCanvas = document.createElement("canvas");
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext("2d");

    if (targetFormat === "jpg" || targetFormat === "pdf") {
      offCtx.fillStyle = snap.bgType === "solid" ? snap.solidColor : "#FFFFFF";
      offCtx.fillRect(0, 0, w, h);
    }
    offCtx.drawImage(img, 0, 0, w, h);

    return { canvas: offCanvas, width: w, height: h };
  };

  // Export selected snapshot(s)
  const handleExport = async () => {
    const selectedList = snapshots.filter((s) => selectedSnapshotIds.has(s.id));
    if (selectedList.length === 0 || isExporting) return;

    setIsExporting(true);
    const cleanName = (modelName || "model").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const timestamp = Date.now();

    try {
      if (selectedList.length === 1) {
        // Single export flow
        const targetSnap = selectedList[0];
        const filename = `${cleanName}_snapshot_${timestamp}`;

        if (exportFormat === "pdf") {
          const { canvas, width, height } = await processSnapshotToCanvas(targetSnap, "pdf");
          const orientation = width >= height ? "l" : "p";
          const pdf = new jsPDF({
            orientation,
            unit: "px",
            format: [width, height]
          });
          const pdfDataUrl = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(pdfDataUrl, "JPEG", 0, 0, width, height);
          pdf.save(`${filename}.pdf`);
        } else if (exportFormat === "jpg") {
          const { canvas } = await processSnapshotToCanvas(targetSnap, "jpg");
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = `${filename}.jpg`;
          link.click();
        } else {
          // PNG (preserves transparency)
          const link = document.createElement("a");
          link.href = targetSnap.dataUrl;
          link.download = `${filename}.png`;
          link.click();
        }
      } else {
        // Multi-image export flow
        if (exportFormat === "pdf") {
          // Combine all selected into a multi-page PDF
          let pdf = null;
          for (let i = 0; i < selectedList.length; i++) {
            const snap = selectedList[i];
            const { canvas, width, height } = await processSnapshotToCanvas(snap, "pdf");
            const orientation = width >= height ? "l" : "p";
            const pageDataUrl = canvas.toDataURL("image/jpeg", 0.95);

            if (i === 0) {
              pdf = new jsPDF({
                orientation,
                unit: "px",
                format: [width, height]
              });
              pdf.addImage(pageDataUrl, "JPEG", 0, 0, width, height);
            } else {
              pdf.addPage([width, height], orientation);
              pdf.addImage(pageDataUrl, "JPEG", 0, 0, width, height);
            }
          }
          if (pdf) {
            pdf.save(`${cleanName}_snapshots_${selectedList.length}_pages_${timestamp}.pdf`);
          }
        } else {
          // PNG or JPG: Package into ZIP bundle
          const zip = new JSZip();
          const folder = zip.folder(`${cleanName}_snapshots`);

          for (let i = 0; i < selectedList.length; i++) {
            const snap = selectedList[i];
            const itemNum = selectedList.length - i;
            if (exportFormat === "jpg") {
              const { canvas } = await processSnapshotToCanvas(snap, "jpg");
              const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
              const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
              folder.file(`${cleanName}_shot_${itemNum}.jpg`, base64Data, { base64: true });
            } else {
              const base64Data = snap.dataUrl.replace(/^data:image\/png;base64,/, "");
              folder.file(`${cleanName}_shot_${itemNum}.png`, base64Data, { base64: true });
            }
          }

          const content = await zip.generateAsync({ type: "blob" });
          const zipUrl = URL.createObjectURL(content);
          const link = document.createElement("a");
          link.href = zipUrl;
          link.download = `${cleanName}_snapshots_${exportFormat.toUpperCase()}_bundle_${timestamp}.zip`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);
        }
      }
    } catch (err) {
      console.error("Multi-export snapshot failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = selectedSnapshotIds.size;
  const isAllSelected = snapshots.length > 0 && selectedCount === snapshots.length;

  return (
    <div className="flex flex-col gap-[0.8vw] pt-[0.4vw]">
      {/* ───── SECTION TITLE & CAPTURE ACTION ───── */}
      <div className="flex flex-col gap-[0.3vw]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[0.4vw]">
            <Icon icon="solar:camera-bold-duotone" className="w-[1.1vw] h-[1.1vw] text-[#ea543a]" />
            <span className="text-[0.82vw] font-bold text-gray-800">Camera Snapshot</span>
          </div>
          <span className="text-[0.62vw] font-medium text-gray-400">
            {snapshots.length} captured
          </span>
        </div>
        <p className="text-[0.62vw] text-gray-500 leading-relaxed">
          Capture high-resolution snapshots with custom backdrops and batch export in PNG, JPG, or PDF.
        </p>
      </div>

      {/* ───── BACKGROUND CONFIGURATION ───── */}
      <div className="flex flex-col gap-[0.6vw] p-[0.7vw] bg-gray-50/80 rounded-[0.6vw] border border-gray-200/80">
        <span className="text-[0.72vw] font-bold text-gray-800">Snapshot Background</span>
        
        {/* Background Type Selector Tabs */}
        <div className="flex items-center p-[0.2vw] bg-gray-200/70 rounded-[0.5vw] gap-[0.2vw]">
          <button
            type="button"
            onClick={() => {
              setBgType("transparent");
              setShowColorPicker(false);
            }}
            className={`flex-1 py-[0.4vw] text-[0.64vw] font-bold rounded-[0.4vw] transition-all cursor-pointer flex items-center justify-center gap-[0.2vw] whitespace-nowrap overflow-hidden ${
              bgType === "transparent"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon icon="solar:check-circle-line-duotone" className="w-[0.75vw] h-[0.75vw] shrink-0" />
            <span className="truncate">Transparent</span>
          </button>
          
          <button
            type="button"
            onClick={() => setBgType("solid")}
            className={`flex-1 py-[0.4vw] text-[0.64vw] font-bold rounded-[0.4vw] transition-all cursor-pointer flex items-center justify-center gap-[0.2vw] whitespace-nowrap overflow-hidden ${
              bgType === "solid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon icon="solar:palette-round-line-duotone" className="w-[0.75vw] h-[0.75vw] shrink-0" />
            <span className="truncate">Solid</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBgType("customImage");
              setShowColorPicker(false);
            }}
            className={`flex-1 py-[0.4vw] text-[0.64vw] font-bold rounded-[0.4vw] transition-all cursor-pointer flex items-center justify-center gap-[0.2vw] whitespace-nowrap overflow-hidden ${
              bgType === "customImage"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon icon="solar:gallery-wide-line-duotone" className="w-[0.75vw] h-[0.75vw] shrink-0" />
            <span className="truncate">Image</span>
          </button>
        </div>

        {/* Dynamic Controls based on bgType */}
        {bgType === "transparent" && (
          <div className="flex items-center gap-[0.4vw] px-[0.5vw] py-[0.4vw] bg-white rounded-[0.4vw] border border-gray-200/60 text-[0.62vw] text-gray-500">
            <Icon icon="solar:info-circle-line-duotone" className="w-[0.9vw] h-[0.9vw] text-[#ea543a] shrink-0" />
            <span>Default transparent background (ideal for PNG cutouts).</span>
          </div>
        )}

        {bgType === "solid" && (
          <div className="flex flex-col gap-[0.5vw] pt-[0.2vw]">
            <div className="flex items-center gap-[0.35vw] flex-wrap">
              {solidColorPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSolidColor(preset.value)}
                  title={preset.name}
                  className={`w-[1.4vw] h-[1.4vw] rounded-full border transition-transform cursor-pointer hover:scale-110 relative ${
                    solidColor.toLowerCase() === preset.value.toLowerCase()
                      ? "ring-[0.15vw] ring-[#ea543a] ring-offset-[0.1vw] border-white"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}

              {/* Custom Color Button with customized ColorPicker popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const topPos = Math.min(window.innerHeight - 380, Math.max(10, rect.top - 60));
                    const rightPos = window.innerWidth - rect.left + 16;
                    setPickerPos({ top: topPos, right: rightPos });
                    setShowColorPicker(!showColorPicker);
                  }}
                  className={`w-[1.4vw] h-[1.4vw] rounded-full border border-dashed border-gray-400 flex items-center justify-center transition-all cursor-pointer hover:border-[#ea543a] hover:scale-110 ${
                    showColorPicker ? "ring-[0.15vw] ring-[#ea543a] ring-offset-[0.1vw]" : ""
                  }`}
                  title="Open customized color picker"
                >
                  <Icon icon="solar:pipette-bold" className="w-[0.8vw] h-[0.8vw] text-gray-700" />
                </button>
              </div>
            </div>

            {/* Current Color & Opacity Indicator */}
            <div className="flex items-center justify-between px-[0.5vw] py-[0.3vw] bg-white rounded-[0.4vw] border border-gray-200">
              <div className="flex items-center gap-[0.3vw]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const topPos = Math.min(window.innerHeight - 380, Math.max(10, rect.top - 60));
                    const rightPos = window.innerWidth - rect.left + 16;
                    setPickerPos({ top: topPos, right: rightPos });
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="w-[0.9vw] h-[0.9vw] rounded-full border border-gray-300 cursor-pointer shadow-xs hover:scale-105 transition-transform"
                  style={{ backgroundColor: solidColor, opacity: bgOpacity / 100 }}
                  title="Pick color & opacity"
                />
                <div className="flex items-center">
                  <span className="text-[0.62vw] text-gray-400 font-mono">#</span>
                  <input
                    type="text"
                    value={solidColor.replace("#", "").toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      setSolidColor(`#${val}`);
                    }}
                    className="w-[3.6vw] text-[0.65vw] font-mono font-bold text-gray-800 outline-none uppercase bg-transparent"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Opacity Value Badge */}
              <div className="flex items-center gap-[0.2vw] text-[0.62vw] font-semibold text-gray-500 bg-gray-50 px-[0.35vw] py-[0.1vw] rounded-[0.25vw] border border-gray-100">
                <span>Opacity:</span>
                <span className="font-bold text-gray-700">{bgOpacity}%</span>
              </div>
            </div>

            {/* Portal ColorPicker Popover floating freely beside the sidebar */}
            {showColorPicker && createPortal(
              <ColorPicker
                color={solidColor}
                onChange={(c) => setSolidColor(c)}
                opacity={bgOpacity}
                onOpacityChange={(op) => setBgOpacity(op)}
                onClose={() => setShowColorPicker(false)}
                style={{
                  position: "fixed",
                  top: pickerPos.top,
                  right: pickerPos.right,
                  zIndex: 9999
                }}
              />,
              document.body
            )}
          </div>
        )}

        {bgType === "customImage" && (
          <div className="flex flex-col gap-[0.4vw] pt-[0.2vw]">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {customImage ? (
              <div className="flex items-center justify-between p-[0.4vw] bg-white rounded-[0.4vw] border border-gray-200">
                <div className="flex items-center gap-[0.4vw] overflow-hidden">
                  <img
                    src={customImage}
                    alt="Custom backdrop"
                    className="w-[2vw] h-[2vw] rounded-[0.3vw] object-cover border border-gray-200"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[0.65vw] font-bold text-gray-800 truncate">Custom Backdrop</span>
                    <span className="text-[0.58vw] text-green-600 font-medium">Ready to composite</span>
                  </div>
                </div>
                <div className="flex items-center gap-[0.2vw]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-[0.3vw] text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Change image"
                  >
                    <Icon icon="solar:pen-bold" className="w-[0.8vw] h-[0.8vw]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomImage(null)}
                    className="p-[0.3vw] text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" className="w-[0.8vw] h-[0.8vw]" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-[0.8vw] px-[0.6vw] border border-dashed border-gray-300 hover:border-[#ea543a] bg-white hover:bg-orange-50/40 rounded-[0.5vw] flex flex-col items-center justify-center gap-[0.2vw] transition-all cursor-pointer group"
              >
                <Icon icon="solar:cloud-upload-linear" className="w-[1.2vw] h-[1.2vw] text-gray-400 group-hover:text-[#ea543a] transition-colors" />
                <span className="text-[0.68vw] font-bold text-gray-700 group-hover:text-[#ea543a]">
                  Upload Custom Backdrop Image
                </span>
                <span className="text-[0.58vw] text-gray-400">JPG, PNG, WebP supported</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ───── CAPTURE BUTTON ───── */}
      <button
        type="button"
        disabled={isCapturing || disabled}
        onClick={handleCapture}
        className={`w-full py-[0.55vw] rounded-[0.55vw] text-[0.78vw] font-bold text-white transition-all flex items-center justify-center gap-[0.4vw] shadow-[0_0.2vw_0.6vw_rgba(234,84,58,0.25)] cursor-pointer ${
          isCapturing || disabled
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : "bg-[#ea543a] hover:bg-[#d9442a] hover:shadow-[0_0.3vw_0.8vw_rgba(234,84,58,0.35)] active:scale-[0.99]"
        }`}
      >
        {isCapturing ? (
          <>
            <Icon icon="line-md:loading-twotone-loop" className="w-[0.9vw] h-[0.9vw]" />
            <span>Capturing 3D View...</span>
          </>
        ) : (
          <>
            <Icon icon="solar:camera-add-bold" className="w-[0.9vw] h-[0.9vw]" />
            <span>Capture Snapshot</span>
          </>
        )}
      </button>

      {/* ───── CAPTURED SNAPSHOTS GALLERY (CARD VIEW WITH MULTI-SELECT) ───── */}
      {snapshots.length > 0 && (
        <div className="flex flex-col gap-[0.6vw] pt-[0.4vw] border-t border-gray-100">
          {/* Gallery Header Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.4vw]">
              <span className="text-[0.72vw] font-bold text-gray-800">Gallery</span>
              <span className="text-[0.6vw] font-bold px-[0.4vw] py-[0.1vw] bg-gray-100 rounded-full text-gray-600">
                {selectedCount} / {snapshots.length} selected
              </span>
            </div>

            {/* Batch Selection Controls */}
            <div className="flex items-center gap-[0.4vw]">
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="text-[0.6vw] font-bold text-[#ea543a] hover:text-[#d9442a] transition-colors cursor-pointer"
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="text-[0.6vw] font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-[0.15vw]"
                  title="Delete selected snapshots"
                >
                  <Icon icon="solar:trash-bin-trash-bold" className="w-[0.7vw] h-[0.7vw]" />
                  <span>Delete ({selectedCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-[0.5vw] max-h-[16vw] overflow-y-auto pr-[0.2vw] custom-snapshot-scroll">
            {snapshots.map((snap, idx) => {
              const isSelected = selectedSnapshotIds.has(snap.id);
              return (
                <div
                  key={snap.id}
                  onClick={(e) => handleToggleCardSelection(e, snap.id)}
                  className={`group relative rounded-[0.55vw] border-[0.12vw] overflow-hidden bg-gray-50 transition-all cursor-pointer flex flex-col ${
                    isSelected
                      ? "border-[#ea543a] shadow-md ring-[0.15vw] ring-[#ea543a]/20"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  {/* Card Thumbnail Container */}
                  <div
                    className="relative aspect-video w-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb), linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)",
                      backgroundPosition: "0 0, 0.3vw 0.3vw",
                      backgroundSize: "0.6vw 0.6vw",
                      backgroundColor: "#FFFFFF"
                    }}
                  >
                    {/* Layer 1: Solid background with opacity */}
                    {snap.bgType === "solid" && (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: snap.solidColor || "#FFFFFF",
                          opacity: (snap.bgOpacity ?? 100) / 100
                        }}
                      />
                    )}

                    {/* Layer 2: Model Snapshot */}
                    <img
                      src={snap.dataUrl}
                      alt={`Snapshot ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200 relative z-10"
                    />

                    {/* Multi-Select Checkbox Badge */}
                    <div
                      className={`absolute top-[0.25vw] left-[0.25vw] w-[1.1vw] h-[1.1vw] rounded-[0.25vw] flex items-center justify-center transition-all shadow z-20 ${
                        isSelected
                          ? "bg-[#ea543a] text-white border border-[#ea543a]"
                          : "bg-black/40 border border-white/60 text-transparent group-hover:border-white"
                      }`}
                    >
                      <Icon icon="solar:check-read-bold" className="w-[0.75vw] h-[0.75vw]" />
                    </div>

                    {/* Delete Icon on Hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSnapshot(e, snap.id)}
                      className="absolute top-[0.25vw] right-[0.25vw] w-[1.1vw] h-[1.1vw] bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow z-20"
                      title="Delete snapshot"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" className="w-[0.65vw] h-[0.65vw]" />
                    </button>
                  </div>

                  {/* Card Footer Meta */}
                  <div className="p-[0.35vw] flex items-center justify-between bg-white text-[0.58vw] text-gray-500 border-t border-gray-100">
                    <span className="font-semibold text-gray-700 truncate">Shot #{snapshots.length - idx}</span>
                    <span className="font-mono text-gray-400">{snap.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ───── EXPORT ACTION BAR (For Selected Snapshot Cards) ───── */}
          {selectedCount > 0 ? (
            <div className="flex flex-col gap-[0.5vw] p-[0.7vw] bg-gray-50 rounded-[0.6vw] border border-gray-200 mt-[0.2vw]">
              <div className="flex items-center justify-between">
                <span className="text-[0.68vw] font-bold text-gray-800">
                  Export {selectedCount} Selected {selectedCount === 1 ? "Image" : "Images"}
                </span>
                <span className="text-[0.58vw] text-gray-500 uppercase font-mono">
                  {selectedCount === 1 ? "Single File" : exportFormat === "pdf" ? "Multi-page PDF" : "ZIP Archive"}
                </span>
              </div>

              {/* Format Buttons: PNG / JPG / PDF */}
              <div className="grid grid-cols-3 gap-[0.3vw]">
                {["png", "jpg", "pdf"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    className={`py-[0.35vw] text-[0.68vw] font-bold uppercase rounded-[0.4vw] border transition-all cursor-pointer ${
                      exportFormat === fmt
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExport}
                className={`w-full py-[0.48vw] rounded-[0.45vw] text-[0.72vw] font-bold text-white transition-all flex items-center justify-center gap-[0.35vw] shadow cursor-pointer ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black hover:shadow-md active:scale-[0.99]"
                }`}
              >
                {isExporting ? (
                  <>
                    <Icon icon="line-md:loading-twotone-loop" className="w-[0.8vw] h-[0.8vw]" />
                    <span>Preparing {exportFormat.toUpperCase()} ({selectedCount})...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:download-minimalistic-bold" className="w-[0.8vw] h-[0.8vw]" />
                    <span>
                      {selectedCount === 1
                        ? `Download as ${exportFormat.toUpperCase()}`
                        : exportFormat === "pdf"
                        ? `Export All (${selectedCount}) in Multi-page PDF`
                        : `Download All (${selectedCount}) in .ZIP (${exportFormat.toUpperCase()})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-[0.5vw] bg-gray-50 rounded-[0.4vw] border border-dashed border-gray-300 text-center text-[0.62vw] text-gray-500">
              Select one or more snapshot cards above to export.
            </div>
          )}
        </div>
      )}

      {/* Embedded scroll styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-snapshot-scroll::-webkit-scrollbar { width: 0.25vw; }
        .custom-snapshot-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-snapshot-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 1vw; }
        .custom-snapshot-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}} />
    </div>
  );
}
