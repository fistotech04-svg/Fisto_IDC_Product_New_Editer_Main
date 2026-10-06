import { useEffect, useCallback } from 'react';

const calculateFitZoom = (containerWidth, containerHeight, baseWidth, baseHeight) => {
  const padding = window.innerWidth * 0.01;
  const arrowSpace = window.innerWidth * 0.08;

  const availWidth = Math.max(100, containerWidth - (padding * 2) - arrowSpace);
  const availHeight = Math.max(100, containerHeight - (padding * 2));

  const baseVhHeight = window.innerHeight * 0.78;
  const totalWidth = baseWidth || 210;
  const totalHeight = baseHeight || 297;

  const baseCanvasHeight = baseVhHeight;
  const baseCanvasWidth = baseCanvasHeight * (totalWidth / totalHeight);

  const scaleX = availWidth / baseCanvasWidth;
  const scaleY = availHeight / baseCanvasHeight;

  let autoZoom = Math.min(scaleX, scaleY) * 90;
  return Math.max(55, Math.min(250, Math.round(autoZoom)));
};

/**
 * Hook to manage smooth canvas zooming, panning, auto-fit to container,
 * mouse wheel zoom gestures, and window resize listeners.
 */
export const useCanvasZoomPan = ({
  zoom,
  setZoom,
  pan,
  setPan,
  baseWidth,
  baseHeight,
  activePageIndex,
  pagesCount = 1,
  editorContainerRef,
  zoomContainerRef,
  currentZoomRef,
  currentPanRef,
  wheelRafRef,
  lastWheelTimeRef,
  suppressClickRef
}) => {
  const handleZoomIn = () => {
    const currentP = currentPanRef.current || pan || { x: 0, y: 0 };
    setZoom(prev => {
      const current = currentZoomRef.current || prev || 100;
      const nextZoom = Math.min(Math.round(current * 1.15), 500);
      currentZoomRef.current = nextZoom;
      if (zoomContainerRef.current) {
        zoomContainerRef.current.style.transition = 'transform 0.15s ease-out';
        zoomContainerRef.current.style.transform = `translate(${currentP.x}px, ${currentP.y}px) scale(${nextZoom / 100})`;
      }
      return nextZoom;
    });
  };

  const handleZoomOut = () => {
    const currentP = currentPanRef.current || pan || { x: 0, y: 0 };
    setZoom(prev => {
      const current = currentZoomRef.current || prev || 100;
      const nextZoom = Math.max(Math.round(current / 1.15), 10);
      currentZoomRef.current = nextZoom;
      if (zoomContainerRef.current) {
        zoomContainerRef.current.style.transition = 'transform 0.15s ease-out';
        zoomContainerRef.current.style.transform = `translate(${currentP.x}px, ${currentP.y}px) scale(${nextZoom / 100})`;
      }
      return nextZoom;
    });
  };

  const handleAutoFitZoom = useCallback(() => {
    if (!editorContainerRef.current) return;

    const container = editorContainerRef.current;
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    if (containerWidth < 300 || containerHeight < 200) {
      setTimeout(() => {
        if (editorContainerRef.current) {
          const rect = editorContainerRef.current.getBoundingClientRect();
          if (rect.width >= 300 && rect.height >= 200) {
            setZoom(calculateFitZoom(rect.width, rect.height, baseWidth, baseHeight));
          }
        }
      }, 100);
      return;
    }

    setZoom(calculateFitZoom(containerWidth, containerHeight, baseWidth, baseHeight));
  }, [baseWidth, baseHeight, editorContainerRef, setZoom]);

  const handleResetZoom = () => {
    handleAutoFitZoom();
    setPan({ x: 0, y: 0 });
  };

  // Auto-fit zoom on mount and dimension/page change
  useEffect(() => {
    handleAutoFitZoom();
    const t1 = setTimeout(handleAutoFitZoom, 100);
    const t2 = setTimeout(handleAutoFitZoom, 350);
    const t3 = setTimeout(handleAutoFitZoom, 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activePageIndex, pagesCount, baseWidth, baseHeight, handleAutoFitZoom]);

  // Sync pan & zoom tracking refs
  useEffect(() => {
    currentPanRef.current = pan;
  }, [pan, currentPanRef]);

  useEffect(() => {
    currentZoomRef.current = zoom;
  }, [zoom, currentZoomRef]);

  // Maintain fit on window/container resize
  useEffect(() => {
    if (!editorContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      handleAutoFitZoom();
    });
    observer.observe(editorContainerRef.current);
    return () => observer.disconnect();
  }, [handleAutoFitZoom, editorContainerRef]);

  // Mouse wheel zoom gesture listener
  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.target.closest('.editor-ss-overlay') || e.target.closest('input')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();

        lastWheelTimeRef.current = Date.now();
        suppressClickRef.current = true;
        setTimeout(() => { suppressClickRef.current = false; }, 200);

        const containerEl = zoomContainerRef.current;
        if (!containerEl) return;

        const currentZoom = currentZoomRef.current || zoom || 100;
        const currentPan = currentPanRef.current || pan || { x: 0, y: 0 };
        const minZ = 10;
        const maxZ = 500;

        let factor;
        if (Math.abs(e.deltaY) >= 40) {
          factor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
        } else {
          factor = Math.exp(-e.deltaY * 0.005);
        }

        let newZoom = Math.round(currentZoom * factor * 10) / 10;
        newZoom = Math.min(Math.max(newZoom, minZ), maxZ);

        if (Math.abs(newZoom - currentZoom) < 0.01) return;

        const currentScale = currentZoom / 100;
        const newScale = newZoom / 100;

        const editorRect = el.getBoundingClientRect();
        const centerScreenX = editorRect.left + editorRect.width / 2 + currentPan.x;
        const centerScreenY = editorRect.top + editorRect.height / 2 + currentPan.y;

        const mouseOffsetX = e.clientX - centerScreenX;
        const mouseOffsetY = e.clientY - centerScreenY;

        const scaleRatio = newScale / currentScale;
        const newPanX = currentPan.x + mouseOffsetX * (1 - scaleRatio);
        const newPanY = currentPan.y + mouseOffsetY * (1 - scaleRatio);

        const newPan = { x: newPanX, y: newPanY };

        currentZoomRef.current = newZoom;
        currentPanRef.current = newPan;

        containerEl.style.transition = 'none';
        containerEl.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${newScale})`;

        if (wheelRafRef.current) {
          cancelAnimationFrame(wheelRafRef.current);
        }
        wheelRafRef.current = requestAnimationFrame(() => {
          setZoom(newZoom);
          setPan(newPan);
        });

        window.dispatchEvent(new CustomEvent('editor-pan-update', { detail: newPan }));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', handleWheel, { capture: true });
      if (wheelRafRef.current) {
        cancelAnimationFrame(wheelRafRef.current);
      }
    };
  }, [currentPanRef, currentZoomRef, editorContainerRef, lastWheelTimeRef, pan, setPan, setZoom, suppressClickRef, wheelRafRef, zoom, zoomContainerRef]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleAutoFitZoom,
    handleResetZoom
  };
};
