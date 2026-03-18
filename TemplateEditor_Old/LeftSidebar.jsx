// LeftSidebar.jsx - Redesigned with Context Menu + Drag-to-Reorder
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Copy, Edit2, Layout, FilePlus, 
  ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, 
  Ban, Trash2, MoreVertical, GripVertical 
} from 'lucide-react';

const LeftSidebar = ({
  pages,
  currentPage,
  switchToPage,
  addNewPage,
  insertPageAfter,
  duplicatePage,
  renamePage,
  clearPage,
  deletePage,
  movePageUp,
  movePageDown,
  movePageToFirst,
  movePageToLast,
  movePage,
  onOpenTemplateModal,
  editingPageIdProp,
  onEditingPageIdChange,
  isDoublePage,
  onOpenUploadModal
}) => {
  // Menu State
  const [activeMenuPageId, setActiveMenuPageId] = useState(null);
  const menuRef = useRef(null);

  // Renaming State
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef(null);

  // Drag State
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Helper to check if a page is currently selected (handling Double Page logic)
  const isPageSelected = (index) => {
     if (!isDoublePage) return index === currentPage;
     
     // Double Page Logic
     if (index === 0) return currentPage === 0; // Cover page is always single/exclusive
     
     const totalPages = pages.length;
     // If even total pages, last page is single back cover
     if (totalPages % 2 === 0 && index === totalPages - 1) return currentPage === totalPages - 1;

     // Calculate spread for the Current Page
     let startSpread;
     if (currentPage === 0 || (totalPages % 2 === 0 && currentPage === totalPages - 1)) {
         return index === currentPage;
     }

     if (currentPage % 2 !== 0) {
         // Current is Odd (Left side of spread)
         startSpread = currentPage;
     } else {
         // Current is Even (Right side of spread)
         startSpread = currentPage - 1;
     }

     // The spread covers [startSpread, startSpread + 1]
     return index === startSpread || index === startSpread + 1;
  };

  // Sync external editing state with internal state (for auto-rename after add/duplicate)
  useEffect(() => {
    if (editingPageIdProp !== undefined && editingPageIdProp !== editingPageId) {
      setEditingPageId(editingPageIdProp);
      if (editingPageIdProp !== null) {
        const page = pages.find(p => p.id === editingPageIdProp);
        if (page) {
          setEditingName(page.name);
        }
      }
    }
  }, [editingPageIdProp, pages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (e, pageId) => {
    e.stopPropagation();
    setActiveMenuPageId(activeMenuPageId === pageId ? null : pageId);
  };

  const handleRenameStart = (e, page) => {
    // e.stopPropagation(); // Context menu click already handled
    setEditingPageId(page.id);
    setEditingName(page.name);
    setActiveMenuPageId(null); // Close menu
    if (onEditingPageIdChange) {
      onEditingPageIdChange(page.id);
    }
  };

  const handleRenameSubmit = (pageId) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingPageId(null);
    if (onEditingPageIdChange) {
      onEditingPageIdChange(null);
    }
  };

  const handleRenameCancel = () => {
    setEditingPageId(null);
    setEditingName('');
    if (onEditingPageIdChange) {
      onEditingPageIdChange(null);
    }
  };

  // Drag Handlers
  const handleDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer to be set
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPageIndex !== null && draggedPageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedPageIndex !== null && draggedPageIndex !== dropIndex) {
      movePage(draggedPageIndex, dropIndex);
    }
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  return (
    <aside className="w-[18vw] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="p-[1vw] flex items-center justify-between border-b border-gray-100">
        <h2 className="text-[1.2vw] font-semibold text-gray-800">Pages</h2>
        <button
          onClick={onOpenUploadModal} 
          className="flex items-center gap-[0.4vw] cursor-pointer bg-transparent hover:bg-gray-100 text-gray-700 px-[0.8vw] py-[0.4vw] rounded-[0.4vw] text-[0.8vw] font-medium transition-colors"
        >
          <Plus size="1.1vw" />
          Add Files
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-[1vw] space-y-[0.5vw] custom-scrollbar bg-white" onClick={() => setActiveMenuPageId(null)}>
        {pages.map((page, idx) => (
          <div 
            key={page.id} 
            className="relative group"
            id={`page-card-${page.id}`}
            draggable={editingPageId !== page.id}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: draggedPageIndex === idx ? 0.5 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {/* Drop Indicator - Show above the card when dragging over */}
            {dragOverIndex === idx && draggedPageIndex !== idx && draggedPageIndex < idx && (
              <div className="absolute -top-[0.2vw] left-0 right-0 h-[0.1vw] bg-blue-500 rounded-full z-10" />
            )}
            
            <div 
              onClick={() => editingPageId !== page.id && switchToPage(idx)}
              className={`w-full py-[0.8vw] px-[1vw] rounded-[0.5vw] cursor-pointer transition-all text-center text-[0.8vw] font-medium relative flex items-center justify-center
                ${isPageSelected(idx)
                  ? 'bg-gray-200 text-gray-900 border-gray-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
            >
              {/* Drag Handle - Left Side */}
              {editingPageId !== page.id && (
                <div 
                  className="absolute left-[0.2vw] top-1/2 -translate-y-1/2 p-[0.3vw] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={(e) => e.currentTarget.parentElement.style.cursor = 'grab'}
                  onMouseLeave={(e) => e.currentTarget.parentElement.style.cursor = 'pointer'}
                >
                  <GripVertical size="1.1vw" className="text-gray-400" />
                </div>
              )}

              {editingPageId === page.id ? (
                <input 
                  ref={renameInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRenameSubmit(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(page.id);
                    if (e.key === 'Escape') handleRenameCancel();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.target.select()}
                  autoFocus
                  className="w-full text-center text-[0.8vw] border-b border-black py-[0.1vw] focus:outline-none"
                />
              ) : (
                <>
                  <span className="truncate max-w-[10vw]">{page.name}</span>
                  
                  {/* 3-Dot Menu Button - Visible on Hover or Active Menu */}
                  <button
                    onClick={(e) => handleMenuClick(e, page.id)}
                    className={`absolute right-[0.5vw] top-1/2 -translate-y-1/2 p-[0.3vw] rounded-full transition-colors 
                        ${activeMenuPageId === page.id ? 'opacity-100 bg-gray-300' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'}`}
                  >
                    <MoreVertical size="1.1vw" className="text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {/* Drop Indicator - Show below the card when dragging over */}
            {dragOverIndex === idx && draggedPageIndex !== idx && draggedPageIndex > idx && (
              <div className="absolute -bottom-[0.2vw] left-0 right-0 h-[0.1vw] bg-blue-500 rounded-full z-10" />
            )}

            {/* Context Menu Dropdown - Rendered via Portal to avoid clipping */}
            {activeMenuPageId === page.id && createPortal(
                <div 
                    ref={menuRef}
                    style={(() => {
                        const element = document.getElementById(`page-card-${page.id}`);
                        if (!element) return { display: 'none' };
                        const rect = element.getBoundingClientRect();
                        const menuHeight = window.innerHeight * 0.45; // Approximate max height (45vh)
                        const bottomBuffer = window.innerHeight * 0.2; // Buffer (20vh)
                        
                        // Check if menu would overflow bottom of screen
                        if (rect.top + menuHeight + bottomBuffer > window.innerHeight) {
                            // Vertically centered, but horizontally next to card
                            return {
                                position: 'fixed',
                                top: '50%',
                                left: `calc(${rect.right}px + 0.6vw)`,
                                transform: 'translateY(-50%)'
                            };
                        }
                        
                        // Default position: Next to the card, aligned to top
                        return {
                            position: 'fixed',
                            left: `calc(${rect.right}px + 0.6vw)`,
                            top: `${rect.top}px`
                        };
                    })()}
                    className="w-[13vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.25vw] animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Page Settings Section */}
                    {/* ... menu content same as before ... */}
                    <div className="px-[0.5vw] py-[0.25vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">
                        Page Settings <div className="h-px bg-gray-100 flex-1"></div>
                    </div>
                    
                    <button onClick={() => { insertPageAfter(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <Plus size="0.9vw" /> Add Page
                    </button>
                    <button onClick={() => { switchToPage(idx); onOpenUploadModal(); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <FilePlus size="0.9vw" /> Add File
                    </button>
                    <button onClick={() => { duplicatePage(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <Copy size="0.9vw" /> Duplicate
                    </button>
                    <button onClick={(e) => handleRenameStart(e, page)} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <Edit2 size="0.9vw" /> Rename
                    </button>
                    <button onClick={() => { switchToPage(idx); onOpenTemplateModal(); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <Layout size="0.9vw" /> Template
                    </button>

                    {/* Page Order Section */}
                    <div className="px-[0.5vw] py-[0.25vw] mt-[0.25vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">
                         Page Order <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    <button onClick={() => { movePageUp(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <ArrowUp size="0.9vw" /> Move Up
                    </button>
                    <button onClick={() => { movePageDown(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                         <ArrowDown size="0.9vw" /> Move Down
                    </button>
                    <button onClick={() => { movePageToFirst(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <ArrowUpToLine size="0.9vw" /> Move to First
                    </button>
                    <button onClick={() => { movePageToLast(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <ArrowDownToLine size="0.9vw" /> Move to Last
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 my-[0.25vw]"></div>

                    {/* Actions */}
                    <button onClick={() => { clearPage(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.5vw] text-left">
                        <Ban size="0.9vw" /> Clear
                    </button>
                    <button onClick={() => { deletePage(idx); setActiveMenuPageId(null); }} className="flex items-center cursor-pointer gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-50 rounded-[0.5vw] text-left">
                        <Trash2 size="0.9vw" /> Delete
                    </button>
                </div>,
                document.body
            )}
          </div>
        ))}
      </div>

      {/* Footer - Add Page Toggle */}
      <div className="p-[1vw] border-t border-gray-100 bg-white">
        <button 
          onClick={() => addNewPage()}
          className="w-full bg-black cursor-pointer hover:bg-gray-800 text-white py-[0.8vw] rounded-[0.6vw] flex items-center justify-center gap-[0.5vw] text-[0.8vw] font-medium transition-colors"
        >
          <Plus size="1.1vw" />
          Add Page
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;