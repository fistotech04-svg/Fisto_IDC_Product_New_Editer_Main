import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { createPortal } from 'react-dom';
import ColorPicker, { parseGradient } from './ColorPicker';
import { generateGradientString } from "../CustomizedEditor/AppearanceShared";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X, Pipette } from 'lucide-react';

const DashInput = ({ label, initialValue, onChange }) => {
  const [localVal, setLocalVal] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const displayVal = isFocused ? localVal : initialValue;

  const handleManualInput = (val) => {
    setLocalVal(val);
    const num = parseInt(val);
    if (!isNaN(num)) {
      onChange(Math.max(1, num));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseInt(localVal);
    if (isNaN(num) || num < 1) num = 1;
    onChange(num);
  };

  const handleFocus = () => {
    setLocalVal(initialValue);
    setIsFocused(true);
  };

  const safeNumericVal = parseInt(initialValue) || 1;

  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[0.75vw] font-semibold text-gray-600 cursor-ew-resize select-none hover:text-indigo-600 transition-colors"
        onPointerDown={(e) => handleScrubHelper(e, safeNumericVal, (v) => onChange(Math.max(1, parseInt(v))))}
      >{label} :</span>
      <div
        className="flex items-center gap-[0.4vw] h-[2vw] cursor-ew-resize select-none"
        onPointerDown={(e) => {
          if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;
          handleScrubHelper(e, safeNumericVal, (newVal) => onChange(Math.max(1, parseInt(newVal))));
        }}
      >
        <button onPointerDown={(e) => { e.stopPropagation(); onChange(Math.max(1, safeNumericVal - 1)); }} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronLeft size="0.9vw" /></button>
        <div className="w-[3.5vw] h-full border border-gray-200 rounded-[0.3vw] flex items-center justify-center bg-white shadow-sm pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={displayVal === '' ? '' : displayVal}
            onChange={(e) => handleManualInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-center text-[0.75vw] font-semibold text-gray-700 outline-none no-spin bg-transparent cursor-text"
          />
        </div>
        <button onPointerDown={(e) => { e.stopPropagation(); onChange(Math.max(1, safeNumericVal + 1)); }} className="text-gray-400 hover:text-indigo-600 pointer-events-auto"><ChevronRight size="0.9vw" /></button>
      </div>
    </div>
  );
};

export const handleScrubHelper = (e, initialVal, updateFn, sensitivity = 5) => {
  const sValue = parseFloat(initialVal) || 0;
  let accumulatedDelta = 0;
  let virtualX = e.clientX;
  let virtualY = e.clientY;

  document.body.classList.add('is-scrubbing');

  if (e.pointerId !== undefined) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
  }

  const vCursor = document.createElement('div');
  vCursor.className = 'virtual-scrub-cursor';
  vCursor.style.left = `${virtualX}px`;
  vCursor.style.top = `${virtualY}px`;
  vCursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L21 12L18 9" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 15L21 12L18 9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 9L3 12L6 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 12H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  document.body.appendChild(vCursor);

  const onMouseMove = (moveEvent) => {
    const dx = moveEvent.movementX || 0;
    accumulatedDelta += dx;

    virtualX += dx;
    if (virtualX < 0) virtualX = window.innerWidth;
    if (virtualX > window.innerWidth) virtualX = 0;
    vCursor.style.left = `${virtualX}px`;

    const newVal = sValue + Math.round(accumulatedDelta / sensitivity);
    updateFn(newVal.toString());
  };

  const onMouseUp = (moveEvent) => {
    if (moveEvent.pointerId !== undefined) {
      try { moveEvent.target.releasePointerCapture(moveEvent.pointerId); } catch (e) { }
    }
    if (vCursor.parentNode) vCursor.parentNode.removeChild(vCursor);
    document.body.classList.remove('is-scrubbing');
    window.removeEventListener('pointermove', onMouseMove);
    window.removeEventListener('pointerup', onMouseUp);
  };

  window.addEventListener('pointermove', onMouseMove);
  window.addEventListener('pointerup', onMouseUp);
};

export const ColorField = ({ label, color, opacity, onColorChange, onOpacityChange, onPickerToggle, baseAttr, selectedElementProps }) => (
  <div className="flex items-center gap-[0.4vw] py-[0.4vw]">
    <span className="text-[0.85vw] font-semibold text-gray-700 min-w-[3vw]">{label} :</span>
    <div
      className="w-[2.5vw] h-[2.5vw] rounded-[0.75vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center"
    >
      <div
        onClick={onPickerToggle}
        className="w-full h-full border border-gray-200 cursor-pointer color-field-trigger transition-transform flex-shrink-0"
        style={{
          background: (color === 'none' || color === 'transparent' || color === '#' || !color)
            ? 'white'
            : (color.toString().toLowerCase().includes('url(#')
              ? (selectedElementProps && selectedElementProps[`${baseAttr}-stops`]
                ? `linear-gradient(to right, ${JSON.parse(selectedElementProps[`${baseAttr}-stops`]).map(s => s.color).join(', ')})`
                : '#ccc')
              : color)
        }}
      />
      {(color === 'none' || color === 'transparent' || color === '#' || !color) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
      )}
    </div>

    <div className="flex-grow flex items-center border-[0.1vw] border-gray-400 rounded-[0.75vw] overflow-hidden h-[2.5vw] bg-white hover:border-indigo-400 transition-colors px-[0.7vw]">
      <input
        type="text"
        value={(color === 'none' || color === 'transparent' || !color) ? '#' : color?.toUpperCase()}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '' || val === '#') {
            onColorChange('none');
          } else {
            const finalVal = val.startsWith('#') ? val : '#' + val;
            onColorChange(finalVal);
          }
        }}
        className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] font-mono tracking-tight"
        maxLength={7}
      />
      <div
        className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
        onPointerDown={(e) => {
          const currentPct = Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100);
          handleScrubHelper(e, currentPct, (val) => {
            const num = parseInt(val);
            const clamped = Math.min(Math.max(num, 0), 100);
            onOpacityChange(clamped / 100);
          });
        }}
      >
        <span className="text-[0.75vw] font-semibold text-gray-700">
          {Math.round(parseFloat(opacity !== undefined ? opacity : 1) * 100)}
        </span>
        <span className="text-[0.75vw] font-medium text-gray-500">%</span>
      </div>
    </div>
  </div>
);

