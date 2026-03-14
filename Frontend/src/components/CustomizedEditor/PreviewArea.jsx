import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import HTMLFlipBook from 'react-pageflip';
import backgroundComponents from './Backgrounds'; // Import the background components
import animationComponents from './Animations';
import * as BookAppearanceHelpers from './bookAppearanceHelpers';


const getSlideshowScript = () => `
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
               const baseOpacity = el.style.opacity || '1';
               currentIndex = newIndex;
               isAnimating = true;
               const finish = () => {
                  el.src = nextImg.url;
                  el.style.transition = '';
                  el.style.transform = '';
                  el.style.opacity = baseOpacity;
                  isAnimating = false;
               };
               el.style.transition = 'opacity 0.4s ease-in-out';
               el.style.opacity = '0.2';
               setTimeout(() => {
                  el.src = nextImg.url;
                  el.style.opacity = baseOpacity;
                  setTimeout(finish, 400); 
               }, 400);
            };
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
          } catch(e) { console.error('Slideshow init error', e); }
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSlideshows);
      else initSlideshows();
    })();
  </script>
`;

const getAnimationScript = (pageNumber) => `
  <script>
    (function() {
      const pageNumber = ${pageNumber};
      const initAnim = () => {
      const WAAPI_ANIMATIONS = {
        'none': [],
        'fade-in': [{ opacity: 0 }, { opacity: 1 }],
        'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
        'focus-in': [{ filter: 'blur(12px)', opacity: 0, transform: 'scale(1.2)' }, { filter: 'blur(0)', opacity: 1, transform: 'scale(1)' }],
        'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' }],
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
      const runAnim = (el, type, settings) => {
         if (!type || !WAAPI_ANIMATIONS[type]) return;
         if (!settings.everyVisit && el.dataset.animRun === 'true') return;
         const duration = ((parseFloat(settings.duration) || 1) / (parseFloat(settings.speed) || 1)) * 1000;
         const delay = (parseFloat(settings.delay) || 0) * 1000;
         el.animate(WAAPI_ANIMATIONS[type], { 
           duration, delay, fill: 'forwards', easing: 'ease-out'
         });
         el.dataset.animRun = 'true';
      };
      const handleTrigger = (context) => { 
           requestAnimationFrame(() => {
               document.querySelectorAll('[data-animation-trigger="While Opening"]').forEach(el => {
                   const type = el.getAttribute('data-animation-open-type');
                   if (type) runAnim(el, type, { 
                       duration: el.getAttribute('data-animation-open-duration'),
                       speed: el.getAttribute('data-animation-open-speed'),
                       delay: el.getAttribute('data-animation-open-delay'),
                       everyVisit: el.getAttribute('data-animation-open-every-visit') !== 'false'
                   });
               });
           });
      };
      // Simple initial trigger
      handleTrigger();
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAnim);
      else initAnim();
    })();
  </script>
`;

const getInteractionScript = (pageNumber) => `
  <script>
    (function() {
        const init = () => {
            window._pageNumber = ${pageNumber};
            document.addEventListener('click', (e) => {
               const el = e.target.closest('[data-interaction]');
               if (el) {
                   const type = el.dataset.interaction;
                   const value = el.dataset.interactionValue;
                   if (type === 'link' && value) {
                       window.open(value.startsWith('http') ? value : 'https://' + value, '_blank');
                   } else if (type === 'popup') {
                       // Basic alert for now in customized editor
                       // console.log("Popup clicked", el.dataset.interactionContent);
                   }
               }
            });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    })();
  </script>
`;

