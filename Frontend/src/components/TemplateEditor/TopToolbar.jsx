import React, { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2, RotateCcw, Plus, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';

const TopToolbar = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  rotation = 0,
  onRotate,
  onFlipH,
  onFlipV,
  hasSelection
}) => {
  const [showRotationOptions, setShowRotationOptions] = useState(false);
  const rotationRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartValue = useRef(0);
  const [localRotation, setLocalRotation] = useState(rotation);

  useEffect(() => {
    setLocalRotation(rotation);
  }, [rotation]);

  const handleRotationChange = (e) => {
    const val = parseInt(e.target.value);
    setLocalRotation(isNaN(val) ? '' : val);
  };

  const handleRotationBlur = () => {
    let val = parseInt(localRotation);
    if (isNaN(val)) val = 0;
    const wrappedVal = ((val % 360) + 360) % 360;
    setLocalRotation(wrappedVal);
    if (onRotate) onRotate(wrappedVal);
  };

  const handleRotationKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRotationBlur();
      e.target.blur();
    }
  };

  const hasMoved = useRef(false);

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Prevent dropdown from closing due to outside click logic
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartValue.current = localRotation || 0;
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      if (Math.abs(deltaX) > 2) {
        hasMoved.current = true;
      }
      
      // 1 pixel drag = 1 degree change
      let newValue = Math.round(dragStartValue.current + deltaX);
      
      // Wrap around logic: ensure it stays in 0-360
      newValue = ((newValue % 360) + 360) % 360;
      
      setLocalRotation(newValue);
      if (onRotate) onRotate(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onRotate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rotationRef.current && !rotationRef.current.contains(event.target)) {
        setShowRotationOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="bg-[#FFFFFF] border-b border-[#EEEEEE] flex items-center justify-between px-[1.5vw] flex-shrink-0 select-none"
      style={{ height: '7vh', width: '100%' }}
    >
      {/* Left Section: History */}
      <div className="flex items-center gap-[1.5vw]">
        <div 
          onClick={canUndo ? onUndo : undefined}
          className={`flex flex-col items-center group ${canUndo ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
        >
          <Undo2 size="1.2vw" className={`text-[#374151] ${canUndo ? 'group-hover:text-black' : ''} transition-colors`} />
          <span className={`text-[0.6vw] text-[#6B7280] font-medium ${canUndo ? 'group-hover:text-black' : ''}`}>Undo</span>
        </div>
        <div 
          onClick={canRedo ? onRedo : undefined}
          className={`flex flex-col items-center group ${canRedo ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
        >
          <Redo2 size="1.2vw" className={`text-[#374151] ${canRedo ? 'group-hover:text-black' : ''} transition-colors`} />
          <span className={`text-[0.6vw] text-[#6B7280] font-medium ${canRedo ? 'group-hover:text-black' : ''}`}>Redo</span>
        </div>
      </div>

      {/* Center Section: Alignment Groups */}
      <div className={`flex items-center gap-[1vw] ${!hasSelection ? 'opacity-30 pointer-events-none' : ''}`}>
        {/* Group 1 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="mdi:format-align-top" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="mdi:format-align-middle" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] bg-white rounded-[0.4vw] cursor-pointer shadow-sm">
            <Icon icon="mdi:format-align-bottom" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>

        {/* Group 2 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-left" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-center" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="line-md:arrow-align-right" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>

        {/* Group 3 */}
        <div className="flex items-center gap-[0.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw]">
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="icon-park-outline:distribute-vertically" width="1.1vw" className="text-[#374151]" />
          </div>
          <div className="p-[0.4vw] hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm">
            <Icon icon="icon-park-outline:distribute-horizontally" width="1.1vw" className="text-[#374151]" />
          </div>
        </div>
      </div>

      {/* Right Section: Zoom & Extra */}
      <div className="flex items-center gap-[1vw]">
        <div className="relative" ref={rotationRef}>
          <div 
            onClick={hasSelection ? () => setShowRotationOptions(!showRotationOptions) : undefined}
            className={`flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw] transition-all ${
              !hasSelection ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            } ${showRotationOptions ? 'ring-1 ring-gray-300 shadow-sm' : ''}`}
          >
            <div className={`p-[0.4vw] rounded-[0.4vw] transition-all ${
              !hasSelection ? '' : 
              showRotationOptions ? 'bg-white shadow-sm text-black' : 'hover:bg-white text-[#374151] hover:text-black'
            }`}>
              <Icon icon="icon-park-outline:rotate" width="1.1vw" height="1.1vw" />
            </div>
          </div>

          {/* Rotation Options Dropdown */}
          {showRotationOptions && hasSelection && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-[3.2vw] bg-[#F3F4F6] p-[0.3vw] rounded-[0.8vw] flex items-center gap-[0.8vw] shadow-lg z-[100] border border-gray-200/50"
            >
              {/* Rotate Tool With Degree Input */}
              <div className="flex items-center bg-white px-[0.6vw] py-[0.3vw] rounded-[0.6vw] gap-[0.3vw] shadow-sm border border-gray-100">
                <div 
                  onMouseDown={handleMouseDown}
                  className="cursor-ew-resize flex items-center justify-center p-[0.2vw] hover:bg-gray-100 rounded-[0.3vw] transition-colors"
                  title="Drag to rotate"
                >
                  <Icon icon="icon-park-outline:rotate" width="0.9vw" height="0.9vw" className="text-gray-500" />
                </div>
                <div className="flex items-center">
                  <input 
                    type="text"
                    value={localRotation}
                    onChange={handleRotationChange}
                    onBlur={handleRotationBlur}
                    onKeyDown={handleRotationKeyDown}
                    className="w-[1.8vw] text-[0.8vw] font-bold text-gray-900 border-none outline-none bg-transparent text-right p-0"
                  />
                  <span 
                    className="text-[0.6vw] font-bold text-gray-500 ml-[0.1vw] select-none"
                  >°</span>
                </div>
              </div>

              {/* Flip Horizontal */}
              <div 
                onClick={(e) => { e.stopPropagation(); onFlipH && onFlipH(); }}
                className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.6vw] cursor-pointer transition-all hover:shadow-sm group"
                title="Flip Horizontal"
              >
                <Icon icon="vaadin:flip-h" width="1.1vw" height="1.1vw" className="text-[#374151] group-hover:text-black" />
              </div>

              {/* Flip Vertical */}
              <div 
                onClick={(e) => { e.stopPropagation(); onFlipV && onFlipV(); }}
                className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.6vw] cursor-pointer transition-all hover:shadow-sm group"
                title="Flip Vertical"
              >
                <Icon icon="vaadin:flip-v" width="1.1vw" height="1.1vw" className="text-[#374151] group-hover:text-black" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-[0.3vw] rounded-[0.6vw] gap-[0.1vw]">
          {/* Zoom Out */}
          <button 
            onClick={onZoomOut}
            className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
          >
            <Minus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Zoom Label */}
          <div className="px-[0.4vw] flex items-center justify-center min-w-[2.2vw]">
            <span className="text-[0.7vw] font-bold text-[#111827]">{zoom}%</span>
          </div>
          
          {/* Zoom In */}
          <button 
            onClick={onZoomIn}
            className="w-[1.9vw] h-[1.9vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm text-[#374151] hover:text-black group"
          >
            <Plus size="0.9vw" strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Vertical Divider */}
          <div className="w-[1px] h-[1vw] bg-gray-300 mx-[0.3vw]"></div>
          
          {/* Reset Action */}
          <button 
            onClick={onReset}
            className="h-[1.9vw] px-[0.7vw] flex items-center justify-center hover:bg-white rounded-[0.4vw] cursor-pointer transition-all hover:shadow-sm group"
          >
            <span className="text-[0.55vw] text-[#6B7280] uppercase font-bold tracking-wider group-hover:text-black transition-colors">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
