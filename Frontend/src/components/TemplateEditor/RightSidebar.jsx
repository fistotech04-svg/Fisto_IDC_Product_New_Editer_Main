import React, { useState, useRef, useEffect } from 'react';
import { SquarePlay, Image as ImageIcon, CloudUpload, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import ShapeProperties from './ShapeProperties';
import ImageEditor from './ImageEditor';
import TextEditor from './TextEditor';
import IconGallery from './icons';
import VideoEditor from './VideoEditor';
import GifEditor from './Gif';
import AnimationPanel from './AnimationPanel';
import InteractionPanel from './InteractionPanel';
import PopupTemplateSelection from './PopupTemplateSelection';
import Model3DEditor from './Model3DEditor';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

const DimensionInput = ({ targetId, targetAttr, value, readOnly, onChange, className }) => {
  const [localVal, setLocalVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [liveVal, setLiveVal] = useState(null);

  useEffect(() => {
    if (!targetId || readOnly) {
      setLiveVal(null);
      return;
    }

    let frameId;
    const poll = () => {
       const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
       const el = editorDoc.getElementById(targetId);
       if (el && typeof el.getBBox === 'function') {
          try {
             const bbox = el.getBBox();
             let rawVal = 0;
             if (targetAttr === 'width') rawVal = bbox.width;
             else if (targetAttr === 'height') rawVal = bbox.height;
             else if (targetAttr === 'x') rawVal = bbox.x;
             else if (targetAttr === 'y') rawVal = bbox.y;
             
             const transform = el.getAttribute('transform');
             if (transform && transform.includes('matrix')) {
                const match = transform.match(/matrix\(([^)]+)\)/);
                if (match) {
                   const m = match[1].split(/[\s,]+/).map(parseFloat);
                   if (m.length === 6) {
                      if (targetAttr === 'width') rawVal *= Math.abs(m[0]);
                      else if (targetAttr === 'height') rawVal *= Math.abs(m[3]);
                      else if (targetAttr === 'x') rawVal += m[4];
                      else if (targetAttr === 'y') rawVal += m[5];
                   }
                }
             }

             if (el.tagName === 'circle' && (!transform || !transform.includes('matrix'))) {
                 const r = parseFloat(el.getAttribute('r')) || 0;
                 if (targetAttr === 'width' || targetAttr === 'height') rawVal = r * 2;
                 else if (targetAttr === 'x') rawVal = (parseFloat(el.getAttribute('cx')) || 0) - r;
                 else if (targetAttr === 'y') rawVal = (parseFloat(el.getAttribute('cy')) || 0) - r;
             }

             const finalLiveVal = Number(rawVal.toFixed(1)).toString();
             
             setLiveVal((prev) => (prev !== finalLiveVal ? finalLiveVal : prev));
          } catch (e) {}
       } else {
          setLiveVal(null);
       }
       frameId = requestAnimationFrame(poll);
    };
    poll();
    return () => cancelAnimationFrame(frameId);
  }, [targetId, targetAttr, readOnly]);

  const displayValue = isEditing ? localVal : (liveVal !== null ? liveVal : value);

  return (
    <input
      className={className}
      value={displayValue}
      readOnly={readOnly}
      onFocus={() => {
        setIsEditing(true);
        setLocalVal(displayValue);
      }}
      onBlur={() => {
        setIsEditing(false);
        // Only trigger onChange if the user actually typed a different value from what was live
        if (localVal !== '' && localVal !== (liveVal !== null ? liveVal : value).toString()) {
           onChange(localVal);
        }
      }}
      onChange={(e) => setLocalVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      }}
    />
  );
};

