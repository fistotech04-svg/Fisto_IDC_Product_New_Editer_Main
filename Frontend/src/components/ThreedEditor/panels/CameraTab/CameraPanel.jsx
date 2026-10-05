import React from "react";
import { SliderRow } from "../common/PanelInputs";
import CameraSnapshotSection from "../../Components/CameraSnapshotSection";

export function CameraPanel({
  materialSettings,
  onUpdateMaterialSetting,
  onCaptureSnapshot,
  modelName = "Model",
  hasModel = true
}) {
  return (
    <div className="flex flex-col gap-[1vw]">
      <div className="flex flex-col gap-[0.75vw]">
        <SliderRow
          label="FOV (Field of View)"
          value={materialSettings?.fov ?? 45}
          onChange={(v) => onUpdateMaterialSetting && onUpdateMaterialSetting("fov", v)}
        />
      </div>

      {/* Camera Snapshot & Multi-format Export with Card View & Custom Background */}
      <CameraSnapshotSection
        onCaptureSnapshot={onCaptureSnapshot}
        modelName={modelName}
        disabled={!hasModel}
      />
    </div>
  );
}

export default CameraPanel;
