/**
 * penTool/index.js
 * Central unified module exporting all Pen Tool and Node Edit Mode capabilities:
 * - Vectra Pen Session & Path Generators (vectraPenEngine.js)
 * - Paper.js Node & Segment Manipulation Engine (vectorNodeEngine.js)
 * - Interactive SVG Node / Bending Overlays (penOverlayEngine.js)
 * - Node Edit & Drawing Lifecycle Hook (usePenNodeEngine.js)
 */

export * from './vectraPenEngine';
export * from './vectorNodeEngine';
export * from './penOverlayEngine';
export { usePenNodeEngine, default as usePenNodeEngineDefault } from './usePenNodeEngine';

/**
 * Helper to exit Node Edit mode safely and clean up overlays.
 */
export const exitNodeEditModeHelper = ({
  nodeEditModeRef,
  nodeEditPathRef,
  drawingPathRef,
  nodeEditPageIndexRef,
  nodeEditDragRef,
  nodeEditSelectedSegIdxRef,
  nodeEditSelectedCurveIdxRef,
  nodeEditHoverCurveIdxRef,
  nodeEditSelectedSegIndicesRef,
  nodeEditSplitSegIdxRef,
  vectraPenSessionRef,
  drawOverlayHighlight
}) => {
  if (!nodeEditModeRef || !nodeEditModeRef.current) return;

  // Remove node edit overlay from ALL page highlight containers
  document.querySelectorAll('[id^="highlight-overlay-"]').forEach(overlay => {
    const nodeGroup = overlay.querySelector('#node-edit-overlay-group');
    if (nodeGroup) nodeGroup.remove();
  });

  const pathEl = nodeEditPathRef ? nodeEditPathRef.current : null;
  nodeEditModeRef.current = false;
  if (nodeEditPathRef) nodeEditPathRef.current = null;
  if (drawingPathRef) drawingPathRef.current = null;
  if (nodeEditPageIndexRef) nodeEditPageIndexRef.current = null;
  if (nodeEditDragRef) nodeEditDragRef.current = null;
  if (nodeEditSelectedSegIdxRef) nodeEditSelectedSegIdxRef.current = null;
  if (nodeEditSelectedCurveIdxRef) nodeEditSelectedCurveIdxRef.current = null;
  if (nodeEditHoverCurveIdxRef) nodeEditHoverCurveIdxRef.current = -1;
  if (nodeEditSelectedSegIndicesRef) nodeEditSelectedSegIndicesRef.current = new Set();
  if (nodeEditSplitSegIdxRef) nodeEditSplitSegIdxRef.current = null;
  if (vectraPenSessionRef && vectraPenSessionRef.current) vectraPenSessionRef.current.reset();

  if (pathEl && pathEl.id && document.getElementById(pathEl.id) && typeof drawOverlayHighlight === 'function') {
    drawOverlayHighlight(pathEl, 'selected');
  }

  // Remove node-edit cursor class
  document.querySelectorAll('.page-svg-container').forEach(el => el.classList.remove('cur-node-edit'));
  window.dispatchEvent(new CustomEvent('node-edit-mode-changed', { detail: { active: false } }));
};
