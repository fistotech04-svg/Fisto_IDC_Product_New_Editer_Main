import { useRef } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
const SelectionTooltip = () => null;
import { checkIsAnimatedWebp } from '../editorUtils';
import { syncDOM } from './geometryUtils';
import {
  PENCIL_CURSOR,
  PEN_CURSOR,
  SHAPE_CURSOR,
  TYPE_CURSOR,
  svgGlobalStyles
} from './constants';

export const CanvasViewport = ({
  zoomContainerRef,
  pan = { x: 0, y: 0 },
  zoom = 90,
  pages = [],
  activePageIndex = 0,
  localTrimView,
  isPopupEditor,
  canvasAspectRatio = '210 / 297',
  isConvertedFlipbook,
  selectedSelectTool,
  activeTopTool,
  setActiveTopTool,
  activeMainTool,
  setActiveMainTool,
  selectedPenTool,
  handleSvgMouseDown,
  handleSvgMouseMove,
  handleSvgMouseLeave,
  handleSvgClick,
  handleSvgMouseUp,
  handleSvgContextMenu,
  isSpaceDown,
  selectedLayerId,
  multiSelectedIds = new Set(),
  isEditingTextRef,
  marqueeOverlayRef1,
  updateElementAttribute,
  onOpenTemplateModal,
  setShowHotspotPopup
}) => {
  const lastRenderedHtmlRef = useRef({});

  const getHtmlToRender = (index, currentHtml) => {
    let clean = currentHtml || '';

    // Auto-fix for corrupted templates: strip out the pink XML parsererror and any baked-in custom controls
    if (clean.includes('parsererror') || clean.includes('id="custom-ctrl-')) {
      clean = clean.replace(/<parsererror[\s\S]*?<\/parsererror>/gi, '');
      clean = clean.replace(/<[^>]*id="custom-ctrl-[^>]*>.*?[\s\S]*?<\/[^>]*>/gi, '');
    }
    clean = clean.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

    // Ensure invisible Document Shield exists above PDF Background in converted document pages
    if ((isConvertedFlipbook || clean.includes('PDF Background') || clean.includes('pdf-vector-layer')) && !clean.includes('data-name="Document Shield"')) {
      const bgStartMatch = clean.match(/<g\b[^>]*data-(?:name="PDF Background"|type="pdf-vector-layer")[^>]*>/i);
      if (bgStartMatch) {
        const startIndex = bgStartMatch.index;
        let depth = 0;
        let i = startIndex;
        let closeIndex = -1;
        while (i < clean.length) {
          if (clean.startsWith('<g', i) && (clean[i + 2] === ' ' || clean[i + 2] === '>')) {
            depth++;
            i += 2;
          } else if (clean.startsWith('</g>', i) || clean.startsWith('</svg:g>', i)) {
            depth--;
            const tagLen = clean.startsWith('</svg:g>', i) ? 8 : 4;
            if (depth === 0) {
              closeIndex = i + tagLen;
              break;
            }
            i += tagLen;
          } else {
            i++;
          }
        }
        if (closeIndex !== -1) {
          const vbMatch = clean.match(/viewBox=["']\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*["']/i);
          const wVal = vbMatch ? vbMatch[3] : '100%';
          const hVal = vbMatch ? vbMatch[4] : '100%';
          const shieldStr = `\n    <rect id="shield-page-${index}" data-name="Document Shield" data-type="shield" x="0" y="0" width="${wVal}" height="${hVal}" fill="none" opacity="0" pointer-events="all" style="pointer-events: all;" />`;
          clean = clean.slice(0, closeIndex) + shieldStr + clean.slice(closeIndex);
        }
      }
    }

    if (isEditingTextRef?.current && lastRenderedHtmlRef.current[index]) {
      return lastRenderedHtmlRef.current[index];
    }
    lastRenderedHtmlRef.current[index] = clean;
    return clean;
  };

  return (
          <div
            id="main-zoom-container"
            ref={zoomContainerRef}
            className="flex items-center justify-center origin-center relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            }}
          >
            {/* Pages Container Centered */}
            <div className={`flex items-center justify-center gap-[0] relative z-10 ${localTrimView ? '' : 'shadow-[0_0_15px_rgba(0,0,0,0.20)]'} rounded-sm`}>
              {/* Single A4 Canvas Page */}
              {pages.length > 0 && pages[activePageIndex] && (
                <div className="relative group/page">
                  {/* A4 Canvas Page Inner */}
                  <div
                    className="relative z-0 flex flex-col bg-white group/inner transition-shadow duration-300 overflow-visible"
                    style={isPopupEditor ? {
                      width: `min(55vw, 72vh * (${canvasAspectRatio}))`,
                      height: `min(72vh, 55vw / (${canvasAspectRatio}))`,
                      borderRadius: '1.2vw',
                      backgroundColor: '#ffffff'
                    } : {
                      height: '78vh',
                      aspectRatio: canvasAspectRatio,
                      minHeight: '400px',
                    }}
                  >
                    {/* Page Content */}
                    <div
                      className={`flex-1 w-full relative page-svg-container ${isConvertedFlipbook ? 'is-pdf-project' : ''} ${localTrimView ? 'trim-view-on' : 'trim-view-off'} overflow-visible tool-${selectedSelectTool} ${(activeTopTool !== 'interaction' && activeTopTool !== 'animation') ? 'hide-free-frames' : ''} ${(activeMainTool === 'pen' && selectedPenTool === 'pencil') ? 'pencil-mode' : ''} ${(activeMainTool === 'pen' && selectedPenTool === 'pen') ? 'pen-mode' : ''} ${(activeMainTool === 'shapes') ? 'shape-mode' : ''} ${(activeMainTool === 'type') ? 'type-mode' : ''}`}
                      data-page-index={activePageIndex}
                    >
                      <style>{svgGlobalStyles}</style>
                      {(() => {
                        const displayIndex = activePageIndex;
                        const isShapeActive = activeMainTool === 'shapes';
                        const isPencilActive = activeMainTool === 'pen' && selectedPenTool === 'pencil';
                        const isPenToolActive = activeMainTool === 'pen';
                        const isTypeActive = activeMainTool === 'type';

                        const pageHtml = pages[displayIndex]?.html;
                        const isPageEmpty = !pages[displayIndex]?.isHidden && (!pageHtml || (pages[displayIndex]?.layers?.length === 1 && (!pages[displayIndex].layers[0].children || pages[displayIndex].layers[0].children.length === 0)));

                        return (
                          <div
                            className={`absolute inset-0 w-full h-full overflow-visible flex items-center justify-center ${isPopupEditor ? 'bg-transparent' : 'bg-white'}`}
                            style={{ cursor: (isPencilActive ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')))) }}
                          >
                            {pageHtml && (
                              <div
                                key={`canvas-content-${displayIndex}`}
                                id={`canvas-content-${displayIndex}`}
                                className="w-full h-full flex items-center justify-center"
                                ref={(el) => {
                                  if (el) {
                                    const newHtml = getHtmlToRender(displayIndex, pages[displayIndex]?.html);
                                    if (window.__skipCanvasUpdateForPage === displayIndex) {
                                      window.__skipCanvasUpdateForPage = -1;
                                      el.__lastHtml = newHtml;
                                      el.__lastPageIndex = displayIndex;
                                    } else if (el.__lastHtml !== newHtml) {
                                      // Fast path: When switching between different pages, direct innerHTML swap is 100x faster than recursive syncDOM!
                                      if (el.__lastPageIndex !== displayIndex) {
                                        el.innerHTML = newHtml;
                                        el.__lastPageIndex = displayIndex;
                                        el.__lastHtml = newHtml;
                                      } else {
                                        const parser = new DOMParser();
                                        const doc = parser.parseFromString(newHtml, 'text/html');
                                        const newChildren = Array.from(doc.body.childNodes);

                                        const oldChildren = Array.from(el.childNodes);
                                        const maxLength = Math.max(oldChildren.length, newChildren.length);

                                        for (let i = 0; i < maxLength; i++) {
                                          if (!oldChildren[i]) {
                                            el.appendChild(newChildren[i].cloneNode(true));
                                          } else if (!newChildren[i]) {
                                            el.removeChild(oldChildren[i]);
                                          } else {
                                            syncDOM(oldChildren[i], newChildren[i]);
                                          }
                                        }

                                        el.__lastHtml = newHtml;
                                        el.__lastPageIndex = displayIndex;
                                      }
                                    }
                                  }
                                }}
                                onMouseDown={(e) => handleSvgMouseDown(displayIndex, e)}
                                onMouseMove={(e) => handleSvgMouseMove(displayIndex, e)}
                                onMouseUp={(e) => handleSvgMouseUp && handleSvgMouseUp(e)}
                                onPointerUp={(e) => handleSvgMouseUp && handleSvgMouseUp(e)}
                                onMouseLeave={handleSvgMouseLeave}
                                onClick={handleSvgClick}
                                onDragOver={(e) => {
                                  e.preventDefault(); // Necessary to allow dropping external assets
                                  e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (typeof setActiveMainTool === 'function') {
                                    setActiveMainTool('select');
                                  }
                                  try {
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (!svg) return;

                                    // Convert screen coordinates to SVG coordinates
                                    const pt = svg.createSVGPoint();
                                    pt.x = e.clientX;
                                    pt.y = e.clientY;
                                    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                                    const dropPoint = { x: svgP.x, y: svgP.y };

                                    let targetShapeId = undefined;
                                    if (e.target) {
                                      const leaf = e.target.closest('[data-type="shape"], [data-type="vector-path"], [data-shape-type]');
                                      if (leaf && leaf.id && !leaf.id.includes('mask') && !leaf.id.includes('clip')) {
                                        targetShapeId = leaf.id;
                                      }
                                    }

                                    let data = null;

                                    // 1. Try reading JSON data
                                    const rawJson = e.dataTransfer.getData('application/json');
                                    if (rawJson) {
                                      try { data = JSON.parse(rawJson); } catch { /* ignored */ }
                                    }

                                    // 2. Try reading URL or text from external window/tab (e.g. Canva assets, web pages)
                                    if (!data) {
                                      const rawHtml = e.dataTransfer.getData('text/html');
                                      const rawUri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                                      let extractedUrl = null;

                                      if (rawHtml) {
                                        const match = rawHtml.match(/(?:src|href)=["']([^"']+)["']/i);
                                        if (match && match[1]) {
                                          extractedUrl = match[1];
                                        }
                                      }

                                      if (!extractedUrl && rawUri && rawUri.trim()) {
                                        const lines = rawUri.trim().split(/[\r\n]+/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
                                        if (lines.length > 0) {
                                          extractedUrl = lines[0];
                                        }
                                      }

                                      if (extractedUrl) {
                                        const trimmed = extractedUrl.trim();
                                        if (trimmed.startsWith('http') || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
                                          const lower = trimmed.toLowerCase();
                                          if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo')) {
                                            data = { type: 'video', url: trimmed };
                                          } else if (lower.endsWith('.gif')) {
                                            data = { type: 'gif', url: trimmed };
                                          } else {
                                            data = { type: 'image', url: trimmed };
                                          }
                                        }
                                      }
                                    }

                                    // 3. Try reading external files dropped directly from Desktop / File Explorer
                                    if (!data && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                      const files = Array.from(e.dataTransfer.files);
                                      let hasUnsupported = false;
                                      files.forEach(async (file, idx) => {
                                        const fileUrl = URL.createObjectURL(file);
                                        const offsetPoint = { x: dropPoint.x + idx * 20, y: dropPoint.y + idx * 20 };

                                        if (file.type.startsWith('image/')) {
                                          let isGif = file.type === 'image/gif';
                                          if (!isGif && file.type.includes('webp')) {
                                            isGif = await checkIsAnimatedWebp(file);
                                          }
                                          window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                            detail: {
                                              pageIndex: displayIndex,
                                              url: fileUrl,
                                              gifUrl: isGif ? fileUrl : undefined,
                                              name: file.name,
                                              type: isGif ? 'gif' : 'image',
                                              dropPoint: offsetPoint,
                                              targetShapeId
                                            }
                                          }));
                                        } else if (file.type.startsWith('video/')) {
                                          window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                                            detail: {
                                              pageIndex: displayIndex,
                                              videoUrl: fileUrl,
                                              file,
                                              originalUrl: fileUrl,
                                              dropPoint: offsetPoint
                                            }
                                          }));
                                        } else {
                                          hasUnsupported = true;
                                        }
                                      });
                                      if (hasUnsupported) {
                                        toast.error('Only Image, Video, and GIF formats are allowed.');
                                      }
                                      return;
                                    }

                                    if (!data) return;

                                    if (data.type === 'hotspot') {
                                      window.dispatchEvent(new CustomEvent('add-hotspot-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          icon: data.icon,
                                          dropPoint,
                                          presetId: data.icon?.presetId
                                        }
                                      }));
                                      setShowHotspotPopup(false);
                                    } else if (data.type === 'icon') {
                                      window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          icon: data.icon,
                                          dropPoint
                                        }
                                      }));
                                    } else if (data.type === 'image' || data.type === 'upload' || data.url) {
                                      window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          url: data.url || data.src,
                                          name: data.name || 'Image',
                                          type: 'image',
                                          dropPoint,
                                          targetShapeId
                                        }
                                      }));
                                    } else if (data.type === 'gif') {
                                      window.dispatchEvent(new CustomEvent('add-image-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          url: data.url || data.src,
                                          gifUrl: data.url || data.src,
                                          name: data.name || 'GIF',
                                          type: 'gif',
                                          dropPoint,
                                          targetShapeId
                                        }
                                      }));
                                    } else if (data.type === 'video') {
                                      window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                                        detail: {
                                          pageIndex: displayIndex,
                                          videoUrl: data.url || data.src,
                                          file: data.file,
                                          originalUrl: data.url || data.src,
                                          dropPoint
                                        }
                                      }));
                                    }
                                  } catch (err) {
                                    console.error('[MainEditor] Drop error:', err);
                                  }
                                }}
                                onContextMenu={(e) => handleSvgContextMenu(displayIndex, e)}
                              />
                            )}
                            {pages[displayIndex]?.isHidden && (
                              <div key={`hidden-placeholder-${displayIndex}`} className="w-full h-full flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] z-20 absolute inset-0 pointer-events-auto">
                                <Icon icon="ant-design:eye-invisible-outlined" width="3vw" height="3vw" style={{ strokeWidth: 0.2 }} className="text-gray-500 mb-[1vw] svg-icon-override" />
                                <span className="text-gray-700 font-semibold text-[1.2vw]">This page is hidden</span>
                                <span className="text-gray-500 text-[0.85vw] mt-[0.5vw]">It will not be shown in the flipbook.</span>
                              </div>
                            )}
                            
                            {!pages[displayIndex]?.isHidden && (
                              <>
                                {/* Trim View Backdrop Mat & Page Boundary */}
                                {localTrimView && (
                                  <div
                                    key={`trim-view-mat-${displayIndex}`}
                                    className="pointer-events-none absolute inset-0 z-10"
                                    style={{
                                      boxShadow: '0 0 0 99999px rgba(230, 231, 231, 0.55)',
                                      border: '1px dashed #9f9fa0',
                                    }}
                                  />
                                )}

                                {/* Selection Overlay (Overlay rotated element perfectly) */}
                                <svg
                                  id={`highlight-overlay-${displayIndex}`}
                                  className={`absolute inset-0 w-full h-full selection-overlay-layer z-20 transition-opacity duration-200 ${isSpaceDown ? 'opacity-0' : 'opacity-100'}`}
                                  style={{ overflow: 'visible', pointerEvents: 'none', zIndex: 20 }}
                                />

                                {/* HTML Overlay for Resize Handles (Clickable) */}
                                <div
                                  id={`highlight-overlay-html-${displayIndex}`}
                                  className={`absolute inset-0 w-full h-full z-30 transition-opacity duration-200 ${isSpaceDown ? 'opacity-0' : 'opacity-100'}`}
                                  style={{ overflow: 'visible', pointerEvents: 'none', zIndex: 30 }}
                                />
                                <AnimatePresence>
                                  {selectedLayerId && !isEditingTextRef.current && multiSelectedIds.size <= 1 && (activeTopTool === 'animation') && (
                                    <SelectionTooltip
                                      selectedId={selectedLayerId}
                                      multiSelectedIds={multiSelectedIds}
                                      zoom={zoom}
                                      setActiveTopTool={setActiveTopTool}
                                      pageIndex={displayIndex}
                                      activePageIndex={activePageIndex}
                                      updateElementAttribute={updateElementAttribute}
                                      activeTopTool={activeTopTool}
                                    />
                                  )}
                                </AnimatePresence>
                              </>
                            )}

                            {/* Marquee Selection Box */}
                            {!isConvertedFlipbook && (
                              <svg
                                ref={marqueeOverlayRef1}
                                id="marquee-selection-overlay"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  pointerEvents: 'none',
                                  zIndex: 1000,
                                  display: 'none',
                                  overflow: 'visible'
                                }}
                              >
                                <rect
                                  x="0"
                                  y="0"
                                  width="0"
                                  height="0"
                                  fill="rgba(82, 85, 202, 0.1)"
                                  stroke="#5255CA"
                                  strokeWidth={(1 / (zoom / 100)).toFixed(3)}
                                  shapeRendering="geometricPrecision"
                                  strokeLinejoin="miter"
                                />
                              </svg>
                            )}

                            {isPageEmpty && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none bg-transparent opacity-60">
                                <div className="text-center text-[#B0B5C1] text-[0.85vw] font-normal leading-snug mb-[0.8vw]">
                                  Ready-made templates<br />are available for a quicker start
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTemplateModal(displayIndex);
                                  }}
                                  className="text-[#5145F6] hover:text-[#3B2DD6] text-[0.85vw] font-medium mb-[0.8vw] pointer-events-auto cursor-pointer underline underline-offset-4 decoration-1"
                                >
                                  Add Templates
                                </button>
                                <div className="text-[#B0B5C1] text-[0.85vw] mb-[0.8vw] font-normal">
                                  (or)
                                </div>
                                <div className="text-[#D1D5DB] text-[0.85vw] font-normal">
                                  Create your own Design
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

  );
};

export default CanvasViewport;
