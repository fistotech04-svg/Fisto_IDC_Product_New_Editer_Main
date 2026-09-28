# Frontend Architecture & Developer Context Guide

This document serves as the high-priority persistent context for the **Flipbook Frontend Application** (`/Frontend`). It maps architecture, component hierarchies, canvas rendering pipelines, custom event communication, and the video/multimedia subsystem for rapid navigation and accurate modifications.

---

## 1. Application & Route Overview

- **Entry Point:** [main.jsx](file:///d:/Sham/Flipibook/Frontend/src/main.jsx)
- **App Router & Routing:** [App.jsx](file:///d:/Sham/Flipibook/Frontend/src/App.jsx)
  - `/editor` & `/editor/:folder/:v_id` -> [Editer.jsx](file:///d:/Sham/Flipibook/Frontend/src/Modules/Editer.jsx) (Parent container)
    - `index` / `:v_id` -> `<MainEditor />` (Exported from [TemplateEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/TemplateEditor/TemplateEditor.jsx))
    - `/editor/customized_editor/...` -> [CustomizedEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/CustomizedEditor/CustomizedEditor.jsx)
    - `/editor/threed_editor/...` -> [ThreedEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/ThreedEditor/ThreedEditor.jsx)
  - `/preview` -> [PreviewPage.jsx](file:///d:/Sham/Flipibook/Frontend/src/pages/PreviewPage.jsx)
  - `/share/:shareId`, `/share=public/:shareId`, etc. -> [shareviewbook.jsx](file:///d:/Sham/Flipibook/Frontend/src/pages/shareviewbook.jsx)
  - `/ar-view` -> [ARView.jsx](file:///d:/Sham/Flipibook/Frontend/src/pages/ARView.jsx)

---

## 2. Core Editor Architecture Hierarchy

```
Frontend/src/
├── Modules/
│   └── Editer.jsx                          # Root editor wrapper, Navbar, AutoSave sync, Global Modals
│
└── components/TemplateEditor/
    ├── TemplateEditor.jsx                  # Main orchestrator (Pages list, Left sidebar, History, Top tools)
    ├── MainEditor.jsx                      # Active Canvas Engine (SVG DOM, interact.js dragging/resizing, Overlays)
    ├── RightSidebar.jsx                    # Context-sensitive Properties Inspector (Text, Image, Video, Shape, Pen)
    ├── TopToolbar.jsx                      # Canvas zoom, undo/redo, alignment, page actions
    │
    ├── VideoEditor.jsx                     # Video & YouTube Properties Panel (Autoplay, Loop, Fit, Poster, Trimming)
    ├── ImageEditor.jsx                     # Image & Raster properties inspector
    ├── TextEditor.jsx                      # Rich typography & text editing engine
    ├── PenToolProperties.jsx               # Vector drawing inspector
    ├── penToolEngine.js & vectraPenEngine  # Path creation & node curve engines
    │
    ├── ImportViaUrlModal.jsx               # Modal to paste YouTube/Vimeo/Direct video URLs
    ├── ReplaceMediaModal.jsx               # Modal to swap image/video source
    ├── MediaGalleryPopup.jsx               # Media asset library popup
    └── editorUtils.js                      # Helpers: URL parsers, YouTube ID extractors, gradient builders
```

---

## 3. Video & YouTube Subsystem Deep-Dive

### A. Data Flow: Adding YouTube / Video from Link

```
[User Pastes URL in ImportViaUrlModal / Left Sidebar]
                    │
                    ▼
 window.dispatchEvent('upload-video-to-editor', { videoUrl, originalUrl, pageIndex, ... })
                    │
                    ▼
 [MainEditor.jsx -> handleUploadVideo(e)] (Lines ~3078-3291)
    1. Detects provider (YouTube, Vimeo, Dailymotion, Loom, Wistia, Drive, Direct MP4).
    2. Builds Embed URL: https://www.youtube.com/embed/{videoId} (YouTube).
    3. Creates SVG Element: <foreignObject id="video-{timestamp}" data-type="video" ...>
    4. Injects either <iframe> (YouTube) or <video> (MP4/WebM).
    5. Calculates aspect ratio (16:9 landscape vs 9:16 portrait) & centers on SVG frame.
    6. Appends to target SVG frame and triggers updatePageHtml(pageIndex, svg.outerHTML).
    7. Selects new video: setSingleSelection(newId) + drawOverlayHighlight(newId, 'selected').
```

### B. Canvas Moving, Dragging & Transforming Logic

- **Drag Engine:** `interact.js` initialized in [MainEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/TemplateEditor/MainEditor.jsx) (Lines ~7422–7900).
- **Selector:** Target is `.page-svg-container svg, .page-svg-container svg *`.
- **Drag Start (`start` listener, Lines ~7433–7550):**
  - Identifies target `<foreignObject>` or redirects to `selectedLayerId`.
  - Captures initial `DOMMatrix` transform and local start coordinates via `getLocalPoint()`.
- **Drag Move (`move` listener, Lines ~7840–7871):**
  ```javascript
  const dx = currentPointLocal.x - dragState.startPointLocal.x;
  const dy = currentPointLocal.y - dragState.startPointLocal.y;
  const translation = new DOMMatrix().translate(dx, dy);
  const nextMatrix = translation.multiply(dragState.initialMatrix);
  target.setAttribute('transform', matrixToTransform(nextMatrix));
  drawOverlayHighlight(target, 'selected');
  ```
- **Drag End (`end` listener, Lines ~7890–7980):**
  - Commits transformed positions to SVG DOM and calls `saveModifiedPageHtml(activePageIndex, svg)`.
- **Resizing (`.resize-handle`, Lines ~8032–8950):**
  - Drags 8-point handles around selection box, computing dynamic width/height and scale matrices on the `<foreignObject>`.

### C. Video Property Controls & Right Sidebar Integration

- **Inspector Component:** [VideoEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/TemplateEditor/VideoEditor.jsx)
- **Mount Condition:** [RightSidebar.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/TemplateEditor/RightSidebar.jsx#L1393) renders `<VideoEditor />` when `selectedElementProps?.isVideo` is `true`.
- **Key Attributes Saved on `<foreignObject>` / Video Nodes:**
  - `data-type="video"`
  - `data-original-url="https://youtube.com/..."`
  - `data-object-fit="Fit" | "Fill" | "Custom"`
  - `data-video-width`, `data-video-height`, `data-video-duration`
  - `data-autoplay="true|false"`, `data-loop="true|false"`, `data-muted="true|false"`
  - `data-start-time`, `data-end-time`, `data-playback-speed`
  - `data-poster-url` (thumbnail for YouTube: `https://img.youtube.com/vi/{id}/hqdefault.jpg`)

---

## 4. Key Custom Events & Communication Protocols

All loosely coupled modules communicate via standard `window.dispatchEvent(new CustomEvent(...))`:

| Event Name | Dispatched From | Handled In | Purpose |
| :--- | :--- | :--- | :--- |
| `upload-video-to-editor` | `ImportViaUrlModal`, `TemplateEditor`, `RightSidebar` | `MainEditor.jsx` | Spawns and mounts video/YouTube element on canvas |
| `add-image-to-editor` | `TemplateEditor`, `MediaGalleryPopup` | `MainEditor.jsx` | Inserts image/GIF onto active canvas page |
| `add-hotspot-to-editor` | `TemplateEditor`, `HotspotPresetPopup` | `MainEditor.jsx` | Creates interactive hotspot element |
| `update-element-props` | `RightSidebar`, `VideoEditor`, `TextEditor` | `MainEditor.jsx` | Updates attributes on selected DOM element |
| `editor_toggleTrimView` | `Editer.jsx` / Settings | `MainEditor.jsx` | Toggles trim border clipping |
| `editor_toggleRuler` | `Editer.jsx` / Settings | `MainEditor.jsx` | Toggles canvas horizontal/vertical rulers |

---

## 5. Selection & Overlay Engine (`drawOverlayHighlight`)

Located in [MainEditor.jsx](file:///d:/Sham/Flipibook/Frontend/src/components/TemplateEditor/MainEditor.jsx) (Lines ~4568–5500):
- Highlights selected elements, multi-selections, and hover states with SVG bounding polygons (`#highlight-overlay-{pageIndex}`).
- Renders 8 interactive resize handles (`.resize-handle`), rotation pill handle, and action badges.
- Maintains transform synchronization with zoom scale and pan offset.

---

## 6. Optimization Guidelines for Frontend Work

1. **Avoid Full Re-renders for Canvas DOM:**
   - SVG DOM modifications should be made in-place on the target element first, followed by syncing serialized markup via `updatePageHtml()`.
2. **Handle `foreignObject` Cross-Browser Quirks:**
   - Always ensure `xmlns="http://www.w3.org/2000/svg"` is set on `foreignObject` and `xmlns="http://www.w3.org/1999/xhtml"` is set on child `<div>`, `<iframe>`, or `<video>`.
3. **Keep `interact.js` Coordinates in Local SVG Space:**
   - Always use `getLocalPoint(svgElement, target.parentNode, clientX, clientY)` to avoid coordinate misalignment when zoomed/panned.
