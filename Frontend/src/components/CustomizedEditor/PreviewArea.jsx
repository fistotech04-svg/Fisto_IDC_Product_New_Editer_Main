import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundComponents from './Backgrounds'; // Import the background components
import animationComponents from './Animations';
import * as BookAppearanceHelpers from './bookAppearanceHelpers';
import AddBookmarkPopup from './AddBookmarkPopup';
import AddNotesPopup from './AddNotesPopup';
import NotesViewerPopup from './NotesViewerPopup';
import ViewBookmarkPopup from './ViewBookmarkPopup';
import TableOfContentsPopup from './TableOfContentsPopup';
import MobileFrame from './MobileFrame';
import FlipbookSharePopup from './FlipbookSharePopup';
import ProfilePopup from './ProfilePopup';
import Sound from './Sound';
import Export from './Export';
import Grid2Layout from './Layouts/Grid2Layout';
import Grid3Layout from './Layouts/Grid3Layout';
import Grid4Layout from './Layouts/Grid4Layout';
import Grid5Layout from './Layouts/Grid5Layout';
import Grid1Layout from './Layouts/Grid1Layout';
import Grid6Layout from './Layouts/Grid6Layout';
import Grid7Layout from './Layouts/Grid7Layout';
import Grid8Layout from './Layouts/Grid8Layout';
import Grid9Layout from './Layouts/Grid9Layout';
import GalleryPopup from './GalleryPopup';
import { getBookmarkClipPath, getBookmarkBorderRadius } from './BookmarkStylesPopup';
import FlipBookEngine from './FlipBookEngine';
import LeadFormPopup from './LeadFormPopup';


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
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; width: 100%; height: 100%; }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                </style>
                <base href="/">
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

const BookmarkTab = ({ label, color, side, index, spacing = 5.5, onClick, styleIdx = 1, font = 'Poppins' }) => {
    const topOffset = 10 + (index * spacing);
    const displayLabel = label.length > 12 ? label.substring(0, 11) + '...' : label;

    // Flip the clip-path if it's on the left side
    let clipPath = getBookmarkClipPath(styleIdx);
    if (side === 'left' && clipPath !== 'none') {
        clipPath = clipPath.replace(/([0-9.]+)%/g, (match, p1) => {
            return (100 - parseFloat(p1)) + '%';
        });
    }

    // Flip the border-radius if it's on the left side
    let borderRadius = getBookmarkBorderRadius(styleIdx);
    if (side === 'left' && borderRadius !== '0') {
        const parts = borderRadius.split(' ');
        if (parts.length === 4) {
            borderRadius = `${parts[1]} ${parts[0]} ${parts[3]} ${parts[2]}`;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'right' ? '80%' : '-80%' }}
            animate={{ opacity: 1, x: side === 'right' ? '100%' : '-100%' }}
            whileHover={{
                scale: 1.05,
                x: side === 'right' ? '110%' : '-110%',
                filter: 'brightness(1.1)',
                zIndex: 1000,
                transition: { type: 'spring', stiffness: 400, damping: 20 }
            }}
            className={`absolute ${side === 'right' ? 'right-0' : 'left-0'} flex items-center justify-center p-[0.3vw] cursor-pointer pointer-events-auto origin-center`}
            style={{
                top: `${topOffset}%`,
                width: '3.5vw',
                height: '3.8vw',
                background: color === 'multi-color' ? 'linear-gradient(135deg, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF)' : (color || '#D15D6D'),
                clipPath: clipPath,
                borderRadius: borderRadius,
                boxShadow: side === 'right' ? '0.3vw 0 1vw rgba(0,0,0,0.15)' : '-0.3vw 0 1vw rgba(0,0,0,0.15)',
                transition: 'background 0.3s ease, box-shadow 0.3s ease, clip-path 0.3s ease, border-radius 0.3s ease',
                zIndex: 50 + index,
                fontFamily: font
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onClick) onClick(e);
            }}
        >
            <span
                className="text-white text-[0.6vw] font-bold select-none text-center leading-tight drop-shadow-sm"
                style={{
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    maxWidth: '100%'
                }}
            >
                {displayLabel}
            </span>
        </motion.div>
    );
};

