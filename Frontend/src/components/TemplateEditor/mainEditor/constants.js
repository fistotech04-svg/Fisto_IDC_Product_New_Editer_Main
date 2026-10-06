// SVG Cursors for various editing modes
export const PENCIL_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><path d='m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z' /><path fill='%23000' d='M20.131 3.16a3 3 0 0 0-4.242 0l-.707.708l4.95 4.95l.706-.707a3 3 0 0 0 0-4.243l-.707-.707Zm-1.414 7.072l-4.95-4.95l-9.09 9.091a1.5 1.5 0 0 0-.401.724l-1.029 4.455a1 1 0 0 0 1.2 1.2l4.456-1.028a1.5 1.5 0 0 0 .723-.401z' /></g></svg>") 1 16, crosshair`;
export const PEN_CURSOR = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Cpath d='M8 14l-1.5 5' stroke='white' stroke-width='2'/%3E%3Cpath d='M8 14l-1.5 5' stroke='black' stroke-width='.8'/%3E%3C/svg%3E") 4 4, crosshair`;
export const CUR_PEN_CLOSE = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Ccircle cx='17' cy='16' r='4' fill='none' stroke='black' stroke-width='3'/%3E%3Ccircle cx='17' cy='16' r='4' fill='none' stroke='white' stroke-width='1.6'/%3E%3C/svg%3E") 4 4, crosshair`;
export const CUR_PEN_EXTEND = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 4l7 2.5L8 14 4 4z' fill='white' stroke='black' stroke-width='1.1'/%3E%3Cpath d='M13 19h8M17 15v8' stroke='black' stroke-width='3.2'/%3E%3Cpath d='M13 19h8M17 15v8' stroke='white' stroke-width='1.6'/%3E%3C/svg%3E") 4 4, crosshair`;
export const CUR_SNAP = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 2v7M12 15v7M2 12h7M15 12h7' stroke='black' stroke-width='2.6'/%3E%3Cpath d='M12 2v7M12 15v7M2 12h7M15 12h7' stroke='white' stroke-width='1.2'/%3E%3Ccircle cx='12' cy='12' r='2.4' fill='none' stroke='black' stroke-width='2.2'/%3E%3Ccircle cx='12' cy='12' r='2.4' fill='none' stroke='%23FF5C87' stroke-width='1.2'/%3E%3C/svg%3E") 12 12, crosshair`;
export const SHAPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2V22M2 12H22' stroke='%236366F1' stroke-width='2' stroke-linecap='round'/></svg>") 12 12, crosshair`;
export const TYPE_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 15 15'><path fill='%23000' d='M10.5 1a.5.5 0 0 1 0 1c-.922 0-1.54.23-1.92.563C8.206 2.89 8 3.366 8 4v3h1.25a.5.5 0 0 1 0 1H8v3c0 .634.207 1.11.58 1.437c.38.333.998.563 1.92.563a.5.5 0 0 1 0 1c-1.078 0-1.96-.27-2.58-.812a2.6 2.6 0 0 1-.42-.47q-.177.256-.42.47C6.46 13.73 5.577 14 4.5 14a.5.5 0 0 1 0-1c.922 0 1.54-.23 1.92-.563c.373-.326.58-.803.58-1.437V8H5.75a.5.5 0 0 1 0-1H7V4c0-.634-.207-1.11-.58-1.437C6.04 2.23 5.423 2 4.5 2a.5.5 0 0 1 0-1c1.078 0 1.96.27 2.58.812q.243.213.42.468q.177-.255.42-.468C8.54 1.27 9.423 1 10.5 1' /></svg>") 7 7, text`;
export const DIRECT_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="-20 -20 300 300"><path d="M238.448 92.6028L0 0L90.103 241.348C90.7404 243.045 91.8924 244.501 93.3985 245.514C94.9045 246.526 96.6895 247.045 98.5048 246.997C100.32 246.949 102.075 246.337 103.525 245.246C104.976 244.156 106.049 242.641 106.596 240.913L130.069 164.711L209.652 242.219C211.287 243.841 213.498 244.751 215.804 244.751C218.109 244.751 220.321 243.841 221.956 242.219L242.462 221.753C244.088 220.122 245 217.914 245 215.614C245 213.313 244.088 211.106 242.462 209.474L163.141 132.315L238.448 109.062C240.163 108.47 241.65 107.359 242.703 105.884C243.755 104.409 244.321 102.643 244.321 100.833C244.321 99.0218 243.755 97.256 242.703 95.781C241.65 94.306 240.163 93.195 238.448 92.6028Z" fill="black" transform="rotate(18, 0, 0)"/></svg>') 1 1, auto`;

