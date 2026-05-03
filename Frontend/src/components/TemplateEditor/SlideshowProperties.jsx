import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Replace,
  Upload,
  X
} from 'lucide-react';
import GalleryImage from './GalleryImage';
import { Icon } from '@iconify/react';
import PremiumDropdown from '../CustomizedEditor/PremiumDropdown';
import NavIconStylesPopup, { NavIconRenderer } from '../CustomizedEditor/NavIconStylesPopup';
import axios from 'axios';
import ColorPicker from './ColorPicker';

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

const Toggle = ({ active, onClick }) => (
  <button 
    onClick={onClick}
    className={`group relative inline-flex items-center w-[2.2vw] h-[1.2vw] shrink-0 cursor-pointer rounded-[1vw] transition-all duration-200 ease-in-out border outline-none ${
              active ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-transparent border-[#4A3AFF]'
            }`}
          >
            <div
              className={`pointer-events-none flex items-center justify-center h-[1.1vw] w-[1.1vw] rounded-full  shadow-sm transition-all duration-200 border-[0.01vw] ease-in-out absolute  ${
                active ? 'left-[1.1vw] bg-white border-[#4A3AFF]' : 'right-[1.1vw] bg-[#4A3AFF] border-[#4A3AFF]'
              }`}
            >
              {active && (
                <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-indigo-600 " />
              )}
    </div>
   </button>
);

const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`group relative inline-flex items-center h-[1vw] w-[2vw] shrink-0 cursor-pointer rounded-[1vw] transition-all duration-200 ease-in-out border outline-none ${
              enabled ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-transparent border-[#4A3AFF]'
            }`}
          >
            <div
              className={`pointer-events-none flex items-center justify-center h-[1.1vw] w-[1.1vw] rounded-full  shadow-sm transition-all duration-200 border-[0.01vw] ease-in-out absolute  ${
                enabled ? 'left-[1.1vw] bg-white border-[#4A3AFF]' : 'right-[1.1vw] bg-[#4A3AFF] border-[#4A3AFF]'
              }`}
            >
              {enabled && (
                <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-indigo-600 " />
              )}
    </div>
  </button>
);

const RadioGroup = ({ options, value, onChange }) => (
  <div className="space-y-[0.75vw]">
    {options.map((opt) => (
      <label key={opt.id} className="text-[0.75vw] font-semibold text-gray-700">
        <div className="relative flex items-center justify-center">
          <input 
            type="radio" 
            name="radio-group"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="peer appearance-none w-[1vw] h-[1vw] border-2 border-gray-300 rounded-full checked:border-[#4A3AFF] transition-all bg-white"
          />
          <div className="absolute w-[0.3vw] h-[0.3vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className={`text-[0.85vw] font-medium ${value === opt.id ? 'text-gray-900' : 'text-gray-500'}`}>{opt.label}</span>
      </label>
    ))}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] py-[0.25vw] mt-[0.25vw]">
    <span className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">{title}</span>
    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-2vw' }}> </div>
  </div>
);

const MAX_GALLERY_IMAGES = 4;