const TurnJsBookRenderer = React.memo(({
    augmentedPages,
    WIDTH,
    HEIGHT,
    flipTime,
    flipStyle, // Added flipStyle prop
    useHardCover,
    makeFirstLastPageHard,
    selectCustomHardPages,
    customHardPages,
    targetPage,
    bookRef,
    onFlip,
    cornerRadius,
    pageOpacity,
    textureStyle,
    shadowActive,
    shadowStyle,
    currentPage,
    pagesCount,
    bookmarks,
    bookmarkSpacing = 5.5,
    onPageClick,
    settings,
    setShowViewBookmarkPopup,
    buildPageDoc, // Accept custom builder
    activeLayout
}) => {
    const turnOnFlip = useCallback((evt) => {
        const logicalIndex = typeof evt === 'object' && evt !== null ? evt.data : evt;
        if (onFlip) onFlip({ data: logicalIndex });
    }, [onFlip]);

    return (
        <div className="relative" style={{ width: WIDTH * 2, height: HEIGHT }}>
            {shadowActive && (
                <div
                    className="absolute transition-all duration-700 pointer-events-none"
                    style={{
                        width: BookAppearanceHelpers.getShadowWidth(currentPage, pagesCount, WIDTH),
                        height: HEIGHT,
                        left: BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '75%' ? '50%' :
                            BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '25%' ? '0%' : '0%',
                        transform: 'translateX(0)',
                        boxShadow: shadowStyle,
                        zIndex: 0,
                        borderRadius: BookAppearanceHelpers.getShadowWidth(currentPage, pagesCount, WIDTH) === WIDTH
                            ? (BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '75%'
                                ? `0 ${cornerRadius} ${cornerRadius} 0`
                                : `${cornerRadius} 0 0 ${cornerRadius}`)
                            : cornerRadius
                    }}
                />
            )}
            <FlipBookEngine
                ref={bookRef}
                pages={augmentedPages}
                width={WIDTH}
                height={HEIGHT}
                flipTime={flipTime}
                flipStyle={flipStyle} // Pass flipStyle to FlipBookEngine
                hardCovers={useHardCover}
                makeFirstLastPageHard={makeFirstLastPageHard}
                selectCustomHardPages={selectCustomHardPages}
                customHardPages={customHardPages}
                onFlip={turnOnFlip}
                startPage={targetPage}
                buildPageDoc={buildPageDoc}
                cornerRadius={cornerRadius}
                activeLayout={activeLayout}
                textureStyle={textureStyle}
            />

            <div
                className="absolute top-0 pointer-events-none"
                style={{ width: '100%', height: '100%', left: '0%', zIndex: 0 }}
            >
                {(() => {
                    if (!bookmarks) return null;
                    let leftCount = 0;
                    let rightCount = 0;
                    return bookmarks.map((bm) => {
                        const side = currentPage === 0 ? 'right' : (bm.pageIndex % 2 === 0 ? 'right' : 'left');
                        if (currentPage === 0 && side === 'left') return null;
                        if (currentPage === pagesCount - 1 && (pagesCount - 1) % 2 !== 0 && side === 'right') return null;
                        const sideIndex = side === 'left' ? leftCount++ : rightCount++;
                        return (
                            <BookmarkTab
                                key={bm.id}
                                label={bm.label}
                                color={bm.color}
                                side={side}
                                index={sideIndex}
                                spacing={bookmarkSpacing}
                                styleIdx={settings?.navigation?.bookmarkSettings?.style || 1}
                                font={settings?.navigation?.bookmarkSettings?.font || 'Poppins'}
                                onClick={() => {
                                    onPageClick && onPageClick(bm.pageIndex);
                                    setShowViewBookmarkPopup(true);
                                }}
                            />
                        );
                    });
                })()}
            </div>
        </div>
    );
});

