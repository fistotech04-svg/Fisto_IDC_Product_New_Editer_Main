import { getVisualBBox, getElementMatrix, getVisualCornersAndRotation } from '../geometryUtils';
import {
  getOverlayForElement,
  getHtmlOverlayForElement,
  getRotatingCursor,
  createOrUpdateEdgeHandles,
  applyCrispSelectionStroke,
  isElementHidden,
  purgeElementOverlays
} from './overlayDomUtils';

export { isElementHidden, purgeElementOverlays };

/**
 * Core overlay highlight renderer.
 * Draws the per-element selection polygon (blue outline) and, when exactly one
 * element is selected, draws all 8 resize handles plus the rotate handle.
 */
export const createOverlayHighlightRenderer = ({
  zoom,
  activeTopToolRef,
  nodeEditModeRef,
  isEditingTextRef,
  isAltPressedRef,
  selectedLayerIdRef,
  multiSelectedIdsRef,
  createOrUpdateRotateHandle,
  drawInteractionBadge
}) => {

  const drawOverlayHighlight = (el, type) => {
    if (!el || isElementHidden(el)) {
      if (el) purgeElementOverlays(el);
      return;
    }

    if (typeof el.getBBox !== 'function' || typeof el.getScreenCTM !== 'function') {
      purgeElementOverlays(el);
      return;
    }

    // Never draw highlights for Free Frames in normal edit mode (non-interaction & non-animation)
    const isFreeFrameCheck = el.getAttribute('data-name') === 'Free Frame' ||
      el.getAttribute('data-type') === 'free-frame' ||
      (el.id && el.id.startsWith('free-frame'));
    if (isFreeFrameCheck && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') {
      purgeElementOverlays(el);
      return;
    }

    // Freeze selection box during animation preview
    if (el.getAttribute('data-is-animating') === 'true') return;

    // Suppress object selection box, hover highlights, and resize handles during Path Node Edit Mode
    if (nodeEditModeRef?.current || el.getAttribute('data-node-edit') === 'true' || el.closest?.('[data-node-edit-active="true"]')) {
      const overlay = getOverlayForElement(el);
      if (overlay) {
        overlay.querySelectorAll(`[id*="${el.id}"]`).forEach(node => {
          if (!node.id || !node.id.includes('node-edit')) node.remove();
        });
      }
      const htmlOverlay = getHtmlOverlayForElement(el);
      if (htmlOverlay) {
        htmlOverlay.querySelectorAll(`[id*="${el.id}"]`).forEach(h => h.remove());
        htmlOverlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
      }
      return;
    }

    const overlay = getOverlayForElement(el);
    if (!overlay) return;

    // Purge stale or competing overlays for this element to prevent duplicate selection boxes
    if (type.includes('selected')) {
      overlay.querySelectorAll(`[id*="${el.id}"]`).forEach(node => {
        if (node.id !== `overlay-poly-${type}-${el.id}` && node.id !== `overlay-path-${type}-${el.id}`) {
          node.remove();
        }
      });
    }

    if (type === 'hover' || type === 'child-hover') {
      if (document.querySelector('[data-dragging="true"]')) return;
      if (isAltPressedRef.current && selectedLayerIdRef.current) {
        const selectedEl = document.getElementById(selectedLayerIdRef.current);
        if (selectedEl) {
          const isSelectedBackgroundOrFrame = selectedEl.getAttribute('data-name') === 'Overlay' ||
            selectedEl.getAttribute('data-type') === 'background' ||
            selectedEl.getAttribute('data-type') === 'frame';
          if (!isSelectedBackgroundOrFrame) return; // Suppress blue hover outline during Alt comparison
        }
      }
    }

    if (type === 'entered') {
      const isRealFrame = el.getAttribute('data-type') === 'frame';
      const isParentGroup = el.tagName.toLowerCase() === 'g' && el.id !== selectedLayerIdRef.current;
      if ((!isRealFrame && !isParentGroup) || document.querySelector('[data-dragging="true"]')) {
        const existingPoly = overlay.querySelector(`[id="overlay-poly-entered-${el.id}"]`);
        if (existingPoly) existingPoly.remove();
        return;
      }
    }

    // Skip if element is hidden or it's the base "Overlay" (background) / Base Page Frame
    const isOverlay = el.getAttribute('data-name') === 'Overlay' ||
      el.getAttribute('data-type') === 'background' ||
      el.getAttribute('data-type') === 'frame' ||
      el.getAttribute('data-locked') === 'true';

    // Skip if this text element is currently in text-edit mode
    const isBeingEdited = isEditingTextRef.current && el.id === selectedLayerIdRef.current;

    if (isOverlay) {
      purgeElementOverlays(el);
      return;
    }

    try {
      let bbox = getVisualBBox(el);
      const ctm = el.getScreenCTM();
      const overlayCtm = overlay.getScreenCTM();
      if (!ctm || !overlayCtm) {
        purgeElementOverlays(el);
        return;
      }

      const isFrame = el.getAttribute('data-type') === 'frame';
      const isFreeFrame = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame' || (el.id && el.id.startsWith('free-frame'));
      if (isFreeFrame && activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') return;
      if (activeTopToolRef.current === 'animation' && isFreeFrame) return;
      const tagLower = el.tagName.toLowerCase();
      const isLine = tagLower === 'line';
      const isHover = type === 'hover' || type === 'child-hover';
      const isSelected = type === 'selected' || type === 'child-selected' || type === 'multi-child-selected';
      const zoomScale = zoom / 100;
      const isVectorPath = el.getAttribute('data-type') === 'vector-path' || el.getAttribute('data-is-vector') === 'true';

      // ── PIXEL-PERFECT PATH for non-frame, non-line elements ──
      if (!isFrame && !isLine) {
        let localBBox = bbox;
        const isHotspot = el.getAttribute('data-is-hotspot') === 'true';
        const isInteractiveButton = isHotspot && el.querySelector('rect') !== null && (el.querySelector('text') !== null || el.querySelector('[data-type="text"]') !== null);
        if (isHotspot && isInteractiveButton) {
          const rectChild = el.querySelector('rect');
          if (rectChild) {
            const w = parseFloat(rectChild.getAttribute('width')) || 0;
            const h = parseFloat(rectChild.getAttribute('height')) || 0;
            const x = parseFloat(rectChild.getAttribute('x') || '0');
            const y = parseFloat(rectChild.getAttribute('y') || '0');
            if (w > 0 && h > 0) {
              localBBox = { x, y, width: w, height: h };
            }
          }
          if (!localBBox || localBBox.width <= 0 || localBBox.height <= 0) {
            localBBox = { x: 0, y: 0, width: 80, height: 32 };
          }
        } else if (isHotspot && !isInteractiveButton) {
          const imgChild = el.querySelector('image, svg, rect');
          if (imgChild) {
            const w = parseFloat(imgChild.getAttribute('width') || imgChild.viewBox?.baseVal?.width) || 0;
            const h = parseFloat(imgChild.getAttribute('height') || imgChild.viewBox?.baseVal?.height) || 0;
            const x = parseFloat(imgChild.getAttribute('x') || '0');
            const y = parseFloat(imgChild.getAttribute('y') || '0');
            if (w > 0 && h > 0) {
              localBBox = { x, y, width: w, height: h };
            }
          }
          if (!localBBox || localBBox.width <= 0 || localBBox.height <= 0) {
            localBBox = { x: 0, y: 0, width: 48, height: 48 };
          }
        }
        const elScreenCtm = el.getScreenCTM();

        if (localBBox && localBBox.width > 0 && localBBox.height > 0 && elScreenCtm) {
          el.dataset.overlayRetries = '0';
          const isBeingEditedCheck = isEditingTextRef.current && el.id === selectedLayerIdRef.current;

          const localToOverlay = overlayCtm.inverse().multiply(elScreenCtm);
          const pt1 = overlay.createSVGPoint(); pt1.x = localBBox.x; pt1.y = localBBox.y;
          const pt2 = overlay.createSVGPoint(); pt2.x = localBBox.x + localBBox.width; pt2.y = localBBox.y;
          const pt3 = overlay.createSVGPoint(); pt3.x = localBBox.x + localBBox.width; pt3.y = localBBox.y + localBBox.height;
          const pt4 = overlay.createSVGPoint(); pt4.x = localBBox.x; pt4.y = localBBox.y + localBBox.height;

          const mapped = [pt1, pt2, pt3, pt4].map(p => p.matrixTransform(localToOverlay));
          const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');

          // ── Exact Path Shape Overlay for Vector Paths ──
          let pathOverlayId = `overlay-path-${type}-${el.id}`;
          let pathOverlay = overlay.querySelector(`[id="${pathOverlayId}"]`);

          if (isVectorPath) {
            const d = el.getAttribute('d');
            if (d && isHover) {
              if (!pathOverlay) {
                pathOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathOverlay.id = pathOverlayId;
                pathOverlay.setAttribute('class', `overlay-type-${type}`);
                pathOverlay.setAttribute('pointer-events', 'none');
                overlay.appendChild(pathOverlay);
              }

              if (elScreenCtm) {
                pathOverlay.setAttribute('transform', `matrix(${localToOverlay.a} ${localToOverlay.b} ${localToOverlay.c} ${localToOverlay.d} ${localToOverlay.e} ${localToOverlay.f})`);
              }
              pathOverlay.setAttribute('d', d);

              const vectorColor = '#5255CA';
              pathOverlay.setAttribute('stroke', vectorColor);
              pathOverlay.setAttribute('stroke-width', String(1.8 / zoomScale));
              pathOverlay.setAttribute('vector-effect', 'non-scaling-stroke');
              pathOverlay.setAttribute('stroke-linecap', el.getAttribute('stroke-linecap') || 'round');
              pathOverlay.setAttribute('stroke-linejoin', el.getAttribute('stroke-linejoin') || 'round');
              pathOverlay.setAttribute('fill', 'none');
              pathOverlay.removeAttribute('stroke-dasharray');
            } else if (pathOverlay) {
              pathOverlay.remove();
            }

            let polyId = `overlay-poly-${type}-${el.id}`;
            let polygon = overlay.querySelector(`[id="${polyId}"]`);

            if (isHover) {
              if (polygon) polygon.remove();
            } else {
              if (!polygon) {
                polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.id = polyId;
                polygon.setAttribute('class', `overlay-type-${type}`);
                polygon.setAttribute('fill', 'none');
                polygon.setAttribute('pointer-events', 'none');
                overlay.appendChild(polygon);
              }
              polygon.setAttribute('stroke', '#5255CA');
              applyCrispSelectionStroke(polygon, pointsStr, zoomScale);
            }
          } else {
            if (pathOverlay) pathOverlay.remove();

            let polyId = `overlay-poly-${type}-${el.id}`;
            let polygon = overlay.querySelector(`[id="${polyId}"]`);
            if (!polygon) {
              polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
              polygon.id = polyId;
              polygon.setAttribute('class', `overlay-type-${type}`);
              polygon.setAttribute('pointer-events', 'none');
              overlay.appendChild(polygon);
            }
            const isFreeFrameEl = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame';
            const isHotspotEl = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
            const isBlackSelection = isFreeFrameEl || isHotspotEl || ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected);

            if (isBlackSelection) {
              polygon.setAttribute('stroke', (isHover && !isSelected) ? 'transparent' : '#000000');
              polygon.setAttribute('fill', 'none');
            } else if (isHover) {
              polygon.setAttribute('stroke', '#5255CA');
              polygon.setAttribute('fill', 'none');
            } else if (isSelected || type === 'entered') {
              polygon.setAttribute('stroke', '#5255CA');
              polygon.setAttribute('fill', 'none');
            }
            polygon.setAttribute('points', pointsStr);

            if (isBlackSelection) {
              applyCrispSelectionStroke(polygon, pointsStr, zoomScale);
            } else if (isHover) {
              applyCrispSelectionStroke(polygon, pointsStr, zoomScale);
            } else if (type === 'selected' || type === 'child-selected' || type === 'multi-child-selected') {
              applyCrispSelectionStroke(polygon, pointsStr, zoomScale);
            } else if (type === 'entered') {
              polygon.setAttribute('stroke-width', String(1 / zoomScale));
              polygon.setAttribute('stroke-dasharray', `${4 / zoomScale},${4 / zoomScale}`);
            }
          }

          // Draw resize handles for selected elements (single selection only)
          const isMultiSelectionBox = el.id === 'multi' || el.id === 'multi-selection-bounds';
          const selectionCount = isMultiSelectionBox ? 1 : (multiSelectedIdsRef.current.size > 0 ? multiSelectedIdsRef.current.size : (selectedLayerIdRef.current ? 1 : 0));
          if (selectionCount === 1 && (type === 'selected' || type === 'child-selected') && !isBeingEditedCheck) {
            const htmlOverlay = getHtmlOverlayForElement(el);
            const isFreeFrameEl2 = el.getAttribute('data-name')?.toLowerCase() === 'free frame' || el.getAttribute('data-type') === 'free-frame' || el.id?.startsWith('free-frame');
            const isHotspotEl2 = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
            const isBlackSelection2 = isFreeFrameEl2 || isHotspotEl2 || ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected);
            const isInteractiveResizable = isFreeFrameEl2 || isHotspotEl2;
            const isLCorner = (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation' || isFreeFrameEl2 || isHotspotEl2);
            const showSideHandles = activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation' || isInteractiveResizable;

            if (htmlOverlay) {
              const isDragging = el.getAttribute('data-dragging') === 'true' || document.body.classList.contains('dragging-active');
              if (isDragging) {
                const existingHandles = htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"], [id^="rotate-handle-${el.id}"], [id^="rotation-degree-badge-${el.id}"], [id^="rotate-hotspot-${el.id}-"]`);
                existingHandles.forEach(h => { h.style.display = 'none'; });
                return;
              }

              const { cornersMap, visualRotation } = getVisualCornersAndRotation(mapped, localToOverlay, el);
              const rotation = visualRotation;

              const handleSize = 8.5;
              const handleBorderColor = isBlackSelection2 ? '#000000' : '#5255CA';
              const handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
              const midN = { x: (cornersMap.nw.x + cornersMap.ne.x) / 2, y: (cornersMap.nw.y + cornersMap.ne.y) / 2 };
              const midE = { x: (cornersMap.ne.x + cornersMap.se.x) / 2, y: (cornersMap.ne.y + cornersMap.se.y) / 2 };
              const midS = { x: (cornersMap.se.x + cornersMap.sw.x) / 2, y: (cornersMap.se.y + cornersMap.sw.y) / 2 };
              const midW = { x: (cornersMap.sw.x + cornersMap.nw.x) / 2, y: (cornersMap.sw.y + cornersMap.nw.y) / 2 };
              const allPts = [cornersMap.nw, cornersMap.ne, cornersMap.se, cornersMap.sw, midN, midE, midS, midW];

              allPts.forEach((p, i) => {
                const name = handleNames[i];
                const isSide = ['n', 'e', 's', 'w'].includes(name);
                const handleId = `resize-handle-${el.id}-${name}`;
                let handle = htmlOverlay.querySelector(`[id="${handleId}"]`);

                if (isSide && !showSideHandles) {
                  if (handle) handle.remove();
                  return;
                }

                if (!handle) {
                  handle = document.createElement('div');
                  handle.id = handleId;
                  handle.style.position = 'absolute';
                  handle.style.left = '0px';
                  handle.style.top = '0px';
                  handle.style.transformOrigin = '0 0';
                  handle.style.willChange = 'transform';
                  htmlOverlay.appendChild(handle);
                }

                handle.style.display = '';
                handle.className = `resize-handle overlay-type-${type} absolute`;

                if (isSide) {
                  const targetStyle = isBlackSelection2
                    ? `side-black-hollow-slim-${name}-3.8`
                    : `side-${name}-${handleBorderColor}`;
                  if (handle.dataset.styled !== targetStyle) {
                    handle.dataset.styled = targetStyle;
                    if (handle.hasChildNodes()) handle.innerHTML = '';
                    const isHorizontal = (name === 'n' || name === 's');

                    handle.style.backgroundColor = '#FFFFFF';
                    handle.style.boxShadow = 'none';
                    handle.style.borderRadius = '9999px';
                    handle.style.pointerEvents = 'auto';
                    handle.style.boxSizing = 'border-box';
                    handle.style.zIndex = '999';

                    if (isBlackSelection2) {
                      handle.style.border = `1.2px solid ${handleBorderColor}`;
                      handle.style.width = isHorizontal ? '12px' : '3.8px';
                      handle.style.height = isHorizontal ? '3.8px' : '12px';
                    } else {
                      handle.style.border = `1.5px solid ${handleBorderColor}`;
                      handle.style.width = isHorizontal ? '12.5px' : '5.5px';
                      handle.style.height = isHorizontal ? '5.5px' : '12.5px';
                    }
                  }

                  handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
                } else if (isLCorner) {
                  const arm = 8.5;
                  const barThickness = 2.5;
                  const targetStyle = `l-bracket-merged-v4-${name}-${arm}-${barThickness}`;
                  if (handle.dataset.styled !== targetStyle) {
                    handle.dataset.styled = targetStyle;
                    handle.style.backgroundColor = 'transparent';
                    handle.style.border = 'none';
                    handle.style.boxShadow = 'none';
                    handle.style.borderRadius = '0';
                    handle.style.width = '24px';
                    handle.style.height = '24px';
                    handle.style.zIndex = '1000';
                    handle.style.pointerEvents = isInteractiveResizable || activeTopToolRef.current === 'editor' ? 'auto' : 'none';
                    handle.style.boxSizing = 'border-box';
                    handle.style.overflow = 'visible';

                    let pathD = '';
                    if (name === 'nw') {
                      pathD = `M ${arm} 0 L 0 0 L 0 ${arm}`;
                    } else if (name === 'ne') {
                      pathD = `M -${arm} 0 L 0 0 L 0 ${arm}`;
                    } else if (name === 'se') {
                      pathD = `M -${arm} 0 L 0 0 L 0 -${arm}`;
                    } else if (name === 'sw') {
                      pathD = `M ${arm} 0 L 0 0 L 0 -${arm}`;
                    }

                    handle.innerHTML = `
                      <svg width="24" height="24" viewBox="-12 -12 24 24" style="position: absolute; left: 0; top: 0; width: 24px; height: 24px; overflow: visible; pointer-events: none;">
                        <path d="${pathD}" fill="none" stroke="${handleBorderColor}" stroke-width="${barThickness}" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    `;
                  }

                  handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
                } else {
                  const targetStyle = `corner-${handleSize}-${handleBorderColor}`;
                  if (handle.dataset.styled !== targetStyle) {
                    handle.dataset.styled = targetStyle;
                    if (handle.hasChildNodes()) handle.innerHTML = '';
                    handle.style.backgroundColor = '#FFFFFF';
                    handle.style.border = `1.5px solid ${handleBorderColor}`;
                    handle.style.boxShadow = 'none';
                    handle.style.borderRadius = '50%';
                    handle.style.pointerEvents = 'auto';
                    handle.style.boxSizing = 'border-box';
                    handle.style.zIndex = '1000';
                    handle.style.width = `${handleSize}px`;
                    handle.style.height = `${handleSize}px`;
                  }

                  handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
                }

                handle.style.cursor = (isInteractiveResizable || activeTopToolRef.current === 'editor') ? getRotatingCursor(name, rotation) : 'default';
              });

              // Add 4-side full line resize handles (not only side dots)
              createOrUpdateEdgeHandles({
                htmlOverlay,
                targetId: el.id,
                cornersMap,
                rotation,
                zoomScale,
                show: showSideHandles
              });

              // Add rotate handle for non-line elements
              const allowRotate = !isLine && (
                (activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') ||
                isFreeFrame
              );
              if (allowRotate) {
                const cx = (cornersMap.nw.x + cornersMap.se.x) / 2;
                const cy = (cornersMap.nw.y + cornersMap.se.y) / 2;
                createOrUpdateRotateHandle({
                  handleId: `rotate-handle-${el.id}`,
                  htmlOverlay,
                  cx,
                  cy,
                  cornersMap,
                  rotation,
                  zoomScale: zoom / 100,
                  targetIds: [el.id],
                  targetKey: el.id,
                  show: false
                });
              } else {
                htmlOverlay.querySelectorAll(`[id^="rotate-handle-${el.id}"], [id^="rotate-hotspot-${el.id}-"]`).forEach(h => h.remove());
              }
            }

            if (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') {
              drawInteractionBadge(el, mapped, htmlOverlay, zoomScale, bbox);
            }
          }
          return; // ← Early return: pixel-perfect path handled
        }
      }

      // Fallback for frames and zero-bbox elements (getBoundingClientRect)
      if (isFrame || ((bbox.width < 5 || bbox.height < 5) && el.tagName.toLowerCase() !== 'line')) {
        const clientRect = el.getBoundingClientRect();
        const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
        if (isFrame || clientRect.width / scale > 10 || clientRect.height / scale > 10 || el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'foreignobject') {
          if (clientRect.width > 0 && clientRect.height > 0) {
            el.dataset.overlayRetries = '0';
            const elInverse = ctm.inverse();
            const pt = overlay.createSVGPoint();

            pt.x = clientRect.left; pt.y = clientRect.top;
            const localTL = pt.matrixTransform(elInverse);

            pt.x = clientRect.right; pt.y = clientRect.bottom;
            const localBR = pt.matrixTransform(elInverse);

            bbox = {
              x: Math.min(localTL.x, localBR.x),
              y: Math.min(localTL.y, localBR.y),
              width: Math.abs(localBR.x - localTL.x),
              height: Math.abs(localBR.y - localTL.y)
            };
          }
        }
      }

      if (bbox.width === 0 && bbox.height === 0) {
        const retries = parseInt(el.dataset.overlayRetries || '0');
        if (retries < 5) {
          el.dataset.overlayRetries = String(retries + 1);
          setTimeout(() => {
            const freshEl = document.getElementById(el.id);
            if (freshEl) drawOverlayHighlight(freshEl, type);
          }, 50);
        }
        return;
      }
      el.dataset.overlayRetries = '0';

      const svgMatrix = overlayCtm.inverse().multiply(ctm);

      const isMediaOrText = el.tagName.toLowerCase() === 'image' ||
        el.tagName.toLowerCase() === 'video' ||
        el.tagName.toLowerCase() === 'img' ||
        el.tagName.toLowerCase() === 'text' ||
        el.tagName.toLowerCase() === 'foreignobject';

      const scale = Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) || 1;
      const screenOffset = 0;
      const localOffset = screenOffset / scale;

      let pts;
      if (isLine) {
        const x1 = parseFloat(el.getAttribute('x1')) || 0;
        const y1 = parseFloat(el.getAttribute('y1')) || 0;
        const x2 = parseFloat(el.getAttribute('x2')) || 0;
        const y2 = parseFloat(el.getAttribute('y2')) || 0;
        const pt1 = overlay.createSVGPoint(); pt1.x = x1; pt1.y = y1;
        const pt2 = overlay.createSVGPoint(); pt2.x = x2; pt2.y = y2;
        pts = [pt1, pt2];
      } else {
        const pt1 = overlay.createSVGPoint(); pt1.x = bbox.x - localOffset; pt1.y = bbox.y - localOffset;
        const pt2 = overlay.createSVGPoint(); pt2.x = bbox.x + bbox.width + localOffset; pt2.y = bbox.y - localOffset;
        const pt3 = overlay.createSVGPoint(); pt3.x = bbox.x + bbox.width + localOffset; pt3.y = bbox.y + bbox.height + localOffset;
        const pt4 = overlay.createSVGPoint(); pt4.x = bbox.x - localOffset; pt4.y = bbox.y + bbox.height + localOffset;
        pts = [pt1, pt2, pt3, pt4];
      }

      const mapped = pts.map(p => p.matrixTransform(svgMatrix));
      const pointsStr = mapped.map(p => `${p.x},${p.y}`).join(' ');

      if (isVectorPath) {
        let polyId = `overlay-poly-${type}-${el.id}`;
        let polygon = overlay.querySelector(`[id="${polyId}"]`);
        if (polygon) polygon.remove();
      } else {
        let polyId = `overlay-poly-${type}-${el.id}`;
        let polygon = overlay.querySelector(`[id="${polyId}"]`);
        if (!polygon) {
          polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.id = polyId;
          polygon.setAttribute('class', `overlay-type-${type}`);
          polygon.setAttribute('pointer-events', 'none');
          overlay.appendChild(polygon);
        }
        const isFreeFrameFB = el.getAttribute('data-name') === 'Free Frame' || el.getAttribute('data-type') === 'free-frame';
        const isHotspotFB = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
        const isBlackSelectionFB = isFreeFrameFB || isHotspotFB || ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected);

        if (isLine) {
          polygon.setAttribute('stroke', 'transparent');
          polygon.setAttribute('fill', 'none');
        } else if (isBlackSelectionFB) {
          polygon.setAttribute('stroke', (isHover && !isSelected) ? 'transparent' : '#000000');
          polygon.setAttribute('fill', 'none');
        } else if (isHover) {
          polygon.setAttribute('stroke', '#5255CA');
          if (activeTopToolRef.current === 'interaction' && el.getAttribute('data-interaction') && el.getAttribute('data-interaction') !== 'none') {
            polygon.setAttribute('fill', 'rgba(82, 85, 202, 0.3)');
          } else {
            polygon.setAttribute('fill', 'none');
          }
        } else if (isSelected) {
          polygon.setAttribute('stroke', '#5255CA');
          polygon.setAttribute('fill', 'none');
        } else if (type === 'entered') {
          polygon.setAttribute('stroke', isMediaOrText ? 'transparent' : '#5255CA');
          polygon.setAttribute('fill', 'none');
        }
        polygon.setAttribute('points', pointsStr);

        const zoomScale2 = zoom / 100;
        if (isBlackSelectionFB) {
          applyCrispSelectionStroke(polygon, pointsStr, zoomScale2);
        } else if (isHover) {
          applyCrispSelectionStroke(polygon, pointsStr, zoomScale2);
        } else if (type === 'selected' || type === 'child-selected' || type === 'multi-child-selected') {
          applyCrispSelectionStroke(polygon, pointsStr, zoomScale2);
        } else if (type === 'entered') {
          polygon.setAttribute('stroke-width', String(1 / zoomScale2));
          polygon.setAttribute('stroke-dasharray', `${4 / zoomScale2},${4 / zoomScale2}`);
        }
      }

      // ── RESIZE HANDLES (8 handles) - Fallback path ──
      const isMultiSelectionBox = el.id === 'multi' || el.id === 'multi-selection-bounds';
      const selectionCount = isMultiSelectionBox ? 1 : (multiSelectedIdsRef.current.size > 0 ? multiSelectedIdsRef.current.size : (selectedLayerIdRef.current ? 1 : 0));
      if (selectionCount === 1 && (type === 'selected' || type === 'child-selected') && !isBeingEdited) {
        const htmlOverlay = getHtmlOverlayForElement(el);
        const isFreeFrameFB2 = el.getAttribute('data-name')?.toLowerCase() === 'free frame' || el.getAttribute('data-type') === 'free-frame' || el.id?.startsWith('free-frame');
        const isHotspotFB2 = el.getAttribute('data-is-hotspot') === 'true' || el.getAttribute('data-type') === 'hotspot';
        const isBlackSelectionFB2 = isFreeFrameFB2 || isHotspotFB2 || ((activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') && isSelected);
        const isInteractiveResizableFB = isFreeFrameFB2 || isHotspotFB2;
        const isLCornerFB = (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation' || isFreeFrameFB2 || isHotspotFB2);
        const showSideHandlesFB = activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation' || isInteractiveResizableFB;

        if (htmlOverlay) {
          const isDragging = el.getAttribute('data-dragging') === 'true' || document.body.classList.contains('dragging-active');
          if (isDragging) {
            htmlOverlay.querySelectorAll(`[id^="resize-handle-${el.id}-"], [id^="rotate-handle-${el.id}"], [id^="rotation-degree-badge-${el.id}"], [id^="rotate-hotspot-${el.id}-"]`).forEach(h => {
              h.style.display = 'none';
            });
            return;
          }

          const matrix = getElementMatrix(el);
          const { cornersMap, visualRotation } = getVisualCornersAndRotation(mapped, matrix, el);
          const rotation = visualRotation;

          const handleSize = 8.5;
          const handleBorderColor = isBlackSelectionFB2 ? '#000000' : '#5255CA';

          let handleNames, allPts;

          if (isLine) {
            handleNames = ['linestart', 'lineend'];
            allPts = [...mapped];
          } else {
            handleNames = ['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'];
            const midN = { x: (cornersMap.nw.x + cornersMap.ne.x) / 2, y: (cornersMap.nw.y + cornersMap.ne.y) / 2 };
            const midE = { x: (cornersMap.ne.x + cornersMap.se.x) / 2, y: (cornersMap.ne.y + cornersMap.se.y) / 2 };
            const midS = { x: (cornersMap.se.x + cornersMap.sw.x) / 2, y: (cornersMap.se.y + cornersMap.sw.y) / 2 };
            const midW = { x: (cornersMap.sw.x + cornersMap.nw.x) / 2, y: (cornersMap.sw.y + cornersMap.nw.y) / 2 };
            allPts = [cornersMap.nw, cornersMap.ne, cornersMap.se, cornersMap.sw, midN, midE, midS, midW];
          }

          allPts.forEach((p, i) => {
            const name = handleNames[i];
            const isSide = ['n', 'e', 's', 'w'].includes(name);
            const handleId = `resize-handle-${el.id}-${name}`;
            let handle = htmlOverlay?.querySelector(`[id="${handleId}"]`);

            if (isSide && !showSideHandlesFB) {
              if (handle) handle.remove();
              return;
            }

            if (!handle && htmlOverlay) {
              handle = document.createElement('div');
              handle.id = handleId;
              handle.style.position = 'absolute';
              handle.style.left = '0px';
              handle.style.top = '0px';
              handle.style.transformOrigin = '0 0';
              handle.style.willChange = 'transform';
              htmlOverlay.appendChild(handle);
            }

            handle.style.display = '';
            handle.className = `resize-handle overlay-type-${type} absolute`;

            if (isSide) {
              const targetStyle = isBlackSelectionFB2
                ? `side-black-hollow-slim-${name}-3.8`
                : `side-${name}-${handleBorderColor}`;
              if (handle.dataset.styled !== targetStyle) {
                handle.dataset.styled = targetStyle;
                if (handle.hasChildNodes()) handle.innerHTML = '';
                const isHorizontal = (name === 'n' || name === 's');

                handle.style.backgroundColor = '#FFFFFF';
                handle.style.boxShadow = 'none';
                handle.style.borderRadius = '9999px';
                handle.style.pointerEvents = 'auto';
                handle.style.boxSizing = 'border-box';
                handle.style.zIndex = '999';

                if (isBlackSelectionFB2) {
                  handle.style.border = `1.2px solid ${handleBorderColor}`;
                  handle.style.width = isHorizontal ? '12px' : '3.8px';
                  handle.style.height = isHorizontal ? '3.8px' : '12px';
                } else {
                  handle.style.border = `1.5px solid ${handleBorderColor}`;
                  handle.style.width = isHorizontal ? '12.5px' : '5.5px';
                  handle.style.height = isHorizontal ? '5.5px' : '12.5px';
                }
              }

              handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / (zoom / 100)).toFixed(3)}) translate(-50%, -50%)`;
            } else if (!isLine && isLCornerFB) {
              const arm = 8.5;
              const barThickness = 2.5;
              const targetStyle = `l-bracket-merged-v4-${name}-${arm}-${barThickness}`;
              if (handle.dataset.styled !== targetStyle) {
                handle.dataset.styled = targetStyle;
                handle.style.backgroundColor = 'transparent';
                handle.style.border = 'none';
                handle.style.boxShadow = 'none';
                handle.style.borderRadius = '0';
                handle.style.width = '24px';
                handle.style.height = '24px';
                handle.style.zIndex = '1000';
                handle.style.pointerEvents = isInteractiveResizableFB || activeTopToolRef.current === 'editor' ? 'auto' : 'none';
                handle.style.boxSizing = 'border-box';
                handle.style.overflow = 'visible';

                let pathD = '';
                if (name === 'nw') {
                  pathD = `M ${arm} 0 L 0 0 L 0 ${arm}`;
                } else if (name === 'ne') {
                  pathD = `M -${arm} 0 L 0 0 L 0 ${arm}`;
                } else if (name === 'se') {
                  pathD = `M -${arm} 0 L 0 0 L 0 -${arm}`;
                } else if (name === 'sw') {
                  pathD = `M ${arm} 0 L 0 0 L 0 -${arm}`;
                }

                handle.innerHTML = `
                  <svg width="24" height="24" viewBox="-12 -12 24 24" style="position: absolute; left: 0; top: 0; width: 24px; height: 24px; overflow: visible; pointer-events: none;">
                    <path d="${pathD}" fill="none" stroke="${handleBorderColor}" stroke-width="${barThickness}" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                `;
              }

              handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / (zoom / 100)).toFixed(3)}) translate(-50%, -50%)`;
            } else {
              const targetStyle = `corner-${handleSize}-${handleBorderColor}`;
              if (handle.dataset.styled !== targetStyle) {
                handle.dataset.styled = targetStyle;
                if (handle.hasChildNodes()) handle.innerHTML = '';
                handle.style.backgroundColor = '#FFFFFF';
                handle.style.border = `1.5px solid ${handleBorderColor}`;
                handle.style.boxShadow = 'none';
                handle.style.borderRadius = '50%';
                handle.style.pointerEvents = 'auto';
                handle.style.boxSizing = 'border-box';
                handle.style.zIndex = isLine ? '2147483647' : '1000';
                handle.style.width = `${handleSize}px`;
                handle.style.height = `${handleSize}px`;
              }

              handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / (zoom / 100)).toFixed(3)}) translate(-50%, -50%)`;
            }
            handle.style.cursor = (isInteractiveResizableFB || activeTopToolRef.current === 'editor') ? getRotatingCursor(name, rotation) : 'default';
          });

          if (!isLine && cornersMap) {
            createOrUpdateEdgeHandles({
              htmlOverlay,
              targetId: el.id,
              cornersMap,
              rotation,
              zoomScale: zoom / 100,
              show: showSideHandlesFB
            });
          }

          const allowRotate = !isLine && (
            (activeTopToolRef.current !== 'interaction' && activeTopToolRef.current !== 'animation') ||
            isFreeFrame
          );
          if (allowRotate) {
            const cx = (cornersMap.nw.x + cornersMap.se.x) / 2;
            const cy = (cornersMap.nw.y + cornersMap.se.y) / 2;
            createOrUpdateRotateHandle({
              handleId: `rotate-handle-${el.id}`,
              htmlOverlay,
              cx,
              cy,
              cornersMap,
              rotation,
              zoomScale: zoom / 100,
              targetIds: [el.id],
              targetKey: el.id,
              show: false
            });
          } else {
            htmlOverlay?.querySelectorAll(`[id^="rotate-handle-${el.id}"], [id^="rotate-hotspot-${el.id}-"]`).forEach(h => h.remove());
          }
        }

        // ── VIDEO CONTROLS / MOVE TOGGLE BADGE ──
        const isVideoEl = el.getAttribute('data-type') === 'video' || !!el.querySelector('video, iframe');
        if (isVideoEl && (type === 'selected' || type === 'child-selected') && htmlOverlay) {
          const isInteractive = el.getAttribute('data-video-interactive') === 'true';
          const toggleId = `video-mode-toggle-${el.id}`;
          let toggleBtn = htmlOverlay.querySelector(`[id="${toggleId}"]`);
          if (!toggleBtn) {
            toggleBtn = document.createElement('div');
            toggleBtn.id = toggleId;
            htmlOverlay.appendChild(toggleBtn);
          }

          toggleBtn.className = `video-mode-toggle absolute flex items-center gap-1.5 px-3 py-1 rounded-full text-white shadow-lg text-xs font-semibold cursor-pointer select-none transition-all pointer-events-auto ${
            isInteractive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }`;
          toggleBtn.style.zIndex = '2147483647';
          toggleBtn.style.left = `${mapped[1].x}px`;
          toggleBtn.style.top = `${mapped[1].y - (28 / (zoom / 100))}px`;
          toggleBtn.style.transform = `translate(-100%, 0) scale(${1 / (zoom / 100)})`;
          toggleBtn.style.transformOrigin = 'bottom right';

          if (isInteractive) {
            toggleBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Controls Active (Click to Move/Scale)</span>
            `;
          } else {
            toggleBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="22" y2="22"></line>
              </svg>
              <span>Move / Scale Mode (Click to Play Video)</span>
            `;
          }

          const handleToggleAction = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const newInteractive = el.getAttribute('data-video-interactive') !== 'true';
            el.setAttribute('data-video-interactive', newInteractive ? 'true' : 'false');

            const iframe = el.querySelector('iframe');
            if (iframe) {
              iframe.style.setProperty('pointer-events', newInteractive ? 'auto' : 'none', 'important');
            }
            const video = el.querySelector('video');
            if (video) {
              video.style.setProperty('pointer-events', newInteractive ? 'auto' : 'none', 'important');
            }
            drawOverlayHighlight(el, 'selected');
          };

          toggleBtn.onpointerdown = handleToggleAction;
          toggleBtn.onmousedown = handleToggleAction;
          toggleBtn.onclick = handleToggleAction;
        }

        // ── INTERACTION BADGE ──
        if (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') {
          drawInteractionBadge(el, mapped, htmlOverlay, zoom / 100, bbox);
        }
      }
    } catch { /* ignored */ }
  };

  return { drawOverlayHighlight };
};
