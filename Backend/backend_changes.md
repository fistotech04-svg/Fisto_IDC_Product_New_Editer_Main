# Backend Changes Summary (September 30 – October 1, 2026)

This document summarizes the changes made to the backend codebase on the `sham` branch between **Wednesday, September 30, 2026** and **Thursday, October 1, 2026**.

---

## 1. Thursday, October 1, 2026 (Yesterday)

### Commit: `2e6f3ed` — *updated hdri, xray and save feature*
- **Database Models**:
  - `Backend/models/ThreedModel.js`: Added `hotspots` field (`type: Array, default: []`) to the schema to support 3D model hotspot annotations.
  - `Backend/models/InteractionThreedModel.js`: Added `hotspots` field (`type: Array, default: []`) to the schema to preserve hotspots associated with interactive flipbook models.
- **Routes & API Endpoints**:
  - `Backend/routes/User_Details/threed_models.js`:
    - Updated `/upload-chunk`: Parses incoming `hotspots` payload (supporting both JSON strings and objects/arrays) and persists it to both `ThreedModel` and corresponding `InteractionThreedModel`.
    - Added endpoint `POST /api/3d-models/save-hotspots`: Dedicated endpoint allowing the frontend to directly update and persist hotspot arrays by `modelId`.
    - Updated `GET /api/3d-models/get-models` and `GET /api/3d-models/get-model/:modelId`: Now include the `hotspots` array in the returned response data.
- **HDRI Assets**:
  - `Backend/hdri/`: Renamed and reorganized directories with clean, categorized names:
    - `Indoor_auditorium/`
    - `Indoor_hall/`
    - `Indoor_room/`
    - `Indoor_subway/`
    - `Night_outdoor/`
    - `Night_sky/`
    - `Night_sky_stars/`
    - `Night_street/`
- **Sample 3D Models**:
  - `Backend/uploads/fistotechnical02_gmail_com/3D_Modals/`:
    - Added `Blue Deluxe_double_door_attender_cot_8451.glb`
    - Added `Deluxe_double_door_attender_cot.glb`
    - Added `bedside-locker-plain.glb`

---

### Commit: `0352cf2` — *updated save and save as feature, working on updating new HDRI and materials*
- **Server Configuration**:
  - `Backend/server.js`:
    - Added static file serving for the `/hdri` directory:
      ```javascript
      app.use('/hdri', express.static(path.join(__dirname, 'hdri')));
      ```
      This allows client 3D scenes (Three.js / React Three Fiber) to load HDR environment texture files and thumbnails directly over HTTP.
- **HDRI Assets**:
  - `Backend/hdri/`: Added high-resolution `.exr` files, tonemapped `.jpg` images, and preview `.png` files for multiple lighting environments:
    - `DayEnvironmentHDRI064_2K`
    - `DayEnvironmentHDRI078_2K`
    - `DayEnvironmentHDRI089_2K`
    - `EveningEnvironmentHDRI003_2K`
    - `EveningSkyHDRI046B_2K`
    - `EveningSkyHDRI047B_2K`
    - `IndoorEnvironmentHDRI006_2K`
    - `IndoorEnvironmentHDRI019_2K`
    - `IndoorEnvironmentHDRI021_2K`
    - `IndoorEnvironmentHDRI023_2K`
    - `NightEnvironmentHDRI007_2K`
    - `NightEnvironmentHDRI010_2K`
    - `NightSkyHDRI003_2K`
    - `NightSkyHDRI012_2K`

---

## 2. Wednesday, September 30, 2026 (Day Before Yesterday)

### Commit: `c27a56b` — *working on 3d editor*
- **Sample 3D Models**:
  - `Backend/uploads/fistotechnical02_gmail_com/3D_Modals/`:
    - Added `Attender_cot_deluxe.glb`

---

### Commits: `fbbd696` & `1fd7f32` — *updated colapse issue and added 3D Intraction in flipibook preview* / *updated 3d intraction hotspot*
- **Flipbook Interactions**:
  - `Backend/routes/Flipbook/flipbook.js`: Added support for 3D interactions and preview handling in flipbook views.
  - `Backend/routes/User_Details/threed_models.js`:
    - Updated `GET /api/3d-models/get-models` to map and return `displayName` alongside standard model data.
    - Initial hotspot integration for flipbook models (reverted and re-introduced in finalized form on Oct 1).

---

## Summary of Core Changes

| Area | Key Updates |
|---|---|
| **Hotspot Persistence** | Added `hotspots` field to `ThreedModel` and `InteractionThreedModel` schemas; added `/save-hotspots` route and updated chunk upload + get routes to read/write hotspot annotations. |
| **HDRI Environment Maps** | Added static route `app.use('/hdri', ...)` in `server.js` and added structured 2K HDR `.exr`, tonemapped previews, and organized directory names. |
| **Model Metadata** | Supported `displayName` in model listing responses. |
| **3D Assets** | Added `.glb` test model files in user uploads directory. |
