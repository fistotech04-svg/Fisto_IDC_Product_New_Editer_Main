# 3D Editor Architecture & Developer/AI Reference Guide

> **Location:** `Frontend/src/components/ThreedEditor/ARCHITECTURE.md`  
> **Purpose:** Permanent architectural and operational reference for AI agents and developers working on the 3D Editor module.

---

## 1. Directory Structure

```
Frontend/src/components/ThreedEditor/
├── ARCHITECTURE.md              # [THIS FILE] Permanent architecture reference
├── ThreedEditor.jsx             # Main Container, Scene Graph, Canvas & Central State
├── ThreedRightpanel.jsx         # Right Sidebar: Transforms (Move/Rotate/Scale), Material & Texture Controls
├── LeftSidebar.jsx              # Left Navigation: Mode/Tab Switcher (Models, Materials, Environment, etc.)
├── TopToolbar.jsx               # Top Bar: File operations, undo/redo, camera view presets, export trigger
├── EditorToolbar.jsx            # Transform Mode Bar: Translate, Rotate, Scale gizmo mode toggles
├── CanvasFloatingToolbar.jsx    # Overlay Toolbar on Canvas: Shading modes, wireframe, grid toggles
├── BottomGalleryTray.jsx        # Bottom Drawer: Asset / Material / HDR preview cards
├── TextureGalleryBar.jsx        # Texture selection and quick swap tray
├── MaterialList.jsx             # Hierarchy tree / list of materials and sub-meshes with visibility/lock
├── ColorPicker.jsx              # Custom color picker popup
├── EditorInfoBox.jsx            # Polycount, vertices, mesh count badge
├── panels/                      # Modular tab panels (Model, Materials, Textures, Lighting, Camera, Hotspots, Animation)
├── hooks/
│   └── useModalHistory.js       # Undo / Redo stack manager with snapshot deep-diffing
├── Components/
│   ├── GenericModel.jsx         # Core Three.js render runtime, TransformControls, Mesh isolation, Materials
│   ├── ModelLoaders.jsx         # Loader wrappers: GLTF, GLB, OBJ, FBX, STL, STEP, 3DS, LWO
│   ├── BlenderInfiniteGrid.jsx  # Ground grid shader replicating Blender viewport
│   ├── SmoothOrbitControls.jsx  # Camera orbit/pan controller with smooth damping
│   ├── AnimatedGizmo.jsx        # Viewport orientation cube / gizmo in corner
│   ├── Hotspot3DOverlay.jsx     # 3D interactive annotation pins positioned on mesh surfaces
│   ├── HotspotModal.jsx         # Hotspot details editor (title, description, media attachment)
│   ├── CameraModal.jsx          # Camera FOV, clipping planes, and angle preset editor
│   ├── Export3DModal.jsx        # Multi-format export dialog (GLB, GLTF, OBJ, STL, USDZ)
│   ├── AddModelModal.jsx        # Local file drop & URL import dialog for 3D assets
│   ├── ModelGalleryModal.jsx    # Cloud library / built-in 3D model asset browser
│   ├── AddMaterial.jsx          # Material creation & PBR parameter builder
│   └── GlobalLoader.jsx         # Loading progress bar overlay with percentage & status
└── utils/
    └── modelDropHandler.js      # Drag-and-drop file processing, format detection & converter router
```

---

## 2. Core State Variables & Flow

| State / Ref | Location | Description |
|---|---|---|
| `selectedMaterial` | `ThreedEditor.jsx` | Holds `{ name, uuid, meshUuid, isGroup, items, ts }` or `null` / model name for model-level selection. |
| `rootTransform` | `ThreedEditor.jsx` | `{ position: {x,y,z}, rotation: {x,y,z}, scale: {x,y,z} }` — dedicated transform store for the root model group, immune to child selections. |
| `transformValues` | `ThreedEditor.jsx` | `{ position: {x,y,z}, rotation: {x,y,z}, scale: {x,y,z} }` — active selection transform driving RightPanel Move/Rotate/Scale inputs. Automatically synchronized on selection switch. |
| `meshTransformsRef` / `meshTransformsState` | `ThreedEditor.jsx` | Map of `{ [uuidOrName]: { position, rotation, scale, name } }` storing transforms of individual child meshes. |
| `materialSettings` | `ThreedEditor.jsx` | PBR parameters: `color`, `metallic`, `roughness`, `alpha`, `scale`, `rotation`, `offset`, `maps`. |
| `models` | `ThreedEditor.jsx` | Array of loaded 3D models `{ id, name, fileUrl, transform, ... }`. |
| `pivotRef` | `GenericModel.jsx` | `THREE.Group` positioned at the bounding center of the active mesh or multi-mesh selection. |
| `followerOffsetsRef` | `GenericModel.jsx` | Map of `THREE.Matrix4` relative offsets for multi-mesh transform grouping. |

---

## 3. Data & Interaction Flow

```
[User edits Move / Rotate / Scale in ThreedRightpanel]
       │
       ▼
[ThreedEditor.handleManualTransformChange()]
       ├──► If Model-level: Updates `rootTransform` & `transformValues`
       ├──► If Child-level: Updates `meshTransformsRef` & `meshTransformsState` for target mesh/material & updates `transformValues`
       └──► Records history snapshot (`commitHistoryDebounced`)
       │
       ▼
[GenericModel.jsx]
       ├──► <group ref={setModelGroup}>: Driven by persistent `rootTransform` (never resets when child is selected)
       ├──► Effect 3.6 (`meshTransforms`): Applies position, rotation, scale to specific `THREE.Mesh` matching uuid/name/matName
       ├──► Effect 4: Resolves leader mesh and updates `pivotRef`
       └──► Selection Change Effect: Automatically syncs `transformValues` to the newly active item's current transform
```

---

## 4. Key Code Locations for Quick Navigation

- **Move / Rotate / Scale UI Inputs:** `ThreedRightpanel.jsx` (Lines 501–667)
- **Manual Transform Handler:** `ThreedEditor.jsx` (`handleManualTransformChange`)
- **Gizmo Live Transform Callback:** `ThreedEditor.jsx` (`handleTransformChange`)
- **Gizmo Drag End & History Commit:** `ThreedEditor.jsx` (`handleTransformEnd`)
- **Mesh Selection & Material Isolation:** `ThreedEditor.jsx` (`handleSelectMaterial`)
- **Pivot Calculation & Mesh Transformation:** `GenericModel.jsx` (`updatePivotToTarget`, Effect 3.6, Effect 4, `<TransformControls>`)
- **Undo / Redo History Logic:** `hooks/useModalHistory.js`
