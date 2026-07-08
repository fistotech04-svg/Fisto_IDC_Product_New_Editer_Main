import React, { useEffect, useRef } from 'react';

const CanvasRuler = ({
  zoom,
  pan,
  baseCanvasWidth,
  baseCanvasHeight,
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

  useEffect(() => {
    let currentPan = pan;

    const draw = () => {
      const hCanvas = horizontalCanvasRef.current;
      const vCanvas = verticalCanvasRef.current;
      const { width: containerWidth, height: containerHeight } = dimensions;
      if (!hCanvas || !vCanvas || !containerWidth || !containerHeight) return;

      const dpr = window.devicePixelRatio || 1;
      
      // Only resize if dimensions changed to avoid flickering, but we must clear it
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

      const scale = zoom / 100;
      
      const startX = (containerWidth / 2) + currentPan.x - ((baseCanvasWidth * scale) / 2);
      const startY = (containerHeight / 2) + currentPan.y - ((baseCanvasHeight * scale) / 2);

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

      let step = 100; 
      if (scale > 3) step = 10;
      else if (scale > 1.5) step = 20;
      else if (scale > 0.8) step = 50;
      else if (scale > 0.4) step = 100;
      else if (scale > 0.2) step = 250;
      else step = 500;

      hCtx.font = '9px Inter, sans-serif';
      hCtx.fillStyle = textColor;
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'top';

      vCtx.font = '9px Inter, sans-serif';
      vCtx.fillStyle = textColor;
      vCtx.textAlign = 'center';
      vCtx.textBaseline = 'middle';

      const drawHTick = (val, isMajor) => {
        const x = startX + val * scale;
        if (x < thickness || x > containerWidth) return;

        hCtx.beginPath();
        hCtx.moveTo(x, thickness);
        hCtx.lineTo(x, thickness - (isMajor ? 12 : 5));
        hCtx.strokeStyle = isMajor ? tickColorMajor : tickColor;
        hCtx.stroke();

        if (isMajor) hCtx.fillText(val, x, 2);
      };

      const drawVTick = (val, isMajor) => {
        const y = startY + val * scale;
        if (y < thickness || y > containerHeight) return;

        vCtx.beginPath();
        vCtx.moveTo(thickness, y);
        vCtx.lineTo(thickness - (isMajor ? 12 : 5), y);
        vCtx.strokeStyle = isMajor ? tickColorMajor : tickColor;
        vCtx.stroke();

        if (isMajor) {
          vCtx.save();
          vCtx.translate(6, y);
          vCtx.rotate(-Math.PI / 2);
          vCtx.fillText(val, 0, 0);
          vCtx.restore();
        }
      };

      const minValX = Math.floor((0 - startX) / scale / step) * step;
      const maxValX = Math.ceil((containerWidth - startX) / scale / step) * step;

      for (let val = minValX; val <= maxValX; val += step) {
        drawHTick(val, true);
        for (let i = 1; i <= 9; i++) drawHTick(val + i * (step / 10), false);
      }

      const minValY = Math.floor((0 - startY) / scale / step) * step;
      const maxValY = Math.ceil((containerHeight - startY) / scale / step) * step;

      for (let val = minValY; val <= maxValY; val += step) {
        drawVTick(val, true);
        for (let i = 1; i <= 9; i++) drawVTick(val + i * (step / 10), false);
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

    draw();

    const handlePanUpdate = (e) => {
      currentPan = e.detail;
      draw();
    };

    window.addEventListener('editor-pan-update', handlePanUpdate);
    return () => window.removeEventListener('editor-pan-update', handlePanUpdate);
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
