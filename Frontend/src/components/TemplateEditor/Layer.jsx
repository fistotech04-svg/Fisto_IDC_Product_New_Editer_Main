import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, MoreVertical, Layers, Plus, Copy, Edit2, 
  Layout, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, 
  Ban, Trash2, FilePlus, GripVertical, 
  Folder, Type, Image as ImageIcon, Square, Circle, Triangle, Star, Minus, 
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock,
  Scissors, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

const LayerItem = ({ 
  layer, 
  depth = 0, 
  onToggleVisibility, 
  onToggleLock, 
  selectedLayerId, 
  setSelectedLayerId, 
  multiSelectedIds = new Set(), 
  setMultiSelectedIds,
  renameLayer,
  pageIndex,
  onLayerContextMenu,
  onReorderLayer,
  currentFrameId,
  setCurrentFrameId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  const isGroup = layer.type === 'g' || (layer.children && layer.children.length > 0);
  const itemRef = useRef(null);
  
  // Listen for custom trigger to start editing from context menu
  useEffect(() => {
    const handleTriggerRename = (e) => {
      if (e.detail.layerId === layer.id) {
        setIsEditing(true);
        setEditName(layer.name);
      }
    };
    window.addEventListener('trigger-rename-layer', handleTriggerRename);
    return () => window.removeEventListener('trigger-rename-layer', handleTriggerRename);
  }, [layer.id, layer.name]);

  // Determine if this item should be styled as "Selected"
  // In spread mode, we treat both root folders as "selected" if they are both in the set
  const isSelected = selectedLayerId === layer.id || (multiSelectedIds.size > 1 && multiSelectedIds.has(layer.id) && depth === 0);
  
  // Is it part of multi-selection but not the primary?
  const isMultiOnly = multiSelectedIds.has(layer.id) && !isSelected && multiSelectedIds.size > 1;

  // Auto-scroll to selected layer
  useEffect(() => {
    if (selectedLayerId === layer.id && itemRef.current) {
      // Small timeout to allow parent folder expansion animation to progress
      // Delay matched with 0.3s animation to ensure layout is stable
      const timer = setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedLayerId, layer.id]);

  // Listen for external expand trigger (e.g. from Pencil tool drawing)
  useEffect(() => {
    const handleExpandChain = (e) => {
      if (!isGroup) return;
      
      const hasDescendant = (node, id) => {
        if (!node.children) return false;
        for (const child of node.children) {
          if (child.id === id) return true;
          if (hasDescendant(child, id)) return true;
        }
        return false;
      };

      if (hasDescendant(layer, e.detail.id)) {
        setIsOpen(true);
      }
    };
    window.addEventListener('expand-layer-parent', handleExpandChain);
    return () => window.removeEventListener('expand-layer-parent', handleExpandChain);
  }, [layer, isGroup]);

  // Auto-expand folder if a child is selected
  useEffect(() => {
    if (selectedLayerId && isGroup && !isOpen) {
      const hasSelectedDescendant = (node, id) => {
        if (!node.children) return false;
        for (const child of node.children) {
          if (child.id === id) return true;
          if (hasSelectedDescendant(child, id)) return true;
        }
        return false;
      };
      if (hasSelectedDescendant(layer, selectedLayerId)) {
        setIsOpen(true);
      }
    }
  }, [selectedLayerId, layer, isGroup, isOpen]);

  // Auto-collapse if selection is cleared (click outside workspace)
  useEffect(() => {
    if (!selectedLayerId && multiSelectedIds.size === 0 && isOpen) {
       setIsOpen(false);
    }
  }, [selectedLayerId, multiSelectedIds]);

  // Icon Helper based on element type
  const getLayerIcon = () => {
    const isImageByName = layer.name && layer.name.toLowerCase().includes('image');
    if (layer.type === 'image' || isImageByName) {
      return <ImageIcon size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }

    switch (layer.type) {
      case 'g': return <Folder size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'text': return <Type size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'rect': return <Square size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'circle': 
      case 'ellipse': return <Circle size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'triangle':
      case 'path': return <Triangle size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'star': return <Star size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'line': return <Minus size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      default: return <Layers size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }
  };

  const handleItemClick = (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      // ── Shift+Click: Multi-select block ───────────────────────────────────
      const newSet = new Set(multiSelectedIds);
      if (newSet.has(layer.id)) newSet.delete(layer.id);
      else newSet.add(layer.id);
      if (setMultiSelectedIds) setMultiSelectedIds(newSet);
    } else {
      // ── Plain click: single select, clear multi-selection ─────────────
      if (setSelectedLayerId) setSelectedLayerId(layer.id);
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([layer.id]));
      if (isGroup) setIsOpen(!isOpen);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLayerContextMenu) {
      onLayerContextMenu(layer.id, e.clientX, e.clientY);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ pageIndex, layerId: layer.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.pageIndex === pageIndex && onReorderLayer) {
      onReorderLayer(pageIndex, data.layerId, layer.id);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    if (editName.trim() !== '' && editName !== layer.name) {
      renameLayer(pageIndex, layer.id, editName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="flex flex-col select-none">
      <div 
        ref={itemRef}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-[0.4vw] py-[0.5vh] pr-[0.5vw] rounded-[0.3vw] group/layer transition-all border-l-2 ${
          isDragOver ? 'border-l-[#6366F1] bg-[#EEF2FF]' : 'border-l-transparent'
        } ${
          isSelected
            ? 'bg-[#E0E7FF] ring-1 ring-[#6366F1]/30'   // primary selection — solid indigo tint
            : layer.id === currentFrameId
            ? 'bg-[#F5F3FF] border-l-[#A78BFA] ring-1 ring-dashed ring-[#A78BFA]/50' // Entered Frame style
            : isMultiOnly
            ? 'bg-[#EEF2FF]'                             // part of multi-set — lighter tint
            : 'hover:bg-[#F3F4F6]'
        }`}
        style={{ paddingLeft: `${depth * 0.8 + 0.5}vw` }}
        onClick={handleItemClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse Chevron */}
        <div className="w-[1vw] flex items-center justify-center">
          {isGroup && (
            isOpen ? <ChevronDown size="0.7vw" className="text-gray-400" /> : <ChevronRight size="0.7vw" className="text-gray-400" />
          )}
        </div>

        {/* Layer Type Icon */}
        <div className="w-[1.2vw] h-[1.2vw] flex items-center justify-center">
          {getLayerIcon()}
        </div>

        {/* Layer Name */}
        <div className="flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white border border-indigo-500 rounded-[0.1vw] px-[0.2vw] py-0 text-[0.7vw] font-medium text-gray-900 outline-none"
            />
          ) : (
            <span className="block text-[0.7vw] font-medium text-gray-700 truncate group-hover/layer:text-[#111827]">
              {layer.name}
            </span>
          )}
        </div>

        {/* Selection indicator dot - only for primary selection */}
        {selectedLayerId === layer.id && (
          <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-[#6366F1] flex-shrink-0" title="Primary selection" />
        )}

        {/* Secondary Visibility/Lock Status (Small) */}
        <div className="flex items-center gap-[0.3vw] opacity-0 group-hover/layer:opacity-100 transition-opacity">
          <button 
            className="text-gray-400 hover:text-indigo-600"
            onClick={(e) => { 
                e.stopPropagation(); 
                const ids = multiSelectedIds.has(layer.id) ? Array.from(multiSelectedIds) : [layer.id];
                onToggleVisibility && onToggleVisibility(ids); 
            }}
          >
            {layer.visible === false ? <EyeOff size="0.7vw" /> : <Eye size="0.7vw" />}
          </button>
          <button 
            className="text-gray-400 hover:text-indigo-600"
            onClick={(e) => { 
                e.stopPropagation(); 
                const ids = multiSelectedIds.has(layer.id) ? Array.from(multiSelectedIds) : [layer.id];
                onToggleLock && onToggleLock(ids); 
            }}
          >
            {layer.locked === true ? <Lock size="0.7vw" /> : <Unlock size="0.7vw" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isGroup && isOpen && layer.children && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col overflow-hidden"
          >
            {[...layer.children].reverse().map((child, idx) => (
              <LayerItem 
                key={child.id || idx} 
                layer={child} 
                depth={depth + 1} 
                onToggleVisibility={onToggleVisibility}
                onToggleLock={onToggleLock}
                selectedLayerId={selectedLayerId}
                setSelectedLayerId={setSelectedLayerId}
                multiSelectedIds={multiSelectedIds}
                setMultiSelectedIds={setMultiSelectedIds}
                renameLayer={renameLayer}
                pageIndex={pageIndex}
                onLayerContextMenu={onLayerContextMenu}
                onReorderLayer={onReorderLayer}
                currentFrameId={currentFrameId}
                setCurrentFrameId={setCurrentFrameId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Layer Component ---
const Layer = ({ 
  pages, 
  activePageIndex, 
  setActivePageIndex, 
  isDoublePage,
  insertPageAfter,
  duplicatePage,
  renamePage,
  renameLayer,
  deletePage,
  movePageUp,
  movePageDown,
  movePageToFirst,
  movePageToLast,
  movePage,
  clearPage,
  onOpenTemplateModal,
  toggleLayerVisibility,
  toggleLayerLock,
  bringLayerToFront,
  sendLayerToBack,
  moveLayerForward,
  moveLayerBackward,
  reorderLayer,
  deleteLayer,
  copyLayer,
  cutLayer,
  pasteLayer,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  currentFrameId,
  setCurrentFrameId,
  clipboard
}) => {
  const [activeLayerMenu, setActiveLayerMenu] = useState(null); // { layerId, x, y }
  const layerMenuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Menu State
  const [activeMenuPageId, setActiveMenuPageId] = useState(null);
  const menuRef = useRef(null);

  // Renaming State
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef(null);

  // Drag Reorder State
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Use a motion value for persistent Y
  const y = useMotionValue(0);

  // Sync check: if activePageIndex is out of bounds, reset it
  useEffect(() => {
    if (pages && pages.length > 0 && activePageIndex >= pages.length) {
      setActivePageIndex(0);
    }
  }, [pages, activePageIndex]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPageId(null);
      }
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) {
        setActiveLayerMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for canvas context menu trigger
  useEffect(() => {
    const handleCanvasContextMenu = (event) => {
      const { e, layerId, isOverlay } = event.detail;
      setActiveLayerMenu({ layerId, x: e.clientX, y: e.clientY, isOverlay });
    };
    window.addEventListener('show-layer-context-menu', handleCanvasContextMenu);
    return () => window.removeEventListener('show-layer-context-menu', handleCanvasContextMenu);
  }, []);

  const handleLayerContextMenu = (layerId, x, y) => {
    setActiveLayerMenu({ layerId, x, y });
  };

  // Determine if a page index should be expanded/active in the sidebar
  const checkIsExpanded = (index) => {
    if (!isDoublePage) return activePageIndex === index;
    if (activePageIndex === 0) return index === 0;
    
    // Spread Logic: Odd index is Left, Even index is Right
    // Find the left-side index of the current spread
    const spreadStart = activePageIndex % 2 === 0 ? activePageIndex - 1 : activePageIndex;
    
    // Check if both sides of the spread exist
    if (spreadStart > 0 && spreadStart + 1 < pages.length) {
      return index === spreadStart || index === spreadStart + 1;
    }
    
    return activePageIndex === index;
  };

  const handleMenuClick = (e, pageId) => {
    e.stopPropagation();
    setActiveMenuPageId(activeMenuPageId === pageId ? null : pageId);
  };

  const handleRenameStart = (e, page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
    setActiveMenuPageId(null); 
  };

  const handleRenameSubmit = (pageId) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingPageId(null);
  };

  const handleRenameCancel = () => {
    setEditingPageId(null);
    setEditingName('');
  };

  // Drag Handlers
  const handleDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
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

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedPageIndex !== null && draggedPageIndex !== index) {
      movePage(draggedPageIndex, index);
    }
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isVisible ? '16vw' : '0vw' }}
      className="relative h-[92vh] bg-white border-r border-[#EEEEEE] overflow-visible flex-shrink-0"
    >
      {/* Floating Button Drag Area (Hidden when sidebar is open) */}
      {!isVisible && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[85vh] w-[2.5vw] z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            drag="y"
            dragConstraints={{ top: -300, bottom: 300 }} 
            dragElastic={0}
            dragMomentum={false}
            style={{ y }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
              setTimeout(() => setIsDragging(false), 100);
            }}
            onClick={() => {
              if (!isDragging) {
                setIsVisible(true);
              }
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto cursor-pointer group select-none relative"
          >
            <svg width="2.5vw" height="auto" viewBox="0 0 60 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter transition-transform duration-300">
              <path d="M0 0C0 11.5 10 11.5 10 11.5H48C54.6274 11.5 60 16.8726 60 23.5V59.5C60 66.1274 54.6274 71.5 48 71.5H10C10 71.5 0 71.5 0 82C0 80 0 1.5 0 0Z" fill="black"/>
              <path d="M22.979 35.315C20.993 36.109 20 36.506 20 37C20 37.4925 20.987 37.8876 22.961 38.6778L22.979 38.6778L25.787 39.809C27.773 40.603 28.767 41 30 41C31.233 41 32.227 40.603 34.213 39.809L37.021 38.685C39.007 37.891 40 37.494 40 37C40 36.5075 39.013 36.1124 37.039 35.3222L37.021 35.315L34.213 34.192C32.227 33.397 31.233 33 30 33C29.046 33 28.236 33.237 27 33.712L22.979 35.315Z" fill="white"/>
            </svg>
          </motion.div>
        </div>
      )}

      {/* Layer Context Menu (createPortal) */}
      {activeLayerMenu && createPortal(
        <AnimatePresence>
          <motion.div 
            key="layer-context-menu"
            ref={layerMenuRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={(() => {
               // Safely clamp the menu within the viewport
               // Menu width is roughly 10vw, height is estimated at 350px
               const menuWidth = window.innerWidth * 0.11; 
               const menuHeight = 350; 
               return {
                 position: 'fixed',
                 left: `${Math.min(activeLayerMenu.x, window.innerWidth - menuWidth)}px`,
                 top: `${Math.min(activeLayerMenu.y, window.innerHeight - menuHeight)}px`
               };
            })()}
            className="w-[10vw] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[0.4vw] z-[9999] flex flex-col gap-[0.2vw]"
            onClick={(e) => e.stopPropagation()}
          >
          {(() => {
            const targetIds = multiSelectedIds.has(activeLayerMenu.layerId) 
              ? Array.from(multiSelectedIds) 
              : [activeLayerMenu.layerId];

            const page = pages[activePageIndex];
            const isRootLayer = activeLayerMenu.isOverlay || 
                                (page && page.layers && page.layers.some(l => l.id === activeLayerMenu.layerId));

            if (isRootLayer) {
                return (
                  <>
                    <button 
                      onClick={() => { 
                        cutLayer(activePageIndex, targetIds);
                        setActiveLayerMenu(null); 
                      }} 
                      className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                    >
                      <Scissors size="0.9vw" /> Cut
                    </button>
                    <button 
                      onClick={() => { 
                        copyLayer(activePageIndex, targetIds);
                        setActiveLayerMenu(null); 
                      }} 
                      className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                    >
                      <Copy size="0.9vw" /> Copy
                    </button>
                    <button 
                      disabled={!clipboard || (Array.isArray(clipboard) && clipboard.length === 0)}
                      onClick={() => { 
                        pasteLayer(activePageIndex);
                        setActiveLayerMenu(null); 
                      }} 
                      className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${
                        (!clipboard || (Array.isArray(clipboard) && clipboard.length === 0))
                          ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60' 
                          : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <Clipboard size="0.9vw" /> Paste
                    </button>
                  </>
                );
            }

            return (
              <>
                {multiSelectedIds.size <= 1 && (
                  <>
                    <button 
                      onClick={() => { 
                          window.dispatchEvent(new CustomEvent('trigger-rename-layer', { detail: { layerId: activeLayerMenu.layerId } }));
                          setActiveLayerMenu(null); 
                      }} 
                      className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                    >
                      <Edit2 size="0.9vw" /> Rename
                    </button>
                    <div className="h-px bg-gray-100 my-[0.2vw]"></div>
                  </>
                )}

                <button 
                  onClick={() => { 
                    moveLayerForward(activePageIndex, targetIds); 
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <ArrowUp size="0.9vw" /> Move Front
                </button>
                <button 
                  onClick={() => { 
                    moveLayerBackward(activePageIndex, targetIds); 
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <ArrowDown size="0.9vw" /> Move Back
                </button>
                <button 
                  onClick={() => { 
                    bringLayerToFront(activePageIndex, targetIds); 
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <ArrowUpToLine size="0.9vw" /> Bring to front
                </button>
                <button 
                  onClick={() => { 
                    sendLayerToBack(activePageIndex, targetIds); 
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <ArrowDownToLine size="0.9vw" /> Send to back
                </button>

                <div className="h-px bg-gray-100 my-[0.2vw]"></div>

                <button 
                  onClick={() => { 
                    cutLayer(activePageIndex, targetIds);
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <Scissors size="0.9vw" /> Cut
                </button>
                <button 
                  onClick={() => { 
                    copyLayer(activePageIndex, targetIds);
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <Copy size="0.9vw" /> Copy
                </button>
                <button 
                  disabled={!clipboard || (Array.isArray(clipboard) && clipboard.length === 0)}
                  onClick={() => { 
                    pasteLayer(activePageIndex);
                    setActiveLayerMenu(null); 
                  }} 
                  className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${
                    (!clipboard || (Array.isArray(clipboard) && clipboard.length === 0))
                      ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60' 
                      : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <Clipboard size="0.9vw" /> Paste
                </button>

                <div className="h-px bg-gray-100 my-[0.2vw]"></div>

                <button 
                  onClick={() => { 
                    deleteLayer(activePageIndex, targetIds);
                    setActiveLayerMenu(null); 
                  }} 
                  className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-50 rounded-[0.4vw] text-left cursor-pointer"
                >
                  <Trash2 size="0.9vw" /> Delete
                </button>
              </>
            );
          })()}
        </motion.div>
      </AnimatePresence>,
      document.body
      )}

      {/* Sidebar Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col px-[0.8vw] pb-[1.5vh] select-none h-full w-[16vw] overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-[0.2vw] flex-shrink-0" style={{ height: '8vh' }}>
              <div className="bg-[#F1F3F4] px-[1vw] py-[0.5vh] rounded-[0.5vw] text-[0.75vw] font-medium text-[#374151]">
                Layers
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-[#374151] hover:bg-gray-100 p-[0.4vw] rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft size="1.2vw" strokeWidth={2.5} />
              </button>
            </div>

            <div className="h-[1px] bg-[#EEEEEE] mx-[-0.8vw] mb-[2vh]"></div>

            {/* Scrollable Area for Pages and Layers */}
            <div 
              className="flex-1 overflow-y-auto pr-[0.2vw] space-y-[1.2vh] no-scrollbar pb-[2vh]"
              onClick={() => setActiveMenuPageId(null)}
            >
              {pages.map((page, index) => {
                const isExpanded = checkIsExpanded(index);
                
                return (
                  <div 
                    key={page.id} 
                    className="flex flex-col relative" 
                    id={`page-card-${page.id}`}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    {/* Rebuild Indicator (Top) */}
                    {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex > index && (
                      <div className="absolute -top-[0.4vh] left-0 right-0 h-[0.2vw] bg-indigo-500 rounded-full z-10" />
                    )}

                    <motion.div 
                      layout="position"
                      className={`flex flex-col rounded-[0.6vw] transition-all duration-300 relative group 
                        ${draggedPageIndex === index ? 'opacity-40 scale-[0.98]' : ''} 
                        ${isExpanded 
                          ? 'bg-white border border-[#E5E7EB] shadow-sm' 
                          : 'bg-[#E5E7EB] hover:bg-[#DADADA]'
                      }`}
                    >
                      {/* Page Header (Collapsible) */}
                      <div 
                        draggable={!editingPageId}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onClick={() => {
                          if (editingPageId === page.id) return;
                          if (isDoublePage) {
                            if (index === 0) {
                              setActivePageIndex(0);
                            } else if (index === pages.length - 1) {
                              setActivePageIndex(index);
                            } else {
                              // If even index (like 2), it could be the RIGHT half of a spread starting at index-1
                              const potentialStart = index % 2 === 0 ? index - 1 : index;
                              const isStartASpread = potentialStart > 0 && potentialStart + 1 < pages.length - 1;
                              
                              if (isStartASpread) {
                                setActivePageIndex(potentialStart);
                              } else {
                                setActivePageIndex(index);
                              }
                            }
                          } else {
                            setActivePageIndex(index);
                          }
                        }}
                        onContextMenu={(e) => handleMenuClick(e, page.id)}
                        className="flex items-center py-[1.2vh] px-[1vw] relative group/pageitem"
                      >
                        {/* Grip Handle (Hover only) */}
                        {!editingPageId && (
                          <div className="absolute left-[0.2vw] overflow-hidden transition-all duration-300 w-0 group-hover/pageitem:w-[1.2vw] opacity-0 group-hover/pageitem:opacity-100 flex items-center justify-center pointer-events-none">
                            <GripVertical size="1vw" className="text-gray-400" />
                          </div>
                        )}

                        <div className={`flex-1 min-w-0 flex items-center transition-all duration-300 ${!editingPageId ? 'group-hover/pageitem:pl-[0.8vw]' : ''}`}>
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
                              className="w-full text-left text-[0.85vw] font-semibold border-b border-indigo-600 py-[0.1vw] focus:outline-none bg-transparent"
                            />
                          ) : (
                            <span className={`text-[0.85vw] font-semibold truncate tracking-tight transition-colors duration-300 ${isExpanded ? 'text-[#111827]' : 'text-[#4B5563]'}`}>
                              {page.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-[0.4vw] flex-shrink-0">
                          <Layers size="1.1vw" className={isExpanded ? 'text-[#6366F1]' : 'text-[#6B7280]'} strokeWidth={isExpanded ? 2.5 : 2} />
                          {!editingPageId && (
                            <button
                              onClick={(e) => handleMenuClick(e, page.id)}
                              className="p-[0.2vw] rounded-full transition-colors hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                            >
                              <MoreVertical size="1.1vw" className="text-[#111827]" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* FIGMA STYLE NESTED LAYERS LIST */}
                      <AnimatePresence>
                        {isExpanded && !editingPageId && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden bg-white rounded-b-[0.6vw] border-t border-[#EEF2FF]"
                          >
                            <div className="py-[1vh] px-[0.6vw] flex flex-col gap-[0.2vh] max-h-[45vh] overflow-y-auto custom-scrollbar">
                              {page.layers && page.layers.length > 0 ? (
                                [...page.layers].reverse().map((layer, idx) => (
                                  <LayerItem 
                                    key={layer.id || idx} 
                                    layer={layer} 
                                    depth={0} 
                                    onToggleVisibility={(layerId) => toggleLayerVisibility(index, layerId)}
                                    onToggleLock={(layerId) => toggleLayerLock(index, layerId)}
                                    selectedLayerId={selectedLayerId}
                                    setSelectedLayerId={setSelectedLayerId}
                                    multiSelectedIds={multiSelectedIds}
                                    setMultiSelectedIds={setMultiSelectedIds}
                                    renameLayer={renameLayer}
                                    pageIndex={index}
                                    onLayerContextMenu={handleLayerContextMenu}
                                    onReorderLayer={(sourceId, targetId) => reorderLayer(index, sourceId, targetId)}
                                    currentFrameId={currentFrameId}
                                    setCurrentFrameId={setCurrentFrameId}
                                  />
                                ))
                              ) : (
                                <div className="text-[0.7vw] text-gray-400 italic px-[0.8vw] py-[0.5vh]">
                                  No layers found
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Rebuild Indicator (Bottom) */}
                    {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex < index && (
                      <div className="absolute -bottom-[0.4vh] left-0 right-0 h-[0.2vw] bg-indigo-500 rounded-full z-10" />
                    )}

                    {/* Context Menu Dropdown (createPortal) */}
                    {activeMenuPageId === page.id && createPortal(
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={`page-menu-${page.id}`}
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          style={(() => {
                            const element = document.getElementById(`page-card-${page.id}`);
                            if (!element) return { display: 'none' };
                            const rect = element.getBoundingClientRect();
                            return { 
                              position: 'fixed', 
                              left: `calc(${rect.right}px + 0.6vw)`, 
                              top: `${Math.min(rect.top, window.innerHeight - 450)}px` 
                            };
                          })()}
                          className="w-[12vw] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[0.4vw] z-[9999] flex flex-col gap-[0.2vw]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-[0.5vw] py-[0.2vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">Page Settings <div className="h-px bg-gray-100 flex-1"></div></div>
                          <button onClick={() => { insertPageAfter(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Plus size="0.9vw" /> Add Page</button>
                          <button onClick={() => { setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><FilePlus size="0.9vw" /> Add File</button>
                          <button onClick={() => { duplicatePage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Copy size="0.9vw" /> Duplicate</button>
                          <button onClick={(e) => handleRenameStart(e, page)} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Edit2 size="0.9vw" /> Rename</button>
                          <button onClick={() => { setActivePageIndex(index); onOpenTemplateModal(); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Layout size="0.9vw" /> Template</button>
                          
                          <div className="px-[0.5vw] py-[0.2vw] mt-[0.2vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">Page Order <div className="h-px bg-gray-100 flex-1"></div></div>
                          <button onClick={() => { movePageUp(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowUp size="0.9vw" /> Move Up</button>
                          <button onClick={() => { movePageDown(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowDown size="0.9vw" /> Move Down</button>
                          <button onClick={() => { movePageToFirst(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowUpToLine size="0.9vw" /> Move to First</button>
                          <button onClick={() => { movePageToLast(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowDownToLine size="0.9vw" /> Move to Last</button>
                          
                          <div className="h-px bg-gray-100 my-[0.2vw]"></div>
                          <button onClick={() => { clearPage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Ban size="0.9vw" /> Clear</button>
                          <button onClick={() => { deletePage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-50 rounded-[0.4vw] text-left cursor-pointer"><Trash2 size="0.9vw" /> Delete</button>
                        </motion.div>
                      </AnimatePresence>,
                      document.body
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Add Pages Button */}
            <div className="pt-[1vh] bg-white">
              <button 
                onClick={() => insertPageAfter(pages.length - 1)}
                className="w-full bg-[#000000] text-white py-[1.5vh] rounded-[0.6vw] text-[0.9vw] font-semibold flex items-center justify-center gap-[0.8vw] hover:bg-gray-900 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size="1.2vw" strokeWidth={2.5} />
                <span>Add Pages</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Layer;