const getIframeContent = (html, pageNumber) => {
    // Inject scripts
    const content = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: white; width: 100%; height: 100%; }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                </style>
                ${getSlideshowScript()}
                ${getAnimationScript(pageNumber)}
                ${getInteractionScript(pageNumber)}
            </head>
            <body>
                ${html || ''}
            </body>
        </html>
    `;
    return content;
};

const PageItem = React.memo(({ html, index }) => {
    return (
        <iframe 
            className="w-full h-full border-none overflow-hidden origin-top-left" 
            srcDoc={getIframeContent(html, index + 1)}
            title={`Page ${index + 1}`}
            style={{ 
                transform: 'scale(0.67)', 
                width: '149.25%', 
                height: '149.25%',
                pointerEvents: 'none'
            }} 
        />
    );
});

const FlipPage = React.forwardRef(({ children, style, textureStyle, number, density: propDensity, isPad, ...props }, ref) => {
    const isEven = number % 2 === 0;
    const density = propDensity || props['data-density'] || 'soft';
    
    return (
        <div 
            className="fisto-book-page h-full overflow-hidden relative" 
            ref={ref} 
            style={{
                backgroundColor: 'white',
                boxShadow: isPad ? 'none' : (isEven ? '2px 0 10px rgba(0,0,0,0.1)' : '-2px 0 10px rgba(0,0,0,0.1)'),
                ...style
            }} 
            data-density={density}
        >
            {!isPad && (
                <div 
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{
                        boxShadow: isEven
                            ? 'inset -10px 0 20px -10px rgba(0, 0, 0, 0.15), inset 2px 0 5px rgba(0, 0, 0, 0.05)'
                            : 'inset 10px 0 20px -10px rgba(0, 0, 0, 0.15), inset -2px 0 5px rgba(0, 0, 0, 0.05)',
                        borderRadius: style?.borderRadius
                    }}
                />
            )}
            
            <div className="fisto-book-content w-full h-full p-0 m-0 relative z-10 transition-all duration-300">
                {children}
            </div>
            {/* Texture Overlay - Must be on top with multiply blend mode to be visible */}
            {textureStyle && (
                <div 
                    className="absolute inset-0 pointer-events-none z-30 opacity-60" 
                    style={{
                        ...textureStyle,
                        borderRadius: style?.borderRadius
                    }} 
                />
            )}
        </div>
    );
});

const PreviewArea = React.memo(({ 
    bookName, 
    pages = [], 
    zoom = 1, 
    targetPage = 0, 
    onPageChange, 
    logoSettings, 
    backgroundSettings, 
    bookAppearanceSettings, 
    menuBarSettings,
    leadFormSettings, 
    hideHeader = false 
}) => {
    const bookRef = useRef();
    const containerRef = useRef();
    const isFlippingRef = useRef(false);
    const lastSyncPage = useRef(targetPage);
    
    // Default settings if none provided
    const settings = menuBarSettings || {
        navigation: { nextPrevButtons: true, mouseWheel: true, dragToTurn: true, pageQuickAccess: true, tableOfContents: true, pageThumbnails: true, bookmark: true, startEndNav: true },
        viewing: { zoom: true, fullScreen: true },
        interaction: { search: true, notes: true, gallery: true },
        media: { autoFlip: true, backgroundAudio: true },
        shareExport: { share: true, download: true, contact: true },
        brandingProfile: { logo: true, profile: true }
    };

    // Menu States
    const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isAutoFlipping, setIsAutoFlipping] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(zoom);
    const [currentPage, setCurrentPage] = useState(targetPage);

    // Auto Flip Interval
    useEffect(() => {
        let interval;
        if (isAutoFlipping) {
            const duration = (settings.media?.autoFlipSettings?.duration || 2) * 1000;
            interval = setInterval(() => {
                const flip = bookRef.current?.pageFlip();
                if (flip) {
                    if (flip.getCurrentPageIndex() < pages.length - 1) {
                        flip.flipNext();
                    } else {
                        setIsAutoFlipping(false);
                    }
                }
            }, duration);
        }
        return () => clearInterval(interval);
    }, [isAutoFlipping, pages.length, settings.media?.autoFlipSettings?.duration]);

    const handleZoomIn = () => setCurrentZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setCurrentZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleFullScreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: bookName,
                text: `Check out this flipbook: ${bookName}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert('Sharing is not supported on this browser. Copy link: ' + window.location.href);
        }
    };

    const handleDownload = () => {
        alert('Download triggered for: ' + bookName);
        // Implement actual download logic (e.g. PDF generation)
    };

    // Click outside to close menus
    useEffect(() => {
        const handleClickOutside = () => {
            setShowBookmarkMenu(false);
            setShowMoreMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Page dimensions (A4 ratio)
    const WIDTH = 400;
    const HEIGHT = 566; 

    const [offset, setOffset] = useState(0); 
    
    const logoObjectFit = logoSettings?.type === 'Fill' ? 'cover' : logoSettings?.type === 'Stretch' ? 'fill' : 'contain';

    // Augmented pages for single-centered alignment behavior
    const augmentedPages = useMemo(() => {
        if (!pages || pages.length === 0) return [];
        const result = [{ isPad: true }, ...pages];
        // Ensure last page is single if total count is even (relative to logical pages)
        // Pad, P1, P2, P3... PN
        // index: 0, 1, 2, 3... N
        // If N is even, PN is on left side [PN, Pad]
        // If N is odd, PN is on right side [PN-1, PN] -> Needs [PN, Pad] to be single
        if (pages.length % 2 !== 0) {
            result.push({ isPad: true });
        } else {
             result.push({ isPad: true }); // Always pad the end for consistency in centering logic
        }
        return result;
    }, [pages]);

    // Book Appearance Logic - Using helper functions with memoization to prevent re-render loops
    const processedAppearance = React.useMemo(() => 
        BookAppearanceHelpers.processBookAppearanceSettings(bookAppearanceSettings),
        [bookAppearanceSettings]
    );
    
    const { 
        shadowStyle,
        cornerRadius,
        pageOpacity,
        textureStyle,
        flipTime,
        hardCover: useHardCover,
        shadowActive
    } = processedAppearance;

    // Memoize background style to prevent re-render loops
    const backgroundStyle = React.useMemo(() => {
        if (backgroundSettings?.style === 'Gradient') {
            return { background: backgroundSettings.gradient };
        } else if (backgroundSettings?.style === 'Image' && backgroundSettings.image) {
            const adj = backgroundSettings.adjustments || {};
            const exposure = adj.exposure || 0;
            const contrast = adj.contrast || 0;
            const saturation = adj.saturation || 0;
            const temperature = adj.temperature || 0;
            const tint = adj.tint || 0;
            const highlights = (adj.highlights || 0) / 5;
            const shadows = (adj.shadows || 0) / 5;

            const filterStr = `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
            
            const fitMap = {
                'Fit': 'contain',
                'Fill': 'cover',
                'Stretch': '100% 100%'
            };

            return {
                backgroundImage: `url(${backgroundSettings.image})`,
                backgroundSize: fitMap[backgroundSettings.fit] || 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: filterStr,
                opacity: (backgroundSettings.opacity || 100) / 100
            };
        }
        return { backgroundColor: backgroundSettings?.color || '#DADBE8' };
    }, [backgroundSettings]);

    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);

    useEffect(() => {
        if (!leadFormSettings || !leadFormSettings.enabled || leadFormSubmitted) {
            setShowLeadForm(false);
            return;
        }

        const timing = leadFormSettings.appearance.timing;
        const afterPages = leadFormSettings.appearance.afterPages || 1;

        if (timing === 'before' && targetPage >= 0) {
            setShowLeadForm(true);
        } else if (timing === 'after-pages' && targetPage >= afterPages) {
            setShowLeadForm(true);
        } else if (timing === 'end' && targetPage >= pages.length - 1) {
            setShowLeadForm(true);
        } else {
            setShowLeadForm(false);
        }
    }, [targetPage, leadFormSettings, leadFormSubmitted, pages.length]);

    const onFlip = useCallback((e) => {
        const index = e.data;
        const total = augmentedPages.length;
        
        // Convert augmented index to logical page index
        // logical P1 is at index 1
        const logicalIndex = Math.max(0, index - 1);

        // Only update parent if it's a real user-triggered flip
        if (onPageChange && !isFlippingRef.current && logicalIndex !== lastSyncPage.current) {
             lastSyncPage.current = logicalIndex;
             onPageChange(logicalIndex);
        }
        
        // Adjust for cover centering
        let newOffset = 0;
        if (logicalIndex === 0) {
            newOffset = -(WIDTH / 2); 
        } else if (logicalIndex === pages.length - 1) {
            // If Last index is Even (P1, P3, P5...), it's on the Right side
            // If Last index is Odd (P2, P4, P6...), it's on the Left side
            newOffset = (logicalIndex % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2);
        } else {
            newOffset = 0;
        }
        setCurrentPage(logicalIndex);
        setOffset(newOffset);
    }, [pages.length, onPageChange, WIDTH]);

    useEffect(() => {
        if (pages.length === 0) {
            setOffset(0);
        } else if (targetPage === 0) {
            setOffset(-(WIDTH / 2));
        } else if (targetPage === pages.length - 1) {
            setOffset((targetPage % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2));
        } else {
            setOffset(0);
        }
    }, [pages.length, WIDTH, targetPage]);


    // Handle external page change (Synchronize parent state to book)
    useEffect(() => {
        if (!bookRef.current || augmentedPages.length === 0) return;
        
        // Logical page X is at augmented index X+1? No, let's be precise.
        // P0 (index 0) -> Aug[1]
        const augTarget = targetPage + 1;
        
        const flip = bookRef.current.pageFlip();
        if (flip && flip.getCurrentPageIndex() !== augTarget) {
            isFlippingRef.current = true;
            lastSyncPage.current = targetPage;
            setCurrentPage(targetPage);
            
            const timer = setTimeout(() => {
                if (bookRef.current) {
                    try {
                        bookRef.current.pageFlip().turnToPage(augTarget);
                    } catch (e) {
                        console.warn('Flip error', e);
                    }
                }
                isFlippingRef.current = false;
            }, 50);
            
            return () => {
                clearTimeout(timer);
                isFlippingRef.current = false;
            };
        }
    }, [targetPage, augmentedPages.length]);

    return (
        <div 
            ref={containerRef}
            className="flex-1 flex flex-col relative min-h-0 overflow-hidden" 
            style={{ backgroundColor: backgroundSettings?.color || '#DADBE8' }}
        >
            {/* Lead Form Overlay */}
            {showLeadForm && (
                <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-[2vw]">
                    <div 
                        className="w-[35vw] bg-white rounded-[1vw] shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-300"
                        style={{ 
                            fontFamily: leadFormSettings.appearance.fontStyle,
                            borderColor: leadFormSettings.appearance.bgStroke,
                            backgroundColor: leadFormSettings.appearance.bgFill
                        }}
                    >
                        {/* Close Button (if skip allowed) */}
                        {leadFormSettings.appearance.allowSkip && (
                            <button 
                                onClick={() => setLeadFormSubmitted(true)}
                                className="absolute top-[1vw] right-[1vw] p-[0.5vw] hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw]" />
                            </button>
                        )}

                        <div className="p-[2.5vw] space-y-[2vw]">
                            {/* Header */}
                            <div className="text-center space-y-[0.5vw]">
                                <h2 
                                    className="text-[1.8vw] font-bold"
                                    style={{ color: leadFormSettings.appearance.textFill }}
                                >
                                    To Access the Flipbook
                                </h2>
                                <div className="flex items-center justify-center gap-[1vw]">
                                    <div className="h-[1px] bg-gray-200 flex-1" />
                                    <p className="text-[0.85vw] text-gray-400 font-medium">Enter your details to continue <span className="text-red-500">*</span></p>
                                    <div className="h-[1px] bg-gray-200 flex-1" />
                                </div>
                            </div>

                            {/* Lead Message */}
                            <p className="text-center text-[1vw] font-semibold text-gray-700 italic border-l-4 border-indigo-500 pl-[1vw] py-[0.5vw]">
                                "{leadFormSettings.leadText}"
                            </p>

                            {/* Form Fields */}
                            <div className="space-y-[1.25vw]">
                                {leadFormSettings.fields.name && (
                                    <div className="relative group">
                                        <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Icon icon="lucide:user" className="w-[1.1vw] h-[1.1vw]" />
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Enter Your Name as Lead"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-[0.75vw] py-[0.8vw] pl-[3vw] pr-[1vw] text-[0.9vw] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                )}
                                {leadFormSettings.fields.phone && (
                                    <div className="relative group">
                                        <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Icon icon="lucide:phone" className="w-[1.1vw] h-[1.1vw]" />
                                        </div>
                                        <input 
                                            type="tel" 
                                            placeholder="Enter Your Phone as Lead"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-[0.75vw] py-[0.8vw] pl-[3vw] pr-[1vw] text-[0.9vw] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                )}
                                {leadFormSettings.fields.email && (
                                    <div className="relative group">
                                        <div className="absolute left-[1vw] top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                            <Icon icon="lucide:mail" className="w-[1.1vw] h-[1.1vw]" />
                                        </div>
                                        <input 
                                            type="email" 
                                            placeholder="Enter Your Gmail as Lead"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-[0.75vw] py-[0.8vw] pl-[3vw] pr-[1vw] text-[0.9vw] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-[1vw] pt-[0.5vw]">
                                {leadFormSettings.appearance.allowSkip && (
                                    <button 
                                        onClick={() => setLeadFormSubmitted(true)}
                                        className="flex-1 py-[0.75vw] rounded-[0.5vw] font-bold text-[0.85vw] border-2 transition-all hover:bg-gray-50 active:scale-95"
                                        style={{ 
                                            borderColor: leadFormSettings.appearance.btnFill, 
                                            color: leadFormSettings.appearance.btnFill 
                                        }}
                                    >
                                        SKIP
                                    </button>
                                )}
                                <button 
                                    onClick={() => setLeadFormSubmitted(true)}
                                    className="flex-1 py-[0.75vw] rounded-[0.5vw] font-bold text-[0.85vw] border-2 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-indigo-500/20"
                                    style={{ 
                                        backgroundColor: leadFormSettings.appearance.btnFill, 
                                        borderColor: leadFormSettings.appearance.btnStroke,
                                        color: leadFormSettings.appearance.btnText
                                    }}
                                >
                                    SUBMIT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Layer - Only for Gradient or Image or ReactBits */}
            {(backgroundSettings?.style === 'Gradient' || (backgroundSettings?.style === 'Image' && backgroundSettings.image)) && (
                <div className="absolute inset-0 z-0 pointer-events-none" style={backgroundStyle} />
            )}

            {backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                </div>
            )}

            {/* Animation Overlay Layer */}
            {backgroundSettings?.animation && backgroundSettings.animation !== 'None' && animationComponents[backgroundSettings.animation] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(animationComponents[backgroundSettings.animation])}
                </div>
            )}
            
            {/* Top Bar - Revamped */}
            {!hideHeader && (
                <div 
                    className="h-[8vh] bg-[#3E4491]/90 backdrop-blur-md flex items-center justify-between px-[2vw] shrink-0 w-full shadow-lg z-10 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Area */}
                    {settings.interaction.search ? (
                        <div className="flex items-center bg-white/20 rounded-full px-[1vw] py-[0.5vw] w-[15vw] group focus-within:bg-white/30 transition-all">
                            <Icon icon="lucide:search" className="text-white/60 w-[1vw] h-[1vw]" />
                            <input 
                                type="text" 
                                placeholder="Quick Search.." 
                                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 text-[0.75vw] ml-[0.5vw] w-full"
                            />
                        </div>
                    ) : <div className="w-[15vw]" />}

                    {/* Centered Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <span className="text-white text-[1.25vw] font-medium drop-shadow-sm">{bookName}</span>
                    </div>

                    {/* Logo Area */}
                    {settings.brandingProfile.logo && logoSettings?.src && (
                        <div className="flex items-center gap-[1vw]">
                            {(() => {
                                const adj = logoSettings.adjustments || {};
                                const exposure = adj.exposure || 0;
                                const contrast = adj.contrast || 0;
                                const saturation = adj.saturation || 0;
                                const temperature = adj.temperature || 0;
                                const tint = adj.tint || 0;
                                const highlights = (adj.highlights || 0) / 5;
                                const shadows = (adj.shadows || 0) / 5;
                                const filterStr = `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
                                const logoStyle = { 
                                    objectFit: logoObjectFit, 
                                    filter: filterStr,
                                    opacity: (logoSettings.opacity ?? 100) / 100
                                };

                                return logoSettings.url ? (
                                    <a 
                                        href={logoSettings.url.startsWith('http') ? logoSettings.url : `https://${logoSettings.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block hover:scale-105 transition-transform"
                                    >
                                        <img 
                                            src={logoSettings.src} 
                                            alt="Brand Logo" 
                                            className="h-[2vw] w-auto transition-all duration-300" 
                                            style={logoStyle}
                                        />
                                    </a>
                                ) : (
                                    <img 
                                        src={logoSettings.src}  
                                        alt="Brand Logo" 
                                        className="h-[2vw] w-auto transition-all duration-300" 
                                        style={logoStyle}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Canvas Area - Added min-h-0 to allow shrinking in flex layout */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative p-[2vw] z-[1]">
                {/* Vertical Centered Navigation Arrows */}
                {settings.navigation.nextPrevButtons && (
                    <>
                        <button 
                            className="absolute left-[2.5vw] top-1/2 -translate-y-1/2 w-[2.5vw] h-[2.5vw] bg-[#3E4491]/80 backdrop-blur-md rounded-[0.25vw] text-white flex items-center justify-center hover:bg-[#3E4491] transition-all shadow-lg group z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                bookRef.current?.pageFlip()?.flipPrev();
                            }}
                        >
                            <Icon icon="fluent:chevron-left-24-filled" className="w-[1.25vw] h-[1.25vw] group-active:scale-90 transition-transform" />
                        </button>

                        <button 
                            className="absolute right-[2.5vw] top-1/2 -translate-y-1/2 w-[2.5vw] h-[2.5vw] bg-[#3E4491]/80 backdrop-blur-md rounded-[0.25vw] text-white flex items-center justify-center hover:bg-[#3E4491] transition-all shadow-lg group z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                bookRef.current?.pageFlip()?.flipNext();
                            }}
                        >
                            <Icon icon="fluent:chevron-right-24-filled" className="w-[1.25vw] h-[1.25vw] group-active:scale-90 transition-transform" />
                        </button>
                    </>
                )}

                {/* Bottom Corner Navigation Buttons */}
                {settings.navigation.startEndNav && (
                    <>
                        <button 
                            className="absolute left-[9.5vw] bottom-[3vw] w-[2.5vw] h-[2.5vw] bg-[#3E4491]/80 backdrop-blur-md rounded-[0.25vw] text-white flex items-center justify-center hover:bg-[#3E4491] transition-all shadow-lg group z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                bookRef.current?.pageFlip()?.turnToPage(0);
                            }}
                        >
                            <Icon icon="fluent:previous-24-filled" className="w-[1vw] h-[1vw] group-active:scale-90 transition-transform" />
                        </button>

                        <button 
                            className="absolute right-[9.5vw] bottom-[3vw] w-[2.5vw] h-[2.5vw] bg-[#3E4491]/80 backdrop-blur-md rounded-[0.25vw] text-white flex items-center justify-center hover:bg-[#3E4491] transition-all shadow-lg group z-20"
                            onClick={(e) => {
                                e.stopPropagation();
                                bookRef.current?.pageFlip()?.turnToPage(pages.length - 1);
                            }}
                        >
                            <Icon icon="fluent:next-24-filled" className="w-[1vw] h-[1vw] group-active:scale-90 transition-transform" />
                        </button>
                    </>
                )}

                {/* Page Counter Badge */}
                {settings.navigation.pageQuickAccess && (
                    <div className="absolute left-[1vw] bottom-[1.25vw] bg-white rounded-[0.9vw] px-[1vw] py-[0.55vw] shadow-md border border-gray-100 z-20">
                        <span className="text-[0.95vw] font-semibold text-indigo-500">Page {targetPage + 1} / {pages.length}</span>
                    </div>
                )}

                {/* Right Floating Actions */}
                <div className="absolute right-[2.5vw] top-[4vw] flex flex-col gap-[0.75vw] z-20 items-end">
                    <div className="w-[8.5vw] bg-white rounded-[0.75vw] p-[0.75vw] shadow-xl border border-gray-100 flex items-center gap-[0.75vw] cursor-pointer hover:bg-gray-50 transition-colors">
                        <Icon icon="fluent:cursor-click-24-regular" className="w-[1.25vw] h-[1.25vw] text-gray-700" />
                        <span className="text-[0.6vw] font-bold text-gray-600 leading-tight">Click to View<br/>Interaction</span>
                    </div>
                    {settings.interaction.notes && (
                        <div className="w-[8.5vw] bg-white rounded-[0.75vw] p-[0.75vw] shadow-xl border border-gray-100 flex items-center gap-[0.75vw] cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="w-[1.25vw] h-[1.25vw] bg-[#C13030] rounded-[0.125vw] shadow-sm flex items-center justify-center -rotate-6">
                                <span className="text-[0.25vw] text-white font-bold leading-none">Note</span>
                            </div>
                            <span className="text-[0.6vw] font-bold text-gray-600 leading-tight">Click To View<br/>Notes</span>
                        </div>
                    )}
                </div>

                {/* Flipbook Container Wrapper */}
                <div 
                    className="relative flex items-center justify-center flipbook-magazine-wrapper"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                        transform: `translateX(${offset}px) scale(${currentZoom})`, 
                        transformOrigin: 'center center',
                        transition: 'transform 0.7s ease-out'
                    }}
                >


                    {pages && pages.length > 0 ? (
                        <div className="relative">
                            {/* Dynamic Shadow Layer */}
                            {shadowActive && (
                                <div 
                                    className="absolute transition-all duration-700 pointer-events-none"
                                    style={{
                                        width: BookAppearanceHelpers.getShadowWidth(currentPage, pages.length, WIDTH),
                                        height: HEIGHT,
                                        left: BookAppearanceHelpers.getShadowOffset(currentPage, pages.length) === '75%' ? '50%' : 
                                              BookAppearanceHelpers.getShadowOffset(currentPage, pages.length) === '25%' ? '0%' : '0%',
                                        transform: 'translateX(0)',
                                        boxShadow: shadowStyle,
                                        zIndex: 0,
                                        borderRadius: cornerRadius
                                    }}
                                />
                            )}
                            
                            <HTMLFlipBook
                                key={`flipbook-${augmentedPages.length}-${flipTime}-${useHardCover}`}
                                width={WIDTH}
                                height={HEIGHT}
                                size="fixed"
                                minWidth={400}
                                maxWidth={1200}
                                minHeight={400}
                                maxHeight={1500}
                                usePortrait={false}
                                mobileScrollSupport={true}
                                startPage={targetPage + 1}
                                className="flip-book"
                                ref={bookRef}
                                style={{ margin: '0 auto', position: 'relative', zIndex: 1 }}
                                drawShadow={true}
                                flippingTime={flipTime}
                                onFlip={onFlip}
                            >
                            {augmentedPages.map((page, index) => {
                                const isFirstSpread = index === 0 || index === 1;
                                const isLastSpread = index === augmentedPages.length - 1 || index === augmentedPages.length - 2;
                                const isHard = (isFirstSpread || isLastSpread) && useHardCover;
                                const density = isHard ? 'hard' : 'soft';

                                if (page.isPad) {
                                    return (
                                        <FlipPage 
                                            key={`pad-${index}`} 
                                            isPad={true} 
                                            density={density}
                                            data-density={density} 
                                            style={{ backgroundColor: 'transparent', opacity: 0, pointerEvents: 'none', boxShadow: 'none' }} 
                                        />
                                    );
                                }
                                return (
                                    <FlipPage 
                                        key={page.id || index} 
                                        number={index} // Adjusted number
                                        style={{ 
                                            borderRadius: cornerRadius, 
                                            opacity: pageOpacity,
                                            backgroundColor: 'white'
                                        }}
                                        textureStyle={textureStyle}
                                        density={density}
                                        data-density={density}
                                    >
                                        <PageItem html={page.html || page.content} index={index - 1} />
                                    </FlipPage>
                                );
                            })}
                            </HTMLFlipBook>
                        </div>
                    ) : (
                         <div className="flex items-center justify-center w-[25vw] h-[35.375vw] bg-white rounded-[0.25vw] shadow-lg">
                            <span className="text-gray-400 font-medium text-[1vw]">No pages content</span>
                        </div>
                    )}

                    {/* Dropdowns relative to the Book Bottom Right */}
                    <div className="absolute bottom-0 right-0 translate-y-[1vw] flex items-end gap-[1vw] z-40">
                        {showBookmarkMenu && (
                            <div 
                                className="flex flex-col bg-[#3E4491]/95 backdrop-blur-xl rounded-[1.25vw] p-[0.5vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.3)] border border-white/10 min-w-[12vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className="flex items-center gap-[1vw] px-[1vw] py-[0.75vw] bg-[#5C64C0] rounded-[1vw] text-white shadow-lg transition-all">
                                    <Icon icon="fluent:bookmark-add-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                                    <span className="text-[0.85vw] font-semibold text-white">Add Bookmark</span>
                                </button>
                                <button className="flex items-center gap-[1vw] px-[1vw] py-[0.75vw] text-white/90 hover:text-white transition-colors group">
                                    <Icon icon="fluent:eye-show-24-regular" className="w-[1.25vw] h-[1.25vw] group-hover:scale-110 transition-transform" />
                                    <span className="text-[0.85vw] font-medium">View Bookmark</span>
                                </button>
                            </div>
                        )}

                        {showMoreMenu && (
                            <div 
                                className="flex flex-col bg-[#3E4491]/95 backdrop-blur-xl rounded-[1.25vw] p-[0.5vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.3)] border border-white/10 min-w-[10vw] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {settings.interaction.gallery && (
                                    <button className="flex items-center gap-[1vw] px-[1vw] py-[0.75vw] bg-[#5C64C0] rounded-[1vw] text-white shadow-lg transition-all">
                                        <Icon icon="fluent:image-multiple-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                                        <span className="text-[0.85vw] font-semibold text-white">Gallery</span>
                                    </button>
                                )}
                                {settings.brandingProfile.profile && (
                                    <button className="flex items-center gap-[1vw] px-[1vw] py-[0.75vw] text-white/90 hover:text-white transition-colors group">
                                        <Icon icon="fluent:person-24-regular" className="w-[1.25vw] h-[1.25vw] group-hover:scale-110 transition-transform" />
                                        <span className="text-[0.85vw] font-medium">Profile</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Toolbar - Revamped (Screenshot style) */}
            <div className="h-[3.5vw] bg-[#3E4491]/90 backdrop-blur-md flex items-center justify-between px-[2vw] w-full z-10 shadow-[0_-0.5vw_2vw_rgba(0,0,0,0.15)]">
                {/* Left Controls */}
                <div className="flex items-center gap-[1.5vw]">
                    {settings.navigation.tableOfContents && (
                        <button className="text-white/80 hover:text-white transition-colors">
                            <Icon icon="fluent:list-24-regular" className="w-[1.25vw] h-[1.25vw]" />
                        </button>
                    )}
                    {settings.navigation.pageThumbnails && (
                        <button className="text-white/80 hover:text-white transition-colors">
                            <Icon icon="fluent:grid-24-regular" className="w-[1.25vw] h-[1.25vw]" />
                        </button>
                    )}
                </div>

                {/* Center - Playback & Progress */}
                <div className="flex-1 max-w-[40vw] flex items-center gap-[1.5vw] px-[3vw]">
                    {settings.media.autoFlip && (
                        <button 
                            className={`transition-colors ${isAutoFlipping ? 'text-indigo-400' : 'text-white/80 hover:text-white'}`}
                            onClick={() => setIsAutoFlipping(!isAutoFlipping)}
                        >
                            <Icon icon={isAutoFlipping ? "fluent:pause-24-filled" : "fluent:play-24-filled"} className="w-[1.5vw] h-[1.5vw]" />
                        </button>
                    )}
                    <div className="flex-1 h-[0.1875vw] bg-white/20 rounded-full relative group cursor-pointer"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const percent = x / rect.width;
                            const pageIndex = Math.floor(percent * pages.length);
                            bookRef.current?.pageFlip()?.turnToPage(pageIndex);
                        }}
                    >
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 left-0 h-full bg-white rounded-full transition-all duration-300" 
                            style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                        />
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[0.75vw] h-[0.75vw] bg-white rounded-full shadow-lg border-[0.125vw] border-[#3E4491] scale-0 group-hover:scale-100 transition-all duration-300" 
                            style={{ left: `${((currentPage + 1) / pages.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Right - Tools & Zoom */}
                <div className="flex items-center gap-[2vw]">
                    <div className="flex items-center gap-[1.25vw] border-r border-white/10 pr-[1.5vw]">
                        {settings.navigation.bookmark && (
                            <>
                                <button 
                                    className="text-white/60 hover:text-white transition-all transform hover:scale-110"
                                    onClick={(e) => { e.stopPropagation(); setShowBookmarkMenu(!showBookmarkMenu); setShowMoreMenu(false); }}
                                >
                                    <Icon icon="fluent:book-add-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                                </button>
                                <button 
                                    className="text-white/60 hover:text-white transition-all transform hover:scale-110"
                                    onClick={(e) => { e.stopPropagation(); setShowBookmarkMenu(!showBookmarkMenu); setShowMoreMenu(false); }}
                                >
                                    <Icon icon="fluent:bookmark-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                                </button>
                            </>
                        )}
                        {settings.media.backgroundAudio && (
                            <button className="text-white/60 hover:text-white transition-all transform hover:scale-110">
                                <Icon icon="fluent:music-note-1-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                            </button>
                        )}
                        {(settings.interaction.gallery || settings.brandingProfile.profile) && (
                            <button 
                                className="text-white/60 hover:text-white transition-all transform hover:scale-110"
                                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); setShowBookmarkMenu(false); }}
                            >
                                <Icon icon="fluent:more-horizontal-24-filled" className="w-[1.25vw] h-[1.25vw]" />
                            </button>
                        )}
                    </div>

                    {settings.viewing.zoom && (
                        <div className="flex items-center gap-[0.75vw]">
                            <button onClick={handleZoomOut} className="text-white/60 hover:text-white transition-colors">
                                <Icon icon="fluent:zoom-out-24-regular" className="w-[1.125vw] h-[1.125vw]" />
                            </button>
                            <div className="w-[5vw] h-[0.125vw] bg-white/20 rounded-full relative">
                                <div 
                                    className="absolute top-1 -translate-y-1/2 w-[0.5vw] h-[0.5vw] bg-white rounded-full transition-all" 
                                    style={{ left: `${((currentZoom - 0.5) / 1.5) * 100}%`, transform: 'translate(-50%, -50%)' }}
                                />
                            </div>
                            <button onClick={handleZoomIn} className="text-white/60 hover:text-white transition-colors">
                                <Icon icon="fluent:zoom-in-24-regular" className="w-[1.125vw] h-[1.125vw]" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-[1vw] ml-[1vw]">
                        {settings.shareExport.share && (
                            <button onClick={handleShare} className="text-white/80 hover:text-white transition-colors">
                                <Icon icon="fluent:share-24-regular" className="w-[1.125vw] h-[1.125vw]" />
                            </button>
                        )}
                        {settings.shareExport.download && (
                            <button onClick={handleDownload} className="text-white/80 hover:text-white transition-colors">
                                <Icon icon="fluent:arrow-download-24-regular" className="w-[1.125vw] h-[1.125vw]" />
                            </button>
                        )}
                        {settings.viewing.fullScreen && (
                            <button onClick={handleFullScreen} className="text-white/80 hover:text-white transition-bit transition-colors">
                                <Icon icon="fluent:full-screen-maximize-24-regular" className="w-[1.125vw] h-[1.125vw]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PreviewArea;