const Color = ({
  openSubSection, setOpenSubSection,
  backgroundColor: externalBackgroundColor, setBackgroundColor: setExternalBackgroundColor,
  activeColorPicker: externalActiveColorPicker, setActiveColorPicker: setExternalActiveColorPicker,
  showStrokeSettings, setShowStrokeSettings,
  isStrokeStyleOpen, setIsStrokeStyleOpen,
  dropdownPos, setDropdownPos,
  strokeSettingsPos, setStrokeSettingsPos,
  isDashPosOpen, setIsDashPosOpen,
  colorsOnPage,
  showDetailedPicker, setShowDetailedPicker,
  hideFill = false,
  standaloneMode = false,
  selectedElement = null,
  onUpdate = null,
  isText = false,
  ...props
}) => {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // --- Standalone Mode State ---
  const [internalBackgroundColor, setInternalBackgroundColor] = useState({
    fill: 'transparent',
    fillOpacity: 100,
    stroke: 'transparent',
    strokeOpacity: 100,
    strokeWeight: 0,
    strokeDashStyle: 'Solid',
    strokePosition: 'Center',
    strokeLinecap: 'butt'
  });
  const [internalActiveColorPicker, setInternalActiveColorPicker] = useState(null);

  const backgroundColor = standaloneMode ? internalBackgroundColor : externalBackgroundColor;
  const setBackgroundColor = standaloneMode ? setInternalBackgroundColor : setExternalBackgroundColor;

  const activeColorPicker = standaloneMode ? internalActiveColorPicker : externalActiveColorPicker;
  const setActiveColorPicker = standaloneMode ? setInternalActiveColorPicker : setExternalActiveColorPicker;

  // Initialize state from DOM when in standalone mode
  useEffect(() => {
    if (!standaloneMode || !selectedElement) return;
    const el = selectedElement;

    // Parse Fill
    let fill = el.getAttribute('data-fill-color') || el.getAttribute('fill') || 'transparent';
    const fillOpacity = parseFloat(el.getAttribute('data-fill-opacity') || el.getAttribute('fill-opacity') || '1') * 100;

    // Parse Stroke
    const stroke = el.getAttribute('data-stroke-color') || el.getAttribute('stroke') || 'transparent';
    const strokeOpacity = parseFloat(el.getAttribute('data-stroke-opacity') || el.getAttribute('stroke-opacity') || '1') * 100;
    const strokeWeight = parseFloat(el.getAttribute('data-stroke-width') || el.getAttribute('stroke-width') || '0');

    const strokeArray = el.getAttribute('data-stroke-dasharray') || el.getAttribute('stroke-dasharray') || 'none';
    const dashStyle = strokeArray === 'none' ? 'Solid' : 'Dashed';

    let dashLen = 10, dashGap = 10;
    if (strokeArray !== 'none' && strokeArray !== '') {
      const parts = strokeArray.split(',');
      const parsedLen = parseInt(parts[0]);
      dashLen = isNaN(parsedLen) ? 10 : parsedLen;
      const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
      dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
    }

    setInternalBackgroundColor(prev => ({
      ...prev,
      fill,
      fillOpacity,
      stroke,
      strokeOpacity,
      strokeWeight,
      strokeDashStyle: dashStyle,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: el.getAttribute('data-stroke-position') || 'Center',
      strokeLinecap: el.getAttribute('stroke-linecap') || 'butt'
    }));
  }, [selectedElement, standaloneMode]);

  // Apply visual updates directly to DOM in standalone mode
  useEffect(() => {
    if (!standaloneMode || !selectedElement) return;

    const applyColorsToDOM = () => {
      const el = selectedElement;
      const isSvgEl = el.namespaceURI === "http://www.w3.org/2000/svg";
      const isImage = el.tagName?.toLowerCase() === 'image' || el.tagName?.toLowerCase() === 'g';

      // Apply Fill
      if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') {
        el.setAttribute('data-fill-color', backgroundColor.fill);
        el.setAttribute('data-fill-opacity', (backgroundColor.fillOpacity / 100).toString());

        const isGradient = backgroundColor.fill.includes('gradient');

        if (!isImage) {
          if (!isGradient) el.setAttribute('fill', backgroundColor.fill);
          el.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
        } else {
          // --- Fast path: directly patch existing SVG gradient stops ---
          // If a gradient fill layer already exists with a url(#...) fill, we update
          // the <stop> elements directly in the SVG defs. This completely bypasses the
          // MutationObserver -> React re-render cycle for real-time color drag updates.
          let fillFastPathDone = false;
          let fillLayer = el.querySelector('.image-fill-layer') || el.querySelector('.video-fill-layer') || el.querySelector('.gif-fill-layer');
          if (isGradient && fillLayer) {
            const existingFill = fillLayer.getAttribute('fill') || '';
            if (existingFill.startsWith('url(#')) {
              const gradId = existingFill.match(/url\(#([^)]+)\)/)?.[1];
              const svgRoot = el.closest('svg');
              const gradEl = gradId && svgRoot ? svgRoot.querySelector(`#${gradId}`) : null;
              if (gradEl) {
                const parsed = parseGradient(backgroundColor.fill);
                const existingStops = Array.from(gradEl.querySelectorAll('stop'));

                const isTargetLinear = parsed?.type?.toLowerCase() === 'linear';
                const isCurrentLinear = gradEl.tagName.toLowerCase() === 'lineargradient';

                if (parsed && isTargetLinear === isCurrentLinear && parsed.stops.length > 0 && parsed.stops.length === existingStops.length) {
                  // Same stop count and same type — just update colors and angle/radius in-place (fastest path, no React cycle)
                  parsed.stops.forEach((ns, i) => {
                    existingStops[i].setAttribute('stop-color', ns.color);
                    existingStops[i].setAttribute('stop-opacity', (ns.opacity !== undefined ? ns.opacity / 100 : 1).toString());
                  });

                  // Update angle/radius
                  if (parsed.type.toLowerCase() === 'linear') {
                    const angleRad = ((parsed.angle || 0) * Math.PI) / 180;
                    const dx = Math.sin(angleRad) * 50;
                    const dy = -Math.cos(angleRad) * 50;
                    gradEl.setAttribute('x1', Math.round(50 - dx) + '%');
                    gradEl.setAttribute('y1', Math.round(50 - dy) + '%');
                    gradEl.setAttribute('x2', Math.round(50 + dx) + '%');
                    gradEl.setAttribute('y2', Math.round(50 + dy) + '%');
                  } else {
                    const radius = parsed.radius || 50;
                    gradEl.setAttribute('r', radius + '%');
                    gradEl.setAttribute('cx', '50%');
                    gradEl.setAttribute('cy', '50%');
                  }

                  fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());

                  // Only skip onUpdate and data-fill-color during active drag to prevent lag.
                  // If it's a preset click or drag has finished, we must sync state!
                  if (!isDraggingRef.current) {
                    el.setAttribute('data-fill-color', backgroundColor.fill);
                  }

                  fillFastPathDone = true;
                }
              }
            }
          }
          // Fallback / slow path: non-gradient fill or first-time gradient application
          if (!fillFastPathDone) {
            if (fillLayer) {
              if (!isGradient) fillLayer.setAttribute('fill', backgroundColor.fill);
              fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
            } else if (isImage) {
              // Basic fallback if layer missing
              fillLayer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              fillLayer.classList.add('image-fill-layer');
              fillLayer.style.pointerEvents = 'none';
              if (!isGradient) fillLayer.setAttribute('fill', backgroundColor.fill);
              fillLayer.setAttribute('fill-opacity', (backgroundColor.fillOpacity / 100).toString());
              // Insert at beginning
              el.insertBefore(fillLayer, el.firstChild);
            }
          }
        }
      } else {
        el.removeAttribute('data-fill-color');
        el.removeAttribute('data-fill-opacity');
        if (!isImage) {
          el.removeAttribute('fill');
          el.removeAttribute('fill-opacity');
        }
      }

      // Apply Stroke
      if (backgroundColor.stroke === 'transparent' || backgroundColor.stroke === 'none') {
        el.removeAttribute('data-stroke-color');
        el.removeAttribute('data-stroke-width');
        if (!isImage) {
          el.removeAttribute('stroke');
          el.removeAttribute('stroke-width');
        }
      } else {
        el.setAttribute('data-stroke-color', backgroundColor.stroke);
        el.setAttribute('data-stroke-width', backgroundColor.strokeWeight.toString());

        const isStrokeGradient = backgroundColor.stroke.includes('gradient');

        const dashArray = backgroundColor.strokeDashStyle === 'Dashed'
          ? `${backgroundColor.strokeDashLength ?? 10},${backgroundColor.strokeDashGap ?? 10}`
          : 'none';

        el.setAttribute('data-stroke-dasharray', dashArray);
        el.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
        el.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
        el.setAttribute('data-stroke-type', backgroundColor.strokeType || 'solid');

        if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
          el.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
          el.setAttribute('data-stroke-stops', backgroundColor.strokeStops);
          el.setAttribute('data-stroke-angle', (backgroundColor.strokeAngle || 0).toString());
          el.setAttribute('data-stroke-radius', (backgroundColor.strokeRadius || 100).toString());
        } else {
          el.removeAttribute('data-stroke-gradient-type');
          el.removeAttribute('data-stroke-stops');
          el.removeAttribute('data-stroke-angle');
          el.removeAttribute('data-stroke-radius');
        }

        if (!isImage) {
          const pos = backgroundColor.strokePosition || 'Center';
          const sw = backgroundColor.strokeWeight || 0;
          const isEligibleShape = ['rect', 'ellipse', 'path', 'circle', 'polygon'].includes(el.tagName?.toLowerCase());

          if (isEligibleShape && pos !== 'Center' && sw > 0) {
            el.setAttribute('stroke', 'none');
            el.removeAttribute('stroke-width');
            el.removeAttribute('stroke-dasharray');

            let overlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
            if (!overlay) {
              overlay = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
              overlay.classList.add('svg-shape-stroke-overlay');
              overlay.setAttribute('data-target', el.id);
              overlay.style.pointerEvents = 'none';

              if (pos === 'Inside') {
                el.parentNode.insertBefore(overlay, el.nextSibling);
              } else {
                el.parentNode.insertBefore(overlay, el);
              }
            } else {
              if (pos === 'Inside' && overlay.previousSibling !== el) {
                el.parentNode.insertBefore(overlay, el.nextSibling);
              } else if (pos === 'Outside' && overlay.nextSibling !== el) {
                el.parentNode.insertBefore(overlay, el);
              }
            }

            const svg = el.ownerSVGElement || el.parentNode;
            let defs = svg.querySelector('defs');
            if (!defs) {
              defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              svg.insertBefore(defs, svg.firstChild);
            }

            if (pos === 'Inside') {
              let clip = defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`);
              if (!clip) {
                clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                clip.id = `clip-shape-${el.id}`;
                const clipShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
                clip.appendChild(clipShape);
                defs.appendChild(clip);
              }
              overlay.setAttribute('clip-path', `url(#clip-shape-${el.id})`);
              overlay.removeAttribute('mask');
            } else {
              let mask = defs.querySelector(`mask[id="mask-shape-${el.id}"]`);
              if (!mask) {
                mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
                mask.id = `mask-shape-${el.id}`;
                const maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                maskBg.setAttribute('x', '-500%');
                maskBg.setAttribute('y', '-500%');
                maskBg.setAttribute('width', '1000%');
                maskBg.setAttribute('height', '1000%');
                maskBg.setAttribute('fill', 'white');
                const maskShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
                maskShape.setAttribute('fill', 'black');
                mask.appendChild(maskBg);
                mask.appendChild(maskShape);
                defs.appendChild(mask);
              }
              overlay.setAttribute('mask', `url(#mask-shape-${el.id})`);
              overlay.removeAttribute('clip-path');
            }

            overlay.setAttribute('stroke', backgroundColor.stroke);
            overlay.setAttribute('stroke-width', (sw * 2).toString());
            overlay.setAttribute('fill', 'none');
            overlay.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());
            if (dashArray !== 'none') overlay.setAttribute('stroke-dasharray', dashArray);
            else overlay.removeAttribute('stroke-dasharray');
            overlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
            overlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');
            overlay.setAttribute('data-stroke-type', backgroundColor.strokeType || 'solid');

            const syncGeometry = () => {
              if (!overlay.isConnected) return;
              const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'points'];
              const refShape = pos === 'Inside' ? defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`)?.firstChild : defs.querySelector(`mask[id="mask-shape-${el.id}"]`)?.lastChild;

              attrsToSync.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val !== null) {
                  overlay.setAttribute(attr, val);
                  if (refShape) refShape.setAttribute(attr, val);
                } else {
                  overlay.removeAttribute(attr);
                  if (refShape) refShape.removeAttribute(attr);
                }
              });
              overlay.style.transform = el.style.transform;
              overlay.style.translate = el.style.translate;
              overlay.style.scale = el.style.scale;
              overlay.style.rotate = el.style.rotate;
              if (refShape) {
                refShape.style.transform = el.style.transform;
                refShape.style.translate = el.style.translate;
                refShape.style.scale = el.style.scale;
                refShape.style.rotate = el.style.rotate;
              }
            };

            syncGeometry();

            if (!el._shapeStrokeObserver) {
              el._shapeStrokeObserver = new MutationObserver(syncGeometry);
              el._shapeStrokeObserver.observe(el, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'style'] });
            }

          } else {
            if (!isStrokeGradient) {
              el.setAttribute('stroke', backgroundColor.stroke);
            }
            el.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            if (dashArray !== 'none') {
              el.setAttribute('stroke-dasharray', dashArray);
            } else {
              el.setAttribute('stroke-dasharray', 'none');
            }

            const overlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
            if (overlay) overlay.remove();
            const defs = el.ownerSVGElement?.querySelector('defs');
            if (defs) {
              defs.querySelector(`clipPath[id="clip-shape-${el.id}"]`)?.remove();
              defs.querySelector(`mask[id="mask-shape-${el.id}"]`)?.remove();
            }
          }
        } else {
          let strokeLayer = el.querySelector('.svg-image-stroke-overlay') || el.querySelector('.video-stroke-overlay') || el.querySelector('.svg-gif-stroke-overlay');
          if (strokeLayer) {
            if (!isStrokeGradient) {
              strokeLayer.setAttribute('stroke', backgroundColor.stroke);
            }
            strokeLayer.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
          }
        }
      }

      if (onUpdate) onUpdate({ shouldRefresh: true });
    };

    // For gradient fills, apply immediately (no debounce) so dragging the color picker
    // feels instant. For solid color / stroke-only changes, a rAF is enough to batch
    // multiple rapid fire events within the same frame without visible lag.
    const isGradientFill = backgroundColor.fill && backgroundColor.fill.includes('gradient');
    if (isGradientFill) {
      applyColorsToDOM();
      return;
    }

    let rafId;
    const raf = () => { rafId = requestAnimationFrame(applyColorsToDOM); };
    raf();
    return () => cancelAnimationFrame(rafId);
  }, [backgroundColor, standaloneMode, selectedElement]);


  useEffect(() => {
    if (openSubSection === 'color' && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 350);
    }
  }, [openSubSection]);
  const pseudoProps = {
    fill: backgroundColor?.fill || '#000000',
    opacity: (backgroundColor?.fillOpacity !== undefined && backgroundColor?.fillOpacity !== null ? backgroundColor.fillOpacity : 100) / 100,
    stroke: backgroundColor?.stroke || 'none',
    'stroke-opacity': (backgroundColor?.strokeOpacity !== undefined && backgroundColor?.strokeOpacity !== null ? backgroundColor.strokeOpacity : 100) / 100,
    'fill-type': backgroundColor?.fillType || 'solid',
    'fill-gradient-type': backgroundColor?.fillGradientType || 'linear',
    'fill-stops': backgroundColor?.fillStops,
    'fill-angle': backgroundColor?.fillAngle || 0,
    'fill-radius': backgroundColor?.fillRadius || 100,
    'stroke-type': backgroundColor?.strokeType || 'solid',
    'stroke-gradient-type': backgroundColor?.strokeGradientType || 'linear',
    'stroke-stops': backgroundColor?.strokeStops,
    'stroke-angle': backgroundColor?.strokeAngle || 0,
    'stroke-radius': backgroundColor?.strokeRadius || 100,
    'stroke-width': backgroundColor?.strokeWeight || 0,
    strokeWidth: backgroundColor?.strokeWeight || 0,
    'stroke-dasharray': backgroundColor?.strokeDashStyle === 'Dashed' ? `${backgroundColor?.strokeDashLength ?? 10},${backgroundColor?.strokeDashGap ?? 10}` : 'none',
    strokeDasharray: backgroundColor?.strokeDashStyle === 'Dashed' ? `${backgroundColor?.strokeDashLength ?? 10},${backgroundColor?.strokeDashGap ?? 10}` : 'none',
    'stroke-linecap': backgroundColor?.strokeLinecap || 'butt',
    'data-stroke-position': backgroundColor?.strokePosition || 'Center',
  };

  const handleUpdate = (page, layer, attr, value) => {
    if (attr === 'fill' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fill: value }));
    if (attr === 'fill-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillType: value }));
    if (attr === 'fill-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillGradientType: value }));
    if (attr === 'fill-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillStops: value }));
    if (attr === 'fill-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillAngle: parseFloat(value) }));
    if (attr === 'fill-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillRadius: parseFloat(value) }));
    if (attr === 'opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, fillOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke' && setBackgroundColor) setBackgroundColor(p => ({ ...p, stroke: value, strokeWeight: (p.strokeWeight === 0 && value !== 'transparent' && value !== 'none') ? 1 : p.strokeWeight }));
    if (attr === 'stroke-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeType: value }));
    if (attr === 'stroke-gradient-type' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeGradientType: value }));
    if (attr === 'stroke-stops' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeStops: value }));
    if (attr === 'stroke-angle' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeAngle: parseFloat(value) }));
    if (attr === 'stroke-radius' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeRadius: parseFloat(value) }));
    if (attr === 'stroke-opacity' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeOpacity: parseFloat(value) * 100 }));
    if (attr === 'stroke-width' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeWeight: parseFloat(value) }));
    if (attr === 'stroke-dasharray' && setBackgroundColor) {
      if (value === 'none') {
        setBackgroundColor(p => ({ ...p, strokeDashStyle: 'Solid' }));
      } else {
        const parts = value.split(',');
        const parsedLen = parseInt(parts[0]);
        const dashLen = isNaN(parsedLen) ? 10 : parsedLen;
        const parsedGap = parts.length > 1 ? parseInt(parts[1]) : parsedLen;
        const dashGap = isNaN(parsedGap) ? dashLen : parsedGap;
        setBackgroundColor(p => ({
          ...p,
          strokeDashStyle: 'Dashed',
          strokeDashLength: dashLen,
          strokeDashGap: dashGap
        }));
      }
    }
    if (attr === 'data-stroke-position' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokePosition: value }));
    if (attr === 'stroke-linecap' && setBackgroundColor) setBackgroundColor(p => ({ ...p, strokeLinecap: value }));
  };

  const updateAttr = (attribute, value) => {
    handleUpdate(undefined, undefined, attribute, value);
  };

  const handleScrub = (e, initialVal, updateFn, sensitivity = 5) => {
    handleScrubHelper(e, initialVal, updateFn, sensitivity);
  };

  const defaultStops = [
    { color: '#63D0CD', offset: 0, opacity: 1 },
    { color: '#4B3EFE', offset: 100, opacity: 1 }
  ];

  return (
    <div ref={containerRef} className="flex flex-col font-sans">
      {!hideFill && (
        <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden mb-[1vw]">
          <div
            onClick={() => setOpenSubSection(openSubSection === 'color' || openSubSection === 'fillColor' ? null : 'fillColor')}
            className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
          >
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-semibold text-[0.85vw] text-gray-900">Fill Color</span>
            </div>
            <ChevronUp size="1vw" className={`transition-transform duration-200 ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${(openSubSection === 'color' || openSubSection === 'fillColor') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="p-[1vw] pt-[0.75vw] flex items-center justify-between gap-[0.5vw]">
                {/* Swatch */}
                <div
                  className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                >
                  <div
                    className="w-full h-full border border-gray-200"
                    style={{
                      background: (pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || pseudoProps.fill === '#' || !pseudoProps.fill)
                        ? 'white'
                        : (pseudoProps.fill.toString().toLowerCase().includes('url(#')
                          ? (pseudoProps && pseudoProps[`fill-stops`]
                            ? `linear-gradient(to right, ${JSON.parse(pseudoProps[`fill-stops`]).map(s => s.color).join(', ')})`
                            : '#ccc')
                          : pseudoProps.fill)
                    }}
                  />
                  {(pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || pseudoProps.fill === '#' || !pseudoProps.fill) && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1.5px] bg-red-500 rotate-45" />
                  )}
                </div>

                {/* Input box */}
                <div className="flex-grow flex items-center border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden h-[2vw] bg-white hover:border-indigo-400 transition-colors px-[0.5vw]">
                  <input
                    type="text"
                    value={(pseudoProps.fill === 'none' || pseudoProps.fill === 'transparent' || !pseudoProps.fill) ? '#' : pseudoProps.fill?.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === '#') {
                        updateAttr('fill', 'none');
                      } else {
                        const finalVal = val.startsWith('#') ? val : '#' + val;
                        updateAttr('fill', finalVal);
                      }
                    }}
                    className="flex-grow text-[0.75vw] font-medium text-gray-700 outline-none bg-transparent min-w-[3vw] tracking-tight"
                    maxLength={7}
                  />
                  <div
                    className="flex items-center gap-[0.1vw] ml-[0.5vw] cursor-ew-resize select-none px-[0.2vw] hover:bg-gray-50 rounded"
                    onPointerDown={(e) => {
                      const currentPct = Math.round(parseFloat(pseudoProps.opacity !== undefined ? pseudoProps.opacity : 1) * 100);
                      handleScrubHelper(e, currentPct, (val) => {
                        const num = parseInt(val);
                        const clamped = Math.min(Math.max(num, 0), 100);
                        updateAttr('opacity', (clamped / 100).toString());
                      });
                    }}
                  >
                    <span className="text-[0.75vw] font-medium text-gray-600">
                      {Math.round(parseFloat(pseudoProps.opacity !== undefined ? pseudoProps.opacity : 1) * 100)}%
                    </span>
                  </div>
                </div>

                {/* HEX Dropdown */}
                <div className="h-[2vw] flex items-center justify-between px-[0.5vw] border border-gray-200 rounded-[0.5vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[3.5vw]">
                  <span className="text-[0.7vw] text-gray-600 font-medium">HEX</span>
                  <ChevronDown size="0.8vw" className="text-gray-400 ml-[0.2vw]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
        <div
          onClick={() => setOpenSubSection(openSubSection === 'color' || openSubSection === 'strokeColor' ? null : 'strokeColor')}
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'rounded-t-[0.75vw]' : 'rounded-[0.75vw]'}`}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className="font-semibold text-[0.85vw] text-gray-900">Stroke Color</span>
          </div>
          <ChevronUp size="1vw" className={`transition-transform duration-200 ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'text-gray-900' : 'rotate-180 text-gray-500'}`} />
        </div>

        <div className={`grid transition-all duration-300 ease-in-out ${(openSubSection === 'color' || openSubSection === 'strokeColor') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-[1vw] pt-[0.75vw] space-y-[0.5vw]">
              <ColorField
                label="Stroke"
                color={pseudoProps.stroke}
                opacity={pseudoProps['stroke-opacity']}
                onColorChange={(val) => updateAttr('stroke', val)}
                onOpacityChange={(val) => updateAttr('stroke-opacity', val.toString())}
                onPickerToggle={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
                baseAttr="stroke"
                selectedElementProps={pseudoProps}
              />

              {/* STROKE SETTINGS */}
              {(pseudoProps.stroke && pseudoProps.stroke !== 'none' && pseudoProps.stroke !== '#' && pseudoProps.stroke !== 'transparent') && (
                <div className="flex items-center gap-[0.4vw] py-[0.1vw]">
                  <div className="w-[3vw]"></div>
                  <div className="w-[2.5vw] flex items-center justify-center">
                    <div
                      className={`flex items-center justify-center h-[2vw] w-[2vw] rounded-[0.5vw] cursor-pointer transition-colors shadow-sm ${showStrokeSettings ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white text-gray-500'}`}
                      onClick={(e) => {
                        const row = e.currentTarget.closest('.flex.items-center.gap-\\[0\\.4vw\\].py-\\[0\\.1vw\\]') || e.currentTarget;
                        const rowRect = row.getBoundingClientRect();
                        const btnRect = e.currentTarget.getBoundingClientRect();
                        const popupHeight = 250;
                        const pos = { right: `calc(100vw - ${rowRect.left}px + 1.5vw)` };
                        const centerY = btnRect.top + (btnRect.height / 2) - (popupHeight / 2);
                        pos.top = Math.max(90, Math.min(centerY, window.innerHeight - popupHeight - 20));
                        setStrokeSettingsPos(pos);
                        setShowStrokeSettings(!showStrokeSettings);
                      }}
                    >
                      <SlidersHorizontal size="1.1vw" className="currentColor" />
                    </div>
                  </div>

                  <div className="flex-grow flex items-center gap-[0.4vw]">
                    <div className="relative flex-grow h-[2.5vw]">
                      <div
                        className={`h-full px-[0.7vw] border-[0.1vw] rounded-[0.75vw] flex items-center gap-[0.5vw] cursor-pointer justify-between bg-white transition-all font-semibold ${isStrokeStyleOpen ? 'border-indigo-500 shadow-sm' : 'border-gray-400 hover:border-indigo-400'}`}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownPos({ top: rect.bottom + 5, left: rect.left, width: rect.width });
                          setIsStrokeStyleOpen(!isStrokeStyleOpen);
                        }}
                      >
                        <span className="text-[0.75vw] text-gray-700 whitespace-nowrap overflow-hidden">
                          {(pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none') ? 'Dashed' : 'Solid'}
                        </span>
                        <ChevronDown size="0.9vw" className={`text-gray-500 transition-transform ${isStrokeStyleOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isStrokeStyleOpen && createPortal(
                        <>
                          <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setIsStrokeStyleOpen(false); }} />
                          <div
                            className="fixed py-1 bg-white border border-gray-200 rounded-[0.5vw] shadow-xl z-[9999] animate-in fade-in zoom-in duration-200"
                            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                          >
                            {['Solid', 'Dashed'].map((type) => (
                              <div
                                key={type}
                                className={`px-[1vw] py-[0.5vw] text-[0.8vw] cursor-pointer transition-colors ${(type === 'Solid' && (!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none')) ||
                                  (type === 'Dashed' && pseudoProps.strokeDasharray && pseudoProps.strokeDasharray !== 'none')
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600 font-semibold'
                                  }`}
                                onClick={() => {
                                  updateAttr('stroke-dasharray', type === 'Dashed' ? '10,10' : 'none');
                                  setIsStrokeStyleOpen(false);
                                }}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>

                    <div className="h-[2.5vw] w-[4.5vw] border-[0.1vw] border-gray-400 rounded-[0.75vw] flex items-center px-[0.6vw] gap-[0.3vw] bg-white hover:border-indigo-400 transition-colors flex-shrink-0">
                      <div
                        className="cursor-ew-resize hover:bg-gray-50 p-[0.2vw] rounded-[0.3vw] transition-colors"
                        onPointerDown={(e) => {
                          const initialVal = parseFloat(pseudoProps.strokeWidth !== undefined ? pseudoProps.strokeWidth : 0);
                          handleScrubHelper(e, initialVal, (val) => {
                            const newVal = Math.max(0, parseInt(val));
                            updateAttr('stroke-width', newVal.toString());
                          }, 8);
                        }}
                      >
                        <Icon icon="material-symbols:line-weight" width="1vw" height="1vw" className="text-gray-500 flex-shrink-0" />
                      </div>
                      <input
                        type="number"
                        value={pseudoProps.strokeWidth !== undefined && !isNaN(parseFloat(pseudoProps.strokeWidth)) ? parseFloat(pseudoProps.strokeWidth) : 0}
                        onChange={(e) => updateAttr('stroke-width', e.target.value)}
                        className="w-full text-[0.8vw] font-semibold outline-none text-right bg-transparent text-gray-700 no-spin"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showStrokeSettings && createPortal(
        <div
          id="stroke-settings-popup"
          className="fixed z-[4000] w-[15vw] bg-white rounded-[1vw] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col p-[1vw] space-y-[1vw] animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: strokeSettingsPos.top,
            bottom: strokeSettingsPos.bottom,
            right: strokeSettingsPos.right
          }}
        >
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-800">Properties</span>
            <div className="h-px flex-grow bg-gray-100"></div>
            <button
              onClick={() => {
                setShowStrokeSettings(false);
                if (activeColorPicker?.includes('stroke')) {
                  setActiveColorPicker(null);
                  if (setShowDetailedPicker) setShowDetailedPicker(false);
                }
              }}
              className="p-[0.3vw] hover:bg-gray-100 rounded-[0.5vw] transition-colors"
            >
              <X size="1vw" className="text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[0.75vw] font-semibold text-gray-600">Position :</span>
            <div className="relative flex-grow ml-[1vw]">
              <div
                className="h-[2vw] px-[0.7vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-white min-w-[5.5vw]"
                onClick={() => setIsDashPosOpen(!isDashPosOpen)}
              >
                <span className="text-[0.7vw] font-semibold text-gray-700 capitalize">{pseudoProps['data-stroke-position'] || 'Center'}</span>
                <ChevronDown size="0.8vw" className="text-gray-400" />
              </div>
              {isDashPosOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsDashPosOpen(false); }} />
                  <div className="absolute top-[110%] left-0 right-0 bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-50 py-1 overflow-hidden">
                    {['Inside', 'Center', 'Outside'].map(pos => (
                      <div
                        key={pos}
                        onClick={() => {
                          updateAttr('data-stroke-position', pos);
                          setIsDashPosOpen(false);
                        }}
                        className="px-[1vw] py-[0.4vw] text-[0.7vw] font-semibold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                      >
                        {pos}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mx-[-1vw]" />

          <div className={`space-y-[0.75vw] ${(!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
            {[
              { label: 'Length', key: 'dash' },
              { label: 'Gap', key: 'gap' }
            ].map(item => {
              const dashArray = (pseudoProps.strokeDasharray || '10,10').split(',');
              const rawStr = item.key === 'dash' ? dashArray[0] : (dashArray[1] || dashArray[0]);
              const val = isNaN(parseInt(rawStr)) ? 1 : parseInt(rawStr);

              const updateValue = (newVal) => {
                const v = Math.max(1, newVal);
                const d = item.key === 'dash' ? v : (parseInt(dashArray[0]) || 1);
                const g = item.key === 'gap' ? v : (parseInt(dashArray[1] || dashArray[0]) || 1);
                updateAttr('stroke-dasharray', `${d},${g}`);
              };

              return (
                <DashInput
                  key={item.key}
                  label={item.label}
                  initialValue={val}
                  onChange={updateValue}
                />
              );
            })}
          </div>

          <div className="h-px bg-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] mx-[-1vw]" />

          <div className={`flex items-center justify-between ${(!pseudoProps.strokeDasharray || pseudoProps.strokeDasharray === 'none') ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-[0.75vw] font-semibold text-gray-600">Round Corners :</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentCap = pseudoProps.strokeLinecap || pseudoProps['stroke-linecap'];
                const isRound = currentCap === 'round';
                updateAttr('stroke-linecap', isRound ? 'butt' : 'round');
                updateAttr('stroke-linejoin', isRound ? 'miter' : 'round');
              }}
              className={`relative block w-[2.2vw] h-[1.2vw] rounded-full transition-colors duration-200 ease-in-out outline-none shrink-0 cursor-pointer ${(pseudoProps.strokeLinecap === 'round' || pseudoProps['stroke-linecap'] === 'round') ? 'bg-[#4D47FF]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-[0.1vw] w-[1vw] h-[1vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${(pseudoProps.strokeLinecap === 'round' || pseudoProps['stroke-linecap'] === 'round') ? 'left-[1.1vw]' : 'left-[0.1vw]'}`} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {activeColorPicker && !activeColorPicker.includes('effect-') && createPortal(
        <div
          className="fixed z-[5000]"
          style={{
            top: '50%',
            right: '19.5vw',
            transform: 'translateY(-50%)'
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <ColorPicker
              key={activeColorPicker}
              color={(() => {
                const type = pseudoProps[`${activeColorPicker}-type`] || 'solid';
                const currentVal = pseudoProps[activeColorPicker] || '#000000';
                const stopsJson = pseudoProps[`${activeColorPicker}-stops`];
                if (type === 'gradient' || currentVal.toLowerCase().includes('url(#')) {
                  const stops = stopsJson ? JSON.parse(stopsJson) : defaultStops;
                  const gType = pseudoProps[`${activeColorPicker}-gradient-type`] || 'linear';
                  return generateGradientString(
                    gType.charAt(0).toUpperCase() + gType.slice(1),
                    stops.map(s => ({ ...s, opacity: (s.opacity !== undefined ? s.opacity : 1) * 100 })),
                    parseInt(pseudoProps[`${activeColorPicker}-angle`] || '0'),
                    parseInt(pseudoProps[`${activeColorPicker}-radius`] || '100')
                  );
                }
                return pseudoProps[activeColorPicker] || '#000000';
              })()}
              disableGradient={isText && activeColorPicker === 'stroke'}
              onChange={(newVal, isDragging = false) => {
                isDraggingRef.current = isDragging;
                if (newVal.includes('gradient')) {
                  const parsed = parseGradient(newVal);
                  if (parsed) {
                    updateAttr(`${activeColorPicker}-type`, 'gradient');
                    updateAttr(`${activeColorPicker}-gradient-type`, parsed.type.toLowerCase());
                    updateAttr(`${activeColorPicker}-stops`, JSON.stringify(parsed.stops.map(s => ({
                      color: s.color,
                      offset: s.offset,
                      opacity: s.opacity / 100
                    }))));
                    updateAttr(`${activeColorPicker}-angle`, (parsed.angle || 0).toString());
                    updateAttr(`${activeColorPicker}-radius`, (parsed.radius || 100).toString());
                    updateAttr(activeColorPicker, newVal);
                  }
                } else {
                  if (setBackgroundColor) {
                    setBackgroundColor(p => {
                      if (activeColorPicker === 'fill') {
                        return { ...p, fill: newVal, fillType: 'solid' };
                      } else if (activeColorPicker === 'stroke') {
                        return { 
                          ...p, 
                          stroke: newVal, 
                          strokeType: 'solid',
                          strokeWeight: (p.strokeWeight === 0 && newVal !== 'transparent' && newVal !== 'none') ? 1 : p.strokeWeight
                        };
                      }
                      return p;
                    });
                  }
                }
              }}
              opacity={(() => {
                if (activeColorPicker === 'fill') {
                  const op = pseudoProps.opacity !== undefined && pseudoProps.opacity !== '' && pseudoProps.opacity !== null ? pseudoProps.opacity : 1;
                  return parseFloat(op) * 100;
                } else if (activeColorPicker === 'stroke') {
                  const op = pseudoProps['stroke-opacity'] !== undefined && pseudoProps['stroke-opacity'] !== '' && pseudoProps['stroke-opacity'] !== null ? pseudoProps['stroke-opacity'] : 1;
                  return parseFloat(op) * 100;
                }
                return 100;
              })()}
              onOpacityChange={(newOpacity) => {
                if (activeColorPicker === 'fill') {
                  updateAttr('opacity', (newOpacity / 100).toString());
                } else if (activeColorPicker === 'stroke') {
                  updateAttr('stroke-opacity', (newOpacity / 100).toString());
                }
              }}
              onClose={() => setActiveColorPicker(null)}
              colorsOnPage={colorsOnPage}
            />
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .hide-opacity-bar .space-y-\\[1vw\\] > div:nth-child(2) {
          display: none !important;
        }

        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        body.is-scrubbing, body.is-scrubbing * {
          cursor: none !important;
          user-select: none !important;
        }
        .hide-cursor, .hide-cursor * {
          cursor: none !important;
        }
        .virtual-scrub-cursor {
          position: fixed;
          pointer-events: none;
          z-index: 100000;
          width: 2vw;
          height: 2vw;
          margin-left: -1vw;
          margin-top: -1vw;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0.1vw 0.2vw rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
};

export default Color;
