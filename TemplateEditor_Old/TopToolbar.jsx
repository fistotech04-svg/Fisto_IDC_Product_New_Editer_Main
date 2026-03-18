// TopToolbar.jsx - Redesigned with Centered Page Name & Removed Right Controls
import React from 'react';
import {
  RotateCcw, FlipHorizontal, FlipVertical, Edit2, Undo2, Redo2, Minus, Plus
} from 'lucide-react';

const TopToolbar = ({
  pageName,
  isEditingPageName,
  setPageName,
  setIsEditingPageName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  handleZoom,
  onReset,
  onNameSubmit
}) => {
  return (
    <div 
      className="bg-white border-b border-gray-200 flex items-center justify-between px-[1.5vw]"
      style={{ height: '6vh', minHeight: '2.5vw', flexShrink: 0 }}
    >
      {/* Left: Undo/Redo */}

      <div className="flex items-center w-1/4" style={{ gap: '0.5vw' }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center p-[0.3vw] rounded-[0.3vw] transition-colors ${
            canUndo ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <Undo2 size="1vw" />
          <span className="text-[0.7vw] font-semibold">Undo</span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex flex-col items-center p-[0.3vw] rounded-[0.3vw] transition-colors ${
            canRedo ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <Redo2 size="1vw" />
          <span className="text-[0.7vw] font-semibold">Redo</span>
        </button>
      </div>


      {/* Center: Page Name (Flipbook Name) */}
      <div className="flex items-center justify-center flex-1">
        {isEditingPageName ? (
          <input
            type="text"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            onBlur={() => {
                setIsEditingPageName(false);
                onNameSubmit?.();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    setIsEditingPageName(false);
                    onNameSubmit?.();
                }
            }}
            className="border-b border-indigo-500 text-gray-900 font-semibold tracking-tight text-center focus:outline-none bg-indigo-50/30 px-[1vw] py-[0.2vw]"
            style={{ fontSize: '0.9vw', width: '25vw' }}
            autoFocus
          />
        ) : (
            <div className="flex items-center gap-[0.5vw] group cursor-pointer" onClick={() => setIsEditingPageName(true)}>
                <span 
                    className="text-gray-900 font-semibold tracking-tight hover:text-indigo-600 transition-colors"
                    style={{ fontSize: '0.9vw' }}
                >
                    {pageName || 'Untitled Flipbook'}
                </span>
                <Edit2 size="0.9vw" className="text-gray-400 group-hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100" />
            </div>
        )}
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center justify-end w-1/4 select-none">
        <div className="flex items-center p-[0.3vw]" style={{ gap: '0.6vw' }}>
            <button 
                onClick={() => handleZoom && handleZoom(zoom - 10)}
                className="p-[0.4vw] hover:bg-white cursor-pointer hover:shadow-sm rounded-[0.6vw] transition-all text-gray-500 hover:text-indigo-600"
            >
                <Minus size="0.9vw" />
            </button>
            <div className="flex items-center justify-center min-w-[3.5vw]">
               <span className="font-semibold text-gray-900" style={{ fontSize: '0.85vw' }}>
                   {Math.round(zoom)}%
               </span>
            </div>
            <button 
                onClick={() => handleZoom && handleZoom(zoom + 10)}
                className="p-[0.4vw] hover:bg-white cursor-pointer hover:shadow-sm rounded-[0.6vw] transition-all text-gray-500 hover:text-indigo-600"
            >
                <Plus size="0.9vw" />
            </button>
            <div className="w-[0.1vw] h-[1.2vw] bg-gray-200 mx-[0.2vw]"></div>
            <button 
                onClick={onReset}
                className="text-[0.85vw] font-semibold cursor-pointer hover:text-indigo-700 px-[0.6vw] py-[0.2vw] hover:bg-indigo-50 rounded-[0.4vw] transition-all"
            >
                Reset
            </button>
        </div>
      </div>
    </div>
  );
};

// Helper for Zoom Level Display (1x = 100%) 
// Actually, 'zoom' prop is passed (e.g. 100).
// Let's use it directly in render.

export default TopToolbar;