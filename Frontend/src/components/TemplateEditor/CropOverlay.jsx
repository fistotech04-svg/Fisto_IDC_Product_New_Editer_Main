import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getVisualBBox } from './MainEditor';

const CropOverlay = ({ src, initialCrop, onCancel, onDone, targetElement, activePageIndex }) => {
  const [crop, setCrop] = useState(() => {
    try {
      if (typeof initialCrop === 'string') {
        const parsed = JSON.parse(initialCrop);
        if (parsed) return parsed;
      }
      if (initialCrop) return initialCrop;
    } catch (e) { }
    return { left: 0, top: 0, width: 100, height: 100 };
  });
  const cropRef = useRef(crop);
  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: null });
  const [dragType, setDragType] = useState(null);
  const [overlayRect, setOverlayRect] = useState(null);

  useEffect(() => {
    if (!targetElement) return;

    const updateRect = () => {
      let rect;

      const isSvgEl = targetElement instanceof SVGElement && targetElement.tagName.toLowerCase() !== 'svg';
      if (isSvgEl) {
        try {
          const bbox = getVisualBBox(targetElement);
          const svg = targetElement.ownerSVGElement;

          if (svg && bbox.width > 0) {
            const matrix = targetElement.getScreenCTM();
            if (matrix) {
              const pt1 = svg.createSVGPoint();
              pt1.x = bbox.x; pt1.y = bbox.y;
              const pt2 = svg.createSVGPoint();
              pt2.x = bbox.x + bbox.width; pt2.y = bbox.y + bbox.height;

              const screenPt1 = pt1.matrixTransform(matrix);
              const screenPt2 = pt2.matrixTransform(matrix);

              const cropStr = targetElement.getAttribute('data-crop-data');
              let cropOffX = 0, cropOffY = 0, cropL = 0, cropT = 0, cropW = 100, cropH = 100;
              if (cropStr && cropStr !== 'null') {
                try {
                  const crop = JSON.parse(cropStr);
                  cropOffX = (parseFloat(crop.offX) || 0) / 100;
                  cropOffY = (parseFloat(crop.offY) || 0) / 100;
                  cropL = parseFloat(crop.left) / 100;
                  cropT = parseFloat(crop.top) / 100;
                  cropW = parseFloat(crop.width) / 100;
                  cropH = parseFloat(crop.height) / 100;
                } catch (e) { }
              }

              const rawWidth = Math.abs(screenPt2.x - screenPt1.x);
              const rawHeight = Math.abs(screenPt2.y - screenPt1.y);

              if (cropStr && cropStr !== 'null') {
                rect = {
                  left: Math.min(screenPt1.x, screenPt2.x) - (cropOffX * rawWidth),
                  top: Math.min(screenPt1.y, screenPt2.y) - (cropOffY * rawHeight),
                  width: rawWidth,
                  height: rawHeight
                };
              } else {
                rect = {
                  left: Math.min(screenPt1.x, screenPt2.x),
                  top: Math.min(screenPt1.y, screenPt2.y),
                  width: Math.abs(screenPt2.x - screenPt1.x),
                  height: Math.abs(screenPt2.y - screenPt1.y)
                };
              }
            }
          }
        } catch (e) {
          console.error("Error calculating visual bounds for crop overlay", e);
        }
      }

      if (!rect) {
        rect = targetElement.getBoundingClientRect();
      }

      let fullW = rect.width;
      let fullH = rect.height;
      let fullL = rect.left;
      let fullT = rect.top;

      try {
        if (initialCrop) {
          const cropData = typeof initialCrop === 'string' ? JSON.parse(initialCrop) : initialCrop;
          if (cropData && cropData.width && cropData.height) {
            fullW = rect.width / (cropData.width / 100);
            fullH = rect.height / (cropData.height / 100);
            fullL = rect.left - (cropData.left / 100) * fullW;
            fullT = rect.top - (cropData.top / 100) * fullH;
          }
        }
      } catch (e) { }

      setOverlayRect(prev => {
        if (prev && prev.left === fullL && prev.top === fullT && prev.width === fullW && prev.height === fullH) {
          return prev; // Avoid unnecessary re-renders
        }
        return {
          left: fullL,
          top: fullT,
          width: fullW,
          height: fullH,
        };
      });
    };

    let animationFrameId;
    let lastRectStr = '';

    const tick = () => {
      try {
        const currentRect = targetElement.getBoundingClientRect();
        const rectStr = `${currentRect.left},${currentRect.top},${currentRect.width},${currentRect.height}`;
        if (rectStr !== lastRectStr) {
          lastRectStr = rectStr;
          updateRect();
        }
      } catch (e) { }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetElement, initialCrop]);

  // Handle clicking outside to apply crop
  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      // Don't close if they are interacting with the right sidebar or header
      if (e.target.closest('.right-sidebar') || e.target.closest('.top-header')) return;

      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onDone(cropRef.current);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onDone(cropRef.current);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Control') onDone(cropRef.current);
    };

    // Add with a small delay so the opening click doesn't trigger it immediately
    const timeout = setTimeout(() => {
      document.addEventListener('pointerdown', handleGlobalPointerDown);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [onCancel, onDone]);

  const handlePointerDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / container.width) * 100;
    const dy = ((e.clientY - dragStart.y) / container.height) * 100;

    let newCrop = { ...dragStart.crop };

    if (dragType === 'pan') {
      const origImgWidth = container.width;
      const origImgHeight = container.height;
      const panDx = ((e.clientX - dragStart.x) / origImgWidth) * 100;
      const panDy = ((e.clientY - dragStart.y) / origImgHeight) * 100;

      newCrop.offX = (dragStart.crop.offX || 0) + panDx;
      newCrop.offY = (dragStart.crop.offY || 0) + panDy;
      if (newCrop.offX > newCrop.left) newCrop.offX = newCrop.left;
      if (newCrop.offX < newCrop.left + newCrop.width - 100) newCrop.offX = newCrop.left + newCrop.width - 100;
      if (newCrop.offY > newCrop.top) newCrop.offY = newCrop.top;
      if (newCrop.offY < newCrop.top + newCrop.height - 100) newCrop.offY = newCrop.top + newCrop.height - 100;
    } else {
      if (dragType === 'move') {
        newCrop.left += dx;
        newCrop.top += dy;
      } else {
        if (dragType.includes('w')) { newCrop.left += dx; newCrop.width -= dx; }
        if (dragType.includes('e')) { newCrop.width += dx; }
        if (dragType.includes('n')) { newCrop.top += dy; newCrop.height -= dy; }
        if (dragType.includes('s')) { newCrop.height += dy; }
      }

      if (newCrop.left < 0) { newCrop.width += newCrop.left; newCrop.left = 0; }
      if (newCrop.top < 0) { newCrop.height += newCrop.top; newCrop.top = 0; }
      if (newCrop.left + newCrop.width > 100) { newCrop.width = 100 - newCrop.left; }
      if (newCrop.top + newCrop.height > 100) { newCrop.height = 100 - newCrop.top; }
    }

    newCrop.width = Math.max(5, newCrop.width);
    newCrop.height = Math.max(5, newCrop.height);

    if (dragType.includes('w') && newCrop.left > dragStart.crop.left + dragStart.crop.width - 5) {
      newCrop.left = dragStart.crop.left + dragStart.crop.width - 5;
    }
    if (dragType.includes('n') && newCrop.top > dragStart.crop.top + dragStart.crop.height - 5) {
      newCrop.top = dragStart.crop.top + dragStart.crop.height - 5;
    }

    setCrop(newCrop);
  }, [isDragging, dragStart, dragType]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  if (!overlayRect) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[100000] select-none"
      style={{
        left: `${overlayRect.left}px`,
        top: `${overlayRect.top}px`,
        width: `${overlayRect.width}px`,
        height: `${overlayRect.height}px`,
      }}
      onPointerDown={(e) => {
        if (e.target === containerRef.current || e.target.tagName?.toLowerCase() === 'img') {
          handlePointerDown(e, 'pan');
        }
      }}
    >
      <img src={src} alt="To crop" className="w-full h-full block opacity-40 pointer-events-none" style={{ transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%)` }} draggable={false} />
      <div className="absolute inset-0 pointer-events-none" style={{
        clipPath: `inset(${crop.top}% ${100 - crop.left - crop.width}% ${100 - crop.top - crop.height}% ${crop.left}%)`
      }}>
        <img src={src} className="absolute inset-0 w-full h-full block pointer-events-none" style={{
          transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%)`
        }} draggable={false} />
      </div>

      <div
        className="absolute border border-white/80 cursor-move shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        style={{
          left: `${crop.left}%`,
          top: `${crop.top}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/30 pointer-events-none">
          <div className="border-r border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-r border-b border-white/30"></div>
          <div className="border-b border-white/30"></div>
          <div className="border-r border-white/30"></div>
          <div className="border-r border-white/30"></div>
          <div></div>
        </div>
        {/* NW Corner */}
        <div className="absolute -left-[2px] -top-[2px] w-5 h-5 border-t-[4px] border-l-[4px] border-indigo-600 drop-shadow-md cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'nw')} />
        <div className="absolute left-5 right-5 -top-2 h-4 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 'n')} />

        {/* NE Corner */}
        <div className="absolute -right-[2px] -top-[2px] w-5 h-5 border-t-[4px] border-r-[4px] border-indigo-600 drop-shadow-md cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'ne')} />
        <div className="absolute top-5 bottom-5 -right-2 w-4 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'e')} />

        {/* SE Corner */}
        <div className="absolute -right-[2px] -bottom-[2px] w-5 h-5 border-b-[4px] border-r-[4px] border-indigo-600 drop-shadow-md cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'se')} />
        <div className="absolute left-5 right-5 -bottom-2 h-4 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 's')} />

        {/* SW Corner */}
        <div className="absolute -left-[2px] -bottom-[2px] w-5 h-5 border-b-[4px] border-l-[4px] border-indigo-600 drop-shadow-md cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'sw')} />
        <div className="absolute top-5 bottom-5 -left-2 w-4 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'w')} />
      </div>
    </div>,
    document.body
  );
};

export default CropOverlay;
