import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const CropOverlay = ({ src, initialCrop, targetElement, activePageIndex, onCancel, onDone, underlyingFit }) => {
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
  const [pageRect, setPageRect] = useState(null);

  useEffect(() => {
    if (!targetElement) return;

    const updateRect = () => {
      let fullL, fullT, fullW, fullH;

      const isSvgEl = targetElement instanceof SVGElement && targetElement.tagName.toLowerCase() !== 'svg';
      if (isSvgEl) {
        try {
          const svg = targetElement.ownerSVGElement;
          if (svg) {
            const matrix = targetElement.getScreenCTM();
            if (matrix) {
              // Always use the FULL (un-cropped) bbox so the overlay covers the entire image
              let bboxX = 0, bboxY = 0, bboxW = 0, bboxH = 0;

              // Prefer stored original dimensions (set when crop was first applied)
              if (targetElement.hasAttribute('data-crop-orig-w')) {
                bboxW = parseFloat(targetElement.getAttribute('data-crop-orig-w')) || 0;
                bboxH = parseFloat(targetElement.getAttribute('data-crop-orig-h')) || 0;
                bboxX = parseFloat(targetElement.getAttribute('data-crop-orig-x')) || 0;
                bboxY = parseFloat(targetElement.getAttribute('data-crop-orig-y')) || 0;
              } else {
                // Check inner image element for orig dims
                const innerImg = targetElement.querySelector('image[data-crop-orig-w]');
                if (innerImg) {
                  bboxW = parseFloat(innerImg.getAttribute('data-crop-orig-w')) || 0;
                  bboxH = parseFloat(innerImg.getAttribute('data-crop-orig-h')) || 0;
                  bboxX = parseFloat(innerImg.getAttribute('data-crop-orig-x')) || 0;
                  bboxY = parseFloat(innerImg.getAttribute('data-crop-orig-y')) || 0;
                }
              }

              // Fallback: temporarily remove clip-path so getBBox gives the real full bounds
              if (bboxW <= 0 || bboxH <= 0) {
                const savedClipStyle = targetElement.style.clipPath;
                const savedClipAttr = targetElement.getAttribute('clip-path');
                targetElement.style.removeProperty('clip-path');
                targetElement.removeAttribute('clip-path');
                try {
                  const bb = targetElement.getBBox();
                  bboxW = bb.width; bboxH = bb.height;
                  bboxX = bb.x; bboxY = bb.y;
                } catch (e) { }
                // Restore clip
                if (savedClipStyle) targetElement.style.setProperty('clip-path', savedClipStyle, 'important');
                if (savedClipAttr) targetElement.setAttribute('clip-path', savedClipAttr);
              }

              if (bboxW > 0 && bboxH > 0) {
                const pt1 = svg.createSVGPoint();
                pt1.x = bboxX; pt1.y = bboxY;
                const pt2 = svg.createSVGPoint();
                pt2.x = bboxX + bboxW; pt2.y = bboxY + bboxH;

                const screenPt1 = pt1.matrixTransform(matrix);
                const screenPt2 = pt2.matrixTransform(matrix);

                fullL = Math.min(screenPt1.x, screenPt2.x);
                fullT = Math.min(screenPt1.y, screenPt2.y);
                fullW = Math.abs(screenPt2.x - screenPt1.x);
                fullH = Math.abs(screenPt2.y - screenPt1.y);
              }
            }
          }
        } catch (e) {
          console.error("Error calculating visual bounds for crop overlay", e);
        }
      }

      // Fallback to getBoundingClientRect for HTML elements
      if (!fullW || fullW <= 0) {
        const rect = targetElement.getBoundingClientRect();
        fullL = rect.left;
        fullT = rect.top;
        fullW = rect.width;
        fullH = rect.height;

        // For HTML elements that may have been visually cropped with background-image sizing
        if (initialCrop && !(targetElement instanceof SVGElement)) {
          try {
            const cropData = typeof initialCrop === 'string' ? JSON.parse(initialCrop) : initialCrop;
            if (cropData && cropData.width && cropData.height && cropData.width < 100) {
              fullW = rect.width / (cropData.width / 100);
              fullH = rect.height / (cropData.height / 100);
              fullL = rect.left - (cropData.left / 100) * fullW;
              fullT = rect.top - (cropData.top / 100) * fullH;
            }
          } catch (e) { }
        }
      }

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
    let lastPageRectStr = '';

    const tick = () => {
      try {
        const currentRect = targetElement.getBoundingClientRect();
        const rectStr = `${currentRect.left},${currentRect.top},${currentRect.width},${currentRect.height}`;

        const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const pRect = pageContainer ? pageContainer.getBoundingClientRect() : null;
        const pRectStr = pRect ? `${pRect.left},${pRect.top},${pRect.width},${pRect.height}` : '';

        if (rectStr !== lastRectStr || pRectStr !== lastPageRectStr) {
          lastRectStr = rectStr;
          lastPageRectStr = pRectStr;
          updateRect();
          
          if (pRect) {
            setPageRect({
              left: pRect.left,
              top: pRect.top,
              width: pRect.width,
              height: pRect.height,
              bottom: pRect.bottom,
              right: pRect.right
            });
          }
        }
      } catch (e) { }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetElement, initialCrop, activePageIndex]);

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
      // Only close on plain Ctrl release — not Ctrl+Z, Ctrl+S, etc.
      if (e.key === 'Control' && !e.shiftKey && !e.altKey) onDone(cropRef.current);
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

    let newCrop = { ...dragStart.crop };

    if (dragType === 'pan') {
      const origImgWidth = container.width;
      const origImgHeight = container.height;
      const panDx = ((e.clientX - dragStart.x) / origImgWidth) * 100;
      const panDy = ((e.clientY - dragStart.y) / origImgHeight) * 100;

      const scale = dragStart.crop.scale || 1;
      let nextOffX = (dragStart.crop.offX || 0) + panDx;
      let nextOffY = (dragStart.crop.offY || 0) + panDy;

      newCrop.offX = nextOffX;
      newCrop.offY = nextOffY;
    } else {
      if (dragType === 'move') {
        const dx = ((e.clientX - dragStart.x) / container.width) * 100;
        const dy = ((e.clientY - dragStart.y) / container.height) * 100;
        newCrop.left += dx;
        newCrop.top += dy;
      } else {
        const dx = ((e.clientX - dragStart.x) / container.width) * 100;
        const dy = ((e.clientY - dragStart.y) / container.height) * 100;
        const aspect = dragStart.crop.width / dragStart.crop.height;
        const useDx = Math.abs(dx) > Math.abs(dy * aspect);

        if (dragType === 'se') {
          if (useDx) {
            newCrop.width += dx;
            newCrop.height = newCrop.width / aspect;
          } else {
            newCrop.height += dy;
            newCrop.width = newCrop.height * aspect;
          }
        } else if (dragType === 'sw') {
          if (useDx) {
            newCrop.left += dx;
            newCrop.width -= dx;
            newCrop.height = newCrop.width / aspect;
          } else {
            newCrop.height += dy;
            newCrop.width = newCrop.height * aspect;
            newCrop.left = dragStart.crop.left + dragStart.crop.width - newCrop.width;
          }
        } else if (dragType === 'ne') {
          if (useDx) {
            newCrop.width += dx;
            newCrop.height = newCrop.width / aspect;
            newCrop.top = dragStart.crop.top + dragStart.crop.height - newCrop.height;
          } else {
            newCrop.top += dy;
            newCrop.height -= dy;
            newCrop.width = newCrop.height * aspect;
          }
        } else if (dragType === 'nw') {
          if (useDx) {
            newCrop.left += dx;
            newCrop.width -= dx;
            newCrop.height = newCrop.width / aspect;
            newCrop.top = dragStart.crop.top + dragStart.crop.height - newCrop.height;
          } else {
            newCrop.top += dy;
            newCrop.height -= dy;
            newCrop.width = newCrop.height * aspect;
            newCrop.left = dragStart.crop.left + dragStart.crop.width - newCrop.width;
          }
        }
      }

      if (newCrop.left < 0) { newCrop.width += newCrop.left; newCrop.left = 0; }
      if (newCrop.top < 0) { newCrop.height += newCrop.top; newCrop.top = 0; }
      if (newCrop.left + newCrop.width > 100) { newCrop.width = 100 - newCrop.left; }
      if (newCrop.top + newCrop.height > 100) { newCrop.height = 100 - newCrop.top; }
    }

    newCrop.width = Math.max(5, newCrop.width);
    newCrop.height = Math.max(5, newCrop.height);

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

  const clipPathStyle = useMemo(() => {
    if (!pageRect || !overlayRect) return undefined;
    const insetTop = pageRect.top - overlayRect.top;
    const insetRight = (overlayRect.left + overlayRect.width) - pageRect.right;
    const insetBottom = (overlayRect.top + overlayRect.height) - pageRect.bottom;
    const insetLeft = pageRect.left - overlayRect.left;
    return `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`;
  }, [pageRect, overlayRect]);

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
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
        setCrop(prev => {
          const newScale = Math.max(1, Math.min(10, (prev.scale || 1) + zoomDelta));
          let nextOffX = prev.offX || 0;
          let nextOffY = prev.offY || 0;

          return { ...prev, scale: newScale, offX: nextOffX, offY: nextOffY };
        });
      }}
    >
      {/* Wrapper clipped to the page boundary */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clipPathStyle }}>
        {/* Full image at full brightness — serves as the "inside crop" layer */}
        <img
          src={src}
          alt="To crop"
          className={`w-full h-full block pointer-events-none ${underlyingFit === 'Fill' ? 'object-cover' : underlyingFit === 'Fit' || underlyingFit === 'Original' ? 'object-contain' : ''}`}
          style={{ transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%) scale(${crop.scale || 1})`, transformOrigin: '50% 50%' }}
          draggable={false}
        />
        {/* Dark mask over the OUTER (non-crop) region — punches out to show image inside crop box */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))
              content-box
            `,
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%,
              0% 0%,
              ${crop.left}% ${crop.top}%,
              ${crop.left}% ${crop.top + crop.height}%,
              ${crop.left + crop.width}% ${crop.top + crop.height}%,
              ${crop.left + crop.width}% ${crop.top}%,
              ${crop.left}% ${crop.top}%,
              0% 0%
            )`,
          }}
        />
        {/* Bright image clipped strictly to the crop selection — appears above the dark mask */}
        <div className="absolute inset-0 pointer-events-none" style={{
          clipPath: `inset(${crop.top}% ${100 - crop.left - crop.width}% ${100 - crop.top - crop.height}% ${crop.left}%)`
        }}>
          <img
            src={src}
            className={`absolute inset-0 w-full h-full block pointer-events-none ${underlyingFit === 'Fill' ? 'object-cover' : underlyingFit === 'Fit' || underlyingFit === 'Original' ? 'object-contain' : ''}`}
            style={{
              transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%) scale(${crop.scale || 1})`,
              transformOrigin: '50% 50%',
            }}
            draggable={false}
          />
        </div>
      </div>

      <div
        className="absolute border border-white/80 cursor-move shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        style={{
          left: `${crop.left}%`,
          top: `${crop.top}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'pan')}
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

        {/* NE Corner */}
        <div className="absolute -right-[2px] -top-[2px] w-5 h-5 border-t-[4px] border-r-[4px] border-indigo-600 drop-shadow-md cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'ne')} />

        {/* SE Corner */}
        <div className="absolute -right-[2px] -bottom-[2px] w-5 h-5 border-b-[4px] border-r-[4px] border-indigo-600 drop-shadow-md cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'se')} />

        {/* SW Corner */}
        <div className="absolute -left-[2px] -bottom-[2px] w-5 h-5 border-b-[4px] border-l-[4px] border-indigo-600 drop-shadow-md cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'sw')} />
      </div>
    </div>,
    document.body
  );
};

export default CropOverlay;
