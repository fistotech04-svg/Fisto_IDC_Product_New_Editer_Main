import { getRotatingCursor, createOrUpdateEdgeHandles } from './overlayDomUtils';

/**
 * Renders Figma-style resize handles:
 * - Corner circular handles (or hollow L-brackets for interaction/frames)
 * - Side edge pills (horizontal/vertical)
 * - Line endpoints
 */
export const renderResizeHandles = ({
  htmlOverlay,
  targetId,
  cornersMap,
  rotation = 0,
  zoomScale = 1,
  type = 'selected',
  isBlackSelection = false,
  isInteractiveResizable = false,
  isLCorner = false,
  showSideHandles = true,
  isLine = false,
  mapped = null,
  activeTopTool = 'editor',
  onCornerHover = null
}) => {
  if (!htmlOverlay) return;

  const handleSize = 8.5;
  const handleBorderColor = isBlackSelection ? '#000000' : '#5255CA';

  let handleNames, allPts;

  if (isLine && mapped) {
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
    const handleId = `resize-handle-${targetId}-${name}`;
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

    handle.className = `resize-handle overlay-type-${type} absolute`;

    if (isSide) {
      const targetStyle = isBlackSelection
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

        if (isBlackSelection) {
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
    } else if (!isLine && isLCorner) {
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
        handle.style.pointerEvents = isInteractiveResizable || activeTopTool === 'editor' ? 'auto' : 'none';
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
        handle.style.zIndex = isLine ? '2147483647' : '1000';
        handle.style.width = `${handleSize}px`;
        handle.style.height = `${handleSize}px`;
      }

      handle.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${rotation.toFixed(1)}deg) scale(${(1 / zoomScale).toFixed(3)}) translate(-50%, -50%)`;
    }

    if (!isSide && typeof onCornerHover === 'function') {
      handle.onpointerenter = () => onCornerHover(name);
    }

    handle.style.cursor = (isInteractiveResizable || activeTopTool === 'editor') ? getRotatingCursor(name, rotation) : 'default';
  });

  if (!isLine && cornersMap) {
    createOrUpdateEdgeHandles({
      htmlOverlay,
      targetId,
      cornersMap,
      rotation,
      zoomScale,
      show: showSideHandles
    });
  }
};
