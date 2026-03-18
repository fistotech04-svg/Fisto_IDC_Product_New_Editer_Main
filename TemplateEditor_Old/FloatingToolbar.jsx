// FloatingToolbar.jsx - Floating action bar for page operations
import React from 'react';
import { Plus, Copy, RotateCcw, Trash2, X } from 'lucide-react';

const FloatingToolbar = ({ 
  addNewPage, 
  duplicatePage, 
  clearCanvas, 
  deletePage 
}) => {
  const btnClass = "flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 transition-colors border-r border-gray-100 last:border-0";
  const iconSize = 13;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded shadow-sm border border-gray-200 flex items-center p-1 z-20">
      <button onClick={addNewPage} className={btnClass}>
        <Plus size={iconSize} />
        Add Page
      </button>
      
      <button onClick={duplicatePage} className={btnClass}>
        <Copy size={iconSize} />
        Duplicate
      </button>

      <button onClick={clearCanvas} className={btnClass}>
        <RotateCcw size={iconSize} />
        Clear
      </button>

      <button onClick={deletePage} className={`${btnClass} text-red-500 hover:text-red-600 hover:bg-red-50`}>
        <Trash2 size={iconSize} />
        Delete
      </button>

      <button className="px-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 ml-1">
        <X size={14} />
      </button>
    </div>
  );
};

export default FloatingToolbar;