// Global style to ensure injected SVGs always fill their container perfectly
export const svgGlobalStyles = `
  .page-svg-container svg:not(.svg-icon-override) {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    shape-rendering: geometricPrecision !important;
    text-rendering: geometricPrecision !important;
  }

  [data-hidden="true"],
  .page-svg-container [data-hidden="true"] {
    display: none !important;
  }

  .page-svg-container.trim-view-on,
  .page-svg-container.trim-view-on svg {
    overflow: visible !important;
  }

  .page-svg-container.trim-view-on [data-trim-outside="true"] {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .page-svg-container.trim-view-on [data-trim-outside="true"][data-selected="true"],
  .page-svg-container.trim-view-on [data-trim-outside="true"][data-child-selected="true"],
  .page-svg-container.trim-view-on [data-trim-outside="true"][data-dragging="true"] {
    pointer-events: all !important;
  }

  /* ============================================
     CONVERTED FLIPBOOK (PDF, DOC, PPT) PROTECTION
     ============================================ */
  .page-svg-container.is-pdf-project svg [data-name="PDF Background"],
  .page-svg-container.is-pdf-project svg [data-name="PDF Background"] *,
  .page-svg-container.is-pdf-project svg [data-type="pdf-vector-layer"],
  .page-svg-container.is-pdf-project svg [data-type="pdf-vector-layer"] *,
  .page-svg-container.is-pdf-project svg [data-name="Overlay"],
  .page-svg-container.is-pdf-project svg > g[data-type="frame"],
  .is-pdf-project svg [data-name="PDF Background"],
  .is-pdf-project svg [data-name="PDF Background"] *,
  .is-pdf-project svg [data-type="pdf-vector-layer"],
  .is-pdf-project svg [data-type="pdf-vector-layer"] *,
  .is-pdf-project svg [data-name="Overlay"],
  .is-pdf-project svg > g[data-type="frame"] {
    pointer-events: none !important;
  }

  .page-svg-container.is-pdf-project:not(.hide-free-frames) svg [data-name="Free Frame" i],
  .page-svg-container.is-pdf-project:not(.hide-free-frames) svg [data-name="Free Frame" i] *,
  .page-svg-container.is-pdf-project:not(.hide-free-frames) svg [data-type="free-frame"],
  .page-svg-container.is-pdf-project:not(.hide-free-frames) svg [data-type="free-frame"] *,
  .is-pdf-project:not(.hide-free-frames) svg [data-name="Free Frame" i],
  .is-pdf-project:not(.hide-free-frames) svg [data-name="Free Frame" i] *,
  .is-pdf-project:not(.hide-free-frames) svg [data-type="free-frame"],
  .is-pdf-project:not(.hide-free-frames) svg [data-type="free-frame"] *,
  .page-svg-container.is-pdf-project svg [data-is-hotspot="true"],
  .page-svg-container.is-pdf-project svg [data-is-hotspot="true"] *,
  .page-svg-container.is-pdf-project svg [data-type="hotspot"],
  .page-svg-container.is-pdf-project svg [data-type="hotspot"] *,
  .page-svg-container.is-pdf-project svg [data-type="shape"]:not([data-name="Free Frame" i]):not([data-type="free-frame"]):not([id^="free-frame"]),
  .page-svg-container.is-pdf-project svg [data-type="shape"]:not([data-name="Free Frame" i]):not([data-type="free-frame"]):not([id^="free-frame"]) *,
  .page-svg-container.is-pdf-project svg [data-type="icon"],
  .page-svg-container.is-pdf-project svg [data-type="icon"] *,
  .page-svg-container.is-pdf-project svg [data-name="Document Shield"],
  .page-svg-container.is-pdf-project svg [data-type="shield"],
  .is-pdf-project svg [data-is-hotspot="true"],
  .is-pdf-project svg [data-is-hotspot="true"] *,
  .is-pdf-project svg [data-type="hotspot"],
  .is-pdf-project svg [data-type="hotspot"] *,
  .is-pdf-project svg [data-type="shape"]:not([data-name="Free Frame" i]):not([data-type="free-frame"]):not([id^="free-frame"]),
  .is-pdf-project svg [data-type="shape"]:not([data-name="Free Frame" i]):not([data-type="free-frame"]):not([id^="free-frame"]) *,
  .is-pdf-project svg [data-type="icon"],
  .is-pdf-project svg [data-type="icon"] *,
  .is-pdf-project svg [data-name="Document Shield"],
  .is-pdf-project svg [data-type="shield"] {
    pointer-events: auto !important;
  }

  .page-svg-container.trim-view-off,
  .page-svg-container.trim-view-off svg {
    overflow: visible !important;
  }

  /* ============================================
     FIGMA-STYLE FRAME SELECTION SYSTEM
     ============================================ */

  /* Global SVG Interaction Prevention */
  .page-svg-container svg {
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  /* Hide regular selection overlays when Crop Modal is open */
  body.crop-modal-active .overlay-type-selected,
  body.crop-modal-active .overlay-type-hover,
  body.crop-modal-active .overlay-type-child-hover,
  body.crop-modal-active .overlay-type-child-selected,
  body.crop-modal-active .selection-handle {
    display: none !important;
    pointer-events: none !important;
  }

  /* Hide ONLY the specific image that is actively being cropped to prevent ghosting */
  body.crop-modal-active .page-svg-container svg [data-cropping="true"] {
    opacity: 0 !important;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    pointer-events: auto !important;
  }

  .page-svg-container svg * {
    cursor: default;
  }

  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    cursor: inherit;
  }

  /* Allow text selection when editing */
  .page-svg-container svg [contenteditable="true"],
  .page-svg-container svg foreignObject[data-editing="true"] {
    user-select: text !important;
    -webkit-user-select: text !important;
    cursor: ${TYPE_CURSOR} !important;
    outline: none;
  }

  div.text-edit-box {
    outline: none !important;
    background: transparent !important;
    background-clip: padding-box !important;
  }

  /* 1. HOVER state — blue outline on the topmost frame candidate */
  .page-svg-container svg [data-hovered="true"] {}

  /* 2. SELECTED frame — solid thick indigo outline + glow */
  .page-svg-container svg [data-selected="true"] {}

  /* 3. ENTERED FRAME indicator — when user has "entered" this frame,
        show it with a thin dashed blue border (like Figma's current frame) */
  .page-svg-container svg [data-frame-entered="true"] {}

  /* 4. CHILD HOVER inside an entered frame — dotted outline for child candidates */
  .page-svg-container svg [data-child-hovered="true"] {}

  /* 5. CHILD SELECTED inside an entered frame — same solid selection look */
  .page-svg-container svg [data-child-selected="true"] {}

  /* 7. Dragging State - Allowed Shadow */
  .page-svg-container svg [data-dragging="true"] {}

  /* 8. Direct Selection Tool Cursor */
  .page-svg-container.tool-direct svg * {
    cursor: ${DIRECT_CURSOR} !important;
  }

  /* 9. Fixed Overlay Prevention - changed to allow interaction */
  .page-svg-container svg [data-name="Overlay"] {
    pointer-events: auto !important;
    cursor: default;
  }

  /* 10. Pencil Tool Cursor */
  .page-svg-container.pencil-mode svg,
  .page-svg-container.pencil-mode svg *,
  .page-svg-container.pencil-mode svg [data-name="Overlay"] {
    cursor: ${PENCIL_CURSOR} !important;
  }

  /* 10a. Pen Tool Cursor & Variants ────────── */
  .page-svg-container.pen-mode svg,
  .page-svg-container.pen-mode svg *,
  .page-svg-container.pen-mode svg [data-name="Overlay"] {
    cursor: ${PEN_CURSOR} !important;
  }
  .page-svg-container.pen-mode.cur-pen-close svg,
  .page-svg-container.pen-mode.cur-pen-close svg *,
  .page-svg-container.pen-mode.cur-pen-close svg [data-name="Overlay"] {
    cursor: ${CUR_PEN_CLOSE} !important;
  }
  .page-svg-container.pen-mode.cur-pen-extend svg,
  .page-svg-container.pen-mode.cur-pen-extend svg *,
  .page-svg-container.pen-mode.cur-pen-extend svg [data-name="Overlay"] {
    cursor: ${CUR_PEN_EXTEND} !important;
  }
  .page-svg-container.pen-mode.cur-snap svg,
  .page-svg-container.pen-mode.cur-snap svg *,
  .page-svg-container.pen-mode.cur-snap svg [data-name="Overlay"] {
    cursor: ${CUR_SNAP} !important;
  }

  /* 10b. Shape Tool Cursor */
  .page-svg-container.shape-mode svg,
  .page-svg-container.shape-mode svg *,
  .page-svg-container.shape-mode svg [data-name="Overlay"] {
    cursor: ${SHAPE_CURSOR} !important;
  }

  /* 10c. Type Tool Cursor */
  .page-svg-container.type-mode svg,
  .page-svg-container.type-mode svg *,
  .page-svg-container.type-mode svg [data-name="Overlay"] {
    cursor: ${TYPE_CURSOR} !important;
  }

  /* 10d. Node Edit Mode Cursor (Direct Selection Arrow) */
  .page-svg-container.cur-node-edit,
  .page-svg-container.cur-node-edit svg,
  .page-svg-container.cur-node-edit svg *,
  .page-svg-container.cur-node-edit svg [data-name="Overlay"] {
    cursor: ${DIRECT_CURSOR} !important;
  }

  /* 11. Active Page Indicator - Glow/Shadow selection without solid border */
  .active-page-outline {
    outline: 2px solid #5145f6 !important;
    box-shadow: 0 0 10px rgba(16, 0, 188, 0.45) !important;
    z-index: 10 !important;
    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pen-tool-node {
    pointer-events: none;
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.2));
    transition: all 0.1s ease;
  }

  /* Video & Iframe Scaling Fixes */
  foreignObject video {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
  }
  foreignObject iframe {
    display: block !important;
    border: none !important;
    outline: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    pointer-events: auto !important;
    transform-origin: 0 0 !important;
  }
  foreignObject[data-type="video"] {
    overflow: hidden !important;
    pointer-events: auto !important;
  }
  foreignObject[data-type="video"] * {
    pointer-events: auto !important;
  }

  .hide-controls::-webkit-media-controls {
    display: none !important;
  }
  .hide-controls {
    pointer-events: none !important;
  }

  /* Global Resize Cursor Lock */
  body.resizing-active, 
  body.resizing-active * {
    cursor: var(--resizing-cursor, inherit) !important;
  }

  /* Hide corner dots, sides, and rotate handles while moving elements */
  body.dragging-active .resize-handle,
  body.dragging-active .rotate-handle,
  body.dragging-active .rotate-hotspot,
  body.dragging-active [id^="resize-handle-"],
  body.dragging-active [id^="rotate-handle-"],
  body.dragging-active [id^="rotate-hotspot-"],
  body.dragging-active [id^="rotation-degree-badge-"] {
    display: none !important;
    pointer-events: none !important;
  }

  /* Free Frame rects must catch pointer events for hover/selection ONLY in interaction/animation modes, 
     even when fill and stroke are transparent */
  .page-svg-container:not(.hide-free-frames) svg rect[data-name="Free Frame" i],
  .page-svg-container:not(.hide-free-frames) svg [data-type="free-frame"],
  .page-svg-container:not(.hide-free-frames) svg [id^="free-frame"] {
    pointer-events: all !important;
    transition: fill 0.2s ease, stroke 0.2s ease;
  }

  /* By default, hide Free Frame completely (transparent stroke and fill) unless drawing */
  .page-svg-container svg rect[data-name="Free Frame" i]:not([data-drawing="true"]),
  .page-svg-container svg [data-type="free-frame"]:not([data-drawing="true"]),
  .page-svg-container svg [id^="free-frame"]:not([data-drawing="true"]) {
    stroke: transparent !important;
    fill: transparent !important;
  }

  /* On Hover: show light indigo fill (but NOT when selected) */
  .page-svg-container:not(.hide-free-frames) svg rect[data-name="Free Frame" i]:not([data-drawing="true"]):not([data-selected-frame="true"]):hover,
  .page-svg-container:not(.hide-free-frames) svg rect[data-name="Free Frame" i]:not([data-drawing="true"]):not([data-selected-frame="true"])[data-hovered="true"],
  .page-svg-container:not(.hide-free-frames) svg rect[data-name="Free Frame" i]:not([data-drawing="true"]):not([data-selected-frame="true"])[data-child-hovered="true"] {
    fill: rgba(99, 102, 241, 0.3) !important;
  }

  /* Hide Free Frames completely in non-interaction/animation mode, but keep visible while being drawn */
  .page-svg-container.hide-free-frames [data-name="Free Frame" i]:not([data-drawing="true"]),
  .page-svg-container.hide-free-frames [data-type="free-frame"]:not([data-drawing="true"]),
  .page-svg-container.hide-free-frames [id^="free-frame"]:not([data-drawing="true"]),
  .hide-free-frames [data-name="Free Frame" i]:not([data-drawing="true"]),
  .hide-free-frames [data-type="free-frame"]:not([data-drawing="true"]),
  .hide-free-frames [id^="free-frame"]:not([data-drawing="true"]) {
    display: none !important;
    pointer-events: none !important;
  }
`;
