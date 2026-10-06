import { useRef } from 'react';
import {
  getOverlayForElement,
  getHtmlOverlayForElement,
  getRotatingCursor,
  createRotationOverlayEngine,
  createInteractionBadgeOverlay,
  createMultiSelectionEngine,
  createMeasurementOverlay,
  createOverlayHighlightRenderer
} from './selectionOverlays/index';

/**
 * Hook to manage Figma-style visual selection outlines, multi-selection bounding boxes,
 * resize handles, smart measurement guides, and interaction badges across canvas SVG pages.
 *
 * This hook acts as a thin orchestrator that wires together the modular sub-engines
 * from the `selectionOverlays/` directory.
 */
export const useSelectionOverlays = ({
  zoom,
  activePageIndex,
  baseWidth,
  baseHeight,
  isAltPressedRef,
  nodeEditModeRef,
  activeTopToolRef,
  isEditingTextRef,
  selectedLayerIdRef,
  multiSelectedIdsRef,
  drawMeasurementOverlayRef,
  setActiveTopTool,
  updateElementAttribute,
  handleRotateRef
}) => {
  const activeRotateCornersRef = useRef({});
  const isRotatingRef = useRef(false);

  // ── 1. Rotation overlay engine (rotate handle + degree badge) ────────────
  const { createOrUpdateRotateHandle } = createRotationOverlayEngine({
    activeTopToolRef,
    activeRotateCornersRef,
    isRotatingRef,
    handleRotateRef
  });

  // ── 2. Interaction / Animation badge overlay ─────────────────────────────
  const { drawInteractionBadge } = createInteractionBadgeOverlay({
    activeTopToolRef,
    activePageIndex,
    setActiveTopTool,
    updateElementAttribute
  });

  // ── 3. Core per-element highlight + resize handle renderer ───────────────
  const { drawOverlayHighlight } = createOverlayHighlightRenderer({
    zoom,
    activeTopToolRef,
    nodeEditModeRef,
    isEditingTextRef,
    isAltPressedRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    createOrUpdateRotateHandle,
    drawInteractionBadge
  });

  // ── 4. Multi-selection AABB box + handles ────────────────────────────────
  const { syncMultiSelectionBox, drawMultiSelectionHighlight: _drawMultiSelectionHighlight } =
    createMultiSelectionEngine({
      zoom,
      multiSelectedIdsRef,
      createOrUpdateRotateHandle,
      activeRotateCornersRef
    });

  // Wrap to inject drawOverlayHighlight (avoids circular dep at module level)
  const drawMultiSelectionHighlight = (ids) =>
    _drawMultiSelectionHighlight(ids, drawOverlayHighlight);

  // ── 5. Measurement overlay (alt+hover distance guides) ───────────────────
  const { drawMeasurementOverlay, clearMeasurementOverlay } = createMeasurementOverlay({
    zoom,
    baseWidth,
    baseHeight,
    isAltPressedRef,
    nodeEditModeRef,
    selectedLayerIdRef,
    multiSelectedIdsRef,
    drawMeasurementOverlayRef
  });

  return {
    getOverlayForElement,
    getHtmlOverlayForElement,
    getRotatingCursor,
    syncMultiSelectionBox,
    drawMultiSelectionHighlight,
    drawMeasurementOverlay,
    clearMeasurementOverlay,
    drawInteractionBadge,
    drawOverlayHighlight
  };
};
