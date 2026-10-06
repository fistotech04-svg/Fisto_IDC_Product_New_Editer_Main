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

---

## 3. Monday, October 6, 2026

### Commit: `3be7e49` & Current Branch Updates — *Material and Texture Management, Multi-Model Scene Persistence, Supabase Exclusivity*

- **Texture & Category Management (`Backend/controllers/Texture/` & `Backend/models/`)**:
  - `Backend/models/Texture.js`:
    - Updated `maps` schema to make `base`, `metallic`, `roughness`, and `normal` optional (`default: null` instead of `required: true`).
    - Enables saving materials with as few as **1 single map** (or only a preview image).
  - `Backend/controllers/Texture/textureController.js`:
    - Removed strict mandatory requirement checking for all 4 primary maps (`base`, `metallic`, `roughness`, `normal`).
    - Now validates that at least one texture map or preview exists across all upload slots before saving.
  - `Backend/controllers/Texture/textureCategoryController.js`:
    - Improved `addCategory` and `getCategories` to support both `userEmail` and `email` query / body parameters.
    - Added trimming and sanitization for category names.
    - Verified folder CRUD endpoints:
      - `POST /api/textures/categories/add`
      - `GET /api/textures/categories/get`
      - `PUT /api/textures/categories/rename/:id`
      - `DELETE /api/textures/categories/delete/:id`

- **Supabase Storage Direct Persistence & Local Cleanup**:
  - `Backend/routes/User_Details/threed_models.js`:
    - Removed saving copies of uploaded `.glb` models to the local `uploads/.../3D_Modals/` disk folder.
    - All uploads now stream directly to Supabase Storage bucket, and local temporary chunk assembly folders are immediately cleaned up upon merge (`fs.rmSync(tempDir, { recursive: true, force: true })`).
    - Model and thumbnail URLs are generated as direct Supabase public URLs instead of local relative `/uploads/...` paths.

- **Duplicate Model Uploads & Force New Model Support**:
  - `Backend/routes/User_Details/threed_models.js` (`/upload-chunk`):
    - Added `forceNew` flag handling (`req.body.forceNew === "true"`).
    - If `forceNew` is passed or it's a new upload without `modelId`, automatically checks for existing models with the same name and appends a numeric suffix (e.g. `model_(1).glb`) to create a distinct model rather than overwriting.

- **Scene Multi-Model Persistence**:
  - `Backend/models/ThreedModel.js` & `Backend/models/InteractionThreedModel.js`:
    - Added `sceneModels` array schema (`type: Array, default: []`) to track multi-model scene configurations.
  - `Backend/routes/User_Details/threed_models.js`:
    - Updated `/save-settings` and `/get-model/:modelId` to read, write, and return `sceneModels`.
    - Added `GET /api/3d-models/get-session` endpoint to restore saved user session state from Supabase.

- **HDRI and Material Presets Database Architecture**:
  - `Backend/models/PresetHdri.js`: Mongoose schema storing environment HDRIs (`id`, `aliases`, `name`, `category`, `preview`, `file`, `order`).
  - `Backend/models/PresetMaterial.js`: Mongoose schema storing preset PBR materials (`id`, `name`, `category`, `preview`, `maps`, `color`, `metallic`, `roughness`, `alpha`, `order`).
  - `Backend/routes/Presets/presets.js`:
    - `GET /api/presets/hdri`: Fetches all preset HDRIs from MongoDB with dynamic absolute host resolution for preview images and EXR/HDR files.
    - `GET /api/presets/materials`: Fetches all 91+ preset materials from MongoDB with dynamic host URL resolution for all PBR texture maps.
  - `Backend/utils/seedPresets.js`: Automatic database seeder that populates MongoDB on backend startup with all preset items if the collections are empty or missing records.
  - `Backend/server.js`: Mounted `/api/presets` route and integrated automatic background preset seeding on database connection.
  - **Frontend Resilient Architecture**:
    - `Frontend/src/data/hdriData.js`: Implemented `fetchHdris()` which queries `GET /api/presets/hdri` from backend MongoDB, dynamically updates the cache, and seamlessly falls back to local `builtInHdris` array if the backend is unreachable or offline.
    - `Frontend/src/data/textureData.js`: Implemented `fetchMaterials()` which queries `GET /api/presets/materials` from backend MongoDB, dynamically updates `textureData` cache, and falls back to local `textureData` array if offline.
    - `LightingPanel.jsx` & `MaterialSelectorDrawer.jsx`: Integrated dynamic backend fetching with reactive re-rendering and fallback.

---

## Summary of Core Changes

| Area | Key Updates |
|---|---|
| **Database-Driven Presets** | Added `PresetHdri` & `PresetMaterial` schemas in MongoDB with auto-seeder (`seedPresets.js`) and `/api/presets` routes; frontend fetches from DB with automatic local JS fallback. |
| **Texture & Material Flexibility** | Made all texture maps optional (`default: null`); allowed saving materials with any single map; updated category controller for full CRUD & email compatibility. |
| **Storage Exclusivity** | Switched 3D model uploads entirely to Supabase Storage; removed local disk storage redundancy and auto-cleaned temporary directories. |
| **Model Upload Conflicts** | Added `forceNew` query support to create auto-incremented separate models instead of silent overwrites. |
| **Scene Models & Sessions** | Added `sceneModels` to `ThreedModel` & `InteractionThreedModel`; added session retrieval endpoint (`/get-session`). |
| **Hotspots & Annotations** | Dedicated endpoints and schema fields for persisting interactive hotspots. |
| **HDRI & Environment Maps** | Static `/hdri` route serving pre-rendered EXRs, HDRs, and previews for Three.js scene environments. |