const SlideshowProperties = ({ selectedElement, activePageIndex, onUpdate, isOpen, onToggle, opacity, onUpdateOpacity, setPreviewSrc, setIsUpdatingDOM, currentPageVId, flipbookVId, folderName, flipbookName, onDisableSlideshow }) => {
  // Slideshow specific states
  const [slideshowSettings, setSlideshowSettings] = useState({
    autoPlay: true,
    speed: 3,
    infiniteLoop: true,
    showArrows: true,
    showDots: true,
    imageFitType: 'Fill All',
    transitionEffect: 'Linear',
    dragToSlide: false,
    dotColor: '#4F46E5',
    dotOpacity: 100,
    navIconColor: '#000000',
    navStyle: 1,
    autoSlide: true
  });
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const isHoveringRef = useRef(false);
  const sidebarRef = useRef(null);

  const [showEffectDropdown, setShowEffectDropdown] = useState(false);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState(null);
  const [showDotColorPicker, setShowDotColorPicker] = useState(false);
  const [dotPickerPos, setDotPickerPos] = useState({ x: 0, y: 0 });
  const [showNavColorPicker, setShowNavColorPicker] = useState(false);
  const [navPickerPos, setNavPickerPos] = useState({ x: 0, y: 0 });
  const [showNavStylesPopup, setShowNavStylesPopup] = useState(false);
  const fileInputRef = useRef(null);
  
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [newReplaceImg, setNewReplaceImg] = useState(null);
  const replaceInputRef = useRef(null);
  
  const [isDisabling, setIsDisabling] = useState(false);
  const [isSlideshowPropOpen, setIsSlideshowPropOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isUpdatingDOM = useRef(false);
  const isUpdatingDOMTimeoutRef = useRef(null);
  const isHydrating = useRef(true);
  const isSyncingRef = useRef(false);
  const lastSyncedDataRef = useRef("");

  const onUpdateTimerRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  const onUpdateRef = useRef(onUpdate);
  const onUpdateOpacityRef = useRef(onUpdateOpacity);
  const setPreviewSrcRef = useRef(setPreviewSrc);
  const isAnimatingRef = useRef(false);
  const resetAutoTimerRef = useRef(null);

  const truncateLogData = (data) => {
    if (!data) return data;
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : JSON.parse(JSON.stringify(data));
      if (obj && obj.images) {
        obj.images = obj.images.map(img => ({
          ...img,
          url: (img.url && img.url.length > 100) ? (img.url.substring(0, 40) + "..." + img.url.substring(img.url.length - 20)) : img.url
        }));
      }
      return obj;
    } catch (e) { return data; }
  };

  const getSvgImageEl = (el) => {
    if (!el) return null;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'image' || tag === 'img') return el;
    
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
    const childImg = el.querySelector('image, img');
    if (childImg) return childImg;
    const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
    for (const child of Array.from(childrenWithPatterns)) {
        const target = findInPattern(child);
        if (target) return target;
    }
    return null;
  };

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onUpdateOpacityRef.current = onUpdateOpacity;
    setPreviewSrcRef.current = setPreviewSrc;
  });

  const syncStateFromDOM = useCallback((force = false) => {
    if (!selectedElement || isSyncingRef.current) return;

    isHydrating.current = true;
    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;


      const savedDataRaw = targetElement.getAttribute('data-slideshow');
      console.log("[SlideshowProperties] Syncing from DOM. SavedData:", truncateLogData(savedDataRaw));
      
      if (savedDataRaw) {
        const savedData = JSON.parse(savedDataRaw);
        if (savedData) {
          setSlideshowSettings(prev => ({ ...prev, ...savedData.settings }));
          setSlideshowImages(prev => {
            // NEVER overwrite if we are uploading or have optimistic blob URLs, even if forced
            const hasOptimistic = prev.some(img => img.isUploading || (img.url && img.url.startsWith('blob:')));
            if (hasOptimistic) return prev;
            
            const newImages = (savedData.images || []).slice(0, MAX_GALLERY_IMAGES);
            
            // If forced (e.g. element selection), we sync. 
            // Otherwise, we only sync if the DOM has more or different information.
            // Crucially, we don't let the DOM "shrink" our image list unless forced.
            if (!force && prev.length > 0 && newImages.length < prev.length) {
                return prev;
            }

            if (!force && prev.length > 0) return prev;

            return newImages;
          });
        }
      } else {
        // Default init
        setSlideshowSettings({
          autoPlay: true,
          speed: 3,
          infiniteLoop: true,
          showArrows: true,
          showDots: true,
          imageFitType: 'Fill All',
          transitionEffect: 'Linear',
          dragToSlide: false,
          dotColor: '#4F46E5',
          dotOpacity: 100,
          navIconColor: '#000000',
          navStyle: 1,
          autoSlide: true
        });
        const imgEl = getSvgImageEl(targetElement);
        const currentSrc = (imgEl?.getAttribute('href') || imgEl?.getAttribute('xlink:href') || imgEl?.getAttribute('src') || imgEl?.src || targetElement.getAttribute('href') || targetElement.getAttribute('xlink:href'));
        setSlideshowImages(prev => {
           const hasOptimistic = prev.some(img => img.isUploading || (img.url && img.url.startsWith('blob:')));
           if (hasOptimistic) return prev;
           if (prev.length > 0 && !force) return prev;
           return currentSrc ? [{ id: Date.now(), url: currentSrc, name: 'Main Image' }] : [];
        });
      }

      const activeIdx = parseInt(targetElement.getAttribute('data-active-index')) || 0;
      setActiveSlideIndex(activeIdx);

    } catch (e) {
      console.error("Failed to sync slideshow from DOM", e);
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      isHydrating.current = false;
      isSyncingRef.current = false;
      setIsSyncing(false);
      syncTimeoutRef.current = null;
    }, 50);
  }, [selectedElement]);

  const applyDesign = useCallback(() => {
    if (!selectedElement?.id || isDisabling || isUpdatingDOM.current) return;

    const apply = () => {
      const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
      const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;

      isUpdatingDOM.current = true;
      try {
        const dataToSave = {
          settings: slideshowSettings,
          images: slideshowImages.slice(0, MAX_GALLERY_IMAGES)
        };
        
        const newDataStr = JSON.stringify(dataToSave);
        const oldDataStr = targetElement.getAttribute('data-slideshow');
        
        // Use a unique signature for the "core" visual state (excluding current index)
        const visualStateSignature = JSON.stringify({
          id: selectedElement.id,
          data: dataToSave,
          opacity: opacity
        });

        if (newDataStr !== oldDataStr) {
          targetElement.setAttribute('data-slideshow', newDataStr);
          targetElement.setAttribute('data-is-slideshow', 'true');
          targetElement.dataset.slideshow = newDataStr;
          targetElement.dataset.isSlideshow = 'true';
          targetElement.setAttribute('data-slideshow-manual', 'true');
        }

        targetElement.setAttribute('data-active-index', activeSlideIndex.toString());

        // Sync active slide URL to href/src
        const targetImg = getSvgImageEl(targetElement) || targetElement;
        if (slideshowImages[activeSlideIndex]) {
          const url = slideshowImages[activeSlideIndex].url;
          if (targetImg.getAttribute('href') !== url || targetImg.src !== url) {
            targetImg.setAttribute('href', url);
            try { targetImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch (e) {}
            if (targetImg.tagName?.toLowerCase() === 'img') targetImg.src = url;
            if (setPreviewSrcRef.current) setPreviewSrcRef.current(url);
          }
        }

        // Fit mode
        if (targetElement.tagName?.toLowerCase() === 'image') {
          const val = slideshowSettings.imageFitType === 'Fill All' ? 'xMidYMid slice' : 'xMidYMid meet';
          targetElement.setAttribute('preserveAspectRatio', val);
        } else {
          const val = slideshowSettings.imageFitType === 'Fill All' ? 'cover' : 'contain';
          targetElement.style.objectFit = val;
        }

        // Apply Opacity
        targetElement.setAttribute('opacity', (opacity / 100).toString());
        targetElement.style.opacity = (opacity / 100).toString();

        // Only trigger a full refresh if the core structural data changed.
        // Changing the activeSlideIndex should NOT trigger onUpdate({shouldRefresh: true})
        // because that causes a full SVG re-render in the parent, leading to flickering.
        if (lastSyncedDataRef.current !== visualStateSignature) {
          lastSyncedDataRef.current = visualStateSignature;
          if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
        }
      } finally {
        if (isUpdatingDOMTimeoutRef.current) clearTimeout(isUpdatingDOMTimeoutRef.current);
        isUpdatingDOMTimeoutRef.current = setTimeout(() => {
          isUpdatingDOM.current = false;
          isUpdatingDOMTimeoutRef.current = null;
        }, 500);
      }
    };

    apply();
  }, [selectedElement?.id, JSON.stringify(slideshowSettings), JSON.stringify(slideshowImages.map(img => img.url)), activeSlideIndex, opacity, activePageIndex]);


  useEffect(() => {
    if (!selectedElement) return;
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingDOM.current) return;
      if (mutations.some(m => m.type === 'attributes')) {
        syncStateFromDOM();
      }
    });
    observer.observe(selectedElement, { attributes: true });
    syncStateFromDOM(true);
    return () => {
      observer.disconnect();
      isUpdatingDOM.current = false;
    };
  }, [selectedElement, syncStateFromDOM]);

  // Master Update Effect
  useEffect(() => {
    if (!isSyncingRef.current && !isSyncing && selectedElement?.id && !isDisabling) {
      applyDesign();
    }
  }, [selectedElement?.id, JSON.stringify(slideshowSettings), JSON.stringify(slideshowImages.map(img => img.url)), activeSlideIndex, opacity, isSyncing, applyDesign]);

  // ── Live Editor Runner ──
  // IMPORTANT: SVG elements can't host HTML children, so we inject
  // an absolutely-positioned overlay div into the HTML page container
  // and position it over the target element using getBoundingClientRect.
  const liveRunnerIndexRef = useRef(activeSlideIndex);
  const liveRunnerImagesRef = useRef(slideshowImages);
  const liveRunnerAutoTimer = useRef(null);
  const liveRunnerOverlayRef = useRef(null);

  useEffect(() => { liveRunnerIndexRef.current = activeSlideIndex; }, [activeSlideIndex]);
  useEffect(() => { liveRunnerImagesRef.current = slideshowImages; }, [slideshowImages]);

  const performTransition = useCallback((newIdx, dir = 'next') => {
    if (isAnimatingRef.current) return;

    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const targetElement = pageContainer?.querySelector(`[id="${selectedElement?.id}"]`) || selectedElement;
    if (!targetElement) return;

    const imgEl = getSvgImageEl(targetElement) || targetElement;
    const images = liveRunnerImagesRef.current;
    const nextUrl = images[newIdx]?.url;
    if (!nextUrl || !imgEl) return;

    const effect = (slideshowSettings.transitionEffect || 'Linear').toLowerCase();
    const duration = 400;
    
    isAnimatingRef.current = true;
    setIsUpdatingDOM(true);
    liveRunnerIndexRef.current = newIdx; // Update early to prevent interval double-trigger

    const finalize = () => {
      targetElement.setAttribute('data-active-index', newIdx.toString());
      liveRunnerIndexRef.current = newIdx; // Crucial for auto-slide interval
      setActiveSlideIndex(newIdx);
      
      // Sync overlay if exists
      const overlay = liveRunnerOverlayRef.current;
      if (overlay) {
        overlay.querySelectorAll('.editor-ss-dot').forEach((d, i) => {
          d.style.opacity = i === newIdx ? '1' : '0.4';
          d.style.transform = i === newIdx ? 'scale(1.4)' : 'scale(1)';
        });
      }

      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsUpdatingDOM(false);
        // Restart auto-slide timer after transition finishes to maintain consistent timing
        if (typeof resetAutoTimerRef.current === 'function') {
          resetAutoTimerRef.current();
        }
      }, 50);
    };

    const setElSrc = (url) => {
      imgEl.setAttribute('href', url);
      try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch(e) {}
      if (imgEl.tagName?.toLowerCase() === 'img') imgEl.src = url;
      if (setPreviewSrcRef.current) setPreviewSrcRef.current(url);
    };

    const animEl = targetElement;
    const baseOpacity = (opacity / 100).toString();
    
    // Use independent CSS properties to avoid overwriting the 'transform' attribute used for positioning
    animEl.style.transformBox = 'fill-box';
    animEl.style.transformOrigin = 'center';

    if (effect === 'fade') {
      animEl.style.transition = `opacity ${duration}ms ease-in-out`;
      animEl.style.opacity = '0';
      setTimeout(() => {
        setElSrc(nextUrl);
        animEl.style.opacity = baseOpacity;
        setTimeout(() => {
          animEl.style.transition = '';
          finalize();
        }, duration);
      }, duration);
    } else if (effect === 'slide' || effect === 'push' || effect === 'linear') {
      const slideDir = dir === 'next' ? -100 : 100;
      animEl.style.transition = `translate ${duration}ms ease-in-out`;
      animEl.style.translate = `${slideDir}% 0`;
      setTimeout(() => {
        setElSrc(nextUrl);
        animEl.style.transition = 'none';
        animEl.style.translate = `${-slideDir}% 0`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animEl.style.transition = `translate ${duration}ms ease-in-out`;
            animEl.style.translate = '0 0';
            setTimeout(() => {
              animEl.style.transition = '';
              finalize();
            }, duration);
          });
        });
      }, duration);
    } else if (effect === 'flip') {
      animEl.style.transition = `rotate ${duration}ms ease-in-out`;
      animEl.style.rotate = 'y 90deg';
      setTimeout(() => {
        setElSrc(nextUrl);
        animEl.style.rotate = 'y -90deg';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animEl.style.transition = `rotate ${duration}ms ease-in-out`;
            animEl.style.rotate = 'y 0deg';
            setTimeout(() => {
              animEl.style.transition = '';
              finalize();
            }, duration);
          });
        });
      }, duration);
    } else if (effect === 'reveal') {
      animEl.style.transition = `clip-path ${duration}ms ease-in-out`;
      animEl.style.clipPath = dir === 'next' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
      setTimeout(() => {
        setElSrc(nextUrl);
        animEl.style.clipPath = dir === 'next' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animEl.style.transition = `clip-path ${duration}ms ease-in-out`;
            animEl.style.clipPath = 'inset(0 0% 0 0%)';
            setTimeout(() => {
              animEl.style.transition = '';
              animEl.style.clipPath = '';
              finalize();
            }, duration);
          });
        });
      }, duration);
    } else {
      setElSrc(nextUrl);
      finalize();
    }
  }, [activePageIndex, selectedElement, slideshowSettings, opacity, setIsUpdatingDOM]);

  useEffect(() => {
    const pageContainer = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
    const getFreshTarget = () => {
      if (!pageContainer) return selectedElement;
      return pageContainer.querySelector(`[id="${selectedElement?.id}"]`) || selectedElement;
    };

    const roots = [];
    const cleanup = () => {
      // Clear manual flag when overlay is removed
      const freshTarget = getFreshTarget();
      if (freshTarget) freshTarget.removeAttribute('data-slideshow-manual');

      roots.forEach(r => {
        setTimeout(() => {
          try { r.unmount(); } catch(e) {}
        }, 0);
      });
      roots.length = 0;
      if (liveRunnerAutoTimer.current) { clearInterval(liveRunnerAutoTimer.current); liveRunnerAutoTimer.current = null; }
      if (liveRunnerOverlayRef.current) { liveRunnerOverlayRef.current.remove(); liveRunnerOverlayRef.current = null; }
    };

    if (!selectedElement || slideshowImages.length < 2) { 
      cleanup(); 
      return; 
    }

    // Set manual flag so global runner skips this element while it has an active interactive overlay
    const initialTarget = getFreshTarget();
    if (initialTarget) initialTarget.setAttribute('data-slideshow-manual', 'true');

    if (!pageContainer) return;

    // Position overlay to match target element bounds.
    // The page container may have CSS scale transforms (zoom), so we must
    // divide by the scale to convert from screen pixels → local layout pixels.
    const positionOverlay = () => {
      const overlay = liveRunnerOverlayRef.current;
      const freshTarget = getFreshTarget();
      if (!overlay || !freshTarget) return;

      const containerRect = pageContainer.getBoundingClientRect();
      const elRect = freshTarget.getBoundingClientRect();

      // Compute actual CSS scale of the container
      const scaleX = containerRect.width  / (pageContainer.offsetWidth  || 1);
      const scaleY = containerRect.height / (pageContainer.offsetHeight || 1);

      // Offset in screen pixels → divide by scale → local layout pixels
      const localLeft   = (elRect.left   - containerRect.left) / scaleX;
      const localTop    = (elRect.top    - containerRect.top)  / scaleY;
      const localWidth  = elRect.width  / scaleX;
      const localHeight = elRect.height / scaleY;

      overlay.style.left   = localLeft   + 'px';
      overlay.style.top    = localTop    + 'px';
      overlay.style.width  = localWidth  + 'px';
      overlay.style.height = localHeight + 'px';

      // Dynamic Scaling for Controls
      const baseWidth = 300; // Reference width for 1:1 scale
      const scaleFactor = Math.max(0.4, Math.min(1.8, localWidth / baseWidth));

      // Update Arrows
      overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
        const size = 26 * scaleFactor;
        btn.style.width = size + 'px';
        btn.style.height = size + 'px';
        const offset = 6 * scaleFactor;
        if (btn.style.left) btn.style.left = offset + 'px';
        if (btn.style.right) btn.style.right = offset + 'px';
        
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.style.width = (15 * scaleFactor) + 'px';
          svg.style.height = (15 * scaleFactor) + 'px';
        }
      });

      // Update Dots
      const dotsWrap = overlay.querySelector('.editor-ss-dots-wrap');
      if (dotsWrap) {
        dotsWrap.style.bottom = (8 * scaleFactor) + 'px';
        dotsWrap.style.gap = (5 * scaleFactor) + 'px';
        dotsWrap.querySelectorAll('.editor-ss-dot').forEach((dot, i) => {
          const size = 7 * scaleFactor;
          dot.style.width = size + 'px';
          dot.style.height = size + 'px';
          // Maintain active dot scaling
          const isActive = i === liveRunnerIndexRef.current;
          dot.style.transform = isActive ? `scale(1.4)` : 'scale(1)';
        });
      }
    };

    cleanup(); // remove any previous overlay

    // Create overlay div inside the HTML page container
    const overlay = document.createElement('div');
    overlay.className = 'editor-ss-overlay';
    Object.assign(overlay.style, {
      position: 'absolute',
      pointerEvents: 'none', // children opt-in with pointerEvents: 'auto'
      zIndex: '9999',
      overflow: 'visible',
    });
    pageContainer.style.position = 'relative';
    // Allow the container to show overflow so arrows at edges aren't clipped
    const prevOverflow = pageContainer.style.overflow;
    pageContainer.style.overflow = 'visible';
    pageContainer.appendChild(overlay);
    liveRunnerOverlayRef.current = overlay;
    positionOverlay();

    // Also reposition on scroll (editor canvas may be inside a scrollable area)
    const scrollableAncestor = pageContainer.closest('[class*="overflow"]') || document.documentElement;
    scrollableAncestor.addEventListener('scroll', positionOverlay, { passive: true });

    const { navIconColor = '#000000', navStyle: styleId = 1, showDots = true,
            showArrows = true, showNav = true, dotColor = '#4F46E5',
            autoSlide = true, autoPlay = true, speed = 3, infiniteLoop = true } = slideshowSettings;
    const showNavArrows = showArrows !== false && showNav !== false;

    // Helper: switch to a slide index
    const switchTo = (newIdx, dir = 'next') => {
      performTransition(newIdx, dir);
    };

    const resetAutoTimer = () => {
      if (liveRunnerAutoTimer.current) clearInterval(liveRunnerAutoTimer.current);
      const { autoSlide = true, autoPlay = true, speed = 3 } = slideshowSettings;
      if (!autoSlide && !autoPlay) return;

      const intervalMs = (parseFloat(speed) || 3) * 1000;
      liveRunnerAutoTimer.current = setInterval(() => {
        if (isAnimatingRef.current) return;
        // Only skip if mouse is actively over a control button
        const isHoveringControls = liveRunnerOverlayRef.current?.querySelector('button:hover');
        if (isHoveringControls) return;

        const images = liveRunnerImagesRef.current;
        if (!images || images.length < 2) return;
        
        let next = liveRunnerIndexRef.current + 1;
        if (next >= images.length) { if (!slideshowSettings.infiniteLoop) return; next = 0; }
        switchTo(next, 'next');
      }, intervalMs);
    };
    resetAutoTimerRef.current = resetAutoTimer;

    const navButtons = [];

    // ── Nav Arrows ──
    if (showNavArrows) {
      ['prev', 'next'].forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'editor-ss-nav';
        Object.assign(btn.style, {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [type === 'prev' ? 'left' : 'right']: '6px',
          zIndex: '10',
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'none',
          padding: '0',
          pointerEvents: 'none',
          opacity: '0',
          transition: 'transform 0.15s, opacity 0.2s',
        });
        const iconKey = type === 'prev' ? 'left' : 'right';
        const root = createRoot(btn);
        root.render(NavIconRenderer({ styleId, size: '22px', color: navIconColor })[iconKey]);
        roots.push(root);
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-50%) scale(1.25)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'translateY(-50%)'; });
        btn.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
        btn.addEventListener('click', (e) => {
          e.stopPropagation(); e.preventDefault();
          const images = liveRunnerImagesRef.current;
          const cur = liveRunnerIndexRef.current;
          let newIdx = type === 'prev' ? cur - 1 : cur + 1;
          if (newIdx < 0) newIdx = infiniteLoop ? images.length - 1 : 0;
          if (newIdx >= images.length) newIdx = infiniteLoop ? 0 : images.length - 1;
          switchTo(newIdx, type === 'prev' ? 'prev' : 'next');
          resetAutoTimer();
        });
        navButtons.push(btn);
        overlay.appendChild(btn);
      });
    }

    const handleMouseMove = (e) => {
      const freshTarget = getFreshTarget();
      if (!freshTarget || !freshTarget.getBoundingClientRect) return;
      
      const rect = freshTarget.getBoundingClientRect();
      const inBounds = e.clientX >= rect.left - 2 && e.clientX <= rect.right + 2 &&
                       e.clientY >= rect.top - 2 && e.clientY <= rect.bottom + 2;
      
      if (inBounds && !isHoveringRef.current) {
        isHoveringRef.current = true;
        freshTarget.setAttribute('data-is-hovering', 'true');
        if (liveRunnerAutoTimer.current) { 
          clearInterval(liveRunnerAutoTimer.current); 
          liveRunnerAutoTimer.current = null; 
        }
        navButtons.forEach(btn => {
           btn.style.opacity = '1';
           btn.style.pointerEvents = 'auto';
        });
      } else if (!inBounds && isHoveringRef.current) {
        isHoveringRef.current = false;
        freshTarget.removeAttribute('data-is-hovering');
        resetAutoTimer();
        navButtons.forEach(btn => {
           btn.style.opacity = '0';
           btn.style.pointerEvents = 'none';
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    overlay.style.pointerEvents = 'none'; // Allow clicking through to the SVG for dragging
    let dragStartX = 0, dragStartY = 0;
    const containerTarget = getFreshTarget();
    
    const handleTargetMouseDown = (e) => {
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };
    
    const handleTargetClick = (e) => {
      // Only advance if it was a click, not a drag
      const dx = Math.abs(e.clientX - dragStartX);
      const dy = Math.abs(e.clientY - dragStartY);
      if (dx > 5 || dy > 5) return;

      e.stopPropagation();
      const images = liveRunnerImagesRef.current;
      const cur = liveRunnerIndexRef.current;
      let next = cur + 1;
      if (next >= images.length) next = 0;
      switchTo(next, 'next');
    };

    if (containerTarget) {
      containerTarget.addEventListener('mousedown', handleTargetMouseDown);
      containerTarget.addEventListener('click', handleTargetClick);
    }

    // ── Pagination Dots ──
    if (showDots) {
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'editor-ss-dots-wrap';
      Object.assign(dotsWrap.style, {
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        pointerEvents: 'auto',
      });
      slideshowImages.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'editor-ss-dot';
        Object.assign(dot.style, {
          width: '7px', height: '7px', borderRadius: '50%', background: dotColor,
          cursor: 'pointer', transition: 'opacity 0.25s, transform 0.25s',
          opacity: i === liveRunnerIndexRef.current ? '1' : '0.4',
          transform: i === liveRunnerIndexRef.current ? 'scale(1.4)' : 'scale(1)',
          pointerEvents: 'auto',
        });
        dot.addEventListener('mousedown', e => e.stopPropagation());
        dot.addEventListener('click', (e) => {
          e.stopPropagation(); e.preventDefault();
          if (i === liveRunnerIndexRef.current) return;
          switchTo(i, i > liveRunnerIndexRef.current ? 'next' : 'prev');
          resetAutoTimer();
        });
        dotsWrap.appendChild(dot);
      });
      overlay.appendChild(dotsWrap);
    }

    // Keep overlay in sync if canvas resizes or element moves
    const resizeObserver = new ResizeObserver(positionOverlay);
    resizeObserver.observe(pageContainer);
    
    const mutationObserver = new MutationObserver(positionOverlay);
    const targetNode = getFreshTarget();
    if (targetNode) {
      mutationObserver.observe(targetNode, { 
        attributes: true, 
        attributeFilter: ['transform', 'x', 'y', 'width', 'height', 'style'] 
      });
    }

    window.addEventListener('resize', positionOverlay);

    resetAutoTimer();

    return () => {
      cleanup();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', positionOverlay);
      window.removeEventListener('mousemove', handleMouseMove);
      if (containerTarget) {
        containerTarget.removeEventListener('mousedown', handleTargetMouseDown);
        containerTarget.removeEventListener('click', handleTargetClick);
      }
      scrollableAncestor.removeEventListener('scroll', positionOverlay);
      // Restore original overflow
      pageContainer.style.overflow = prevOverflow;
    };
  }, [selectedElement, slideshowImages.length, JSON.stringify(slideshowSettings), activePageIndex]);


  const uploadFile = useCallback(async (file, replacingVideoId = null) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId);
    if (flipbookVId) formData.append('v_id', flipbookVId);
    
    // Provide defaults for unsaved books
    formData.append('folderName', folderName || 'My Flipbooks');
    formData.append('flipbookName', flipbookName || 'Untitled Document');
    
    formData.append('type', 'image');
    formData.append('assetType', 'Image');
    formData.append('page_v_id', currentPageVId || 'global');
    
    if (replacingVideoId) {
        formData.append('replacing_file_v_id', replacingVideoId);
    }
    formData.append('file', file);

    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
        if (res.data.url) {
            return {
                url: `${backendUrl}${res.data.url}`,
                file_v_id: res.data.file_v_id,
                name: res.data.filename
            };
        }
    } catch (err) {
        console.error("Slideshow image upload failed:", err);
    }
    return null;
  }, [flipbookVId, folderName, flipbookName, currentPageVId]);

  const handleFileUpload = useCallback(async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_GALLERY_IMAGES - slideshowImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // 1. Create Optimistic State with Blob URLs
    const optimisticImages = filesToUpload.filter(file => file.type.startsWith('image/')).map((file, idx) => ({
      id: Date.now() + idx, 
      url: URL.createObjectURL(file), 
      name: file.name,
      isUploading: true,
      file_orig: file // Keep reference for upload
    }));

    if (optimisticImages.length === 0) return;

    setSlideshowImages(prev => [...prev, ...optimisticImages]);
    e.target.value = '';

    // 2. Upload in Background and Update State
    for (const img of optimisticImages) {
        const uploadedData = await uploadFile(img.file_orig);
        
        setSlideshowImages(prev => prev.map(item => {
            if (item.id === img.id) {
                if (uploadedData) {
                    return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
                } else {
                    return { ...item, isUploading: false };
                }
            }
            return item;
        }));
    }
  }, [slideshowImages, uploadFile]);
  
  const handleReplaceFileChange = useCallback(async (e) => {
      const file = e.target.files?.[0];
      if (!file || replaceTargetIndex === null) return;
      
      const targetImg = slideshowImages[replaceTargetIndex];
      if (!targetImg) return;

      // Optimistic update
      const optimisticUrl = URL.createObjectURL(file);
      setSlideshowImages(current => {
          const updated = [...current];
          if (updated[replaceTargetIndex]) {
              updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], url: optimisticUrl, isUploading: true };
          }
          return updated;
      });
      
      e.target.value = '';

      // Upload
      const uploadedData = await uploadFile(file, targetImg.file_v_id);
      
      // Final update
      setSlideshowImages(current => 
          current.map((img, idx) => {
              if (idx === replaceTargetIndex) {
                  return uploadedData 
                      ? { ...img, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false }
                      : { ...img, isUploading: false };
              }
              return img;
          })
      );
      setReplaceTargetIndex(null);
  }, [replaceTargetIndex, slideshowImages, uploadFile]);



  const handleReplaceUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const imageUrl = URL.createObjectURL(file);
    setNewReplaceImg({ url: imageUrl, name: file.name, file: file }); // Store file object for upload
    e.target.value = '';
  };

  const confirmReplace = useCallback(async () => {
    if (!newReplaceImg || replaceTargetIndex === null) return;
    
    const targetImage = slideshowImages[replaceTargetIndex];
    const fileToUpload = newReplaceImg.file;

    // Optimistic Update
    setSlideshowImages(prev => {
      const updated = [...prev];
      if (updated[replaceTargetIndex]) {
        updated[replaceTargetIndex] = { 
            ...updated[replaceTargetIndex], 
            url: newReplaceImg.url, 
            name: newReplaceImg.name,
            isUploading: true
        };
      }
      return updated;
    });
    
    setShowReplaceModal(false);
    setReplaceTargetIndex(null);
    setNewReplaceImg(null);

    // Upload
    if (fileToUpload) {
        const uploadedData = await uploadFile(fileToUpload, targetImage.file_v_id); // Pass existing v_id for replacement
        
        if (uploadedData) {
             setSlideshowImages(prev => prev.map((item, idx) => {
                 if (idx === replaceTargetIndex || (item.isUploading && item.url === newReplaceImg.url)) { // Fallback matching
                      return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
                 }
                 return item;
             }));
        }
    }
    
    if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
  }, [newReplaceImg, replaceTargetIndex, slideshowImages, uploadFile]);

  const deleteImage = useCallback(async (index) => {
    const img = slideshowImages[index];
    if (!img) return;

    // Optimistic remove
    setSlideshowImages(prev => prev.filter((_, idx) => idx !== index));
    setOpenContextMenu(null);

    // Backend delete
    if (img.file_v_id) {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                await axios.post(`${backendUrl}/api/flipbook/delete-asset`, {
                    emailId: user.emailId,
                    file_v_id: img.file_v_id,
                    assetType: 'Image',
                    folderName: folderName || 'My Flipbooks',
                    bookName: flipbookName || 'Untitled Document'
                });
            }
        } catch (error) {
            console.error("Failed to delete asset from backend:", error);
        }
    }
  }, [slideshowImages, folderName, flipbookName]);

  const handleGallerySelect = useCallback((img) => {
    if (!img) return;
    
    // Choose target index: priority to libraryTargetIndex if user clicked a specific slot
    const targetIdx = libraryTargetIndex !== null ? libraryTargetIndex : activeSlideIndex;
    
    setSlideshowImages(prev => {
        const updated = [...prev];
        const newImgObj = { 
            id: Date.now(), 
            url: img.url, 
            name: img.name, 
            file_v_id: img.file_v_id,
            isUploading: false 
        };
        
        if (targetIdx < updated.length) {
            updated[targetIdx] = newImgObj;
        } else if (updated.length < MAX_GALLERY_IMAGES) {
            updated.push(newImgObj);
        }
        return updated;
    });

    if (targetIdx < MAX_GALLERY_IMAGES) {
       setActiveSlideIndex(targetIdx);
    }
    
    setLibraryTargetIndex(null);
    setOpenContextMenu(null);
    setShowGallery(false);
    
    // Immediate canvas update
    if (onUpdateRef.current) onUpdateRef.current({ shouldRefresh: true });
  }, [libraryTargetIndex, activeSlideIndex]);

  const updateSetting = (key, value) => {
    setSlideshowSettings({ ...slideshowSettings, [key]: value });
  };
  const effects = ['Linear', 'Fade', 'Slide', 'Push', 'Flip', 'Reveal'];

  return (
    <div ref={sidebarRef} className="space-y-[1vw]">
      <style>{`
        .ss-slider { -webkit-appearance: none; width: 100%; background: transparent; }
        .ss-slider::-webkit-slider-runnable-track { height: 0.5vw; border-radius: 9999px; background: inherit; }
        .ss-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1.6vw; width: 1.6vw; border-radius: 50%; background: #4D47FF; border: 0.2vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; }
        .ss-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }

        .image-editor-toggle {
          appearance: none;
          width: 2.75vw;
          height: 1.35vw;
          border-radius: 1vw;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
          background: #4D47FF;
        }
        .image-editor-toggle::before {
          content: "";
          position: absolute;
          width: 1.1vw;
          height: 1.1vw;
          border-radius: 50%;
          top: 50%;
          left: 1.5vw;
          transform: translateY(-50%);
          background: white;
          transition: 0.3s;
          box-shadow: 0 0.1vw 0.2vw rgba(0,0,0,0.2);
        }
      `}</style>
      {/* ── Slideshow header ── */}
      <div className="flex items-center gap-[0.9vw] py-[0.25vw] mb-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap">Slideshow</span>
        <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.6vw' }}> </div>
      </div>

      {/* ── Slideshow Mode Toggle ── */}
      <div className="flex items-center justify-between px-[0.25vw] mb-[1vw]">
         <span className="text-[0.75vw] text-gray-800">Turn on to Image</span>
         <button
            onClick={() => {
              setIsDisabling(true);
              onDisableSlideshow?.();
            }}
            className={`relative w-[2.75vw] h-[1.35vw] rounded-full transition-colors duration-300 ${isDisabling ? 'bg-gray-200' : 'bg-[#4D47FF]'}`}
         >
            <div className={`absolute top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] bg-white rounded-full shadow-md transition-all duration-300 ${isDisabling ? 'left-[0.15vw]' : 'left-[1.5vw]'}`} />
         </button>
      </div>

      {/* ── Image Fix Type (Top Level) ── */}
      <div className="flex items-center justify-between px-[0.25vw] mb-[1vw]">
         <span className="text-[0.75vw] font-medium text-gray-700 flex-1 whitespace-nowrap">
            Image fix type <span className="text-gray-300 tracking-[0.3vw] ml-[0.3vw]">----------------</span>
         </span>
         <div className="relative z-50">
            <button onClick={() => setShowFitDropdown(!showFitDropdown)} className="flex items-center justify-between gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-100 rounded-[0.4vw] hover:border-gray-200 shadow-sm transition-all text-[0.75vw] font-medium text-gray-600 min-w-[5vw]">
               <span>{slideshowSettings.imageFitType === 'Fill All' ? 'Fill' : 'Fit'}</span>
               <ChevronDown size="0.8vw" className={`text-gray-500 transition-transform ${showFitDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showFitDropdown && (
               <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowFitDropdown(false)} />
                  <div className="absolute right-0 top-full mt-[0.25vw] w-full min-w-[5vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-xl z-[100] py-[0.25vw] overflow-hidden">
                     {[ { label: 'Fit All', val: 'Fit All' }, { label: 'Fill All', val: 'Fill All' } ].map(type => (
                        <button key={type.val} onClick={() => { updateSetting('imageFitType', type.val); setShowFitDropdown(false); }} className="w-full text-left px-[0.75vw] py-[0.5vw] text-[0.7vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600">{type.label}</button>
                     ))}
                  </div>
               </>
            )}
         </div>
      </div>

      <div className="space-y-7">
             
             {/* 1. Info Row */}
             <div className="flex items-center gap-[0.4vw] px-[0.25vw]">
               <div className="relative">
                 <button
                   className="w-[1.1vw] h-[1.1vw] rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-[0.6vw] font-semibold hover:bg-gray-100 transition-colors"
                   onMouseEnter={() => setShowInfoTooltip(true)}
                   onMouseLeave={() => setShowInfoTooltip(false)}
                 >
                   i
                 </button>
                 {showInfoTooltip && (
                   <div className="absolute left-[1.5vw] top-0 bg-gray-800 text-white text-[0.65vw] px-[0.75vw] py-[0.4vw] rounded-[0.4vw] whitespace-nowrap z-50 shadow-lg">
                     You can add up to 4 images in Gallery
                   </div>
                 )}
               </div>
               <span className="text-[0.7vw] text-gray-400 font-medium italic">You can add up to 4 images in Gallery *</span>
             </div>

             {/* 2. Images Grid */}
             <div className="grid grid-cols-4 gap-[0.75vw] px-[0.05vw]">
               {Array.from({ length: Math.min(MAX_GALLERY_IMAGES, slideshowImages.length + 1) }).map((_, i) => (
                 <div key={i} className="relative group/slot">
                   <div 
                     className={`aspect-[1/1] w-full rounded-[0.4vw] cursor-pointer border-[0.1vw] transition-all duration-300 relative flex items-center justify-center group/card hover:scale-[1.05] hover:-translate-y-[0.25vw] hover:z-20 ${
                       activeSlideIndex === i 
                         ? 'border-gray-500 bg-gray-100 shadow-[0_0.65vw_1.25vw_-0.4vw_rgba(99,102,241,0.3)]' 
                         : (slideshowImages[i] ? 'border-gray-200 hover:border-gray-400 hover:shadow-[0_0.75vw_1.5vw_-0.5vw_rgba(0,0,0,0.15)]' : 'border-gray-400 hover:border-indigo-400 shadow-sm')
                     } ${!slideshowImages[i] ? 'bg-gray-50/50 border-dashed' : 'bg-white shadow-sm'}`}
                    onClick={() => {
                      if (activeSlideIndex === i) {
                        // Toggle fit mode when clicking already selected slide (exact OtherSetup.jsx effect)
                        const current = slideshowSettings.imageFitType || 'Fill All';
                        updateSetting('imageFitType', current === 'Fit All' ? 'Fill All' : 'Fit All');
                      } else {
                        performTransition(i, i > activeSlideIndex ? 'next' : 'prev');
                      }
                    }}
                   >
                     {slideshowImages[i]?.isUploading ? (
                       <div className="flex flex-col items-center justify-center gap-[0.375vw] w-full h-full">
                         <div className="w-[1.2vw] h-[1.2vw] border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                       </div>
                     ) : slideshowImages[i] ? (
                       <img src={slideshowImages[i].url} className="w-full h-full rounded-[0.3vw] transition-all duration-300" style={{ objectFit: (slideshowSettings.imageFitType || 'Fill All') === 'Fill All' ? 'cover' : 'contain' }} alt="" />
                     ) : (
                       <div 
                         onClick={(e) => { 
                          e.stopPropagation(); 
                          const pageContainer = document.querySelector(`[data-page-index="${activePageIndex}"]`);
                          const targetElement = pageContainer?.querySelector(`[id="${selectedElement.id}"]`) || selectedElement;
                          setActiveSlideIndex(i); 
                          targetElement.setAttribute('data-active-index', i.toString());
                          fileInputRef.current?.click(); 
                        }}
                         className="flex flex-col items-center justify-center gap-[0.375vw] opacity-30 group-hover/card:opacity-70 transition-all duration-300 w-full h-full"
                       >
                         <Upload size="0.95vw" strokeWidth={1.5} className="text-gray-900" />
                         <span className="text-[0.6vw] font-semibold text-gray-900">Upload</span>
                       </div>
                     )}
    
                     <button 
                       onClick={(e) => { e.stopPropagation(); setOpenContextMenu(openContextMenu === i ? null : i); }}
                       className={`absolute -top-[0.375vw] -right-[0.375vw] w-[1.75vw] h-[1.75vw] rounded-full bg-white shadow-[0_0.1vw_0.5vw_rgba(0,0,0,0.15)] border-[0.1vw] border-gray-200 flex items-center justify-center transition-all duration-200 z-30 ${
                         openContextMenu === i ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/card:opacity-100 group-hover/card:scale-100'
                       } hover:bg-gray-50 active:scale-125`}
                     >
                       <MoreVertical size="0.7vw" className="text-gray-600" strokeWidth={2.5} />
                     </button>
                   </div>

                   {openContextMenu === i && (
                     <>
                       <div className="fixed inset-0 z-[105]" onClick={() => setOpenContextMenu(null)} />
                       <div className={`absolute top-[40%] mt-[0.25vw] w-[7.5vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${(i % 4) >= 2 ? 'right-0' : 'left-0'}`}>
                         <button onClick={() => { if (slideshowImages[i]) { setReplaceTargetIndex(i); replaceInputRef.current?.click(); setOpenContextMenu(null); } else { setActiveSlideIndex(i); fileInputRef.current?.click(); setOpenContextMenu(null); } }} className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors flex items-center gap-[0.5vw]">{slideshowImages[i] ? 'Replace Image' : 'Upload Image'}</button>
                         <button onClick={() => { setLibraryTargetIndex(i); setShowGallery(true); setOpenContextMenu(null); }} className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors flex items-center gap-[0.5vw]">Image Gallery</button>
                         {slideshowImages[i] && <button onClick={() => deleteImage(i)} className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-red-500 hover:bg-red-50 text-left transition-colors flex items-center gap-[0.5vw]">Delete Image</button>}
                       </div>
                     </>
                   )}
                 </div>
               ))}
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
             <input type="file" ref={replaceInputRef} onChange={handleReplaceFileChange} accept="image/*" className="hidden" />
            
             {/* 3. Library Access Button */}
             <button onClick={() => setShowGallery(true)} className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5">
                <div className="absolute inset-0 flex gap-[0.5vw] opacity-20 group-hover:opacity-40 transition-opacity">
                   {[1, 2, 3].map(j => <div key={j} className="flex-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=300&auto=format&fit=crop')" }} />)}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray/10 via-gray/20 to-gray/40 group-hover:via-gray/20 transition-all"></div>
                <div className="relative z-10 flex items-center gap-[0.75vw]">
                   <Icon icon="clarity:image-gallery-solid" className="w-[1vw] h-[1.2vw] text-white" />
                   <span className="text-[0.95vw] font-semibold text-white ">Image Gallery</span>
                </div>
             </button>

             {/* 4. Slideshow Property Consolidated Accordion */}
             <div className="border border-gray-100 rounded-[0.75vw] overflow-hidden shadow-sm bg-white">
                <button 
                  onClick={() => setIsSlideshowPropOpen(!isSlideshowPropOpen)}
                  className="w-full flex items-center justify-between px-[1vw] py-[1vw] text-[0.9vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>Slideshow Property</span>
                  <ChevronDown size="1.1vw" className={`text-gray-900 transition-transform duration-200 ${isSlideshowPropOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSlideshowPropOpen && (
                  <div className="px-[1vw] pt-[0.5vw] border-t border-gray-50 space-y-[1.25vw] animate-in slide-in-from-top-2">
                    
                    {/* 2. Slide Effect Group */}
                    <div className="space-y-[0.75vw]">
                       <SectionHeader title="Slide Effect" />
                       <div className="flex items-center justify-between px-[0.2vw]">
                          <span className="text-[0.75vw] font-medium text-gray-700">Select Slide Effects :</span>
                          <PremiumDropdown 
                             options={['Linear', 'Fade', 'Slide', 'Push', 'Flip', 'Reveal']}
                             value={slideshowSettings.transitionEffect || 'Linear'}
                             onChange={(val) => updateSetting('transitionEffect', val)}
                             width="7vw"
                             align="right"
                             buttonClassName="!border-gray-400 !border-[0.1vw] !rounded-[0.5vw]"
                          />
                       </div>
                    </div>

                    {/* 3. Navigation Controls Group */}
                    <div className="space-y-[1vw] pt-[0.25vw]">
                       <SectionHeader title="Navigation Controls" />
                       
                       <div className="flex flex-col gap-[1.2vw] mt-[0.75vw] px-[0.2vw]">
                           {/* Auto Slide Duration Row */}
                           <div className="flex items-center justify-between">
                              <span className="text-[0.75vw] font-medium text-gray-500">Auto Slide Duration</span>
                              <div className="flex-1 border-b border-dashed border-gray-200 mx-[1vw]" />
                              <div className="flex items-center gap-[0.5vw]">
                                 <button 
                                   onClick={() => updateSetting('speed', Math.max(1, (slideshowSettings.speed || 3) - 1))} 
                                   className="text-gray-400 hover:text-gray-700 transition-colors"
                                 >
                                   <ChevronLeft size="1.1vw" />
                                 </button>
                                 <div className="w-[3vw] h-[2vw] border border-gray-300 rounded-[0.4vw] flex items-center justify-center bg-white shadow-sm">
                                    <span className="text-[0.85vw] font-medium text-gray-800">{(slideshowSettings.speed || 3)}s</span>
                                 </div>
                                 <button 
                                   onClick={() => updateSetting('speed', Math.min(20, (slideshowSettings.speed || 3) + 1))} 
                                   className="text-gray-400 hover:text-gray-700 transition-colors"
                                 >
                                   <ChevronRight size="1.1vw" />
                                 </button>
                              </div>
                           </div>

                           {/* Manual Navigation Icon Section */}
                           <div className="space-y-[0.6vw]">
                              <div className="flex items-center justify-between">
                                 <span className="text-[0.75vw] font-medium text-gray-500">Manual Navigation Icon</span>
                                 <div className="flex-1 border-b border-dashed border-gray-200 ml-[0.2vw]" />
                              </div>
                              
                              <div className="flex items-center justify-center gap-[1vw]">
                                 {/* Left: Color & Hex */}
                                 <div className="flex items-center gap-[0.4vw] shrink-0">
                                    <div 
                                       className="w-[2.2vw] h-[2.2vw] rounded-[0.5vw] cursor-pointer shadow-sm border border-gray-100" 
                                       style={{ backgroundColor: slideshowSettings.navIconColor || '#000000' }}
                                       onClick={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const sidebarRect = sidebarRef.current?.getBoundingClientRect() || { left: 0 };
                                          setNavPickerPos({ x: sidebarRect.left - 200, y: rect.bottom - 40 });
                                          setShowNavColorPicker(true);
                                       }}
                                    />
                                    <div className="flex items-center justify-between border border-gray-400 rounded-[0.5vw] px-[0.75vw] bg-white h-[2.2vw] w-[8vw]">
                                       <span className="text-[0.75vw] text-gray-700 font-semibold uppercase">{slideshowSettings.navIconColor || '#000000'}</span>
                                       <span className="text-[0.75vw] text-gray-400">100%</span>
                                    </div>
                                 </div>

                                 {/* Right: Icon Preview Card */}
                                 <div 
                                   onClick={() => setShowNavStylesPopup(true)}
                                   className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-[0.5vw] p-[0.8vw] flex items-center gap-[0.8vw] border border-gray-200 cursor-pointer hover:border-gray-500 transition-all shrink-0"
                                 >
                                    <div className="w-[2vw] h-[2vw] bg-black rounded-[0.4vw] flex items-center justify-center">
                                      {NavIconRenderer({ styleId: slideshowSettings.navStyle || 1, size: '0.9vw', color: 'white' }).left}
                                    </div>
                                    <div className="w-[2vw] h-[2vw] bg-black rounded-[0.4vw] flex items-center justify-center">
                                      {NavIconRenderer({ styleId: slideshowSettings.navStyle || 1, size: '0.9vw', color: 'white' }).right}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                    </div>

                    {/* 4. Other Controls Group */}
                    <div className="space-y-[1vw] pb-[0.5vw]">
                       <SectionHeader title="Other Controls" />
                                           <div className="flex items-center justify-between">
                             <span className="text-[0.75vw] font-medium text-gray-600">Pagination Dots</span>
                             <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.5vw]" />
                             <Switch enabled={slideshowSettings.showDots ?? true} onChange={(v) => updateSetting('showDots', v)} />
                          </div>
                          {(slideshowSettings.showDots ?? true) && (
                              <div className="flex items-center justify-between px-[0.5vw] mb-[1vw] animate-in slide-in-from-top-1 fade-in duration-200 mt-[0.5vw]">
                                 <span className="text-[0.75vw] pl-[0.5vw] font-medium text-gray-600 mt-[0.5vw]">Pagination Dot Color</span>
                                 <div className="flex items-center gap-[0.4vw]  mt-[0.5vw]">
                                    <div 
                                       className="w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 overflow-hidden relative cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95" 
                                       style={{ backgroundColor: slideshowSettings.dotColor || '#4F46E5' }}
                                       onClick={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const sidebarRect = sidebarRef.current?.getBoundingClientRect() || { left: 0 };
                                          const pickerWidth = window.innerWidth * 0.15;
                                          setDotPickerPos({ 
                                             x: sidebarRect.left - (pickerWidth / 2), 
                                             y: Math.min(window.innerHeight - 350, rect.top - 150) 
                                          });
                                          setShowDotColorPicker(true);
                                       }}
                                    />
                                    {/* Hex code */}
                                   <div className="flex items-center justify-between border border-gray-500 rounded-[0.4vw] px-[0.5vw] bg-white h-[1.8vw] w-[6.5vw]">
                                      <span className="text-[0.75vw] text-gray-700 font-medium uppercase">{slideshowSettings.dotColor || '#4F46E5'}</span>
                                      <span className="text-[0.75vw] text-gray-700">100%</span>
                                   </div>
                                   </div>
                              </div>
                           )}
                           <div className="flex items-center justify-between">
                              <span className="text-[0.75vw] font-medium text-gray-600">Infinity Loop Mode</span>
                              <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.5vw]" />
                              <Switch enabled={slideshowSettings.infiniteLoop ?? true} onChange={(v) => updateSetting('infiniteLoop', v)} />
                           </div>
                        </div>
                    </div>
                  )}
             </div>
      </div>


      {/* Popups & Pickers */}
      {showDotColorPicker && (
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setShowDotColorPicker(false)} />
          <ColorPicker 
             color={slideshowSettings.dotColor || '#4F46E5'} 
             onChange={(val) => updateSetting('dotColor', val)}
             opacity={slideshowSettings.dotOpacity ?? 100}
             onOpacityChange={(val) => updateSetting('dotOpacity', val)}
             onClose={() => setShowDotColorPicker(false)}
             className="fixed z-[210]"
             style={{ left: dotPickerPos.x, top: dotPickerPos.y }}
          />
        </>
      )}

      {showNavColorPicker && (
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setShowNavColorPicker(false)} />
          <ColorPicker 
             color={slideshowSettings.navIconColor || '#000000'} 
             onChange={(val) => updateSetting('navIconColor', val)}
             opacity={slideshowSettings.navIconOpacity ?? 100}
             onOpacityChange={(val) => updateSetting('navIconOpacity', val)}
             onClose={() => setShowNavColorPicker(false)}
             className="fixed z-[210]"
             style={{ left: navPickerPos.x, top: navPickerPos.y }}
          />
        </>
      )}

      {showNavStylesPopup && (
        <NavIconStylesPopup
           isOpen={true}
           onClose={() => setShowNavStylesPopup(false)}
           onSelect={(styleId) => {
             updateSetting('navStyle', styleId);
             setShowNavStylesPopup(false);
           }}
           currentStyle={slideshowSettings.navStyle}
           color={slideshowSettings.navIconColor}
        />
      )}


      {/* Internal Gallery Modal */}
      {showGallery && (
        <GalleryImage
          onClose={() => setShowGallery(false)}
          onSelect={handleGallerySelect}
          currentPageVId={currentPageVId}
          flipbookVId={flipbookVId}
          folderName={folderName}
          flipbookName={flipbookName}
        />
      )}

      {/* Replace Image Modal*/}
      {showReplaceModal && replaceTargetIndex !== null && slideshowImages[replaceTargetIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-[1vw]">
           <div className="fixed inset-0 bg-black/40 backdrop-blur-[0.15vw]" onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} />
           <div className="relative bg-white rounded-[2vw] shadow-2xl w-[28vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 p-[2vw]">
              {/* HEADER */}
              <div className="flex items-center gap-[1vw] mb-[2.5vw]">
                <h2 className="text-[1.1vw] font-semibold text-gray-700 whitespace-nowrap">Replace Image</h2>
                <div className="h-[0.1vw] w-full bg-gray-100 flex-1" />
                <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-[0.75vw] border-[0.15vw] border-[#ff6b6b] text-[#ff6b6b] hover:bg-red-50 transition-colors shrink-0"
                >
                  <X size="1vw" strokeWidth={2.5} />
                </button>
              </div>
 
              {/* CONTENT AREA */}
              <div className="flex flex-col gap-[1.5vw] mb-[2vw]">
                <div className="flex items-center justify-between gap-[1vw]">
                  {/* Left: Current Image container */}
                  <div className="flex flex-col items-center gap-[0.5vw] w-[8vw]">
                    <div className="w-[6vw] h-[6vw] rounded-[1.25vw] border-[0.15vw] border-dashed border-gray-400 bg-gray-50 flex items-center justify-center overflow-hidden p-[0.5vw]">
                       <img src={slideshowImages[replaceTargetIndex].url} className="w-full h-full object-contain rounded-[0.5vw]" alt="current" />
                    </div>
                    <span className="text-[0.9vw] font-semibold text-gray-400 truncate w-full text-center">Current</span>
                  </div>
 
                  {/* Middle: Replacement Connector - Vertically Centered */}
                  <div className="flex items-center justify-center pt-[0.5vw]">
                    <Replace size="1.5vw" className="text-gray-400" strokeWidth={1.5} />
                  </div>
 
                  {/* Right: Upload Drop-zone - Matches height of left box */}
                  <div className="flex flex-col items-center gap-[0.5vw] flex-1">
                    <div 
                      onClick={() => replaceInputRef.current?.click()}
                      className={`w-full h-[6vw] rounded-[1.25vw] border-[0.15vw] border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                        newReplaceImg ? 'border-gray-400 bg-indigo-50/20' : 'border-gray-400 bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                       {newReplaceImg ? (
                         <div className="relative w-full h-full p-[0.5vw] flex items-center justify-center">
                            <img src={newReplaceImg.url} className="w-full h-full object-contain rounded-[0.5vw]" alt="new" />
                            <div className="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Upload size="1.25vw" className="text-black-900" />
                            </div>
                         </div>
                       ) : (
                         <>
                           <Upload size="1.5vw" className="text-gray-400 mb-[0.25vw] group-hover:-translate-y-1 transition-transform" />
                           <p className="text-[0.8vw] text-gray-500 font-medium">Drag & Drop or <span className="text-indigo-600 font-semibold">Upload</span></p>
                         </>
                       )}
                    </div>
                    <p className="text-[0.7vw] text-gray-400 font-medium italic">Supported File Format : JPG, PNG</p>
                  </div>
                </div>
              </div>
 
              {/* FOOTER BUTTONS */}
              <div className="flex items-center justify-end gap-[0.75vw] mt-[1vw]">
                 <button 
                  onClick={() => { setShowReplaceModal(false); setNewReplaceImg(null); }} 
                  className="px-[1.5vw] h-[2vw] rounded-[0.5vw] border-[0.15vw] border-gray-700 text-gray-700 font-semibold text-[0.9vw] flex items-center gap-[0.5vw] hover:bg-gray-50 transition-all"
                 >
                   <X size="1vw" strokeWidth={2.5} /> Close
                 </button>
                 <button 
                  onClick={confirmReplace}
                  disabled={!newReplaceImg}
                  className={`px-[2vw] h-[2vw] rounded-[0.5vw] font-semibold text-[0.9vw] flex items-center gap-[0.5vw] shadow-lg transition-all ${
                    newReplaceImg 
                      ? 'bg-gray-600 text-white hover:bg-gray-700 hover:scale-[1.02] active:scale-95' 
                      : 'bg-gray-200 text-black-900 cursor-not-allowed shadow-none'
                  }`}
                 >
                   <Replace size="1vw" strokeWidth={2.5} /> Replace
                 </button>
              </div>
 
              <input type="file" ref={replaceInputRef} onChange={handleReplaceUpload} accept="image/*" className="hidden" />
           </div>
        </div>
      )}
    </div>
  );
};

export default SlideshowProperties;
