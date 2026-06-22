import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Upload,
  Replace,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  Link2Off,
  Edit3,
  ImagePlay,
  Grid,
  Search,
  X,
  Trash2,
  Repeat,
  Sliders,
  Type,
  Maximize,
  Layout,
  Palette,
  Layers,
  Settings2,
  AlignCenterVertical,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pipette,
  Sparkles,
  RotateCcw,
  Minus,
  Plus,
  Check,
  MousePointerClick,
  Pencil
} from "lucide-react";
import GalleryGif from "./GalleryGif";
import ColorPicker from './ColorPicker';
import { Icon } from '@iconify/react';
import SubComponent from './SubComponent';

const galleryPreviewImages = [
  "https://media.giphy.com/media/3o7aD2saalEvTe2v0c/giphy.gif",
  "https://media.giphy.com/media/l41YtZOb9EUABnuqA/giphy.gif",
  "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif"
];

const GifEditor = ({
  selectedElement,
  selectedLayerId: propSelectedLayerId,
  onUpdate,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages,
  activePageIndex
}) => {
  const { v_id: paramVId } = useParams();
  const activeVId = flipbookVId || paramVId;

  // Use prop if available, fallback to selectedElement.id
  const selectedLayerId = propSelectedLayerId || selectedElement?.id;

  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('main');
  const [showGallery, setShowGallery] = useState(false);
  const [opacity, setOpacity] = useState(100);
  const [imageType, setImageType] = useState('Fit');
  const [showImageTypeDropdown, setShowImageTypeDropdown] = useState(false);
  const [openSubSection, setOpenSubSection] = useState(null);
  const [activePopup, setActivePopup] = useState(null);

  const [filters, setFilters] = useState({ exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 });
  const [radius, setRadius] = useState({ tl: 0, tr: 0, br: 0, bl: 0 });
  const [isRadiusLinked, setIsRadiusLinked] = useState(false);
  const [activeEffects, setActiveEffects] = useState([]);
  const [effectSettings, setEffectSettings] = useState({
    'Drop Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 1, spread: 0 },
    'Inner Shadow': { color: '#000000', opacity: 35, x: 4, y: 4, blur: 1, spread: 0 },
    'Blur': { blur: 4, spread: 0 },
    'Background Blur': { blur: 4, spread: 0 }
  });

  const [backgroundColor, setBackgroundColor] = useState({
    fill: 'transparent',
    fillOpacity: 100,
    stroke: 'transparent',
    strokeOpacity: 100,
    strokeType: 'Solid',
    strokeWeight: 0
  });

  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [isStrokeStyleOpen, setIsStrokeStyleOpen] = useState(false);
  const [showStrokeSettings, setShowStrokeSettings] = useState(false);
  const [strokeSettingsPos, setStrokeSettingsPos] = useState({ top: 0, right: 0 });
  const [isDashPosOpen, setIsDashPosOpen] = useState(false);
  const [colorsOnPage, setColorsOnPage] = useState([]);
  const [showDetailedPicker, setShowDetailedPicker] = useState(false);

  const isUpdatingDOM = useRef(false);
  const isHydrating = useRef(false);
  const onUpdateTimerRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const getSvgImageEl = useCallback((el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();

    // 1. Direct hit
    if (tag === 'image' || tag === 'img') return el;

    // 2. Child search
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;

    // 3. Pattern search
    const findInPattern = (node) => {
      const fill = node.getAttribute?.('fill') || '';
      if (fill?.startsWith('url(#')) {
        const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
        if (patternId) {
          const doc = node.ownerDocument;
          const ownerSvg = node.closest('svg');
          const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`) || doc?.getElementById(patternId);
          if (pattern) {
            const img = pattern.querySelector('image');
            if (img) return img;
            const useEl = pattern.querySelector('use');
            if (useEl) {
              const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
              if (refId) return doc?.getElementById(refId) || ownerSvg?.querySelector(`[id="${refId}"]`);
            }
          }
        }
      }
      return null;
    };
    const patternTarget = findInPattern(el);
    if (patternTarget) return patternTarget;

    return null;
  }, []);

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement) return;
    if (isUpdatingDOM.current && !force) return;

    // isHydrating is only true briefly during selection change
    const tagLower = selectedElement.tagName?.toLowerCase();
    const svgImageEl = getSvgImageEl(selectedElement);
    const isSvgEl = !!svgImageEl || (selectedElement instanceof SVGElement && tagLower !== 'svg');

    // Opacity
    const rawOpacity = isSvgEl
      ? (selectedElement.getAttribute('data-effect-opacity') ? (parseFloat(selectedElement.getAttribute('data-effect-opacity')) / 100).toString() : (selectedElement.getAttribute('opacity') || selectedElement.style.opacity || '1'))
      : (selectedElement.style.opacity || '1');
    setOpacity(Math.round(parseFloat(rawOpacity) * 100));

    // Radius
    if (selectedElement.hasAttribute('data-effect-radius-tl')) {
      setRadius({
        tl: parseFloat(selectedElement.getAttribute('data-effect-radius-tl') || '0'),
        tr: parseFloat(selectedElement.getAttribute('data-effect-radius-tr') || '0'),
        br: parseFloat(selectedElement.getAttribute('data-effect-radius-br') || '0'),
        bl: parseFloat(selectedElement.getAttribute('data-effect-radius-bl') || '0')
      });
    } else {
      const domRadius = selectedElement.style.borderRadius || '0px';
      const parts = domRadius.split(' ').map(p => parseFloat(p) || 0);
      let tl = 0, tr = 0, br = 0, bl = 0;
      if (parts.length === 1) { tl = tr = br = bl = parts[0]; }
      else if (parts.length === 2) { tl = br = parts[0]; tr = bl = parts[1]; }
      else if (parts.length === 3) { tl = parts[0]; tr = bl = parts[1]; br = parts[2]; }
      else if (parts.length >= 4) { tl = parts[0]; tr = parts[1]; br = parts[2]; bl = parts[3]; }

      if (tl === 0 && tr === 0 && br === 0 && bl === 0 && tagLower === 'rect') {
        const rx = parseFloat(selectedElement.getAttribute('rx') || '0');
        tl = tr = br = bl = rx;
      }
      setRadius({ tl, tr, br, bl });
    }

    // Image Type
    const fitMapRev = { 'contain': 'Fit', 'cover': 'Fill', 'none': 'Crop', 'fill': 'Fit' };
    const currentFit = (svgImageEl || selectedElement).style.objectFit || 'contain';
    setImageType(fitMapRev[currentFit] || 'Fit');

    // Filters & Effects
    if (selectedElement.hasAttribute('data-active-effects')) {
      const attrVal = selectedElement.getAttribute('data-active-effects');
      setActiveEffects(attrVal ? attrVal.split(',').filter(Boolean) : []);
    }

    if (selectedElement.hasAttribute('data-effect-exposure')) {
      setFilters({
        exposure: parseFloat(selectedElement.getAttribute('data-effect-exposure') || '0'),
        contrast: parseFloat(selectedElement.getAttribute('data-effect-contrast') || '0'),
        saturation: parseFloat(selectedElement.getAttribute('data-effect-saturation') || '0'),
        temperature: parseFloat(selectedElement.getAttribute('data-effect-temperature') || '0'),
        tint: parseFloat(selectedElement.getAttribute('data-effect-tint') || '0'),
        highlights: parseFloat(selectedElement.getAttribute('data-effect-highlights') || '0'),
        shadows: parseFloat(selectedElement.getAttribute('data-effect-shadows') || '0'),
      });
    }

    // Background & Stroke
    const fill = selectedElement.style.backgroundColor || selectedElement.getAttribute('fill') || 'transparent';
    const stroke = selectedElement.style.borderColor || selectedElement.getAttribute('stroke') || 'transparent';
    const strokeW = parseInt(selectedElement.style.borderWidth) || parseInt(selectedElement.getAttribute('stroke-width')) || 0;

    const strokeArray = selectedElement.getAttribute('stroke-dasharray') || 'none';
    const isDashed = (selectedElement.style.borderStyle === 'dashed' || strokeArray.includes(','));
    let dashLen = 5, dashGap = 5;
    if (isDashed && strokeArray !== 'none') {
      const parts = strokeArray.split(',');
      dashLen = parseInt(parts[0]) || 5;
      dashGap = parseInt(parts[1] || parts[0]) || 5;
    }
    const dashPos = selectedElement.getAttribute('data-stroke-position') || 'Center';
    const dashCap = selectedElement.getAttribute('stroke-linecap') || 'butt';

    const existingStrokeType = selectedElement.getAttribute('data-stroke-type');
    const actualStrokeType = existingStrokeType ? existingStrokeType : (isDashed ? 'Dashed' : 'Solid');

    setBackgroundColor({
      fill: fill === 'none' ? 'transparent' : fill,
      fillOpacity: 100,
      stroke: stroke === 'none' ? 'transparent' : stroke,
      strokeOpacity: 100,
      strokeType: actualStrokeType,
      strokeGradientType: selectedElement.getAttribute('data-stroke-gradient-type') || 'linear',
      strokeStops: selectedElement.getAttribute('data-stroke-stops'),
      strokeAngle: parseFloat(selectedElement.getAttribute('data-stroke-angle') || '0'),
      strokeRadius: parseFloat(selectedElement.getAttribute('data-stroke-radius') || '100'),
      strokeWeight: strokeW,
      strokeDashLength: dashLen,
      strokeDashGap: dashGap,
      strokePosition: dashPos,
      strokeLinecap: dashCap
    });
  }, [selectedElement, getSvgImageEl]);

  // Handle selection change
  useEffect(() => {
    if (!selectedElement) return;
    isHydrating.current = true;
    syncStateFromDOM(true);
    // Use a small timeout to let the state settle before allowing applyVisuals to write back to DOM
    setTimeout(() => { isHydrating.current = false; }, 50);
  }, [selectedElement, syncStateFromDOM]);

  // Handle external mutations
  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOM.current) return;
      const relevant = mutations.some(m => m.type === 'attributes' && (
        m.attributeName === 'src' || m.attributeName === 'href' ||
        m.attributeName === 'opacity' || m.attributeName === 'style' ||
        m.attributeName === 'rx' || m.attributeName === 'ry'
      ));
      if (relevant) syncStateFromDOM();
    });
    observer.observe(selectedElement, { attributes: true });
    return () => observer.disconnect();
  }, [selectedElement, syncStateFromDOM]);

  const applyVisuals = useCallback(() => {
    if (isHydrating.current) return;

    // Use selectedLayerId if available to find the live element in the DOM
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    let liveElement = (selectedLayerId && pageContainer)
      ? pageContainer.querySelector(`[id="${selectedLayerId}"]`)
      : (selectedElement?.isConnected ? selectedElement : null);

    if (!liveElement) return;

    isUpdatingDOM.current = true;
    try {
      let svgImageEl = getSvgImageEl(liveElement);
      // Correct SVG detection: only true if it's actually an SVG element
      let isSvgEl = liveElement.namespaceURI === "http://www.w3.org/2000/svg";
      let tagLower = liveElement.tagName.toLowerCase();

      // --- GROUP WITHIN IMAGE FIX ---
      if (isSvgEl && tagLower === 'image') {
        const newGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGroup.id = liveElement.id;
        liveElement.removeAttribute('id');

        Array.from(liveElement.attributes).forEach(attr => {
          if (attr.name.startsWith('data-') || attr.name === 'class' || attr.name === 'style') {
            newGroup.setAttribute(attr.name, attr.value);
            liveElement.removeAttribute(attr.name);
          }
        });

        liveElement.parentNode.insertBefore(newGroup, liveElement);
        newGroup.appendChild(liveElement);
        liveElement = newGroup;

        tagLower = 'g';
        svgImageEl = liveElement.querySelector('image, img');

        if (onUpdateRef.current) setTimeout(() => onUpdateRef.current({ shouldRefresh: true }), 0);
      }

      const f = filters;
      const exposure = f.exposure || 0;
      const contrast = f.contrast || 0;
      const saturation = f.saturation || 0;
      const temperature = f.temperature || 0;
      const tint = f.tint || 0;
      const h = f.highlights || 0;
      const s = f.shadows || 0;

      let filterStr = "";
      filterStr += `brightness(${100 + exposure + (h / 5)}%) `;
      filterStr += `contrast(${100 + contrast + (s / 5)}%) `;
      filterStr += `saturate(${100 + saturation}%) `;
      if (tint !== 0) filterStr += `hue-rotate(${tint}deg) `;
      if (temperature > 0) filterStr += `sepia(${temperature / 2}%) `;
      else if (temperature < 0) filterStr += `hue-rotate(180deg) sepia(${Math.abs(temperature) / 2}%) hue-rotate(-180deg) `;

      if (activeEffects.includes('Blur')) {
        filterStr += `blur(${effectSettings['Blur'].blur}px) `;
      }

      let dsCssString = "";
      if (activeEffects.includes('Drop Shadow')) {
        const ds = effectSettings['Drop Shadow'];
        const alpha = Math.round((ds.opacity / 100) * 255).toString(16).padStart(2, '0');
        const colorWithAlpha = ds.color + (ds.color.length === 7 ? alpha : '');
        // drop-shadow filter is more robust for images and follows transparency
        dsCssString = `drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${colorWithAlpha})`;
      }

      // --- Opacity ---
      const opacityVal = (opacity / 100).toString();
      liveElement.style.opacity = opacityVal;
      if (isSvgEl) liveElement.setAttribute('opacity', opacityVal);

      // --- Radius & Clip-path ---
      const anyR = radius.tl || radius.tr || radius.br || radius.bl;
      if (anyR) {
        const radiusStr = `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px`;
        const clipVal = `inset(0% 0% 0% 0% round ${radiusStr})`;

        if (isSvgEl) {
          // If it's a group or wrapper containing an image, clip the image, not the wrapper.
          // Otherwise, clip the element itself.
          if (svgImageEl && svgImageEl !== liveElement) {
            svgImageEl.style.clipPath = clipVal;
            svgImageEl.style.webkitClipPath = clipVal;
            liveElement.style.clipPath = '';
            liveElement.style.webkitClipPath = '';
          } else {
            liveElement.style.clipPath = clipVal;
            liveElement.style.webkitClipPath = clipVal;
          }
          liveElement.removeAttribute('clip-path');
          liveElement.style.transformBox = 'fill-box';

          if (tagLower === 'rect') {
            const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
            liveElement.setAttribute('rx', maxR.toString());
          }

          liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
          liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
          liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
          liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
        } else {
          // HTML: Use pure border-radius
          liveElement.style.clipPath = '';
          liveElement.style.webkitClipPath = '';
          liveElement.style.setProperty('border-radius', radiusStr, 'important');
          liveElement.style.setProperty('overflow', 'hidden', 'important');
          if (svgImageEl && svgImageEl !== liveElement) {
            svgImageEl.style.setProperty('border-radius', radiusStr, 'important');
          }
          liveElement.setAttribute('data-effect-radius-tl', radius.tl.toString());
          liveElement.setAttribute('data-effect-radius-tr', radius.tr.toString());
          liveElement.setAttribute('data-effect-radius-br', radius.br.toString());
          liveElement.setAttribute('data-effect-radius-bl', radius.bl.toString());
        }
      } else {
        // Reset radius
        liveElement.style.clipPath = '';
        liveElement.style.webkitClipPath = '';
        liveElement.style.borderRadius = '';
        liveElement.style.overflow = '';
        liveElement.removeAttribute('clip-path');
        liveElement.removeAttribute('data-effect-radius-tl');
        liveElement.removeAttribute('data-effect-radius-tr');
        liveElement.removeAttribute('data-effect-radius-br');
        liveElement.removeAttribute('data-effect-radius-bl');
        if (svgImageEl && svgImageEl !== liveElement) {
          svgImageEl.style.clipPath = '';
          svgImageEl.style.webkitClipPath = '';
          svgImageEl.style.borderRadius = '';
        }
        if (tagLower === 'rect') {
          liveElement.removeAttribute('rx');
          liveElement.removeAttribute('ry');
        }
      }

      // --- Filter Application ---
      const adjustOnlyFilter = filterStr.trim() || 'none';
      const shadowOnlyFilter = dsCssString.trim() || 'none';
      const finalFilter = (filterStr + (dsCssString ? ` ${dsCssString}` : '')).trim() || 'none';

      if (isSvgEl) {
        const hasClip = anyR;

        // 1. Apply Adjustments to the actual image content (leaf)
        if (svgImageEl) {
          svgImageEl.style.setProperty('filter', adjustOnlyFilter, 'important');
        }

        // 2. Apply Drop Shadow to a sibling caster (best for SVG with clips)
        let shadowCaster = liveElement.querySelector('.svg-drop-shadow-caster');
        if (shadowOnlyFilter !== 'none' && hasClip) {
          if (!shadowCaster) {
            shadowCaster = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shadowCaster.classList.add('svg-drop-shadow-caster');
            shadowCaster.style.pointerEvents = 'none';
            liveElement.insertBefore(shadowCaster, liveElement.firstChild);
          }
          if (shadowCaster) {
            if (shadowCaster !== liveElement.firstChild) {
              liveElement.insertBefore(shadowCaster, liveElement.firstChild);
            }
            const targetEl = svgImageEl || liveElement;
            shadowCaster.setAttribute('x', targetEl.getAttribute('x') || '0');
            shadowCaster.setAttribute('y', targetEl.getAttribute('y') || '0');
            shadowCaster.setAttribute('width', targetEl.getAttribute('width') || '100%');
            shadowCaster.setAttribute('height', targetEl.getAttribute('height') || '100%');
            shadowCaster.setAttribute('transform', targetEl.getAttribute('transform') || '');

            shadowCaster.setAttribute('fill', 'black');
            shadowCaster.setAttribute('fill-opacity', opacityVal);

            shadowCaster.style.removeProperty('clip-path');
            shadowCaster.removeAttribute('rx');

            const maxR = Math.max(radius.tl, radius.tr, radius.br, radius.bl);
            if (maxR > 0) {
              shadowCaster.setAttribute('rx', maxR.toString());
            }

            shadowCaster.style.setProperty('filter', shadowOnlyFilter, 'important');
            shadowCaster.style.setProperty('display', 'block', 'important');
          }
        } else if (shadowCaster) {
          shadowCaster.style.setProperty('display', 'none', 'important');
        }

        // 3. Apply geometry-level filters to the selection element itself
        if (!hasClip) {
          liveElement.style.setProperty('filter', finalFilter, 'important');
        } else if (svgImageEl === liveElement) {
          liveElement.style.setProperty('filter', adjustOnlyFilter, 'important');
        } else {
          liveElement.style.removeProperty('filter');
        }
        if (liveElement.parentElement) {
          liveElement.parentElement.style.removeProperty('filter');
          liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
      } else {
        // FOR HTML
        liveElement.style.setProperty('filter', finalFilter, 'important');
        if (liveElement.parentElement) liveElement.parentElement.style.removeProperty('filter');

        if (activeEffects.includes('Drop Shadow') || activeEffects.includes('Blur')) {
          if (liveElement.parentElement) liveElement.parentElement.style.setProperty('overflow', 'visible', 'important');
        }
      }

      // Always clear box-shadow to ensure we only use the drop-shadow filter
      liveElement.style.boxShadow = 'none';

      // --- Object Fit ---
      const fitMap = { 'Fit': 'contain', 'Fill': 'cover', 'Crop': 'cover' };
      const objectFit = fitMap[imageType] || 'cover';
      if (svgImageEl) {
        svgImageEl.style.objectFit = objectFit;
        const preserveMap = { 'Fit': 'xMidYMid meet', 'Fill': 'xMidYMid slice', 'Crop': 'xMidYMid slice' };
        svgImageEl.setAttribute('preserveAspectRatio', preserveMap[imageType] || 'xMidYMid slice');
      } else {
        liveElement.style.objectFit = objectFit;
      }

      // --- Background & Stroke ---
      if (isSvgEl) {
        if (backgroundColor.fill !== 'transparent' && backgroundColor.fill !== 'none') liveElement.setAttribute('fill', backgroundColor.fill);
        else liveElement.removeAttribute('fill');

        // To support stroke on <image> elements (which ignore stroke attributes natively), we create a <rect> overlay
        if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none') {
          liveElement.setAttribute('stroke', backgroundColor.stroke);
          liveElement.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());

          if (backgroundColor.strokeType === 'Dashed') {
            const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
            liveElement.setAttribute('stroke-dasharray', dashArray);
          } else {
            liveElement.removeAttribute('stroke-dasharray');
          }

          liveElement.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
          liveElement.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
          liveElement.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

          // Dynamic Stroke Overlay for SVG images
          if (svgImageEl && svgImageEl.tagName?.toLowerCase() === 'image') {
            let strokeOverlay = liveElement.querySelector('.svg-gif-stroke-overlay');
            if (!strokeOverlay) {
              strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              strokeOverlay.classList.add('svg-gif-stroke-overlay');
              strokeOverlay.style.pointerEvents = 'none';
              liveElement.appendChild(strokeOverlay);

              // Attach a mutation observer to keep the overlay perfectly synced with the image's layout
              const syncOverlay = () => {
                if (!strokeOverlay.isConnected) return; // Stop if removed
                const targetEl = svgImageEl || liveElement;
                strokeOverlay.setAttribute('x', targetEl.getAttribute('x') || '0');
                strokeOverlay.setAttribute('y', targetEl.getAttribute('y') || '0');
                strokeOverlay.setAttribute('width', targetEl.getAttribute('width') || '100%');
                strokeOverlay.setAttribute('height', targetEl.getAttribute('height') || '100%');
                strokeOverlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
                strokeOverlay.style.transform = targetEl.style.transform;
                strokeOverlay.style.translate = targetEl.style.translate;
                strokeOverlay.style.scale = targetEl.style.scale;
                strokeOverlay.style.rotate = targetEl.style.rotate;
                strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;
                strokeOverlay.style.opacity = targetEl.style.opacity;
              };
              const obs = new MutationObserver(syncOverlay);
              obs.observe(liveElement, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
              if (svgImageEl && svgImageEl !== liveElement) {
                obs.observe(svgImageEl, { attributes: true, attributeFilter: ['x', 'y', 'width', 'height', 'transform', 'style'] });
              }
            }

            // Initial sync
            const targetEl = svgImageEl || liveElement;
            let bx = targetEl.getAttribute('x') || '0';
            let by = targetEl.getAttribute('y') || '0';
            let bw = targetEl.getAttribute('width') || '100%';
            let bh = targetEl.getAttribute('height') || '100%';

            if (!bx.includes('%') && !bx.includes('px')) bx = `${bx}px`;
            if (!by.includes('%') && !by.includes('px')) by = `${by}px`;
            if (!bw.includes('%') && !bw.includes('px')) bw = `${bw}px`;
            if (!bh.includes('%') && !bh.includes('px')) bh = `${bh}px`;

            const pos = backgroundColor.strokePosition || 'Center';
            const sw = backgroundColor.strokeWeight || 0;

            if (pos === 'Inside') {
              strokeOverlay.style.x = `calc(${bx} + ${sw / 2}px)`;
              strokeOverlay.style.y = `calc(${by} + ${sw / 2}px)`;
              strokeOverlay.style.width = `calc(${bw} - ${sw}px)`;
              strokeOverlay.style.height = `calc(${bh} - ${sw}px)`;
            } else if (pos === 'Outside') {
              strokeOverlay.style.x = `calc(${bx} - ${sw / 2}px)`;
              strokeOverlay.style.y = `calc(${by} - ${sw / 2}px)`;
              strokeOverlay.style.width = `calc(${bw} + ${sw}px)`;
              strokeOverlay.style.height = `calc(${bh} + ${sw}px)`;
            } else {
              strokeOverlay.style.x = bx;
              strokeOverlay.style.y = by;
              strokeOverlay.style.width = bw;
              strokeOverlay.style.height = bh;
            }

            strokeOverlay.removeAttribute('x');
            strokeOverlay.removeAttribute('y');
            strokeOverlay.removeAttribute('width');
            strokeOverlay.removeAttribute('height');
            strokeOverlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
            strokeOverlay.style.transform = targetEl.style.transform;
            strokeOverlay.style.translate = targetEl.style.translate;
            strokeOverlay.style.scale = targetEl.style.scale;
            strokeOverlay.style.rotate = targetEl.style.rotate;
            strokeOverlay.style.transformOrigin = targetEl.style.transformOrigin;
            strokeOverlay.style.opacity = targetEl.style.opacity;

            strokeOverlay.setAttribute('fill', 'none');
            
            liveElement.setAttribute('data-stroke-type', backgroundColor.strokeType);

            if (backgroundColor.strokeType === 'gradient' && backgroundColor.strokeStops) {
              liveElement.setAttribute('data-stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
              liveElement.setAttribute('data-stroke-stops', backgroundColor.strokeStops || '');
              liveElement.setAttribute('data-stroke-angle', backgroundColor.strokeAngle || '0');
              liveElement.setAttribute('data-stroke-radius', backgroundColor.strokeRadius || '100');
              
              strokeOverlay.setAttribute('stroke-type', 'gradient');
              strokeOverlay.setAttribute('stroke-gradient-type', backgroundColor.strokeGradientType || 'linear');
              strokeOverlay.setAttribute('stroke-stops', backgroundColor.strokeStops || '');
              strokeOverlay.setAttribute('stroke-angle', backgroundColor.strokeAngle || '0');
              strokeOverlay.setAttribute('stroke-radius', backgroundColor.strokeRadius || '100');
              syncGradient(liveElement.ownerDocument || document, strokeOverlay, 'stroke');
            } else {
              liveElement.removeAttribute('data-stroke-gradient-type');
              liveElement.removeAttribute('data-stroke-stops');
              liveElement.removeAttribute('data-stroke-angle');
              liveElement.removeAttribute('data-stroke-radius');
              
              strokeOverlay.removeAttribute('stroke-type');
              strokeOverlay.removeAttribute('stroke-gradient-type');
              strokeOverlay.removeAttribute('stroke-stops');
              strokeOverlay.removeAttribute('stroke-angle');
              strokeOverlay.removeAttribute('stroke-radius');

              strokeOverlay.setAttribute('stroke', backgroundColor.stroke);
            }
            strokeOverlay.setAttribute('stroke-width', backgroundColor.strokeWeight.toString());
            strokeOverlay.setAttribute('stroke-opacity', (backgroundColor.strokeOpacity / 100).toString());

            if (backgroundColor.strokeType === 'Dashed') {
              const dashArray = `${backgroundColor.strokeDashLength || 5},${backgroundColor.strokeDashGap || 5}`;
              strokeOverlay.setAttribute('stroke-dasharray', dashArray);
            } else {
              strokeOverlay.removeAttribute('stroke-dasharray');
            }

            strokeOverlay.setAttribute('data-stroke-position', backgroundColor.strokePosition || 'Center');
            strokeOverlay.setAttribute('stroke-linecap', backgroundColor.strokeLinecap || 'butt');
            strokeOverlay.setAttribute('stroke-linejoin', (backgroundColor.strokeLinecap || 'butt') === 'round' ? 'round' : 'miter');

            if (anyR) strokeOverlay.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl).toString());
            else strokeOverlay.removeAttribute('rx');
          }
        } else {
          liveElement.removeAttribute('stroke');
          liveElement.removeAttribute('stroke-width');
          liveElement.querySelector('.svg-gif-stroke-overlay')?.remove();
        }
      } else {
        // HTML Background & Border
        liveElement.style.backgroundColor = backgroundColor.fill;

        // Helper to convert hex to rgba for CSS border
        const hexToRgba = (hex, alpha) => {
          if (!hex || hex === 'transparent' || hex === 'none') return 'transparent';
          if (hex.startsWith('rgba')) return hex;
          if (hex.startsWith('#')) {
            let c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            c = '0x' + c.join('');
            return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
          }
          return hex;
        };

        let style = backgroundColor.strokeType.toLowerCase();
        if (backgroundColor.stroke !== 'transparent' && backgroundColor.stroke !== 'none' && (!backgroundColor.strokeType || backgroundColor.strokeType === 'none')) {
          style = 'solid';
        }

        const pos = backgroundColor.strokePosition || 'Center';
        const color = hexToRgba(backgroundColor.stroke, backgroundColor.strokeOpacity / 100);
        const weight = backgroundColor.strokeWeight;

        if (pos === 'Inside') {
          liveElement.style.borderWidth = `${weight}px`;
          liveElement.style.borderStyle = style;
          liveElement.style.borderColor = color;
          liveElement.style.outline = 'none';
        } else if (pos === 'Outside') {
          liveElement.style.borderWidth = `0px`;
          liveElement.style.outline = `${weight}px ${style} ${color}`;
          liveElement.style.outlineOffset = `0px`;
        } else {
          liveElement.style.borderWidth = `0px`;
          liveElement.style.outline = `${weight}px ${style} ${color}`;
          liveElement.style.outlineOffset = `-${weight / 2}px`;
        }
      }

      // Inner Shadow
      let innerShadowString = '';
      if (activeEffects.includes('Inner Shadow')) {
        const ds = effectSettings['Inner Shadow'];
        const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
        const color = ds.color || '#000000';
        let r = 0, g = 0, b = 0;
        if (color.startsWith('#')) {
          const hex = color.replace('#', '');
          if (hex.length === 3) {
            r = parseInt(hex[0]+hex[0], 16); g = parseInt(hex[1]+hex[1], 16); b = parseInt(hex[2]+hex[2], 16);
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0,2), 16); g = parseInt(hex.substring(2,4), 16); b = parseInt(hex.substring(4,6), 16);
          }
        }
        const rgbaStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        innerShadowString = `inset ${ds.x || 0}px ${ds.y || 0}px ${ds.blur || 0}px ${ds.spread || 0}px ${rgbaStr}`;
      }

      if (isSvgEl) {
        let overlay = liveElement.querySelector('.svg-gif-inner-shadow-rect');
        let oldOverlay = liveElement.querySelector('.svg-gif-inner-shadow');
        if (oldOverlay) oldOverlay.remove();
        
        let filterId = liveElement.getAttribute('data-inner-shadow-filter-id');

        if (activeEffects.includes('Inner Shadow')) {
          const ds = effectSettings['Inner Shadow'];
          const alpha = (ds.opacity !== undefined ? ds.opacity : 35) / 100;
          const color = ds.color || '#000000';
          
          if (!filterId) {
            filterId = 'inner-shadow-' + Math.random().toString(36).substr(2, 9);
            liveElement.setAttribute('data-inner-shadow-filter-id', filterId);
          }
          
          let svgDefs = liveElement.ownerSVGElement?.querySelector('defs');
          if (!svgDefs && liveElement.ownerSVGElement) {
            svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            liveElement.ownerSVGElement.prepend(svgDefs);
          }
          
          if (svgDefs) {
            let filterEl = svgDefs.querySelector(`#${filterId}`);
            if (!filterEl) {
              filterEl = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
              filterEl.id = filterId;
              svgDefs.appendChild(filterEl);
            }
            
            while(filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);
            
            const feOffset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
            feOffset.setAttribute('dx', ds.x || 0);
            feOffset.setAttribute('dy', ds.y || 0);
            
            const feBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feBlur.setAttribute('stdDeviation', (ds.blur || 0) / 2);
            feBlur.setAttribute('result', 'offset-blur');
            
            const feComp1 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp1.setAttribute('operator', 'out');
            feComp1.setAttribute('in', 'SourceAlpha');
            feComp1.setAttribute('in2', 'offset-blur');
            feComp1.setAttribute('result', 'inverse');
            
            const feFlood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
            feFlood.setAttribute('flood-color', color);
            feFlood.setAttribute('flood-opacity', alpha);
            feFlood.setAttribute('result', 'color');
            
            const feComp2 = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
            feComp2.setAttribute('operator', 'in');
            feComp2.setAttribute('in', 'color');
            feComp2.setAttribute('in2', 'inverse');
            feComp2.setAttribute('result', 'shadow');
            
            filterEl.appendChild(feOffset);
            filterEl.appendChild(feBlur);
            filterEl.appendChild(feComp1);
            filterEl.appendChild(feFlood);
            filterEl.appendChild(feComp2);
          }

          if (!overlay) {
            overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.classList.add('svg-gif-inner-shadow-rect');
            overlay.style.pointerEvents = 'none';
            overlay.setAttribute('fill', 'white');
            liveElement.appendChild(overlay);
          }
          
          const targetEl = svgImageEl || liveElement;
          let box = { x: 0, y: 0, width: 100, height: 100 };
          try { box = targetEl.getBBox(); } catch(e) {
            box.x = parseFloat(targetEl.getAttribute('x') || 0);
            box.y = parseFloat(targetEl.getAttribute('y') || 0);
            box.width = parseFloat(targetEl.getAttribute('width') || 100);
            box.height = parseFloat(targetEl.getAttribute('height') || 100);
          }
          
          overlay.setAttribute('x', box.x);
          overlay.setAttribute('y', box.y);
          overlay.setAttribute('width', Math.max(1, box.width));
          overlay.setAttribute('height', Math.max(1, box.height));
          overlay.setAttribute('transform', targetEl.getAttribute('transform') || '');
          
          const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
          if (anyR) overlay.setAttribute('rx', Math.max(radius.tl, radius.tr, radius.br, radius.bl));
          else overlay.removeAttribute('rx');

          overlay.setAttribute('filter', `url(#${filterId})`);
        } else {
          if (overlay) overlay.remove();
          if (filterId && liveElement.ownerSVGElement) {
             const f = liveElement.ownerSVGElement.querySelector(`#${filterId}`);
             if (f) f.remove();
          }
        }
      } else {
        let overlay = liveElement.querySelector('.inner-shadow-overlay') || liveElement.parentElement?.querySelector('.inner-shadow-overlay');
        if (innerShadowString) {
          const targetParent = (['IMG', 'VIDEO', 'IFRAME'].includes(liveElement.tagName)) ? liveElement.parentElement : liveElement;
          if (!overlay && targetParent) {
            overlay = document.createElement('div');
            overlay.className = 'inner-shadow-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '99999';
            overlay.style.boxSizing = 'border-box';
            if (window.getComputedStyle(targetParent).position === 'static') {
              targetParent.style.position = 'relative';
            }
            targetParent.appendChild(overlay);
          }
          if (overlay) {
            overlay.style.boxShadow = innerShadowString;
            const anyR = radius.tl > 0 || radius.tr > 0 || radius.br > 0 || radius.bl > 0;
            overlay.style.borderRadius = anyR ? `${radius.tl}px ${radius.tr}px ${radius.br}px ${radius.bl}px` : '0px';
          }
        } else if (overlay) {
          overlay.remove();
        }
      }

      // Persistence Data Attributes
      liveElement.setAttribute('data-effect-exposure', exposure.toString());
      liveElement.setAttribute('data-effect-contrast', contrast.toString());
      liveElement.setAttribute('data-effect-saturation', saturation.toString());
      liveElement.setAttribute('data-effect-temperature', temperature.toString());
      liveElement.setAttribute('data-effect-tint', tint.toString());
      liveElement.setAttribute('data-effect-highlights', h.toString());
      liveElement.setAttribute('data-effect-shadows', s.toString());
      liveElement.setAttribute('data-effect-opacity', opacity.toString());
      liveElement.setAttribute('data-active-effects', activeEffects.join(','));

      if (onUpdateRef.current) {
        clearTimeout(onUpdateTimerRef.current);
        onUpdateTimerRef.current = setTimeout(() => {
          const serializer = new XMLSerializer();
          const svgRoot = pageContainer?.querySelector('svg');
          if (svgRoot) {
            onUpdateRef.current(serializer.serializeToString(svgRoot));
          } else {
            onUpdateRef.current();
          }
        }, 400);
      }
    } finally {
      isUpdatingDOM.current = false;
    }
  }, [selectedElement, selectedLayerId, activePageIndex, filters, activeEffects, effectSettings, opacity, imageType, radius, backgroundColor, getSvgImageEl]);

  // Trigger applyVisuals when state changes
  useEffect(() => {
    applyVisuals();
  }, [applyVisuals]);

  const updateRadius = (corner, value) => {
    const val = Math.max(0, Number(value) || 0);
    const next = isRadiusLinked ? { tl: val, tr: val, br: val, bl: val } : { ...radius, [corner]: val };
    setRadius(next);
  };

  const updateEffectSetting = (effect, key, value) => {
    setEffectSettings(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
  };

  const handleColorPick = async (effectName) => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateEffectSetting(effectName, 'color', result.sRGBHex);
    } catch (e) {
      console.error('Color selection cancelled or failed', e);
    }
  };

  const getSrc = (el) => {
    if (!el) return "";
    return el.src || el.getAttribute("href") || el.getAttribute("xlink:href") || "";
  };

  const setSrc = (el, url) => {
    if (!el) return;
    if (el.tagName?.toLowerCase() === "image") {
      el.setAttribute("href", url);
      try { el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url); } catch (e) { }
    } else {
      el.src = url;
    }
  };

  const handleGifUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/gif") return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target.result;
      const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      const liveElement = (selectedLayerId && pageContainer) ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) : selectedElement;
      const targetImg = getSvgImageEl(liveElement) || liveElement;
      setSrc(targetImg, url);
      liveElement.dataset.mediaType = "gif";
      onUpdateRef.current?.({ shouldRefresh: true });

      const storedUser = localStorage.getItem('user');
      if (storedUser && (activeVId || (folderName && flipbookName))) {
        const user = JSON.parse(storedUser);
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        if (activeVId) formData.append('v_id', activeVId);
        formData.append('type', 'gif');
        formData.append('assetType', 'gif');
        formData.append('page_v_id', currentPageVId || 'global');
        formData.append('file', file);
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          if (res.data.url) {
            const serverUrl = `${backendUrl}${res.data.url}`;
            setSrc(targetImg, serverUrl);
            liveElement.dataset.fileVid = res.data.file_v_id;
            onUpdateRef.current?.();
          }
        } catch (err) { console.error("GIF upload failed:", err); }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!selectedElement) return null;

  return (
    <div className="relative flex flex-col gap-[1vw] w-full font-sans h-full overflow-y-auto no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type='range'] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type='range']::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        input[type='range']::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <div className="flex items-center gap-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">GIF Property</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" > </div>
      </div>

      <div className="flex items-center gap-[0.5vw] flex-1">
        <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Image fix type</span>
        <div className="h-[0px] flex-1 border-t border-dashed border-gray-300 mx-[0.25vw]" />
        <div className="relative">
          <button onClick={() => setShowImageTypeDropdown(!showImageTypeDropdown)} className="flex items-center justify-between w-[6.5vw] px-[0.75vw] py-[0.55vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-sm hover:bg-gray-50 transition-colors">
            <span className="text-[0.85vw] font-normal text-gray-700">{imageType}</span>
            <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform ${showImageTypeDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showImageTypeDropdown && (
            <div className="absolute right-0 top-full mt-[0.5vw] w-[6.5vw] bg-white border border-gray-100 rounded-[0.5vw] shadow-2xl z-[100] flex flex-col py-[0.2vw]">
              {['Fit', 'Fill', 'Stretch'].map((type) => (
                <button key={type} onClick={() => { setImageType(type); setShowImageTypeDropdown(false); }} className="px-[1vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#4D47FF] text-left transition-colors">{type}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-[0.75vw] pt-[0.5vw]">
        <div className="flex flex-col items-center gap-[0.35vw]">
          <div className="relative w-[5vw] h-[4.4vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center border border-dashed border-gray-300">
            {getSrc(getSvgImageEl(selectedElement) || selectedElement) ? (
              <img src={getSrc(getSvgImageEl(selectedElement) || selectedElement)} className="w-full h-full rounded-[0.3vw] object-contain" alt="Current GIF" />
            ) : (<ImageIcon size="1.2vw" className="text-gray-300" />)}
          </div>
          <span className="text-[0.6vw] font-semibold text-gray-400">Current Gif</span>
        </div>
        <div className="flex items-center justify-center shrink-0 h-[5vw] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]" />
        </div>
        <div onClick={() => fileInputRef.current?.click()} className="flex-1 h-[5vw] rounded-[0.75vw] border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 bg-white py-[0.2vw]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}>
          <Upload size="1.1vw" className="text-gray-400 mb-[0.2vw]" />
          <p className="text-[0.65vw] font-medium text-gray-600 text-center">Drag & Drop or <span className="text-[#4D47FF] font-semibold">Upload</span></p>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/gif" onChange={handleGifUpload} className="hidden" />

      <button onClick={() => setShowGallery(true)} className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group shadow-lg flex items-center justify-center border border-white/5 transition-all hover:scale-[1.01]">
        <div className="absolute inset-0 flex gap-[0.2vw] opacity-20 group-hover:opacity-40 transition-opacity">
          {galleryPreviewImages.map((src, i) => (<div key={i} className="flex-1 bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }} />))}
        </div>
        <div className="relative z-10 flex items-center gap-[0.75vw]">
          <Grid size="1vw" className="text-white" />
          <span className="text-[0.95vw] font-semibold text-white">GIF Gallery</span>
        </div>
      </button>

      <div className="flex flex-col gap-[0.5vw]">
        <div className="space-y-[0.5vw]">
          <div className="flex items-center gap-[0.5vw]">
            <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Opacity</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>
          <div className="flex items-center gap-[1vw] pb-[0.5vw]">
            <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="flex-1 cursor-pointer" style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${opacity}%, #E2E8F0 ${opacity}%, #E2E8F0 100%)` }} />
            <span className="text-[0.85vw] font-medium text-gray-800 w-[2.3vw] text-right">{opacity}%</span>
          </div>
        </div>

        <SubComponent
          openSubSection={openSubSection}
          setOpenSubSection={setOpenSubSection}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
          filters={filters}
          setFilters={setFilters}
          radius={radius}
          setRadius={setRadius}
          isRadiusLinked={isRadiusLinked}
          setIsRadiusLinked={setIsRadiusLinked}
          activeEffects={activeEffects}
          setActiveEffects={setActiveEffects}
          effectSettings={effectSettings}
          setEffectSettings={setEffectSettings}
          activeColorPicker={activeColorPicker}
          setActiveColorPicker={setActiveColorPicker}
          showStrokeSettings={showStrokeSettings}
          setShowStrokeSettings={setShowStrokeSettings}
          isStrokeStyleOpen={isStrokeStyleOpen}
          setIsStrokeStyleOpen={setIsStrokeStyleOpen}
          dropdownPos={dropdownPos}
          setDropdownPos={setDropdownPos}
          strokeSettingsPos={strokeSettingsPos}
          setStrokeSettingsPos={setStrokeSettingsPos}
          isDashPosOpen={isDashPosOpen}
          setIsDashPosOpen={setIsDashPosOpen}
          activePopup={activePopup}
          setActivePopup={setActivePopup}
          colorsOnPage={colorsOnPage}
          showDetailedPicker={showDetailedPicker}
          setShowDetailedPicker={setShowDetailedPicker}
        />
      </div>

      {showGallery && (
        <GalleryGif selectedElement={selectedElement} onUpdate={onUpdate} onClose={() => setShowGallery(false)} currentPageVId={currentPageVId} flipbookVId={activeVId} folderName={folderName} flipbookName={flipbookName} onSelect={async (gif) => { const optimisticUrl = gif.url; const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`); const liveElement = (selectedLayerId && pageContainer) ? pageContainer.querySelector(`[id="${selectedLayerId}"]`) : selectedElement; const targetImg = getSvgImageEl(liveElement) || liveElement; setSrc(targetImg, optimisticUrl); liveElement.dataset.mediaType = "gif"; onUpdateRef.current?.({ shouldRefresh: true }); setShowGallery(false); }} />
      )}
    </div>
  );
};

const syncGradient = (doc, element, baseAttr) => {
  const type = element.getAttribute(`${baseAttr}-type`);
  const currentValue = element.getAttribute(baseAttr);
  const isUrl = currentValue && currentValue.toLowerCase().startsWith('url(#');
  const gradType = element.getAttribute(`${baseAttr}-gradient-type`) || 'linear';
  const stopsJson = element.getAttribute(`${baseAttr}-stops`);

  if (type === 'solid' || type === 'none') return;

  if (isUrl && !stopsJson) {
    if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
      Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
        child.setAttribute(baseAttr, currentValue);
        if (child.style) child.style.setProperty(baseAttr, currentValue, 'important');
      });
    }
    return;
  }

  if (!type && !isUrl) return;
  if (!stopsJson) return;

  let stops = [];
  try { stops = JSON.parse(stopsJson); } catch (e) { return; }
  if (!stops || !Array.isArray(stops)) return;

  const svgRoot = element.closest('svg') || doc.querySelector('svg') || (doc.tagName?.toLowerCase() === 'svg' ? doc : null);
  if (!svgRoot) return;

  const ownerDoc = doc.ownerDocument || doc;

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }

  if (!element.id) {
    element.id = `${element.tagName}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const gradIdPrefix = `grad-${element.id}-${baseAttr}`;
  Array.from(defs.querySelectorAll(`[id^="${gradIdPrefix}"]`)).forEach(oldGrad => oldGrad.remove());

  const gradId = `${gradIdPrefix}-${Math.random().toString(36).substr(2, 4)}`;
  let gradEl = null;

  const svgGradType = (gradType === 'angular' || gradType === 'diamond') ? (gradType === 'angular' ? 'linear' : 'radial') : gradType;

  if (!gradEl) {
    gradEl = ownerDoc.createElementNS("http://www.w3.org/2000/svg", `${svgGradType}Gradient`);
    gradEl.id = gradId;
    if (svgGradType === 'linear') {
      const angle = parseFloat(element.getAttribute(`${baseAttr}-angle`) || '0');
      const angleRad = (angle * Math.PI) / 180;
      gradEl.setAttribute('x1', Math.round(50 - Math.cos(angleRad) * 50) + '%');
      gradEl.setAttribute('y1', Math.round(50 - Math.sin(angleRad) * 50) + '%');
      gradEl.setAttribute('x2', Math.round(50 + Math.cos(angleRad) * 50) + '%');
      gradEl.setAttribute('y2', Math.round(50 + Math.sin(angleRad) * 50) + '%');
    } else {
      const radius = parseFloat(element.getAttribute(`${baseAttr}-radius`) || '50');
      gradEl.setAttribute('cx', '50%');
      gradEl.setAttribute('cy', '50%');
      gradEl.setAttribute('r', radius + '%');
    }
    defs.appendChild(gradEl);
  }

  while (gradEl.firstChild) gradEl.removeChild(gradEl.firstChild);
  stops.forEach(s => {
    const stop = ownerDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute('offset', `${s.offset}%`);
    stop.setAttribute('stop-color', s.color);
    stop.setAttribute('stop-opacity', (s.opacity !== undefined && s.opacity !== null) ? s.opacity : 1);
    gradEl.appendChild(stop);
  });

  const finalUrl = `url(#${gradId})`;
  element.setAttribute(baseAttr, finalUrl);
  if (element.style) {
    element.style.setProperty(baseAttr, finalUrl, 'important');
  }

  if (element.tagName.toLowerCase() === 'g' || element.tagName.toLowerCase() === 'text') {
    Array.from(element.querySelectorAll('tspan, path, rect, circle, ellipse, polygon, polyline')).forEach(child => {
      child.setAttribute(baseAttr, finalUrl);
      if (child.style) child.style.setProperty(baseAttr, finalUrl, 'important');
    });
  }
};

export default GifEditor;
