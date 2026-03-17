import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import interact from 'interactjs';

// Global style to ensure injected SVGs always fill their container perfectly
const svgGlobalStyles = `
  .page-svg-container svg {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Figma-style Selection Highlight */
  .page-svg-container svg [data-selected="true"] {
    outline: 3px solid #6366F1 !important;
    outline-offset: -2px;
    filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.4));
  }

  /* Hover Feedback */
  .page-svg-container svg *:hover {
    outline: 1px solid rgba(99, 102, 241, 0.4);
    outline-offset: -1px;
    cursor: pointer;
  }

  /* Ensure selected elements stay on top for outline visibility */
  .page-svg-container svg [data-selected="true"] {
    paint-order: markers fill stroke;
  }

  /* Global SVG Interaction Prevention */
  .page-svg-container svg {
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  
  .page-svg-container svg text,
  .page-svg-container svg tspan {
    user-select: none !important;
    -webkit-user-select: none !important;
    pointer-events: none !important; /* Completely ignore text for click/drag */
  }

  /* Dragging State */
  .page-svg-container svg [data-dragging="true"] {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2)) !important;
    cursor: grabbing !important;
  }
`;
import TopToolbar from './TopToolbar';

const CurveIcon = ({ width, height, className }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path d="M2.5 22.9995C4 17.5007 10.5 26.5 11.5 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M15.6926 4.29545H7.30629M15.6926 4.29545L17.0904 1.5H5.90856L7.30629 4.29545M15.6926 4.29545L18.954 10.8182L11.4995 22L4.04492 10.8182L7.30629 4.29545" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
    <path d="M11.5 21.9989V12.2148" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.897 10.8196L11.4993 9.42188L10.1016 10.8196L11.4993 12.2164L12.897 10.8196Z" stroke="currentColor" strokeWidth="1" strokeMiterlimit="10" strokeLinejoin="round"/>
  </svg>
);