const PreviewArea = React.memo(({
    pages = [],
    bookName,
    targetPage = 0,
    backgroundSettings,
    bookAppearanceSettings,
    logoSettings,
    leadFormSettings,
    profileSettings,
    zoom = 1.0,
    menuBarSettings,
    otherSetupSettings,
    onUpdateOtherSetup,
    hideHeader = false,
    activeLayout,
    layoutColors,
    onClose,
    isSidebarOpen,
    activeDevice: activeDeviceProp = 'Desktop',
    activeSubView,
    useNativeFullscreen = false
}) => {
    const hexToRgb = (hex) => {
        if (!hex) return '0, 0, 0';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    const layoutColorVars = React.useMemo(() => {
        if (!layoutColors || !activeLayout || !layoutColors[activeLayout]) return '';
        return layoutColors[activeLayout]
            .map(c => `
                --${c.id}: ${c.hex};
                --${c.id}-rgb: ${hexToRgb(c.hex)};
                --${c.id}-opacity: ${c.opacity / 100};
            `)
            .join(' ');
    }, [layoutColors, activeLayout]);

    const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

    const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
        `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

    const settings = React.useMemo(() => ({
        ...(menuBarSettings || {
            navigation: { nextPrevButtons: true, mouseWheel: true, dragToTurn: true, pageQuickAccess: true, tableOfContents: true, pageThumbnails: true, bookmark: true, startEndNav: true },
            viewing: { zoom: true, fullScreen: true },
            interaction: { search: true, notes: true, gallery: true },
            media: { autoFlip: true, backgroundAudio: true },
            shareExport: { share: true, download: true, contact: true },
            brandingProfile: { logo: true, profile: true }
        }),
        ...otherSetupSettings
    }), [menuBarSettings, otherSetupSettings]);

    const bookRef = useRef();
    const containerRef = useRef();
    const screenRef = useRef();
    const isFlippingRef = useRef(false);
    const lastTapRef = useRef(0);
    const lastSyncPage = useRef(targetPage);
    const lastPreviewOpen = useRef(otherSetupSettings?.gallery?.previewOpen);

    const activeDevice = activeDeviceProp; // Desktop, Tablet, Mobile
    const isTablet = activeDevice === 'Tablet';
    const isMobile = activeDevice === 'Mobile';


    // Responsive scaling logic
    const [manualZoom, setManualZoom] = useState(zoom);
    const [fitScale, setFitScale] = useState(1);
    // Declare isFullscreen here (before the computeFitScale effect that depends on it)
    const [isFullscreen, setIsFullscreen] = useState(false);
    const currentZoom = useMemo(() => manualZoom * (activeDevice === 'Desktop' ? 1 : fitScale), [manualZoom, fitScale, activeDevice]);

    useEffect(() => {
        setManualZoom(zoom);
    }, [zoom]);

    useEffect(() => {
        if (!screenRef.current || activeDevice === 'Desktop') {
            setFitScale(1);
            return;
        }

        const computeFitScale = () => {
            const screen = screenRef.current;
            if (!screen) return;

            const { clientWidth, clientHeight } = screen;
            const isCurrentlyFullscreen = !!document.fullscreenElement;

            const wFactor = isCurrentlyFullscreen ? 1.0 : 0.98;
            const hFactor = isCurrentlyFullscreen ? 0.90 : 0.82;

            const availableW = clientWidth * wFactor;
            const availableH = clientHeight * hFactor;

            // Target size for a spread is 800x566
            const scaleX = availableW / 800;
            const scaleY = availableH / 566;

            let scale = Math.min(scaleX, scaleY);

            // All layout components internally multiply currentZoom by 1.3 when fullscreen is active.
            // We pre-divide by 1.3 to compensate and maintain a perfect fit. 
            if (isCurrentlyFullscreen) {
                scale = scale / 1.3;
            }

            setFitScale(scale);
        };

        const observer = new ResizeObserver(computeFitScale);
        observer.observe(screenRef.current);

        // Re-run immediately on fullscreen change (before the ResizeObserver fires)
        const onFSChange = () => {
            // Use rAF to let the browser finish reflow after fullscreen transition
            requestAnimationFrame(computeFitScale);
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);

        computeFitScale();

        return () => {
            observer.disconnect();
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [activeDevice, isSidebarOpen, isFullscreen]);

    const setCurrentZoom = useCallback((val) => {
        if (typeof val === 'function') {
            setManualZoom(prev => val(prev));
        } else {
            setManualZoom(val);
        }
    }, []);
    const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isAutoFlipping, setIsAutoFlipping] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // Page dimensions (A4 ratio)
    const WIDTH = 400;
    const HEIGHT = 566;

    const [currentPage, setCurrentPage] = useState(targetPage);
    const [offset, setOffset] = useState(() => {
        // Compute the correct initial offset so first page is centered from the very first render
        if (targetPage === 0) return -(400 / 2); // WIDTH = 400, half-page shift left for cover
        if (targetPage === (pages?.length ?? 0) - 1) {
            return (targetPage % 2 === 0) ? -(400 / 2) : (400 / 2);
        }
        return 0;
    });
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormSubmitted, setLeadFormSubmitted] = useState(false);
    const [showThumbnailBar, setShowThumbnailBar] = useState(false);
    const [showAddBookmarkPopup, setShowAddBookmarkPopup] = useState(false);
    const [showAddNotesPopup, setShowAddNotesPopup] = useState(false);
    const [showNotesViewer, setShowNotesViewer] = useState(false);
    const [showViewBookmarkPopup, setShowViewBookmarkPopup] = useState(false);
    const [showGalleryPopup, setShowGalleryPopup] = useState(false);
    const [showSoundPopup, setShowSoundPopup] = useState(false);

    // Audio Logic (Centralized in Sound.jsx)
    // Audio state (for UI/Layout sync)
    const [isMuted, setIsMuted] = useState(false);
    const [isFlipMuted, setIsFlipMuted] = useState(false);
    const [flipTrigger, setFlipTrigger] = useState(0);


    useEffect(() => {
        setShowAddNotesPopup(false);
        setShowNotesViewer(false);
        setShowAddBookmarkPopup(false);
        setShowViewBookmarkPopup(false);
        setShowGalleryPopup(false);
        setShowProfilePopup(false);
        setShowSoundPopup(false);
        setShowTOC(false);
        setShowThumbnailBar(false);
    }, [activeLayout]);



    // Augmented pages for turn.js centering logic
    const augmentedPages = useMemo(() => {
        if (!pages || pages.length === 0) return [];
        let result = [...pages];

        // Ensure even number of pages for turn.js double display mode
        if (result.length % 2 !== 0) {
            result.push({ isPad: true });
        }
        return result;
    }, [pages]);

    useEffect(() => {
        if (otherSetupSettings?.gallery?.previewOpen && otherSetupSettings.gallery.previewOpen !== lastPreviewOpen.current) {
            setShowGalleryPopup(true);
            lastPreviewOpen.current = otherSetupSettings.gallery.previewOpen;
        }
    }, [otherSetupSettings?.gallery?.previewOpen]);

    // Sync current page with targetPage prop (from TemplateEditor's activePageIndex)
    useEffect(() => {
        if (targetPage !== undefined && targetPage !== currentPage) {
            setCurrentPage(targetPage);
            // Ensure the flipbook engine also jumps to the new page
            if (bookRef.current) {
                // Determine if we need to call turnToPage or similar
                const flip = bookRef.current?.pageFlip();
                if (flip) {
                    // Use a small delay to ensure the turn engine is fully initialized
                    setTimeout(() => {
                        try { flip.turnToPage(targetPage); } catch (e) { console.warn('Flip failed', e); }
                    }, 50);
                }
            }
        }
    }, [targetPage]);

    const handleToggleAudio = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);
    const [notes, setNotes] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [showTOC, setShowTOC] = useState(false);
    const [showExportPopup, setShowExportPopup] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');




    const deviceStyles = {
        Desktop: { width: '100%', height: '100%', borderRadius: '0', border: 'none', background: 'transparent' },
        Tablet: { 
            width: 'auto', 
            height: '100%', 
            maxWidth: '100%', 
            maxHeight: '100%', 
            aspectRatio: '1091/869', 
            borderRadius: '0', 
            margin: 'auto', 
            position: 'relative', 
            backgroundImage: 'url("/src/assets/cover/Tab 1.svg")', 
            backgroundSize: '95% 95%', 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'center', 
            backgroundColor: 'transparent',
            transformOrigin: 'center center',
            flexShrink: 0
        },
        Mobile: { width: 'auto', height: '100%', maxWidth: 'min(100%, 446px)', maxHeight: '100%', aspectRatio: '446/883', borderRadius: '0', margin: 'auto', position: 'relative', backgroundImage: 'url("/src/assets/cover/mobiile 1.svg")', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: 'transparent', flexShrink: 0 },
    };

    const getScreenWrapperStyle = () => {
        if (activeDevice === 'Desktop') return { width: '100%', height: '100%', position: 'relative' };
        if (activeDevice === 'Tablet') return {
            position: 'absolute',
            top: '9.38%',
            bottom: '7.7%',
            left: '5.3%',
            right: '6.6%',
            borderRadius: '12px',
            overflow: 'hidden'
        };
        if (activeDevice === 'Mobile') return {
            position: 'absolute',
            top: '2.9%',
            bottom: '5.14%',
            left: '5.1%',
            right: '9.1%',
            borderRadius: '25px',
            overflow: 'hidden'
        };
    };



    const layout1Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 1), [bookmarks]);
    const layout2Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 2), [bookmarks]);
    const layout3Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 3), [bookmarks]);
    const layout4Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 4), [bookmarks]);
    const layout5Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 5), [bookmarks]);
    const layout6Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 6), [bookmarks]);
    const layout7Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 7), [bookmarks]);
    const layout8Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 8), [bookmarks]);
    const layout9Bookmarks = useMemo(() => bookmarks.filter(b => b.layoutId === 9), [bookmarks]);

    const layout1Notes = useMemo(() => notes.filter(n => n.layoutId === 1), [notes]);
    const layout2Notes = useMemo(() => notes.filter(n => n.layoutId === 2), [notes]);
    const layout3Notes = useMemo(() => notes.filter(n => n.layoutId === 3), [notes]);
    const layout4Notes = useMemo(() => notes.filter(n => n.layoutId === 4), [notes]);
    const layout5Notes = useMemo(() => notes.filter(n => n.layoutId === 5), [notes]);
    const layout6Notes = useMemo(() => notes.filter(n => n.layoutId === 6), [notes]);
    const layout7Notes = useMemo(() => notes.filter(n => n.layoutId === 7), [notes]);
    const layout8Notes = useMemo(() => notes.filter(n => n.layoutId === 8), [notes]);
    const layout9Notes = useMemo(() => notes.filter(n => n.layoutId === 9), [notes]);

    const setIsPlaying = useCallback((val) => {
        setIsAutoFlipping(val);
        // Sync with settings
        if (onUpdateOtherSetup) {
            onUpdateOtherSetup(prev => ({
                ...prev,
                toolbar: {
                    ...(prev?.toolbar || {}),
                    autoFlipEnabled: val
                }
            }));
        }
    }, [onUpdateOtherSetup]);

    // Sync isAutoFlipping state with settings
    useEffect(() => {
        if (otherSetupSettings?.toolbar?.autoFlipEnabled !== undefined) {
            setIsAutoFlipping(!!otherSetupSettings.toolbar.autoFlipEnabled);
        }
    }, [otherSetupSettings?.toolbar?.autoFlipEnabled]);

    const setShowTOCMemo = useCallback((val) => {
        if (val) {
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowTOC(val);
    }, []);

    const setShowThumbnailBarMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowThumbnailBar(val);
    }, []);

    const setShowAddBookmarkPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
        }
        setShowAddBookmarkPopup(val);
    }, []);

    const setShowAddNotesPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowNotesViewer(false);
        }
        setShowAddNotesPopup(val);
    }, []);

    const setShowNotesViewerMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
        }
        setShowNotesViewer(val);
    }, []);

    const setShowBookmarkMenuMemo = useCallback((val) => setShowBookmarkMenu(val), []);
    const setShowMoreMenuMemo = useCallback((val) => setShowMoreMenu(val), []);


    const setShowGalleryPopupMemo = useCallback((val) => setShowGalleryPopup(val), []);
    const setShowSoundPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
            setShowMoreMenu(false);
        }
        setShowSoundPopup(val);
    }, []);

    const onAddNote = useCallback((note) => {
        setNotes(prev => [...prev, { ...note, layoutId: activeLayout }]);
    }, [activeLayout]);

    const onAddBookmark = useCallback((bookmark) => {
        setBookmarks(prev => [...prev, { ...bookmark, layoutId: activeLayout }]);
    }, [activeLayout]);

    const onDeleteBookmark = useCallback((id) => {
        setBookmarks(prev => prev.filter(b => b.id !== id));
    }, []);

    const onUpdateBookmark = useCallback((id, newLabel) => {
        setBookmarks(prev => prev.map(b => b.id === id ? { ...b, label: newLabel } : b));
    }, []);

    const onPageClick = useCallback((index) => {
        bookRef.current?.pageFlip()?.turnToPage(index);
    }, []);

    const handleZoomIn = useCallback(() => setManualZoom(prev => Math.min(prev + 0.1, 2)), []);
    const handleZoomOut = useCallback(() => setManualZoom(prev => Math.max(prev - 0.1, 0.5)), []);
    const handleFullScreen = useCallback(() => {
        if (useNativeFullscreen) {
            if (!containerRef.current) return;
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        } else {
            setIsFullscreen(prev => !prev);
        }
    }, [useNativeFullscreen]);

    useEffect(() => {
        if (!useNativeFullscreen) return;
        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [useNativeFullscreen]);

    const handleShare = useCallback(() => {
        setShowSharePopup(true);
    }, []);

    const handleDownload = useCallback(() => {
        setShowExportPopup(true);
    }, []);

    const handleQuickSearch = useCallback((query) => {
        if (!query.trim()) return;

        const lowerQuery = query.toLowerCase();
        const foundPageIndex = pages.findIndex(page => {
            const content = (page.html || page.content || '').toLowerCase();
            return content.includes(lowerQuery);
        });

        if (foundPageIndex !== -1) {
            onPageClick(foundPageIndex);
        }
    }, [pages, onPageClick]);

    const handleDoubleTap = useCallback((e) => {
        if (!settings.toolbar?.twoClickToZoom) return;

        // Skip if clicking on UI elements like buttons, inputs etc.
        if (e.target.closest('button, input, textarea, select, a, [role="button"]')) return;

        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD) {
            // Double tap detected
            const mz = settings.toolbar?.maximumZoom;
            const maxZoom = (mz && mz > 1.1) ? mz : 2;
            
            setManualZoom(prev => {
                // If current zoom is already at or near maximum, reset to 1
                return (prev >= maxZoom - 0.1) ? 1 : maxZoom;
            });
            lastTapRef.current = 0; // Reset to prevent triple-tap double triggers
        } else {
            lastTapRef.current = now;
        }
    }, [settings.toolbar, setManualZoom]);

    // Click outside to close menus
    useEffect(() => {
        const handleClickOutside = () => {
            setShowBookmarkMenu(false);
            setShowMoreMenu(false);
            setShowThumbnailBar(false);
            setShowTOC(false);
            setShowSoundPopup(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const logoObjectFit = logoSettings?.type === 'Crop' ? 'fill' : (logoSettings?.type === 'Fill' ? 'cover' : logoSettings?.type === 'Stretch' ? 'fill' : 'contain');

    // Compute crop styles for the logo image if cropData is present
    const logoCropStyle = React.useMemo(() => {
        const cd = logoSettings?.cropData;
        if (!cd || !cd.inset) return {};
        return {
            clipPath: cd.inset,
            WebkitClipPath: cd.inset,
            transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
            transformOrigin: 'center center'
        };
    }, [logoSettings?.cropData]);





    // Stop auto-flip when last page is reached (common for all layouts)
    useEffect(() => {
        if (isAutoFlipping && currentPage >= pages.length - 1) {
            setIsPlaying(false);
        }
    }, [currentPage, pages.length, isAutoFlipping, setIsPlaying]);

    // Handle Auto Flip logic with 3-2-1 countdown
    useEffect(() => {
        if (!isAutoFlipping || pages.length <= 1) {
            setCountdown(null);
            return;
        }

        const duration = settings.media?.autoFlipSettings?.duration || settings.toolbar?.autoFlipDuration || 5; // duration in seconds
        const showCountdown = settings.media?.autoFlipSettings?.countdown ?? settings.toolbar?.nextFlipCountdown ?? true;

        // The overall timer for the flip
        const timer = setTimeout(() => {
            if (currentPage < pages.length - 1) {
                bookRef.current?.pageFlip()?.flipNext();
            } else {
                setIsPlaying(false);
            }
        }, duration * 1000);

        let countdownInterval;
        let countdownTimer;

        if (showCountdown && duration >= 3) {
            // Start countdown 3 seconds before the flip
            const countdownStartMs = (duration - 3) * 1000;
            countdownTimer = setTimeout(() => {
                let count = 3;
                setCountdown(count);
                countdownInterval = setInterval(() => {
                    count -= 1;
                    if (count > 0) {
                        setCountdown(count);
                    } else {
                        setCountdown(null);
                        clearInterval(countdownInterval);
                    }
                }, 1000);
            }, countdownStartMs);
        }

        return () => {
            clearTimeout(timer);
            if (countdownTimer) clearTimeout(countdownTimer);
            if (countdownInterval) clearInterval(countdownInterval);
            setCountdown(null);
        };
    }, [isAutoFlipping, currentPage, pages.length, settings.toolbar?.autoFlipDuration, settings.toolbar?.nextFlipCountdown, setIsPlaying]);

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
        flipStyle, // Get flipStyle from processedAppearance
        hardCover: useHardCover,
        shadowActive
    } = processedAppearance;

    // Memoize background style to prevent re-render loops
    const backgroundStyle = React.useMemo(() => {
        // Helper to mix hex and opacity
        const hexToRgba = (hex, opacity = 100) => {
            if (!hex) return `rgba(218, 219, 232, ${opacity / 100})`;
            let c = hex.substring(1).split('');
            if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            if (c.length !== 6) return hex; // Give up on malformed hex
            const val = parseInt(c.join(''), 16);
            return `rgba(${(val >> 16) & 255}, ${(val >> 8) & 255}, ${val & 255}, ${opacity / 100})`;
        };

        const opacity = (backgroundSettings?.opacity ?? 100) / 100;

        if (backgroundSettings?.style === 'Gradient') {
            return { background: backgroundSettings.gradient, opacity };
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

            // Apply crop to background via clip-path and transform for consistency
            const bgCrop = backgroundSettings.cropData;
            const cropStyle = (bgCrop && bgCrop.inset) ? {
                clipPath: bgCrop.inset,
                WebkitClipPath: bgCrop.inset,
                transform: `translate(${bgCrop.offX}%, ${bgCrop.offY}%) scale(${bgCrop.scale})`,
                transformOrigin: 'center center'
            } : {};

            return {
                backgroundImage: `url(${backgroundSettings.image})`,
                backgroundSize: (bgCrop && bgCrop.inset) ? '100% 100%' : (fitMap[backgroundSettings.fit] || 'cover'),
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: filterStr,
                opacity,
                ...cropStyle
            };
        }
        return { backgroundColor: hexToRgba(backgroundSettings?.color || '#DADBE8', backgroundSettings?.opacity ?? 100) };
    }, [backgroundSettings]);

    const {
        makeFirstLastPageHard = false,
        selectCustomHardPages = false,
        customHardPages: rawCustomHardPages
    } = bookAppearanceSettings || {};

    const customHardPages = useMemo(() => rawCustomHardPages || [], [rawCustomHardPages]);

    const onFlip = useCallback((e) => {
        const logicalIndex = e.data;
        setCurrentPage(logicalIndex);

        // Compute offset for UI centering
        let newOffset = 0;
        if (logicalIndex === 0) {
            newOffset = -(WIDTH / 2);
        } else if (logicalIndex >= pages.length - 1) {
            newOffset = (logicalIndex % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2);
        } else {
            newOffset = 0;
        }
        setOffset(newOffset);

        // Signal a flip to the Sound component
        setFlipTrigger(prev => prev + 1);
    }, [pages.length, WIDTH]);

    const bookRendererProps = {
        augmentedPages,
        WIDTH,
        HEIGHT,
        flipTime,
        flipStyle, // Pass flipStyle to TurnJsBookRenderer
        useHardCover,
        makeFirstLastPageHard,
        selectCustomHardPages,
        customHardPages,
        targetPage,
        bookRef,
        onFlip,
        cornerRadius,
        pageOpacity,
        textureStyle,
        shadowActive,
        shadowStyle,
        currentPage,
        pagesCount: pages.length,
        onPageClick,
        settings,
        setShowViewBookmarkPopup,
        buildPageDoc: getIframeContent,
        activeLayout
    };


    useEffect(() => {
        // Reset submitted state when entering lead form tab to ensure it's visible for editing
        if (activeSubView === 'leadform' && !onClose) {
            setLeadFormSubmitted(false);
        }
    }, [activeSubView, onClose]);

    useEffect(() => {
        // 1. If lead form was submitted or closed, hide it
        if (leadFormSubmitted) {
            setShowLeadForm(false);
            return;
        }

        // 2. Force show lead form if we are explicitly editing it in the sidebar
        if (activeSubView === 'leadform' && !onClose) {
            setShowLeadForm(true);
            return;
        }

        // 3. If not editing, and lead form is disabled, hide it
        if (!leadFormSettings || !leadFormSettings.enabled) {
            setShowLeadForm(false);
            return;
        }

        // 4. In editor preview area (no onClose), if not editing leadform, don't show it automatically
        if (!onClose && activeSubView !== 'leadform') {
            setShowLeadForm(false);
            return;
        }

        // 5. Normal timing logic (e.g. for full preview)
        const timing = leadFormSettings.appearance.timing;
        const afterPages = leadFormSettings.appearance.afterPages || 1;

        if (timing === 'before' && currentPage >= 0) {
            setShowLeadForm(true);
        } else if (timing === 'after-pages' && currentPage >= afterPages) {
            setShowLeadForm(true);
        } else if (timing === 'end' && currentPage >= pages.length - 1) {
            setShowLeadForm(true);
        } else {
            setShowLeadForm(false);
        }
    }, [currentPage, leadFormSettings, leadFormSubmitted, pages.length, activeSubView, onClose]);



    // Consistently handle centering offset across all layouts and engines
    useEffect(() => {
        if (!pages || pages.length === 0) {
            setOffset(0);
            return;
        }

        // Logic: Shift left to center the front cover, shift right to center the back cover
        if (currentPage === 0) {
            setOffset(-(WIDTH / 2));
        } else if (currentPage >= pages.length - 1) {
            setOffset((currentPage % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2));
        } else {
            setOffset(0);
        }
    }, [currentPage, pages.length, WIDTH]);

    const layoutBackgroundSettings = React.useMemo(() => ({
        ...backgroundSettings,
        color: 'transparent',
        style: 'Solid'
    }), [backgroundSettings]);

    const layoutBackgroundStyle = React.useMemo(() => ({}), []);

    const renderSharedOverlays = () => (
        <>
            {/* Shared Overlays (Common for all layouts) */}
            {showBookmarkMenu && (
                <>
                    <div className="absolute inset-0 z-40 pointer-events-auto" onClick={() => setShowBookmarkMenu(false)} />
                    <div
                        className={`absolute ${isTablet ? 'bottom-[2.8vw] ' : 'bottom-[4.5vw]'} flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'),
                            backdropFilter: 'blur(10px)',
                            right: `calc(7.5vw + ${settings.viewing.zoom ? '9.5vw' : '0vw'} + ${settings.shareExport.share || settings.shareExport.download || settings.viewing.fullScreen ? '9.8vw' : '0vw'})`,
                            width: isTablet ? '10vw' : 'auto',
                            minWidth: isTablet ? '0' : '10vw',
                            borderRadius: isTablet ? '0.8vw' : '1vw'
                        }}
                    >
                        <button
                            className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => { setShowAddBookmarkPopupMemo(true); setShowBookmarkMenu(false); }}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <Icon
                                icon="fluent:bookmark-add-24-filled"
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                            />
                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Bookmark</span>
                        </button>
                        <div className="h-[1px] bg-white/10 w-full" />
                        <button
                            className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkMenu(false); }}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <Icon
                                icon="lucide:view"
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                            />
                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Bookmark</span>
                        </button>
                    </div>
                </>
            )}

            {showAddBookmarkPopup && (
                <AddBookmarkPopup
                    onClose={() => setShowAddBookmarkPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddBookmark={onAddBookmark}
                    isSidebarOpen={isSidebarOpen && activeLayout === 3}
                    isMobile={isMobile}
                    bookmarkSettings={settings.navigation?.bookmarkSettings?.[activeLayout] || settings.navigation?.bookmarkSettings}
                />
            )}

            {showAddNotesPopup && (
                <AddNotesPopup
                    onClose={() => setShowAddNotesPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddNote={onAddNote}
                    isSidebarOpen={isSidebarOpen && activeLayout === 3}
                    isMobile={isMobile}
                />
            )}

            {showNotesViewer && (
                <NotesViewerPopup
                    onClose={() => setShowNotesViewer(false)}
                    notes={notes.filter(n => n.layoutId === activeLayout)}
                    isSidebarOpen={isSidebarOpen}
                    isTablet={isTablet}
                    isMobile={isMobile}
                />
            )}

            {showViewBookmarkPopup && (
                <ViewBookmarkPopup
                    onClose={() => setShowViewBookmarkPopup(false)}
                    bookmarks={bookmarks.filter(b => b.layoutId === (activeLayout || 1))}
                    onDelete={onDeleteBookmark}
                    onUpdate={onUpdateBookmark}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowViewBookmarkPopup(false);
                    }}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                />
            )}

            {showProfilePopup && (
                <ProfilePopup
                    onClose={() => setShowProfilePopup(false)}
                    profileSettings={profileSettings}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                />
            )}

            <Sound
                isOpen={showSoundPopup}
                onClose={() => setShowSoundPopup(false)}
                activeLayout={activeLayout}
                otherSetupSettings={otherSetupSettings}
                onUpdateOtherSetup={onUpdateOtherSetup}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                isFlipMuted={isFlipMuted}
                setIsFlipMuted={setIsFlipMuted}
                flipTrigger={flipTrigger}
                settings={settings}
                isTablet={isTablet}
                isMobile={isMobile}
            />

            {showTOC && (
                <TableOfContentsPopup
                    onClose={() => setShowTOC(false)}
                    settings={settings.tocSettings}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowTOC(false);
                    }}
                />
            )}

            {showSharePopup && (
                <FlipbookSharePopup
                    onClose={() => setShowSharePopup(false)}
                    bookName={bookName}
                    url={window.location.href}
                    isTablet={isTablet}
                    isMobile={isMobile}
                />
            )}

            <Export
                isOpen={showExportPopup}
                onClose={() => setShowExportPopup(false)}
                hideButton={true}
                pages={pages}
                bookName={bookName}
                currentPage={currentPage}
                isTablet={isTablet}
                isMobile={isMobile}
            />

            {showGalleryPopup && (                <GalleryPopup
                    onClose={() => setShowGalleryPopupMemo(false)}
                    settings={otherSetupSettings?.gallery}
                    popupSettings={menuBarSettings?.appearance?.popup}
                    isTablet={isTablet}
                    activeLayout={activeLayout}
                />

            )}
            {/* Visual Countdown Overlay - Positioned after layouts to stay on top */}
            {countdown !== null && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none ">
                    <span 
                        className="font-semibold text-[#E5E7EB] animate-pulse select-none drop-shadow-[0_1.2vw_1.2vw_rgba(0,0,0,0.5)]"
                        style={{ fontSize: isTablet ? '10vw' : '15vw' }}
                    >
                        {countdown}
                    </span>
                </div>
            )}
        </>
    );

    return (
        <div
            ref={containerRef}
            id="preview-area-root"
            onPointerDown={handleDoubleTap}
            className={`flex-1 flex flex-col relative min-h-0 select-none overflow-hidden ${activeDevice !== 'Desktop' ? 'items-center justify-center p-[2vw]' : ''}`}
            style={{
                width: activeDevice !== 'Desktop' ? '100%' : 'auto',
                height: activeDevice !== 'Desktop' ? '100%' : 'auto',
                touchAction: settings.toolbar?.twoClickToZoom ? 'manipulation' : 'auto',
                ...(layoutColorVars ? Object.fromEntries(layoutColorVars.split(';').filter(v => v.trim()).map(v => {
                    const i = v.indexOf(':');
                    return [v.slice(0, i).trim(), v.slice(i + 1).trim()];
                })) : {})
            }}
        >

            {/* Tablet Outer Background Layer */}
            {activeDevice === 'Tablet' && (
                <div 
                    className="absolute inset-0 z-0 pointer-events-none" 
                    style={{ ...backgroundStyle, opacity: 0.4 }} 
                />
            )}
            {activeDevice === 'Tablet' && backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
                    {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                </div>
            )}

            {/* Mobile Outer Background Layer */}
            {activeDevice === 'Mobile' && (
                <div 
                    className="absolute inset-0 z-0 pointer-events-none" 
                    style={{ ...backgroundStyle, opacity: 0.4 }} 
                />
            )}
            {activeDevice === 'Mobile' && backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
                    {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                </div>
            )}

            <div style={{ ...deviceStyles[activeDevice], zIndex: 10 }} className="relative">
            {/* Floor shadow effect for Tablet/Mobile bottom (using the style of the SVG) */}
            {(activeDevice === 'Tablet' || activeDevice === 'Mobile') && (
                <svg
                    viewBox="0 0 1000 100"
                    preserveAspectRatio="none"
                    className={`absolute left-1/2 -translate-x-1/2 z-[-1] pointer-events-none opacity-60 ${activeDevice === 'Tablet' ? '-bottom-[6%] w-[94%] h-[7%]' : '-bottom-[4%] w-[90%] h-[5%]'}`}
                >
                    <defs>
                        <radialGradient id="tablet-floor-shadow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
                            <stop offset="40%" stopColor="rgba(0,0,0,0.4)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="500" cy="50" rx="490" ry="45" fill="url(#tablet-floor-shadow)" />
                </svg>
            )}
            <div ref={screenRef} style={getScreenWrapperStyle()} className="relative">

            {/* Background Layer - Supports Solid, Gradient, and Image layers with their respective properties */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={backgroundStyle} />

            {backgroundSettings?.style === 'Video' && backgroundSettings.image && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <video 
                        src={backgroundSettings.image} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            )}

            {backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                </div>
            )}

            {/* Animation Overlay Layer */}
            {backgroundSettings?.animation && backgroundSettings.animation !== 'None' && animationComponents[backgroundSettings.animation] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(animationComponents[backgroundSettings.animation], { backgroundSettings, backgroundStyle })}
                </div>
            )}

            {/* Synchronize layout transition with flip time - Scoped to this container */}
            <style>{`
                #preview-area-root .flipbook-magazine-wrapper {
                    transition: transform ${flipTime}ms ease-in-out !important;
                }
            `}</style>

            {Number(activeLayout) === 2 ? (
                <Grid2Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout2Bookmarks}
                    notes={layout2Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    onAddBookmark={onAddBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={isMobile}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout2Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid2Layout>
            ) : Number(activeLayout) === 3 ? (
                <Grid3Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout3Bookmarks}
                    notes={layout3Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    onAddBookmark={onAddBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout3Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid3Layout>
            ) : Number(activeLayout) === 4 ? (
                <Grid4Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout4Bookmarks}
                    notes={layout4Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    isSidebarOpen={isSidebarOpen}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout4Bookmarks}
                        bookmarkSpacing={11}
                    />
                </Grid4Layout>
            ) : Number(activeLayout) === 5 ? (
                <Grid5Layout
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout5Bookmarks}
                    notes={layout5Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout5Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid5Layout>
            ) : (Number(activeLayout) === 6) ? (
                <Grid6Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout6Bookmarks}
                    notes={layout6Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout6Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid6Layout>
            ) : (Number(activeLayout) === 7) ? (
                <Grid7Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout7Bookmarks}
                    notes={layout7Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout7Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid7Layout>
            ) : (Number(activeLayout) === 8) ? (
                <Grid8Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout8Bookmarks}
                    notes={layout8Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                    layoutColors={settings?.layoutColors?.[8] ? {
                        primary: settings.layoutColors[8].find(c => c.label === 'Icons color')?.hex || '#575C9C',
                        secondary: settings.layoutColors[8].find(c => c.label === 'Bottom bar BG color')?.hex || '#E3E4EF'
                    } : {
                        primary: '#575C9C',
                        secondary: '#E3E4EF'
                    }}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout8Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid8Layout>
            ) : (Number(activeLayout) === 9) ? (
                <Grid9Layout
                    settings={settings}
                    bookName={bookName}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    bookRef={bookRef}
                    pages={pages}
                    setIsPlaying={setIsPlaying}
                    isAutoFlipping={isAutoFlipping}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    handleFullScreen={handleFullScreen}
                    setShowProfilePopup={setShowProfilePopup}
                    logoSettings={logoSettings}
                    currentPage={currentPage}
                    pagesCount={pages.length}
                    currentZoom={currentZoom}
                    setCurrentZoom={setCurrentZoom}
                    onPageClick={onPageClick}
                    bookmarks={layout9Bookmarks}
                    notes={layout9Notes}
                    onAddNote={onAddNote}
                    onDeleteBookmark={onDeleteBookmark}
                    onUpdateBookmark={onUpdateBookmark}
                    profileSettings={profileSettings}
                    isSidebarOpen={isSidebarOpen}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    offset={offset}
                    isFullscreen={isFullscreen}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={activeDevice === 'Mobile'}
                    activeLayout={activeLayout}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                    layoutColors={settings?.layoutColors?.[9] ? {
                        primary: settings.layoutColors[9].find(c => c.label === 'Icons color')?.hex || '#575C9C',
                        secondary: settings.layoutColors[9].find(c => c.label === 'Bottom bar BG color')?.hex || '#E3E4EF'
                    } : {
                        primary: '#575C9C',
                        secondary: '#E3E4EF'
                    }}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout9Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid9Layout>
            ) : (
                <Grid1Layout
                    settings={settings}
                    bookName={bookName}
                    activeLayout={activeLayout}
                    hideHeader={hideHeader}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleQuickSearch={handleQuickSearch}
                    logoSettings={logoSettings}
                    logoObjectFit={logoObjectFit}
                    logoCropStyle={logoCropStyle}
                    onPageClick={onPageClick}
                    currentPage={currentPage}
                    pages={pages}
                    notes={layout1Notes}
                    bookRef={bookRef}
                    showBookmarkMenu={showBookmarkMenu}
                    setShowBookmarkMenuMemo={setShowBookmarkMenuMemo}
                    showMoreMenu={showMoreMenu}
                    setShowMoreMenuMemo={setShowMoreMenuMemo}
                    showThumbnailBar={showThumbnailBar}
                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                    showTOC={showTOC}
                    setShowTOCMemo={setShowTOCMemo}
                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                    setShowProfilePopup={setShowProfilePopup}
                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                    showSoundPopup={showSoundPopup}
                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                    isAutoFlipping={isAutoFlipping}
                    setIsPlaying={setIsPlaying}
                    currentZoom={currentZoom}
                    handleZoomIn={handleZoomIn}
                    handleZoomOut={handleZoomOut}
                    handleFullScreen={handleFullScreen}
                    handleShare={handleShare}
                    handleDownload={handleDownload}
                    offset={offset}
                    backgroundSettings={layoutBackgroundSettings}
                    backgroundStyle={layoutBackgroundStyle}
                    isMuted={isMuted}
                    onToggleAudio={handleToggleAudio}
                    isSidebarOpen={isSidebarOpen}
                    isFullscreen={isFullscreen}
                    isTablet={isTablet}
                    isMobile={isMobile}
                >
                    <TurnJsBookRenderer
                        {...bookRendererProps}
                        bookmarks={layout1Bookmarks}
                        bookmarkSpacing={5.5}
                    />
                </Grid1Layout>
            )}

            {renderSharedOverlays()}

            {/* Lead Form Overlay */}
            {showLeadForm && (
                <LeadFormPopup
                    leadFormSettings={leadFormSettings}
                    isTablet={isTablet}
                    onClose={() => setLeadFormSubmitted(true)}
                />
            )}
            </div>
            </div>
        </div>
    );
});

export default PreviewArea;

