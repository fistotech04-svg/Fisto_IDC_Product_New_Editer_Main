import React, { useEffect, useRef } from 'react';

const CanvasRuler = ({
  zoom,
  pan,
  baseCanvasWidth,
  baseCanvasHeight,
  baseLogicalWidth,
  baseLogicalHeight,
  thickness = 20
}) => {
  const horizontalCanvasRef = useRef(null);
  const verticalCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const currentPanRef = useRef(pan);
  const currentZoomRef = useRef(zoom);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // A helper to draw with the current interpolated zoom and pan
    const draw = (renderZoom, renderPan) => {
      const hCanvas = horizontalCanvasRef.current;
      const vCanvas = verticalCanvasRef.current;
      const { width: containerWidth, height: containerHeight } = dimensions;
      if (!hCanvas || !vCanvas || !containerWidth || !containerHeight) return;

      const dpr = window.devicePixelRatio || 1;
      
      // Only resize if dimensions changed to avoid flickering
      if (hCanvas.width !== containerWidth * dpr) {
        hCanvas.width = containerWidth * dpr;
        hCanvas.style.width = `${containerWidth}px`;
      }
      if (hCanvas.height !== thickness * dpr) {
        hCanvas.height = thickness * dpr;
        hCanvas.style.height = `${thickness}px`;
      }
      if (vCanvas.width !== thickness * dpr) {
        vCanvas.width = thickness * dpr;
        vCanvas.style.width = `${thickness}px`;
      }
      if (vCanvas.height !== containerHeight * dpr) {
        vCanvas.height = containerHeight * dpr;
        vCanvas.style.height = `${containerHeight}px`;
      }

      const hCtx = hCanvas.getContext('2d');
      const vCtx = vCanvas.getContext('2d');
      
      // Reset transform before clearing
      hCtx.setTransform(1, 0, 0, 1, 0, 0);
      vCtx.setTransform(1, 0, 0, 1, 0, 0);
      
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
      vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);
      
      hCtx.scale(dpr, dpr);
      vCtx.scale(dpr, dpr);

      const scale = renderZoom / 100;
      
      const startX = (containerWidth / 2) + renderPan.x - ((baseCanvasWidth * scale) / 2);
      const startY = (containerHeight / 2) + renderPan.y - ((baseCanvasHeight * scale) / 2);

      const bgColor = '#ffffff';
      const textColor = '#6b7280';
      const tickColor = '#d1d5db';
      const tickColorMajor = '#9ca3af';

      hCtx.fillStyle = bgColor;
      hCtx.fillRect(0, 0, containerWidth, thickness);
      hCtx.fillStyle = tickColor;
      hCtx.fillRect(0, thickness - 1, containerWidth, 1);

      vCtx.fillStyle = bgColor;
      vCtx.fillRect(0, 0, thickness, containerHeight);
      vCtx.fillStyle = tickColor;
      vCtx.fillRect(thickness - 1, 0, 1, containerHeight);

      // Map viewport pixels directly to millimeters
      const viewportToMmX = (baseLogicalWidth || baseCanvasWidth) / baseCanvasWidth;
      const viewportToMmY = (baseLogicalHeight || baseCanvasHeight) / baseCanvasHeight;

      const visualScaleX = scale * (1 / viewportToMmX);
      const visualScaleY = scale * (1 / viewportToMmY);

      const getStepMm = (vScale) => {
        if (vScale > 20) return 5;
        if (vScale > 10) return 10;
        if (vScale > 4) return 20;
        if (vScale > 1.5) return 50;
        if (vScale > 0.5) return 100;
        if (vScale > 0.2) return 250;
        return 500;
      };

      const stepMmX = getStepMm(visualScaleX);
      const stepMmY = getStepMm(visualScaleY);

      hCtx.font = '8px Inter, sans-serif';
      hCtx.fillStyle = textColor;
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'top';

      vCtx.font = '8px Inter, sans-serif';
      vCtx.fillStyle = textColor;
      vCtx.textAlign = 'center';
      vCtx.textBaseline = 'middle';

      const drawHTick = (val, isMajor, labelVal) => {
        const x = startX + val * scale;
        if (x < thickness || x > containerWidth) return;

        hCtx.beginPath();
        hCtx.moveTo(x, thickness);
        hCtx.lineTo(x, thickness - (isMajor ? 12 : 5));
        hCtx.strokeStyle = isMajor ? tickColorMajor : tickColor;
        hCtx.stroke();

        if (isMajor && labelVal !== undefined) hCtx.fillText(labelVal, x, 2);
      };

      const drawVTick = (val, isMajor, labelVal) => {
        const y = startY + val * scale;
        if (y < thickness || y > containerHeight) return;

        vCtx.beginPath();
        vCtx.moveTo(thickness, y);
        vCtx.lineTo(thickness - (isMajor ? 12 : 5), y);
        vCtx.strokeStyle = isMajor ? tickColorMajor : tickColor;
        vCtx.stroke();

        if (isMajor && labelVal !== undefined) {
          vCtx.save();
          vCtx.translate(6, y);
          vCtx.rotate(-Math.PI / 2);
          vCtx.fillText(labelVal, 0, 0);
          vCtx.restore();
        }
      };

      const minValXMm = Math.floor((0 - startX) / scale * viewportToMmX / stepMmX) * stepMmX;
      const maxValXMm = Math.ceil((containerWidth - startX) / scale * viewportToMmX / stepMmX) * stepMmX;

      for (let mmVal = minValXMm; mmVal <= maxValXMm; mmVal += stepMmX) {
        const viewportVal = mmVal / viewportToMmX;
        drawHTick(viewportVal, true, mmVal);
        for (let i = 1; i <= 9; i++) drawHTick((mmVal + i * (stepMmX / 10)) / viewportToMmX, false);
      }

      const minValYMm = Math.floor((0 - startY) / scale * viewportToMmY / stepMmY) * stepMmY;
      const maxValYMm = Math.ceil((containerHeight - startY) / scale * viewportToMmY / stepMmY) * stepMmY;

      for (let mmVal = minValYMm; mmVal <= maxValYMm; mmVal += stepMmY) {
        const viewportVal = mmVal / viewportToMmY;
        drawVTick(viewportVal, true, mmVal);
        for (let i = 1; i <= 9; i++) drawVTick((mmVal + i * (stepMmY / 10)) / viewportToMmY, false);
      }

      hCtx.fillStyle = '#f3f4f6';
      hCtx.fillRect(0, 0, thickness, thickness);
      hCtx.fillStyle = tickColor;
      hCtx.fillRect(thickness - 1, 0, 1, thickness);
      hCtx.fillRect(0, thickness - 1, thickness, 1);
      
      hCtx.fillStyle = '#9ca3af';
      hCtx.beginPath();
      hCtx.arc(thickness / 2, thickness / 2, 2, 0, Math.PI * 2);
      hCtx.fill();
    };

    // ── ANIMATION LOGIC ──
    const startZoom = currentZoomRef.current;
    const startPan = currentPanRef.current;
    const targetZoom = zoom;
    const targetPan = pan;

    const zoomDiff = targetZoom - startZoom;
    const panDiffX = targetPan.x - startPan.x;
    const panDiffY = targetPan.y - startPan.y;

    if (Math.abs(zoomDiff) < 0.1 && Math.abs(panDiffX) < 1 && Math.abs(panDiffY) < 1) {
      currentZoomRef.current = targetZoom;
      currentPanRef.current = targetPan;
      draw(targetZoom, targetPan);
    } else {
      const duration = 300; // Match Tailwind's duration-300
      const startTime = performance.now();

      const ease = (t) => t * (2 - t); // easeOutQuad

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      const step = (time) => {
        let elapsed = time - startTime;
        if (elapsed > duration) elapsed = duration;

        const progress = elapsed / duration;
        const easedT = ease(progress);

        const nowZoom = startZoom + zoomDiff * easedT;
        const nowPan = {
          x: startPan.x + panDiffX * easedT,
          y: startPan.y + panDiffY * easedT
        };

        currentZoomRef.current = nowZoom;
        currentPanRef.current = nowPan;
        draw(nowZoom, nowPan);

        if (elapsed < duration) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    }

    const handlePanUpdate = (e) => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      currentPanRef.current = e.detail;
      draw(currentZoomRef.current, currentPanRef.current);
    };

    window.addEventListener('editor-pan-update', handlePanUpdate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('editor-pan-update', handlePanUpdate);
    };
  }, [zoom, pan, baseCanvasWidth, baseCanvasHeight, dimensions, thickness]);

  const handleMouseDown = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('ruler-drag-start', { 
      detail: { type, clientX: e.clientX, clientY: e.clientY } 
    }));
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Horizontal Ruler */}
      <canvas
        ref={horizontalCanvasRef}
        className="absolute top-0 left-0 pointer-events-auto cursor-row-resize"
        style={{ height: thickness }}
        onMouseDown={(e) => handleMouseDown('h', e)}
      />
      {/* Vertical Ruler */}
      <canvas
        ref={verticalCanvasRef}
        className="absolute top-0 left-0 pointer-events-auto cursor-col-resize"
        style={{ width: thickness }}
        onMouseDown={(e) => handleMouseDown('v', e)}
      />
    </div>
  );
};

export default CanvasRuler;