const RightSidebar = ({ 
  isDoublePage, 
  setIsDoublePage, 
  isRulerEnabled,
  setIsRulerEnabled,
  activeMainTool,
  setActiveMainTool,
  activeTopTool,
  activePageIndex,
  pages,
  setPages,
  updatePageBackground,
  selectedLayerId,
  updateElementAttribute,
  deleteLayer,
  onPreview,
  activePreviewDevice: activePreviewDeviceProp,
  setActivePreviewDevice: setActivePreviewDeviceProp,
  flipbookDimensions = { width: 210, height: 297 },
  isPopupEditor = false,
  onCustomizePopup,
  onApplyPopupChanges,
  onCancelPopupChanges,
  is3DModalOpen, 
  setIs3DModalOpen,
  preview3DDataUrl,
  setCurrent3DItem,
  shadowStrength, setShadowStrength,
  shadowSoftness, setShadowSoftness,
  autoRotate, setAutoRotate,
  autoRotateSpeed, setAutoRotateSpeed,
  lockMaxZoom, setLockMaxZoom,
  maxZoom, setMaxZoom,
  bgType, setBgType,
  bgColor, setBgColor,
  customBg, setCustomBg,
    enableAR, setEnableAR,
  qrText, setQrText, qrColor, setQrColor, qrBgType, setQrBgType, qrBgColor, setQrBgColor, qrLevel, setQrLevel, qrDotType, setQrDotType, qrCornerSquareType, setQrCornerSquareType, qrCornerDotType, setQrCornerDotType, qrLogo, setQrLogo,
  topText, setTopText, bottomText, setBottomText
}) => {
  const isPdfProject = pages.some(p => p.html && p.html.includes('data-name="PDF Background"'));
  const { width: baseWidth, height: baseHeight } = flipbookDimensions;
  // Convert mm to pixels at 96 DPI for the input display if no element selected
  const baseWidthPx = Math.round(baseWidth * 96 / 25.4);
  const baseHeightPx = Math.round(baseHeight * 96 / 25.4);
  const fileInputRef = useRef(null);
  const { folder, v_id } = useParams();
  const location = useLocation();
  const [activePreviewDevice, setActivePreviewDevice] = useState(localStorage.getItem('previewDevice') || 'Desktop');
  const [dimensionUnit, setDimensionUnit] = useState('mm');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isPageBgPickerOpen, setIsPageBgPickerOpen] = useState(false);
  const unitRef = useRef(null);
  const [expandedInteraction, setExpandedInteraction] = useState('call-click');
  const [interactionTab, setInteractionTab] = useState('Call');
  const [isInteractionMenuOpen, setIsInteractionMenuOpen] = useState(false);
  const interactionMenuRef = useRef(null);

  const updatePosition = (val, targetAttr) => {
     if (!selectedElementProps) return;
     const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
     const el = editorDoc.getElementById(selectedLayerId);
     if (!el) return;
     
     let newVal = parseFloat(val);

     const transform = el.getAttribute('transform');
     if (transform && transform.includes('matrix')) {
         const match = transform.match(/matrix\(([^)]+)\)/);
         if (match) {
             const m = match[1].split(/[\s,]+/).map(parseFloat);
             if (m.length === 6) {
                 const bbox = el.getBBox();
                 if (targetAttr === 'x') {
                     m[4] = newVal - bbox.x;
                     updateElementAttribute(activePageIndex, selectedLayerId, {
                        'transform': `matrix(${m.join(', ')})`,
                        'data-x': m[4].toString()
                     });
                 } else {
                     m[5] = newVal - bbox.y;
                     updateElementAttribute(activePageIndex, selectedLayerId, {
                        'transform': `matrix(${m.join(', ')})`,
                        'data-y': m[5].toString()
                     });
                 }
                 return;
             }
         }
     }

     if (targetAttr === 'x') {
         if (selectedElementProps.tagName === 'circle' || selectedElementProps.tagName === 'ellipse') {
             const radius = parseFloat(selectedElementProps.tagName === 'circle' ? el.getAttribute('r') : el.getAttribute('rx')) || 0;
             updateElementAttribute(activePageIndex, selectedLayerId, 'cx', (newVal + radius).toString());
         } else {
             updateElementAttribute(activePageIndex, selectedLayerId, 'x', newVal.toString());
         }
     } else {
         if (selectedElementProps.tagName === 'circle' || selectedElementProps.tagName === 'ellipse') {
             const radius = parseFloat(selectedElementProps.tagName === 'circle' ? el.getAttribute('r') : el.getAttribute('ry')) || 0;
             updateElementAttribute(activePageIndex, selectedLayerId, 'cy', (newVal + radius).toString());
         } else {
             updateElementAttribute(activePageIndex, selectedLayerId, 'y', newVal.toString());
         }
     }
  };

  const convertValue = (mmValue) => {
     const val = parseFloat(mmValue || 0);
     if (dimensionUnit === 'px') return Math.round(val * 96 / 25.4);
     if (dimensionUnit === 'cm') return (val / 10).toFixed(2);
     return Number(val.toFixed(1)); // mm
  };

  const updateDimensionWithScale = (val, targetAttr) => {
     if (!selectedElementProps) return;
     let scale = 1;
     let m = [1, 0, 0, 1, 0, 0];
     let hasMatrix = false;
     const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
     const el = editorDoc.getElementById(selectedLayerId);
     if (el) {
        const transform = el.getAttribute('transform');
        if (transform && transform.includes('matrix')) {
           const match = transform.match(/matrix\(([^)]+)\)/);
           if (match) {
              const parsedM = match[1].split(/[\s,]+/).map(parseFloat);
              if (parsedM.length === 6) {
                 m = parsedM;
                 hasMatrix = true;
                 scale = Math.abs(targetAttr === 'width' ? m[0] : m[3]);
              }
           }
        }
     }
     const tag = selectedElementProps.tagName;

     if (tag === 'line') {
       if (!el) return;
       const x1 = parseFloat(el.getAttribute('x1')) || 0;
       const y1 = parseFloat(el.getAttribute('y1')) || 0;
       const x2 = parseFloat(el.getAttribute('x2')) || 0;
       const y2 = parseFloat(el.getAttribute('y2')) || 0;
       
       const unscaledVal = parseFloat(val) / scale;
       
       if (targetAttr === 'width') {
         // Preserve direction if line was drawn right-to-left
         const direction = x2 >= x1 ? 1 : -1;
         updateElementAttribute(activePageIndex, selectedLayerId, 'x2', (x1 + direction * unscaledVal).toString());
       } else if (targetAttr === 'height') {
         // Preserve direction if line was drawn bottom-to-top
         const direction = y2 >= y1 ? 1 : -1;
         updateElementAttribute(activePageIndex, selectedLayerId, 'y2', (y1 + direction * unscaledVal).toString());
       }
       return;
     }

     if (tag === 'ellipse' || tag === 'circle') {
       const unscaledVal = parseFloat(val) / scale;
       if (targetAttr === 'width') {
         updateElementAttribute(activePageIndex, selectedLayerId, 'rx', (unscaledVal / 2).toString());
         // also try 'r' just in case it's a true circle without rx
         if (tag === 'circle' && el && el.hasAttribute('r')) updateElementAttribute(activePageIndex, selectedLayerId, 'r', (unscaledVal / 2).toString());
       } else if (targetAttr === 'height') {
         updateElementAttribute(activePageIndex, selectedLayerId, 'ry', (unscaledVal / 2).toString());
       }
       return;
     }

     if (tag === 'path' || tag === 'polygon' || tag === 'g') {
       if (!el) return;
       const bbox = el.getBBox();
       const targetVal = parseFloat(val);
       if (targetVal <= 0 || bbox.width === 0 || bbox.height === 0) return;

       if (targetAttr === 'width') {
         // Current world X of top-left
         const oldWorldX = bbox.x * m[0] + m[4];
         // New m[0] scale (preserve sign for flip)
         const newM0 = (m[0] >= 0 ? 1 : -1) * (targetVal / bbox.width);
         // New m[4] translation to keep top-left fixed
         const newM4 = oldWorldX - bbox.x * newM0;
         m[0] = newM0;
         m[4] = newM4;
       } else if (targetAttr === 'height') {
         // Current world Y of top-left
         const oldWorldY = bbox.y * m[3] + m[5];
         // New m[3] scale (preserve sign for flip)
         const newM3 = (m[3] >= 0 ? 1 : -1) * (targetVal / bbox.height);
         // New m[5] translation to keep top-left fixed
         const newM5 = oldWorldY - bbox.y * newM3;
         m[3] = newM3;
         m[5] = newM5;
       }
       
       updateElementAttribute(activePageIndex, selectedLayerId, 'transform', `matrix(${m.join(', ')})`);
       
       // Trigger overlay highlight update
       setTimeout(() => {
          if (typeof window.drawOverlayHighlight === 'function') {
             window.drawOverlayHighlight(el, 'selected');
          }
       }, 50);
       return;
     }

     const elementAttr = targetAttr;
     
     // Note: for a circle, 'val' is the diameter. We want the unscaled radius.
     // For other elements, 'val' is the width/height. We want the unscaled width/height.
     const finalVal = tag === 'circle' 
        ? (parseFloat(val) / 2 / scale).toString() 
        : (parseFloat(val) / scale).toString();
     
     updateElementAttribute(activePageIndex, selectedLayerId, elementAttr, finalVal);
  };

  // Close unit dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setIsUnitDropdownOpen(false);
      }
      if (interactionMenuRef.current && !interactionMenuRef.current.contains(e.target)) {
        setIsInteractionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with prop if provided, otherwise use local/localStorage
  useEffect(() => {
    if (activePreviewDeviceProp) setActivePreviewDevice(activePreviewDeviceProp);
  }, [activePreviewDeviceProp]);

  const handleDeviceChange = (device) => {
    setActivePreviewDevice(device);
    localStorage.setItem('previewDevice', device);
    window.dispatchEvent(new CustomEvent('previewDeviceChange', { detail: device }));
    setActivePreviewDeviceProp?.(device);
  };

  useEffect(() => {
    const handleGlobalDeviceChange = (e) => {
      setActivePreviewDevice(e.detail);
    };
    window.addEventListener('previewDeviceChange', handleGlobalDeviceChange);
    return () => window.removeEventListener('previewDeviceChange', handleGlobalDeviceChange);
  }, []);

  const presetColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#1f2937', '#000000',
    '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8',
    '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857',
    '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c',
    '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Switch to cursor tool instantly
    if (setActiveMainTool) {
      setActiveMainTool('select');
    }

    // Optional: Limit raw file size to 15MB
    if (file.size > 20 * 1024 * 1024) {
        alert("File is too large! Please upload images smaller than 20MB.");
        e.target.value = '';
        return;
    }

    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif';
    const isSvg = file.type === 'image/svg+xml';
    
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    if ((isVideo || isGif) && !user) {
      alert(`You must be logged in to upload ${isVideo ? 'videos' : 'GIFs'}.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;

      let finalUrl = dataUrl;
      // Skip compression for GIFs, SVGs, and Videos to preserve quality
      if (!isGif && !isSvg && !isVideo) {
        finalUrl = await compressImage(dataUrl);
      }

      if (isVideo) {
        window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
          detail: { videoUrl: finalUrl, pageIndex: activePageIndex, file, isTemporary: true }
        }));
      } else {
        // Dispatch event to MainEditor
        window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
          detail: { 
            dataUrl: finalUrl, 
            pageIndex: activePageIndex,
            dataType: isSvg ? 'svg' : (isGif ? 'gif' : 'image')
          }
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const compressImage = (dataUrl, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const isPng = dataUrl.startsWith('data:image/png');

        // If it's already small enough, no need to downscale
        if (width <= maxWidth && height <= maxHeight) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.75));
            return;
        }

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = dataUrl;
    });
  };

  const selectedElementProps = (() => {
    if (!selectedLayerId) return null;
    const page = pages[activePageIndex];
    if (page && page.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const el = doc.getElementById(selectedLayerId);
      
      const rootId = doc.querySelector('svg > g')?.id;
      const overlayId = doc.querySelector('[data-name="Overlay"]')?.id;
      const isPageSelected = !selectedLayerId || selectedLayerId === rootId || selectedLayerId === overlayId;
      
      if (el && !isPageSelected) {
        let w = '0', h = '0', x = '0', y = '0', r = '0';
        
        // --- IMPROVED DIMENSION LOGIC: Try actual DOM first for rendered accuracy ---
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        const actualEl = editorDoc.getElementById(selectedLayerId);
        if (actualEl && typeof actualEl.getBBox === 'function') {
           try {
              const bbox = actualEl.getBBox();
              w = bbox.width.toString();
              h = bbox.height.toString();
              x = bbox.x.toString();
              y = bbox.y.toString();
              
              // If there's a matrix transform, it usually handles position.
              // In this editor, interact.js uses matrix transforms for movement.
              const transform = actualEl.getAttribute('transform');
              if (transform && transform.includes('matrix')) {
                 const match = transform.match(/matrix\(([^)]+)\)/);
                 if (match) {
                    const m = match[1].split(/[\s,]+/).map(parseFloat);
                    // matrix(a, b, c, d, e, f) -> e, f are translation
                    if (m.length === 6) {
                       x = (parseFloat(x) + m[4]).toString();
                       y = (parseFloat(y) + m[5]).toString();
                       // Width/Height are already "local" to the matrix if we use getBBox(),
                       // but visual width/height should include scaling.
                       w = (parseFloat(w) * Math.abs(m[0])).toString();
                       h = (parseFloat(h) * Math.abs(m[3])).toString();
                    }
                 }
              }
           } catch (e) {
              console.warn("Failed to get BBox for element", e);
           }
        }

        // --- FALLBACK / OVERRIDE: Tags that have preferred source of truth ---
        if (el.tagName === 'rect') {
           // For simple rects, use attributes if transform is NOT present
           if (!el.getAttribute('transform')) {
              w = el.getAttribute('width') || w;
              h = el.getAttribute('height') || h;
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
           }
           r = el.getAttribute('rx') || '0';
        } else if (el.tagName === 'circle') {
           const radius = parseFloat(el.getAttribute('r')) || 0;
           w = (radius * 2).toString();
           h = w;
           // Use cx/cy for position if no matrix
           if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - radius).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - radius).toString();
           }
        } else if (el.tagName === 'ellipse') {
           const rx = parseFloat(el.getAttribute('rx')) || 0;
           const ry = parseFloat(el.getAttribute('ry')) || 0;
           w = (rx * 2).toString();
           h = (ry * 2).toString();
           if (!el.getAttribute('transform')) {
              x = (parseFloat(el.getAttribute('cx') || '0') - rx).toString();
              y = (parseFloat(el.getAttribute('cy') || '0') - ry).toString();
           }
        } else if (el.tagName === 'text') {
           // x/y on text is start position, bbox handles the rest
           if (!el.getAttribute('transform')) {
              x = el.getAttribute('x') || x;
              y = el.getAttribute('y') || y;
           }
        } else if (el.tagName === 'image' || el.tagName === 'path' || el.tagName === 'g') {
           // Fallback to width/height attributes if bbox failed or were zero
           if (parseFloat(w) === 0) w = el.getAttribute('width') || '0';
           if (parseFloat(h) === 0) h = el.getAttribute('height') || '0';
           if (parseFloat(x) === 0) x = el.getAttribute('x') || '0';
           if (parseFloat(y) === 0) y = el.getAttribute('y') || '0';
        }

        let fillStyle = el.getAttribute('fill') || '#000000';
        let strokeStyle = el.getAttribute('stroke') || 'none';
        let strokeWidthStr = el.getAttribute('stroke-width') || el.getAttribute('strokeWidth') || '0';

        if (el.tagName.toLowerCase() === 'foreignobject' && actualEl && actualEl.firstElementChild) {
          const comp = window.getComputedStyle(actualEl.firstElementChild);
          if (!el.hasAttribute('fill')) fillStyle = comp.color || fillStyle;
          if (!el.hasAttribute('stroke') && comp.webkitTextStrokeColor) strokeStyle = comp.webkitTextStrokeColor;
          if (!el.hasAttribute('stroke-width') && !el.hasAttribute('strokeWidth') && comp.webkitTextStrokeWidth) {
            strokeWidthStr = parseFloat(comp.webkitTextStrokeWidth).toString();
          }
          if (parseFloat(strokeWidthStr) === 0 || isNaN(parseFloat(strokeWidthStr)) || strokeStyle === 'transparent' || strokeStyle === 'rgba(0, 0, 0, 0)') {
            strokeStyle = 'none';
          }
        }

        const props = {
          id: selectedLayerId,
          tagName: el.tagName,
          fill: fillStyle,
          stroke: strokeStyle,
          strokeWidth: strokeWidthStr,
          strokeDasharray: el.getAttribute('stroke-dasharray') || 'none',
          opacity: el.getAttribute('opacity') || '1',
          fontSize: el.getAttribute('font-size') || '16',
          textAlign: el.getAttribute('text-anchor') || 'start',
          w: parseFloat(w),
          h: parseFloat(h),
          x: parseFloat(x),
          y: parseFloat(y),
          r: parseFloat(r),
          isGradient: fillStyle?.includes('url(#')
        };

        // Extract all custom attributes (gradients, etc.)
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('fill-') || attr.name.startsWith('stroke-') || attr.name.startsWith('data-') || attr.name === 'href' || attr.name.includes('href')) {
            props[attr.name] = attr.value;
          }
        });

        // Add a flag for image detection
        const dataType = el.getAttribute('data-type');
        const dataName = el.getAttribute('data-name');
        const fillValue = el.getAttribute('fill') || '';
        
        // Detect if it's a shape filled with a pattern containing an image
        let isPatternImage = false;
        if (fillValue.startsWith('url(#')) {
            const patternId = fillValue.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
                // Try finding the pattern in the document
                const pattern = doc.getElementById(patternId) || doc.querySelector(`pattern[id="${patternId}"], [id="${patternId}"]`);
                if (pattern) {
                    // Templates often use <use xlink:href="#imageId"> inside <pattern>
                    const hasUse = pattern.querySelector('use') !== null;
                    const hasImage = pattern.querySelector('image, img') !== null;
                    if (hasImage || hasUse) {
                        isPatternImage = true;
                    }
                }
            }
        }
        
        // Check if it's an image or a group containing an image (very common in templates)
        const hasImageChild = el.querySelector('image, img') !== null;
        const lowerTagName = props.tagName.toLowerCase();
        const lowerId = selectedLayerId?.toLowerCase() || '';
        const lowerDataName = dataName?.toLowerCase() || '';
        const src = el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('src') || '';
        const urlWithoutQuery = src.split('?')[0].toLowerCase();
        const isGifFile = urlWithoutQuery.endsWith('.gif') || dataType === 'gif' || src.toLowerCase().startsWith('data:image/gif');

        const isPdfBackground = lowerDataName.includes('pdf background') || lowerId.includes('background') || dataType === 'pdf-background';
        
        const isGif = isGifFile || lowerDataName.includes('gif') || lowerId.includes('gif') || el.getAttribute('data-is-gif-group') === 'true' || el.dataset?.mediaType === 'gif';

        const isImage = (lowerTagName.includes('image') || 
                        lowerTagName === 'img' || 
                        dataType === 'image' ||
                        lowerDataName.includes('image') ||
                        lowerId.includes('image') || 
                        !!(el.getAttribute('href') || el.getAttribute('xlink:href')) ||
                        (lowerTagName === 'g' && hasImageChild) ||
                        isPatternImage) && !isGif && !isPdfBackground;

        const isVideo = lowerTagName === 'video' || lowerTagName === 'iframe' || dataType === 'video' || lowerDataName.includes('video') || lowerId.includes('video') || (lowerTagName === 'foreignobject' && el.querySelector('video, iframe'));
        const isText = (lowerTagName === 'text' || lowerTagName === 'tspan' || (lowerTagName === 'foreignobject' && !isVideo)) || dataType === 'text' || lowerDataName.includes('text') || lowerId.includes('text');
        const isIcon = dataType === 'icon' || lowerDataName.includes('icon') || lowerId.includes('icon') || lowerTagName.includes('lucide') || el.classList.contains('lucide') || el.classList.contains('iconify');

        props.isImage = isImage;
        props.isText = isText;
        props.isVideo = isVideo;
        props.isGif = isGif;
        props.isIcon = isIcon;
        props.isPdfBackground = isPdfBackground;

        return props;
      }
    }
    return null;
  })();

  return (
    <div 
      className="bg-white border-l border-[#EEEEEE] flex flex-col overflow-hidden select-none flex-shrink-0 h-[92vh]"
      style={{ width: '24vw' }}
      onMouseDown={() => {
        if (activeMainTool === 'grid' && typeof setActiveMainTool === 'function') {
          setActiveMainTool('select');
        }
      }}
    >
      {activeMainTool === 'grid' && (
        <IconGallery 
          isOpen={true}
          onClose={() => setActiveMainTool('select')} 
          onSelect={(icon) => {
            window.dispatchEvent(new CustomEvent('add-icon-to-editor', {
              detail: {
                pageIndex: activePageIndex,
                icon: icon
              }
            }));
          }}
        />
      )}
      {/* ================= Popup Apply/Cancel Banner ================= */}
      {isPopupEditor && (
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-[1.5vw] flex items-center justify-between" style={{ height: '8.5vh' }}>
          <span className="text-[0.75vw] text-gray-500 font-medium flex items-center gap-[0.2vw]">
            Click <span className="text-[#22C55E] font-bold text-[0.8vw] mx-[0.1vw]">(✓)</span> to apply changes
          </span>
          <div className="flex items-center gap-[0.5vw]">
            <button
              onClick={onApplyPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-[#22C55E] hover:bg-[#16a34a] text-white rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Apply Changes"
            >
              <Icon icon="lucide:check" width="1.1vw" strokeWidth={3} />
            </button>
            <button
              onClick={onCancelPopupChanges}
              className="flex items-center justify-center w-[2vw] h-[2vw] bg-white border border-[#EF4444] hover:bg-red-50 text-[#EF4444] rounded-[0.4vw] transition-colors shadow-sm cursor-pointer"
              title="Cancel"
            >
              <Icon icon="lucide:x" width="1.1vw" />
            </button>
          </div>
        </div>
      )}
      {/* ================= Display Controls (Header Section) ================= */}
      {!isPopupEditor && !is3DModalOpen && (
      <div className="border-b border-gray-100 bg-gray-50 flex-shrink-0 flex flex-col justify-center px-[1.5vw] space-y-[0.5vh]" style={{ height: '8.5vh' }}>
         {/* Double Page & Ruler Toggle Row */}
          <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-[0.6vw]">
                  <div 
                     onClick={() => setIsDoublePage(!isDoublePage)}
                     className={`w-[2.6vw] h-[1.4vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isDoublePage ? 'bg-[#5145F6]' : 'bg-gray-200'} border-[0.1vw] border-transparent scale-90`}
                  >
                     <div className={`absolute top-[0.1vw] w-[1.1vw] h-[1.1vw] bg-white rounded-full transition-all duration-300 shadow-sm ${isDoublePage ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}></div>
                  </div>
                  <span className="text-gray-700 font-medium text-[0.8vw]">Double Page</span>
              </div>
              <div className="flex items-center gap-[0.6vw]">
                  <div 
                     onClick={() => setIsRulerEnabled(!isRulerEnabled)}
                     className={`w-[2.6vw] h-[1.4vw] rounded-full relative cursor-pointer transition-colors duration-300 ${isRulerEnabled ? 'bg-[#5145F6]' : 'bg-gray-200'} border-[0.1vw] border-transparent scale-90`}
                  >
                     <div className={`absolute top-[0.1vw] w-[1.1vw] h-[1.1vw] bg-white rounded-full transition-all duration-300 shadow-sm ${isRulerEnabled ? 'left-[1.3vw]' : 'left-[0.1vw]'}`}></div>
                  </div>
                  <span className="text-gray-700 font-medium text-[0.8vw]">Ruler</span>
              </div>
         </div>
      </div>
      )}

      {/* Persistent Dimension Section (Common for all) */}
      {!is3DModalOpen && (
        <div className="bg-[#f6f6f6] px-[1.5vw] py-[0.8vw] border-b border-gray-100 flex-shrink-0">
          <div className="space-y-[0.8vw]">
            <div className="flex items-center gap-[0.4vw]">
               <div className="relative" ref={unitRef}>
                  <div className="flex items-center gap-[0.3vw] rounded-[0.3vw]">
                     <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Dimension in mm</span>
                  </div>
                </div>
                <div className="h-px flex-grow bg-gray-200"></div>
             </div>

            <div className="flex flex-col gap-[1vw] pl-[1vw]">
               {/* Position Row */}
               <div className="flex items-center gap-[2vw]">
                  <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Position :</span>
                  <div className="flex items-center gap-[1.5vw]">
                      {/* X Input */}
                      <div className="flex items-center gap-[0.2vw]">
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronLeft 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.x || 0) - 1;
                                   updatePosition(val.toString(), 'x');
                                }}
                             />
                          ) : (
                             <ChevronLeft size="0.85vw" className="text-transparent" />
                          )}
                          <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                             <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">X</span>
                             <DimensionInput 
                                targetId={selectedLayerId}
                                targetAttr="x"
                                className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                                value={convertValue(selectedElementProps?.x || 0)}
                                readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                                onChange={(val) => updatePosition(val, 'x')}
                             />
                          </div>
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronRight 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.x || 0) + 1;
                                   updatePosition(val.toString(), 'x');
                                }}
                             />
                          ) : (
                             <ChevronRight size="0.85vw" className="text-transparent" />
                          )}
                      </div>

                      {/* Y Input */}
                      <div className="flex items-center gap-[0.2vw]">
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronLeft 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.y || 0) - 1;
                                   updatePosition(val.toString(), 'y');
                                }}
                             />
                          ) : (
                             <ChevronLeft size="0.85vw" className="text-transparent" />
                          )}
                          <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                             <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">Y</span>
                             <DimensionInput 
                                targetId={selectedLayerId}
                                targetAttr="y"
                                className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                                value={convertValue(selectedElementProps?.y || 0)}
                                readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                                onChange={(val) => updatePosition(val, 'y')}
                             />
                          </div>
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronRight 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.y || 0) + 1;
                                   updatePosition(val.toString(), 'y');
                                }}
                             />
                          ) : (
                             <ChevronRight size="0.85vw" className="text-transparent" />
                          )}
                      </div>
                  </div>
               </div>

               {/* Resizing Row */}
               <div className="flex items-center gap-[2vw]">
                  <span className="text-[0.9vw] font-medium text-gray-800 whitespace-nowrap w-[4vw]">Resizing :</span>
                  <div className="flex items-center gap-[1.5vw]">
                      {/* W Input */}
                      <div className="flex items-center gap-[0.2vw]">
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronLeft 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.w || 0) - 1;
                                   updateDimensionWithScale(val.toString(), 'width');
                                }}
                             />
                          ) : (
                             <ChevronLeft size="0.85vw" className="text-transparent" />
                          )}
                          <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                             <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">W</span>
                             <DimensionInput 
                                targetId={selectedLayerId}
                                targetAttr="width"
                                className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                                value={convertValue(selectedElementProps?.w || flipbookDimensions.width)}
                                readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                                onChange={(val) => updateDimensionWithScale(val, 'width')}
                             />
                          </div>
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronRight 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.w || 0) + 1;
                                   updateDimensionWithScale(val.toString(), 'width');
                                }}
                             />
                          ) : (
                             <ChevronRight size="0.85vw" className="text-transparent" />
                          )}
                      </div>

                      {/* H Input */}
                      <div className="flex items-center gap-[0.2vw]">
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronLeft 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.h || 0) - 1;
                                   updateDimensionWithScale(val.toString(), 'height');
                                }}
                             />
                          ) : (
                             <ChevronLeft size="0.85vw" className="text-transparent" />
                          )}
                          <div className={`w-[4.5vw] h-[1.8vw] border border-gray-300 rounded-[0.4vw] flex items-center shadow-sm ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'bg-gray-100' : 'bg-white'}`}>
                             <span className="text-gray-500 font-medium text-[0.8vw] ml-[0.5vw]">H</span>
                             <DimensionInput 
                                targetId={selectedLayerId}
                                targetAttr="height"
                                className={`w-full text-center bg-transparent outline-none text-[0.85vw] font-semibold ${(!selectedElementProps || selectedElementProps.isPdfBackground) ? 'text-gray-400 cursor-not-allowed' : 'text-[#111827]'}`}
                                value={convertValue(selectedElementProps?.h || flipbookDimensions.height)}
                                readOnly={!selectedElementProps || selectedElementProps.isPdfBackground}
                                onChange={(val) => updateDimensionWithScale(val, 'height')}
                             />
                          </div>
                          {selectedElementProps && !selectedElementProps.isPdfBackground ? (
                             <ChevronRight 
                                size="0.85vw" 
                                className="text-gray-400 cursor-pointer hover:text-[#5145F6] transition-colors" 
                                onClick={() => {
                                   const val = parseFloat(selectedElementProps.h || 0) + 1;
                                   updateDimensionWithScale(val.toString(), 'height');
                                }}
                             />
                          ) : (
                             <ChevronRight size="0.85vw" className="text-transparent" />
                          )}
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-[#fbfbfb]">
        {is3DModalOpen ? (
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
            <Model3DEditor
              onClose={() => setIs3DModalOpen(false)}
              shadowStrength={shadowStrength} setShadowStrength={setShadowStrength}
              shadowSoftness={shadowSoftness} setShadowSoftness={setShadowSoftness}
              autoRotate={autoRotate} setAutoRotate={setAutoRotate}
              autoRotateSpeed={autoRotateSpeed} setAutoRotateSpeed={setAutoRotateSpeed}
              lockMaxZoom={lockMaxZoom} setLockMaxZoom={setLockMaxZoom}
              maxZoom={maxZoom} setMaxZoom={setMaxZoom}
              bgType={bgType} setBgType={setBgType}
              bgColor={bgColor} setBgColor={setBgColor}
              customBg={customBg} setCustomBg={setCustomBg}
              enableAR={enableAR} setEnableAR={setEnableAR}
              qrText={qrText} setQrText={setQrText} qrColor={qrColor} setQrColor={setQrColor} qrBgType={qrBgType} setQrBgType={setQrBgType} qrBgColor={qrBgColor} setQrBgColor={setQrBgColor} qrLevel={qrLevel} setQrLevel={setQrLevel} qrDotType={qrDotType} setQrDotType={setQrDotType} qrCornerSquareType={qrCornerSquareType} setQrCornerSquareType={setQrCornerSquareType} qrCornerDotType={qrCornerDotType} setQrCornerDotType={setQrCornerDotType} qrLogo={qrLogo} setQrLogo={setQrLogo}
              topText={topText} setTopText={setTopText} bottomText={bottomText} setBottomText={setBottomText}
              dataUrl={preview3DDataUrl}
            />
          </div>
        ) : activeTopTool === 'editor' ? (
          activeMainTool === 'upload' ? (
            <div className="p-[1.5vw] flex flex-col gap-[3.5vh]">
              <div className="flex flex-col gap-[2.5vh]">
                <div className="flex items-center gap-[0.75vw]">
                  <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Upload Files</span>
                  <div className="h-[0.1vw] flex-1 bg-gray-300 opacity-50"></div>
                </div>
                <div
                  onClick={handleUploadClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileChange({ target: { files: files } });
                    }
                  }}
                  className="w-full h-[10vw] border-2 border-dashed rounded-[1.25vw] bg-white flex flex-col items-center justify-center p-[1vw] transition-all group shadow-sm border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*,audio/*,.gif,.svg" 
                    onChange={handleFileChange} 
                  />
                  <div className="text-[0.75vw] font-semibold text-gray-500 mb-[1.5vw] tracking-tight">
                    Drag & Drop or <span className="text-blue-600 font-bold">Upload</span>
                  </div>
                  <div className="mb-[1.5vw] transition-colors text-gray-400 group-hover:text-blue-500">
                    <Icon icon="heroicons:arrow-up-tray" width="2vw" />
                  </div>
                  <div className="text-center">
                    <div className="text-[0.65vw] font-bold text-gray-600 uppercase tracking-wide mb-[0.25vw]">Supported File</div>
                    <div className="text-[0.55vw] text-gray-400 leading-relaxed uppercase max-w-[12vw] font-medium text-center">Image, Video, Audio, GIF, SVG</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
              {isPdfProject ? (
                <InteractionPanel 
                  selectedElementProps={selectedElementProps}
                  activePageIndex={activePageIndex}
                  selectedLayerId={selectedLayerId}
                  updateElementAttribute={updateElementAttribute}
                  deleteLayer={deleteLayer}
                  pages={pages}
                  flipbookDimensions={flipbookDimensions}
                  onCustomizePopup={onCustomizePopup}
                  setIs3DModalOpen={setIs3DModalOpen}
                  setCurrent3DItem={setCurrent3DItem}
                />
              ) : (
                <div className="flex flex-col p-[1.5vw] gap-[1.5vw]">
                  {(selectedElementProps || activeMainTool === 'grid') ? (
                    <div className="flex flex-col gap-[1.5vw]">
                      {selectedElementProps?.isImage ? (
                        <ImageEditor 
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) {
                                  const canvasContent = container.querySelector('[id^="canvas-content-"]');
                                  return canvasContent ? canvasContent.querySelector('svg') : container.querySelector('svg');
                                }
                                
                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName={location.state?.folderName || folder || 'Recent Book'}
                          flipbookName={location.state?.flipbookName || 'Untitled Flipbook'}
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : selectedElementProps?.isText ? (
                        <TextEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            const el = editorDoc.getElementById(selectedLayerId);
                            if (!el) return null;
                            const tag = el.tagName?.toLowerCase();
                            // foreignObject wraps the actual HTML text container — drill into it
                            if (tag === 'foreignobject') {
                              return el.querySelector('[contenteditable], div, p, span') || el;
                            }
                            return el;
                          })()}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');
                                
                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex);
                              }
                            }
                          }}
                          pages={pages}
                          setPages={setPages}
                          activePageIndex={activePageIndex}
                        />
                      ) : selectedElementProps?.isVideo ? (
                        <VideoEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          activePageIndex={activePageIndex}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');
                                
                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          currentPageVId={pages[activePageIndex]?.v_id || pages[activePageIndex]?.id || ''}
                          folderName="My Flipbooks"
                          flipbookName="Untitled"
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : selectedElementProps?.isGif ? (
                        <GifEditor
                          selectedElement={(() => {
                            const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
                            return editorDoc.getElementById(selectedLayerId);
                          })()}
                          selectedLayerId={selectedLayerId}
                          onUpdate={(newHtml) => {
                            window.__skipCanvasUpdateForPage = activePageIndex;
                            if (typeof newHtml === 'string') {
                              updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', newHtml);
                            } else {
                              const svgRoot = (() => {
                                const el = document.getElementById(selectedLayerId);
                                if (!el) return null;
                                const container = el.closest('.page-svg-container');
                                if (container) return container.querySelector('svg');
                                
                                let node = el;
                                let lastSvg = null;
                                while (node) {
                                  if (node.tagName?.toLowerCase() === 'svg') lastSvg = node;
                                  node = node.parentElement;
                                }
                                return lastSvg;
                              })();
                              if (svgRoot) {
                                const serializer = new XMLSerializer();
                                const html = serializer.serializeToString(svgRoot);
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
                              } else {
                                updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', null);
                              }
                            }
                          }}
                          pages={pages}
                          activePageIndex={activePageIndex}
                          onDeleteLayer={() => deleteLayer?.(activePageIndex, selectedLayerId)}
                        />
                      ) : (
                        <ShapeProperties 
                           selectedElementProps={selectedElementProps || { 
                             fill: '#6366F1', 
                             opacity: '1', 
                             stroke: 'none', 
                             strokeWidth: '0', 
                             tagName: 'g',
                             isIcon: true 
                           }}
                           activePageIndex={activePageIndex}
                           selectedLayerId={selectedLayerId}
                           updateElementAttribute={updateElementAttribute}
                         />
                      )}
                    </div>
                  ) : (
                    /* Page Properties (Default View) */
                    (() => {
                      const page = pages[activePageIndex];
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(page?.html || '', 'image/svg+xml');
                      const overlay = doc.querySelector('[data-name="Overlay"]');
                      const currentBg = overlay?.getAttribute('fill') || '#ffffff';
                      const fillType = overlay?.getAttribute('fill-type') || 'solid';
                      
                      let currentBgStr = currentBg;
                      if (fillType === 'gradient' || currentBg.toLowerCase().includes('url(#')) {
                        const stopsJson = overlay?.getAttribute('fill-stops');
                        const stops = stopsJson ? JSON.parse(stopsJson) : [];
                        const gType = overlay?.getAttribute('fill-gradient-type') || 'linear';
                        if (stops.length > 0) {
                          currentBgStr = generateGradientString(
                            gType.charAt(0).toUpperCase() + gType.slice(1),
                            stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
                            parseInt(overlay?.getAttribute('fill-angle') || '0'),
                            parseInt(overlay?.getAttribute('fill-radius') || '100')
                          );
                        }
                      }

                      return (
                        <div className="flex flex-col gap-[3vh]">
                          <div className="flex flex-col gap-[1.5vh]">
                            <div className="flex items-center gap-[0.75vw]">
                              <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
                                Page Background
                              </span>
                              <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                            </div>

                            <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm">
                              <div className="flex items-center justify-between mb-[1.5vh]">
                                <span className="text-[0.75vw] text-gray-500 font-medium">Background Color</span>
                                <div 
                                  className="flex items-center gap-[0.5vw] cursor-pointer hover:bg-gray-50 p-[0.3vw] rounded-[0.4vw] transition-colors"
                                  onClick={() => setIsPageBgPickerOpen(!isPageBgPickerOpen)}
                                >
                                  <div className="w-[1.2vw] h-[1.2vw] rounded-full border border-gray-200 shadow-inner flex-shrink-0" style={{ background: currentBgStr }} />
                                  <span className="text-[0.7vw] font-mono text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap max-w-[8vw]">
                                    {currentBgStr.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-8 gap-[0.4vw]">
                                {presetColors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => {
                                      updateElementAttribute(activePageIndex, 'Overlay', {
                                        'fill-type': 'solid',
                                        'fill': color
                                      });
                                    }}
                                    className={`w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-100 transition-all hover:scale-110 shadow-sm ${currentBg.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-blue-500 scale-110 z-10 ring-offset-1' : 'hover:z-10'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              
                              {isPageBgPickerOpen && createPortal(
                                <div
                                  className="fixed z-[5000]"
                                  style={{
                                    top: '50%',
                                    right: '19.5vw', // Left of the right sidebar
                                    transform: 'translateY(-50%)'
                                  }}
                                >
                                  <div className="animate-in fade-in zoom-in-95 duration-200 relative">
                                    <ColorPicker
                                      color={currentBgStr}
                                      onChange={(newVal) => {
                                        if (newVal.includes('gradient')) {
                                          const parsed = parseGradient(newVal);
                                          if (parsed) {
                                            updateElementAttribute(activePageIndex, 'Overlay', {
                                              'fill-type': 'gradient',
                                              'fill-gradient-type': parsed.type.toLowerCase(),
                                              'fill-stops': JSON.stringify(parsed.stops.map(s => ({
                                                color: s.color,
                                                offset: s.offset,
                                                opacity: s.opacity / 100
                                              }))),
                                              'fill-angle': (parsed.angle || 0).toString(),
                                              'fill-radius': (parsed.radius || 100).toString(),
                                              'fill': newVal
                                            });
                                          }
                                        } else {
                                          updateElementAttribute(activePageIndex, 'Overlay', {
                                            'fill-type': 'solid',
                                            'fill': newVal
                                          });
                                        }
                                      }}
                                      opacity={100}
                                      onClose={() => setIsPageBgPickerOpen(false)}
                                    />
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-[1.5vh]">
                            <div className="flex items-center gap-[0.75vw]">
                              <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">Document info</span>
                              <div className="h-[0.1vw] flex-1 bg-gray-200"></div>
                            </div>
                            <div className="bg-white rounded-[0.8vw] border border-gray-200 p-[1vw] shadow-sm flex flex-col gap-[1vh]">
                              <div className="flex justify-between items-center text-[0.75vw]">
                                <span className="text-gray-500 font-medium">Format</span>
                                <span className="text-gray-900 font-semibold">Custom Sheet</span>
                              </div>
                              <div className="flex justify-between items-center text-[0.75vw]">
                                <span className="text-gray-500 font-medium">Dimensions</span>
                                <span className="text-gray-900 font-semibold">{Math.round(baseWidth)} x {Math.round(baseHeight)} mm</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          )
        ) : activeTopTool === 'interaction' ? (
          <InteractionPanel 
            selectedElementProps={selectedElementProps}
            activePageIndex={activePageIndex}
            selectedLayerId={selectedLayerId}
            updateElementAttribute={updateElementAttribute}
            deleteLayer={deleteLayer}
            pages={pages}
            flipbookDimensions={flipbookDimensions}
            onCustomizePopup={onCustomizePopup}
            setIs3DModalOpen={setIs3DModalOpen}
            setCurrent3DItem={setCurrent3DItem}
          />

        ) : (
          /* Animation Mode */
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-[1.5vw]">
            <AnimationPanel 
               selectedElementProps={selectedElementProps}
               flipbookDimensions={flipbookDimensions}
               selectedLayerId={selectedLayerId}
               selectedElement={(() => {
                 if (!selectedLayerId) return null;
                 const container = document.querySelector(`.page-svg-container [id="${selectedLayerId}"]`);
                 if (container) return container;
                 return document.getElementById(selectedLayerId) || null;
               })()}
               onUpdate={(elementId, attr, value) => {
                  if (elementId && attr) {
                      updateElementAttribute(activePageIndex, elementId, attr, value);
                  }
               }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;