const MainEditor = ({ 
  isDoublePage, 
  pages = [], 
  activePageIndex, 
  setActivePageIndex, 
  insertPageAfter,
  duplicatePage,
  clearPage,
  deletePage,
  onOpenTemplateModal,
  selectedLayerId,
  setSelectedLayerId,
  updatePageHtml
}) => {

  const [showSelectOptions, setShowSelectOptions] = useState(false);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showShapesOptions, setShowShapesOptions] = useState(false);
  const [selectedSelectTool, setSelectedSelectTool] = useState('select'); // 'select' or 'direct'
  const [selectedPenTool, setSelectedPenTool] = useState('pen'); // 'pen', 'curve', 'pencil'
  const [selectedShapeTool, setSelectedShapeTool] = useState('rectangle'); // 'rectangle', 'circle', 'polygon', 'line', 'star'
  const [activeMainTool, setActiveMainTool] = useState('select'); // 'upload', 'select', 'pen', 'type', 'shapes', 'grid'
  const [zoom, setZoom] = useState(90);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which page's menu is open
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuIndex(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      dragStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 10));
  const handleResetZoom = () => setZoom(90);

  // Sync data-selected attribute with DOM for instant feedback
  useEffect(() => {
    const allSelected = document.querySelectorAll('[data-selected="true"]');
    allSelected.forEach(el => el.removeAttribute('data-selected'));

    if (selectedLayerId) {
      const elements = document.querySelectorAll(`[id="${selectedLayerId}"]`);
      elements.forEach(el => {
        el.setAttribute('data-selected', 'true');
      });
    }
  }, [selectedLayerId, pages, activePageIndex]);

  // Helper to get all valid SVG elements at a point (z-index ordered, top to bottom)
  const getElementsAtPoint = (x, y) => {
    return document.elementsFromPoint(x, y).filter(el => {
      const isSvgContent = el.closest('.page-svg-container') && el.id && el.tagName.toLowerCase() !== 'svg';
      const isVisible = el.getAttribute('data-hidden') !== 'true';
      return isSvgContent && isVisible;
    });
  };

  const getSvgPoint = (svgElement, clientX, clientY) => {
    const ctm = svgElement?.getScreenCTM();
    if (!ctm) return null;

    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    return point.matrixTransform(ctm.inverse());
  };

  const matrixToTransform = (matrix) => {
    return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
  };

  const getElementMatrix = (element) => {
    const baseTransform = element?.transform?.baseVal?.consolidate();

    if (!baseTransform?.matrix) {
      return new DOMMatrix();
    }

    const { a, b, c, d, e, f } = baseTransform.matrix;
    return new DOMMatrix([a, b, c, d, e, f]);
  };

  const getDraggableElement = (target, canvasRoot) => {
    let current = target;

    while (current && current !== canvasRoot && current.tagName) {
      const tagName = current.tagName.toLowerCase();

      if (tagName === 'svg') {
        return null;
      }

      if (
        current.id &&
        current.getAttribute('data-hidden') !== 'true' &&
        current.getAttribute('data-locked') !== 'true'
      ) {
        return current;
      }

      current = current.parentNode;
    }

    return null;
  };

  useEffect(() => {
    // Setup interactjs for elements within the SVG
    const interactable = interact('.page-svg-container svg *')
      .draggable({
        inertia: false, // Disable inertia for perfect cursor sync
        autoScroll: true,
        listeners: {
          start(event) {
            const target = event.target;
            const svgElement = target.ownerSVGElement;
            if (!svgElement) return;

            const isText = ['text', 'tspan', 'foreignObject'].includes(target.tagName.toLowerCase());
            if (isText || activeMainTool !== 'select') {
              event.interaction.stop();
              return;
            }

            // Find the best element to drag: 
            // If an ancestor (like a group) is selected, move that.
            let elementToDrag = target;
            if (selectedLayerId) {
              const selectedEl = document.getElementById(selectedLayerId);
              if (selectedEl && selectedEl !== svgElement && selectedEl.contains(target)) {
                elementToDrag = selectedEl;
              }
            }

            // Safety check for metadata-based 'locked' or 'hidden'
            if (elementToDrag.getAttribute('data-hidden') === 'true' || 
                elementToDrag.getAttribute('data-locked') === 'true') {
              event.interaction.stop();
              return;
            }

            // Get initial SVG coordinates for absolute delta tracking
            const startPoint = getSvgPoint(svgElement, event.clientX, event.clientY);
            if (!startPoint) {
              event.interaction.stop();
              return;
            }

            if (setSelectedLayerId) {
              setSelectedLayerId(elementToDrag.id);
            }

            // Store state in interaction object
            elementToDrag.setAttribute('data-dragging', 'true');
            elementToDrag.style.cursor = 'grabbing';
            
            event.interaction.dragState = {
              element: elementToDrag,
              startPoint: startPoint,
              initialMatrix: getElementMatrix(elementToDrag),
              svgElement: svgElement,
              pageIndex: activePageIndex
            };
          },
          move(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;

            const target = dragState.element;
            const currentPoint = getSvgPoint(dragState.svgElement, event.clientX, event.clientY);
            if (!currentPoint) return;

            // Calculate total delta from start for 1:1 cursor sync
            const dx = currentPoint.x - dragState.startPoint.x;
            const dy = currentPoint.y - dragState.startPoint.y;

            // Apply delta to initial matrix (not current) to avoid drift
            const translation = new DOMMatrix().translate(dx, dy);
            const nextMatrix = translation.multiply(dragState.initialMatrix);

            target.setAttribute('transform', matrixToTransform(nextMatrix));
            suppressClickRef.current = true;
          },
          end(event) {
            const dragState = event.interaction.dragState;
            if (!dragState) return;
            
            const target = dragState.element;
            target.removeAttribute('data-dragging');
            target.style.cursor = '';

            if (suppressClickRef.current && updatePageHtml) {
              const container = target.closest('.page-svg-container');
              const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : dragState.pageIndex;
              updatePageHtml(pageIdx, dragState.svgElement.outerHTML);
            }
            
            setTimeout(() => {
              suppressClickRef.current = false;
            }, 50);

            delete event.interaction.dragState;
          }
        }
      });

    return () => {
      interactable.unset();
    };
  }, [activeMainTool, zoom, updatePageHtml, activePageIndex, setSelectedLayerId]);

  // Handle manual drag state for selection tool (optional backup or for initial click)
  const handleSvgMouseDown = (pageIndex, e) => {
    if (e.button !== 0 || activeMainTool !== 'select' || e.ctrlKey || e.shiftKey) {
      return;
    }
    // interactjs handles the drag, we just need to ensure selection happens on mousedown if not dragging
    const target = getDraggableElement(e.target, e.currentTarget);
    const isText = target && ['text', 'tspan'].includes(target.tagName.toLowerCase());

    if (target && !isText && setSelectedLayerId) {
      setSelectedLayerId(target.id);
    }
  };

  const handleSvgClick = (e) => {
    e.stopPropagation();

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    
    // 1. Direct Leaf Selection (Ctrl + Shift + Click)
    if (e.ctrlKey && e.shiftKey) {
      const target = e.target;
      const isText = target && ['text', 'tspan'].includes(target.tagName.toLowerCase());
      if (target && target.id && target.tagName.toLowerCase() !== 'svg' && !isText) {
        if (setSelectedLayerId) setSelectedLayerId(target.id);
        return;
      }
    }

    // 2. Cycling Logic (Ctrl + Click)
    if (e.ctrlKey && !e.shiftKey) {
      const items = getElementsAtPoint(e.clientX, e.clientY).map(el => el.id);
      if (items.length > 0) {
        const currentIndex = items.indexOf(selectedLayerId);
        const nextIndex = (currentIndex + 1) % items.length;
        if (setSelectedLayerId) setSelectedLayerId(items[nextIndex]);
        return;
      }
    }

    // 3. Normal Selection / Drill-Down Logic
    let target = e.target;
    const canvasRoot = e.currentTarget;

    // Build path from target up to SVG root
    let path = [];
    let current = target;
    while (current && current !== canvasRoot && current.tagName && current.tagName.toLowerCase() !== 'svg') {
      const isText = ['text', 'tspan'].includes(current.tagName.toLowerCase());
      if (current.id && !isText) {
        path.unshift(current.id);
      }
      current = current.parentNode;
    }

    if (path.length === 0) {
      if (setSelectedLayerId) setSelectedLayerId(null);
      return;
    }

    // Basic Figma hierarchy behavior:
    // If current select is an ancestor, go one deeper.
    // If not, select the root-most parent.
    const currentIndexInPath = path.indexOf(selectedLayerId);
    if (currentIndexInPath !== -1 && currentIndexInPath < path.length - 1) {
      if (setSelectedLayerId) setSelectedLayerId(path[currentIndexInPath + 1]);
    } else {
      if (setSelectedLayerId) setSelectedLayerId(path[0]);
    }
  };

  const handleSvgDoubleClick = (e) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    let target = e.target;
    const isText = target && ['text', 'tspan'].includes(target.tagName.toLowerCase());
    
    // On double click, immediately try to select the leaf-most element 
    // or jump deep into the group hierarchy
    if (target && target.id && target.tagName.toLowerCase() !== 'svg' && !isText) {
      if (setSelectedLayerId) setSelectedLayerId(target.id);
    }
  };

  const handlePrevPage = () => {
    if (isDoublePage) {
      if (activePageIndex === 1) {
        setActivePageIndex(0);
      } else {
        setActivePageIndex(prev => Math.max(0, prev - 2));
      }
    } else {
      setActivePageIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (isDoublePage) {
      if (activePageIndex === 0) {
        if (pages.length > 1) setActivePageIndex(1);
      } else {
        if (activePageIndex + 2 < pages.length) {
          setActivePageIndex(prev => prev + 2);
        }
      }
    } else {
      if (activePageIndex + 1 < pages.length) {
        setActivePageIndex(prev => prev + 1);
      }
    }
  };

  const closeAllDropdowns = () => {
    setShowSelectOptions(false);
    setShowPenOptions(false);
    setShowShapesOptions(false);
  };


  return (
    <div 
      className="bg-white flex-1 flex flex-col overflow-hidden h-[92vh]"
      onClick={closeAllDropdowns}
    >
      <TopToolbar 
        zoom={zoom} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onReset={handleResetZoom} 
      />
      <div className="flex-1 relative flex items-center justify-center p-[1vw] overflow-hidden">
        
        {/* Top Group: Selection & Primary Tools - Independent Position */}
        <div className="absolute right-[0.9vw] top-[1.9vh] z-50">
          <div className="bg-[#F1F3F4] rounded-[0.5vw] border border-gray-300 p-[0.3vw] flex flex-col items-center w-[2.7vw] gap-[0.7vh] shadow-sm">
            {/* Black Edit Icon Button */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer bg-[#000000] rounded-[0.4vw] flex items-center justify-center transition-all my-[0.1vh]">
              <Icon icon="tabler:edit" width="1.1vw" height="1.1vw" className="text-white" />
            </button>
            
            {/* Hand / Pan Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all">
              <Icon icon="hugeicons:touch-interaction-01" width="1.2vw" height="1.2vw" />
            </button>
            
            {/* Star / Special Tool */}
            <button className="w-[2.1vw] h-[2.1vw] cursor-pointer hover:bg-white rounded-[0.4vw] flex items-center justify-center text-[#9EA1A7] hover:text-[#111827] transition-all mb-[0.2vh]">
              <Icon icon="tdesign:animation-1" width="1.2vw" height="1.2vw" />
            </button>
          </div>
        </div>

        {/* Top-Left: Animated Lordicon Card - Vertical Column */}
        <div className="absolute left-[0.8vw] top-[0.8vw] z-50">
          <div className="bg-white rounded-[0.5vw] border border-gray-100/50 p-[0.3vw] shadow-sm flex flex-col items-center gap-[0.5vw]">
            {/* Animated Hotspot Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/erxuunyq.json"
                trigger="loop"
                colors="primary:#E88F23"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Notification/Follow Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/kwnsnjyg.json"
                trigger="loop"
                colors="primary:#00ACEE"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>

            {/* Animated Third Icon */}
            <div className="group cursor-pointer w-[1.8vw] h-[1.8vw] flex items-center justify-center hover:bg-[#F3F4F6] rounded-[0.3vw] transition-colors">
              <lord-icon
                src="https://cdn.lordicon.com/shquqxad.json"
                trigger="loop"
                delay="2000"
                colors="primary:#9381FF"
                style={{ width: '1.4vw', height: '1.4vw' }}
              ></lord-icon>
            </div>
          </div>
        </div>

        {/* Bottom Group: Creation & Widgets - Perfected Integrated Design */}
        <div className="absolute right-0 top-[20vh] z-50">
          <div className="bg-[#F1F3F4] rounded-l-[0.8vw] border-y border-l border-gray-300 p-[0.3vw] flex flex-col shadow-sm relative">
            
            {/* Perfect Inverted Corner Top */}
            <div className="absolute -top-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] border-gray-300 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 100 V0 C100 55.2285 55.2285 100 0 100 H100Z" fill="#F1F3F4"/>
                <path d="M0 100 C55.2285 100 100 55.2285 100 0" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* Perfect Inverted Corner Bottom */}
            <div className="absolute -bottom-[0.8vw] right-0 w-[0.8vw] h-[0.8vw] pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 0 V100 C100 44.7715 55.2285 0 0 0 H100Z" fill="#F1F3F4"/>
                <path d="M0 0 C55.2285 0 100 44.7715 100 100" stroke="#acb0b6ff" strokeWidth="3"/>
              </svg>
            </div>

            {/* White Upload Button - matching top group size */}
            <div className="pt-[0.1vh] mb-[0.8vh] flex items-center justify-start group gap-[0.3vw]">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('upload');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] rounded-[0.4vw] flex items-center justify-center transition-all cursor-pointer ${activeMainTool === 'upload' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="prime:upload" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Select Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Select Tool Options Dropdown */}
              {showSelectOptions && (
                <div className="absolute right-[4.2vw] top-[-1.5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'select' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('select');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-line" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'select' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Select</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedSelectTool === 'direct' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSelectTool('direct');
                      setShowSelectOptions(false);
                    }}
                  >
                    <Icon icon="clarity:cursor-arrow-solid" width="1.1vw" height="1.1vw" className={`${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedSelectTool === 'direct' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Direct</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('select');
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'select' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={selectedSelectTool === 'select' ? 'clarity:cursor-arrow-line' : 'clarity:cursor-arrow-solid'} 
                  width="1.2vw" 
                  height="1.2vw" 
                  className="text-[#111827]" 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSelectOptions(!showSelectOptions);
                  setShowPenOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('select');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showSelectOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Pen Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Pen Tool Options Dropdown */}
              {showPenOptions && (
                <div className="absolute right-[4.2vw] top-[-5vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[1vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pen' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pen');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="streamline-cyber:pen-tool" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pen' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pen</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.3vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'curve' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('curve');
                      setShowPenOptions(false);
                    }}
                  >
                    <CurveIcon width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'curve' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Curve</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedPenTool === 'pencil' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPenTool('pencil');
                      setShowPenOptions(false);
                    }}
                  >
                    <Icon icon="mingcute:pencil-fill" width="1.1vw" height="1.1vw" className={`${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.5vw] font-medium mt-[0.2vh] ${selectedPenTool === 'pencil' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Pencil</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('pen');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'pen' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                {selectedPenTool === 'pencil' ? (
                  <Icon icon="mingcute:pencil-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : selectedPenTool === 'curve' ? (
                  <CurveIcon width="1.2vw" height="1.2vw" className="text-[#111827]" />
                ) : (
                  <Icon icon="streamline-cyber:pen-tool" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                )}
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPenOptions(!showPenOptions);
                  setShowSelectOptions(false);
                  setShowShapesOptions(false);
                  setActiveMainTool('pen');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showPenOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Type Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('type');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'type' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="mi:text" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>

            {/* Shapes Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] mb-[0.8vh] cursor-pointer relative">
              {/* Shapes Tool Options Dropdown */}
              {showShapesOptions && (
                <div className="absolute right-[4.2vw] top-[-12vh] bg-[#F1F3F4] rounded-[0.6vw] border border-gray-300 p-[0.3vw] flex flex-col items-center gap-[0.8vh] shadow-lg z-50 w-[2.7vw]">
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'rectangle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('rectangle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:square" width="1vw" height="1vw" className={`${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'rectangle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Rectangle</span>
                  </button>
                  
                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'circle' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('circle');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:circle" width="1vw" height="1vw" className={`${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'circle' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Circle</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'polygon' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('polygon');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:triangle" width="1vw" height="1vw" className={`${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'polygon' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Polygon</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'line' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('line');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="tabler:line" width="1.1vw" height="1.1vw" className={`${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827] rotate-[-45deg]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'line' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Line</span>
                  </button>

                  <button 
                    className={`w-[2.1vw] h-[2.1vw] p-[0.2vw] flex flex-col items-center justify-center rounded-[0.4vw] transition-all group/opt ${selectedShapeTool === 'star' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeTool('star');
                      setShowShapesOptions(false);
                    }}
                  >
                    <Icon icon="lucide:star" width="1vw" height="1vw" className={`${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#4B5563]'} group-hover/opt:text-[#111827]`} />
                    <span className={`text-[0.45vw] font-medium mt-[0.1vh] ${selectedShapeTool === 'star' ? 'text-[#111827]' : 'text-[#6B7280]'} group-hover/opt:text-[#111827]`}>Star</span>
                  </button>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('shapes');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'shapes' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon 
                  icon={
                    selectedShapeTool === 'rectangle' ? 'lucide:square' : 
                    selectedShapeTool === 'circle' ? 'lucide:circle' : 
                    selectedShapeTool === 'polygon' ? 'lucide:triangle' : 
                    selectedShapeTool === 'line' ? 'tabler:line' : 'lucide:star'
                  } 
                  width="1.2vw" 
                  height="1.2vw" 
                  className={`text-[#111827] ${selectedShapeTool === 'line' ? 'rotate-[-45deg]' : ''}`} 
                />
              </button>
              <div 
                className="w-[0.7vw] flex justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShapesOptions(!showShapesOptions);
                  setShowSelectOptions(false);
                  setShowPenOptions(false);
                  setActiveMainTool('shapes');
                }}
              >
                <Icon icon="lucide:chevron-down" className={`w-[0.7vw] h-[0.7vw] text-[#4B5563] transition-all ${showShapesOptions ? 'opacity-100 rotate-180' : 'opacity-50 group-hover:opacity-100'}`} />
              </div>
            </div>

            {/* Grid Tool Row */}
            <div className="flex items-center justify-start group gap-[0.3vw] cursor-pointer">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMainTool('grid');
                  closeAllDropdowns();
                }}
                className={`w-[2.1vw] h-[2.1vw] flex items-center justify-center rounded-[0.4vw] transition-all cursor-pointer ${activeMainTool === 'grid' ? 'bg-[#FFFFFF] shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Icon icon="tabler:icons" width="1.2vw" height="1.2vw" className="text-[#111827]" />
              </button>
              <div className="w-[0.7vw]"></div> {/* Alignment spacer */}
            </div>
          </div>
        </div>

        {/* Canvas Area container */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-white">
          {/* Left Navigation-Button */}
          <button 
            disabled={activePageIndex === 0}
            onClick={handlePrevPage}
            className={`absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw] ${activePageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ 
              left: `calc(50% - ${
                isDoublePage && activePageIndex > 0 && pages[activePageIndex + 1]
                  ? '((78vh / 1.414) * 1.0)' 
                  : '((78vh / 1.414) / 2)'
              } * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[-90deg]" />
          </button>

          {/* Zoomable Canvas Container with Perimeter Shadow */}
          <div 
            className={`flex items-center justify-center transition-all duration-300 origin-center gap-[0] bg-white border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_0_20px_-5px_rgba(0,0,0,0.05)]`}
            style={{ 
              transform: `scale(${zoom / 100})`,
            }}
          >
            {/* A4 Canvas Page 1 (Left Page in Spread or Hidden if Cover) */}
            {pages.length > 0 && (isDoublePage ? (activePageIndex > 0 && pages[activePageIndex]) : pages[activePageIndex]) && (
              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top) */}
                <div className="absolute top-[-2.5vw] z-30" style={{ [isDoublePage ? 'left' : 'right']: '0vw' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex(openMenuIndex === activePageIndex ? null : activePageIndex);
                    }}
                    className={`cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200`}
                  >
                    <Icon icon={isDoublePage ? "ri:menu-fold-4-fill" : "ri:menu-unfold-4-fill"} width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {openMenuIndex === activePageIndex && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full mt-[0.5vw] left-0 w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuOption 
                          icon={<PlusIcon />} 
                          label="Add Page" 
                          onClick={() => { insertPageAfter(activePageIndex); setOpenMenuIndex(null); }}
                        />
                        <MenuOption 
                          icon={<FilePlusIcon />} 
                          label="Add File" 
                          onClick={() => setOpenMenuIndex(null)}
                        />
                        <MenuOption 
                          icon={<DuplicateIcon />} 
                          label="Duplicate" 
                          onClick={() => { duplicatePage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                        <MenuOption 
                          icon={<TemplateIcon />} 
                          label="Template" 
                          onClick={() => {
                            onOpenTemplateModal();
                            setOpenMenuIndex(null);
                          }}
                        />
                        <div className="h-[0.1vw] bg-gray-100 my-[0.2vw] mx-[0.4vw]" />
                        <MenuOption 
                          icon={<ClearIcon />} 
                          label="Clear" 
                          onClick={() => { clearPage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                        <MenuOption 
                          icon={<DeleteIcon />} 
                          label="Delete" 
                          color="text-red-500" 
                          hoverColor="hover:bg-red-50"
                          onClick={() => { deletePage(activePageIndex); setOpenMenuIndex(null); }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* A4 Canvas Page 1 Inner */}
                <div 
                  className="relative z-0 flex flex-col overflow-hidden bg-white group/inner"
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className="flex-1 w-full relative page-svg-container" data-page-index={activePageIndex}>
                    <style>{svgGlobalStyles}</style>
                    {pages[activePageIndex]?.html ? (
                      <div 
                        className="h-full w-full overflow-hidden flex items-center justify-center bg-white"
                        dangerouslySetInnerHTML={{ __html: pages[activePageIndex]?.html }}
                        onMouseDown={(e) => handleSvgMouseDown(activePageIndex, e)}
                        onClick={handleSvgClick}
                        onDoubleClick={handleSvgDoubleClick}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                        <span className="text-[1.1vw] text-gray-300 font-medium mb-[0.4vw]">A4 sheet (210 x 297 mm)</span>
                        <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                      </div>
                    )}

                    {/* Simple Click-to-Open Gallery Overlay for empty pages */}
                    {!pages[activePageIndex]?.html && (
                      <div 
                        className="absolute inset-0 cursor-pointer z-10"
                        onClick={() => onOpenTemplateModal(activePageIndex)}
                      />
                    )}
                  </div>

                  {/* Minimalist Page Number Indicator - Transparent/Floating */}
                  <div className="absolute bottom-[2vh] left-[2vw] pointer-events-none z-20">
                    <div className="w-[1.8vw] h-[1.8vw] bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-[0.6vw] font-bold">
                          {(activePageIndex + 1).toString().padStart(2, '0')}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtle Center Divider for Double Page - Only show if it's a spread */}
            {isDoublePage && (activePageIndex > 0 && pages[activePageIndex + 1]) && (
              <div className="w-[1px] h-[78vh] bg-gray-100/50 relative z-10 shrink-0"></div>
            )}

            {/* A4 Canvas Page 2 (Visible if Double Page is enabled OR Right-Side Cover) */}
            {isDoublePage && (activePageIndex === 0 ? pages[0] : pages[activePageIndex + 1]) && (
              <div className="relative group/page">
                {/* Page Control Button (Floating Above Top - Right Side) */}
                <div className="absolute top-[-2.5vw] right-0 z-30">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      setOpenMenuIndex(openMenuIndex === displayIndex ? null : displayIndex);
                    }}
                    className="cursor-pointer rounded-[0.5vw] bg-[#F3F4F6] transition-all duration-300 flex items-center justify-center w-[2vw] h-[2vw] shadow-sm hover:bg-gray-200"
                  >
                    <Icon icon="ri:menu-unfold-4-fill" width="1.2vw" height="1.2vw" className="text-[#111827]" />
                  </button>

                  <AnimatePresence>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      return openMenuIndex === displayIndex && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full mt-[0.5vw] right-0 w-[12vw] bg-white rounded-[0.8vw] shadow-xl border border-gray-100 p-[0.5vw] z-[9999] flex flex-col gap-[0.2vw]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MenuOption 
                            icon={<PlusIcon />} 
                            label="Add Page" 
                            onClick={() => { insertPageAfter(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<FilePlusIcon />} 
                            label="Add File" 
                            onClick={() => setOpenMenuIndex(null)}
                          />
                          <MenuOption 
                            icon={<DuplicateIcon />} 
                            label="Duplicate" 
                            onClick={() => { duplicatePage(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<TemplateIcon />} 
                            label="Template" 
                            onClick={() => {
                              onOpenTemplateModal();
                              setOpenMenuIndex(null);
                            }}
                          />
                          <div className="h-[0.1vw] bg-gray-100 my-[0.2vw] mx-[0.4vw]" />
                          <MenuOption 
                            icon={<ClearIcon />} 
                            label="Clear" 
                            onClick={() => { clearPage(displayIndex); setOpenMenuIndex(null); }}
                          />
                          <MenuOption 
                            icon={<DeleteIcon />} 
                            label="Delete" 
                            color="text-red-500" 
                            hoverColor="hover:bg-red-50"
                            onClick={() => { deletePage(displayIndex); setOpenMenuIndex(null); }}
                          />
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                {/* A4 Canvas Page 2 Inner */}
                <div 
                  className="relative z-0 flex flex-col overflow-hidden bg-white group/inner"
                  style={{ 
                    height: '78vh', 
                    aspectRatio: '1 / 1.414',
                    minHeight: '400px',
                  }}
                >
                  {/* Page Content */}
                  <div className="flex-1 w-full relative page-svg-container" data-page-index={activePageIndex === 0 ? 0 : activePageIndex + 1}>
                    <style>{svgGlobalStyles}</style>
                    {(() => {
                      const displayIndex = activePageIndex === 0 ? 0 : activePageIndex + 1;
                      const page = pages[displayIndex];
                      
                      return page?.html ? (
                        <div 
                          className="h-full w-full overflow-hidden flex items-center justify-center bg-white"
                          dangerouslySetInnerHTML={{ __html: page.html }}
                          onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                          onClick={handleSvgClick}
                          onDoubleClick={handleSvgDoubleClick}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                            <span className="text-[1.1vw] text-gray-300 font-medium mb-[0.4vw]">A4 sheet (210 x 297 mm)</span>
                            <span className="text-[1.5vw] text-gray-300 font-medium">Choose Templets to Edit page</span>
                          </div>
                          {/* Click Overlay to open gallery */}
                          <div 
                            className="absolute inset-0 cursor-pointer z-10"
                            onClick={() => onOpenTemplateModal(displayIndex)}
                          />
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="absolute bottom-[2vh] right-[2vw] pointer-events-none z-20">
                    <div className="w-[1.8vw] h-[1.8vw] bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-[0.6vw] font-bold">
                          {(activePageIndex === 0 ? 1 : activePageIndex + 2).toString().padStart(2, '0')}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Navigation Button */}
          <button 
            disabled={isDoublePage 
              ? (activePageIndex === 0 ? pages.length <= 1 : activePageIndex + 2 >= pages.length) 
              : activePageIndex + 1 >= pages.length
            }
            onClick={handleNextPage}
            className={`absolute rounded-full hover:bg-black/5 transition-all duration-300 group z-20 shrink-0 flex items-center justify-center w-[2.2vw] h-[2.2vw] hover:w-[3.2vw] hover:h-[3.2vw] ${ 
              (isDoublePage 
                ? (activePageIndex === 0 ? pages.length <= 1 : activePageIndex + 2 >= pages.length) 
                : activePageIndex + 1 >= pages.length
              ) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{ 
              right: `calc(50% - ${
                isDoublePage && activePageIndex > 0 && pages[activePageIndex + 1]
                  ? '((78vh / 1.414) * 1.0)' 
                  : '((78vh / 1.414) / 2)'
              } * (${zoom / 100}) - 3vw)`,
              top: '50%',
              transform: 'translate(50%, -50%)'
            }}
          >
            <Icon icon="ion:caret-up" width="1.8vw" height="1.8vw" className="text-[#D1D5DB] group-hover:text-[#4B5563] rotate-[90deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const FilePlusIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const DuplicateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const TemplateIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ClearIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const DeleteIcon = () => (
  <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const MenuOption = ({ icon, label, onClick, color = "text-gray-700", hoverColor = "hover:bg-gray-50" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-[0.6vw] px-[0.8vw] py-[0.5vw] text-[0.75vw] font-medium transition-colors rounded-[0.4vw] text-left cursor-pointer ${color} ${hoverColor}`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

export default MainEditor;
