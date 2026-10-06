import { getElementMatrix } from '../geometryUtils';

// ── Corner-specific rotate double-arrow icons (gg:corner-double-*) ──
export const CORNER_ROTATE_ICONS = {
  // gg:corner-double-left-down (Top-Left / NW)
  nw: `
    <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible; pointer-events:none; color:#111827; transition:color 0.15s ease;">
      <path fill="currentColor" d="m21.299 7.76l-5.019 4.88l-1.394-1.434l2.436-2.368l-6.02.015a2.4 2.4 0 0 0-2.394 2.406l.014 5.9l2.268-2.256l1.41 1.418l-4.962 4.937l-4.937-4.962l1.418-1.41L6.522 17.3l-.014-6.036a4.8 4.8 0 0 1 4.788-4.812l5.928-.014l-2.238-2.303l1.433-1.394z"/>
    </svg>
  `,
  // gg:corner-double-right-down (Top-Right / NE)
  ne: `
    <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible; pointer-events:none; color:#111827; transition:color 0.15s ease;">
      <path fill="currentColor" d="m7.694 12.705l-5.056-4.84l4.84-5.057L8.923 4.19L6.566 6.653L12.6 6.49a4.8 4.8 0 0 1 4.927 4.669l.16 5.926l2.246-2.294l1.43 1.4l-4.9 5l-5-4.898l1.4-1.429l2.427 2.378l-.162-6.018a2.4 2.4 0 0 0-2.463-2.335l-5.898.158l2.31 2.212z"/>
    </svg>
  `,
  // gg:corner-double-down-left (Bottom-Right / SE)
  se: `
    <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible; pointer-events:none; color:#111827; transition:color 0.15s ease;">
      <path fill="currentColor" d="m11.295 7.694l4.84-5.056l5.057 4.84l-1.383 1.445l-2.462-2.357l.162 6.034a4.8 4.8 0 0 1-4.67 4.927l-5.925.16l2.294 2.246l-1.4 1.43l-5-4.9l4.898-5l1.429 1.4l-2.377 2.427l6.017-.162a2.4 2.4 0 0 0 2.335-2.463l-.158-5.898l-2.212 2.31z"/>
    </svg>
  `,
  // gg:corner-double-down-right (Bottom-Left / SW)
  sw: `
    <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible; pointer-events:none; color:#111827; transition:color 0.15s ease;">
      <path fill="currentColor" d="M12.6 7.68L7.638 2.741L2.701 7.704l1.418 1.41L6.522 6.7l-.014 6.036a4.8 4.8 0 0 0 4.788 4.812l5.928.014l-2.238 2.303l1.433 1.394l4.88-5.019l-5.019-4.88l-1.394 1.434l2.436 2.369l-6.02-.015a2.4 2.4 0 0 1-2.394-2.406l.014-5.9l2.268 2.256z"/>
    </svg>
  `
};

// ── External-only corner hover hotspots (placed strictly OUTSIDE each corner quadrant) ──
export const HOTSPOT_TRANSLATIONS = {
  nw: { x: '-100%', y: '-100%' },
  ne: { x: '0%', y: '-100%' },
  se: { x: '0%', y: '0%' },
  sw: { x: '-100%', y: '0%' }
};

/**
 * Creates the interactive rotation overlay engine.
 * Manages corner hover hotspots, rotation handle creation, drag-rotation interaction,
 * degree snapping, live rotation degree badge, and dispatching to handleRotateRef.
 */
