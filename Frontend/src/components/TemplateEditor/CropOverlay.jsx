import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const MIN_SIZE = 5; // minimum crop width/height in %

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
  useEffect(() => { cropRef.current = crop; }, [crop]);

  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: null });
  const [dragType, setDragType] = useState(null);
  const [overlayRect, setOverlayRect] = useState(null);
  const [pageRect, setPageRect] = useState(null);

  // ── Measure the full (un-cropped) element rect in screen space ──────────────
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
              let bboxX = 0, bboxY = 0, bboxW = 0, bboxH = 0;

              if (targetElement.hasAttribute('data-crop-orig-w')) {
                bboxW = parseFloat(targetElement.getAttribute('data-crop-orig-w')) || 0;
                bboxH = parseFloat(targetElement.getAttribute('data-crop-orig-h')) || 0;
                bboxX = parseFloat(targetElement.getAttribute('data-crop-orig-x')) || 0;
                bboxY = parseFloat(targetElement.getAttribute('data-crop-orig-y')) || 0;
              } else {
                const innerImg = targetElement.querySelector('image[data-crop-orig-w]');
                if (innerImg) {
                  bboxW = parseFloat(innerImg.getAttribute('data-crop-orig-w')) || 0;
                  bboxH = parseFloat(innerImg.getAttribute('data-crop-orig-h')) || 0;
                  bboxX = parseFloat(innerImg.getAttribute('data-crop-orig-x')) || 0;
                  bboxY = parseFloat(innerImg.getAttribute('data-crop-orig-y')) || 0;
                }
              }

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
                if (savedClipStyle) targetElement.style.setProperty('clip-path', savedClipStyle, 'important');
                if (savedClipAttr) targetElement.setAttribute('clip-path', savedClipAttr);
              }

              if (bboxW > 0 && bboxH > 0) {
                const pt1 = svg.createSVGPoint(); pt1.x = bboxX; pt1.y = bboxY;
                const pt2 = svg.createSVGPoint(); pt2.x = bboxX + bboxW; pt2.y = bboxY + bboxH;
                const s1 = pt1.matrixTransform(matrix);
                const s2 = pt2.matrixTransform(matrix);
                fullL = Math.min(s1.x, s2.x);
                fullT = Math.min(s1.y, s2.y);
                fullW = Math.abs(s2.x - s1.x);
                fullH = Math.abs(s2.y - s1.y);
              }
            }
          }
        } catch (e) {
          console.error('Error calculating visual bounds for crop overlay', e);
        }
      }

      if (!fullW || fullW <= 0) {
        const rect = targetElement.getBoundingClientRect();
        fullL = rect.left; fullT = rect.top; fullW = rect.width; fullH = rect.height;
        if (initialCrop && !(targetElement instanceof SVGElement)) {
          try {
            const cd = typeof initialCrop === 'string' ? JSON.parse(initialCrop) : initialCrop;
            if (cd && cd.width && cd.width < 100) {
              fullW = rect.width / (cd.width / 100);
              fullH = rect.height / (cd.height / 100);
              fullL = rect.left - (cd.left / 100) * fullW;
              fullT = rect.top - (cd.top / 100) * fullH;
            }
          } catch (e) { }
        }
      }

      setOverlayRect(prev => {
        if (prev && prev.left === fullL && prev.top === fullT && prev.width === fullW && prev.height === fullH) return prev;
        return { left: fullL, top: fullT, width: fullW, height: fullH };
      });
    };

    let animationFrameId;
    let lastRectStr = '';
    let lastPageRectStr = '';

    const tick = () => {
      try {
        const r = targetElement.getBoundingClientRect();
        const rectStr = `${r.left},${r.top},${r.width},${r.height}`;
        const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
        const pRect = pageContainer ? pageContainer.getBoundingClientRect() : null;
        const pRectStr = pRect ? `${pRect.left},${pRect.top},${pRect.width},${pRect.height}` : '';

        if (rectStr !== lastRectStr || pRectStr !== lastPageRectStr) {
          lastRectStr = rectStr;
          lastPageRectStr = pRectStr;
          updateRect();
          if (pRect) setPageRect({ left: pRect.left, top: pRect.top, width: pRect.width, height: pRect.height, bottom: pRect.bottom, right: pRect.right });
        }
      } catch (e) { }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetElement, initialCrop, activePageIndex]);

  // ── Close on outside click / keyboard ───────────────────────────────────────
  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      if (e.target.closest('.right-sidebar') || e.target.closest('.top-header')) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) onDone(cropRef.current);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onDone(cropRef.current);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Control' && !e.shiftKey && !e.altKey) onDone(cropRef.current);
    };
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

  // ── Drag start ───────────────────────────────────────────────────────────────
  const handlePointerDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  // ── Drag move — pan image inside crop, per-edge handle resize ─────────────
  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const cw = container.width;
    const ch = container.height;

    const dx = ((e.clientX - dragStart.x) / cw) * 100;
    const dy = ((e.clientY - dragStart.y) / ch) * 100;

    let { left, top, width, height, scale, offX, offY } = dragStart.crop;

    if (dragType === 'pan') {
      // Pan the underlying image inside the crop box — frame stays fixed
      offX = (dragStart.crop.offX || 0) + dx;
      offY = (dragStart.crop.offY || 0) + dy;

    } else {
      // ── Edge / Corner resize — fully independent axes ──
      if (dragType === 'n' || dragType === 'nw' || dragType === 'ne') {
        const newTop = top + dy;
        const newH   = height - dy;
        if (newH >= MIN_SIZE) { top = newTop; height = newH; }
      }
      if (dragType === 's' || dragType === 'sw' || dragType === 'se') {
        const newH = height + dy;
        if (newH >= MIN_SIZE) height = newH;
      }
      if (dragType === 'w' || dragType === 'nw' || dragType === 'sw') {
        const newLeft = left + dx;
        const newW    = width - dx;
        if (newW >= MIN_SIZE) { left = newLeft; width = newW; }
      }
      if (dragType === 'e' || dragType === 'ne' || dragType === 'se') {
        const newW = width + dx;
        if (newW >= MIN_SIZE) width = newW;
      }
    }

    setCrop({ left, top, width, height, scale, offX, offY });
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

  // ── Clip visual to page boundary ────────────────────────────────────────────
  const clipPathStyle = useMemo(() => {
    if (!pageRect || !overlayRect) return undefined;
    const insetTop    = pageRect.top  - overlayRect.top;
    const insetRight  = (overlayRect.left + overlayRect.width)  - pageRect.right;
    const insetBottom = (overlayRect.top  + overlayRect.height) - pageRect.bottom;
    const insetLeft   = pageRect.left - overlayRect.left;
    return `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`;
  }, [pageRect, overlayRect]);

  if (!overlayRect) return null;

  // Clamp display values for the dark mask and bright crop preview
  // (the crop position can be outside 0-100, so we clamp for CSS polygon only)
  const clL = crop.left;
  const clT = crop.top;
  const clR = crop.left + crop.width;
  const clB = crop.top  + crop.height;

  // ── 8-handle cursor map ──────────────────────────────────────────────────────
  const HANDLE_CURSOR = {
    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize',
    w:  'ew-resize',                   e:  'ew-resize',
    sw: 'nesw-resize', s: 'ns-resize', se: 'nwse-resize',
  };

  // Corner L-bracket handle (indigo, 20×20)
  const Corner = ({ pos, style }) => (
    <div
      style={{ position: 'absolute', width: 20, height: 20, cursor: HANDLE_CURSOR[pos], zIndex: 10, ...style }}
      onPointerDown={(e) => handlePointerDown(e, pos)}
    >
      {/* top bar */}
      <div style={{
        position: 'absolute',
        backgroundColor: '#4f46e5',
        width: pos === 'n' || pos === 's' ? '100%' : '100%',
        height: 4,
        top: (pos === 'nw' || pos === 'n' || pos === 'ne') ? 0 : 'auto',
        bottom: (pos === 'sw' || pos === 's' || pos === 'se') ? 0 : 'auto',
        borderRadius: 2,
      }} />
      {/* side bar */}
      <div style={{
        position: 'absolute',
        backgroundColor: '#4f46e5',
        width: 4,
        height: '100%',
        left: (pos === 'nw' || pos === 'w' || pos === 'sw') ? 0 : 'auto',
        right: (pos === 'ne' || pos === 'e' || pos === 'se') ? 0 : 'auto',
        borderRadius: 2,
      }} />
    </div>
  );

  // Edge handle (pill, semi-transparent)
  const Edge = ({ pos, style }) => {
    const isHoriz = pos === 'n' || pos === 's';
    return (
      <div
        style={{
          position: 'absolute',
          cursor: HANDLE_CURSOR[pos],
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        onPointerDown={(e) => handlePointerDown(e, pos)}
      >
        <div style={{
          width:  isHoriz ? 36 : 6,
          height: isHoriz ? 6  : 36,
          backgroundColor: '#4f46e5',
          borderRadius: 4,
          opacity: 0.9,
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }} />
      </div>
    );
  };

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[100000] select-none"
      style={{
        left:   `${overlayRect.left}px`,
        top:    `${overlayRect.top}px`,
        width:  `${overlayRect.width}px`,
        height: `${overlayRect.height}px`,
        // overflow hidden so crop box handles outside the image edge are still visible
        overflow: 'visible',
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
        setCrop(prev => ({
          ...prev,
          scale: Math.max(1, Math.min(10, (prev.scale || 1) + zoomDelta)),
        }));
      }}
    >
      {/* ── Visual layer clipped to page boundary ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clipPathStyle }}>
        {/* Dimmed full image */}
        <img
          src={src}
          alt="To crop"
          className={`w-full h-full block pointer-events-none ${
            underlyingFit === 'Fill' ? 'object-cover' :
            (underlyingFit === 'Fit' || underlyingFit === 'Original') ? 'object-contain' : ''
          }`}
          style={{
            transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%) scale(${crop.scale || 1})`,
            transformOrigin: '50% 50%',
            filter: 'brightness(0.45)',
          }}
          draggable={false}
        />

        {/* Bright crop window */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: `inset(${clT}% ${100 - clL - crop.width}% ${100 - clT - crop.height}% ${clL}%)`
          }}
        >
          <img
            src={src}
            alt=""
            className={`w-full h-full block pointer-events-none ${
              underlyingFit === 'Fill' ? 'object-cover' :
              (underlyingFit === 'Fit' || underlyingFit === 'Original') ? 'object-contain' : ''
            }`}
            style={{
              transform: `translate(${crop.offX || 0}%, ${crop.offY || 0}%) scale(${crop.scale || 1})`,
              transformOrigin: '50% 50%',
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* ── Crop selection box ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left:   `${clL}%`,
          top:    `${clT}%`,
          width:  `${crop.width}%`,
          height: `${crop.height}%`,
          border: '1.5px solid rgba(255,255,255,0.85)',
        cursor: 'grab',
        boxSizing: 'border-box',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'pan')}
      >
        {/* Rule-of-thirds grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr',
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              borderRight:  (i % 3 !== 2) ? '1px solid rgba(255,255,255,0.25)' : 'none',
              borderBottom: (i < 6)       ? '1px solid rgba(255,255,255,0.25)' : 'none',
            }} />
          ))}
        </div>

        {/* ── 4 Corners ── */}
        <Corner pos="nw" style={{ left: -2, top: -2 }} />
        <Corner pos="ne" style={{ right: -2, top: -2 }} />
        <Corner pos="se" style={{ right: -2, bottom: -2 }} />
        <Corner pos="sw" style={{ left: -2, bottom: -2 }} />

        {/* ── 4 Edge handles (top, right, bottom, left) ── */}
        {/* Top */}
        <Edge pos="n" style={{ left: '50%', top: -10, transform: 'translateX(-50%)', width: 44, height: 20 }} />
        {/* Bottom */}
        <Edge pos="s" style={{ left: '50%', bottom: -10, transform: 'translateX(-50%)', width: 44, height: 20 }} />
        {/* Left */}
        <Edge pos="w" style={{ top: '50%', left: -10, transform: 'translateY(-50%)', width: 20, height: 44 }} />
        {/* Right */}
        <Edge pos="e" style={{ top: '50%', right: -10, transform: 'translateY(-50%)', width: 20, height: 44 }} />
      </div>
    </div>,
    document.body
  );
};

export default CropOverlay;