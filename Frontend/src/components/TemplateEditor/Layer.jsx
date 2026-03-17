import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, MoreVertical, Layers, Plus, Copy, Edit2, 
  Layout, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, 
  Ban, Trash2, FilePlus, GripVertical, 
  Folder, Type, Image as ImageIcon, Square, Circle, Triangle, Star, Minus, 
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

// --- Recursive Layer Item Component (Figma Style) ---
const LayerItem = ({ layer, depth = 0, onToggleVisibility, onToggleLock, selectedLayerId, setSelectedLayerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isGroup = layer.type === 'g' || (layer.children && layer.children.length > 0);
  const itemRef = useRef(null);

  // Auto-scroll to selected layer
  useEffect(() => {
    if (selectedLayerId === layer.id && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedLayerId, layer.id]);

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
      case 'polygon': return <Triangle size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'path': return <Star size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'line': return <Minus size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      default: return <Layers size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }
  };

  return (
    <div className="flex flex-col select-none">
      <div 
        ref={itemRef}
        className={`flex items-center gap-[0.4vw] py-[0.5vh] pr-[0.5vw] rounded-[0.3vw] cursor-pointer group/layer transition-colors ${selectedLayerId === layer.id ? 'bg-[#E0E7FF]' : 'hover:bg-[#F3F4F6]'}`}
        style={{ paddingLeft: `${depth * 0.8 + 0.5}vw` }}
        onClick={(e) => {
          e.stopPropagation();
          if (setSelectedLayerId) setSelectedLayerId(layer.id);
          if (isGroup) setIsOpen(!isOpen);
        }}
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
        <span className="flex-1 text-[0.7vw] font-medium text-gray-700 truncate group-hover/layer:text-[#111827]">
          {layer.name}
        </span>

        {/* Secondary Visibility/Lock Status (Small) */}
        <div className="flex items-center gap-[0.3vw] opacity-0 group-hover/layer:opacity-100 transition-opacity">
          <button 
            className="text-gray-400 hover:text-indigo-600 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onToggleVisibility && onToggleVisibility(layer.id); }}
          >
            {layer.visible === false ? <EyeOff size="0.7vw" /> : <Eye size="0.7vw" />}
          </button>
          <button 
            className="text-gray-400 hover:text-indigo-600 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onToggleLock && onToggleLock(layer.id); }}
          >
            {layer.locked === true ? <Lock size="0.7vw" /> : <Unlock size="0.7vw" />}
          </button>
        </div>
      </div>

      {isGroup && isOpen && layer.children && (
        <div className="flex flex-col">
          {layer.children.map((child, idx) => (
            <LayerItem 
              key={child.id || idx} 
              layer={child} 
              depth={depth + 1} 
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              selectedLayerId={selectedLayerId}
              setSelectedLayerId={setSelectedLayerId}
            />
          ))}
        </div>
      )}
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
  selectedLayerId,
  setSelectedLayerId
}) => {
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if a page index should be expanded/active in the sidebar
  const checkIsExpanded = (index) => {
    if (!isDoublePage) return activePageIndex === index;
    if (activePageIndex === 0) return index === 0;
    return index === activePageIndex || index === activePageIndex + 1;
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
                    draggable={!editingPageId}
                    onDragStart={(e) => handleDragStart(e, index)}
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
                      layout
                      className={`flex flex-col rounded-[0.6vw] transition-all duration-300 relative group 
                        ${draggedPageIndex === index ? 'opacity-40 scale-[0.98]' : ''} 
                        ${isExpanded 
                          ? 'bg-white border border-[#E5E7EB] shadow-sm' 
                          : 'bg-[#E5E7EB] hover:bg-[#DADADA]'
                      }`}
                    >
                      {/* Page Header (Collapsible) */}
                      <div 
                        onClick={() => {
                          if (editingPageId === page.id) return;
                          if (isDoublePage) {
                            if (index === 0) setActivePageIndex(0);
                            else setActivePageIndex(index % 2 === 0 ? index - 1 : index);
                          } else {
                            setActivePageIndex(index);
                          }
                        }}
                        className="flex items-center py-[1.2vh] px-[1vw] cursor-pointer relative group/pageitem"
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
                                page.layers.map((layer, idx) => (
                                  <LayerItem 
                                    key={layer.id || idx} 
                                    layer={layer} 
                                    depth={0} 
                                    onToggleVisibility={(layerId) => toggleLayerVisibility(index, layerId)}
                                    onToggleLock={(layerId) => toggleLayerLock(index, layerId)}
                                    selectedLayerId={selectedLayerId}
                                    setSelectedLayerId={setSelectedLayerId}
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
                      <div 
                        ref={menuRef}
                        style={(() => {
                          const element = document.getElementById(`page-card-${page.id}`);
                          if (!element) return { display: 'none' };
                          const rect = element.getBoundingClientRect();
                          return { position: 'fixed', left: `calc(${rect.right}px + 0.6vw)`, top: `${Math.min(rect.top, window.innerHeight - 450)}px` };
                        })()}
                        className="w-[12vw] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[0.4vw] z-[9999] flex flex-col gap-[0.2vw] animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Menu Options (Same as previous implementation) */}
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
                      </div>,
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