export const createRotationOverlayEngine = ({
  activeTopToolRef,
  activeRotateCornersRef,
  isRotatingRef,
  handleRotateRef
}) => {
  const createOrUpdateRotateHandle = ({
    handleId,
    htmlOverlay,
    cx,
    cy,
    cornersMap, // { nw: pt, ne: pt, se: pt, sw: pt }
    rotation = 0,
    zoomScale = 1,
    targetIds = [],
    targetKey = 'default',
    show = false
  }) => {
    if (!htmlOverlay || !cornersMap) return;
    if (activeTopToolRef.current === 'interaction' || activeTopToolRef.current === 'animation') {
      const targetEl = targetIds[0] ? document.getElementById(targetIds[0]) : document.getElementById(targetKey);
      const isFreeFrame = targetEl?.getAttribute('data-name')?.toLowerCase() === 'free frame' || targetEl?.getAttribute('data-type') === 'free-frame' || targetEl?.id?.startsWith('free-frame');
      if (!isFreeFrame) {
        const staleUI = htmlOverlay.querySelectorAll(`[id^="rotate-handle-${targetKey}"], [id^="rotate-hotspot-${targetKey}"]`);
        staleUI.forEach(el => el.remove());
        return;
      }
    }

    const activeCorner = activeRotateCornersRef.current[targetKey] || 'sw';
    const cornerPt = cornersMap[activeCorner] || cornersMap.sw;
    if (!cornerPt) return;

    const spotSize = 34 / zoomScale;

    ['nw', 'ne', 'se', 'sw'].forEach(cName => {
      const cPt = cornersMap[cName];
      if (!cPt) return;
      const spotId = `rotate-hotspot-${targetKey}-${cName}`;
      let spot = htmlOverlay.querySelector(`[id="${spotId}"]`);
      if (!spot) {
        spot = document.createElement('div');
        spot.id = spotId;
        spot.className = 'rotate-hotspot resize-handle absolute';
        spot.style.backgroundColor = 'transparent';
        spot.style.pointerEvents = 'auto';
        spot.style.zIndex = '998';
        spot.style.boxSizing = 'border-box';
        spot.style.left = '0px';
        spot.style.top = '0px';
        spot.style.transformOrigin = '0 0';
        spot.style.willChange = 'transform';
        htmlOverlay.appendChild(spot);
      }
      spot.style.width = `${spotSize}px`;
      spot.style.height = `${spotSize}px`;
      const trans = HOTSPOT_TRANSLATIONS[cName];
      spot.style.transform = `translate3d(${cPt.x}px, ${cPt.y}px, 0) rotate(${rotation}deg) translate(${trans.x}, ${trans.y})`;

      spot.onpointerenter = spot.onpointermove = () => {
        if (!isRotatingRef.current && !document.querySelector('[data-dragging="true"]')) {
          activeRotateCornersRef.current[targetKey] = cName;
          createOrUpdateRotateHandle({
            handleId,
            htmlOverlay,
            cx,
            cy,
            cornersMap,
            rotation,
            zoomScale,
            targetIds,
            targetKey,
            show: true
          });
        }
      };

      spot.onpointerleave = () => {
        if (!isRotatingRef.current && !window.__isRotatingActive) {
          const rh = htmlOverlay.querySelector(`[id="${handleId}"]`);
          setTimeout(() => {
            if (!isRotatingRef.current && !window.__isRotatingActive) {
              const hoveredSpot = htmlOverlay.querySelector('.rotate-hotspot:hover');
              const hoveredHandle = htmlOverlay.querySelector(`[id="${handleId}"]:hover`);
              if (!hoveredSpot && !hoveredHandle && rh) {
                rh.style.display = 'none';
              }
            }
          }, 60);
        }
      };
    });

    let rotHandle = htmlOverlay.querySelector(`[id="${handleId}"]`);
    if (!rotHandle) {
      rotHandle = document.createElement('div');
      rotHandle.id = handleId;
      rotHandle.className = 'rotate-handle resize-handle absolute flex items-center justify-center select-none';
      rotHandle.title = 'Drag to rotate (Shift to snap)';
      rotHandle.style.width = '18px';
      rotHandle.style.height = '18px';
      rotHandle.style.backgroundColor = 'transparent';
      rotHandle.style.border = 'none';
      rotHandle.style.boxShadow = 'none';
      rotHandle.style.cursor = 'grab';
      rotHandle.style.pointerEvents = 'auto';
      rotHandle.style.zIndex = '1005';
      rotHandle.style.boxSizing = 'border-box';
      rotHandle.style.left = '0px';
      rotHandle.style.top = '0px';
      rotHandle.style.transformOrigin = '0 0';
      rotHandle.style.willChange = 'transform';
      rotHandle.style.transition = 'none';

      rotHandle.addEventListener('mouseenter', () => {
        const svg = rotHandle.querySelector('svg');
        if (svg) svg.style.color = '#5255CA';
      });
      rotHandle.addEventListener('mouseleave', () => {
        if (!isRotatingRef.current && !window.__isRotatingActive) {
          const svg = rotHandle.querySelector('svg');
          if (svg) svg.style.color = '#111827';
          setTimeout(() => {
            if (!isRotatingRef.current && !window.__isRotatingActive) {
              const hoveredSpot = htmlOverlay.querySelector('.rotate-hotspot:hover');
              const hoveredHandle = htmlOverlay.querySelector(`[id="${handleId}"]:hover`);
              if (!hoveredSpot && !hoveredHandle) {
                rotHandle.style.display = 'none';
              }
            }
          }, 60);
        }
      });

      htmlOverlay.appendChild(rotHandle);
    }

    // Always set icon matching active corner if changed
    if (rotHandle.dataset.activeCorner !== activeCorner) {
      rotHandle.innerHTML = CORNER_ROTATE_ICONS[activeCorner] || CORNER_ROTATE_ICONS.sw;
      rotHandle.dataset.activeCorner = activeCorner;
    }

    // Position outside the active corner
    const dx = cornerPt.x - cx;
    const dy = cornerPt.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const offset = 14.5 / zoomScale;
    const rotX = (cornerPt.x + (dx / dist) * offset).toFixed(2);
    const rotY = (cornerPt.y + (dy / dist) * offset).toFixed(2);
    const iconRotation = rotation;

    rotHandle.style.left = '0px';
    rotHandle.style.top = '0px';
    rotHandle.style.transformOrigin = '0 0';
    rotHandle.style.transition = 'none';
    rotHandle.style.transform = `translate3d(${rotX}px, ${rotY}px, 0) rotate(${iconRotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;

    // Only show when actively hovered outside corner or actively rotating
    if (show || isRotatingRef.current || window.__isRotatingActive) {
      rotHandle.style.display = 'flex';
    } else {
      rotHandle.style.display = 'none';
    }

    if (isRotatingRef.current || window.__isRotatingActive) return;

    // Clean up any stale degree badge if not currently rotating
    if (!isRotatingRef.current) {
      const existingBadge = htmlOverlay.querySelector(`[id="rotation-degree-badge-${targetKey}"]`);
      if (existingBadge) existingBadge.remove();
    }

    // Drag rotation handler
    rotHandle.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isRotatingRef.current = true;
      window.__isRotatingActive = true;

      const overlayRect = htmlOverlay.getBoundingClientRect();
      let centerScreenX = overlayRect.left + cx * zoomScale;
      let centerScreenY = overlayRect.top + cy * zoomScale;
      const pageContainer = htmlOverlay.closest('.page-svg-container');
      const overlaySvg = pageContainer ? pageContainer.querySelector('svg[id^="highlight-overlay-"]') : null;
      if (overlaySvg && typeof overlaySvg.getScreenCTM === 'function') {
        const oCtm = overlaySvg.getScreenCTM();
        if (oCtm) {
          const sPt = new DOMPoint(cx, cy).matrixTransform(oCtm);
          centerScreenX = sPt.x;
          centerScreenY = sPt.y;
        }
      }

      const startPointerAngle = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX) * (180 / Math.PI);

      const isMulti = targetIds && targetIds.length > 1;
      let startAngle = Math.round(rotation || 0);
      if (!isMulti && targetIds[0]) {
        const firstEl = document.getElementById(targetIds[0]);
        if (firstEl) {
          const matrix = getElementMatrix(firstEl);
          const isFlipH = firstEl.getAttribute('data-flip-h') === 'true';
          const isFlipV = firstEl.getAttribute('data-flip-v') === 'true';
          let rawAngle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
          if (isFlipH && !isFlipV) {
            rawAngle = Math.round(Math.atan2(-matrix.b, -matrix.a) * (180 / Math.PI));
          }
          startAngle = ((rawAngle % 360) + 360) % 360;
        }
      }

      const prevCursor = document.body.style.cursor;
      document.body.style.cursor = 'grabbing';
      rotHandle.style.cursor = 'grabbing';
      const svg = rotHandle.querySelector('svg');
      if (svg) svg.style.color = '#5255CA';

      // ── Show rotation degree badge ONLY when user starts rotating ──
      const badgeId = `rotation-degree-badge-${targetKey}`;
      let degBadge = htmlOverlay.querySelector(`[id="${badgeId}"]`);
      if (!degBadge) {
        degBadge = document.createElement('div');
        degBadge.id = badgeId;
        degBadge.className = 'corner-value-badge absolute select-none';
        degBadge.style.position = 'absolute';
        degBadge.style.zIndex = '2147483647';
        degBadge.style.backgroundColor = '#111827';
        degBadge.style.color = '#FFFFFF';
        degBadge.style.fontSize = '10px';
        degBadge.style.fontWeight = '700';
        degBadge.style.padding = '1px 5px';
        degBadge.style.borderRadius = '3px';
        degBadge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)';
        degBadge.style.pointerEvents = 'none';
        degBadge.style.whiteSpace = 'nowrap';
        degBadge.style.border = '1px solid rgba(255,255,255,0.2)';
        htmlOverlay.appendChild(degBadge);
      }
      degBadge.style.display = 'block';

      const cornerDist = Math.hypot(cornerPt.x - cx, cornerPt.y - cy);
      const cornerBaseAngleRad = Math.atan2(cornerPt.y - cy, cornerPt.x - cx);

      const updateBadge = (angle, liveDelta) => {
        let badge = degBadge;
        if (!badge || !badge.isConnected) {
          badge = htmlOverlay.querySelector(`[id="${badgeId}"]`);
          if (!badge) {
            badge = document.createElement('div');
            badge.id = badgeId;
            badge.className = 'corner-value-badge absolute select-none';
            badge.style.position = 'absolute';
            badge.style.zIndex = '2147483647';
            badge.style.backgroundColor = '#111827';
            badge.style.color = '#FFFFFF';
            badge.style.fontSize = '10px';
            badge.style.fontWeight = '700';
            badge.style.padding = '1px 5px';
            badge.style.borderRadius = '3px';
            badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)';
            badge.style.pointerEvents = 'none';
            badge.style.whiteSpace = 'nowrap';
            badge.style.border = '1px solid rgba(255,255,255,0.2)';
            htmlOverlay.appendChild(badge);
          }
          degBadge = badge;
        }
        badge.style.display = 'block';

        const dDeg = liveDelta !== undefined ? liveDelta : (angle - startAngle);
        const deltaAngleRad = dDeg * (Math.PI / 180);
        // Live corner position rotated around (cx, cy)
        const curCornerX = cx + Math.cos(cornerBaseAngleRad + deltaAngleRad) * cornerDist;
        const curCornerY = cy + Math.sin(cornerBaseAngleRad + deltaAngleRad) * cornerDist;

        badge.style.left = '0px';
        badge.style.top = '0px';
        badge.style.transformOrigin = '0 0';
        badge.style.transform = `translate3d(${curCornerX.toFixed(2)}px, ${curCornerY.toFixed(2)}px, 0) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
        badge.innerText = `${((angle % 360) + 360) % 360}°`;

        if (rotHandle) {
          const curRotX = (curCornerX + Math.cos(cornerBaseAngleRad + deltaAngleRad) * offset).toFixed(2);
          const curRotY = (curCornerY + Math.sin(cornerBaseAngleRad + deltaAngleRad) * offset).toFixed(2);
          rotHandle.style.left = '0px';
          rotHandle.style.top = '0px';
          rotHandle.style.transformOrigin = '0 0';
          rotHandle.style.transition = 'none';
          rotHandle.style.transform = `translate3d(${curRotX}px, ${curRotY}px, 0) rotate(${angle.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
        }
      };

      updateBadge(startAngle, 0);

      let lastAngle = startAngle;
      let lastDelta = 0;

      const onPointerMove = (moveEvt) => {
        moveEvt.preventDefault();
        moveEvt.stopPropagation();

        const curPointerAngle = Math.atan2(moveEvt.clientY - centerScreenY, moveEvt.clientX - centerScreenX) * (180 / Math.PI);
        let rawDelta = curPointerAngle - startPointerAngle;
        let newAngle = Math.round(startAngle + rawDelta);
        let delta = rawDelta;

        if (moveEvt.shiftKey) {
          newAngle = Math.round(newAngle / 15) * 15;
          delta = newAngle - startAngle;
        } else {
          const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315];
          for (const sp of snapPoints) {
            if (Math.abs(newAngle - sp) <= 3) {
              newAngle = sp;
              delta = newAngle - startAngle;
              break;
            }
          }
        }
        newAngle = ((newAngle % 360) + 360) % 360;
        lastAngle = newAngle;
        lastDelta = delta;

        updateBadge(newAngle, delta);

        if (handleRotateRef?.current) {
          handleRotateRef.current(newAngle, false, {
            isGroupRotate: isMulti,
            delta,
            centerScreen: { x: centerScreenX, y: centerScreenY }
          });
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove, true);
        window.removeEventListener('pointerup', onPointerUp, true);
        document.body.style.cursor = prevCursor;
        window.__isRotatingActive = false;
        isRotatingRef.current = false;
        if (rotHandle) {
          rotHandle.style.cursor = 'grab';
          const currentSvg = rotHandle.querySelector('svg');
          if (currentSvg) currentSvg.style.color = '#111827';
          rotHandle.style.display = 'none';
        }
        if (degBadge) {
          degBadge.remove();
        }

        if (handleRotateRef?.current) {
          handleRotateRef.current(lastAngle, true, {
            isGroupRotate: isMulti,
            delta: lastDelta,
            centerScreen: { x: centerScreenX, y: centerScreenY }
          });
        }
      };

      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('pointerup', onPointerUp, true);
    };
  };

  return { createOrUpdateRotateHandle };
};
