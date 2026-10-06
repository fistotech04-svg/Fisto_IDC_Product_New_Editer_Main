import { useEffect, useRef } from 'react';
import interact from 'interactjs';
import {
  getVisualBBox,
  getElementMatrix,
  matrixToTransform,
  getCanvasBounds,
  getSvgPoint,
  toDOMMatrix
} from './geometryUtils';
import { isElementCompletelyOutside } from './trimViewUtils';
import {
  getBoxInSvg,
  initSmartGuides,
  computeSmartGuides,
  computeResizeSmartGuides,
  collectResizeGuideLines,
  renderSmartGuides,
  clearSmartGuides
} from './smartGuides';
import { convertTextToForeignObject } from './textConversionUtils';

/**
 * Custom hook encapsulating the Interact.js pointer drag and resize engine
 * for SVG canvas elements, handles, aspect ratio locking, multi-selection bounds, and snapping.
 */
export const useInteractEngine = ({
  zoom,
  activePageIndex,
  isConvertedFlipbook,
  setSelectedLayerId,
  setMultiSelectedIds,
  setCurrentFrameId,
  drawOverlayHighlight,
  drawMultiSelectionHighlight,
  syncMultiSelectionBox,
  saveModifiedPageHtml,
  getDraggableElement,
  getTopLevelFrames,
  hitTest,
  selectedLayerIdRef,
  multiSelectedIdsRef,
  currentFrameIdRef,
  activeTopToolRef,
  activeMainToolRef,
  selectedSelectToolRef,
  nodeEditModeRef,
  suppressClickRef,
  drawMeasurementOverlayRef,
  updatePageHtml,
  updatePageHtmlRef,
  localTrimView = false
}) => {
  const localTrimViewRef = useRef(localTrimView);
  useEffect(() => {
    localTrimViewRef.current = localTrimView;
  }, [localTrimView]);

  const safeRectChecker = (element) => {
    if (element && typeof element.getBoundingClientRect === 'function') {
      try {
        const rect = element.getBoundingClientRect();
        if (rect) {
          return {
            left: rect.left || 0,
            top: rect.top || 0,
            right: rect.right || 0,
            bottom: rect.bottom || 0,
            width: rect.width || 0,
            height: rect.height || 0,
            x: rect.x || rect.left || 0,
            y: rect.y || rect.top || 0,
          };
        }
      } catch { /* ignored */ }
    }
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  };

  const safeStopInteraction = (interaction) => {
    if (!interaction) return;
    if (!interaction.rect) {
      interaction.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    }
    try {
      interaction.stop();
    } catch { /* ignored */ }
    if (!interaction.rect) {
      interaction.rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    }
  };

  useEffect(() => {
    // Setup interactjs for elements within the SVG - targeting both elements and the background
    const interactable = interact('.page-svg-container svg, .page-svg-container svg *')
      .styleCursor(false) // Prevents interact.js from dynamically setting cursors on hover
      .rectChecker(safeRectChecker)
      .draggable({
        ignoreFrom: '.resize-handle, .text-edit-box, [data-editing="true"]',
        cursorChecker: () => null, // Second layer of prevention just in case
        inertia: false, // Disable inertia for perfect cursor sync
        autoScroll: true,
        listeners: {
          start(event) {
            let target = event.target;

            const container = target.closest('.page-svg-container');
            const canvasContent = container ? container.querySelector('[id^="canvas-content-"]') : null;
            const rootSvg = canvasContent ? canvasContent.querySelector('svg') : null;
            const svgElement = rootSvg || target.ownerSVGElement || (target.tagName.toLowerCase() === 'svg' ? target : null);
            if (!svgElement) return;

            const isEditing = target.closest('[data-editing="true"]') || (document.activeElement && document.activeElement.getAttribute('contenteditable') === 'true');
            // If Ctrl is held, not in selection mode, or node edit mode is active, stop interact.js drag
            if (!['select', 'upload', 'grid'].includes(activeMainToolRef.current) || isEditing || event.ctrlKey || nodeEditModeRef.current) {
              safeStopInteraction(event.interaction);
              return;
            }

            // Prevent drag if clicking on the scrollbar of a scrollable div inside a foreignObject
            if (target.tagName?.toLowerCase() === 'div' && target.closest('foreignObject')) {
              const style = window.getComputedStyle(target);
              const isScrollable = style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll';
              if (isScrollable) {
                const rect = target.getBoundingClientRect();
                const isScrollbarClick = event.clientX > rect.left + target.clientLeft + target.clientWidth ||
                  event.clientY > rect.top + target.clientTop + target.clientHeight;
                if (isScrollbarClick) {
                  safeStopInteraction(event.interaction);
                  return;
                }
              }
            }

            const startPoint = getSvgPoint(svgElement, event.clientX, event.clientY);
            if (!startPoint) {
              safeStopInteraction(event.interaction);
              return;
            }

            // Check if dragging via video-move-handle
            const moveHandle = event.target.closest?.('.video-move-handle');
            if (moveHandle) {
              const dragTargetId = moveHandle.getAttribute('data-drag-target-id');
              const targetEl = dragTargetId ? container?.querySelector(`[id="${dragTargetId}"]`) : null;
              if (targetEl) {
                target = targetEl;
              }
            }

            // 1. Handle "Selection Priority" - if clicking inside the current selection's box, drag it!
            // (Only for normal select mode, direct mode always targets whatever is hit)
            const selectedId = selectedLayerIdRef.current;
            if (selectedId && selectedSelectToolRef.current !== 'direct') {
              const selectedEl = container?.querySelector(`[id="${selectedId}"]`);
              if (selectedEl && selectedEl !== svgElement) {
                if (hitTest(selectedEl, event.clientX, event.clientY, 2)) {
                  target = selectedEl; // Redirect drag to the current selection!
                }
              }
            }

            // Also allow drag if clicking inside ANY multi-selected element (ignored in direct mode)
            if (selectedSelectToolRef.current !== 'direct' && (target === event.target || target.tagName?.toLowerCase() === 'svg')) {
              const multiIds = multiSelectedIdsRef.current;
              if (multiIds.size > 1) {
                let hitElement = false;
                for (const id of multiIds) {
                  const el = container?.querySelector(`[id="${id}"]`);
                  if (el && el !== svgElement) {
                    if (hitTest(el, event.clientX, event.clientY, 2)) {
                      target = el;
                      hitElement = true;
                      break;
                    }
                  }
                }

                if (!hitElement) {
                  const multiPoly = container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi-selection-bounds') || container?.querySelector('.selection-overlay-layer #overlay-poly-selected-multi');
                  if (multiPoly) {
                    const rect = multiPoly.getBoundingClientRect();
                    if (event.clientX >= rect.left && event.clientX <= rect.right &&
                      event.clientY >= rect.top && event.clientY <= rect.bottom) {
                      const firstEl = container?.querySelector(`[id="${Array.from(multiIds)[0]}"]`);
                      if (firstEl) target = firstEl;
                    }
                  }
                }
              }
            }

            // If background (SVG, Overlay, or Document Shield), stop drag completely
            if (
              target === svgElement ||
              target.getAttribute('data-name') === 'Overlay' ||
              target.getAttribute('data-name') === 'Document Shield' ||
              target.getAttribute('data-type') === 'shield'
            ) {
              safeStopInteraction(event.interaction);
              return;
            }

            let elementToDrag = null;

            if (isConvertedFlipbook) {
              // Converted flipbooks: ONLY allow dragging Free Frames (in interaction/animation mode), Hotspots, shapes, or icons
              let candidate = target;
              let validTarget = null;
              const isInteractiveTool = activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation';
              while (candidate && candidate !== svgElement) {
                if (candidate.getAttribute) {
                  const isHotspot = candidate.getAttribute('data-is-hotspot') === 'true' || candidate.getAttribute('data-type') === 'hotspot';
                  const isFreeFrame = (candidate.getAttribute('data-name') === 'Free Frame' || candidate.getAttribute('data-type') === 'free-frame' || candidate.id?.startsWith('free-frame')) && isInteractiveTool;
                  const isShape = candidate.getAttribute('data-type') === 'shape' && candidate.getAttribute('data-name') !== 'Free Frame' && candidate.getAttribute('data-type') !== 'free-frame' && !candidate.id?.startsWith('free-frame');
                  const isIcon = candidate.getAttribute('data-type') === 'icon';
                  if (isHotspot || isFreeFrame || isShape || isIcon) {
                    validTarget = candidate;
                    break;
                  }
                }
                candidate = candidate.parentElement || candidate.parentNode;
              }

              if (!validTarget || !validTarget.id) {
                safeStopInteraction(event.interaction);
                return;
              }
              elementToDrag = validTarget;
            } else if (selectedSelectToolRef.current === 'direct') {
              const directTarget = getDraggableElement(event.target, svgElement);
              if (directTarget) elementToDrag = directTarget;
            } else {
              // 1. Check current selection first (Selection Priority)
              // Priority: if clicking inside any element already part of the multi-selection, 
              // let's assume the user wants to drag the group (including clicking gaps inside or descendants).
              const currentMultiIds = multiSelectedIdsRef.current;
              if (currentMultiIds.size > 0 && selectedSelectToolRef.current !== 'direct') {
                const entries = Array.from(currentMultiIds);
                for (const id of entries) {
                  const selEl = container?.querySelector(`[id="${id}"]`);
                  if (selEl && selEl !== svgElement) {
                    // Check if we hit the element's bounding box OR one of its descendants
                    let isHit = false;
                    const isMemberHit = target && selEl.contains(target);
                    if (!isMemberHit) {
                      // Only fallback to bbox hitTest if they clicked empty space (SVG/Overlay/BaseFrame),
                      // not another distinct, draggable element sitting on top.
                      const topFrames = getTopLevelFrames(svgElement);
                      const leaf = getDraggableElement(target, svgElement);
                      const isBase = leaf ? topFrames.some(f => f.id === leaf.id) : true;
                      if (isBase || target === svgElement || target.getAttribute('data-name') === 'Overlay') {
                        isHit = hitTest(selEl, event.clientX, event.clientY, 2);
                      }
                    }

                    if (isHit || isMemberHit) {
                      // Only allow dragging if it's NOT the root page-level frame
                      const topFrames = getTopLevelFrames(svgElement);
                      const isMainPageFrame = topFrames.length === 1 && selEl.id === topFrames[0].id;

                      if (!isMainPageFrame) {
                        elementToDrag = selEl;
                        break; // Found it!
                      }
                    }
                  }
                }
              }

              // 2. If nothing selected or selection not hit, find a new candidate
              // 2. Identify candidate from hit-test (Drill-down support)
              if (!elementToDrag) {
                const frameId = currentFrameIdRef.current;
                let context = frameId ? svgElement.querySelector(`[id="${frameId}"]`) : svgElement;

                // Auto-Enter logic for root frames (matching mousedown behavior)
                const topFrames = getTopLevelFrames(svgElement);
                if (!frameId) {
                  const hitFrame = topFrames.find(f => hitTest(f, event.clientX, event.clientY));
                  if (hitFrame) {
                    context = hitFrame;
                    if (setCurrentFrameId) {
                      setCurrentFrameId(hitFrame.id);
                      currentFrameIdRef.current = hitFrame.id;
                    }
                  }
                }

                // Find deepest hit leaf
                const leafTarget = getDraggableElement(event.target, svgElement);
                if (leafTarget) {
                  // Drill UP from leaf to find the child of our active context
                  let candidate = leafTarget;
                  while (candidate.parentNode && candidate.parentNode !== context && candidate.parentNode !== svgElement) {
                    candidate = candidate.parentNode;
                  }

                  // If candidate is an arbitrary group container (not a user-created group or hotspot), prefer leafTarget so user can select & edit individual elements!
                  const isUserGroupCandidate = candidate.tagName?.toLowerCase() === 'g' && (
                    candidate.getAttribute('data-type') === 'group' ||
                    (candidate.getAttribute('data-name') || '').toLowerCase() === 'group' ||
                    candidate.id.startsWith('group-') ||
                    candidate.getAttribute('data-is-hotspot') === 'true' ||
                    candidate.getAttribute('data-type') === 'hotspot'
                  ) && candidate.getAttribute('data-is-image-group') !== 'true' && candidate.getAttribute('data-is-video-group') !== 'true' && candidate.getAttribute('data-is-gif-group') !== 'true';

                  if (!isUserGroupCandidate && leafTarget && leafTarget.id && leafTarget.getAttribute('data-name') !== 'Overlay') {
                    candidate = leafTarget;
                  }

                  // Validate if candidate is draggable (not the base frame background)
                  const isBaseFrame = topFrames.some(f => f.id === candidate.id);
                  if (!isBaseFrame && candidate.id && candidate.getAttribute('data-name') !== 'Overlay') {
                    elementToDrag = candidate;
                  }
                }
              }
            }

            // Safety check for metadata-based 'locked' or 'hidden'
            if (!elementToDrag ||
              elementToDrag.getAttribute('data-hidden') === 'true' ||
              elementToDrag.getAttribute('data-locked') === 'true' ||
              elementToDrag.getAttribute('data-name') === 'Overlay') {
              safeStopInteraction(event.interaction);
              return;
            }

            // In Trim View, elements completely outside cannot be auto-selected or dragged directly from canvas
            if (elementToDrag.getAttribute('data-trim-outside') === 'true') {
              const isSelected = (selectedLayerIdRef.current === elementToDrag.id) ||
                (multiSelectedIdsRef.current && multiSelectedIdsRef.current.has(elementToDrag.id));
              if (!isSelected) {
                safeStopInteraction(event.interaction);
                return;
              }
            }

            // In normal edit mode, Free Frames must NEVER be dragged or auto-selected!
            const isDragFreeFrame = elementToDrag.getAttribute('data-name') === 'Free Frame' ||
              elementToDrag.getAttribute('data-type') === 'free-frame' ||
              (elementToDrag.id && elementToDrag.id.startsWith('free-frame'));
            if (isDragFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') {
              safeStopInteraction(event.interaction);
              return;
            }

            let allowDrag = true;
            // Block dragging in Interaction/Animation mode UNLESS it's a Free Frame OR a Hotspot
            if ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') &&
              elementToDrag.getAttribute('data-name') !== 'Free Frame' &&
              elementToDrag.getAttribute('data-is-hotspot') !== 'true') {
              allowDrag = false;
              safeStopInteraction(event.interaction);
              // We STILL want to allow auto-select to run below, so we don't return here.
            }

            // 2. AUTO-SELECT if not already selected
            const isSelected = (selectedLayerIdRef.current === elementToDrag.id) ||
              (multiSelectedIdsRef.current && multiSelectedIdsRef.current.has(elementToDrag.id));

            if (!isSelected) {
              if (setSelectedLayerId) {
                setSelectedLayerId(elementToDrag.id);
                if (setMultiSelectedIds) setMultiSelectedIds(new Set([elementToDrag.id]));
                // Force update ref so it's visible to subsequent drag steps
                selectedLayerIdRef.current = elementToDrag.id;
                multiSelectedIdsRef.current = new Set([elementToDrag.id]);

                // Visualize selection immediately
                const highlightType = currentFrameIdRef.current && elementToDrag.id !== currentFrameIdRef.current ? 'child-selected' : 'selected';
                drawOverlayHighlight(elementToDrag, highlightType);
              }
            }

            // ── Build multi-drag list: all multi-selected elements in the same SVG ──
            const multiIds = multiSelectedIdsRef.current;
            const multiDragItems = [];

            const getLocalPoint = (svgElement, targetNode, clientX, clientY) => {
              if (!svgElement || !targetNode) return null;
              const pt = svgElement.createSVGPoint();
              pt.x = clientX;
              pt.y = clientY;
              try {
                const ctm = targetNode.getScreenCTM();
                if (!ctm) return null;
                return pt.matrixTransform(ctm.inverse());
              } catch {
                return null;
              }
            };

            if (allowDrag) {
              if (multiIds.size > 1) {
                for (const id of multiIds) {
                  const el = container?.querySelector(`[id="${id}"]`);
                  if (el && el !== svgElement &&
                    el.getAttribute('data-hidden') !== 'true' &&
                    el.getAttribute('data-locked') !== 'true') {
                    multiDragItems.push({
                      element: el,
                      initialMatrix: getElementMatrix(el),
                      startPointLocal: getLocalPoint(svgElement, el.parentNode, event.clientX, event.clientY)
                    });
                  }
                }
              }
            }

            event.interaction.dragState = {
              element: elementToDrag,
              startPoint: startPoint,
              startPointLocal: getLocalPoint(svgElement, elementToDrag.parentNode, event.clientX, event.clientY),
              initialMatrix: getElementMatrix(elementToDrag),
              svgElement: svgElement,
              pageIndex: activePageIndex,
              // Multi-drag support
              multiDragItems: multiDragItems.length > 0 ? multiDragItems : null,
              initialClientX: event.clientX,
              initialClientY: event.clientY,
              thresholdMet: false
            };
          },
          move(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            // ── RE-SYNC: If React re-rendered and the original nodes were detached, ──
            // find the new live nodes in the DOM by their IDs to keep the drag alive.
            const liveSvg = document.querySelector(`.page-svg-container[data-page-index="${dragState.pageIndex}"] [id^="canvas-content-"] > svg`);
            if (dragState.svgElement && !dragState.svgElement.isConnected) {
              if (liveSvg) dragState.svgElement = liveSvg;
            }
            if (dragState.element && !dragState.element.isConnected) {
              const liveEl = liveSvg?.querySelector(`[id="${CSS.escape(dragState.element.id)}"]`) || document.getElementById(dragState.element.id);
              if (liveEl) dragState.element = liveEl;
            }
            if (dragState.multiDragItems) {
              for (const item of dragState.multiDragItems) {
                if (!item.element.isConnected) {
                  const liveEl = liveSvg?.querySelector(`[id="${CSS.escape(item.element.id)}"]`) || document.getElementById(item.element.id);
                  if (liveEl) item.element = liveEl;
                }
              }
            }

            const getLocalPoint = (svgElement, targetNode, clientX, clientY) => {
              if (!svgElement || !targetNode) return null;
              const pt = svgElement.createSVGPoint();
              pt.x = clientX;
              pt.y = clientY;
              try {
                const ctm = targetNode.getScreenCTM();
                if (!ctm) return null;
                return pt.matrixTransform(ctm.inverse());
              } catch {
                return null;
              }
            };

            if (!dragState.thresholdMet) {
              const DRAG_THRESHOLD = 2;
              const dxClient = event.clientX - dragState.initialClientX;
              const dyClient = event.clientY - dragState.initialClientY;
              const distance = Math.sqrt(dxClient * dxClient + dyClient * dyClient);

              if (distance < DRAG_THRESHOLD) {
                return; // Do nothing until threshold is met
              }

              // Threshold crossed!
              dragState.thresholdMet = true;
              document.body.classList.add('dragging-active');

              // Prevent jumping by resetting start points to current mouse pos
              dragState.startPointLocal = getLocalPoint(dragState.svgElement, dragState.element.parentNode, event.clientX, event.clientY);
              if (dragState.multiDragItems) {
                for (const item of dragState.multiDragItems) {
                  item.startPointLocal = getLocalPoint(dragState.svgElement, item.element.parentNode, event.clientX, event.clientY);
                  item.element.setAttribute('data-dragging', 'true');
                }
              } else {
                dragState.element.setAttribute('data-dragging', 'true');
              }

              // Initialize smart guide snapping candidates and initial bounds
              initSmartGuides(dragState);
            }

            const isAltPressedCurrent = (event.altKey || (event.sourceEvent && event.sourceEvent.altKey)) && !nodeEditModeRef.current;
            if (isAltPressedCurrent && !dragState.hasDuplicated) {
              dragState.hasDuplicated = true;

              const newSelectedIds = new Set();
              const generateId = () => `dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

              const cloneElement = (el) => {
                const clone = el.cloneNode(true);
                clone.id = generateId();
                clone.removeAttribute('data-dragging');
                const elementsWithId = clone.querySelectorAll('[id]');
                elementsWithId.forEach(child => {
                  child.id = generateId();
                });
                return clone;
              };

              if (dragState.multiDragItems) {
                for (const item of dragState.multiDragItems) {
                  item.originalElement = item.element;
                  // Reset original element to initial position
                  item.originalElement.setAttribute('transform', matrixToTransform(item.initialMatrix));
                  item.originalElement.removeAttribute('data-dragging');

                  const clone = cloneElement(item.element);
                  item.element.parentNode.insertBefore(clone, item.element.nextSibling);
                  item.element = clone;
                  item.element.setAttribute('data-dragging', 'true');
                  newSelectedIds.add(clone.id);
                }
                if (setMultiSelectedIds) setMultiSelectedIds(newSelectedIds);
                if (setSelectedLayerId) setSelectedLayerId(Array.from(newSelectedIds)[0]);
                multiSelectedIdsRef.current = newSelectedIds;
                selectedLayerIdRef.current = Array.from(newSelectedIds)[0];
              } else {
                dragState.originalElement = dragState.element;
                // Reset original element to initial position
                dragState.originalElement.setAttribute('transform', matrixToTransform(dragState.initialMatrix));
                dragState.originalElement.removeAttribute('data-dragging');

                const clone = cloneElement(dragState.element);
                dragState.element.parentNode.insertBefore(clone, dragState.element.nextSibling);
                dragState.element = clone;
                dragState.element.setAttribute('data-dragging', 'true');
                newSelectedIds.add(clone.id);
                if (setSelectedLayerId) setSelectedLayerId(clone.id);
                if (setMultiSelectedIds) setMultiSelectedIds(newSelectedIds);
                selectedLayerIdRef.current = clone.id;
                multiSelectedIdsRef.current = newSelectedIds;
              }
            }

            if (dragState.multiDragItems) {
              // Move ALL multi-selected elements freely across canvas with smart snapping
              const primaryItem = dragState.multiDragItems[0];
              const pPointLocal = getLocalPoint(dragState.svgElement, primaryItem.element.parentNode, event.clientX, event.clientY);
              let rawDx = pPointLocal && primaryItem.startPointLocal ? (pPointLocal.x - primaryItem.startPointLocal.x) : 0;
              let rawDy = pPointLocal && primaryItem.startPointLocal ? (pPointLocal.y - primaryItem.startPointLocal.y) : 0;

              const snap = computeSmartGuides({
                dragState,
                rawDx,
                rawDy,
                zoomScale: zoom / 100,
                disabled: event.ctrlKey || event.metaKey
              });

              for (const item of dragState.multiDragItems) {
                const translation = new DOMMatrix().translate(snap.snappedDx, snap.snappedDy);
                const nextMatrix = translation.multiply(item.initialMatrix);
                item.element.setAttribute('transform', matrixToTransform(nextMatrix));
              }
              drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
              renderSmartGuides(dragState.pageIndex, snap.guides, snap.badge, zoom / 100, dragState.svgElement);
            } else {
              // Single element drag with smart snapping, magenta guidelines, and coordinate badge
              const target = dragState.element;
              const currentPointLocal = getLocalPoint(dragState.svgElement, target.parentNode, event.clientX, event.clientY);
              if (!currentPointLocal || !dragState.startPointLocal) return;

              let dx = currentPointLocal.x - dragState.startPointLocal.x;
              let dy = currentPointLocal.y - dragState.startPointLocal.y;

              const snap = computeSmartGuides({
                dragState,
                rawDx: dx,
                rawDy: dy,
                zoomScale: zoom / 100,
                disabled: event.ctrlKey || event.metaKey
              });

              const translation = new DOMMatrix().translate(snap.snappedDx, snap.snappedDy);
              const nextMatrix = translation.multiply(dragState.initialMatrix);
              target.setAttribute('transform', matrixToTransform(nextMatrix));

              // dynamically update the outline while dragging
              const highlightType = currentFrameIdRef.current && target.id !== currentFrameIdRef.current ? 'child-selected' : 'selected';
              drawOverlayHighlight(target, highlightType);

              if (localTrimViewRef.current && dragState.svgElement) {
                const isOutside = isElementCompletelyOutside(target, dragState.svgElement);
                if (isOutside) {
                  target.setAttribute('data-trim-outside', 'true');
                } else {
                  target.removeAttribute('data-trim-outside');
                }
                if (dragState.multiDragItems) {
                  dragState.multiDragItems.forEach(item => {
                    const out = isElementCompletelyOutside(item.element, dragState.svgElement);
                    if (out) item.element.setAttribute('data-trim-outside', 'true');
                    else item.element.removeAttribute('data-trim-outside');
                  });
                }
              }

              // Render smart guide lines and floating coordinate badge
              renderSmartGuides(dragState.pageIndex, snap.guides, snap.badge, zoom / 100, dragState.svgElement);
            }

            if (isAltPressedCurrent && drawMeasurementOverlayRef.current) {
              let targetForMeasurement = null;
              if (dragState.originalElement && dragState.originalElement.id !== dragState.element.id) {
                targetForMeasurement = dragState.originalElement;
              } else if (dragState.multiDragItems && dragState.multiDragItems[0].originalElement && dragState.multiDragItems[0].originalElement.id !== dragState.multiDragItems[0].element.id) {
                targetForMeasurement = dragState.multiDragItems.map(item => item.originalElement);
              }
              if (!targetForMeasurement) {
                targetForMeasurement = (dragState.element.parentElement && dragState.element.parentElement.closest('[data-type="frame"]')) || dragState.svgElement.querySelector('[data-type="background"]');
              }
              drawMeasurementOverlayRef.current(targetForMeasurement, true);
            } else if (document.querySelector('.measurement-overlay-group')) {
              document.querySelectorAll('.measurement-overlay-group').forEach(el => el.remove());
            }

            suppressClickRef.current = true;
          },
          end(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) {
              document.body.classList.remove('dragging-active');
              return;
            }

            clearSmartGuides(dragState.pageIndex);

            if (!dragState.thresholdMet) {
              document.body.classList.remove('dragging-active');
              delete event.interaction.dragState;
              return;
            }

            const viewBox = dragState.svgElement.getAttribute('viewBox');
            const [, , baseWidth, baseHeight] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 210, 297];

            if (localTrimViewRef.current && dragState.svgElement) {
              const isOutside = isElementCompletelyOutside(dragState.element, dragState.svgElement);
              if (isOutside) {
                dragState.element.setAttribute('data-trim-outside', 'true');
              } else {
                dragState.element.removeAttribute('data-trim-outside');
              }
              if (dragState.multiDragItems) {
                dragState.multiDragItems.forEach(item => {
                  const out = isElementCompletelyOutside(item.element, dragState.svgElement);
                  if (out) item.element.setAttribute('data-trim-outside', 'true');
                  else item.element.removeAttribute('data-trim-outside');
                });
              }
            }

            const finalizeEnd = () => {
              document.body.classList.remove('dragging-active');
              if (suppressClickRef.current && updatePageHtml) {
                const container = dragState.element.closest('.page-svg-container');
                const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : dragState.pageIndex;
                saveModifiedPageHtml(pageIdx, dragState.svgElement);
              }

              setTimeout(() => {
                suppressClickRef.current = false;
              }, 50);

              const svgEl = dragState.svgElement;
              const pageIndex = dragState.pageIndex;
              delete event.interaction.dragState;

              if (updatePageHtmlRef.current && svgEl) {
                updatePageHtmlRef.current(pageIndex, svgEl.outerHTML);
              }

              // Restore handles and highlight overlay
              if (dragState.multiDragItems) {
                drawMultiSelectionHighlight(multiSelectedIdsRef.current, 'selected');
              } else if (dragState.element) {
                const highlightType = currentFrameIdRef.current && dragState.element.id !== currentFrameIdRef.current ? 'child-selected' : 'selected';
                drawOverlayHighlight(dragState.element, highlightType);
              }
            };

            const constrainElement = (el, onComplete) => {
              if (!el || typeof el.getBBox !== 'function') return false;

              let ctm, rootCtm, parentCtm;
              try {
                ctm = el.getScreenCTM();
                rootCtm = dragState.svgElement.getScreenCTM();
                parentCtm = el.parentNode.getScreenCTM();
              } catch {
                return false;
              }
              if (!ctm || !rootCtm || !parentCtm) return false;
              const bbox = getVisualBBox(el);
              const localToRoot = toDOMMatrix(rootCtm).inverse().multiply(toDOMMatrix(ctm));

              const pt1 = new DOMPoint(bbox.x, bbox.y).matrixTransform(localToRoot);
              const pt2 = new DOMPoint(bbox.x + bbox.width, bbox.y).matrixTransform(localToRoot);
              const pt3 = new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(localToRoot);
              const pt4 = new DOMPoint(bbox.x, bbox.y + bbox.height).matrixTransform(localToRoot);

              const minX = Math.min(pt1.x, pt2.x, pt3.x, pt4.x);
              const maxX = Math.max(pt1.x, pt2.x, pt3.x, pt4.x);
              const minY = Math.min(pt1.y, pt2.y, pt3.y, pt4.y);
              const maxY = Math.max(pt1.y, pt2.y, pt3.y, pt4.y);

              const bounds = getCanvasBounds(dragState.svgElement, baseWidth, baseHeight);
              const MARGIN_MM = 10;

              let dx_root = 0;
              let dy_root = 0;

              if (minX < bounds.minX) dx_root = (bounds.minX + MARGIN_MM) - minX;
              else if (maxX > bounds.maxX) dx_root = (bounds.maxX - MARGIN_MM) - maxX;

              if (minY < bounds.minY) dy_root = (bounds.minY + MARGIN_MM) - minY;
              else if (maxY > bounds.maxY) dy_root = (bounds.maxY - MARGIN_MM) - maxY;

              if (dx_root !== 0 || dy_root !== 0) {
                const rootToParent = toDOMMatrix(parentCtm).inverse().multiply(toDOMMatrix(rootCtm));
                const p0 = new DOMPoint(0, 0).matrixTransform(rootToParent);
                const p1 = new DOMPoint(dx_root, dy_root).matrixTransform(rootToParent);

                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;

                const matrix = getElementMatrix(el);
                const startE = matrix.e;
                const startF = matrix.f;
                const translation = new DOMMatrix().translate(dx, dy);
                const endMatrix = translation.multiply(matrix);
                const endE = endMatrix.e;
                const endF = endMatrix.f;

                const duration = 200;
                const startTime = performance.now();
                const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

                const animate = (currentTime) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  const eased = easeOutQuart(progress);

                  matrix.e = startE + (endE - startE) * eased;
                  matrix.f = startF + (endF - startF) * eased;

                  el.setAttribute('transform', matrixToTransform(matrix));
                  const highlightType = currentFrameIdRef.current && el.id !== currentFrameIdRef.current ? 'child-selected' : 'selected';
                  drawOverlayHighlight(el, highlightType);

                  if (progress < 1) {
                    requestAnimationFrame(animate);
                  } else {
                    onComplete();
                  }
                };

                requestAnimationFrame(animate);
                return true;
              }
              return false;
            };

            if (dragState.multiDragItems) {
              let activeAnimations = 0;
              let hasAnimation = false;
              for (const item of dragState.multiDragItems) {
                item.element.removeAttribute('data-dragging');
                const isAnimating = constrainElement(item.element, () => {
                  activeAnimations--;
                  if (activeAnimations === 0) finalizeEnd();
                });
                if (isAnimating) {
                  activeAnimations++;
                  hasAnimation = true;
                }
              }
              if (!hasAnimation) finalizeEnd();
            } else {
              dragState.element.removeAttribute('data-dragging');
              const hasAnimation = constrainElement(dragState.element, finalizeEnd);
              if (!hasAnimation) finalizeEnd();
            }
          }
        }
      });

    return () => {
      interactable.unset();
      clearSmartGuides();
      document.body.classList.remove('dragging-active');
    };
  }, [zoom, activePageIndex]); // No longer depends on frequently changing callbacks

  useEffect(() => {
    const interactable = interact('.resize-handle')
      .styleCursor(false)
      .rectChecker(safeRectChecker)
      .draggable({
        cursorChecker: () => null,
        listeners: {
          start(event) {
            suppressClickRef.current = true;
            const handle = event.target;
            const handleId = handle.id;
            const match = handleId.match(/resize-handle-(?:(.+)-edge|(.+))-(nw|ne|se|sw|n|e|s|w|linestart|lineend)$/);
            if (!match) return;

            const elId = match[1] || match[2];
            const dir = match[3];

            // Resolve target element scoped to active page container and canvas SVG
            const pageContainer = handle.closest('.page-svg-container');
            const canvasContent = pageContainer?.querySelector('[id^="canvas-content-"]');
            const canvasSvg = canvasContent?.querySelector('svg') || pageContainer?.querySelector('svg:not([id^="highlight-overlay-"])');

            let el = null;
            if (canvasSvg) {
              try {
                el = canvasSvg.querySelector(`[id="${CSS.escape(elId)}"]`);
              } catch {
                el = canvasSvg.querySelector(`[id="${elId}"]`);
              }
            }
            if (!el && pageContainer) {
              try {
                el = pageContainer.querySelector(`[id="${CSS.escape(elId)}"]`);
              } catch {
                el = pageContainer.querySelector(`[id="${elId}"]`);
              }
            }
            if (!el) {
              el = document.getElementById(elId);
            }

            // If grabbing the multi-selection bounding box handles, force into multi path.
            // (The dummy <rect id="multi-selection-bounds"> lives in the overlay SVG, so
            //  getElementById() finds it — but we must NOT treat it as a real canvas element.)
            if (el && (elId === 'multi' || elId === 'multi-selection-bounds') && multiSelectedIdsRef.current.size > 1) {
              el = null;
            }

            let isMulti = false;
            let multiIds = [];
            let bbox = null;
            let matrix = new DOMMatrix();

            const resolveChild = (id) => {
              if (canvasSvg) {
                try {
                  const c = canvasSvg.querySelector(`[id="${CSS.escape(id)}"]`);
                  if (c) return c;
                } catch { /* ignored */ }
              }
              if (pageContainer) {
                try {
                  const c = pageContainer.querySelector(`[id="${CSS.escape(id)}"]`);
                  if (c) return c;
                } catch { /* ignored */ }
              }
              return document.getElementById(id);
            };

            if (!el) {
              if ((elId === 'multi' || elId === 'multi-selection-bounds') && multiSelectedIdsRef.current.size > 1) {
                isMulti = true;
                multiIds = Array.from(multiSelectedIdsRef.current);

                const childrenList = multiIds.map(resolveChild).filter(Boolean);
                if (childrenList.length === 0) return;

                const activeCanvasSvg = childrenList[0].ownerSVGElement || canvasSvg;
                if (!activeCanvasSvg) return;
                const svgRootCTM = activeCanvasSvg.getScreenCTM();
                if (!svgRootCTM) return;
                const svgRootInv = toDOMMatrix(svgRootCTM).inverse();

                // Helper: convert a child's local bbox corner to SVG root space
                const childLocalToSvgRoot = (child, px, py) => {
                  const childCTM = child.getScreenCTM();
                  if (!childCTM) return { x: px, y: py };
                  // screen = childCTM * local, svgRoot = svgRootInv * screen
                  return new DOMPoint(px, py).matrixTransform(toDOMMatrix(childCTM)).matrixTransform(svgRootInv);
                };

                // Compute common rotation of the multi-selection
                const angles = childrenList.map(child => {
                  const m = getElementMatrix(child);
                  const isFlipH = child.getAttribute('data-flip-h') === 'true';
                  const isFlipV = child.getAttribute('data-flip-v') === 'true';
                  let a = Math.atan2(m.b, m.a) * (180 / Math.PI);
                  if (isFlipH && !isFlipV) a = Math.atan2(-m.b, -m.a) * (180 / Math.PI);
                  return ((a % 360) + 360) % 360;
                });
                const firstAngle = angles[0] ?? 0;
                const isCommonRotation = angles.every(a => {
                  const diff = Math.abs(a - firstAngle);
                  return Math.min(diff, 360 - diff) < 1.0;
                });
                const commonRotation = isCommonRotation ? firstAngle : 0;
                const rad = commonRotation * (Math.PI / 180);
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                let minRotX = Infinity, maxRotX = -Infinity, minRotY = Infinity, maxRotY = -Infinity;
                childrenList.forEach(child => {
                  const cb = getVisualBBox(child);
                  const p1 = childLocalToSvgRoot(child, cb.x, cb.y);
                  const p2 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y);
                  const p3 = childLocalToSvgRoot(child, cb.x, cb.y + cb.height);
                  const p4 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y + cb.height);
                  [p1, p2, p3, p4].forEach(p => {
                    const rx = p.x * cos + p.y * sin;
                    const ry = -p.x * sin + p.y * cos;
                    if (rx < minRotX) minRotX = rx;
                    if (rx > maxRotX) maxRotX = rx;
                    if (ry < minRotY) minRotY = ry;
                    if (ry > maxRotY) maxRotY = ry;
                  });
                });

                bbox = { x: minRotX, y: minRotY, width: maxRotX - minRotX, height: maxRotY - minRotY };
                matrix = new DOMMatrix().rotate(commonRotation);

                el = {
                  id: 'multi-selection-bounds',
                  tagName: 'multi',
                  getAttribute: () => null,
                  hasAttribute: () => false,
                  setAttribute: () => {},
                  removeAttribute: () => {},
                  querySelector: () => null,
                  querySelectorAll: () => [],
                  closest: (sel) => (pageContainer && pageContainer.matches?.(sel)) ? pageContainer : null,
                  getScreenCTM: () => activeCanvasSvg.getScreenCTM(),
                  parentNode: activeCanvasSvg,
                  ownerSVGElement: activeCanvasSvg,
                  _svgRootInv: svgRootInv,
                  _svgRootCTM: svgRootCTM,
                  _childLocalToSvgRoot: childLocalToSvgRoot,
                  _commonRotation: commonRotation,
                  style: {},
                  classList: { contains: () => false }
                };
              } else {
                return;
              }
            } else {
              const parentCtm = el.parentNode ? el.parentNode.getScreenCTM() : null;
              const ctm = el.getScreenCTM();
              if (parentCtm && ctm) {
                matrix = toDOMMatrix(parentCtm).inverse().multiply(toDOMMatrix(ctm));
              } else {
                matrix = getElementMatrix(el);
              }
              bbox = getVisualBBox(el);
              if (el.getAttribute('data-is-hotspot') === 'true' && el.querySelector('rect') && (el.querySelector('text') || el.querySelector('[data-type="text"]'))) {
                const rc = el.querySelector('rect');
                const rw = parseFloat(rc.getAttribute('width')) || 0;
                const rh = parseFloat(rc.getAttribute('height')) || 0;
                const rx = parseFloat(rc.getAttribute('x') || '0');
                const ry = parseFloat(rc.getAttribute('y') || '0');
                if (rw > 0 && rh > 0) {
                  bbox = { x: rx, y: ry, width: rw, height: rh };
                }
              }
            }

            const svg = el.ownerSVGElement || canvasSvg;
            const parentCtmForStart = el.parentNode ? el.parentNode.getScreenCTM() : svg?.getScreenCTM();
            let startPoint = null;
            if (parentCtmForStart && svg) {
              const pt = svg.createSVGPoint();
              pt.x = event.clientX;
              pt.y = event.clientY;
              startPoint = pt.matrixTransform(parentCtmForStart.inverse());
            } else {
              startPoint = getSvgPoint(svg, event.clientX, event.clientY);
            }

            // ── CONVERT <text> TO <foreignObject> ON RESIZE START ──
            if (!isMulti && el.tagName.toLowerCase() === 'text') {
              const fo = convertTextToForeignObject(el);
              if (fo) {
                el.replaceWith(fo);
                el = fo;
              }
            }

            // Lock cursor globally while dragging to prevent flicker
            const currentCursor = window.getComputedStyle(handle).cursor;
            document.documentElement.style.setProperty('--resizing-cursor', currentCursor);
            document.body.style.cursor = currentCursor;
            document.body.classList.add('resizing-active');

            // Define anchor point in local space (opposite point)
            let localAnchor;
            if (dir === 'se') localAnchor = { x: bbox.x, y: bbox.y };
            else if (dir === 'sw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'ne') localAnchor = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'nw') localAnchor = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
            else if (dir === 'n') localAnchor = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
            else if (dir === 's') localAnchor = { x: bbox.x + bbox.width / 2, y: bbox.y };
            else if (dir === 'e') localAnchor = { x: bbox.x, y: bbox.y + bbox.height / 2 };
            else if (dir === 'w') localAnchor = { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 };
            else if (dir === 'linestart' || dir === 'lineend') localAnchor = { x: bbox.x, y: bbox.y };

            const worldAnchor = new DOMPoint(localAnchor.x, localAnchor.y).matrixTransform(matrix);

            let childrenData = null;
            const isGroupOrImageEl = isMulti || (el.tagName && (
              el.tagName.toLowerCase() === 'g' ||
              el.tagName.toLowerCase() === 'image' ||
              el.tagName.toLowerCase() === 'svg' ||
              el.getAttribute('data-type') === 'image' ||
              el.getAttribute('data-type') === 'video' ||
              el.getAttribute('data-type') === 'gif'
            ));
            if (isGroupOrImageEl) {
              const childrenList = isMulti ? multiIds.map(resolveChild).filter(Boolean) : (el.tagName.toLowerCase() === 'g' && el.children.length > 0 ? Array.from(el.children) : [el]);
              const childLocalToSvgRoot = el._childLocalToSvgRoot;
              childrenData = childrenList.map(child => {
                let cb = getVisualBBox(child);
                if ((child.tagName?.toLowerCase() === 'svg' || child.tagName?.toLowerCase() === 'image' || child.tagName?.toLowerCase() === 'rect') && el.getAttribute('data-is-hotspot') === 'true') {
                  cb = {
                    x: parseFloat(child.getAttribute('x') || '0'),
                    y: parseFloat(child.getAttribute('y') || '0'),
                    width: parseFloat(child.getAttribute('width') || child.viewBox?.baseVal?.width || '48'),
                    height: parseFloat(child.getAttribute('height') || child.viewBox?.baseVal?.height || '48')
                  };
                }
                const cMatrix = getElementMatrix(child);
                const svgRootInv = el._svgRootInv;
                const childCTM = child.getScreenCTM();
                const childWorldMatrix = (svgRootInv && childCTM) ? toDOMMatrix(svgRootInv).multiply(toDOMMatrix(childCTM)) : toDOMMatrix(cMatrix);

                let minX, maxX, minY, maxY;
                if (isMulti && childLocalToSvgRoot) {
                  // For multi-selection: convert to SVG root space via getScreenCTM
                  const p1 = childLocalToSvgRoot(child, cb.x, cb.y);
                  const p2 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y);
                  const p3 = childLocalToSvgRoot(child, cb.x, cb.y + cb.height);
                  const p4 = childLocalToSvgRoot(child, cb.x + cb.width, cb.y + cb.height);
                  minX = Math.min(p1.x, p2.x, p3.x, p4.x);
                  maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
                  minY = Math.min(p1.y, p2.y, p3.y, p4.y);
                  maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
                } else {
                  // For single-element groups: use element's own matrix (parent-local space)
                  const p1 = new DOMPoint(cb.x, cb.y).matrixTransform(cMatrix);
                  const p2 = new DOMPoint(cb.x + cb.width, cb.y).matrixTransform(cMatrix);
                  const p3 = new DOMPoint(cb.x, cb.y + cb.height).matrixTransform(cMatrix);
                  const p4 = new DOMPoint(cb.x + cb.width, cb.y + cb.height).matrixTransform(cMatrix);
                  minX = Math.min(p1.x, p2.x, p3.x, p4.x);
                  maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
                  minY = Math.min(p1.y, p2.y, p3.y, p4.y);
                  maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
                }
                const bound = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

                const fracX = (bbox.width - bound.width) <= 0.001 ? 0.5 : (bound.x - bbox.x) / (bbox.width - bound.width);
                const fracY = (bbox.height - bound.height) <= 0.001 ? 0.5 : (bound.y - bbox.y) / (bbox.height - bound.height);

                const childVb = child.getAttribute('viewBox');
                let vbX = 0, vbY = 0;
                if (childVb) {
                  const parts = childVb.split(/[\s,]+/).map(parseFloat);
                  if (parts.length === 4) { vbX = parts[0]; vbY = parts[1]; }
                }

                let initialFontSize = null;
                if (child.tagName?.toLowerCase() === 'text' || child.getAttribute('data-type') === 'text') {
                  initialFontSize = parseFloat(child.getAttribute('font-size') || child.style?.fontSize || '14');
                  child.setAttribute('data-base-font-size', initialFontSize);
                }
                let initialRect = null;
                if (child.tagName?.toLowerCase() === 'rect') {
                  initialRect = {
                    x: parseFloat(child.getAttribute('x') || '0'),
                    y: parseFloat(child.getAttribute('y') || '0'),
                    width: parseFloat(child.getAttribute('width') || '80'),
                    height: parseFloat(child.getAttribute('height') || '32'),
                    rx: parseFloat(child.getAttribute('rx') || '4')
                  };
                  child.setAttribute('data-base-rx', initialRect.rx);
                }

                return { child, initialMatrix: cMatrix, childWorldMatrix, bound, fracX, fracY, initialVbX: vbX, initialVbY: vbY, initialFontSize, initialRect };
              });
            }

            // Store initial image child state for crop-on-resize
            const isImageGroupResize = (
              el.tagName?.toLowerCase() === 'g' ||
              el.tagName?.toLowerCase() === 'image' ||
              el.tagName?.toLowerCase() === 'svg' ||
              el.getAttribute('data-type') === 'image' ||
              el.getAttribute('data-type') === 'video' ||
              el.getAttribute('data-type') === 'gif'
            ) && ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].includes(dir);

            let initialImgState = null;
            if (isImageGroupResize) {
              const imgEl = el.querySelector('image, video, img, foreignObject') || (['image', 'video', 'svg'].includes(el.tagName?.toLowerCase()) ? el : null);
              let natW = 0, natH = 0;
              if (imgEl) {
                const href = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href') || imgEl.src;
                if (href) {
                  const temp = new Image();
                  temp.src = href;
                  natW = temp.naturalWidth;
                  natH = temp.naturalHeight;
                }
                initialImgState = {
                  x: parseFloat(imgEl.getAttribute('x') || '0'),
                  y: parseFloat(imgEl.getAttribute('y') || '0'),
                  w: parseFloat(imgEl.getAttribute('width') || '0'),
                  h: parseFloat(imgEl.getAttribute('height') || '0'),
                  natW,
                  natH
                };
              }
            }

            let initialCrop = {};
            try {
              const cropStr = el.getAttribute('data-crop-data');
              if (cropStr && cropStr !== 'null') {
                initialCrop = JSON.parse(cropStr);
              }
            } catch { /* ignored */ }

            const initialObjectFit = el.getAttribute('data-object-fit') || 'Fit';

            event.interaction.resizeState = {
              el,
              dir,
              matrix,
              bbox,
              worldAnchor,
              localAnchor,
              startPoint,
              svg,
              pageContainer,
              pageIdx: pageContainer ? parseInt(pageContainer.getAttribute('data-page-index')) : activePageIndex,
              childrenData,
              isImageGroupResize,
              initialImgState,
              initialCrop,
              initialObjectFit,
              cropInitialized: false,
              cursor: currentCursor // Store for reinforcement
            };

            // Initialize smart guides candidates for resizing
            event.interaction.resizeState.element = el;
            event.interaction.resizeState.svgElement = svg;
            if (isMulti && multiIds.length > 0) {
              event.interaction.resizeState.multiDragItems = multiIds.map(id => ({
                element: resolveChild(id) || document.getElementById(id)
              })).filter(item => Boolean(item.element));
            }
            initSmartGuides(event.interaction.resizeState);
          },
          move(event) {
            const state = event.interaction.resizeState;
            if (!state) return;

            // Reinforce cursor during move to prevent flicker from other handlers or React re-renders
            if (state.cursor && document.body.style.cursor !== state.cursor) {
              document.body.style.cursor = state.cursor;
              document.documentElement.style.setProperty('--resizing-cursor', state.cursor);
              if (!document.body.classList.contains('resizing-active')) {
                document.body.classList.add('resizing-active');
              }
            }

            // Sync shape stroke overlays dynamically
            const syncOverlay = (targetEl) => {
              if (!targetEl) return;
              const overlay = targetEl.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${targetEl.id}"]`);
              if (overlay) {
                const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'points'];
                const svg = targetEl.ownerSVGElement;
                const clip = svg?.querySelector(`clipPath[id="clip-shape-${targetEl.id}"]`);
                const mask = svg?.querySelector(`mask[id="mask-shape-${targetEl.id}"]`);
                const refShape = clip ? clip.firstChild : (mask ? mask.lastChild : null);

                attrsToSync.forEach(attr => {
                  const val = targetEl.getAttribute(attr);
                  if (val !== null) {
                    overlay.setAttribute(attr, val);
                    if (refShape) refShape.setAttribute(attr, val);
                  } else {
                    overlay.removeAttribute(attr);
                    if (refShape) refShape.removeAttribute(attr);
                  }
                });
                overlay.style.transform = targetEl.style.transform;
                overlay.style.translate = targetEl.style.translate;
                overlay.style.scale = targetEl.style.scale;
                overlay.style.rotate = targetEl.style.rotate;
                if (refShape) {
                  refShape.style.transform = targetEl.style.transform;
                  refShape.style.translate = targetEl.style.translate;
                  refShape.style.scale = targetEl.style.scale;
                  refShape.style.rotate = targetEl.style.rotate;
                }
              }
            };

            const { el, bbox, worldAnchor, matrix, dir } = state;

            const parentCTM = el.parentNode ? el.parentNode.getScreenCTM() : state.svg.getScreenCTM();
            if (!parentCTM) return;
            const pt = state.svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            let currentPoint = pt.matrixTransform(parentCTM.inverse());

            // Smart snapping for resize handles against canvas bounds and candidates
            const snapResult = computeResizeSmartGuides({
              resizeState: state,
              currentPoint,
              parentCTM,
              dir,
              zoomScale: zoom / 100,
              disabled: event.ctrlKey || event.metaKey
            });
            currentPoint = snapResult.snappedPoint;

            if (dir === 'linestart' || dir === 'lineend') {
              const invMatrix = matrix.inverse();

              // Safely convert to DOMPoint before matrixTransform to avoid SVGPoint crash!
              const safePoint = new DOMPoint(currentPoint.x, currentPoint.y);
              const localPt = safePoint.matrixTransform(invMatrix);

              let finalLocalPt = localPt;

              if (event.shiftKey) {
                const anchorX = parseFloat(el.getAttribute(dir === 'linestart' ? 'x2' : 'x1')) || 0;
                const anchorY = parseFloat(el.getAttribute(dir === 'linestart' ? 'y2' : 'y1')) || 0;

                const dx = localPt.x - anchorX;
                const dy = localPt.y - anchorY;

                const angle = Math.atan2(dy, dx);
                const snapAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                finalLocalPt = {
                  x: anchorX + dist * Math.cos(snapAngle),
                  y: anchorY + dist * Math.sin(snapAngle)
                };
              }

              if (dir === 'linestart') {
                el.style.removeProperty('x1');
                el.style.removeProperty('y1');
                el.setAttribute('x1', finalLocalPt.x);
                el.setAttribute('y1', finalLocalPt.y);
                if (el.x1) el.x1.baseVal.value = finalLocalPt.x;
                if (el.y1) el.y1.baseVal.value = finalLocalPt.y;
              } else {
                el.style.removeProperty('x2');
                el.style.removeProperty('y2');
                el.setAttribute('x2', finalLocalPt.x);
                el.setAttribute('y2', finalLocalPt.y);
                if (el.x2) el.x2.baseVal.value = finalLocalPt.x;
                if (el.y2) el.y2.baseVal.value = finalLocalPt.y;
              }

              if (typeof drawOverlayHighlight === 'function') {
                drawOverlayHighlight(el, 'selected');
              }
              const targetSvg = state.svg || el.ownerSVGElement;
              const currentBox = targetSvg ? getBoxInSvg(el, targetSvg) : null;
              if (currentBox && targetSvg) {
                const guideData = collectResizeGuideLines({
                  resizeState: state,
                  currentBox,
                  dir
                });
                const pageContainer = (el.closest ? el.closest('.page-svg-container') : null) || targetSvg.closest?.('.page-svg-container');
                const pageIdx = pageContainer ? parseInt(pageContainer.getAttribute('data-page-index')) : activePageIndex;
                renderSmartGuides(pageIdx, guideData.guides, guideData.badge, zoom / 100, targetSvg);
              }
              return;
            }

            // Vector from anchor to current cursor position
            const vCurrent = { x: currentPoint.x - worldAnchor.x, y: currentPoint.y - worldAnchor.y };

            // Vector from anchor to original handle position in world space
            let localHandle;
            if (dir === 'se') localHandle = { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
            else if (dir === 'sw') localHandle = { x: bbox.x, y: bbox.y + bbox.height };
            else if (dir === 'ne') localHandle = { x: bbox.x + bbox.width, y: bbox.y };
            else if (dir === 'nw') localHandle = { x: bbox.x, y: bbox.y };
            else if (dir === 'n') localHandle = { x: bbox.x + bbox.width / 2, y: bbox.y };
            else if (dir === 's') localHandle = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
            else if (dir === 'e') localHandle = { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 };
            else if (dir === 'w') localHandle = { x: bbox.x, y: bbox.y + bbox.height / 2 };

            const worldHandle = new DOMPoint(localHandle.x, localHandle.y).matrixTransform(matrix);
            const vOriginal = { x: worldHandle.x - worldAnchor.x, y: worldHandle.y - worldAnchor.y };

            // Transform vectors to local space of the element (ignoring its translation component)
            const invMatrix = matrix.inverse();
            invMatrix.e = 0; invMatrix.f = 0;

            const vCurrentLocal = new DOMPoint(vCurrent.x, vCurrent.y).matrixTransform(invMatrix);
            const vOriginalLocal = new DOMPoint(vOriginal.x, vOriginal.y).matrixTransform(invMatrix);

            let scaleX = Math.abs(vOriginalLocal.x) < 0.1 ? 1 : vCurrentLocal.x / vOriginalLocal.x;
            let scaleY = Math.abs(vOriginalLocal.y) < 0.1 ? 1 : vCurrentLocal.y / vOriginalLocal.y;

            // Constrain scaling for side handles
            if (dir === 'n' || dir === 's') scaleX = 1;
            if (dir === 'e' || dir === 'w') scaleY = 1;

            // Maintain Aspect Ratio for images, text, or if Shift key is held (only for corners, but force for text on all handles to prevent distortion)
            const isUserGroupResize = (el.getAttribute('data-type') === 'group' || (el.getAttribute('data-name') || '').toLowerCase() === 'group' || (el.id || '').startsWith('group-')) && el.getAttribute('data-is-image-group') !== 'true' && el.getAttribute('data-is-gif-group') !== 'true' && el.getAttribute('data-is-video-group') !== 'true';
            const childImage = (!isUserGroupResize && el.tagName?.toLowerCase() === 'g') ? el.querySelector('image, img') : null;
            const src = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || (childImage ? (childImage.getAttribute('href') || childImage.getAttribute('xlink:href') || childImage.getAttribute('src')) : '') || '';
            const isGif = el.getAttribute('data-type') === 'gif' || el.getAttribute('data-is-gif-group') === 'true' || el.dataset?.mediaType === 'gif' || src.split('?')[0].toLowerCase().endsWith('.gif') || src.toLowerCase().startsWith('data:image/gif') || (el.getAttribute('data-name') || '').toLowerCase().includes('gif') || (el.id || '').toLowerCase().includes('gif');
            const isImage = !isUserGroupResize && (el.getAttribute('data-type') === 'image' || el.tagName?.toLowerCase() === 'image' || el.getAttribute('data-type') === 'video' || el.getAttribute('data-type') === 'gif' || el.getAttribute('data-is-image-group') === 'true' || el.getAttribute('data-is-gif-group') === 'true' || isGif || (el.getAttribute('data-name') || '').toLowerCase().includes('image') || !!childImage);
            const isElementInCropMode = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
            const isScaledImage = isImage && !isElementInCropMode;
            const isText = el.getAttribute('data-type') === 'text' || el.tagName?.toLowerCase() === 'text';
            const isForeignObject = el.tagName?.toLowerCase() === 'foreignobject';
            const isHotspotIconGroup = el.getAttribute('data-is-hotspot') === 'true' && (el.tagName?.toLowerCase() === 'g' || el.tagName?.toLowerCase() === 'svg');
            const isGroup = (el.tagName?.toLowerCase() === 'g' || el.tagName === 'multi') && el.getAttribute('data-is-hotspot') !== 'true';
            const isFreeFrame = (el.getAttribute('data-name') === 'Free Frame' && el.tagName?.toLowerCase() === 'rect') || isForeignObject;
            const isShape = (['path', 'polygon', 'circle', 'ellipse', 'rect', 'polyline', 'line'].includes(el.tagName?.toLowerCase()) || isGroup) && !isFreeFrame && !isForeignObject;
            const isCorner = ['nw', 'ne', 'se', 'sw'].includes(dir);

            const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
            const isInteractiveButton = isHotspot && state.childrenData && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'rect') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');
            const isHotspotPreset = isHotspot && !isInteractiveButton;

            if (isInteractiveButton) {
              if (isCorner) {
                // Diagonal projection for smooth, natural scaling up and down
                const dot = vCurrentLocal.x * vOriginalLocal.x + vCurrentLocal.y * vOriginalLocal.y;
                const origLenSq = vOriginalLocal.x * vOriginalLocal.x + vOriginalLocal.y * vOriginalLocal.y;
                let s = origLenSq > 0 ? (dot / origLenSq) : ((scaleX + scaleY) / 2);
                const minS = bbox.height > 0 ? (12 / bbox.height) : 0.1;
                if (s < minS) s = minS;
                scaleX = s;
                scaleY = s;
              } else if (dir === 'e' || dir === 'w') {
                const minScaleX = bbox.width > 0 ? (20 / bbox.width) : 0.1;
                if (scaleX < minScaleX) scaleX = minScaleX;
                scaleY = 1;
              } else if (dir === 'n' || dir === 's') {
                const minScaleY = bbox.height > 0 ? (12 / bbox.height) : 0.1;
                if (scaleY < minScaleY) scaleY = minScaleY;
                scaleX = scaleY;
              }
            }

            if (event.shiftKey) {
              let targetRatio = null;
              if (el.hasAttribute?.('data-original-aspect-ratio') && !isElementInCropMode) {
                targetRatio = parseFloat(el.getAttribute('data-original-aspect-ratio'));
              } else {
                const shapeName = el.getAttribute?.('data-name') || '';
                if ((shapeName.toLowerCase().includes('circle') || shapeName.toLowerCase().includes('square')) && !isImage) {
                  targetRatio = 1;
                } else if (bbox.height > 0) {
                  targetRatio = bbox.width / bbox.height;
                } else {
                  targetRatio = 1;
                }
              }

              if (targetRatio && targetRatio > 0 && bbox.width > 0 && bbox.height > 0) {
                const startA = matrix.a || 1;
                const startD = matrix.d || 1;

                if (isCorner) {
                  const fw_x = bbox.width * Math.abs(startA * scaleX);
                  const fh_x = fw_x / targetRatio;

                  const fh_y = bbox.height * Math.abs(startD * scaleY);
                  const fw_y = fh_y * targetRatio;

                  if (fw_x > fw_y) {
                    scaleY = (fh_x / (bbox.height * Math.abs(startD))) * (Math.sign(scaleY) || 1);
                  } else {
                    scaleX = (fw_y / (bbox.width * Math.abs(startA))) * (Math.sign(scaleX) || 1);
                  }
                } else {
                  if (dir === 'n' || dir === 's') {
                    const fh = bbox.height * Math.abs(startD * scaleY);
                    const fw = fh * targetRatio;
                    scaleX = (fw / (bbox.width * Math.abs(startA))) * (Math.sign(scaleX) || 1);
                  } else {
                    const fw = bbox.width * Math.abs(startA * scaleX);
                    const fh = fw / targetRatio;
                    scaleY = (fh / (bbox.height * Math.abs(startD))) * (Math.sign(scaleY) || 1);
                  }
                }
              }
            } else if (!isInteractiveButton && ((isCorner && (isScaledImage || isShape || isHotspotPreset || (isText && !isForeignObject))) || (!isCorner && ((isText && !isForeignObject) || isHotspotPreset)))) {
              const s = Math.max(Math.abs(scaleX), Math.abs(scaleY)) * (Math.sign(scaleX) || 1);
              if (!isCorner && ((isText && !isForeignObject) || isHotspotPreset)) {
                const sSide = (dir === 'n' || dir === 's') ? scaleY : scaleX;
                scaleX = sSide;
                scaleY = sSide;
              } else {
                scaleX = s;
                scaleY = s * (Math.sign(scaleY) / Math.sign(scaleX) || 1);
              }
            }


            if (isFreeFrame || isGroup || isHotspotIconGroup || isShape) {
              const newLocalX = state.localAnchor.x + (bbox.x - state.localAnchor.x) * scaleX;
              const newLocalY = state.localAnchor.y + (bbox.y - state.localAnchor.y) * scaleY;
              const newLocalRight = state.localAnchor.x + ((bbox.x + bbox.width) - state.localAnchor.x) * scaleX;
              const newLocalBottom = state.localAnchor.y + ((bbox.y + bbox.height) - state.localAnchor.y) * scaleY;

              const finalX = Math.min(newLocalX, newLocalRight);
              const finalY = Math.min(newLocalY, newLocalBottom);
              const finalWidth = Math.max(0, Math.abs(newLocalRight - newLocalX));
              const finalHeight = Math.max(0, Math.abs(newLocalBottom - newLocalY));

              if (isFreeFrame && !isHotspotIconGroup) {
                let adjustedHeight = finalHeight;
                let adjustedWidth = finalWidth;
                let adjustedX = finalX;
                let adjustedY = finalY;

                const isVideoFo = el.getAttribute('data-type') === 'video' || !!el.querySelector('video, iframe');

                if (el.tagName?.toLowerCase() === 'foreignobject' && !isVideoFo && el.firstElementChild) {
                  const isScrollable = el.getAttribute('data-scrollable') === 'true';
                  const div = el.firstElementChild;

                  // Enable reflow when resizing any handle manually
                  if (dir) {
                    el.setAttribute('data-resized', 'true');
                    div.style.whiteSpace = 'pre-wrap';
                  }

                  // Update the sizing mode to reflect manual user overrides so TextEditor respects them
                  if (el.getAttribute('data-type') === 'text') {
                    const currentMode = el.getAttribute('data-sizing-mode');
                    if (currentMode === 'fixed') {
                      if (!isScrollable) {
                        div.style.setProperty('overflow', 'visible', 'important');
                      }
                      div.style.setProperty('width', '100%', 'important');
                      div.style.setProperty('height', '100%', 'important');
                    } else {
                      if (dir === 'e' || dir === 'w' || dir === 'n' || dir === 's') {
                        el.setAttribute('data-sizing-mode', 'auto-height');
                        el.setAttribute('data-auto-wrap', 'true');
                        // Scrolling is only allowed in 'fixed' mode, so disable it when switching to auto-height
                        if (isScrollable) {
                          el.setAttribute('data-scrollable', 'false');
                          div.classList.remove('flipbook-text-scrollbar');
                          div.style.setProperty('overflow', 'visible', 'important');
                        }
                      } else if (['nw', 'ne', 'sw', 'se'].includes(dir)) {
                        el.setAttribute('data-sizing-mode', 'fixed');
                        el.setAttribute('data-auto-wrap', 'true');
                        if (!isScrollable) {
                          div.style.setProperty('overflow', 'visible', 'important');
                        }
                        div.style.setProperty('width', '100%', 'important');
                        div.style.setProperty('height', '100%', 'important');
                      }
                    }
                  }

                  const oldHeight = div.style.height;
                  const oldMinHeight = div.style.minHeight;

                  // Temporarily allow height to shrink to measure true text height
                  div.style.setProperty('height', 'auto', 'important');
                  div.style.setProperty('min-height', '0px', 'important');

                  if (!isScrollable) {
                    if (dir === 'e' || dir === 'w') {
                      // Resize width -> Auto height (Can shrink)
                      adjustedHeight = Math.max(10, div.scrollHeight + 4);
                    } else if ((dir === 'n' || dir === 's') && el.getAttribute('data-sizing-mode') !== 'fixed') {
                      // Resize height -> adjust width to match new height, keeping text inside
                      let minW = 10;
                      let maxW = 3000;
                      let bestW = finalWidth;

                      for (let i = 0; i < 12; i++) {
                        let midW = (minW + maxW) / 2;
                        el.setAttribute('width', midW);
                        if (div.scrollHeight + 4 <= finalHeight) {
                          bestW = midW;
                          maxW = midW - 1; // Try to find a tighter fit
                        } else {
                          minW = midW + 1; // Need more width
                        }
                      }
                      adjustedWidth = bestW;
                      el.setAttribute('width', adjustedWidth);
                      adjustedHeight = div.scrollHeight + 4;
                    } else {
                      // Corners or fixed mode -> Fixed size, respect final height exactly so clipping/scrolling works
                      adjustedHeight = finalHeight;
                    }
                  } else {
                    // Scrollable text boxes CAN hide content. We respect the user's manual sizing exactly.
                    // No auto-height adjustments here.
                  }

                  div.style.setProperty('height', oldHeight || '100%', 'important');
                  div.style.setProperty('min-height', oldMinHeight || '100%', 'important');

                  // Adjust coordinates to respect the handle anchor
                  if (dir === 'w' || dir === 'nw' || dir === 'sw') {
                    adjustedX = (finalX + finalWidth) - adjustedWidth;
                  } else if (dir === 'n' || dir === 's') {
                    const widthDiff = adjustedWidth - finalWidth;
                    const align = window.getComputedStyle(div).textAlign;
                    if (align === 'center') adjustedX = finalX - (widthDiff / 2);
                    else if (align === 'right' || align === 'end') adjustedX = finalX - widthDiff;
                  }

                  if (dir === 'n' || dir === 'nw' || dir === 'ne') {
                    adjustedY = (finalY + finalHeight) - adjustedHeight;
                  }
                }

                el.setAttribute('x', adjustedX);
                el.setAttribute('y', adjustedY);
                el.setAttribute('width', adjustedWidth);
                el.setAttribute('height', adjustedHeight);

                // For rotated foreignObjects (e.g., rotated text boxes), after changing x/y,
                // recompute the transform's translation so the anchor stays pinned in parent space.
                {
                  const hasRot = Math.abs(matrix.b) > 0.001 || Math.abs(matrix.c) > 0.001;
                  if (hasRot) {
                    const anchorPt = state.localAnchor;
                    const newM = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d,
                      worldAnchor.x - (matrix.a * anchorPt.x + matrix.c * anchorPt.y),
                      worldAnchor.y - (matrix.b * anchorPt.x + matrix.d * anchorPt.y)
                    ]);
                    el.setAttribute('transform', matrixToTransform(newM));
                  }
                }

                if (el.tagName.toLowerCase() === 'foreignobject') {
                  const iframe = el.querySelector('iframe');
                  if (iframe) {
                    const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
                    const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
                    iframe.setAttribute('data-original-width', origW.toString());
                    iframe.setAttribute('data-original-height', origH.toString());
                    iframe.setAttribute('width', origW.toString());
                    iframe.setAttribute('height', origH.toString());
                    iframe.style.setProperty('width', origW + 'px', 'important');
                    iframe.style.setProperty('height', origH + 'px', 'important');
                    iframe.style.setProperty('transform-origin', '0 0', 'important');
                    iframe.style.setProperty('pointer-events', 'auto', 'important');

                    if (origW > 0 && origH > 0 && adjustedWidth > 0 && adjustedHeight > 0) {
                      const scaleX = adjustedWidth / origW;
                      const scaleY = adjustedHeight / origH;
                      iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
                    }
                  }
                  const video = el.querySelector('video');
                  if (video) {
                    video.style.setProperty('width', '100%', 'important');
                    video.style.setProperty('height', '100%', 'important');
                  }
                }
              } else if (isShape && !isGroup && !isHotspotIconGroup) {
                const isRectPath = el.tagName?.toLowerCase() === 'path' && el.getAttribute('data-shape-type') === 'rectangle';

                // Helper: after setting geometric attributes on a rotated element, update the
                // transform's translation so the anchor point remains fixed in parent space.
                // For a rotated element, worldAnchor = M * localAnchor, where M is the transform.
                // After attribute changes, localAnchor in element space is unchanged, so we
                // recompute M.e / M.f such that M * localAnchor == worldAnchor.
                const fixRotatedTransform = (localAnchorPt) => {
                  const hasRotation = Math.abs(matrix.b) > 0.001 || Math.abs(matrix.c) > 0.001;
                  if (!hasRotation) return; // No rotation — attribute changes alone are correct
                  const newM = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d,
                    worldAnchor.x - (matrix.a * localAnchorPt.x + matrix.c * localAnchorPt.y),
                    worldAnchor.y - (matrix.b * localAnchorPt.x + matrix.d * localAnchorPt.y)
                  ]);
                  el.setAttribute('transform', matrixToTransform(newM));
                };

                if (el.tagName?.toLowerCase() === 'rect' || isRectPath || el.tagName?.toLowerCase() === 'image') {
                  el.setAttribute('x', finalX);
                  el.setAttribute('y', finalY);
                  el.setAttribute('width', finalWidth);
                  el.setAttribute('height', finalHeight);
                  if (isRectPath) {
                    const defR = parseFloat(el.getAttribute('rx') || 0);
                    const maxR = Math.max(0, Math.min(finalWidth / 2, finalHeight / 2));
                    const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                    const tl = Math.min(parseR(el.getAttribute('data-tl'), defR), maxR);
                    const tr = Math.min(parseR(el.getAttribute('data-tr'), defR), maxR);
                    const bl = Math.min(parseR(el.getAttribute('data-bl'), defR), maxR);
                    const br = Math.min(parseR(el.getAttribute('data-br'), defR), maxR);
                    const d = `M ${finalX + tl},${finalY} L ${finalX + finalWidth - tr},${finalY} A ${tr},${tr} 0 0 1 ${finalX + finalWidth},${finalY + tr} L ${finalX + finalWidth},${finalY + finalHeight - br} A ${br},${br} 0 0 1 ${finalX + finalWidth - br},${finalY + finalHeight} L ${finalX + bl},${finalY + finalHeight} A ${bl},${bl} 0 0 1 ${finalX},${finalY + finalHeight - bl} L ${finalX},${finalY + tl} A ${tl},${tl} 0 0 1 ${finalX + tl},${finalY} Z`.replace(/\s+/g, ' ').trim();
                    el.setAttribute('d', d);
                  }
                  // After changing x/y/width/height, fix the transform so the anchor stays
                  // pinned to worldAnchor in parent space (critical for rotated elements).
                  fixRotatedTransform(state.localAnchor);
                } else if (el.tagName?.toLowerCase() === 'ellipse' || el.tagName?.toLowerCase() === 'circle') {
                  el.setAttribute('cx', finalX + finalWidth / 2);
                  el.setAttribute('cy', finalY + finalHeight / 2);
                  if (el.tagName?.toLowerCase() === 'circle') {
                    el.setAttribute('r', Math.min(finalWidth, finalHeight) / 2);
                  } else {
                    el.setAttribute('rx', finalWidth / 2);
                    el.setAttribute('ry', finalHeight / 2);
                  }
                  // After changing cx/cy/r, fix the transform so localAnchor (bbox corner)
                  // stays pinned to worldAnchor in parent space (critical for rotated ellipses).
                  fixRotatedTransform(state.localAnchor);
                } else {
                  const scaleMatrix = new DOMMatrix()
                    .translate(worldAnchor.x, worldAnchor.y)
                    .scale(scaleX, scaleY)
                    .translate(-worldAnchor.x, -worldAnchor.y);
                  const nextMatrix = scaleMatrix.multiply(matrix);
                  el.setAttribute('transform', matrixToTransform(nextMatrix));
                }
              } else if ((isGroup || isHotspotIconGroup) && state.childrenData) {
                const isMultiSel = el.tagName === 'multi';

                if (isMultiSel) {
                  const commonRot = el._commonRotation || 0;
                  const scaleMatrix = new DOMMatrix()
                    .translate(worldAnchor.x, worldAnchor.y)
                    .rotate(commonRot)
                    .scale(scaleX, scaleY)
                    .rotate(-commonRot)
                    .translate(-worldAnchor.x, -worldAnchor.y);

                  const canvasSVGEl = state.svg || state.childrenData?.[0]?.child?.ownerSVGElement || canvasSvg;
                  const svgCTM = canvasSVGEl?.getScreenCTM?.();

                  state.childrenData.forEach(cData => {
                    const { child, initialMatrix, childWorldMatrix } = cData;

                    const isStrokeOverlay = child.classList && (
                      child.classList.contains('svg-shape-stroke-overlay') ||
                      child.classList.contains('svg-image-stroke-overlay') ||
                      child.classList.contains('svg-gif-stroke-overlay') ||
                      child.classList.contains('svg-video-stroke-overlay') ||
                      child.classList.contains('svg-drop-shadow-caster')
                    );
                    if (isStrokeOverlay) return;

                    const cwm = childWorldMatrix || initialMatrix;
                    const nextWorldMatrix = scaleMatrix.multiply(toDOMMatrix(cwm));
                    const parentEl = child.parentNode;
                    const parentCTM = parentEl?.getScreenCTM?.();
                    let nextLocalMatrix;
                    if (parentCTM && svgCTM) {
                      const domParentInv = toDOMMatrix(parentCTM).inverse();
                      const domSvgCTM = toDOMMatrix(svgCTM);
                      nextLocalMatrix = domParentInv.multiply(domSvgCTM).multiply(nextWorldMatrix);
                    } else {
                      nextLocalMatrix = nextWorldMatrix;
                    }

                    child.setAttribute('transform', matrixToTransform(nextLocalMatrix));
                    syncOverlay(child);
                    if (typeof drawOverlayHighlight === 'function') {
                      drawOverlayHighlight(child, 'multi-child-selected');
                    }
                  });

                  if (typeof drawMultiSelectionHighlight === 'function') {
                    drawMultiSelectionHighlight(multiSelectedIdsRef.current);
                  }
                  return;
                } else {
                  // ── REAL <g> GROUP PATH ───────────────────────────────────────────
                  // bound is in <g>'s LOCAL coordinate space (same as child attribute space).
                  // localAnchor is also in <g>'s local space.
                  // No CTM conversion needed — just compute new position in <g> local space.

                  const la = state.localAnchor; // anchor in <g> local space
                  const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
                  const isInteractiveButton = isHotspot && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'rect') && state.childrenData.some(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');

                  // ── HOTSPOT ICON GROUP: update outer transform, NOT children ───────
                  // Hotspot preset icon groups have transform="translate(tx,ty) scale(s)"
                  // with 48×48 inner content. Resizing must update this outer transform so
                  // the group's position and size in the page change correctly.
                  // Modifying children would only scale inside the 48×48 local space while
                  // the group's outer translate+scale stays the same → no visible resize effect.
                  if (isHotspot && !isInteractiveButton) {
                    try {
                      // finalX/Y/W/H are in the group's LOCAL coordinate space (0–48 range).
                      // Convert them to parent-local space using matrix (local→parent mapping).
                      const ptOrigin = new DOMPoint(finalX, finalY).matrixTransform(matrix);
                      const ptCorner = new DOMPoint(finalX + finalWidth, finalY + finalHeight).matrixTransform(matrix);
                      const newTx = Math.min(ptOrigin.x, ptCorner.x);
                      const newTy = Math.min(ptOrigin.y, ptCorner.y);
                      const newW  = Math.abs(ptCorner.x - ptOrigin.x);
                      const newH  = Math.abs(ptCorner.y - ptOrigin.y);
                      // Derive scale from inner content size (48×48 canonical size)
                      const innerSize = (state.bbox && state.bbox.width > 0) ? state.bbox.width : 48;
                      const newSx = newW / innerSize;
                      const newSy = newH / innerSize;
                      el.setAttribute('transform', `translate(${newTx}, ${newTy}) scale(${newSx}, ${newSy})`);
                    } catch { /* fallback: do nothing if matrix ops fail */ }
                    // Update overlay handles to follow the new position during drag
                    if (typeof drawOverlayHighlight === 'function') {
                      const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
                      drawOverlayHighlight(el, highlightType);
                    }
                    return; // skip children modification
                  }

                  state.childrenData.forEach(cData => {
                    const { child, initialMatrix, bound } = cData;

                    const isStrokeOverlay = child.classList && (
                      child.classList.contains('svg-shape-stroke-overlay') ||
                      child.classList.contains('svg-image-stroke-overlay') ||
                      child.classList.contains('svg-gif-stroke-overlay') ||
                      child.classList.contains('svg-video-stroke-overlay') ||
                      child.classList.contains('svg-drop-shadow-caster')
                    );

                    if (isStrokeOverlay) {
                      return; // Skip completely. Let syncOverlay handle it dynamically.
                    }

                    const tag = child.tagName?.toLowerCase();
                    const isChildText = tag === 'text' || child.getAttribute('data-type') === 'text';

                    if (isHotspot && isInteractiveButton && (isChildText || tag === 'image' || tag === 'g' || tag === 'path')) {
                      return; // Text and icons are positioned/scaled in the dedicated interactive button block below
                    }

                    let myScaleX = scaleX;
                    let myScaleY = scaleY;
                    let myAnchorX = la.x;
                    let myAnchorY = la.y;

                    // Scale bound in <g> local space from localAnchor
                    const newMinX = myAnchorX + (bound.x - myAnchorX) * myScaleX;
                    const newMinY = myAnchorY + (bound.y - myAnchorY) * myScaleY;
                    const newMaxX = myAnchorX + (bound.x + bound.width - myAnchorX) * myScaleX;
                    const newMaxY = myAnchorY + (bound.y + bound.height - myAnchorY) * myScaleY;
                    const newLocX = Math.min(newMinX, newMaxX);
                    const newLocY = Math.min(newMinY, newMaxY);
                    const newLocW = Math.abs(newMaxX - newMinX);
                    const newLocH = Math.abs(newMaxY - newMinY);

                    if (isChildText) {
                      // Text: translate only
                      const dx = newLocX - bound.x;
                      const dy = newLocY - bound.y;
                      child.setAttribute('transform', matrixToTransform(new DOMMatrix().translate(dx, dy).multiply(initialMatrix)));
                    } else if (tag === 'rect' || (tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle') || tag === 'foreignobject' || tag === 'image' || tag === 'video' || tag === 'svg' || child.classList?.contains('gif-inner-content')) {
                      const isRectPath = tag === 'path' && child.getAttribute('data-shape-type') === 'rectangle';
                      const hasTransform = child.getAttribute('transform');
                      const forceNative = (tag === 'rect' || isRectPath || tag === 'image' || tag === 'video' || tag === 'svg' || child.classList?.contains('gif-inner-content'));

                      if (forceNative || !hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)') {
                        if (forceNative && hasTransform && hasTransform !== 'matrix(1 0 0 1 0 0)') {
                          child.removeAttribute('transform');
                        }
                        // Attributes are already in <g> local space — set directly
                        let imgX = newLocX;
                        let imgY = newLocY;
                        let imgW = newLocW;
                        let imgH = newLocH;

                        const isCropModeThisEl = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
                        const isSideHandleDrag = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;

                        let cOffX = 0, cOffY = 0, cScale = 1;
                        if (isCropModeThisEl && (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content'))) {
                          let origX = parseFloat(el.getAttribute('data-crop-orig-x') || child.getAttribute('data-crop-orig-x') || child.getAttribute('x') || '0');
                          let origY = parseFloat(el.getAttribute('data-crop-orig-y') || child.getAttribute('data-crop-orig-y') || child.getAttribute('y') || '0');
                          let origW = parseFloat(el.getAttribute('data-crop-orig-w') || child.getAttribute('data-crop-orig-w') || child.getAttribute('width') || '100');
                          let origH = parseFloat(el.getAttribute('data-crop-orig-h') || child.getAttribute('data-crop-orig-h') || child.getAttribute('height') || '100');

                          if (!el.hasAttribute('data-crop-orig-w') || parseFloat(el.getAttribute('data-crop-orig-w')) <= 0) {
                            el.setAttribute('data-crop-orig-x', origX);
                            el.setAttribute('data-crop-orig-y', origY);
                            el.setAttribute('data-crop-orig-w', origW);
                            el.setAttribute('data-crop-orig-h', origH);
                          }

                          const cropDataStr = el.getAttribute('data-crop-data') || el.getAttribute('data-saved-crop-data');
                          let cLeft = 0, cTop = 0, cWidth = 100, cHeight = 100;
                          if (cropDataStr && cropDataStr !== 'null') {
                            try {
                              const cd = JSON.parse(cropDataStr);
                              cLeft = parseFloat(cd.left) || 0;
                              cTop = parseFloat(cd.top) || 0;
                              cWidth = parseFloat(cd.width) || 100;
                              cHeight = parseFloat(cd.height) || 100;
                              cOffX = parseFloat(cd.offX) || 0;
                              cOffY = parseFloat(cd.offY) || 0;
                              cScale = parseFloat(cd.scale) || 1;
                            } catch { /* ignored */ }
                          }

                          if (isSideHandleDrag) {
                            imgX = origX;
                            imgY = origY;
                            imgW = origW;
                            imgH = origH;
                            if (imgW > 0 && imgH > 0) {
                              cLeft = ((newLocX - imgX) / imgW) * 100;
                              cTop = ((newLocY - imgY) / imgH) * 100;
                              cWidth = (newLocW / imgW) * 100;
                              cHeight = (newLocH / imgH) * 100;
                              let cd = {};
                              try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch { /* ignored */ }
                              cd.left = cLeft;
                              cd.top = cTop;
                              cd.width = cWidth;
                              cd.height = cHeight;
                              el.setAttribute('data-crop-data', JSON.stringify(cd));
                            }
                          } else {
                            const newOrigW = cWidth > 0 ? (newLocW / (cWidth / 100)) : newLocW;
                            const newOrigH = cHeight > 0 ? (newLocH / (cHeight / 100)) : newLocH;
                            const newOrigX = newLocX - (newOrigW * (cLeft / 100));
                            const newOrigY = newLocY - (newOrigH * (cTop / 100));

                            el.setAttribute('data-crop-orig-x', newOrigX);
                            el.setAttribute('data-crop-orig-y', newOrigY);
                            el.setAttribute('data-crop-orig-w', newOrigW);
                            el.setAttribute('data-crop-orig-h', newOrigH);

                            imgX = newOrigX;
                            imgY = newOrigY;
                            imgW = newOrigW;
                            imgH = newOrigH;
                          }
                        }

                        child.setAttribute('x', imgX);
                        child.setAttribute('y', imgY);
                        child.setAttribute('width', imgW);
                        child.setAttribute('height', imgH);

                        if (isRectPath) {
                          const defR = parseFloat(child.getAttribute('rx') || 0);
                          const maxR = Math.max(0, Math.min(imgW / 2, imgH / 2));
                          const parseR = (v, d) => (v !== null && v !== '') ? (isNaN(parseFloat(v)) ? 0 : parseFloat(v)) : d;
                          const tl = Math.min(parseR(child.getAttribute('data-tl'), defR), maxR);
                          const tr = Math.min(parseR(child.getAttribute('data-tr'), defR), maxR);
                          const bl = Math.min(parseR(child.getAttribute('data-bl'), defR), maxR);
                          const br = Math.min(parseR(child.getAttribute('data-br'), defR), maxR);
                          const d = `M ${imgX + tl},${imgY} L ${imgX + imgW - tr},${imgY} A ${tr},${tr} 0 0 1 ${imgX + imgW},${imgY + tr} L ${imgX + imgW},${imgY + imgH - br} A ${br},${br} 0 0 1 ${imgX + imgW - br},${imgY + imgH} L ${imgX + bl},${imgY + imgH} A ${bl},${bl} 0 0 1 ${imgX},${imgY + imgH - bl} L ${imgX},${imgY + tl} A ${tl},${tl} 0 0 1 ${imgX + tl},${imgY} Z`.replace(/\s+/g, ' ').trim();
                          child.setAttribute('d', d);
                        }

                        if (child.classList?.contains('gif-inner-content')) {
                          const innerImg = child.querySelector('image, foreignObject');
                          if (innerImg) {
                            innerImg.setAttribute('x', imgX);
                            innerImg.setAttribute('y', imgY);
                            innerImg.setAttribute('width', imgW);
                            innerImg.setAttribute('height', imgH);
                          }
                        }

                        if (tag === 'foreignobject') {
                          const iframe = child.querySelector('iframe');
                          if (iframe) {
                            const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
                            const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
                            iframe.setAttribute('data-original-width', origW.toString());
                            iframe.setAttribute('data-original-height', origH.toString());
                            iframe.setAttribute('width', origW.toString());
                            iframe.setAttribute('height', origH.toString());
                            iframe.style.setProperty('width', origW + 'px', 'important');
                            iframe.style.setProperty('height', origH + 'px', 'important');
                            iframe.style.setProperty('transform-origin', '0 0', 'important');
                            iframe.style.setProperty('pointer-events', 'auto', 'important');

                            if (origW > 0 && origH > 0 && imgW > 0 && imgH > 0) {
                              const scaleX = imgW / origW;
                              const scaleY = imgH / origH;
                              iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
                            }
                          }
                          const video = child.querySelector('video');
                          if (video) {
                            video.style.setProperty('width', '100%', 'important');
                            video.style.setProperty('height', '100%', 'important');
                          }
                        }

                        if (isCropModeThisEl && (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content'))) {
                          const centerX = imgX + (imgW / 2);
                          const centerY = imgY + (imgH / 2);
                          const panX = (imgW * cOffX) / 100;
                          const panY = (imgH * cOffY) / 100;
                          child.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${cScale}) translate(${-centerX} ${-centerY})`);
                        }

                        if (tag === 'image' || tag === 'video' || child.classList?.contains('gif-inner-content')) {
                          const svg = child.ownerSVGElement;
                          const clip = svg?.querySelector(`clipPath[id="clip-shape-${el.id}"]`);
                          const refShape = clip ? clip.firstChild : null;
                          if (refShape) {
                            refShape.setAttribute('x', newLocX);
                            refShape.setAttribute('y', newLocY);
                            refShape.setAttribute('width', newLocW);
                            refShape.setAttribute('height', newLocH);
                          }
                          const gifClip = svg?.querySelector(`clipPath[id="clip-content-${el.id}"]`);
                          const gifRef = gifClip ? gifClip.firstChild : null;
                          if (gifRef) {
                            gifRef.setAttribute('x', newLocX);
                            gifRef.setAttribute('y', newLocY);
                            gifRef.setAttribute('width', newLocW);
                            gifRef.setAttribute('height', newLocH);
                          }
                          const mask = svg?.querySelector(`mask[id="mask-shape-${el.id}"]`);
                          const maskShape = mask ? mask.lastChild : null;
                          if (maskShape) {
                            maskShape.setAttribute('x', newLocX);
                            maskShape.setAttribute('y', newLocY);
                            maskShape.setAttribute('width', newLocW);
                            maskShape.setAttribute('height', newLocH);
                          }
                        }
                      } else {
                        // Has transform: use local scale matrix
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(scaleX, scaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    } else if (tag === 'circle' || tag === 'ellipse') {
                      const hasTransform = child.getAttribute('transform');
                      const forceMatrix = isHotspot && !isInteractiveButton && (myScaleX !== myScaleY);
                      if (!forceMatrix && (!hasTransform || hasTransform === 'matrix(1 0 0 1 0 0)')) {
                        if (tag === 'circle') {
                          child.setAttribute('cx', newLocX + newLocW / 2);
                          child.setAttribute('cy', newLocY + newLocH / 2);
                          child.setAttribute('r', Math.min(newLocW, newLocH) / 2);
                        } else {
                          child.setAttribute('cx', newLocX + newLocW / 2);
                          child.setAttribute('cy', newLocY + newLocH / 2);
                          child.setAttribute('rx', newLocW / 2);
                          child.setAttribute('ry', newLocH / 2);
                        }
                      } else {
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    } else {
                      // g, path, polygon, etc — scale via matrix in <g> local space
                      const isImageInnerContent = child.classList && (child.classList.contains('image-inner-content') || child.classList.contains('gif-inner-content'));
                      if (isImageInnerContent) {
                        const innerImg = child.querySelector('image, video, img, foreignObject');
                        if (innerImg) {
                          // Clear any transform on the wrapper — use direct attributes on <image>
                          child.removeAttribute('transform');
                          let imgX = newLocX;
                          let imgY = newLocY;
                          let imgW = newLocW;
                          let imgH = newLocH;

                          const isCropModeThisEl = el.getAttribute?.('data-object-fit') === 'Crop' || el.hasAttribute?.('data-effect-crop-inset') || (el.getAttribute?.('data-crop-data') && el.getAttribute?.('data-crop-data') !== 'null');
                          const isSideHandleDrag = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;

                          let cOffX = 0, cOffY = 0, cScale = 1;
                          if (isCropModeThisEl) {
                            let origX = parseFloat(el.getAttribute('data-crop-orig-x') || innerImg.getAttribute('data-crop-orig-x') || innerImg.getAttribute('x') || '0');
                            let origY = parseFloat(el.getAttribute('data-crop-orig-y') || innerImg.getAttribute('data-crop-orig-y') || innerImg.getAttribute('y') || '0');
                            let origW = parseFloat(el.getAttribute('data-crop-orig-w') || innerImg.getAttribute('data-crop-orig-w') || innerImg.getAttribute('width') || '100');
                            let origH = parseFloat(el.getAttribute('data-crop-orig-h') || innerImg.getAttribute('data-crop-orig-h') || innerImg.getAttribute('height') || '100');

                            if (!el.hasAttribute('data-crop-orig-w') || parseFloat(el.getAttribute('data-crop-orig-w')) <= 0) {
                              el.setAttribute('data-crop-orig-x', origX);
                              el.setAttribute('data-crop-orig-y', origY);
                              el.setAttribute('data-crop-orig-w', origW);
                              el.setAttribute('data-crop-orig-h', origH);
                            }

                            const cropDataStr = el.getAttribute('data-crop-data');
                            let cLeft = 0, cTop = 0, cWidth = 100, cHeight = 100;
                            if (cropDataStr && cropDataStr !== 'null') {
                              try {
                                const cd = JSON.parse(cropDataStr);
                                cLeft = parseFloat(cd.left) || 0;
                                cTop = parseFloat(cd.top) || 0;
                                cWidth = parseFloat(cd.width) || 100;
                                cHeight = parseFloat(cd.height) || 100;
                                cOffX = parseFloat(cd.offX) || 0;
                                cOffY = parseFloat(cd.offY) || 0;
                                cScale = parseFloat(cd.scale) || 1;
                              } catch { /* ignored */ }
                            }

                            const scaledCropX = la.x + (bbox.x - la.x) * scaleX;
                            const scaledCropY = la.y + (bbox.y - la.y) * scaleY;
                            const scaledCropW = bbox.width * scaleX;
                            const scaledCropH = bbox.height * Math.abs(scaleY);

                            if (isSideHandleDrag) {
                              imgX = origX;
                              imgY = origY;
                              imgW = origW;
                              imgH = origH;
                              if (imgW > 0 && imgH > 0) {
                                cLeft = ((scaledCropX - imgX) / imgW) * 100;
                                cTop = ((scaledCropY - imgY) / imgH) * 100;
                                cWidth = (scaledCropW / imgW) * 100;
                                cHeight = (scaledCropH / imgH) * 100;
                                let cd = {};
                                try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch { /* ignored */ }
                                cd.left = cLeft;

                                cd.top = cTop;
                                cd.width = cWidth;
                                cd.height = cHeight;
                                el.setAttribute('data-crop-data', JSON.stringify(cd));
                              }
                            } else {
                              const newOrigW = cWidth > 0 ? (scaledCropW / (cWidth / 100)) : scaledCropW;
                              const newOrigH = cHeight > 0 ? (scaledCropH / (cHeight / 100)) : scaledCropH;
                              const newOrigX = scaledCropX - (newOrigW * (cLeft / 100));
                              const newOrigY = scaledCropY - (newOrigH * (cTop / 100));

                              el.setAttribute('data-crop-orig-x', newOrigX);
                              el.setAttribute('data-crop-orig-y', newOrigY);
                              el.setAttribute('data-crop-orig-w', newOrigW);
                              el.setAttribute('data-crop-orig-h', newOrigH);

                              imgX = newOrigX;
                              imgY = newOrigY;
                              imgW = newOrigW;
                              imgH = newOrigH;
                            }
                          }

                          innerImg.setAttribute('x', imgX);
                          innerImg.setAttribute('y', imgY);
                          innerImg.setAttribute('width', imgW);
                          innerImg.setAttribute('height', imgH);

                          const svg = child.ownerSVGElement;
                          const gifClip = svg?.querySelector(`clipPath[id="clip-content-${el.id}"]`);
                          const gifRef = gifClip ? gifClip.firstChild : null;
                          if (gifRef) {
                            gifRef.setAttribute('x', newLocX);
                            gifRef.setAttribute('y', newLocY);
                            gifRef.setAttribute('width', newLocW);
                            gifRef.setAttribute('height', newLocH);
                          }

                          if (isCropModeThisEl) {
                            const centerX = imgX + (imgW / 2);
                            const centerY = imgY + (imgH / 2);
                            const panX = (imgW * cOffX) / 100;
                            const panY = (imgH * cOffY) / 100;
                            innerImg.setAttribute('transform', `translate(${centerX + panX} ${centerY + panY}) scale(${cScale}) translate(${-centerX} ${-centerY})`);
                          }
                        } else {
                          const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                          child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                        }
                      } else {
                        const sm = new DOMMatrix().translate(la.x, la.y).scale(myScaleX, myScaleY).translate(-la.x, -la.y);
                        child.setAttribute('transform', matrixToTransform(sm.multiply(initialMatrix)));
                      }
                    }
                  });

                  if (isHotspot && isInteractiveButton) {
                    const rectData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'rect');
                    const textData = state.childrenData.find(c => c.child.tagName.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');

                    if (rectData && textData) {
                      const rectEl = rectData.child;
                      const textEl = textData.child;

                      const rectX = parseFloat(rectEl.getAttribute('x')) || 0;
                      const rectY = parseFloat(rectEl.getAttribute('y')) || 0;
                      const rectW = parseFloat(rectEl.getAttribute('width')) || 0;
                      const rectH = parseFloat(rectEl.getAttribute('height')) || 0;

                      const initRectW = rectData.initialRect?.width || rectData.bound?.width || 80;
                      const initRectH = rectData.initialRect?.height || rectData.bound?.height || 32;

                      // Scale factor based on button height change (proportional scaling)
                      const scaleRatio = initRectH > 0 ? (rectH / initRectH) : 1;

                      // Update rect border radius rx proportionally
                      const baseRx = rectData.initialRect?.rx ?? parseFloat(rectEl.getAttribute('data-base-rx') || rectEl.getAttribute('rx') || '4');
                      const newRx = Math.max(0, Math.min(rectW / 2, rectH / 2, Math.round(baseRx * scaleRatio * 10) / 10));
                      rectEl.setAttribute('rx', newRx);

                      // Update text font-size proportionally with button scale
                      const baseFontSize = textData.initialFontSize || parseFloat(textEl.getAttribute('data-base-font-size') || textEl.getAttribute('font-size') || '14');
                      let newFontSize = Math.max(6, Math.round(baseFontSize * scaleRatio * 10) / 10);

                      // Check if button has an icon
                      const iconImg = el.querySelector('image');
                      const iconG = el.querySelector('g:not(defs g)');
                      const iconPath = el.querySelector('path');
                      const hasIcon = !!(iconImg || iconG || iconPath);

                      const label = textEl.textContent || '';
                      // Prevent font size from overflowing button width if narrowed
                      if (label.length > 0 && rectW > 0) {
                        const availableWidth = Math.max(8, rectW - (hasIcon ? 18 * scaleRatio : 6));
                        const maxFontForWidth = availableWidth / (label.length * 0.6);
                        if (maxFontForWidth > 0 && newFontSize > maxFontForWidth) {
                          newFontSize = Math.max(5, Math.round(maxFontForWidth * 10) / 10);
                        }
                      }

                      textEl.setAttribute('font-size', newFontSize);
                      textEl.style.fontSize = `${newFontSize}px`;
                      textEl.removeAttribute('transform');
                      textEl.querySelectorAll('tspan').forEach(ts => {
                        ts.removeAttribute('x');
                        ts.removeAttribute('y');
                        ts.removeAttribute('font-size');
                        ts.style.removeProperty('font-size');
                      });

                      if (hasIcon) {
                        const iconSize = Math.max(6, Math.round(14 * scaleRatio));
                        const gap = Math.max(2, Math.round(5 * scaleRatio));

                        let textWidth = 0;
                        try {
                          textWidth = textEl.getBBox().width;
                        } catch { /* ignored */ }
                        if (!textWidth || textWidth <= 0) {
                          textWidth = label.length * (newFontSize * 0.55);
                        }

                        let isEndPlacement = false;
                        if (iconImg) {
                          const imgX = parseFloat(iconImg.getAttribute('x') || '0');
                          const tX = parseFloat(textEl.getAttribute('x') || '0');
                          if (imgX > tX) isEndPlacement = true;
                        } else if (iconG) {
                          const gT = iconG.getAttribute('transform') || '';
                          const m = gT.match(/translate\(([-\d.]+)/);
                          if (m && parseFloat(m[1]) > (initRectW / 2)) isEndPlacement = true;
                        }

                        const contentWidth = iconSize + gap + textWidth;
                        const startX = rectX + (rectW - contentWidth) / 2;

                        let iconX, textX;
                        if (isEndPlacement) {
                          textX = startX + textWidth / 2;
                          iconX = startX + textWidth + gap;
                        } else {
                          iconX = startX;
                          textX = startX + iconSize + gap + textWidth / 2;
                        }

                        if (iconImg) {
                          iconImg.setAttribute('x', iconX);
                          iconImg.setAttribute('y', rectY + (rectH - iconSize) / 2);
                          iconImg.setAttribute('width', iconSize);
                          iconImg.setAttribute('height', iconSize);
                          iconImg.removeAttribute('transform');
                        } else if (iconG) {
                          iconG.setAttribute('transform', `translate(${iconX - 20 * scaleRatio}, ${rectY + (rectH - 32 * scaleRatio) / 2}) scale(${scaleRatio})`);
                        }

                        textEl.setAttribute('x', textX);
                        textEl.setAttribute('y', rectY + rectH / 2);
                        textEl.setAttribute('dominant-baseline', 'central');
                        textEl.setAttribute('text-anchor', 'middle');
                      } else {
                        // No icon: center text directly in rect
                        textEl.setAttribute('x', rectX + rectW / 2);
                        textEl.setAttribute('y', rectY + rectH / 2);
                        textEl.setAttribute('dominant-baseline', 'central');
                        textEl.setAttribute('text-anchor', 'middle');
                      }
                    }
                  }
                }
              }
            } else {
              const scaleMatrix = new DOMMatrix()
                .translate(worldAnchor.x, worldAnchor.y)
                .scale(scaleX, scaleY)
                .translate(-worldAnchor.x, -worldAnchor.y);

              const nextMatrix = scaleMatrix.multiply(matrix);
              el.setAttribute('transform', matrixToTransform(nextMatrix));
            }

            // ── LIVE CROP CLIP SYNC DURING RESIZE DRAG ─────────────────────────────
            // For cropped image groups, update the SVG clipPath rects in real-time
            // so the crop boundary stays in sync with the element while dragging.
            const isCropModeSync = el && el.tagName !== 'multi' && typeof el.getAttribute === 'function' && (
              el.getAttribute('data-object-fit') === 'Crop' ||
              (typeof el.hasAttribute === 'function' && el.hasAttribute('data-effect-crop-inset')) ||
              (el.getAttribute('data-crop-data') && el.getAttribute('data-crop-data') !== 'null')
            );
            if (isCropModeSync && state.childrenData) {
              try {
                const imgElLive = el.querySelector('image, video, img, foreignObject') || (el.tagName?.toLowerCase() === 'image' ? el : null);
                if (imgElLive) {
                  const targetCData = state.childrenData.find(c => c.child === imgElLive || c.child.contains?.(imgElLive)) || state.childrenData[0];
                  if (targetCData) {
                    const la = state.localAnchor;
                    const bound = bbox || targetCData.bound;
                    const newMinX = la.x + (bound.x - la.x) * scaleX;
                    const newMinY = la.y + (bound.y - la.y) * scaleY;
                    const newMaxX = la.x + (bound.x + bound.width - la.x) * scaleX;
                    const newMaxY = la.y + (bound.y + bound.height - la.y) * scaleY;
                    const cropLocX = Math.min(newMinX, newMaxX);
                    const cropLocY = Math.min(newMinY, newMaxY);
                    const cropLocW = Math.abs(newMaxX - newMinX);
                    const cropLocH = Math.abs(newMaxY - newMinY);

                    const origX = parseFloat(el.getAttribute('data-crop-orig-x') || imgElLive.getAttribute('x') || '0');
                    const origY = parseFloat(el.getAttribute('data-crop-orig-y') || imgElLive.getAttribute('y') || '0');
                    const origW = parseFloat(el.getAttribute('data-crop-orig-w') || imgElLive.getAttribute('width') || '100');
                    const origH = parseFloat(el.getAttribute('data-crop-orig-h') || imgElLive.getAttribute('height') || '100');

                    if (origW > 0 && origH > 0) {
                      const svgRootLive = el.ownerSVGElement || imgElLive.ownerSVGElement;
                      if (svgRootLive) {
                        let defs = svgRootLive.querySelector('defs');
                        if (!defs) {
                          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                          svgRootLive.insertBefore(defs, svgRootLive.firstChild);
                        }

                        const groupClipId = `crop-group-clip-${el.id}`;
                        let grpClipPath = defs.querySelector(`[id="${groupClipId}"]`);
                        if (!grpClipPath) {
                          grpClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                          grpClipPath.id = groupClipId;
                          grpClipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
                          const groupRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                          grpClipPath.appendChild(groupRect);
                          defs.appendChild(grpClipPath);
                        }

                        const gr = grpClipPath.querySelector('rect');
                        if (gr) {
                          gr.setAttribute('x', cropLocX);
                          gr.setAttribute('y', cropLocY);
                          gr.setAttribute('width', Math.max(0, cropLocW));
                          gr.setAttribute('height', Math.max(0, cropLocH));
                        }
                        el.setAttribute('clip-path', `url(#${groupClipId})`);

                        const imgClipPath = svgRootLive.querySelector(`[id="crop-clip-${el.id}"]`);
                        if (imgClipPath) {
                          const r = imgClipPath.querySelector('rect');
                          if (r) {
                            r.setAttribute('x', cropLocX);
                            r.setAttribute('y', cropLocY);
                            r.setAttribute('width', Math.max(0, cropLocW));
                            r.setAttribute('height', Math.max(0, cropLocH));
                          }
                        }

                        const isSideHandleSync = ['n', 's', 'e', 'w'].includes(dir) && !event.shiftKey;
                        if (isSideHandleSync) {
                          const cLeft = ((cropLocX - origX) / origW) * 100;
                          const cTop = ((cropLocY - origY) / origH) * 100;
                          const cWidth = (cropLocW / origW) * 100;
                          const cHeight = (cropLocH / origH) * 100;

                          const cropDataStr = el.getAttribute('data-crop-data');
                          let cd = {};
                          try { if (cropDataStr && cropDataStr !== 'null') cd = JSON.parse(cropDataStr); } catch { /* ignored */ }

                          cd.left = cLeft;
                          cd.top = cTop;
                          cd.width = Math.max(0, cWidth);
                          cd.height = Math.max(0, cHeight);

                          el.setAttribute('data-crop-data', JSON.stringify(cd));
                        }
                      }
                    }
                  }
                }
              } catch { /* non-critical */ }
            }



            if (el.tagName === 'multi') {
              if (typeof drawMultiSelectionHighlight === 'function') {
                drawMultiSelectionHighlight(multiSelectedIdsRef.current);
              }
            } else {
              syncOverlay(el);
              const highlightType = (currentFrameIdRef.current && el.id !== currentFrameIdRef.current) ? 'child-selected' : 'selected';
              drawOverlayHighlight(el, highlightType);
            }

            // ── RENDER SMART GUIDES DURING RESIZE ──
            const targetSvg = state.svg || el.ownerSVGElement;
            if (localTrimViewRef.current && targetSvg && el && el.tagName !== 'multi') {
              const isOutside = isElementCompletelyOutside(el, targetSvg);
              if (isOutside) {
                el.setAttribute('data-trim-outside', 'true');
              } else {
                el.removeAttribute('data-trim-outside');
              }
            }
            let currentBox = null;
            if (el.tagName === 'multi' && state.newOverallBBox) {
              const b = state.newOverallBBox;
              currentBox = {
                left: b.x,
                top: b.y,
                right: b.x + b.width,
                bottom: b.y + b.height,
                width: b.width,
                height: b.height,
                centerX: b.x + b.width / 2,
                centerY: b.y + b.height / 2
              };
            } else if (targetSvg) {
              currentBox = getBoxInSvg(el, targetSvg);
            }

            if (currentBox && targetSvg) {
              const guideData = collectResizeGuideLines({
                resizeState: state,
                currentBox,
                dir
              });
              const pageContainer = (el.closest ? el.closest('.page-svg-container') : null) || targetSvg.closest?.('.page-svg-container');
              const pageIdx = pageContainer ? parseInt(pageContainer.getAttribute('data-page-index')) : activePageIndex;
              renderSmartGuides(pageIdx, guideData.guides, guideData.badge, zoom / 100, targetSvg);
            }
          },
          end(event) {
            clearSmartGuides();
            // Unlock cursor back to default
            document.body.style.cursor = '';
            document.body.classList.remove('resizing-active');
            document.documentElement.style.removeProperty('--resizing-cursor');

            const state = event.interaction.resizeState;
            if (state) {
              if (state.childrenData) {
                const textChild = state.childrenData.find(c => c.child.tagName?.toLowerCase() === 'text' || c.child.getAttribute('data-type') === 'text');
                if (textChild) {
                  const curFs = textChild.child.getAttribute('font-size');
                  if (curFs) textChild.child.setAttribute('data-base-font-size', curFs);
                }
                const rectChild = state.childrenData.find(c => c.child.tagName?.toLowerCase() === 'rect');
                if (rectChild) {
                  const curRx = rectChild.child.getAttribute('rx');
                  if (curRx) rectChild.child.setAttribute('data-base-rx', curRx);
                }
              }
              if (updatePageHtmlRef.current) {
                // state.el may be a fake object for multi-selection, use state.svg's container
                const container = state.pageContainer || state.svg?.closest?.('.page-svg-container') ||
                  (state.el?.closest ? state.el.closest('.page-svg-container') : null);
                const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : (state.pageIdx ?? activePageIndex);
                const targetSvg = state.svg || container?.querySelector('svg:not([id^="highlight-overlay-"])');
                if (localTrimViewRef.current && targetSvg && state.el && state.el.tagName !== 'multi') {
                  const isOutside = isElementCompletelyOutside(state.el, targetSvg);
                  if (isOutside) {
                    state.el.setAttribute('data-trim-outside', 'true');
                  } else {
                    state.el.removeAttribute('data-trim-outside');
                  }
                }
                if (targetSvg) {
                  saveModifiedPageHtml(pageIdx, targetSvg);
                }
              }

              // Restore handles and highlight overlay
              if (state.el?.tagName === 'multi' || (state.multiDragItems && state.multiDragItems.length > 0)) {
                if (typeof drawMultiSelectionHighlight === 'function') {
                  drawMultiSelectionHighlight(multiSelectedIdsRef.current);
                }
              } else if (state.el) {
                if (typeof drawOverlayHighlight === 'function') {
                  const highlightType = currentFrameIdRef.current && state.el.id !== currentFrameIdRef.current ? 'child-selected' : 'selected';
                  drawOverlayHighlight(state.el, highlightType);
                }
              }
            }
            delete event.interaction.resizeState;
            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [activePageIndex, zoom]);
};
