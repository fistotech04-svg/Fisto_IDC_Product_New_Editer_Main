import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CropOverlay = ({ src, initialCrop, onCancel, onDone }) => {
  const [crop, setCrop] = useState(() => {
    try {
      if (typeof initialCrop === 'string') return JSON.parse(initialCrop);
      if (initialCrop) return initialCrop;
    } catch (e) { }
    return { left: 0, top: 0, width: 100, height: 100 };
  });
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: null });
  const [dragType, setDragType] = useState(null);

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

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl flex flex-col w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">Crop Image</h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={() => onDone(crop)} className="px-4 py-1.5 bg-[#4D47FF] text-white text-sm font-medium rounded-lg hover:bg-[#3b35db] transition-colors">Done</button>
          </div>
        </div>
        <div className="p-8 flex-1 overflow-auto flex items-center justify-center bg-gray-100 min-h-[400px] max-h-[70vh]">
          <div ref={containerRef} className="relative inline-block select-none shadow-lg max-h-[60vh]">
            <img src={src} alt="To crop" className="max-h-[60vh] max-w-full block opacity-40 pointer-events-none" draggable={false} />
            <img src={src} className="absolute inset-0 max-h-[60vh] max-w-full block pointer-events-none" style={{
              clipPath: `inset(${crop.top}% ${100 - crop.left - crop.width}% ${100 - crop.top - crop.height}% ${crop.left}%)`
            }} draggable={false} />
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
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-[#4D47FF] border-[1.5px] border-white rounded-full cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'nw')} />
              <div className="absolute left-1.5 right-1.5 -top-1.5 h-3 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 'n')} />
              <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-[#4D47FF] border-[1.5px] border-white rounded-full cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'ne')} />
              <div className="absolute top-1.5 bottom-1.5 -right-1.5 w-3 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'e')} />
              <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-[#4D47FF] border-[1.5px] border-white rounded-full cursor-nwse-resize" onPointerDown={(e) => handlePointerDown(e, 'se')} />
              <div className="absolute left-1.5 right-1.5 -bottom-1.5 h-3 cursor-ns-resize" onPointerDown={(e) => handlePointerDown(e, 's')} />
              <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-[#4D47FF] border-[1.5px] border-white rounded-full cursor-nesw-resize" onPointerDown={(e) => handlePointerDown(e, 'sw')} />
              <div className="absolute top-1.5 bottom-1.5 -left-1.5 w-3 cursor-ew-resize" onPointerDown={(e) => handlePointerDown(e, 'w')} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CropOverlay;
