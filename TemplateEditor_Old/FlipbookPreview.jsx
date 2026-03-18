// FlipbookPreview.jsx - Full Tailwind CSS Version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize, Minimize, Download, LayoutGrid, Share2, Play, Pause,
  Music, Loader2, BookOpen, FileText, Bookmark, List, X
} from 'lucide-react';
import logo from '../../assets/logo/Fisto_logo.png';
import PopupPreview from './PopupPreview';

const FlipbookPreview = ({ pages, pageName = "Name of the Book", onClose, isMobile = false, isDoublePage }) => {
  const flipbookRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const turnInstanceRef = useRef(null);
  const initializationRef = useRef(false);

  // State
  const [isSingleView, setIsSingleView] = useState(isMobile || (isDoublePage === false));
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentView, setCurrentView] = useState([1]);
  const [centerOffset, setCenterOffset] = useState(0);
  const [animationTargetView, setAnimationTargetView] = useState(null);
  const [popupData, setPopupData] = useState({
    isOpen: false,
    content: '',
    styles: {},
    elementType: 'text',
    elementSource: ''
  });

  const [spreadZoom, setSpreadZoom] = useState({
    active: false,
    scale: 1,
    x: 0,
    y: 0,
    elementId: null,
    originalRect: null,
    page: null,
    centerOffset: 0,
    isEntering: false,
    isSingleView: false
  });

  const spreadZoomRef = useRef(spreadZoom);
  useEffect(() => { spreadZoomRef.current = spreadZoom; }, [spreadZoom]);

  const currentInitIdRef = useRef(0);

  const animationEndTimerRef = useRef(null);

  // Stabilize pages prop to prevent unnecessary re-renders/initialization
  const stablePages = React.useMemo(() => pages, [JSON.stringify(pages)]);

  const totalPages = stablePages.length;

  // Page dimensions (A4 ratio)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  const hexToRgba = (hex, opacity = 100) => {
    if (!hex || hex === 'none') return 'transparent';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const alpha = (opacity / 100).toFixed(2);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
  };

  // Calculate the target offset based on view
  const calculateTargetOffset = useCallback((view) => {
    if (isSingleView || !view) return 0;

    const visiblePages = Array.isArray(view) ? view.filter(p => p > 0) : [view];

    if (visiblePages.length === 1 && visiblePages[0] === 1) {
      return -PAGE_WIDTH / 2;
    }

    if (visiblePages.length === 1 && visiblePages[0] === totalPages && totalPages % 2 === 0) {
      return PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[0] === 0 && view[1] > 0) {
      return -PAGE_WIDTH / 2;
    }

    if (Array.isArray(view) && view.length === 2 && view[1] === 0 && view[0] > 0) {
      return PAGE_WIDTH / 2;
    }

    return 0;
  }, [isSingleView, totalPages, PAGE_WIDTH]);

  // Handle centering offset
  useEffect(() => {
    if (animationEndTimerRef.current) {
      clearTimeout(animationEndTimerRef.current);
      animationEndTimerRef.current = null;
    }

    if (!isReady) {
      setCenterOffset(0);
      return;
    }

    if (isAnimating) {
      if (animationTargetView) {
        const targetOffset = calculateTargetOffset(animationTargetView);
        setCenterOffset(targetOffset);
      }
      return;
    }

    animationEndTimerRef.current = setTimeout(() => {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }, 50);

    return () => {
      if (animationEndTimerRef.current) {
        clearTimeout(animationEndTimerRef.current);
      }
    };
  }, [isAnimating, isReady, currentView, animationTargetView, calculateTargetOffset]);

  // Initial offset on ready
  useEffect(() => {
    if (isReady && !isAnimating) {
      const targetOffset = calculateTargetOffset(currentView);
      setCenterOffset(targetOffset);
    }
  }, [isReady]);

  // React to prop changes for view mode
  useEffect(() => {
    if (isMobile) setIsSingleView(true);
  }, [isMobile]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/page-flip.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playFlipSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Flip sound failed:", e));
    }
  }, []);

  // Load Script Helper
  const loadScript = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        if (window.jQuery && window.jQuery.fn.turn) {
          resolve();
          return;
        }
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  // Destroy Turn.js instance safely
  const destroyTurn = useCallback(() => {
    if (turnInstanceRef.current && window.jQuery) {
      try {
        const $el = turnInstanceRef.current;
        if ($el.data && $el.data('turn')) {
          $el.turn('destroy');
        }
      } catch (e) {
        console.warn('Turn.js cleanup:', e);
      }
    }
    turnInstanceRef.current = null;

    if (flipbookRef.current) {
      flipbookRef.current.innerHTML = '';
      flipbookRef.current.removeAttribute('style');
      flipbookRef.current.className = '';
    }
  }, []);



  // Sanitize HTML content
  const sanitizeHTML = useCallback((html, pageNumber) => {

    const slideshowScript = `
      <script>
        (function() {
          const initSlideshows = () => {
            const elements = document.querySelectorAll('[data-slideshow]');
            elements.forEach(el => {
              if (el.dataset.slideshowInitialized) return;
              el.dataset.slideshowInitialized = 'true';

              try {
                const data = JSON.parse(el.dataset.slideshow);
                const settings = data.settings;
                const images = data.images;
                
                if (!images || images.length <= 1) return;

                let currentIndex = 0;
                let isAnimating = false;
                
                // Ensure parent relative
                if (el.parentElement && getComputedStyle(el.parentElement).position === 'static') {
                   el.parentElement.style.position = 'relative';
                }

                const updateSlide = (newIndex) => {
                   if (newIndex === currentIndex || isAnimating) return;
                   
                   const nextImg = images[newIndex];
                   const effect = settings.transitionEffect;
                   const baseOpacity = el.style.opacity || '1';
                   
                   currentIndex = newIndex;
                   isAnimating = true;

                   const finish = () => {
                      el.src = nextImg.url;
                      el.style.transition = '';
                      el.style.transform = '';
                      el.style.opacity = baseOpacity;
                      isAnimating = false;
                      updateControls();
                   };

                   if (effect === 'Fade') {
                      el.style.transition = 'opacity 0.4s ease-in-out';
                      el.style.opacity = '0.2';
                      setTimeout(() => {
                         el.src = nextImg.url;
                         el.style.opacity = baseOpacity;
                         setTimeout(finish, 400); // Wait for fade in
                      }, 400);

                   } else if (effect === 'Slide' || effect === 'Push') {
                      el.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
                      el.style.transform = 'translateX(-30%)';
                      el.style.opacity = '0';
                      setTimeout(() => {
                         el.src = nextImg.url;
                         el.style.transition = 'none';
                         el.style.transform = 'translateX(30%)';
                         void el.offsetWidth; // Force Reflow
                         el.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
                         el.style.transform = 'translateX(0)';
                         el.style.opacity = baseOpacity;
                         setTimeout(finish, 400);
                      }, 400);

                   } else if (effect === 'Flip') {
                      el.style.transition = 'transform 0.5s ease-in-out';
                      el.style.transform = 'rotateY(90deg)';
                      setTimeout(() => {
                         el.src = nextImg.url;
                         el.style.transition = 'none';
                         el.style.transform = 'rotateY(-90deg)';
                         void el.offsetWidth;
                         el.style.transition = 'transform 0.5s ease-in-out';
                         el.style.transform = 'rotateY(0)';
                         setTimeout(finish, 500);
                      }, 500);

                   } else if (effect === 'Reveal' || effect === 'Zoom') {
                      el.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease';
                      el.style.transform = 'scale(0.8)';
                      el.style.opacity = '0.5';
                      setTimeout(() => {
                         el.src = nextImg.url;
                         el.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease';
                         el.style.transform = 'scale(1)';
                         el.style.opacity = baseOpacity;
                         setTimeout(finish, 400);
                      }, 400);

                   } else {
                      // Linear
                      el.src = nextImg.url;
                      isAnimating = false;
                      updateControls();
                   }
                };

                // --- Controls Container ---
                let overlay = document.createElement('div');
                overlay.className = 'slideshow-controls-' + Date.now();
                Object.assign(overlay.style, {
                   position: 'absolute', inset: '0', pointerEvents: 'none', 
                   zIndex: '10', display: 'flex', flexDirection: 'column', 
                   justifyContent: 'space-between'
                });
                el.parentElement.appendChild(overlay);

                // --- Helper to update Dots/Arrows state ---
                const updateControls = () => {
                   if (!settings.autoPlay) {
                      // Update Arrows Visibility
                      const leftArr = overlay.querySelector('.arrow-left');
                      const rightArr = overlay.querySelector('.arrow-right');
                      if (leftArr) leftArr.style.display = (!settings.infiniteLoop && currentIndex === 0) ? 'none' : 'flex';
                      if (rightArr) rightArr.style.display = (!settings.infiniteLoop && currentIndex === images.length - 1) ? 'none' : 'flex';
                   }
                   
                   // Update Dots
                   if (settings.showDots) {
                      const dots = overlay.querySelectorAll('.slide-dot');
                      dots.forEach((d, i) => {
                         const isActive = i === currentIndex;
                         d.style.backgroundColor = isActive ? settings.dotColor : 'rgba(255,255,255,0.5)';
                         d.style.opacity = isActive ? '1' : (settings.dotOpacity / 100);
                         d.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
                      });
                   }
                };


                // --- Auto Play ---
                if (settings.autoPlay) {
                   const intervalMs = (settings.speed || 2) * 1000;
                   setInterval(() => {
                      let next = currentIndex + 1;
                      if (next >= images.length) {
                         if (!settings.infiniteLoop) return;
                         next = 0;
                      }
                      updateSlide(next);
                   }, intervalMs);
                } 
                else {
                   // --- Manual Controls ---
                   
                   // Arrows
                   if (settings.showArrows) {
                      const createArrow = (dir) => {
                         const btn = document.createElement('div');
                         btn.className = 'arrow-' + dir;
                         const isLeft = dir === 'left';
                         Object.assign(btn.style, {
                            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                            width: '32px', height: '32px', background: 'rgba(255,255,255,0.8)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', pointerEvents: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            transition: 'background 0.2s', zIndex: '20',
                            left: isLeft ? '10px' : 'auto', right: isLeft ? 'auto' : '10px'
                         });
                         btn.innerHTML = isLeft 
                            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
                            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
                         
                         btn.onclick = (e) => {
                            e.stopPropagation();
                            let next = isLeft ? currentIndex - 1 : currentIndex + 1;
                            if (isLeft && next < 0) next = settings.infiniteLoop ? images.length - 1 : 0;
                            if (!isLeft && next >= images.length) next = settings.infiniteLoop ? 0 : images.length - 1;
                            updateSlide(next);
                         };
                         return btn;
                      };
                      overlay.appendChild(createArrow('left'));
                      overlay.appendChild(createArrow('right'));
                   }

                   // Drag
                   if (settings.dragToSlide) {
                      const dragLayer = document.createElement('div');
                      Object.assign(dragLayer.style, {
                         position: 'absolute', inset: '0', zIndex: '5', cursor: 'grab', pointerEvents: 'auto'
                      });
                      
                      let startX = 0;
                      let isDragging = false;
                      
                      const onMove = (e) => {
                         if (Math.abs(e.clientX - startX) > 10) isDragging = true;
                      };
                      const onUp = (e) => {
                         if (isDragging) {
                            const diff = e.clientX - startX;
                            if (Math.abs(diff) > 50) {
                               let next = diff > 0 
                                  ? (currentIndex === 0 ? (settings.infiniteLoop ? images.length - 1 : 0) : currentIndex - 1)
                                  : (currentIndex === images.length - 1 ? (settings.infiniteLoop ? 0 : currentIndex) : currentIndex + 1);
                               updateSlide(next);
                            }
                         }
                         document.removeEventListener('mousemove', onMove);
                         document.removeEventListener('mouseup', onUp);
                      };
                      dragLayer.onmousedown = (e) => {
                         e.stopPropagation();
                         startX = e.clientX;
                         isDragging = false;
                         document.addEventListener('mousemove', onMove);
                         document.addEventListener('mouseup', onUp);
                      };
                      overlay.appendChild(dragLayer);
                   }
                }

                // --- Dots (Always visible if enabled) ---
                if (settings.showDots) {
                   const dotsCont = document.createElement('div');
                   Object.assign(dotsCont.style, {
                      position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                      display: 'flex', gap: '6px', pointerEvents: 'auto', padding: '4px 8px',
                      background: 'rgba(0,0,0,0.1)', borderRadius: '12px', backdropFilter: 'blur(2px)', zIndex: '20'
                   });
                   images.forEach((_, i) => {
                      const dot = document.createElement('div');
                      dot.className = 'slide-dot';
                      Object.assign(dot.style, {
                         width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s',
                         boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      });
                      dot.onclick = (e) => { e.stopPropagation(); updateSlide(i); };
                      dotsCont.appendChild(dot);
                   });
                   overlay.appendChild(dotsCont);
                }
                
                // Init State
                updateControls();

              } catch(e) { console.error('Slideshow init error', e); }
            });
          };

          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSlideshows);
          else initSlideshows();
        })();
      </script>
    `;

    // Interaction Handler Script
    const animationScript = `
      <script>
        (function() {
          const pageNumber = ${pageNumber}; // Inject locally
          const initAnim = () => {
          const WAAPI_ANIMATIONS = {
            'none': [],
            'fade-in': [{ opacity: 0 }, { opacity: 1 }],
            'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
            'focus-in': [{ filter: 'blur(12px)', opacity: 0, transform: 'scale(1.2)' }, { filter: 'blur(0)', opacity: 1, transform: 'scale(1)' }],
            'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)' }],
            'perspective-in': [{ transform: 'perspective(400px) rotateX(-60deg) translateZ(-500px)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg) translateZ(0)', opacity: 1 }],
            'slide-up': [{ transform: 'translateY(100px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
            'slide-down': [{ transform: 'translateY(-100px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
            'slide-left': [{ transform: 'translateX(100px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
            'slide-right': [{ transform: 'translateX(-100px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }],
            'back-in-up': [{ transform: 'translateY(500px) scale(0.7)', opacity: 0 }, { transform: 'translateY(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
            'back-in-down': [{ transform: 'translateY(-500px) scale(0.7)', opacity: 0 }, { transform: 'translateY(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateY(0) scale(1)', opacity: 1 }],
            'back-in-left': [{ transform: 'translateX(-500px) scale(0.7)', opacity: 0 }, { transform: 'translateX(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateX(0) scale(1)', opacity: 1 }],
            'back-in-right': [{ transform: 'translateX(500px) scale(0.7)', opacity: 0 }, { transform: 'translateX(0) scale(0.7)', opacity: 0.7, offset: 0.8 }, { transform: 'translateX(0) scale(1)', opacity: 1 }],
            'zoom-in': [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
            'zoom-in-up': [{ transform: 'scale(0.1) translateY(100px)', opacity: 0 }, { transform: 'scale(1) translateY(0)', opacity: 1 }],
            'zoom-in-down': [{ transform: 'scale(0.1) translateY(-100px)', opacity: 0 }, { transform: 'scale(1) translateY(0)', opacity: 1 }],
            'rotate-in': [{ transform: 'rotate(-200deg) scale(0)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }],
            'rotate-in-down-left': [{ transform: 'rotate(-45deg)', transformOrigin: 'left bottom', opacity: 0 }, { transform: 'rotate(0)', transformOrigin: 'left bottom', opacity: 1 }],
            'rotate-in-up-right': [{ transform: 'rotate(-90deg)', transformOrigin: 'right bottom', opacity: 0 }, { transform: 'rotate(0)', transformOrigin: 'right bottom', opacity: 1 }],
            'bounce-in': [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 0.8, offset: 0.5 }, { transform: 'scale(0.9)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
            'flip-in': [{ transform: 'perspective(400px) rotateX(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 }],
            'flip-in-y': [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }],
            'roll-in': [{ transform: 'translateX(-100px) rotate(-120deg)', opacity: 0 }, { transform: 'translateX(0) rotate(0)', opacity: 1 }],
            'pulse': [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.5 }, { transform: 'scale(1)' }],
            'heartbeat': [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.14 }, { transform: 'scale(1)', offset: 0.28 }, { transform: 'scale(1.3)', offset: 0.42 }, { transform: 'scale(1)', offset: 0.7 }],
            'float': [{ transform: 'translateY(0)' }, { transform: 'translateY(-15px)', offset: 0.5 }, { transform: 'translateY(0)' }],
            'neon-glow': [{ filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }, { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))', offset: 0.5 }, { filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }],
            'tada': [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(0.9) rotate(-3deg)', offset: 0.1 }, { transform: 'scale(0.9) rotate(-3deg)', offset: 0.2 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.3 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.4 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.5 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.6 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.7 }, { transform: 'scale(1.1) rotate(-3deg)', offset: 0.8 }, { transform: 'scale(1.1) rotate(3deg)', offset: 0.9 }, { transform: 'scale(1) rotate(0)' }],
            'rubber-band': [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.25, 0.75)', offset: 0.3 }, { transform: 'scale(0.75, 1.25)', offset: 0.4 }, { transform: 'scale(1.15, 0.85)', offset: 0.5 }, { transform: 'scale(0.95, 1.05)', offset: 0.65 }, { transform: 'scale(1.05, 0.95)', offset: 0.75 }, { transform: 'scale(1, 1)' }],
            'jello': [{ transform: 'skew(0,0)' }, { transform: 'skew(-12.5deg, -12.5deg)', offset: 0.22 }, { transform: 'skew(6.25deg, 6.25deg)', offset: 0.33 }, { transform: 'skew(-3.125deg, -3.125deg)', offset: 0.44 }, { transform: 'skew(1.5625deg, 1.5625deg)', offset: 0.55 }, { transform: 'skew(-0.78deg, -0.78deg)', offset: 0.66 }, { transform: 'skew(0.39deg, 0.39deg)', offset: 0.77 }, { transform: 'skew(-0.2deg, -0.2deg)', offset: 0.88 }, { transform: 'skew(0,0)' }],
            'swing': [{ transform: 'rotate(0deg)' }, { transform: 'rotate(15deg)', offset: 0.2 }, { transform: 'rotate(-10deg)', offset: 0.4 }, { transform: 'rotate(5deg)', offset: 0.6 }, { transform: 'rotate(-5deg)', offset: 0.8 }, { transform: 'rotate(0deg)' }],
            'wobble': [{ transform: 'translateX(0%) rotate(0deg)' }, { transform: 'translateX(-25%) rotate(-5deg)', offset: 0.15 }, { transform: 'translateX(20%) rotate(3deg)', offset: 0.3 }, { transform: 'translateX(-15%) rotate(-3deg)', offset: 0.45 }, { transform: 'translateX(10%) rotate(2deg)', offset: 0.6 }, { transform: 'translateX(-5%) rotate(-1deg)', offset: 0.75 }, { transform: 'translateX(0%) rotate(0deg)' }],
            'glitch': [{ transform: 'translate(0)' }, { transform: 'translate(-2px, 2px)', offset: 0.2 }, { transform: 'translate(2px, -2px)', offset: 0.4 }, { transform: 'translate(-2px, 2px)', offset: 0.6 }, { transform: 'translate(2px, -2px)', offset: 0.8 }, { transform: 'translate(0)' }],
            'bounce-out': [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 0.8, offset: 0.2 }, { transform: 'scale(0.3)', opacity: 0, offset: 1 }],
            'fade-out': [{ opacity: 1 }, { opacity: 0 }],
          };

          const getEasing = (e) => {
            const map = { 
              'Linear': 'linear', 
              'Smooth': 'ease-in-out', 
              'Ease In': 'ease-in', 
              'Ease Out': 'ease-out', 
              'Ease In & Out': 'ease-in-out',
              'Bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
            };
            return map[e] || 'ease-out';
          };

          const runAnim = (el, type, settings, isReverse = false) => {
             if (!type || type === 'none' || !WAAPI_ANIMATIONS[type]) return;
             
             // Check Every Visit
             if (!settings.everyVisit && el.dataset.animRun === 'true' && !isReverse) return;

             let frames = JSON.parse(JSON.stringify(WAAPI_ANIMATIONS[type]));

             // Handle Fadings
             if (!settings.fadeAtStart && !settings.fadeAtStartEnd) {
                // If NO fade at start requested, force opacity 1 on first frame
                 if (frames[0] && frames[0].opacity !== undefined) frames[0].opacity = 1;
             }
             if (!settings.fadeAtEnd && !settings.fadeAtStartEnd) {
                // If NO fade at end requested, force opacity 1 on last frame
                 if (frames[frames.length - 1] && frames[frames.length - 1].opacity !== undefined) frames[frames.length - 1].opacity = 1;
             }

             const duration = ((parseFloat(settings.duration) || 1) / (parseFloat(settings.speed) || 1)) * 1000;
             const delay = (parseFloat(settings.delay) || 0) * 1000;
             const iterations = (settings.forceOnce || settings.action !== 'Always') ? 1 : Infinity;

             // If triggered by CLICK or HOVER, we typically want to restart it if it's already running?
             // Or allow parallel? WAAPI allows multiple. Cleaning up previous might be good.
             const currentAnims = el.getAnimations();
             currentAnims.forEach(a => a.cancel());

             const anim = el.animate(frames, { 
               duration, 
               delay, 
               easing: getEasing(settings.easing), 
               fill: 'forwards', 
               iterations: iterations,
               direction: isReverse ? 'reverse' : 'normal'
             });

             if (!isReverse) {
                el.dataset.animRun = 'true';
             }
          };

          const parseSettings = (el, prefix) => ({
             type: el.getAttribute('data-animation-' + prefix + '-type'),
             duration: el.getAttribute('data-animation-' + prefix + '-duration'),
             speed: el.getAttribute('data-animation-' + prefix + '-speed'),
             delay: el.getAttribute('data-animation-' + prefix + '-delay'),
             easing: el.getAttribute('data-animation-' + prefix + '-easing'),
             everyVisit: el.getAttribute('data-animation-' + prefix + '-every-visit') !== 'false',
             fadeStart: el.getAttribute('data-animation-' + prefix + '-fade-start') !== 'false',
             fadeEnd: el.getAttribute('data-animation-' + prefix + '-fade-end') !== 'false',
             fadeStartEnd: el.getAttribute('data-animation-' + prefix + '-fade-start-end') !== 'false',
             action: el.getAttribute('data-animation-action')
          });

          const handleTrigger = (trigger, context) => { 
             // Async Theory: Use RAF to ensure DOM is ready and not blocking
             requestAnimationFrame(() => {
                 if (!document || !document.body) return;
                   const elements = document.querySelectorAll('[data-animation-trigger], [data-animation-open-type]');
                   elements.forEach(el => {
                      
                      

                      // --- Entrance / Exit Animation Logic ---
                      const openType = el.getAttribute('data-animation-open-type');
                      const separate = el.getAttribute('data-animation-separate') === 'true';

                      if (openType && openType !== 'none') {
                         if (context === 'open') {
                            const s = parseSettings(el, 'open');
                            // Force behavior: Page 1 = once, Others = every visit
                            s.forceOnce = true; 
                             
                            runAnim(el, s.type, s, false);
                         } 
                         else if (context === 'close') {
                            if (separate) {
                               const s = parseSettings(el, 'close');
                               s.forceOnce = true; 
                               
                               s.isClose = true; 
                               runAnim(el, s.type, s, false); 
                            } else {
                               const s = parseSettings(el, 'open');
                               s.forceOnce = true;
                               // Only run reverse/cleanup if we intend to animate again next visit
                               if (s.everyVisit) {
                                  runAnim(el, s.type, s, true);
                               }
                            }
                         }
                      }

                      // --- Interaction Animation Logic (On Page) ---
                      const triggerMode = el.getAttribute('data-animation-trigger');
                      const action = el.getAttribute('data-animation-action') || 'Click';

                       if (triggerMode === 'On Page') {
                          if (action === 'Always') {
                             if (context === 'open') {
                                const s = parseSettings(el, 'interact');
                                runAnim(el, s.type, s, false);
                             } else if (context === 'close') {
                                const currentAnims = el.getAnimations();
                                currentAnims.forEach(a => a.cancel());
                             }
                          }
                       }
                   });
             });
          };

          // --- Mutation Observer for Live Updates (Editor Mode) ---
          const observer = new MutationObserver((mutations) => {
             mutations.forEach((mutation) => {
               if (mutation.type === 'attributes') {
                 const el = mutation.target;
                 const attr = mutation.attributeName;

                 // Only care about animation attributes
                 if (attr.startsWith('data-animation-')) {
                   const trigger = el.getAttribute('data-animation-trigger');
                   const action = el.getAttribute('data-animation-action');

                   // Determine if we should auto-preview (Live Edit)
                   // 1. "On Page" + "Always" -> Auto play
                   // 2. "While Opening" (Entrance) -> Auto play to show effect immediately
                   let shouldPreview = false;
                   let settingsPrefix = 'open';

                   if (trigger === 'On Page' && action === 'Always') {
                      shouldPreview = true;
                      settingsPrefix = 'interact';
                   } else if (trigger === 'While Opening' || trigger === 'While Open & Close' || !trigger) {
                      shouldPreview = true;
                      settingsPrefix = 'open';
                   }

                   if (shouldPreview) {
                      const s = parseSettings(el, settingsPrefix);
                      // Run immediately to preview changes
                      runAnim(el, s.type, s, false);
                   } else {
                      // If switched to manual mode (Click/Hover) or disabled, stop any running loops
                      if (attr === 'data-animation-trigger' || attr === 'data-animation-action' || attr.includes('-type')) {
                         const currentAnims = el.getAnimations();
                         currentAnims.forEach(a => a.cancel());
                      }
                   }
                 }
               }
             });
          });

          if (document.body) {
             observer.observe(document.body, { 
               attributes: true, 
               subtree: true, 
               attributeFilter: [
                 'data-animation-trigger', 'data-animation-action', 
                 'data-animation-interact-type', 'data-animation-interact-duration', 
                 'data-animation-interact-delay', 'data-animation-interact-speed', 
                 'data-animation-interact-easing'
               ] 
             });
          }
          
          window.addEventListener('message', (e) => {
             if (e.data.type === 'flipbook-view-change') {
                const amIVisible = e.data.view.includes(pageNumber);
                if (amIVisible) handleTrigger(null, 'open'); 
                else handleTrigger(null, 'close');
             }
          });

           // Note: Direct Click/Hover listeners on document might miss if elements are added dynamically? 
           // But since this script runs in the iframe where content is static (except for classes), it's fine.
           document.addEventListener('click', (e) => {
              const el = e.target.closest('[data-animation-trigger="On Page"][data-animation-action="Click"]');
              if (el) {
                  const s = parseSettings(el, 'interact');
                  if (s.type && s.type !== 'none') {
                     runAnim(el, s.type, s, false);
                  }
              }
           });
           
           document.addEventListener('mouseover', (e) => {
               const el = e.target.closest('[data-animation-trigger="On Page"][data-animation-action="Hover"]');
               if (el) {
                  // Prevent restart if moving within the same element
                  if (el.contains(e.relatedTarget)) return;

                  const s = parseSettings(el, 'interact');
                  if (s.type && s.type !== 'none') {
                     // Clear existing to restart
                     const currentAnims = el.getAnimations();
                     currentAnims.forEach(a => a.cancel());
                     
                     runAnim(el, s.type, s, false);
                  }
               }
           });

           // Initial Trigger: Run opening animations immediately for the first page
           if (pageNumber === 1) {
              handleTrigger(null, 'open');
           }
          };

          // Async Theory: Defer init slightly to ensure stability but don't over-delay.
          // Since handleTrigger uses RAF, we are safe to init.
          if (document.readyState === 'loading') {
             document.addEventListener('DOMContentLoaded', initAnim);
          } else {
             initAnim();
          }
        })();
      </script>
    `;

    const interactionScript = `
      <script>
        (function() {
          const init = () => {
            if (window._interactionInitialized) return;
            window._interactionInitialized = true;
            window._pageNumber = ${pageNumber};
            console.log("Interaction Script: Initializing for page", window._pageNumber);

            window.addEventListener('message', (e) => {
              if (e.data && e.data.type === 'set-zoom-state') {
                if (e.data.active) document.body.classList.add('page-is-zoomed');
                else document.body.classList.remove('page-is-zoomed');
              }
            });

            const showTooltip = (el, content, textColor = '#fff', fillColor = 'rgba(0,0,0,0.8)') => {
              let tooltip = document.getElementById('interaction-tooltip');
              if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'interaction-tooltip';
                Object.assign(tooltip.style, {
                  position: 'fixed', background: fillColor, color: textColor,
                  padding: '8px 14px', borderRadius: '12px', fontSize: '13px',
                  fontWeight: '500', pointerEvents: 'none', zIndex: '10000', display: 'none',
                  maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.2s ease, transform 0.2s ease', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'system-ui, -apple-system, sans-serif'
                });
                
                // Add a transparent bridge and hover effects to the tooltip
                const s = document.createElement('style');
                s.innerHTML = \`
                  #interaction-tooltip::after { 
                    content: ""; position: absolute; top: 100%; left: 0; width: 100%; height: 30px; background: transparent; pointer-events: auto; 
                  }
                  #interaction-tooltip:hover { 
                    filter: brightness(1.15); transform: translateY(-2px) scale(1.02) !important; 
                  }
                  #interaction-tooltip:active {
                    transform: translateY(0px) scale(0.98) !important;
                  }
                \`;
                document.head.appendChild(s);
                
                document.body.appendChild(tooltip);
              }
              
              const type = el.dataset.interaction;
              const isLink = type === 'link';
              const isDownload = type === 'download';
              
              tooltip.style.pointerEvents = (isLink || isDownload) ? 'auto' : 'none';
              tooltip.style.cursor = (isLink || isDownload) ? 'pointer' : 'default';
              tooltip.style.backgroundColor = fillColor || 'rgba(0,0,0,0.8)';
              tooltip.style.color = textColor || '#fff';
              
              if (isLink || isDownload) {
                tooltip.onclick = (e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  console.log("Interaction Script: Tooltip clicked", type);
                  window.executeInteraction(el, 'click'); 
                };
                if (isLink) {
                   const urlToDisp = content || el.dataset.interactionValue || '';
                   const urlDisp = urlToDisp.replace(/^https?:\\/\\/(www\\.)?/, '').split('/')[0];
                   tooltip.innerHTML = '<span style="opacity:0.7;margin-right:6px">Visit</span> <span style="text-decoration:underline">' + urlDisp + '</span>';
                } else {
                   tooltip.textContent = content;
                }
              } else {
                tooltip.onclick = null;
                tooltip.textContent = content;
              }
              
              tooltip.style.display = 'block';
              tooltip.style.transform = 'translateY(0) scale(1)';
              
              const rect = el.getBoundingClientRect();
              const tooltipRect = tooltip.getBoundingClientRect();
              tooltip.style.left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, rect.left + (rect.width / 2) - (tooltipRect.width / 2))) + 'px';
              tooltip.style.top = (rect.top - tooltipRect.height - 12) + 'px';
            };

            const showPopup = (el, content, styles = {}, imageSrc = null) => {
              console.log("Interaction Script: Sending popup message to parent", { content, styles, imageSrc });
              window.parent.postMessage({
                type: 'flipbook-popup',
                data: {
                  content: content,
                  styles: styles,
                  elementType: el.tagName.toLowerCase() === 'img' ? 'image' : 'text',
                  elementSource: imageSrc || (el.tagName.toLowerCase() === 'img' ? el.src : null)
                }
              }, '*');
            };

            window.executeInteraction = (el, eventType) => {
              const type = el.dataset.interaction;
              const trigger = el.dataset.interactionTrigger || 'click';
              const value = el.dataset.interactionValue;
              let content = el.dataset.interactionContent || '';
              if (content.startsWith('ENCODED:::')) {
                try {
                  content = decodeURIComponent(content.substring(10));
                } catch (e) {
                  content = content.substring(10);
                }
              }
              
              console.log("Interaction Script: Executing", type, "Event:", eventType, "Trigger:", trigger);

              if (type === 'tooltip') { 
                if (eventType !== 'hover') return; 
              } else if (type === 'download') {
                if (eventType === 'hover' || eventType === 'click') showTooltip(el, 'Download');
                if (eventType !== 'click' && trigger !== eventType) return;
              } else if (type === 'link') {
                // Link interaction: If trigger is hover, showing a 'Visit Link' bubble is the best way 
                // to satisfy browser security (popups are strictly blocked on auto-hover).
                if (eventType === 'hover' && trigger === 'hover') {
                  showTooltip(el, value);
                  return;
                }
                // If it's a click, we always try to open the link.
                if (eventType !== 'click' && (trigger !== eventType || eventType === 'hover')) return;
              } else if (trigger !== eventType) {
                return;
              }

              if (type === 'link' && value) {
                const url = value.startsWith('http') ? value : 'https://' + value;
                console.log("Interaction Script: Opening link", url, "Trigger:", eventType);
                
                // On hover, browsers strictly block popups. We try window.open, 
                // but we also log it clearly for the user if it might be blocked.
                const win = window.open(url, '_blank');
                if (!win) {
                  console.warn("Interaction Script: Popup might be blocked. Trigger type:", eventType);
                  const a = document.createElement('a');
                  a.href = url;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              } else if (type === 'call' && value) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                  location.href = 'tel:' + value;
                } else {
                  // Desktop: Redirect to WhatsApp Web
                  let cleanNumber = value.replace(/\D/g, '');
                  // If number is 10 digits, assume +91 as per Interaction Panel UI context
                  if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
                  window.open('https://web.whatsapp.com/send?phone=' + cleanNumber, '_blank');
                }
              } else if (type === 'navigation' && value) {
                window.parent.postMessage({ type: 'flipbook-navigate', page: value }, '*');
              } else if (type === 'popup') {
                showPopup(el, content, {
                  font: el.dataset.popupFont, 
                  size: el.dataset.popupSize,
                  weight: el.dataset.popupWeight, 
                  fill: el.dataset.popupFill,
                  fillOpacity: el.dataset.popupFillOpacity,
                  stroke: el.dataset.popupStroke,
                  strokeOpacity: el.dataset.popupStrokeOpacity,
                  strokeType: el.dataset.popupStrokeType,
                  strokeWidth: el.dataset.popupStrokeWidth,
                  strokeDashLength: el.dataset.popupStrokeDashLength,
                  strokeDashGap: el.dataset.popupStrokeDashGap,
                  strokePosition: el.dataset.popupStrokePosition,
                  strokeRoundCorners: el.dataset.popupStrokeRoundCorners === 'true',
                  autoWidth: el.dataset.popupAutoWidth, 
                  autoHeight: el.dataset.popupAutoHeight,
                  fit: el.dataset.popupFit
                }, el.dataset.popupImageSrc);
              } else if (type === 'download' && value) {
                  const triggerDownload = (url, name) => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = name || 'download';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  };

                  const filename = el.dataset.filename || 'download';
                  console.log("Interaction Script: Starting download", { filename, value });
                  
                  if (value.startsWith('data:')) {
                    triggerDownload(value, filename);
                  } else {
                    fetch(value)
                      .then(response => response.blob())
                      .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        triggerDownload(blobUrl, filename);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
                      })
                      .catch(err => {
                        console.warn("Fetch download failed, falling back:", err);
                        triggerDownload(value, filename);
                      });
                  }
              } else if (type === 'zoom' && value) {
                if (eventType === 'click') {
                  const scale = parseFloat(value) || 2;
                  const rect = el.getBoundingClientRect();
                  const elementId = el.id || 'zoom-' + Math.random().toString(36).substr(2, 9);
                  if (!el.id) el.id = elementId;
                  
                  window.parent.postMessage({
                    type: 'flipbook-spread-zoom',
                    data: {
                      elementId,
                      scale,
                      rect: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                      },
                      page: window._pageNumber
                    }
                  }, '*');
                }
              } else if (type === 'tooltip' && content) {
                showTooltip(el, content, el.dataset.tooltipTextColor, el.dataset.tooltipFillColor);
              }
            };

            document.addEventListener('mousemove', (e) => {
              const el = e.target.closest('[data-interaction="zoom"]');
              if (!el) return;
              if (document.body.classList.contains('page-is-zoomed')) {
                const rect = el.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / rect.width;
                const mouseY = (e.clientY - rect.top) / rect.height;
                window.parent.postMessage({
                  type: 'flipbook-zoom-move',
                  data: {
                    mouseX: Math.max(0, Math.min(1, mouseX)),
                    mouseY: Math.max(0, Math.min(1, mouseY))
                  }
                }, '*');
              }
            });

            document.addEventListener('click', (e) => {
              const el = e.target.closest('[data-interaction]');
              if (el) {
                window.executeInteraction(el, 'click');
              } else if (document.body.classList.contains('page-is-zoomed')) {
                // Clicking background also resets zoom
                document.body.style.transform = 'none';
                document.body.classList.remove('page-is-zoomed');
                document.body.style.cursor = 'default';
                setTimeout(() => { document.body.style.transition = ''; document.body.style.willChange = ''; }, 600);
              }
            });

            let lastHovered = null;
            document.addEventListener('mouseover', (e) => {
              const el = e.target.closest('[data-interaction]');
              if (!el || el === lastHovered) return;
              lastHovered = el;
              
              if (el.dataset.interaction === 'zoom') {
                el.style.cursor = 'zoom-in';
                if (!document.body.classList.contains('page-is-zoomed')) {
                  showTooltip(el, 'Click to zoom');
                } else {
                  showTooltip(el, 'Move to pan');
                }
              }
              
              window.executeInteraction(el, 'hover');
            });

            document.addEventListener('mouseout', (e) => {
              const tooltip = document.getElementById('interaction-tooltip');
              const related = e.relatedTarget;
              
              if (related && (related.closest('[data-interaction]') || related.closest('#interaction-tooltip'))) {
                return;
              }

              if (tooltip) tooltip.style.display = 'none';
              
              const el = e.target.closest('[data-interaction]');
              if (el && el.dataset.interaction === 'zoom' && el.dataset.interactionTrigger === 'hover' && (!related || !related.closest('[data-interaction]'))) {
                 el.style.transform = 'none'; el.style.zIndex = '';
              }
              lastHovered = null;
            });
          };

          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
          else init();
        })();
      </script>
    `;

    if (!html) return `
      <!DOCTYPE html>
      <html>
        <head><style>body{margin:0;padding:40px;font-family:Arial,sans-serif;background:#fff;}</style></head>
        <body><p style="color:#999;text-align:center;margin-top:40%;">Empty Page</p></body>
      </html>
    `;

    let content = html;

    // Fix CORS: Strip crossorigin attributes to allow standard opaque loading
    // This resolves "Blocked by CORS policy" errors if the server lacks headers
    if (content) {
      content = content.replace(/\s+crossorigin(=["']?[a-zA-Z-]*["']?)?/gi, '');
    }

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
              * { box-sizing: border-box; }
              #flipbook .page iframe {
                pointer-events: auto;
                user-select: text;
              }
              
              #flipbook *:focus {
                outline: none !important;
                box-shadow: none !important;
              }
              /* Cursor styles for interactive elements */
              [data-interaction] {
                  cursor: pointer;
              }
              
              /* Interaction Highlights */

              
              /* Frame styling in preview */
              [data-interaction-type="frame"] {
                  position: absolute;
                  z-index: 1000;
                  pointer-events: auto;
                  background-color: transparent;
              }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
            ${interactionScript}
            ${slideshowScript}
            ${animationScript}
          </head>
          <body>${html}</body>
        </html>
      `;
    } else {
      // Inject script into existing Head
      const styleString = `
        <style>
            * {
            outline: none !important;
            -webkit-touch-callout: none !important;
            }
            /* Allow interaction and selection */
            *::selection { background: rgba(59, 130, 246, 0.3); }
            *::-moz-selection { background: rgba(59, 130, 246, 0.3); }
            [data-interaction] { cursor: pointer; }

            /* Important: Copy parent fonts */
            @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Inter:wght@100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Pacifico&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Raleway:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');
            @import url('https://fonts.cdnfonts.com/css/eight-one');
            @import url('https://fonts.cdnfonts.com/css/walkway');
            @import url('https://fonts.cdnfonts.com/css/coolvetika');
            @import url('https://fonts.cdnfonts.com/css/cream-cake');
            @import url('https://fonts.cdnfonts.com/css/varsity');
            @import url('https://db.onlinewebfonts.com/c/72da2edf2e878addc8cd378af836530d?family=Qurova+DEMO+SemBd');
            @import url('https://fonts.cdnfonts.com/css/klaxon');
            @import url('https://fonts.cdnfonts.com/css/harmony');
            @import url('https://fonts.cdnfonts.com/css/kabisat');
            @import url('https://fonts.cdnfonts.com/css/thurkle');
            @import url('https://fonts.cdnfonts.com/css/windstone');
            
            /* Interaction Highlights - Only on Hover */
            [data-interaction] {
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                outline: none !important;
            }
            /* Only show highlight on hover */
            [data-interaction]:hover {
                box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.6) !important;
                background-color: rgba(99, 102, 241, 0.1) !important;
            }

            /* Hide potential editor artifacts/handles/labels */
            .moveable-control-box, 
            .moveable-line, 
            .moveable-area, 
            .rnb-resize-handler,
            [class*="resize-handle"],
            [class*="ui-resizable-handle"],
            [class*="interaction-label"],
            [class*="frame-label"] {
                display: none !important;
            }

            /* Specific fix for "ZOOM" label if it's text content in a frame */
            [data-interaction-type="frame"] {
                color: transparent !important; /* Hide text like "ZOOM" */
                font-size: 0 !important;
            }
            
            /* Ensure the frame itself is transparent but interactive */
            [data-interaction-type="frame"] {
                position: absolute;
                z-index: 1000;
                pointer-events: auto;
                background-color: transparent !important;
                border: none !important;
            }
        </style>
        ${interactionScript}
        ${slideshowScript}
        ${animationScript}
        `;

      if (content.includes('</head>')) {
        content = content.replace('</head>', `${styleString}</head>`);
      } else if (content.includes('<body')) {
        content = content.replace('<body', `<head>${styleString}</head><body`);
      } else {
        content = styleString + content;
      }
    }

    return content
      .replace(/contenteditable="true"/gi, 'contenteditable="false"');
  }, []);

  // Store calculateTargetOffset in a ref
  const calculateTargetOffsetRef = useRef(calculateTargetOffset);
  useEffect(() => {
    calculateTargetOffsetRef.current = calculateTargetOffset;
  }, [calculateTargetOffset]);

  // Initialize Turn.js
  const initializeTurnJs = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      setIsReady(false);
      setLoadingError(null);

      if (!window.jQuery) {
        await loadScript('/lib/jquery.min.js?v=3.7.1');
      }

      if (!window.jQuery?.fn?.turn) {
        await loadScript('/lib/turn.min.js?v=4.1.0');
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      if (!window.jQuery || !window.jQuery.fn.turn) {
        throw new Error('Turn.js library failed to initialize');
      }

      if (!flipbookRef.current) {
        throw new Error('Flipbook container not found');
      }

      const $ = window.jQuery;
      const $flipbook = $(flipbookRef.current);

      $flipbook.empty();
      $flipbook.removeAttr('style').removeClass();

      const bookWidth = isSingleView ? PAGE_WIDTH : PAGE_WIDTH * 2;
      const bookHeight = PAGE_HEIGHT;

      const initId = ++currentInitIdRef.current;
      setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null });

      if (stablePages.length === 0) return;

      // Build pages
      stablePages.forEach((pageHTML, index) => {
        const pageNumber = index + 1;

        const $page = $('<div />', {
          'class': `page page-${pageNumber}`,
          'data-page-number': pageNumber,
          css: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            position: 'relative'
          }
        });

        const $wrapper = $('<div />', {
          'class': 'page-wrapper',
          css: {
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }
        });

        const $iframe = $('<iframe />', {
          srcDoc: sanitizeHTML(pageHTML, pageNumber),
          css: {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: 'auto', // Allow interaction
            backgroundColor: '#ffffff'
          },
          title: `Page ${pageNumber}`,
          scrolling: 'no' // Keep no scrolling to maintain book look, but content is interactive
        });

        const $pageNum = $('<div />', {
          'class': 'page-number-overlay',
          text: pageNumber,
          css: {
            position: 'absolute',
            bottom: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            color: '#aaa',
            fontWeight: '500',
            zIndex: 10
          }
        });

        $wrapper.append($iframe);
        $page.append($wrapper, $pageNum);
        $flipbook.append($page);
      });

      // Initialize Turn.js
      $flipbook.turn({
        width: bookWidth,
        height: bookHeight,
        autoCenter: true,
        display: isSingleView ? 'single' : 'double',
        acceleration: true,
        gradients: true,
        elevation: 50,
        duration: 800,
        page: 1,
        pages: stablePages.length,
        direction: 'ltr',

        when: {
          turning: function (event, page, view) {
            const $this = $(this);
            if ($this.data('isAnimating')) {
              event.preventDefault();
              return;
            }

            $this.data('isAnimating', true);
            setIsAnimating(true);
            setAnimationTargetView(view);
            playFlipSound();
          },

          turned: function (event, page, view) {
            const $this = $(this);

            setCurrentPage(page);
            setCurrentView(view || [page]);
            setAnimationTargetView(null);

            setTimeout(() => {
              $this.data('isAnimating', false);
              setIsAnimating(false);
            }, 100);
          },

          start: function (event, pageObject, corner) { },

          end: function (event, pageObject, turned) {
            if (!turned) {
              const $this = $(this);
              $this.data('isAnimating', false);
              setIsAnimating(false);
              setAnimationTargetView(null);
            }
          }
        }
      });

      // Race condition guard: Check if this init attempt is still the current one
      if (initId !== currentInitIdRef.current) {
        console.warn('Turn.js: Initialization superseded by newer call');
        destroyTurn();
        return;
      }

      turnInstanceRef.current = $flipbook;

      const initialView = $flipbook.turn('view');
      setCurrentView(initialView || [1]);
      setCurrentPage(1);
      setIsReady(true);
      initializationRef.current = false;

      console.log('Turn.js initialized:', isSingleView ? 'single' : 'double', 'view');

    } catch (error) {
      console.error('Turn.js error:', error);
      setLoadingError(error.message || 'Failed to initialize flipbook');
      initializationRef.current = false;
    }
  }, [isSingleView, stablePages, loadScript, sanitizeHTML, playFlipSound]);

  // Initialize on mount and view change
  useEffect(() => {
    destroyTurn();
    initializationRef.current = false;
    setCenterOffset(0);
    setAnimationTargetView(null);

    const timer = setTimeout(() => {
      initializeTurnJs();
    }, 200);

    return () => {
      clearTimeout(timer);
      destroyTurn();
    };
  }, [isSingleView, stablePages]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    const targetPage = Math.max(1, Math.min(totalPages, page));
    turnInstanceRef.current.turn('page', targetPage);
  }, [isReady, isAnimating, totalPages]);

  const nextPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage < totalPages) {
      turnInstanceRef.current.turn('next');
    }
  }, [isReady, isAnimating, currentPage, totalPages]);

  // Broadcast View Changes for Animation
  useEffect(() => {
    // Async Theory: Defer broadcast slightly to ensure Turn.js and DOM are synced
    const timer = setTimeout(() => {
      if (!isReady || !flipbookRef.current) return;

      const iframes = flipbookRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'flipbook-view-change',
            view: currentView
          }, '*');
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentView, isReady]);

  // Listen for navigation messages from iframes
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'flipbook-navigate') {
        const pageNum = Number(event.data.page);
        if (!isNaN(pageNum)) {
          goToPage(pageNum);
        }
      }
      if (event.data && event.data.type === 'flipbook-popup') {
        setPopupData({
          isOpen: true,
          ...event.data.data
        });
      }
      if (event.data && event.data.type === 'flipbook-spread-zoom') {
        const { elementId, scale, rect, page } = event.data.data;
        const current = spreadZoomRef.current;

        if (current.active && current.elementId === elementId) {
          setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null, originalRect: null, page: null, centerOffset: 0, isEntering: false, isSingleView: false });
        } else {
          const elementCenterX = rect.left + rect.width / 2;
          const elementCenterY = rect.top + rect.height / 2;

          // In Single View, we subtract PAGE_WIDTH/2 because the iframe's left=0 starts half-width from viewport center 
          const relX = isSingleView ? (elementCenterX - PAGE_WIDTH / 2) : ((page % 2 === 0) ? (elementCenterX - PAGE_WIDTH) : elementCenterX);
          const relY = elementCenterY - PAGE_HEIGHT / 2;

          const dx = -(relX + centerOffset) * scale;
          const dy = -relY * scale;

          setSpreadZoom({
            active: true,
            scale: scale,
            x: dx,
            y: dy,
            elementId,
            originalRect: rect,
            page,
            centerOffset,
            isEntering: true,
            isSingleView: isSingleView
          });

          // After initial transition, mark as no longer entering to enable fast hover follow
          setTimeout(() => {
            setSpreadZoom(prev => ({ ...prev, isEntering: false }));
          }, 750);
        }
      }

      if (event.data && event.data.type === 'flipbook-zoom-move') {
        const { mouseX, mouseY } = event.data.data;
        const current = spreadZoomRef.current;

        if (current.active && current.originalRect) {
          const { originalRect, page, scale, centerOffset, isSingleView: zoomIsSingle } = current;

          // Amazon-style: Pan within the element based on cursor position
          const panX = (mouseX - 0.5) * (originalRect.width * 0.8);
          const panY = (mouseY - 0.5) * (originalRect.height * 0.8);

          const elementCenterX = originalRect.left + originalRect.width / 2;
          const elementCenterY = originalRect.top + originalRect.height / 2;

          // Use stored view mode from when zoom started
          const relX = zoomIsSingle ? (elementCenterX - PAGE_WIDTH / 2) : ((page % 2 === 0) ? (elementCenterX - PAGE_WIDTH) : elementCenterX);
          const relY = elementCenterY - PAGE_HEIGHT / 2;

          const dx = -(relX + centerOffset + panX) * scale;
          const dy = -(relY + panY) * scale;

          setSpreadZoom(prev => ({
            ...prev,
            x: dx,
            y: dy
          }));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [goToPage]);

  // Sync zoom state to all iframess
  useEffect(() => {
    const iframes = document.querySelectorAll('#flipbook iframe');
    iframes.forEach(iframe => {
      iframe.contentWindow?.postMessage({
        type: 'set-zoom-state',
        active: spreadZoom.active
      }, '*');
    });
  }, [spreadZoom.active]);

  const prevPage = useCallback(() => {
    if (!isReady || isAnimating || !turnInstanceRef.current) return;
    if (currentPage > 1) {
      turnInstanceRef.current.turn('previous');
    }
  }, [isReady, isAnimating, currentPage]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    if (isMobile) return;
    const currentPageNum = currentPage;
    destroyTurn();
    setIsSingleView(prev => !prev);

    setTimeout(() => {
      if (turnInstanceRef.current) {
        turnInstanceRef.current.turn('page', currentPageNum);
      }
    }, 600);
  }, [isMobile, currentPage, destroyTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isReady) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          nextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
        case 'Escape':
          if (isFullscreen) toggleFullscreen();
          else if (showThumbnails) setShowThumbnails(false);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, nextPage, prevPage, goToPage, totalPages, isFullscreen, showThumbnails]);

  // Autoplay
  useEffect(() => {
    let interval;
    if (isPlaying && isReady && !isAnimating) {
      interval = setInterval(() => {
        if (currentPage < totalPages) {
          nextPage();
        } else {
          setIsPlaying(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isReady, isAnimating, currentPage, totalPages, nextPage]);

  // Zoom
  const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.1));

  // Handle Ctrl + Scroll for zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom(prev => Math.min(1.5, prev + 0.05));
        } else {
          setZoom(prev => Math.max(0.4, prev - 0.05));
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Display info
  const getDisplayInfo = () => {
    if (isSingleView) {
      return `${currentPage} / ${totalPages}`;
    }
    const view = currentView.filter(p => p > 0);
    if (view.length === 2) {
      return `${view[0]}-${view[1]} / ${totalPages}`;
    }
    return `${currentPage} / ${totalPages}`;
  };

  // Inject Turn.js styles
  useEffect(() => {
    const styleId = 'flipbook-turnjs-styles';

    // Check if styles already exist
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Turn.js Dynamic Class Styles */
      #flipbook .page {
        background: #fff;
        position: absolute;
        top: 0;
      }
      
      #flipbook.single-mode .page {
        background: linear-gradient(to right, #f5f5f5 0%, #ffffff 3%, #ffffff 100%);
        box-shadow: 
          inset 12px 0 25px -8px rgba(0, 0, 0, 0.15),
          inset 6px 0 10px -4px rgba(0, 0, 0, 0.08),
          inset 3px 0 6px -2px rgba(0, 0, 0, 0.05),
          -4px 0 15px rgba(0, 0, 0, 0.08),
          0 8px 30px rgba(0, 0, 0, 0.12);
        border-radius: 3px;
      }
      
      #flipbook.single-mode .page::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.06) 0%,
          rgba(0, 0, 0, 0.03) 30%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .odd {
        background: linear-gradient(to right, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 0 3px 3px 0;
        box-shadow: 
          inset 15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset 8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset 4px 0 8px -2px rgba(0, 0, 0, 0.06),
          4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .odd::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to right,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook.double-mode .even {
        background: linear-gradient(to left, #e5e5e5 0%, #f0f0f0 2%, #f8f8f8 4%, #ffffff 8%, #ffffff 100%);
        border-radius: 3px 0 0 3px;
        box-shadow: 
          inset -15px 0 30px -10px rgba(0, 0, 0, 0.18),
          inset -8px 0 15px -5px rgba(0, 0, 0, 0.1),
          inset -4px 0 8px -2px rgba(0, 0, 0, 0.06),
          -4px 0 12px rgba(0, 0, 0, 0.06),
          0 6px 20px rgba(0, 0, 0, 0.1);
      }
      
      #flipbook.double-mode .even::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to left,
          rgba(0, 0, 0, 0.08) 0%,
          rgba(0, 0, 0, 0.04) 40%,
          rgba(0, 0, 0, 0) 100%
        );
        pointer-events: none;
        z-index: 5;
      }
      
      #flipbook .page-1,
      #flipbook .p1 {
        border-radius: 0 4px 4px 0 !important;
        background: linear-gradient(to right, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%) !important;
        box-shadow: 
          inset 20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset 10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset 5px 0 10px -3px rgba(0, 0, 0, 0.08),
          6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15) !important;
      }
      
      #flipbook .page:last-child {
        border-radius: 4px 0 0 4px;
        background: linear-gradient(to left, #e0e0e0 0%, #ebebeb 2%, #f5f5f5 5%, #ffffff 10%, #ffffff 100%);
        box-shadow: 
          inset -20px 0 35px -12px rgba(0, 0, 0, 0.2),
          inset -10px 0 18px -6px rgba(0, 0, 0, 0.12),
          inset -5px 0 10px -3px rgba(0, 0, 0, 0.08),
          -6px 0 18px rgba(0, 0, 0, 0.1),
          0 10px 35px rgba(0, 0, 0, 0.15);
      }
      
      #flipbook.double-mode::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 8px;
        transform: translateX(-50%);
        background: linear-gradient(to right, 
          rgba(0, 0, 0, 0.15) 0%, 
          rgba(0, 0, 0, 0.08) 20%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(0, 0, 0, 0.08) 80%,
          rgba(0, 0, 0, 0.15) 100%
        );
        z-index: 1000;
        pointer-events: none;
      }
      
      #flipbook.double-mode::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.3);
        z-index: 1001;
        pointer-events: none;
      }
      
      #flipbook .gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      
      #flipbook * {
        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;
      }
      
      #flipbook .page {
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
      }
      
      #flipbook .turn-page {
        z-index: 500 !important;
      }
      
      #flipbook .page.turning {
        z-index: 1000 !important;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25), 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#F5F5F5] z-[100] flex flex-col font-sans text-gray-800"
      onClick={(e) => {
        if (spreadZoom.active) {
          setSpreadZoom({ active: false, scale: 1, x: 0, y: 0, elementId: null });
        }
      }}
    >
      {/* Top Bar */}
      <div className={`flex items-center justify-between px-6 py-4 bg-[#F5F5F5] z-20 transition-all duration-500 ${spreadZoom.active ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center w-64">
          <div className="bg-white p-2 border border-gray-200 shadow-sm">
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain bg-blend-multiply" />
          </div>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-normal text-gray-900 tracking-wide">{pageName}</h1>
        </div>
        <div className="w-64 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-gray-200 border border-black rounded-md text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to work
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#F5F5F5]">

        {/* Loading State */}
        {!isReady && !loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F5F5F5] z-50">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-500">Preparing flipbook...</p>
          </div>
        )}

        {/* Error State */}
        {loadingError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <p className="text-red-500 mb-4">{loadingError}</p>
            <button
              onClick={() => {
                setLoadingError(null);
                initializationRef.current = false;
                initializeTurnJs();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Arrows - Only show when not zoomed */}
        {isReady && !spreadZoom.active && (
          <>
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || isAnimating}
              className={`absolute left-6 z-10 p-2 rounded-full transition-colors
                ${currentPage <= 1 || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronLeft size={40} className="text-gray-700" strokeWidth={1} />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || isAnimating}
              className={`absolute right-6 z-10 p-2 rounded-full transition-colors
                ${currentPage >= totalPages || isAnimating
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200'}`}
            >
              <ChevronRight size={40} className="text-gray-700" strokeWidth={1} />
            </button>
          </>
        )}

        {/* Backdrop for Zoom Focus */}
        <div
          className={`absolute inset-0 z-[5] bg-black transition-all duration-700 ease-in-out ${spreadZoom.active ? 'bg-opacity-40 backdrop-blur-[2px] opacity-100' : 'bg-opacity-0 opacity-0 pointer-events-none'}`}
        />

        {/* Flipbook Wrapper with Smooth Centering */}
        <div
          className="flex items-center justify-center relative z-10 will-change-transform"
          style={{
            transform: spreadZoom.active
              ? `translate(${spreadZoom.x}px, ${spreadZoom.y}px) scale(${spreadZoom.scale})`
              : `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: spreadZoom.active
              ? (spreadZoom.isEntering ? 'transform 0.7s ease-out' : 'transform 0.1s linear')
              : 'transform 0.7s ease-out'
          }}
        >
          {/* Center wrapper - handles offset for single page centering */}
          <div
            className="flex items-center justify-center will-change-transform"
            style={{
              transform: `translateX(${centerOffset}px)`,
              transition: isAnimating
                ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Turn.js target element */}
            <div
              id="flipbook"
              ref={flipbookRef}
              className={`relative shadow-[0_10px_40px_rgba(0,0,0,0.2)] ${isSingleView ? 'single-mode' : 'double-mode'}`}
              style={{
                visibility: isReady ? 'visible' : 'hidden'
              }}
            />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && (
        <div className="absolute bottom-16 left-0 right-0 bg-[#333]/95 backdrop-blur-sm z-40 p-4 border-t border-gray-700">
          <div className="flex gap-4 overflow-x-auto pb-2 justify-center scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {pages.map((html, idx) => {
              const pageNum = idx + 1;
              const isVisible = currentView.includes(pageNum);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    goToPage(pageNum);
                    setShowThumbnails(false);
                  }}
                  className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 w-20 h-28
                    ${isVisible
                      ? 'ring-2 ring-indigo-500 scale-105'
                      : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className="w-full h-full bg-white rounded-sm overflow-hidden flex items-center justify-center text-gray-500 font-bold shadow-md">
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`h-14 bg-[#3E3E3E] text-gray-300 flex items-center px-4 justify-between z-30 select-none transition-all duration-500 ${spreadZoom.active ? 'opacity-30 pointer-events-none translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <div className="w-16 flex justify-start">
          <button className="p-2 hover:text-white transition-colors">
            <List size={20} />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Thumbnails & Autoplay */}
          <div className="flex items-center gap-2 border-r border-gray-600 pr-6">
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${showThumbnails ? 'text-white bg-gray-600' : ''}`}
              onClick={() => setShowThumbnails(!showThumbnails)}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1.5 hover:text-white rounded transition-colors ${isPlaying ? 'text-green-400' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

          {/* Page Slider */}
          <div className="flex items-center gap-3 w-64">
            <span className="text-xs text-gray-400 w-12 text-right">{getDisplayInfo()}</span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              disabled={isAnimating}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:bg-[#6C63FF] 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:bg-[#6C63FF]
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-none"
            />
          </div>

          {/* View Mode & Features */}
          <div className="flex items-center gap-4 border-l border-gray-600 pl-6 border-r pr-6">
            {!isMobile && (
              <button
                className="p-1.5 hover:text-white transition-colors"
                onClick={toggleViewMode}
                title={isSingleView ? "Switch to Double" : "Switch to Single"}
              >
                {isSingleView ? <BookOpen size={18} /> : <FileText size={18} />}
              </button>
            )}
            <button className="p-1.5 hover:text-white transition-colors">
              <Bookmark size={18} />
            </button>
            <button className="p-1.5 hover:text-white transition-colors">
              <Music size={18} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="w-auto flex justify-end gap-3 pl-6 border-l border-gray-600">
          <button className="hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
          <button className="hover:text-white transition-colors">
            <Download size={18} />
          </button>
          <button className="hover:text-white transition-colors" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Global Popup Message Overlay - Covers entire screen */}
      {popupData.isOpen && (
        <PopupPreview
          content={popupData.content}
          styles={popupData.styles}
          elementType={popupData.elementType}
          elementSource={popupData.elementSource}
          mode="preview"
          onClose={() => setPopupData({ ...popupData, isOpen: false })}
        />
      )}

      {/* Styles for scaleUp animation */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FlipbookPreview;