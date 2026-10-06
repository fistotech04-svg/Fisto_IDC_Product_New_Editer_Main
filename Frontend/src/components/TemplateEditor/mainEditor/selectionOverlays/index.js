/**
 * Barrel export for the selectionOverlays sub-modules.
 * Import everything through this file to keep consumer imports clean.
 */
export { getOverlayForElement, getHtmlOverlayForElement, getRotatingCursor } from './overlayDomUtils';
export { renderResizeHandles } from './overlayHandleRenderer';
export { createRotationOverlayEngine } from './rotationOverlayEngine';
export { createInteractionBadgeOverlay } from './interactionBadgeOverlay';
export { createMultiSelectionEngine } from './multiSelectionEngine';
export { createMeasurementOverlay } from './measurementOverlay';
export { createOverlayHighlightRenderer } from './overlayHighlightRenderer';
