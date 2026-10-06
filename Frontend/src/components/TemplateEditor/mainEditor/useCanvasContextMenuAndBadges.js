import { useEffect } from 'react';
import { getTopLevelFrames, getDirectChildFrames, hitTest } from './frameHierarchyUtils';

/**
 * Hook managing canvas right-click context menu, selection restoration,
 * free frame selection attributes, and interaction badge icons/ticks.
 */
export const useCanvasContextMenuAndBadges = ({
  activeTopTool,
  isConvertedFlipbook,
  currentFrameIdRef,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  pages = [],
  drawOverlayHighlight,
  setActiveMainTool,
  setSelectedShapeTool,
  selectedShapeTool
}) => {
  const handleSvgContextMenu = (pageIndex, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeTopTool === 'interaction' || activeTopTool === 'animation' || isConvertedFlipbook) {
      return;
    }

    const container = e.currentTarget.closest('.page-svg-container');
    const svg = container?.querySelector('svg');
    if (!svg) return;

    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'svg') {
      return;
    }

    const frameId = currentFrameIdRef?.current;
    let layerId = null;

    if (frameId) {
      const frameEl = svg.querySelector(`[id="${frameId}"]`);
      if (frameEl && hitTest(frameEl, e.clientX, e.clientY)) {
        const children = getDirectChildFrames(frameEl);
        for (let i = children.length - 1; i >= 0; i--) {
          if (hitTest(children[i], e.clientX, e.clientY)) {
            layerId = children[i].id;
            break;
          }
        }
        if (!layerId) layerId = frameId;
      }
    } else {
      const topLevelEls = getTopLevelFrames(svg);
      for (let i = topLevelEls.length - 1; i >= 0; i--) {
        if (hitTest(topLevelEls[i], e.clientX, e.clientY)) {
          layerId = topLevelEls[i].id;
          break;
        }
      }
    }

    if (!layerId) {
      const target = e.target.closest('[id]');
      if (target && target.id && target.id !== 'main-svg-root') {
        layerId = target.id;
      }
    }

    if (!layerId) return;

    const layerEl = svg.querySelector(`[id="${layerId}"]`);
    const isOverlay = layerEl ? layerEl.getAttribute('data-name') === 'Overlay' : false;

    if (!multiSelectedIds.has(layerId)) {
      if (setSelectedLayerId) setSelectedLayerId(layerId);
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([layerId]));
    }

    window.dispatchEvent(new CustomEvent('show-layer-context-menu', {
      detail: { e, layerId, pageIndex, isOverlay }
    }));
  };

  // Sync free frame attributes
  useEffect(() => {
    document.querySelectorAll('rect[data-name="Free Frame"][data-selected-frame="true"]').forEach(el => {
      el.removeAttribute('data-selected-frame');
    });
    multiSelectedIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getAttribute('data-name') === 'Free Frame') {
        el.setAttribute('data-selected-frame', 'true');
      }
    });
  }, [multiSelectedIds]);

  // Listen for Figma-style Undo/Redo instant selection rebind
  useEffect(() => {
    const handleRebindSelection = (e) => {
      const { layerId } = e.detail || {};
      const targetId = layerId || selectedLayerId;
      if (!targetId) return;
      const el = document.getElementById(targetId);
      if (el && typeof drawOverlayHighlight === 'function') {
        drawOverlayHighlight(el, 'selected');
      }
    };
    window.addEventListener('rebind-selection-overlay', handleRebindSelection);
    return () => window.removeEventListener('rebind-selection-overlay', handleRebindSelection);
  }, [selectedLayerId, drawOverlayHighlight]);

  // Automatically restore/redraw selection overlay on page/selection changes
  useEffect(() => {
    if (!selectedLayerId && (!multiSelectedIds || multiSelectedIds.size === 0)) return;

    const timer = setTimeout(() => {
      if (selectedLayerId) {
        const el = document.getElementById(selectedLayerId);
        if (el && typeof drawOverlayHighlight === 'function') {
          drawOverlayHighlight(el, 'selected');
        }
      }
      if (multiSelectedIds && multiSelectedIds.size > 1) {
        multiSelectedIds.forEach(id => {
          const el = document.getElementById(id);
          if (el && typeof drawOverlayHighlight === 'function') {
            drawOverlayHighlight(el, 'multi-child-selected');
          }
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pages, selectedLayerId, multiSelectedIds, drawOverlayHighlight]);

  // Listen for interaction badge icon update events
  useEffect(() => {
    const handleBadgeUpdate = (e) => {
      const { elementId, actionType } = e.detail || {};
      if (!elementId) return;

      const badge = document.getElementById(`interaction-badge-${elementId}`);
      if (!badge) return;

      const mainBox = badge.querySelector('[data-badge-mainbox]');
      if (!mainBox) return;

      if (!actionType) {
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 7.99791H6.176C4.679 7.99791 3.93 7.99791 3.466 7.55791C3 7.12091 3 6.41391 3 5.00091C3 3.58791 3 2.88091 3.465 2.44291C3.93 2.00391 4.679 2.00391 6.176 2.00391H17.823C19.321 2.00391 20.07 2.00391 20.535 2.44291C21 2.88191 21 3.58691 21 4.99991C21 6.41291 21 7.11991 20.535 7.55891C20.07 7.99791 19.321 7.99791 17.823 7.99791H16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7.42375 17.5184L6.54475 16.3864L5.42475 14.9414C4.98275 14.3964 4.90275 13.7304 5.18275 13.1414C5.28206 12.9339 5.43587 12.7573 5.62775 12.6304C6.24475 12.2234 7.09575 12.1744 7.62775 12.7114L9.59875 14.3894V6.63744C9.59875 5.77444 10.4187 5.02344 11.3447 5.02344C12.2707 5.02344 13.0967 5.77444 13.0967 6.63744V10.7274C14.6217 10.6054 17.0677 11.1684 18.5117 12.2754C19.7727 13.2404 20.5777 13.7774 19.5257 16.9554C19.1997 17.9384 18.3847 19.2914 18.2527 19.6734C18.1217 20.0534 17.9817 20.2804 18.0317 21.9934M6.54475 16.3864C6.81275 16.7104 7.08375 17.0884 7.42375 17.5184M9.52975 21.9994V21.0534C9.60275 19.8904 8.54675 18.9574 7.42375 17.5184M7.42375 17.5184C7.34275 17.4144 7.49975 17.6154 7.42375 17.5184ZM7.42375 17.5184L8.53075 18.8724" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        const plusBadge = document.createElement('div');
        plusBadge.setAttribute('data-badge-plus', 'true');
        plusBadge.className = 'absolute -top-1 -right-1 flex items-center justify-center';
        plusBadge.style.width = '0.75vw';
        plusBadge.style.height = '0.75vw';
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
              <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
          </svg>
        `;
        mainBox.appendChild(plusBadge);
        badge.querySelectorAll('[data-badge-tick]').forEach(t => t.remove());
        return;
      }

      const [prefix, iconName] = actionType.icon.split(':');
      const iconUrl = `https://api.iconify.design/${prefix}/${iconName}.svg?color=white&width=16&height=16`;
      mainBox.innerHTML = `<img src="${iconUrl}" alt="${actionType.label}" style="width:1vw;height:1vw;min-width:12px;min-height:12px;display:block;" />`;
      mainBox.style.position = 'relative';
      mainBox.style.overflow = 'visible';

      badge.querySelectorAll('[data-badge-plus]').forEach(p => p.remove());
      badge.querySelectorAll('[data-badge-tick]').forEach(t => t.remove());

      const tick = document.createElement('div');
      tick.setAttribute('data-badge-tick', 'true');
      tick.style.cssText = [
        'position:absolute',
        'top:-6px',
        'right:-6px',
        'width:13px',
        'height:13px',
        'background:#22C55E',
        'border-radius:50%',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:20',
        'border:1.5px solid #ffffff',
        'box-shadow:0 1px 3px rgba(0,0,0,0.3)',
        'pointer-events:none'
      ].join(';');
      tick.innerHTML = `<svg viewBox="0 0 24 24" fill="none" style="width:7px;height:7px;"><polyline points="20 6 9 17 4 12" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      mainBox.appendChild(tick);
    };
    window.addEventListener('update-interaction-badge', handleBadgeUpdate);
    return () => window.removeEventListener('update-interaction-badge', handleBadgeUpdate);
  }, []);

  // Listen for force selection box update
  useEffect(() => {
    const handleForceUpdateSelection = (e) => {
      const { elementId } = e.detail || {};
      if (!elementId) return;
      const el = document.getElementById(elementId);
      if (el) {
        setTimeout(() => {
          if (drawOverlayHighlight) drawOverlayHighlight(el, 'selected');

          const overlay = document.getElementById('highlight-overlay') || el.ownerSVGElement?.nextElementSibling;
          if (overlay) {
            const hoverPoly = overlay.querySelector(`[id="overlay-poly-hover-${el.id}"]`);
            if (hoverPoly && drawOverlayHighlight) {
              drawOverlayHighlight(el, 'hover');
            }
            const childHoverPoly = overlay.querySelector(`[id="overlay-poly-child-hover-${el.id}"]`);
            if (childHoverPoly && drawOverlayHighlight) {
              drawOverlayHighlight(el, 'child-hover');
            }
          }
        }, 10);
      }
    };
    window.addEventListener('force-update-selection-box', handleForceUpdateSelection);
    return () => window.removeEventListener('force-update-selection-box', handleForceUpdateSelection);
  }, [drawOverlayHighlight]);

  // Listen for add-free-frame to start drawing
  useEffect(() => {
    const handleAddFreeFrame = (e) => {
      if (e.detail && e.detail.pageIndex !== undefined && !e.detail.elementId) {
        if (setActiveMainTool) setActiveMainTool('shapes');
        if (setSelectedShapeTool) setSelectedShapeTool('free-frame');
      }
    };
    window.addEventListener('add-free-frame', handleAddFreeFrame);
    return () => window.removeEventListener('add-free-frame', handleAddFreeFrame);
  }, [setActiveMainTool, setSelectedShapeTool]);

  // Reset selectedShapeTool from 'free-frame' to default when leaving interaction mode
  useEffect(() => {
    if (activeTopTool !== 'interaction' && selectedShapeTool === 'free-frame') {
      if (setSelectedShapeTool) setSelectedShapeTool('rectangle');
    }
  }, [activeTopTool, selectedShapeTool, setSelectedShapeTool]);

  return {
    handleSvgContextMenu
  };
};

export default useCanvasContextMenuAndBadges;
