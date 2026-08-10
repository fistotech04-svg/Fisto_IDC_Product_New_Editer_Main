import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundComponents from './Backgrounds';
import animationComponents from './Animations';
import * as BookAppearanceHelpers from './bookAppearanceHelpers';
import { resolveUploadsPath } from '../../utils/supabaseUtils';


import TableOfContentsPopup from './popups/TableOfContentsPopup';
import MobileFrame from './MobileFrame';
import MobileLayoutRenderer from './Mobile/MobileLayoutRenderer';
import FlipbookSharePopup from './popups/FlipbookSharePopup';
import ProfilePopup from './popups/ProfilePopup';
import ShareModal from '../ShareModal';
import Sound from './popups/Sound';
import Export from './popups/Export';
import Grid1Layout from './Layouts/Grid1Layout';
import Grid2Layout from './Layouts/Grid2Layout';
import Grid3Layout from './Layouts/Grid3Layout';
import Grid4Layout from './Layouts/Grid4Layout';
import Grid5Layout from './Layouts/Grid5Layout';
import Grid6Layout from './Layouts/Grid6Layout';
import Grid7Layout from './Layouts/Grid7Layout';
import Grid8Layout from './Layouts/Grid8Layout';
import Grid9Layout from './Layouts/Grid9Layout';
import Interaction3DPreview from '../TemplateEditor/Interaction3DPreview';
import TabletLayout1 from './Tablet/TabletLayouts/TabletLayout1';
import TabletLayout2 from './Tablet/TabletLayouts/TabletLayout2';
import TabletLayout3 from './Tablet/TabletLayouts/TabletLayout3';
import TabletLayout4 from './Tablet/TabletLayouts/TabletLayout4';
import TabletLayout5 from './Tablet/TabletLayouts/TabletLayout5';
import TabletLayout6 from './Tablet/TabletLayouts/TabletLayout6';
import TabletLayout7 from './Tablet/TabletLayouts/TabletLayout7';
import TabletLayout8 from './Tablet/TabletLayouts/TabletLayout8';
import TabletLayout9 from './Tablet/TabletLayouts/TabletLayout9';
import GalleryPopup from './popups/GalleryPopup';
import TabletGalleryPopup from './Tablet/TabletLayouts/TabletGalleryPopup';
import { getBookmarkClipPath, getBookmarkBorderRadius, getBookmarkSVGPath } from './BookmarkStylesPopup';
import FlipBookEngine from './FlipBookEngine';
import LeadFormPopup from './popups/LeadFormPopup';
import { getFromDB, saveToDB } from '../../utils/dbUtils';


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
            const settings = data.settings || {};
            const images = data.images || [];
            if (!images || images.length < 1) return;

            let currentIndex = parseInt(el.getAttribute('data-active-index') || '0');
            let isAnimating = false;
            let autoTimer = null;

            // --- Setup Container ---
            const container = el.parentElement || el;
            if (getComputedStyle(container).position === 'static') {
              container.style.position = 'relative';
            }
            container.style.overflow = 'hidden';

            // --- Helper: set image src (handles SVG <image> and <img>) ---
            const setElSrc = (target, url) => {
              const tag = target.tagName ? target.tagName.toLowerCase() : '';
              if (tag === 'image') {
                target.setAttribute('href', url);
                target.setAttributeNS && target.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
              } else if (tag === 'img') {
                target.src = url;
              } else {
                // Try SVG image child first
                const svgImg = target.querySelector('image');
                if (svgImg) {
                  svgImg.setAttribute('href', url);
                  try { svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch(e){}
                } else {
                  const img = target.querySelector('img');
                  if (img) img.src = url;
                  else target.style.backgroundImage = 'url(' + url + ')';
                }
              }
            };

            // Set initial image
            if (images[currentIndex]) setElSrc(el, images[currentIndex].url);

            // --- Transition Engine ---
            const transitionEffect = (settings.transitionEffect || 'Linear').toLowerCase();
            const duration = 400;

            const applyTransition = (newIndex, dir) => {
              if (isAnimating) return;
              if (newIndex === currentIndex && images.length > 1) {
                // allow same index only on init
              }
              const oldIndex = currentIndex;
              const nextUrl = images[newIndex] ? images[newIndex].url : null;
              if (!nextUrl) return;

              isAnimating = true;
              currentIndex = newIndex;

              // Update dots
              const dots = container.querySelectorAll('.ss-dot');
              dots.forEach((d, i) => {
                d.style.opacity = i === currentIndex ? '1' : '0.4';
                d.style.transform = i === currentIndex ? 'scale(1.3)' : 'scale(1)';
              });

              const effect = transitionEffect;

              if (effect === 'fade') {
                el.style.transition = 'opacity ' + duration + 'ms ease-in-out';
                el.style.opacity = '0';
                setTimeout(() => {
                  setElSrc(el, nextUrl);
                  el.style.opacity = el.dataset.baseOpacity || '1';
                  setTimeout(() => { el.style.transition = ''; isAnimating = false; }, duration);
                }, duration);
              } else if (effect === 'slide' || effect === 'push' || effect === 'linear') {
                const slideDir = dir === 'next' ? -100 : 100;
                el.style.transition = 'transform ' + duration + 'ms ease-in-out';
                el.style.transform = 'translateX(' + slideDir + '%)';
                setTimeout(() => {
                  setElSrc(el, nextUrl);
                  el.style.transition = 'none';
                  el.style.transform = 'translateX(' + (-slideDir) + '%)';
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      el.style.transition = 'transform ' + duration + 'ms ease-in-out';
                      el.style.transform = 'translateX(0)';
                      setTimeout(() => { el.style.transition = ''; isAnimating = false; }, duration);
                    });
                  });
                }, duration);
              } else if (effect === 'flip') {
                el.style.transition = 'transform ' + duration + 'ms ease-in-out';
                el.style.transform = 'rotateY(90deg)';
                setTimeout(() => {
                  setElSrc(el, nextUrl);
                  el.style.transform = 'rotateY(-90deg)';
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      el.style.transition = 'transform ' + duration + 'ms ease-in-out';
                      el.style.transform = 'rotateY(0deg)';
                      setTimeout(() => { el.style.transition = ''; isAnimating = false; }, duration);
                    });
                  });
                }, duration);
              } else if (effect === 'reveal') {
                el.style.transition = 'clip-path ' + duration + 'ms ease-in-out';
                el.style.clipPath = dir === 'next' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
                setTimeout(() => {
                  setElSrc(el, nextUrl);
                  el.style.clipPath = dir === 'next' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      el.style.transition = 'clip-path ' + duration + 'ms ease-in-out';
                      el.style.clipPath = 'inset(0 0% 0 0%)';
                      setTimeout(() => { el.style.transition = ''; el.style.clipPath = ''; isAnimating = false; }, duration);
                    });
                  });
                }, duration);
              } else {
                // Default: instant swap
                setElSrc(el, nextUrl);
                isAnimating = false;
              }
            };

            // Store base opacity
            el.dataset.baseOpacity = el.style.opacity || '1';

            // --- Navigation Arrows ---
            const showArrows = settings.showArrows !== false && settings.showNav !== false;
            const navColor = settings.navIconColor || '#000000';
            const navStyle = settings.navStyle || 1;

            // Arrow SVG paths based on style
            const getArrowPath = (dir) => {
              const d = dir === 'prev';
              const styles = {
                1: d ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6',
                2: d ? 'M20 12H4M10 6l-6 6 6 6' : 'M4 12h16M14 6l6 6-6 6',
                3: d ? 'M16 12H8m4-4l-4 4 4 4' : 'M8 12h8m-4-4l4 4-4 4',
              };
              return styles[navStyle] || styles[1];
            };

            if (showArrows && images.length > 1) {
              ['prev','next'].forEach(type => {
                const btn = document.createElement('button');
                btn.className = 'ss-nav-btn ss-' + type;
                btn.style.cssText = [
                  'position:absolute',
                  'top:50%',
                  'transform:translateY(-50%)',
                  type === 'prev' ? 'left:8px' : 'right:8px',
                  'z-index:100',
                  'background:rgba(255,255,255,0.85)',
                  'border:none',
                  'border-radius:50%',
                  'width:32px',
                  'height:32px',
                  'display:flex',
                  'align-items:center',
                  'justify-content:center',
                  'cursor:pointer',
                  'box-shadow:0 2px 8px rgba(0,0,0,0.2)',
                  'transition:background 0.2s,transform 0.2s',
                  'padding:0'
                ].join(';');
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + navColor + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + getArrowPath(type) + '"/></svg>';
                btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,1)');
                btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.85)');
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  resetTimer();
                  if (type === 'prev') {
                    let prev = currentIndex - 1;
                    if (prev < 0) prev = settings.infiniteLoop !== false ? images.length - 1 : 0;
                    applyTransition(prev, 'prev');
                  } else {
                    let next = currentIndex + 1;
                    if (next >= images.length) next = settings.infiniteLoop !== false ? 0 : images.length - 1;
                    applyTransition(next, 'next');
                  }
                });
                container.appendChild(btn);
              });
            }

            // --- Pagination Dots ---
            const showDots = settings.showDots !== false;
            const dotColor = settings.dotColor || '#4F46E5';

            if (showDots && images.length > 1) {
              const dotsContainer = document.createElement('div');
              dotsContainer.className = 'ss-dots-container';
              dotsContainer.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:100;align-items:center;';
              images.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'ss-dot';
                dot.style.cssText = [
                  'width:8px',
                  'height:8px',
                  'border-radius:50%',
                  'background:' + dotColor,
                  'cursor:pointer',
                  'transition:opacity 0.3s,transform 0.3s',
                  'opacity:' + (i === currentIndex ? '1' : '0.4'),
                  'transform:' + (i === currentIndex ? 'scale(1.3)' : 'scale(1)')
                ].join(';');
                dot.addEventListener('click', (e) => {
                  e.stopPropagation();
                  resetTimer();
                  if (i !== currentIndex) {
                    applyTransition(i, i > currentIndex ? 'next' : 'prev');
                  }
                });
                dotsContainer.appendChild(dot);
              });
              container.appendChild(dotsContainer);
            }

            // --- Auto Play ---
            const startTimer = () => {
              if (!settings.autoSlide && !settings.autoPlay) return;
              const ms = (settings.speed || 3) * 1000;
              autoTimer = setInterval(() => {
                let next = currentIndex + 1;
                if (next >= images.length) {
                  if (settings.infiniteLoop === false) { clearInterval(autoTimer); return; }
                  next = 0;
                }
                applyTransition(next, 'next');
              }, ms);
            };

            const resetTimer = () => {
              if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
              startTimer();
            };

            startTimer();

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
      window._pageNumber = pageNumber;
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

      const LOOP_ANIMATIONS = ['pulse', 'tada', 'rubber-band', 'jello', 'heartbeat', 'glitch', 'neon-glow', 'swing', 'wobble', 'float'];

      const getWaapiEase = (name) => {
        const map = {
          'Linear': 'linear', 'Smooth': 'ease-in-out', 'Ease In': 'ease-in',
          'Ease Out': 'ease-out', 'Ease In & Out': 'ease-in-out',
          'Bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        };
        return map[name] || 'linear';
      };

      const runAnim = (el, type, settings) => {
        if (!type || !WAAPI_ANIMATIONS[type] || type === 'none') {
          if (el.__currentAnimation) { el.__currentAnimation.cancel(); el.__currentAnimation = null; }
          return;
        }
        const elementId = el.getAttribute('data-id') || el.id;
        const sessionKey = \`fisto_anim_played_\${window._pageNumber}_\${elementId}\`;
        const hasPlayedInSession = elementId ? sessionStorage.getItem(sessionKey) === 'true' : false;
        if (!settings.everyVisit && (el.getAttribute('data-anim-run') === 'true' || el.__animOpened || hasPlayedInSession)) return;
        el.setAttribute('data-anim-run', 'true');
        el.__animOpened = true;
        if (elementId) sessionStorage.setItem(sessionKey, 'true');
        if (el.__currentAnimation) el.__currentAnimation.cancel();
        const duration = ((parseFloat(settings && settings.duration || 1)) / (parseFloat(settings && settings.speed || 1))) * 1000;
        const delay = (parseFloat(settings && settings.delay || 0)) * 1000;
        const easing = getWaapiEase(settings && settings.easing || 'Linear');
        let isLoop = LOOP_ANIMATIONS.includes(type) || !!(settings && settings.isAlways);
        let iterations = 1;
        if (isLoop) {
            iterations = Infinity;
        } else if (settings && settings.repeat) {
            if (settings.repeat === 'Infinite') {
                iterations = Infinity;
                isLoop = true;
            } else if (settings.repeat === 'Once') iterations = 1;
            else if (settings.repeat === 'Twice') iterations = 2;
            else if (settings.repeat === 'Thrice') iterations = 3;
            else if (settings.repeat === 'None') iterations = 1;
            else {
                const parsed = parseInt(settings.repeat);
                if (!isNaN(parsed) && parsed > 0) iterations = parsed;
            }
        }
        try {
          let cx = 0, cy = 0, useMathOrigin = false;
          const isSVG = el.namespaceURI === 'http://www.w3.org/2000/svg' || el.ownerSVGElement !== undefined;
          if (isSVG) {
            try {
              const bbox = el.getBBox();
              cx = bbox.x + bbox.width / 2; cy = bbox.y + bbox.height / 2;
              useMathOrigin = true; el.style.transformOrigin = '0 0';
            } catch(e) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; }
          }
          if (WAAPI_ANIMATIONS[type][0] && WAAPI_ANIMATIONS[type][0].opacity !== undefined && !isLoop) {
            el.style.opacity = WAAPI_ANIMATIONS[type][0].opacity;
          }
          if (el.__originalTransform === undefined) {
            let baseT = window.getComputedStyle(el).transform;
            if (!baseT || baseT === 'none') {
              const tAttr = el.getAttribute('transform');
              if (tAttr) {
                try {
                  const dummy = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  dummy.setAttribute('transform', tAttr);
                  if (dummy.transform.baseVal) {
                    dummy.transform.baseVal.consolidate();
                    if (dummy.transform.baseVal.numberOfItems > 0) {
                      const m = dummy.transform.baseVal.getItem(0).matrix;
                      baseT = \`matrix(\${m.a}, \${m.b}, \${m.c}, \${m.d}, \${m.e}, \${m.f})\`;
                    }
                  }
                } catch(e) {}
              }
            }
            el.__originalTransform = (!baseT || baseT === 'none') ? '' : baseT;
          }
          const baseTransform = el.__originalTransform;
          const keyframes = WAAPI_ANIMATIONS[type].map(kf => {
            const newKf = Object.assign({}, kf);
            if ((baseTransform || useMathOrigin) && kf.transform) {
              newKf.transform = useMathOrigin
                ? \`\${baseTransform} translate(\${cx}px,\${cy}px) \${kf.transform} translate(-\${cx}px,-\${cy}px)\`
                : \`\${baseTransform} \${kf.transform}\`;
            } else if (baseTransform) {
              newKf.transform = baseTransform;
            }
            return newKf;
          });
          const anim = el.animate(keyframes, { duration, delay, easing, fill: isLoop ? 'none' : 'forwards', iterations: iterations });
          el.__currentAnimation = anim;
        } catch(e) { console.error('Animation error', e); }
      };

      let isVisible = false;

      const handleTrigger = (forceRetrigger) => {
        // 1. While Opening
        document.querySelectorAll('[data-animation-trigger="While Opening"]').forEach(el => {
          if (forceRetrigger) {
            const everyVisit = el.getAttribute('data-animation-open-every-visit') !== 'false';
            if (everyVisit) {
              el.removeAttribute('data-anim-run'); el.__animOpened = false;
              const eid = el.getAttribute('data-id') || el.id;
              if (eid) sessionStorage.removeItem(\`fisto_anim_played_\${window._pageNumber}_\${eid}\`);
            }
          }
          const type = el.getAttribute('data-animation-open-type');
          if (type) runAnim(el, type, {
            duration: el.getAttribute('data-animation-open-duration'),
            speed:    el.getAttribute('data-animation-open-speed'),
            delay:    el.getAttribute('data-animation-open-delay'),
            easing:   el.getAttribute('data-animation-open-easing'),
            repeat:   el.getAttribute('data-animation-open-repeat'),
            everyVisit: el.getAttribute('data-animation-open-every-visit') !== 'false'
          });
        });
        // 2. On Page (Always / Click / Hover)
        document.querySelectorAll('[data-animation-trigger="On Page"]').forEach(el => {
          const action = el.getAttribute('data-animation-action');
          const type   = el.getAttribute('data-animation-interact-type');
          const s = {
            duration:   el.getAttribute('data-animation-interact-duration'),
            speed:      el.getAttribute('data-animation-interact-speed'),
            delay:      el.getAttribute('data-animation-interact-delay'),
            easing:     el.getAttribute('data-animation-interact-easing'),
            repeat:     el.getAttribute('data-animation-interact-repeat'),
            everyVisit: el.getAttribute('data-animation-interact-every-visit') !== 'false',
            isAlways:   action === 'Always'
          };
          if (action === 'Always') {
            if (forceRetrigger && s.everyVisit) { el.removeAttribute('data-anim-run'); el.__animOpened = false; }
            runAnim(el, type, s);
          } else if (action === 'Click' && !el.__clickBound) {
            el.__clickBound = true;
            el.style.cursor = 'pointer'; el.style.pointerEvents = 'auto';
            el.addEventListener('click', function(ev) {
              ev.stopPropagation();
              if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
              runAnim(el, el.getAttribute('data-animation-interact-type'), Object.assign({}, s, { everyVisit: true }));
            });
          } else if (action === 'Hover' && !el.__hoverBound) {
            el.__hoverBound = true;
            el.style.pointerEvents = 'auto';
            el.addEventListener('mouseenter', function() {
              if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
              runAnim(el, el.getAttribute('data-animation-interact-type'), Object.assign({}, s, { everyVisit: true }));
            });
          }
        });
      };

      window.addEventListener('message', function(e) {
        if (!e.data) return;
        if (e.data.type === 'PAGE_TURNED') {
          const visiblePages = e.data.visiblePages || [];
          const nowVisible = visiblePages.includes(pageNumber);
          if (nowVisible && !isVisible) { isVisible = true; handleTrigger(true); }
          else if (!nowVisible && isVisible) {
            isVisible = false;
            document.querySelectorAll('[data-anim-run="true"]').forEach(el => {
              const trigger = el.getAttribute('data-animation-trigger');
              const action  = el.getAttribute('data-animation-action');
              const evOpen  = el.getAttribute('data-animation-open-every-visit') !== 'false';
              const evInt   = el.getAttribute('data-animation-interact-every-visit') !== 'false';
              if ((action === 'Always' && evInt) || (trigger === 'While Opening' && evOpen)) {
                if (el.__currentAnimation) { el.__currentAnimation.cancel(); el.__currentAnimation = null; }
                el.removeAttribute('data-anim-run'); el.__animOpened = false;
                const eid = el.getAttribute('data-id') || el.id;
                if (eid) sessionStorage.removeItem(\`fisto_anim_played_\${window._pageNumber}_\${eid}\`);
              }
            });
          }
        } else if (e.data.type === 'RETRIGGER_ANIMATIONS') {
          handleTrigger(true);
        }
      });

      if (window.parent !== window) {
          window.parent.postMessage({ type: 'REQUEST_PAGE_STATE' }, '*');
      }

      // Fallback: run animations if no PAGE_TURNED message arrives within 1500ms
      // Only run fallback on Page 1 or if running outside a parent flipbook context (standalone/editor)
      setTimeout(function() {
        if (!isVisible && (pageNumber === 1 || window.parent === window)) {
          isVisible = true;
          handleTrigger();
        }
      }, 1500);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAnim);
      else initAnim();
    })();
  </script>
`;

const getInteractionScript = (pageNumber) => `
  <style>
    [data-interaction="link"],
    [data-interaction="open-link"],
    [data-interaction="navigate-to"],
    [data-interaction="download"],
    [data-interaction="zoom"],
    [data-interaction="popup"],
    [data-interaction="tooltip"],
    [data-interaction="info-box"],
    [data-interaction="call"],
    [data-interaction="whatsapp"],
    [data-interaction="email"],
    [data-interaction="audio"],
    [data-interaction="3d-viewer"] {
      cursor: pointer !important;
    }
  </style>
  <script>
    (function() {
        const init = () => {
            window._pageNumber = ${pageNumber};
            // Walk ancestors from target to find data-interaction (handles SVG bubbling quirks)
            const findInteractionEl = (target) => {
                let el = target;
                while (el && el !== document.body) {
                    if (el.dataset && el.dataset.interaction) return el;
                    // Also check getAttribute for SVG elements where dataset may not work
                    if (el.getAttribute && el.getAttribute('data-interaction')) return el;
                    el = el.parentElement;
                }
                return null;
            };
            let lastInteractionTime = 0;
            const handleStart = (e) => {
               const el = findInteractionEl(e.target);
               if (el) {
                   const now = Date.now();
                   if (now - lastInteractionTime < 300) return;
                   lastInteractionTime = now;
                   
                   const type = el.dataset.interaction || el.getAttribute('data-interaction');
                   const value = el.dataset.interactionValue || el.getAttribute('data-interaction-value');
                   if ((type === 'link' || type === 'open-link') && value) {
                       e.preventDefault();
                       e.stopPropagation();
                       const behavior = el.dataset.interactionLinkBehavior || el.getAttribute('data-interaction-link-behavior') || 'current';
                       const target = behavior === 'new' ? '_blank' : '_top';
                       window.open(value.startsWith('http') ? value : 'https://' + value, target);
                   } else if (type === 'navigate-to' && value) {
                       e.preventDefault();
                       e.stopPropagation();
                       window.parent.postMessage({ type: 'navigate-to-page', page: parseInt(value, 10) }, '*');
                   } else if (type === 'download' && value) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.parent.postMessage({ type: 'download-file', value: value }, '*');
                    } else if (type === 'zoom') {
                        e.preventDefault();
                        e.stopPropagation();
                        // Toggle zoom in/out per element
                        var currentlyZoomed = el.dataset.zoomedIn === 'true';
                        if (currentlyZoomed) {
                            el.dataset.zoomedIn = 'false';
                            window.parent.postMessage({ type: 'zoom-out-element' }, '*');
                        } else {
                            document.querySelectorAll('[data-zoomed-in="true"]').forEach(function(other) {
                                other.dataset.zoomedIn = 'false';
                            });
                            el.dataset.zoomedIn = 'true';
                            var rect = el.getBoundingClientRect();
                            window.parent.postMessage({
                                type: 'zoom-to-element',
                                speed: value || 'Medium',
                                pageNumber: window._pageNumber,
                                rect: {
                                    left: rect.left,
                                    top: rect.top,
                                    width: rect.width,
                                    height: rect.height,
                                    windowWidth: window.innerWidth,
                                    windowHeight: window.innerHeight
                                }
                            }, '*');
                        }
                    } else if (type === 'popup') {
                       e.preventDefault();
                       e.stopPropagation();
                       var customHtml = el.dataset.interactionPopupCustomHtml || el.getAttribute('data-interaction-popup-custom-html');
                       var popupAnim = el.dataset.interactionPopupAnimation || el.getAttribute('data-interaction-popup-animation') || 'Fade In /Out';
                       var popupSpeed = el.dataset.interactionPopupSpeed || el.getAttribute('data-interaction-popup-speed') || 'Medium';
                       if (customHtml) {
                           window.parent.postMessage({
                               type: 'show-popup-interaction',
                               html: customHtml,
                               templateId: value,
                               animation: popupAnim,
                               speed: popupSpeed
                           }, '*');
                       }
                   }  else if (type === 'slideshow') {
                       e.preventDefault();
                       e.stopPropagation();
                       var effect = el.dataset.interactionSlideshowEffect || el.getAttribute('data-interaction-slideshow-effect') || 'Play Cards';
                       var speed = el.dataset.interactionSlideshowSpeed || el.getAttribute('data-interaction-slideshow-speed') || 'Medium';
                       try {
                           var parsedImages = JSON.parse(value);
                           if (parsedImages && parsedImages.length > 0) {
                               window.parent.postMessage({
                                   type: 'show-slideshow-interaction',
                                   images: parsedImages,
                                   effect: effect,
                                   speed: speed
                               }, '*');
                           }
                       } catch(e) {
                           console.error('Failed to parse slideshow interaction images', e);
                       }
                   }  else if (type === '3d-viewer') {
                       e.preventDefault();
                       e.stopPropagation();
                       let modelUrl = value;
                       let configObj = null;
                       if (value && value.startsWith('{')) {
                           try {
                               var parsed = JSON.parse(value);
                               modelUrl = parsed.data || parsed.url || value;
                           } catch(e) {}
                       }
                       const configStr = el.dataset.interactionConfig || el.getAttribute('data-interaction-config');
                       if (configStr) {
                           try {
                               configObj = JSON.parse(configStr);
                           } catch(e) {}
                       }
                       window.parent.postMessage({
                           type: 'show-3d-viewer',
                           url: modelUrl,
                           config: configObj
                       }, '*');
                   } else if (type === 'audio' && value) {
                       e.preventDefault();
                       e.stopPropagation();
                       try {
                           const audioData = JSON.parse(value);
                           if (audioData && audioData.data) {
                               if (window.parent._activePreviewAudio && window.parent._activePreviewAudioEl === el) {
                                   if (!window.parent._activePreviewAudio.paused) {
                                       window.parent._activePreviewAudio.pause();
                                       window.parent._activePreviewAudio.currentTime = 0;
                                   } else {
                                       window.parent._activePreviewAudio.play().catch(function(e) { console.error('Audio playback failed', e) });
                                   }
                               } else {
                                   if (window.parent._activePreviewAudio) {
                                       window.parent._activePreviewAudio.pause();
                                       window.parent._activePreviewAudio.currentTime = 0;
                                   }
                                   const audio = new Audio(audioData.data);
                                   window.parent._activePreviewAudio = audio;
                                   window.parent._activePreviewAudioEl = el;
                                   audio.play().catch(function(e) { console.error('Audio playback failed', e) });
                                }
                            }
                        } catch(err) {
                            console.error('Failed to parse or play audio interaction', err);
                        }
                    } else if (type === 'whatsapp' && value) {
                        e.preventDefault();
                        e.stopPropagation();
                        const behavior = el.dataset.interactionLinkBehavior || el.getAttribute('data-interaction-link-behavior') || 'current';
                        const target = behavior === 'new' ? '_blank' : '_top';
                        
                        const msg = el.dataset.interactionWhatsappMessage || el.getAttribute('data-interaction-whatsapp-message');
                        let url = 'https://wa.me/' + value.replace(/[^0-9]/g, '');
                        if (msg) {
                            url += '?text=' + encodeURIComponent(msg);
                        }
                        window.open(url, target);
                    } else if (type === 'call' && value) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open('tel:' + value, '_blank');
                    } else if (type === 'email' && value) {
                        e.preventDefault();
                        e.stopPropagation();
                        const behavior = el.dataset.interactionLinkBehavior || el.getAttribute('data-interaction-link-behavior') || 'current';
                        const target = behavior === 'new' ? '_blank' : '_top';
                        window.parent.postMessage({ type: 'open-email', value: value, target: target }, '*');
                    } else if (type === 'info-box') {
                        e.preventDefault();
                        e.stopPropagation();
                        var isShowing = el.dataset.infoBoxShowing === 'true';
                        if (isShowing) {
                            el.dataset.infoBoxShowing = 'false';
                            window.parent.postMessage({ type: 'hide-tooltip' }, '*');
                        } else {
                            document.querySelectorAll('[data-info-box-showing="true"]').forEach(function(other) {
                                other.dataset.infoBoxShowing = 'false';
                            });
                            el.dataset.infoBoxShowing = 'true';
                            var rect = el.getBoundingClientRect();
                            var settingsStr = el.getAttribute('data-interaction-value');
                            var settings = null;
                            try { if (settingsStr) settings = JSON.parse(settingsStr); } catch(e){}
                            if (settings) {
                                settings.isInfoBox = true;
                                settings.shape = settings.shape || 'bottom-center';
                            } else {
                                settings = { isInfoBox: true, shape: 'bottom-center' };
                            }
                            var absLeft = rect.left, absTop = rect.top, absW = rect.width, absH = rect.height;
                            try {
                                var iframe = window.frameElement;
                                if (iframe) {
                                    var fr = iframe.getBoundingClientRect();
                                    var sx = fr.width / (window.innerWidth || 1);
                                    var sy = fr.height / (window.innerHeight || 1);
                                    absLeft = fr.left + rect.left * sx;
                                    absTop  = fr.top  + rect.top  * sy;
                                    absW    = rect.width  * sx;
                                    absH    = rect.height * sy;
                                }
                            } catch(err) {}
                            window.parent.postMessage({
                                type: 'show-tooltip',
                                abs: { left: absLeft, top: absTop, width: absW, height: absH },
                                settings: settings,
                                pageNumber: window._pageNumber,
                                elementId: el.id
                            }, '*');
                        }
                    } else if (type === 'tooltip') {
                        const trigger = el.dataset.interactionTrigger || el.getAttribute('data-interaction-trigger') || 'click';
                        if (trigger === 'click') {
                            e.preventDefault();
                            e.stopPropagation();
                            var isShowing = el.dataset.tooltipShowing === 'true';
                            if (isShowing) {
                                el.dataset.tooltipShowing = 'false';
                                window.parent.postMessage({ type: 'hide-tooltip' }, '*');
                            } else {
                                document.querySelectorAll('[data-tooltip-showing="true"]').forEach(function(other) {
                                    other.dataset.tooltipShowing = 'false';
                                });
                                el.dataset.tooltipShowing = 'true';
                                var rect = el.getBoundingClientRect();
                                var settingsStr = el.getAttribute('data-tooltip-settings');
                                var settings = null;
                                try { if (settingsStr) settings = JSON.parse(settingsStr); } catch(e){}
                                var absLeft = rect.left, absTop = rect.top, absW = rect.width, absH = rect.height;
                                try {
                                    var iframe = window.frameElement;
                                    if (iframe) {
                                        var fr = iframe.getBoundingClientRect();
                                        var sx = fr.width / (window.innerWidth || 1);
                                        var sy = fr.height / (window.innerHeight || 1);
                                        absLeft = fr.left + rect.left * sx;
                                        absTop  = fr.top  + rect.top  * sy;
                                        absW    = rect.width  * sx;
                                        absH    = rect.height * sy;
                                    }
                                } catch(err) {}
                                window.parent.postMessage({
                                    type: 'show-tooltip',
                                    abs: { left: absLeft, top: absTop, width: absW, height: absH },
                                    settings: settings,
                                    pageNumber: window._pageNumber,
                                    elementId: el.id
                                }, '*');
                            }
                        }
                    }
               } else {
                    // Forward mousedown to parent for dragging (only for mouse/touch down, not click)
                    if (e.type === 'mousedown' || e.type === 'touchstart') {
                        try {
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                        window.parent.postMessage({
                            type: 'IFRAME_MOUSEDOWN',
                            originalClientX: clientX,
                            originalClientY: clientY,
                            pageNumber: window._pageNumber
                        }, '*');
                    } catch (err) {}
               }
                }
            };
           
            document.addEventListener('mousedown', handleStart);
            document.addEventListener('touchstart', handleStart, { passive: true });
            document.addEventListener('click', handleStart);
 
            // Hover logic for tooltips
            const handleHover = (e, isEnter) => {
                const el = findInteractionEl(e.target);
                if (el) {
                    const type = el.dataset.interaction || el.getAttribute('data-interaction');
                    const trigger = el.dataset.interactionTrigger || el.getAttribute('data-interaction-trigger') || 'click';
                    if (type === 'tooltip' && trigger === 'hover') {
                        if (isEnter) {
                             var rect = el.getBoundingClientRect();
                             var settingsStr = el.getAttribute('data-tooltip-settings');
                             var settings = null;
                             try { if (settingsStr) settings = JSON.parse(settingsStr); } catch(e){}
                             var absLeft = rect.left, absTop = rect.top, absW = rect.width, absH = rect.height;
                             try {
                                 var iframe = window.frameElement;
                                 if (iframe) {
                                     var fr = iframe.getBoundingClientRect();
                                     var sx = fr.width / (window.innerWidth || 1);
                                     var sy = fr.height / (window.innerHeight || 1);
                                     absLeft = fr.left + rect.left * sx;
                                     absTop  = fr.top  + rect.top  * sy;
                                     absW    = rect.width  * sx;
                                     absH    = rect.height * sy;
                                 }
                             } catch(err) {}
                             window.parent.postMessage({
                                 type: 'show-tooltip',
                                 abs: { left: absLeft, top: absTop, width: absW, height: absH },
                                 settings: settings,
                                 pageNumber: window._pageNumber,
                                 elementId: el.id
                             }, '*');
                        } else {
                             window.parent.postMessage({ type: 'hide-tooltip' }, '*');
                        }
                    }
                }
            };
            document.addEventListener('mouseover', (e) => {
                if (!document.hasFocus()) window.focus();
                handleHover(e, true);
            });
            document.addEventListener('mouseout', (e) => handleHover(e, false));
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    })();
  </script>
`;

const getVideoControlsScript = () => `
  <script>
    (function() {
      // Inject global styles for the progress bar thumb
      const thumbStyleId = 'global-custom-video-progress-style';
      if (!document.getElementById(thumbStyleId)) {
        const ts = document.createElement('style');
        ts.id = thumbStyleId;
        ts.textContent = \`
          input.custom-video-progress {
            -webkit-appearance: none !important;
            appearance: none !important;
            accent-color: transparent !important;
          }
          input.custom-video-progress::-webkit-slider-thumb {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 6px !important;
            height: 6px !important;
            border-radius: 50% !important;
            background: #ffffff !important;
            cursor: pointer !important;
            box-shadow: none !important;
            border: none !important;
            margin-top: -2.5px !important;
          }
          input.custom-video-progress::-moz-range-thumb {
            width: 6px !important;
            height: 6px !important;
            border-radius: 50% !important;
            background: #ffffff !important;
            cursor: pointer !important;
            border: none !important;
            box-shadow: none !important;
          }
          input.custom-video-progress::-webkit-slider-runnable-track {
            height: 1px !important;
            background: rgba(255,255,255,0.4) !important;
            border-radius: 1px !important;
          }
          .custom-video-overlay button {
            font-size: inherit !important;
          }
          .custom-video-overlay {
            opacity: 0;
            background: transparent;
            transition: opacity 0.3s ease, background 0.3s ease !important;
          }
          .custom-video-overlay.is-paused,
          .custom-video-overlay.video-is-hovered,
          [id]:hover > .custom-video-overlay,
          [id]:hover > foreignObject > .custom-video-overlay,
          foreignObject:hover > .custom-video-overlay,
          .custom-video-overlay:hover {
            opacity: 1 !important;
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%) !important;
          }
        \`;
        document.head.appendChild(ts);
      }

      const renderVideoControls = () => {
        document.querySelectorAll('video').forEach(v => {
          if (!v.hasAttribute('data-custom-ctrl-active')) {
            v.controls = false;
            v.removeAttribute('controls');
          }
        });

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const fo = video.closest('foreignObject');
          const liveEl = fo ? (fo.closest('[id]') || fo) : (video.closest('[id]') || video);
          const layerId = liveEl.id;
          if (!layerId) return;

          const showControls = video.getAttribute('data-show-controls') !== 'false';
          
          const pbSpeedStr = video.getAttribute('data-playback-speed');
          if (pbSpeedStr) {
             const pbSpeed = parseFloat(pbSpeedStr.replace('x', ''));
             if (!isNaN(pbSpeed)) video.playbackRate = pbSpeed;
          }

          if (!video.hasAttribute('data-video-props-applied')) {
              video.setAttribute('data-video-props-applied', 'true');
              const defVolStr = video.getAttribute('data-default-volume');
              if (defVolStr) {
                  video.volume = parseInt(defVolStr) / 100;
              }

              const startTimeAttr = video.getAttribute('data-start-time');
              let sTime = 0;
              if (startTimeAttr) {
                const parts = startTimeAttr.split(':').map(Number);
                if (parts.length === 3) sTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) sTime = parts[0] * 60 + parts[1];
              }
              const endTimeAttr = video.getAttribute('data-end-time');
              let eTime = Infinity;
              if (endTimeAttr) {
                const parts = endTimeAttr.split(':').map(Number);
                if (parts.length === 3) eTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) eTime = parts[0] * 60 + parts[1];
              }
              video._startTime = sTime;
              video._endTime = eTime;
              
              if (sTime > 0) video.currentTime = sTime;

              video.addEventListener('timeupdate', () => {
                 if (video._startTime > 0 && video.currentTime < video._startTime - 0.5) video.currentTime = video._startTime;
                 if (video._endTime < Infinity && video.currentTime >= video._endTime) {
                     if (video.loop) video.currentTime = video._startTime;
                     else video.pause();
                 }
              });
              
              const resumeBehavior = video.getAttribute('data-resume-behavior');
              if (resumeBehavior === "Start from Beginning") {
                  video.addEventListener('play', () => {
                      if (video._wasPaused) video.currentTime = video._startTime || 0;
                      video._wasPaused = false;
                  });
                  video.addEventListener('pause', () => { video._wasPaused = true; });
              }

              const playVideoWhile = video.getAttribute('data-play-video-while');
              if (video._prevPlayVideoWhile !== playVideoWhile) {
                  video._prevPlayVideoWhile = playVideoWhile;
                  if (playVideoWhile === "Auto Play While on Page" || playVideoWhile === "Auto Play on Page Open") {
                      video.play().catch(()=>{});
                  } else if (playVideoWhile === "Click to Play" || playVideoWhile === "Manual (Click to Play)") {
                      video.pause();
                  }
              }
          }

          const ctrlId = \`custom-ctrl-\${layerId}\`;
          let bar = document.getElementById(ctrlId);

          const mountPoint = video.parentElement || fo || liveEl;
          if (!mountPoint) return;

          if (bar && bar._video !== video) {
            if (bar._cleanup) bar._cleanup();
            bar.remove();
            bar = null;
          }

          if (bar) {
            const repBtn = bar.querySelector('.custom-repeat-btn');
            if (repBtn) repBtn.style.opacity = video.loop ? '1' : '0.5';
            
            const volBtn = bar.querySelector('.custom-vol-btn');
            const rewindBtn = bar.querySelector('.custom-rewind-btn');
            const forwardBtn = bar.querySelector('.custom-forward-btn');
            const playBtn = bar.querySelector('.custom-play-btn');
            const fsBtn = bar.querySelector('.custom-fs-btn');
            const dlBtn = bar.querySelector('.custom-download-btn');
            const progC = bar.querySelector('.custom-prog-container');

            const showPlayPause = video.getAttribute('data-show-play-pause') !== 'false';
            const showSkipButton = video.getAttribute('data-show-skip-button') !== 'false';
            const showProgressBar = video.getAttribute('data-show-progress-bar') !== 'false';
            const showLoopButton = video.getAttribute('data-show-loop-button') !== 'false';
            const showFullscreenButton = video.getAttribute('data-show-fullscreen-button') !== 'false';
            const showVolumeControl = video.getAttribute('data-show-volume-control') !== 'false';
            const showDownloadButton = video.getAttribute('data-show-download-button') !== 'false';

            if (volBtn) volBtn.style.display = showVolumeControl ? '' : 'none';
            if (rewindBtn) rewindBtn.style.display = showSkipButton ? 'flex' : 'none';
            if (forwardBtn) forwardBtn.style.display = showSkipButton ? 'flex' : 'none';
            if (playBtn) playBtn.style.display = showPlayPause ? '' : 'none';
            if (repBtn) repBtn.style.display = showLoopButton ? '' : 'none';
            if (fsBtn) fsBtn.style.display = showFullscreenButton ? '' : 'none';
            if (dlBtn) dlBtn.style.display = showDownloadButton ? '' : 'none';
            if (progC) progC.style.display = showProgressBar ? '' : 'none';
            
            bar.style.display = showControls ? 'flex' : 'none';
          }

          if (!bar) {
            video.controls = false;
            video.removeAttribute('controls');
            video.setAttribute('data-custom-ctrl-active', 'true');

            if (mountPoint.style) {
              mountPoint.style.position = 'relative';
              if (!mountPoint._prevPointerEvents) mountPoint._prevPointerEvents = mountPoint.style.pointerEvents || '';
              mountPoint.style.pointerEvents = 'none';
            }

            if (!window._videoHoverTrackerAdded) {
              window._videoHoverTrackerAdded = true;
              window.addEventListener('pointermove', (e) => {
                document.querySelectorAll('.custom-video-overlay').forEach(b => {
                  const rect = b.getBoundingClientRect();
                  const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;
                  if (isInside) b.classList.add('video-is-hovered');
                  else b.classList.remove('video-is-hovered');
                });
              });
            }

            bar = document.createElement('div');
            bar.id = ctrlId;
            bar._video = video;
            bar.className = 'custom-video-overlay' + (video.paused ? ' is-paused' : '');
            Object.assign(bar.style, {
              position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '2% 3%', boxSizing: 'border-box', zIndex: '9999',
              pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 100%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%)'
            });

            // Calculate base width in SVG user units
            let baseW = 500; // safe fallback
            if (fo && fo.width && fo.width.baseVal) {
               baseW = fo.width.baseVal.value;
            } else if (fo && fo.hasAttribute('width')) {
               baseW = parseFloat(fo.getAttribute('width'));
            } else if (video.hasAttribute('width')) {
               baseW = parseFloat(video.getAttribute('width'));
            } else if (fo && fo.style && fo.style.width && fo.style.width.endsWith('px')) {
               baseW = parseFloat(fo.style.width);
            }
            
            if (baseW > 0) {
              bar.style.fontSize = (baseW * 0.01) + 'px';
            }

            const topContainer = document.createElement('div');
            topContainer.className = 'custom-top-container';
            Object.assign(topContainer.style, { display: 'flex', justifyContent: 'flex-end', width: '100%', pointerEvents: 'none' });

            const volumeBtn = document.createElement('button');
            volumeBtn.className = 'custom-vol-btn';
            Object.assign(volumeBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '7em', height: '7em', pointerEvents: 'auto', opacity: '0.8' });

            const VOL_ON_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>\`;
            const VOL_OFF_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>\`;

            const updateVolumeIcon = () => { volumeBtn.innerHTML = (video.muted || video.volume === 0) ? VOL_OFF_SVG : VOL_ON_SVG; };
            updateVolumeIcon();
            volumeBtn.onclick = (e) => { e.stopPropagation(); video.muted = !video.muted; updateVolumeIcon(); };
            video.addEventListener('volumechange', updateVolumeIcon);
            topContainer.appendChild(volumeBtn);

            const centerContainer = document.createElement('div');
            centerContainer.className = 'custom-center-container';
            Object.assign(centerContainer.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2%', flexGrow: '1', pointerEvents: 'none', boxSizing: 'border-box' });

            const REWIND_ICON = \`<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>\`;
            const FORWARD_ICON = \`<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>\`;

            const rewindBtn = document.createElement('button');
            rewindBtn.className = 'custom-rewind-btn';
            Object.assign(rewindBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative' });
            const rewindTextWrapper = document.createElement('div');
            Object.assign(rewindTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginLeft: '0.5em' });
            const rewindText = document.createElement('div');
            rewindText.textContent = "3s";
            Object.assign(rewindText.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            rewindTextWrapper.appendChild(rewindText);
            rewindBtn.innerHTML = REWIND_ICON;
            rewindBtn.appendChild(rewindTextWrapper);
            rewindBtn.onclick = (e) => { e.stopPropagation(); video.currentTime -= 3; };

            const forwardBtn = document.createElement('button');
            forwardBtn.className = 'custom-forward-btn';
            Object.assign(forwardBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative' });
            const forwardTextWrapper = document.createElement('div');
            Object.assign(forwardTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginRight: '0.5em' });
            const forwardText = document.createElement('div');
            forwardText.textContent = "3s";
            Object.assign(forwardText.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            forwardTextWrapper.appendChild(forwardText);
            forwardBtn.appendChild(forwardTextWrapper);
            forwardBtn.insertAdjacentHTML('beforeend', FORWARD_ICON);
            forwardBtn.onclick = (e) => { e.stopPropagation(); video.currentTime += 3; };

            centerContainer.appendChild(rewindBtn);
            centerContainer.appendChild(forwardBtn);

            const bottomContainer = document.createElement('div');
            Object.assign(bottomContainer.style, { display: 'flex', alignItems: 'center', width: '100%', gap: '2em', pointerEvents: 'none', paddingBottom: '2%', paddingLeft: '2%', paddingRight: '2%', boxSizing: 'border-box' });

            const PLAY_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>\`;
            const PAUSE_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>\`;

            const playBtn = document.createElement('button');
            playBtn.className = 'custom-play-btn';
            Object.assign(playBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: "8em", height: "8em", pointerEvents: 'auto', flexShrink: '0' });

            const onPlay = () => { playBtn.innerHTML = PAUSE_SVG; bar.classList.remove('is-paused'); };
            const onPause = () => { playBtn.innerHTML = PLAY_SVG; bar.classList.add('is-paused'); };
            playBtn.innerHTML = video.paused ? PLAY_SVG : PAUSE_SVG;
            video.addEventListener('play', onPlay);
            video.addEventListener('pause', onPause);
            playBtn.onclick = (e) => { e.stopPropagation(); video.paused ? video.play() : video.pause(); };

            const progContainer = document.createElement('div');
            progContainer.className = 'custom-prog-container';
            Object.assign(progContainer.style, { flexGrow: '1', height: '1.2em', background: 'rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', borderRadius: '0.2em' });

            const timeWrapper = document.createElement('div');
            timeWrapper.className = 'custom-time-wrapper';
            Object.assign(timeWrapper.style, { position: 'relative', width: '23em', height: '8em', flexShrink: '0', marginLeft: '1em' });

            const timeDisplay = document.createElement('div');
            Object.assign(timeDisplay.style, { position: 'absolute', top: '50%', left: '0', width: 'max-content', fontSize: '10em', transform: 'translateY(-50%) scale(0.35)', transformOrigin: 'left center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            timeDisplay.textContent = "00:00 / 00:00";
            timeWrapper.appendChild(timeDisplay);

            const progFill = document.createElement('div');
            Object.assign(progFill.style, { position: 'absolute', top: '0', left: '0', bottom: '0', width: '0%', background: 'white', pointerEvents: 'none', borderRadius: '0.2em' });
            progContainer.appendChild(progFill);

            const formatTime = (sec) => {
              if (isNaN(sec)) return "00:00";
              const m = Math.floor(sec / 60).toString().padStart(2, '0');
              const s = Math.floor(sec % 60).toString().padStart(2, '0');
              return \`\${m}:\${s}\`;
            };

            const onTimeUpdate = () => {
              if (video.duration) {
                const pct = (video.currentTime / video.duration) * 100;
                progFill.style.width = \`\${pct}%\`;
                timeDisplay.textContent = \`\${formatTime(video.currentTime)} / \${formatTime(video.duration)}\`;
              }
            };
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('loadedmetadata', onTimeUpdate);
            onTimeUpdate();

            progContainer.onpointerdown = (e) => {
              e.stopPropagation();
              const rect = progContainer.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              if (video.duration) video.currentTime = pct * video.duration;

              const onMove = (me) => {
                const p = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                if (video.duration) video.currentTime = p * video.duration;
              };
              const onUp = () => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
              };
              document.addEventListener('pointermove', onMove);
              document.addEventListener('pointerup', onUp);
            };

            const REPEAT_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>\`;
            const repeatBtn = document.createElement('button');
            repeatBtn.className = 'custom-repeat-btn';
            Object.assign(repeatBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0', opacity: video.loop ? '1' : '0.5' });
            repeatBtn.innerHTML = REPEAT_SVG;
            repeatBtn.onclick = (e) => {
              e.stopPropagation();
              video.loop = !video.loop;
              if (video.loop) video.setAttribute('loop', ''); else video.removeAttribute('loop');
              repeatBtn.style.opacity = video.loop ? '1' : '0.5';
            };

            const FS_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>\`;
            const EXIT_FS_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>\`;
            const DOWNLOAD_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>\`;

            const dlBtn = document.createElement('button');
            dlBtn.className = 'custom-download-btn';
            Object.assign(dlBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });
            dlBtn.innerHTML = DOWNLOAD_SVG;
            dlBtn.onclick = async (e) => {
              e.stopPropagation();
              const sourceUrl = video.src || video.querySelector('source')?.src;
              if (sourceUrl) {
                try {
                  dlBtn.style.opacity = '0.5';
                  dlBtn.style.pointerEvents = 'none';
                  const response = await fetch(sourceUrl);
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = sourceUrl.split('/').pop() || 'video.mp4';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  const a = document.createElement('a');
                  a.href = sourceUrl;
                  a.download = sourceUrl.split('/').pop() || 'video.mp4';
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } finally {
                  dlBtn.style.opacity = '1';
                  dlBtn.style.pointerEvents = 'auto';
                }
              }
            };

            const fsBtn = document.createElement('button');
            fsBtn.className = 'custom-fs-btn';
            Object.assign(fsBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });

            const updateFsIcon = () => { fsBtn.innerHTML = document.fullscreenElement ? EXIT_FS_SVG : FS_SVG; };
            updateFsIcon();
            document.addEventListener('fullscreenchange', updateFsIcon);

            const fsStyleId = 'custom-fs-style';
            if (!document.getElementById(fsStyleId)) {
              const style = document.createElement('style');
              style.id = fsStyleId;
              style.innerHTML = \`
                foreignObject:fullscreen, foreignObject:-webkit-full-screen, foreignObject:-moz-full-screen { width: 100vw !important; height: 100vh !important; background: black !important; transform: none !important; }
                foreignObject:fullscreen video, foreignObject:-webkit-full-screen video, foreignObject:-moz-full-screen video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
                #temp-fs-wrapper .custom-video-overlay { font-size: 0.3vw !important; }
                #temp-fs-wrapper .custom-video-overlay svg { stroke-width: 2.5 !important; }
                #temp-fs-wrapper .custom-video-overlay .time-display { margin-right: 0 !important; }
              \`;
              document.head.appendChild(style);
            }

            fsBtn.onclick = (e) => {
              e.stopPropagation();
              if (!document.fullscreenElement) {
                const fsWrapper = document.createElement('div');
                fsWrapper.id = 'temp-fs-wrapper';
                Object.assign(fsWrapper.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'black', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center' });

                const vPlaceholder = document.createComment('video-placeholder');
                const bPlaceholder = document.createComment('bar-placeholder');

                video.parentElement.insertBefore(vPlaceholder, video);
                bar.parentElement.insertBefore(bPlaceholder, bar);

                const wasPlaying = !video.paused;

                fsWrapper.appendChild(video);
                fsWrapper.appendChild(bar);
                document.body.appendChild(fsWrapper);

                fsWrapper._vPlaceholder = vPlaceholder;
                fsWrapper._bPlaceholder = bPlaceholder;

                const reqFs = fsWrapper.requestFullscreen || fsWrapper.webkitRequestFullscreen;
                if (reqFs) {
                  reqFs.call(fsWrapper).then(() => {
                    if (wasPlaying) video.play().catch(() => {});
                  }).catch(err => {
                    if (vPlaceholder.parentNode) vPlaceholder.parentNode.insertBefore(video, vPlaceholder);
                    if (bPlaceholder.parentNode) bPlaceholder.parentNode.insertBefore(bar, bPlaceholder);
                    vPlaceholder.remove();
                    bPlaceholder.remove();
                    fsWrapper.remove();
                  });
                }
              } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              }
            };

            const handleFsChange = () => {
              const isFs = !!document.fullscreenElement;
              fsBtn.innerHTML = isFs ? EXIT_FS_SVG : FS_SVG;
              if (!isFs) {
                const fsWrapper = document.getElementById('temp-fs-wrapper');
                if (fsWrapper) {
                  const wasPlaying = !video.paused;
                  const vp = fsWrapper._vPlaceholder;
                  const bp = fsWrapper._bPlaceholder;
                  if (vp && vp.parentNode) { vp.parentNode.insertBefore(video, vp); vp.remove(); }
                  if (bp && bp.parentNode) { bp.parentNode.insertBefore(bar, bp); bp.remove(); }
                  fsWrapper.remove();
                  if (wasPlaying) video.play().catch(() => {});
                }
              }
            };
            handleFsChange();
            document.addEventListener('fullscreenchange', handleFsChange);
            document.addEventListener('webkitfullscreenchange', handleFsChange);

            const disableFullScreen = video.getAttribute('data-disable-fullscreen') === 'true';

            bottomContainer.appendChild(playBtn);
            bottomContainer.appendChild(progContainer);
            bottomContainer.appendChild(timeWrapper);
            bottomContainer.appendChild(repeatBtn);
            bottomContainer.appendChild(dlBtn);
            if (!disableFullScreen) bottomContainer.appendChild(fsBtn);

            bar.appendChild(topContainer);
            bar.appendChild(centerContainer);
            bar.appendChild(bottomContainer);
            mountPoint.appendChild(bar);

            bar._cleanup = () => {
              document.removeEventListener('fullscreenchange', handleFsChange);
              document.removeEventListener('webkitfullscreenchange', handleFsChange);
              if (ro) ro.disconnect();
              video.removeEventListener('play', onPlay);
              video.removeEventListener('pause', onPause);
              video.removeEventListener('timeupdate', onTimeUpdate);
              video.removeEventListener('loadedmetadata', onTimeUpdate);
              video.removeEventListener('volumechange', updateVolumeIcon);
              video.removeAttribute('data-custom-ctrl-active');
              if (mountPoint.style && mountPoint._prevPointerEvents !== undefined) {
                mountPoint.style.pointerEvents = mountPoint._prevPointerEvents;
                delete mountPoint._prevPointerEvents;
              }
            };
          }
        });

        document.querySelectorAll('[id^="custom-ctrl-"]').forEach(bar => {
          const layerId = bar.id.replace('custom-ctrl-', '');
          try {
            const video = document.getElementById(layerId)?.querySelector('video') || document.querySelector(\`[id="\${layerId}"] video\`);
            if (!video || !document.body.contains(video)) {
              if (bar._cleanup) bar._cleanup();
              bar.remove();
            }
          } catch (e) {
            if (bar._cleanup) bar._cleanup();
            bar.remove();
          }
        });
      };

      setInterval(renderVideoControls, 500);
    })();
  </script>
`;

const getIframeContent = (html, pageNumber) => {
    // Extract and dynamically load Google Fonts found in the SVG
    const fontsToLoad = new Set();
    if (html) {
        const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
        const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = cssRegex.exec(html)) !== null) {
            let f = match[1] || match[2];
            if (f) f = f.split(',')[0].replace(/['"]/g, '').trim();
            if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
        }
        while ((match = attrRegex.exec(html)) !== null) {
            let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
            if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
        }
    }

    let fontImports = '';
    if (fontsToLoad.size > 0) {
        const fontList = Array.from(fontsToLoad).map(f => f.replace(/\s+/g, '+')).join('|');
        fontImports = `<link href="https://fonts.googleapis.com/css?family=${fontList}:300,400,500,600,700,800,900&display=swap" rel="stylesheet">`;
    }

    // Inject scripts
    const content = `
        <!DOCTYPE html>
        <html>
            <head>
                ${fontImports}
                <style>
                    html, body { cursor: default !important; -webkit-user-select: none; user-select: none; }
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; width: 100%; height: 100%; }
                    * { box-sizing: border-box; -webkit-user-select: none; user-select: none; }
                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                    [data-interaction="open-link"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="link"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="navigate-to"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="download"][data-interaction-value]:not([data-interaction-value=""]),
                    [data-interaction="zoom"],
                    [data-interaction="tooltip"],
                    [data-interaction="info-box"],
                    [data-interaction="popup"],
                    [data-interaction="slideshow"],
                    [data-interaction="whatsapp"],
                    [data-interaction="call"],
                    [data-interaction="email"],
                    [data-interaction="audio"],
                    [data-interaction="3d-viewer"] {
                        cursor: pointer !important;
                    }

                    /* Children pointer events */
                    [data-interaction="open-link"] *,
                    [data-interaction="link"] *,
                    [data-interaction="navigate-to"] *,
                    [data-interaction="download"] *,
                    [data-interaction="zoom"] *,
                    [data-interaction="tooltip"] *,
                    [data-interaction="info-box"] *,
                    [data-interaction="popup"] *,
                    [data-interaction="slideshow"] *,
                    [data-interaction="whatsapp"] *,
                    [data-interaction="call"] *,
                    [data-interaction="email"] *,
                    [data-interaction="audio"] *,
                    [data-interaction="3d-viewer"] * {
                        cursor: pointer !important;
                    }

                    /* Hide Free Frame dashed border in preview */
                    [data-name="Free Frame"] {
                        stroke: transparent !important;
                    }

                    /* Ensure text inside contentEditable boxes and scrollable features wrap correctly */
                    .text-edit-box,
                    [contenteditable="true"],
                    [data-scrollable="true"],
                    foreignObject div {
                        white-space: pre-wrap !important;
                        word-wrap: break-word !important;
                        word-break: normal !important;
                        overflow-wrap: anywhere !important;
                    }

                    foreignObject {
                        overflow: visible !important;
                        clip-path: none !important;
                    }

                    foreignObject * {
                        clip-path: none !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar,
                    [data-scrollable="true"]::-webkit-scrollbar,
                    [data-scrollable="true"] *::-webkit-scrollbar {
                        width: 6px !important;
                        height: 6px !important;
                        background: transparent !important;
                        display: block !important;
                        -webkit-appearance: none !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-track,
                    [data-scrollable="true"]::-webkit-scrollbar-track,
                    [data-scrollable="true"] *::-webkit-scrollbar-track {
                        background: #E5E7EB !important;
                        border-radius: 10px !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb {
                        background: #4B5563 !important;
                        border-radius: 10px !important;
                        border: none !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb:hover,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb:hover,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb:hover {
                        background: #374151 !important;
                    }

                    .flipbook-text-scrollbar::-webkit-scrollbar-thumb:active,
                    [data-scrollable="true"]::-webkit-scrollbar-thumb:active,
                    [data-scrollable="true"] *::-webkit-scrollbar-thumb:active {
                        background: #1F2937 !important;
                    }

                    foreignObject:not([data-scrollable="true"]):not([data-editing="true"])>div {
                        width: 100% !important;
                        height: auto !important;
                    }

                    foreignObject[data-sizing-mode="fixed"]>div {
                        display: block !important;
                    }

                    foreignObject[data-scrollable="true"]>div {
                        width: 100% !important;
                        height: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        box-sizing: border-box !important;
                        pointer-events: auto !important;
                        -webkit-user-select: text !important;
                        user-select: text !important;
                    }

                    .flipbook-text-outer,
                    foreignObject[data-scrollable="true"]>div.flipbook-text-outer {
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        box-sizing: border-box !important;
                        padding: 24px 6px 24px 16px !important;
                        background-color: var(--bg-fill, transparent) !important;
                        border: calc(var(--bg-stroke-width, 0) * 1px) solid var(--bg-stroke, transparent) !important;
                        border-radius: var(--bg-rx, 0px) !important;
                        position: relative;
                        overflow: hidden !important;
                    }
                    
                    .flipbook-text-viewport {
                        width: 100% !important;
                        height: 100% !important;
                        overflow: hidden !important;
                        position: relative;
                    }
                    
                    .flipbook-text-viewport::after {
                        content: "";
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 14px;
                        height: 24px;
                        background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
                        pointer-events: none;
                        z-index: 10;
                        border-bottom-left-radius: var(--bg-rx, 16px);
                        border-bottom-right-radius: var(--bg-rx, 16px);
                    }
                    
                    .flipbook-text-scrollbar {
                        width: 100% !important;
                        height: 100% !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        display: block !important;
                        box-sizing: border-box !important;
                    }

                    foreignObject[data-scrollable="true"] * {
                        -webkit-user-select: text !important;
                        user-select: text !important;
                        pointer-events: auto !important;
                    }

                    svg * {
                        vector-effect: non-scaling-stroke !important;
                    }
                </style>
                <base href="/">
                ${getSlideshowScript()}
                ${getAnimationScript(pageNumber)}
                ${getInteractionScript(pageNumber)}
                ${getVideoControlsScript()}
                <script>
                    (function() {
                        const isRightPage = ${pageNumber} % 2 !== 0;
                        const handleMove = (e) => {
                            if (!document.hasFocus()) window.focus();
                            try {
                                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                                window.parent.postMessage({
                                    type: 'IFRAME_MOUSEMOVE',
                                    originalClientX: clientX,
                                    originalClientY: clientY,
                                    pageNumber: window._pageNumber
                                }, '*');

                                // Dynamic cursor for drag corners inside iframe
                                const nearCornerX = isRightPage 
                                    ? (window.innerWidth - clientX < 50) 
                                    : (clientX < 50);
                                const nearCornerY = (clientY < 50) || (window.innerHeight - clientY < 50);
                                if (nearCornerX && nearCornerY) {
                                    document.documentElement.style.setProperty('cursor', 'grab', 'important');
                                    document.body.style.setProperty('cursor', 'grab', 'important');
                                } else {
                                    document.documentElement.style.removeProperty('cursor');
                                    document.body.style.removeProperty('cursor');
                                }
                            } catch (err) {}
                        };
                        document.addEventListener('mousemove', handleMove);
                        document.addEventListener('touchmove', handleMove, { passive: true });

                        const handleEnd = (e) => {
                            try {
                                const clientX = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX;
                                const clientY = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientY : e.clientY;
                                window.parent.postMessage({
                                    type: 'IFRAME_MOUSEUP',
                                    originalClientX: clientX,
                                    originalClientY: clientY,
                                    pageNumber: window._pageNumber
                                }, '*');
                            } catch (err) {}
                        };
                        document.addEventListener('mouseup', handleEnd);
                        document.addEventListener('touchend', handleEnd, { passive: true });
                    })();
                </script>
            </head>
            <body>
                ${html || ''}
            </body>
        </html>
    `;
    return content;
};

const BookmarkTab = ({ label, color, pageIndex, currentPage, index, onClick, styleIdx = 1, font = 'Poppins', flipTime = 500, singlePage, spacing = 5 }) => {
    // Determine leaf and flip state physically bound to the leaf structure
    const leafIndex = Math.floor(pageIndex / 2);
    const isFlipped = currentPage >= 2 * leafIndex + 1;

    // Fixed vertical position ensures the tab stays anchored relative to the page
    const topOffsetVW = index * spacing;
    const displayLabel = label.length > 12 ? label.substring(0, 11) + '...' : label;

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                top: 0,
                left: singlePage ? '0%' : '50%',
                width: singlePage ? '100%' : '50%',
                height: '100%',
                transformOrigin: 'left center',
                transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
                zIndex: isFlipped ? 50 - index : 50 + index,
            }}
        >
            <motion.div
                whileHover={{ scale: 1.1, filter: 'brightness(1.1)' }}
                className="absolute flex items-center justify-center cursor-pointer pointer-events-auto origin-center"
                style={{
                    top: `calc(10% + ${topOffsetVW}vw)`,
                    right: '-2vw', // Sticking out of the right edge of the leaf
                    width: '2vw',
                    height: '4.5vw',
                    fontFamily: font,
                    backfaceVisibility: 'visible',
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onClick) onClick(e);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <svg
                    viewBox="0 0 40 98"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                >
                    {color === 'multi-color' && (
                        <defs>
                            <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#FF0000" />
                                <stop offset="20%" stopColor="#FFFF00" />
                                <stop offset="40%" stopColor="#00FF00" />
                                <stop offset="60%" stopColor="#00FFFF" />
                                <stop offset="80%" stopColor="#0000FF" />
                                <stop offset="100%" stopColor="#FF00FF" />
                            </linearGradient>
                        </defs>
                    )}
                    <path d={getBookmarkSVGPath(styleIdx)} fill={color === 'multi-color' ? `url(#grad-${index})` : (color || '#C45A5A')} />
                </svg>
                <span
                    className="relative z-10 text-white font-semibold whitespace-nowrap leading-tight drop-shadow-sm text-center"
                    style={{
                        transform: `rotate(-90deg) scaleX(${isFlipped ? -1 : 1})`,
                        fontSize: '0.65vw',
                        display: 'block'
                    }}
                >
                    {displayLabel}
                </span>
            </motion.div>
        </div>
    );
};

const TooltipOverlay = React.memo(({ tooltip }) => {
    if (!tooltip) return null;
    const { abs, settings } = tooltip;
    if (!settings || !abs) return null;

    const shape = settings.shape || 'bottom-center';
    let cx = abs.left + abs.width / 2;
    let ty = abs.top;

    let containerStyle = {
        position: 'fixed',
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center'
    };

    let tailStyle = {
        width: 0,
        height: 0
    };

    if (shape.startsWith('bottom')) {
        ty = abs.top;
        let transform = 'translate(-50%, -100%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'bottom-left') {
            cx = abs.left;
            transform = 'translate(0%, -100%)';
            tailAlign = { alignSelf: 'flex-start', marginLeft: '12px' };
        } else if (shape === 'bottom-right') {
            cx = abs.left + abs.width;
            transform = 'translate(-100%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginRight: '12px' };
        } else {
            cx = abs.left + abs.width / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginTop: '-8px',
            flexDirection: 'column'
        };
        tailStyle = {
            ...tailStyle,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 2,
            marginTop: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('top')) {
        ty = abs.top + abs.height;
        let transform = 'translate(-50%, 0%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'top-left') {
            cx = abs.left;
            transform = 'translate(0%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginLeft: '12px' };
        } else if (shape === 'top-right') {
            cx = abs.left + abs.width;
            transform = 'translate(-100%, 0%)';
            tailAlign = { alignSelf: 'flex-end', marginRight: '12px' };
        } else {
            cx = abs.left + abs.width / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginTop: '8px',
            flexDirection: 'column'
        };
        tailStyle = {
            ...tailStyle,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 1,
            marginBottom: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('right')) {
        cx = abs.left;
        let transform = 'translate(-100%, -50%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'right-top') {
            ty = abs.top;
            transform = 'translate(-100%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginTop: '8px' };
        } else if (shape === 'right-bottom') {
            ty = abs.top + abs.height;
            transform = 'translate(-100%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginBottom: '8px' };
        } else {
            ty = abs.top + abs.height / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginLeft: '-8px',
            flexDirection: 'row'
        };
        tailStyle = {
            ...tailStyle,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 2,
            marginLeft: '-1px',
            ...tailAlign
        };
    } else if (shape.startsWith('left')) {
        cx = abs.left + abs.width;
        let transform = 'translate(0%, -50%)';
        let tailAlign = { alignSelf: 'center' };

        if (shape === 'left-top') {
            ty = abs.top;
            transform = 'translate(0%, 0%)';
            tailAlign = { alignSelf: 'flex-start', marginTop: '8px' };
        } else if (shape === 'left-bottom') {
            ty = abs.top + abs.height;
            transform = 'translate(0%, -100%)';
            tailAlign = { alignSelf: 'flex-end', marginBottom: '8px' };
        } else {
            ty = abs.top + abs.height / 2;
        }

        containerStyle = {
            ...containerStyle,
            left: cx + 'px',
            top: ty + 'px',
            transform,
            marginLeft: '8px',
            flexDirection: 'row'
        };
        tailStyle = {
            ...tailStyle,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '9px solid ' + (settings.bgColor || '#1F2937'),
            order: 1,
            marginRight: '-1px',
            ...tailAlign
        };
    }

    const isReversedOrder = shape.startsWith('top') || shape.startsWith('left');

    const rawAnimType = settings.animation || settings.animationStyle || 'Default';
    const animType = rawAnimType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    const speed = (settings.speed || settings.animationSpeed || 'Medium').toLowerCase();
    const durationMap = {
        'slow': 0.8,
        'medium': 0.5,
        'fast': 0.25
    };
    const duration = durationMap[speed] || 0.5;

    let outerVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration, ease: 'easeOut' } },
        exit: { opacity: 0, transition: { duration: duration * 0.8, ease: 'easeIn' } }
    };

    if (animType === 'Default') {
        outerVariants = {
            initial: { opacity: 1 },
            animate: { opacity: 1, transition: { duration: 0 } },
            exit: { opacity: 0, transition: { duration: 0 } }
        };
    }

    let innerVariants = {
        initial: {},
        animate: {},
        exit: {}
    };

    if (animType === 'Slide Up') {
        innerVariants = {
            initial: { y: 24 },
            animate: { y: 0, transition: { duration, ease: [0.16, 1, 0.3, 1] } },
            exit: { y: 16, transition: { duration: duration * 0.8, ease: [0.7, 0, 0.84, 0] } }
        };
    } else if (animType === 'Zoom In') {
        innerVariants = {
            initial: { scale: 0.7 },
            animate: { scale: 1, transition: { duration, ease: [0.16, 1, 0.3, 1] } },
            exit: { scale: 0.75, transition: { duration: duration * 0.8, ease: [0.7, 0, 0.84, 0] } }
        };
    } else if (animType === 'Bounce In') {
        const getBounceTransition = (s) => {
            if (s === 'slow') return { type: 'spring', stiffness: 60, damping: 10, mass: 1.2 };
            if (s === 'fast') return { type: 'spring', stiffness: 180, damping: 15, mass: 0.8 };
            return { type: 'spring', stiffness: 100, damping: 12, mass: 1.0 };
        };
        innerVariants = {
            initial: { scale: 0.4 },
            animate: {
                scale: 1,
                transition: getBounceTransition(speed)
            },
            exit: { scale: 0.75, transition: { duration: duration * 0.8, ease: 'easeIn' } }
        };
    }

    const outerContainerStyle = {
        position: 'fixed',
        left: containerStyle.left,
        top: containerStyle.top,
        zIndex: 99999,
        pointerEvents: 'none'
    };

    const middleWrapperStyle = {
        transform: containerStyle.transform,
        marginTop: containerStyle.marginTop || '0px',
        marginLeft: containerStyle.marginLeft || '0px',
        display: 'flex',
        flexDirection: containerStyle.flexDirection,
        alignItems: 'center'
    };

    return (
        <motion.div
            variants={outerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={outerContainerStyle}
        >
            <div style={middleWrapperStyle}>
                <motion.div
                    variants={innerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{
                        display: 'flex',
                        flexDirection: containerStyle.flexDirection,
                        alignItems: 'center',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: settings.bgColor || '#1F2937',
                            color: settings.textColor || '#FFFFFF',
                            fontFamily: settings.fontFamily || 'sans-serif',
                            fontWeight: settings.bold ? 'bold' : (settings.fontWeight === 'Bold' ? '800' : settings.fontWeight === 'Semi Bold' ? '600' : settings.fontWeight === 'Medium' ? '500' : settings.fontWeight === 'Regular' ? '400' : settings.fontWeight === 'Light' ? '200' : settings.fontWeight === 'Extra Light' ? '100' : settings.fontWeight === 'Thin' ? '50' : 'normal'),
                            fontStyle: settings.italic ? 'italic' : 'normal',
                            fontSize: Math.max(9, (settings.fontSize || 14)) + 'px',
                            textAlign: settings.align || 'center',
                            textDecoration: [settings.underline ? 'underline' : '', settings.lineThrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
                            width: (settings.w || 100) + 'px',
                            height: (settings.h || 60) + 'px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            padding: settings.isInfoBox ? '14px' : '7px 14px',
                            borderRadius: '7px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            order: isReversedOrder ? 2 : 1
                        }}
                    >
                        <div
                            style={{
                                width: settings.isWidthAuto ? 'auto' : (settings.textW || 80) + 'px',
                                height: settings.isHeightAuto ? 'auto' : (settings.textH || 40) + 'px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: settings.align === 'left' ? 'flex-start' : settings.align === 'right' ? 'flex-end' : 'center',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {settings.text || 'Tooltip'}
                        </div>
                    </div>
                    {!settings.isInfoBox && <div style={tailStyle} />}
                </motion.div>
            </div>
        </motion.div>
    );
});

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
    bookmarkSpacing = 5,
    onPageClick,
    settings,
    setShowViewBookmarkPopup,
    buildPageDoc, // Accept custom builder
    activeLayout,
    singlePage = false,
    onTurning,
    interactionZoom,
    activeTooltip,
    isTurnJs,
    physicalZoom,
}) => {
    const turnOnFlip = useCallback((evt) => {
        const logicalIndex = typeof evt === 'object' && evt !== null ? evt.data : evt;
        if (onFlip) onFlip({ data: logicalIndex });
    }, [onFlip]);

    const turnOnTurning = useCallback((evt) => {
        const logicalIndex = typeof evt === 'object' && evt !== null ? evt.data : evt;
        if (onTurning) onTurning({ data: logicalIndex });
    }, [onTurning]);

    const zoomStyle = useMemo(() => {
        if (!interactionZoom) {
            return { transition: 'transform 0.3s ease' };
        }

        const { rect, pageNumber, scale } = interactionZoom;
        const pageRatioX = WIDTH / rect.windowWidth;
        const pageRatioY = HEIGHT / rect.windowHeight;
        const centerXInPage = (rect.left + rect.width / 2) * pageRatioX;
        const centerYInPage = (rect.top + rect.height / 2) * pageRatioY;
        const bookX = (pageNumber % 2 === 0 || singlePage ? 0 : WIDTH) + centerXInPage;
        const bookY = centerYInPage;
        return {
            transformOrigin: `${bookX}px ${bookY}px`,
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease'
        };
    }, [interactionZoom, WIDTH, HEIGHT, singlePage, isTurnJs, physicalZoom]);

    const isZoomedIn = interactionZoom && interactionZoom.scale > 1;

    return (
        <div className="relative" style={{ width: singlePage ? WIDTH : WIDTH * 2, height: HEIGHT, opacity: pageOpacity ?? 1, ...zoomStyle, zIndex: isZoomedIn ? 50 : 1 }}>
            {shadowActive && (
                <div
                    className="absolute transition-all duration-700 pointer-events-none"
                    style={{
                        width: singlePage ? WIDTH : BookAppearanceHelpers.getShadowWidth(currentPage, pagesCount, WIDTH),
                        height: HEIGHT,
                        left: singlePage ? '0%' : (BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '75%' ? '50%' :
                            BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '25%' ? '0%' : '0%'),
                        transform: 'translateX(0)',
                        boxShadow: shadowStyle,
                        zIndex: 0,
                        borderRadius: singlePage ? cornerRadius : (BookAppearanceHelpers.getShadowWidth(currentPage, pagesCount, WIDTH) === WIDTH
                            ? (BookAppearanceHelpers.getShadowOffset(currentPage, pagesCount) === '75%'
                                ? `0 ${cornerRadius} ${cornerRadius} 0`
                                : `${cornerRadius} 0 0 ${cornerRadius}`)
                            : cornerRadius)
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
                onTurning={turnOnTurning}
                startPage={targetPage}
                buildPageDoc={buildPageDoc}
                cornerRadius={cornerRadius}
                activeLayout={activeLayout}
                textureStyle={textureStyle}
                singlePage={singlePage}
                pageOpacity={pageOpacity}
                useMouseEvents={settings?.navigation?.dragToTurn ?? true}
            />

            <div
                className="absolute top-0 pointer-events-none"
                style={{ width: '100%', height: '100%', left: '0%', zIndex: 200, perspective: '2000px' }}
            >
                {(() => {
                    if (settings?.navigation?.bookmark === false) return null;
                    const bmItems = settings?.navigation?.bookmarkSettings?.items;
                    if (!bmItems || bmItems.length === 0) return null;
                    return bmItems.map((bm, idx) => {
                        // parse 'Pg X' into pageIndex (0-indexed)
                        const pageNumMatch = bm.page ? bm.page.match(/\d+/) : null;
                        const pageIndex = pageNumMatch ? parseInt(pageNumMatch[0], 10) - 1 : 0;
                        const label = bm.title || '';
                        const color = settings?.navigation?.bookmarkSettings?.color || '#C45A5A';

                        return (
                            <BookmarkTab
                                key={`bm-${idx}`}
                                label={label}
                                color={color}
                                pageIndex={pageIndex}
                                currentPage={currentPage}
                                index={idx}
                                spacing={bookmarkSpacing}
                                styleIdx={settings?.navigation?.bookmarkSettings?.style || 1}
                                font={settings?.navigation?.bookmarkSettings?.font || 'Poppins'}
                                flipTime={flipTime}
                                singlePage={singlePage}
                                onClick={() => {
                                    onPageClick && onPageClick(pageIndex);
                                }}
                            />
                        );
                    });
                })()}
            </div>

            {/* Cursor hint when zoomed in - pointer-events:none so clicks pass through to iframes */}
            {isZoomedIn && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        zIndex: 200,
                        cursor: 'zoom-out',
                        background: 'transparent',
                        pointerEvents: 'none'
                    }}
                />
            )}
            {createPortal(
                <AnimatePresence>
                    {activeTooltip && (
                        <TooltipOverlay key={activeTooltip.elementId || 'tooltip'} tooltip={activeTooltip} />
                    )}
                </AnimatePresence>,
                document.body
            )}
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
    useNativeFullscreen = false,
    bookmarks = [],
    notes = [],
    setBookmarks,
    setNotes,
    isPublishedPreview = false,
    disableAutoGallery = false,
    onFlip: externalOnFlip,
    isLoading = false,
    externalShowTOC = false,
    currentBook,
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

    const settings = React.useMemo(() => {
        const defaultMenuBarSettings = {
            navigation: { nextPrevButtons: true, mouseWheel: true, dragToTurn: true, pageQuickAccess: true, tableOfContents: true, pageThumbnails: true, bookmark: true, startEndNav: true },
            viewing: { zoom: true, fullScreen: true },
            interaction: { search: true, notes: true, gallery: true },
            media: { autoFlip: true, backgroundAudio: true },
            shareExport: { share: true, download: true, contact: true },
            brandingProfile: { logo: true, profile: true },
            tocSettings: { hasSettings: true, isExpanded: false }
        };
        const menuBar = menuBarSettings || defaultMenuBarSettings;
        return {
            ...otherSetupSettings,
            ...menuBar,
            navigation: {
                ...(otherSetupSettings?.navigation || {}),
                ...(menuBar?.navigation || {}),
                bookmarkSettings: {
                    ...(menuBar?.navigation?.bookmarkSettings || {}),
                    ...(otherSetupSettings?.navigation?.bookmarkSettings || {})
                }
            }
        };
    }, [menuBarSettings, otherSetupSettings]);

    const bookRef = useRef();
    const containerRef = useRef();
    const screenRef = useRef();
    const isFlippingRef = useRef(false);
    const lastTapRef = useRef(0);
    const lastSyncPage = useRef(targetPage);
    const lastPreviewOpen = useRef(otherSetupSettings?.gallery?.previewOpen);

    const activeDevice = activeDeviceProp; // Desktop, Tablet, Mobile
    const isPortraitLayout = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
    const isSinglePage = activeDevice === 'Mobile' || (activeDevice === 'Tablet' && isPortraitLayout);
    const isTablet = activeDevice === 'Tablet';
    const isMobile = activeDevice === 'Mobile';
    const isPhysicalTablet = typeof navigator !== 'undefined' && (/(iPad|Tablet|PlayBook|Silk)|(Android(?!.*Mobile))/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    const [isLandscape, setIsLandscape] = useState(activeDevice === 'Desktop' ? window.innerWidth > window.innerHeight : false);

    useEffect(() => {
        if (activeDevice === 'Mobile' || activeDevice === 'Tablet') {
            setIsLandscape(false);
        } else {
            setIsLandscape(window.innerWidth > window.innerHeight);
        }
    }, [activeDevice]);

    useEffect(() => {
        const handleResize = () => {
            if (activeDevice === 'Desktop') {
                setIsLandscape(window.innerWidth > window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeDevice]);

    const isMobileLandscape = isMobile && isLandscape;


    // Responsive scaling logic
    const [manualZoom, setManualZoom] = useState(zoom);
    const manualZoomRef = useRef(manualZoom);
    useEffect(() => { manualZoomRef.current = manualZoom; }, [manualZoom]);
    const [interactionZoom, setInteractionZoom] = useState(null);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [fitScale, setFitScale] = useState(1);
    const [active3DModelUrl, setActive3DModelUrl] = useState(null);
    const [active3DModelVId, setActive3DModelVId] = useState(null);
    const [active3DModelConfig, setActive3DModelConfig] = useState(null);
    // Declare isFullscreen here (before the computeFitScale effect that depends on it)
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isToolbarHidden, setIsToolbarHidden] = useState(false);

    useEffect(() => {
        if (!isFullscreen) {
            setIsToolbarHidden(false);
            return;
        }

        const handleMouseMove = (e) => {
            const EDGE_ZONE = 72;
            const nearEdge = e.clientY < EDGE_ZONE || e.clientY > window.innerHeight - EDGE_ZONE;
            setIsToolbarHidden(!nearEdge);
        };

        const handleMouseLeave = () => setIsToolbarHidden(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isFullscreen]);
    const baseDimensions = useMemo(() => {
        if (pages && pages.length > 0) {
            for (const p of pages) {
                const htmlStr = p.html || p.content || '';
                if (htmlStr) {
                    const match = htmlStr.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
                    if (match && parseFloat(match[3]) > 0 && parseFloat(match[4]) > 0) {
                        return { width: parseFloat(match[3]), height: parseFloat(match[4]) };
                    }
                    const wMatch = htmlStr.match(/<svg[^>]*\bwidth=["']([0-9.]+)(?:px|mm)?["']/i);
                    const hMatch = htmlStr.match(/<svg[^>]*\bheight=["']([0-9.]+)(?:px|mm)?["']/i);
                    if (wMatch && hMatch && parseFloat(wMatch[1]) > 0 && parseFloat(hMatch[1]) > 0) {
                        return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
                    }
                }
            }
        }

        // Fallback: check currentBook, settings, or location state for explicit width / height or templateId + orientation
        const state = (typeof window !== 'undefined' && window.history?.state?.usr) || {};
        const w = currentBook?.width || settings?.width || state?.width;
        const h = currentBook?.height || settings?.height || state?.height;
        if (w && h) {
            return { width: parseFloat(w), height: parseFloat(h) };
        }

        const templateId = (currentBook?.templateId || settings?.templateId || state?.templateId || '').toLowerCase();
        const orientation = (currentBook?.orientation || settings?.orientation || state?.orientation || '').toLowerCase();
        if (templateId) {
            let baseW = 210, baseH = 297;
            if (templateId === 'corporate' || templateId === 'a4') { baseW = 210; baseH = 297; }
            else if (templateId === 'large_catalogue' || templateId === 'a3') { baseW = 297; baseH = 420; }
            else if (templateId === 'mini' || templateId === 'a5') { baseW = 148; baseH = 210; }
            else if (templateId === 'letter') { baseW = 216; baseH = 279; }
            else if (templateId === 'legal') { baseW = 216; baseH = 356; }
            else if (templateId === 'dl') { baseW = 99; baseH = 210; }
            else if (templateId === 'square') { baseW = 210; baseH = 210; }

            if (templateId !== 'square' && orientation === 'landscape') {
                return { width: baseH, height: baseW };
            }
            return { width: baseW, height: baseH };
        }

        if (orientation === 'square') {
            return { width: 210, height: 210 };
        }

        return { width: 210, height: 297 }; // Fallback A4
    }, [pages, currentBook, settings]);

    const isTurnJs = !bookAppearanceSettings?.hardCover;
    const [actualPhysicalZoom, setActualPhysicalZoom] = useState(1);
    const currentZoom = useMemo(() => manualZoom * (activeDevice === 'Desktop' ? 1 : fitScale), [manualZoom, fitScale, activeDevice]);

    useEffect(() => {
        setManualZoom(zoom);
    }, [zoom]);

    useEffect(() => {
        // ── Scroll wheel: zoom directly (no Ctrl needed for turn.js) ──────────
        const handleWheel = (e) => {
            const isInsideFlipbook = e.target.closest?.('.turn-book, #turn-book, [data-turn-book], .flipbook-magazine-wrapper, .fbe-book');
            if (!isInsideFlipbook) return;
            e.preventDefault();
            e.stopPropagation();
            setManualZoom(prev => {
                const delta = e.deltaY < 0 ? 0.05 : -0.05;
                return Math.max(0.5, Math.min(prev + delta, 4));
            });
        };

        // ── Keyboard: Ctrl+= / Ctrl+- ──────────────────────────────────────────
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '0')) {
                e.preventDefault();
                setManualZoom(prev => {
                    if (e.key === '0') return 1; // Ctrl+0 reset
                    const newZoom = (e.key === '=' || e.key === '+') ? prev + 0.05 : prev - 0.05;
                    return Math.max(0.5, Math.min(newZoom, 4));
                });
            }
        };



        // ── Pinch-to-zoom (touch) ─────────────────────────────────────────────
        let pinchStartDist = null;
        let pinchStartZoom = 1;

        const getPinchDist = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.hypot(dx, dy);
        };

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                const isInsideFlipbook = e.target.closest?.('.turn-book, #turn-book, [data-turn-book], .flipbook-magazine-wrapper, .fbe-book');
                if (!isInsideFlipbook) return;
                pinchStartDist = getPinchDist(e.touches);
                pinchStartZoom = manualZoomRef.current ?? 1;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && pinchStartDist !== null) {
                e.preventDefault();
                const dist = getPinchDist(e.touches);
                const ratio = dist / pinchStartDist;
                const newZoom = Math.max(0.5, Math.min(pinchStartZoom * ratio, 4));
                setManualZoom(newZoom);
            }
        };

        const handleTouchEnd = () => {
            pinchStartDist = null;
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('touchmove', handleTouchMove, { passive: false });
            container.addEventListener('touchend', handleTouchEnd);
        }
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!screenRef.current) {
            setFitScale(1);
            return;
        }

        const computeFitScale = () => {
            const screen = screenRef.current;
            if (!screen) return;

            const { clientWidth, clientHeight } = screen;
            const isCurrentlyFullscreen = (document.fullscreenElement === containerRef.current) || isFullscreen;

            const wFactor = isCurrentlyFullscreen ? (isToolbarHidden ? 0.80 : 0.70) : 0.70;
            const hFactor = isCurrentlyFullscreen ? (isToolbarHidden ? 0.85 : 0.80) : 0.80;

            const availableW = clientWidth * wFactor;
            const availableH = clientHeight * hFactor;

            // Calculate effective zoom (manualZoom only, interactionZoom is handled via CSS transform)
            // The user wants NO CSS scaling for manual zoom, meaning we apply the scale directly to the physical dimensions
            let baseZoom = manualZoom;

            // In fullscreen we might have a scaling factor applied externally
            if (isCurrentlyFullscreen) {
                baseZoom = baseZoom;
            }

            // Use the template editor height and width ratio
            const availablePageW = isSinglePage ? availableW : availableW / 2;
            const availablePageH = availableH;

            const scaleX = availablePageW / baseDimensions.width;
            const scaleY = availablePageH / baseDimensions.height;
            const scale = Math.min(scaleX, scaleY);

            const physicalZoom = baseZoom;

            setWIDTH(Math.round(baseDimensions.width * scale * physicalZoom));
            setHEIGHT(Math.round(baseDimensions.height * scale * physicalZoom));
            setActualPhysicalZoom(physicalZoom);
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
    }, [activeDevice, isSidebarOpen, isFullscreen, isToolbarHidden, zoom, manualZoom, interactionZoom, baseDimensions, isTurnJs]);

    const setCurrentZoom = useCallback((val) => {
        if (typeof val === 'function') {
            setManualZoom(prev => val(prev));
        } else {
            setManualZoom(val);
        }
    }, []);
    const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showNotesMenu, setShowNotesMenu] = useState(false);
    const [isAutoFlipping, setIsAutoFlipping] = useState(false);
    const [countdown, setCountdown] = useState(null);

    // Page dimensions (A4 ratio) dynamically scaled
    const [WIDTH, setWIDTH] = useState(400);
    const [HEIGHT, setHEIGHT] = useState(566);

    const [currentPage, setCurrentPage] = useState(targetPage);
    const [offset, setOffset] = useState(() => {
        // Compute the correct initial offset so first page is centered from the very first render
        if (targetPage === 0) return -(400 / 2); // WIDTH = 400, half-page shift left for cover
        if (targetPage >= (pages?.length ?? 0) - 1 && (pages?.length ?? 0) % 2 === 0) {
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
    const [activePopupInteraction, setActivePopupInteraction] = useState(null);
    const [activeSlideshowInteraction, setActiveSlideshowInteraction] = useState(null);

    // Audio Logic (Centralized in Sound.jsx)
    // Audio state (for UI/Layout sync)
    const [isMuted, setIsMuted] = useState(false);
    const [isFlipMuted, setIsFlipMuted] = useState(false);
    const [flipTrigger, setFlipTrigger] = useState(0);

    // Independent Audio state for Mobile Layouts
    const [mobileIsMuted, setMobileIsMuted] = useState(false);
    const [mobileIsFlipMuted, setMobileIsFlipMuted] = useState(false);
    const [mobileFlipTrigger, setMobileFlipTrigger] = useState(0);

    const lastSoundLogicalRef = useRef(null);

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
        return [...pages];
    }, [pages]);

    useEffect(() => {
        if (!disableAutoGallery && !isPublishedPreview && otherSetupSettings?.gallery?.previewOpen && otherSetupSettings.gallery.previewOpen !== lastPreviewOpen.current) {
            setShowGalleryPopup(true);
            lastPreviewOpen.current = otherSetupSettings.gallery.previewOpen;
        }
    }, [otherSetupSettings?.gallery?.previewOpen, isPublishedPreview, disableAutoGallery]);

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
    const [showTOC, setShowTOC] = useState(false);

    // Open TOC popup when triggered from MenuBar settings icon click
    useEffect(() => {
        if (externalShowTOC) {
            setShowTOC(true);
        }
    }, [externalShowTOC]);
    const [showExportPopup, setShowExportPopup] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');




    const deviceStyles = {
        Desktop: { width: '100%', height: '100%', borderRadius: '0', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', flex: 1 },
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
    };

    const getScreenWrapperStyle = () => {
        if (activeDevice === 'Desktop') return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 };
        if (activeDevice === 'Tablet' && !isPublishedPreview) return {
            position: 'absolute',
            top: '9.38%',
            bottom: '7.7%',
            left: '5.3%',
            right: '6.6%',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        };
        return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 };
    };



    const layout1Bookmarks = bookmarks;
    const layout2Bookmarks = bookmarks;
    const layout3Bookmarks = bookmarks;
    const layout4Bookmarks = bookmarks;
    const layout5Bookmarks = bookmarks;
    const layout6Bookmarks = bookmarks;
    const layout7Bookmarks = bookmarks;
    const layout8Bookmarks = bookmarks;
    const layout9Bookmarks = bookmarks;

    const layout1Notes = useMemo(() => notes.filter(n => n.layoutId === 1), [notes]);
    const layout2Notes = useMemo(() => notes.filter(n => n.layoutId === 2), [notes]);
    const layout3Notes = useMemo(() => notes.filter(n => n.layoutId === 3), [notes]);
    const layout4Notes = useMemo(() => notes.filter(n => n.layoutId === 4), [notes]);
    const layout5Notes = useMemo(() => notes.filter(n => n.layoutId === 5), [notes]);
    const layout6Notes = useMemo(() => notes.filter(n => n.layoutId === 6), [notes]);
    const layout7Notes = useMemo(() => notes.filter(n => n.layoutId === 7), [notes]);
    const layout8Notes = useMemo(() => notes.filter(n => n.layoutId === 8), [notes]);
    const layout9Notes = useMemo(() => notes.filter(n => n.layoutId === 9), [notes]);

    const currentBookmarks = bookmarks;
    const currentNotes = useMemo(() => notes.filter(n => n.layoutId === Number(activeLayout)), [notes, activeLayout]);

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
        console.log('🔄 PreviewArea: setShowTOCMemo triggered with value:', val);
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
    const setShowNotesMenuMemo = useCallback((val) => setShowNotesMenu(val), []);


    const setShowGalleryPopupMemo = useCallback((val) => setShowGalleryPopup(val), []);
    const setShowSoundPopupMemo = useCallback((val) => {
        if (val) {
            setShowTOC(false);
            setShowThumbnailBar(false);
            setShowAddBookmarkPopup(false);
            setShowAddNotesPopup(false);
            setShowNotesViewer(false);
            if (Number(activeLayout) !== 4) {
                setShowMoreMenu(false);
            }
        }
        setShowSoundPopup(val);
    }, [activeLayout]);

    const onAddNote = useCallback((note) => {
        if (setNotes) {
            setNotes(prev => [...prev, { ...note, layoutId: activeLayout }]);
        }
    }, [activeLayout, setNotes]);

    const onAddBookmark = useCallback((bookmark) => {
        if (setBookmarks) {
            setBookmarks(prev => [...prev, bookmark]);
        }
    }, [setBookmarks]);

    const onDeleteBookmark = useCallback((id) => {
        if (setBookmarks) {
            setBookmarks(prev => prev.filter(b => b.id !== id));
        }
    }, [setBookmarks]);

    const onUpdateBookmark = useCallback((id, newLabel) => {
        if (setBookmarks) {
            setBookmarks(prev => prev.map(b => b.id === id ? { ...b, label: newLabel } : b));
        }
    }, [setBookmarks]);

    const onPageClick = useCallback((index) => {
        bookRef.current?.pageFlip()?.turnToPage(index);
    }, []);

    // Listen to page navigation events sent from the page iframe
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data && e.data.type === 'navigate-to-page') {
                const targetIdx = e.data.page - 1; // Convert 1-indexed to 0-indexed
                if (targetIdx >= 0 && targetIdx < pages.length) {
                    onPageClick(targetIdx);
                }
            } else if (e.data && e.data.type === 'zoom-to-element') {
                const { rect, speed, pageNumber } = e.data;
                const scale = speed === 'Fast' ? 2.5 : speed === 'Slow' ? 1.5 : 2;
                setInteractionZoom({ scale, rect, pageNumber });
            } else if (e.data && e.data.type === 'zoom-out-element') {
                // Step 1: animate scale back to 1 (smooth, same origin)
                setInteractionZoom(prev => prev ? { ...prev, scale: 1 } : null);
                // Step 2: after transition, clear completely
                setTimeout(() => setInteractionZoom(null), 550);
            } else if (e.data && e.data.type === 'download-file') {
                const forceDownload = async (url, filename) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error("Network error during download");
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = filename || 'download';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                    } catch (error) {
                        console.error('Download failed, falling back to open:', error);
                        window.open(url, '_blank');
                    }
                };

                try {
                    const meta = JSON.parse(e.data.value);
                    if (meta.data) {
                        forceDownload(meta.data, meta.name || 'download');
                    }
                } catch (err) {
                    forceDownload(e.data.value, 'download');
                }
            } else if (e.data && e.data.type === 'open-email') {
                if (e.data.target === '_blank') {
                    window.open('mailto:' + e.data.value, '_blank');
                } else {
                    window.location.href = 'mailto:' + e.data.value;
                }
            } else if (e.data && e.data.type === 'show-tooltip') {
                setActiveTooltip(e.data);
            } else if (e.data && e.data.type === 'hide-tooltip') {
                setActiveTooltip(null);
            } else if (e.data && e.data.type === 'show-popup-interaction') {
                setActivePopupInteraction(e.data);
            } else if (e.data && e.data.type === 'hide-popup-interaction') {
                setActivePopupInteraction(null);
            } else if (e.data && e.data.type === 'show-slideshow-interaction') {
                setActiveSlideshowInteraction({ ...e.data, currentIndex: 0 });
            } else if (e.data && e.data.type === 'hide-slideshow-interaction') {
                setActiveSlideshowInteraction(null);
            } else if (e.data && e.data.type === 'show-3d-viewer' && e.data.url) {
                let finalUrl = e.data.url;
                if (typeof finalUrl === 'string' && finalUrl.startsWith('/uploads/')) {
                    finalUrl = resolveUploadsPath(finalUrl);
                }
                setActive3DModelUrl(finalUrl);

                setActive3DModelVId(e.data.v_id || null);
                if (e.data.config) {
                    setActive3DModelConfig(e.data.config);
                } else {
                    setActive3DModelConfig(null);
                }
            }
        };
        window.addEventListener('message', handleMessage);

        const handleOpenTOCPreview = () => {
            setShowTOCMemo(true);
        };
        window.addEventListener('open-toc-preview', handleOpenTOCPreview);

        const handleOpenProfilePreview = () => {
            setShowProfilePopup(true);
        };
        window.addEventListener('open-profile-preview', handleOpenProfilePreview);

        const handleCloseProfilePreview = () => {
            setShowProfilePopup(false);
        };
        window.addEventListener('close-profile-preview', handleCloseProfilePreview);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('open-toc-preview', handleOpenTOCPreview);
            window.removeEventListener('open-profile-preview', handleOpenProfilePreview);
            window.removeEventListener('close-profile-preview', handleCloseProfilePreview);
        };
    }, [pages, onPageClick, setShowTOCMemo, setShowProfilePopup]);

    const handleZoomIn = useCallback(() => setManualZoom(prev => Math.min(prev + 0.05, 2)), []);
    const handleZoomOut = useCallback(() => setManualZoom(prev => Math.max(prev - 0.05, 0.5)), []);
    const handleFullScreen = useCallback(() => {
        if (!isFullscreen) {
            setIsFullscreen(true);
        } else if (!document.fullscreenElement && useNativeFullscreen) {
            if (!containerRef.current) return;
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            setIsFullscreen(false);
        }
    }, [useNativeFullscreen, isFullscreen]);

    useEffect(() => {
        if (!useNativeFullscreen) return;
        const onFSChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, [useNativeFullscreen]);

    const handleShare = useCallback(() => {
        // Close export/download popup first
        setShowExportPopup(false);
        // Open share popup after the call stack to avoid immediate closure by outside click handlers
        setTimeout(() => setShowSharePopup(true), 0);
    }, []);

    const handleDownload = useCallback(() => {
        // Close share popup first
        setShowSharePopup(false);
        // Open export/download popup after the call stack
        setTimeout(() => setShowExportPopup(true), 0);
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



    // Click inside preview area (background) to close menus
    useEffect(() => {
        const handleClickInside = (e) => {
            // 1. Only handle if click is inside the PreviewArea container
            if (!containerRef.current || !containerRef.current.contains(e.target)) {
                return;
            }

            // 2. Don't close if clicking on interactive elements (buttons, inputs, etc.) or popups
            // This ensures buttons to open popups still work and clicking inside popups doesn't close them.
            if (e.target.closest('button, input, textarea, select, a, [role="button"], .fbe-book, .fisto-menu-content, .thumbnail-bar')) {
                return;
            }

            setShowBookmarkMenu(false);
            setShowMoreMenu(false);
            setShowThumbnailBar(false);
            setShowTOC(false);
            setShowSoundPopup(false);
            setShowNotesMenu(false);
            setShowGalleryPopup(false);
        };
        document.addEventListener('click', handleClickInside);
        return () => document.removeEventListener('click', handleClickInside);
    }, [containerRef]);

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

        if (externalOnFlip) {
            externalOnFlip(logicalIndex);
        }

        // Compute offset for UI centering
        let newOffset = 0;
        const totalPages = augmentedPages.length || pages.length;
        if (logicalIndex === 0) {
            newOffset = -(WIDTH / 2);
        } else if (logicalIndex === totalPages - 1) {
            // For the back cover, shift to center the single page
            newOffset = (logicalIndex % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2);
        } else {
            newOffset = 0;
        }
        setOffset(newOffset);

        // Signal a flip to the Sound component
        if (lastSoundLogicalRef.current !== logicalIndex) {
            lastSoundLogicalRef.current = logicalIndex;
            setFlipTrigger(prev => prev + 1);
            setMobileFlipTrigger(prev => prev + 1);
        }

        // Fix for iframe cursor issue: Blur parent buttons so iframe can capture focus
        if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    }, [pages.length, WIDTH, useHardCover, externalOnFlip]);

    const onTurning = useCallback((e) => {
        const logicalIndex = e.data;
        if (logicalIndex !== currentPage) {
            setCurrentPage(logicalIndex);

            if (externalOnFlip) {
                externalOnFlip(logicalIndex);
            }

            // Signal a flip to the Sound component when turning starts
            if (lastSoundLogicalRef.current !== logicalIndex) {
                lastSoundLogicalRef.current = logicalIndex;
                setFlipTrigger(prev => prev + 1);
                setMobileFlipTrigger(prev => prev + 1);
            }
        }

        // Fix for iframe cursor issue: Blur parent buttons so iframe can capture focus
        if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            document.activeElement.blur();
        }
    }, [currentPage, externalOnFlip])


    useEffect(() => {
        const visiblePages = [];
        if (currentPage === 0) {
            visiblePages.push(1);
        } else if (currentPage >= pages.length - 1) {
            visiblePages.push(pages.length);
        } else {
            visiblePages.push(currentPage + 1);
            if (currentPage + 2 <= pages.length) visiblePages.push(currentPage + 2);
        }

        if (containerRef.current) {
            containerRef.current.querySelectorAll('iframe').forEach(iframe => {
                try {
                    iframe.contentWindow?.postMessage({ type: 'PAGE_TURNED', visiblePages }, '*');
                } catch (err) { /* cross-origin iframe – skip */ }
            });
        }

        const handleMessage = (e) => {
            if (e.data && e.data.type === 'REQUEST_PAGE_STATE') {
                if (e.source) {
                    e.source.postMessage({ type: 'PAGE_TURNED', visiblePages }, '*');
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentPage, pages.length]);

    const bookRendererProps = {
        augmentedPages,
        WIDTH,
        HEIGHT,
        baseDimensions,
        flipTime,
        flipStyle, // Pass flipStyle to TurnJsBookRenderer
        useHardCover,
        makeFirstLastPageHard,
        selectCustomHardPages,
        customHardPages,
        targetPage,
        bookRef,
        onFlip,
        onTurning,
        cornerRadius,
        pageOpacity,
        textureStyle,
        shadowActive,
        shadowStyle,
        currentPage,
        singlePage: isSinglePage,
        pagesCount: pages.length,
        onPageClick,
        settings,
        setShowViewBookmarkPopup,
        buildPageDoc: getIframeContent,
        activeLayout,
        interactionZoom,
        activeTooltip,
        isTurnJs,
        physicalZoom: actualPhysicalZoom,
        style: (() => {
            if (!interactionZoom) return { transition: 'transform 0.5s ease', transform: 'scale(1)', transformOrigin: 'center center' };
            const { scale, rect, pageNumber } = interactionZoom;
            const originX = ((rect.left + rect.width / 2) / rect.windowWidth) * 100;
            const originY = ((rect.top + rect.height / 2) / rect.windowHeight) * 100;
            let finalOriginX = originX;
            if (activeDevice !== 'Mobile') {
                const isRightPage = pageNumber % 2 !== 0;
                finalOriginX = isRightPage ? 50 + (originX / 2) : originX / 2;
            }
            return {
                transform: `scale(${scale})`,
                transformOrigin: `${finalOriginX}% ${originY}%`,
                transition: 'transform 0.5s ease',
                zIndex: 50
            };
        })()
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

        // 2. If lead form is disabled, hide it (even when editing)
        if (!leadFormSettings || !leadFormSettings.enabled) {
            setShowLeadForm(false);
            return;
        }

        // 3. Force show lead form if we are explicitly editing it in the sidebar and it's enabled
        if (activeSubView === 'leadform' && !onClose) {
            setShowLeadForm(true);
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
        } else if (timing !== 'after-seconds') {
            setShowLeadForm(false);
        }
    }, [currentPage, leadFormSettings, leadFormSubmitted, pages.length, activeSubView, onClose]);

    // Separate useEffect for after-seconds to prevent resetting timer on page change
    useEffect(() => {
        let timeoutId;
        
        // Only run timer in full preview (onClose exists) or when we are not hiding it
        if (leadFormSettings?.enabled && !leadFormSubmitted && leadFormSettings.appearance?.timing === 'after-seconds' && (onClose || activeSubView === 'leadform')) {
            const afterSeconds = leadFormSettings.appearance.afterSeconds || 30;
            timeoutId = setTimeout(() => {
                setShowLeadForm(true);
            }, afterSeconds * 1000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [leadFormSettings?.enabled, leadFormSettings?.appearance?.timing, leadFormSettings?.appearance?.afterSeconds, leadFormSubmitted, activeSubView, onClose]);



    // Consistently handle centering offset across all layouts and engines
    useEffect(() => {
        // Inject global styles for the progress bar thumb
        const thumbStyleId = 'global-custom-video-progress-style';
        if (!document.getElementById(thumbStyleId)) {
          const ts = document.createElement('style');
          ts.id = thumbStyleId;
          ts.textContent = `
            input.custom-video-progress {
              -webkit-appearance: none !important;
              appearance: none !important;
              accent-color: transparent !important;
            }
            input.custom-video-progress::-webkit-slider-thumb {
              -webkit-appearance: none !important;
              appearance: none !important;
              width: 6px !important;
              height: 6px !important;
              border-radius: 50% !important;
              background: #ffffff !important;
              cursor: pointer !important;
              box-shadow: none !important;
              border: none !important;
              margin-top: -2.5px !important;
            }
            input.custom-video-progress::-moz-range-thumb {
              width: 6px !important;
              height: 6px !important;
              border-radius: 50% !important;
              background: #ffffff !important;
              cursor: pointer !important;
              border: none !important;
              box-shadow: none !important;
            }
            input.custom-video-progress::-webkit-slider-runnable-track {
              height: 1px !important;
              background: rgba(255,255,255,0.4) !important;
              border-radius: 1px !important;
            }
            .custom-video-overlay {
              opacity: 0;
              background: transparent;
              transition: opacity 0.3s ease, background 0.3s ease !important;
            }
            .custom-video-overlay.is-paused,
            .custom-video-overlay.video-is-hovered,
            [id]:hover > .custom-video-overlay,
            [id]:hover > foreignObject > .custom-video-overlay,
            foreignObject:hover > .custom-video-overlay,
            .custom-video-overlay:hover {
              opacity: 1 !important;
              background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%) !important;
            }
          `;
          document.head.appendChild(ts);
        }

        let intervalId;
        const renderVideoControls = () => {
          document.querySelectorAll('[data-page-index] video, foreignObject video').forEach(v => {
            if (!v.hasAttribute('data-custom-ctrl-active')) {
              v.controls = false;
              v.removeAttribute('controls');
            }
          });

          const videos = document.querySelectorAll('.page-svg-container video, .flipbook-magazine-wrapper video');
          videos.forEach(video => {
            const fo = video.closest('foreignObject');
            const liveEl = fo ? (fo.closest('[id]') || fo) : (video.closest('[id]') || video);
            const layerId = liveEl.id;
            if (!layerId) return;

            const showControls = video.getAttribute('data-show-controls') !== 'false';
            
            // APPLY CUSTOM VIDEO PROPERTIES
            const pbSpeedStr = video.getAttribute('data-playback-speed');
            if (pbSpeedStr) {
               const pbSpeed = parseFloat(pbSpeedStr.replace('x', ''));
               if (!isNaN(pbSpeed)) video.playbackRate = pbSpeed;
            }

            if (!video.hasAttribute('data-video-props-applied')) {
                video.setAttribute('data-video-props-applied', 'true');
                
                const defVolStr = video.getAttribute('data-default-volume');
                if (defVolStr) {
                    video.volume = parseInt(defVolStr) / 100;
                }

                const startTimeAttr = video.getAttribute('data-start-time');
                let sTime = 0;
                if (startTimeAttr) {
                  const parts = startTimeAttr.split(':').map(Number);
                  if (parts.length === 3) sTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  else if (parts.length === 2) sTime = parts[0] * 60 + parts[1];
                }
                const endTimeAttr = video.getAttribute('data-end-time');
                let eTime = Infinity;
                if (endTimeAttr) {
                  const parts = endTimeAttr.split(':').map(Number);
                  if (parts.length === 3) eTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  else if (parts.length === 2) eTime = parts[0] * 60 + parts[1];
                }
                video._startTime = sTime;
                video._endTime = eTime;
                
                if (sTime > 0) {
                   video.currentTime = sTime;
                }

                video.addEventListener('timeupdate', () => {
                   if (video._startTime > 0 && video.currentTime < video._startTime - 0.5) {
                       video.currentTime = video._startTime;
                   }
                   if (video._endTime < Infinity && video.currentTime >= video._endTime) {
                       if (video.loop) {
                           video.currentTime = video._startTime;
                       } else {
                           video.pause();
                       }
                   }
                });
                
                const resumeBehavior = video.getAttribute('data-resume-behavior');
                if (resumeBehavior === "Start from Beginning") {
                    video.addEventListener('play', () => {
                        if (video._wasPaused) {
                            video.currentTime = video._startTime || 0;
                        }
                        video._wasPaused = false;
                    });
                    video.addEventListener('pause', () => {
                        video._wasPaused = true;
                    });
                }

                const playVideoWhile = video.getAttribute('data-play-video-while');
                if (playVideoWhile === "Auto Play While on Page") {
                    video.play().catch(()=>{});
                } else if (playVideoWhile === "Click to Play") {
                    video.pause();
                }
            }

            const ctrlId = `custom-ctrl-${layerId}`;
            let bar = document.getElementById(ctrlId);



            const mountPoint = video.parentElement || fo || liveEl;
            if (!mountPoint) return;

            if (bar && bar._video !== video) {
              if (bar._cleanup) bar._cleanup();
              bar.remove();
              bar = null;
            }

            if (bar) {
              const repBtn = bar.querySelector('.custom-repeat-btn');
              if (repBtn) repBtn.style.opacity = video.loop ? '1' : '0.5';
              
              const topC = bar.querySelector('.custom-top-container');
              const centerC = bar.querySelector('.custom-center-container');
              const progC = bar.querySelector('.custom-prog-container');
              const timeW = bar.querySelector('.custom-time-wrapper');
              
              if (topC) topC.style.visibility = showControls ? 'visible' : 'hidden';
              if (centerC) centerC.style.visibility = showControls ? 'visible' : 'hidden';
              if (progC) progC.style.visibility = showControls ? 'visible' : 'hidden';
              if (timeW) timeW.style.visibility = showControls ? 'visible' : 'hidden';
              if (repBtn) repBtn.style.visibility = showControls ? 'visible' : 'hidden';
            }

            if (!bar) {
              video.controls = false;
              video.removeAttribute('controls');
              video.setAttribute('data-custom-ctrl-active', 'true');

              if (mountPoint.style) {
                mountPoint.style.position = 'relative';
                if (!mountPoint._prevPointerEvents) {
                  mountPoint._prevPointerEvents = mountPoint.style.pointerEvents || '';
                }
                mountPoint.style.pointerEvents = 'none';
              }

              if (!window._videoHoverTrackerAdded) {
                window._videoHoverTrackerAdded = true;
                window.addEventListener('pointermove', (e) => {
                  document.querySelectorAll('.custom-video-overlay').forEach(b => {
                    const rect = b.getBoundingClientRect();
                    const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                      e.clientY >= rect.top && e.clientY <= rect.bottom;
                    if (isInside) b.classList.add('video-is-hovered');
                    else b.classList.remove('video-is-hovered');
                  });
                });
              }

              bar = document.createElement('div');
              bar.id = ctrlId;
              bar._video = video;
              bar.className = 'custom-video-overlay' + (video.paused ? ' is-paused' : '');
              Object.assign(bar.style, {
                position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2% 3%', boxSizing: 'border-box', zIndex: '9999', pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 100%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%)',
              });

              const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                  const w = entry.contentRect.width || entry.target.offsetWidth;
                  if (w > 0) bar.style.fontSize = (w * 0.01) + 'px';
                }
              });
              ro.observe(bar);

              const topContainer = document.createElement('div');
              topContainer.className = 'custom-top-container';
              Object.assign(topContainer.style, { display: 'flex', justifyContent: 'flex-end', width: '100%', pointerEvents: 'none' });
              
              const volumeBtn = document.createElement('button');
              Object.assign(volumeBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '7em', height: '7em', pointerEvents: 'auto', opacity: '0.8' });
              const VOL_ON_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
              const VOL_OFF_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
              
              const updateVolumeIcon = () => { volumeBtn.innerHTML = (video.muted || video.volume === 0) ? VOL_OFF_SVG : VOL_ON_SVG; };
              updateVolumeIcon();
              volumeBtn.onclick = (e) => { e.stopPropagation(); video.muted = !video.muted; if(video.muted) video.setAttribute('muted',''); else video.removeAttribute('muted'); updateVolumeIcon(); };
              video.addEventListener('volumechange', updateVolumeIcon);
              topContainer.appendChild(volumeBtn);

              const centerContainer = document.createElement('div');
              centerContainer.className = 'custom-center-container';
              Object.assign(centerContainer.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2%', flexGrow: '1', pointerEvents: 'none', boxSizing: 'border-box' });
              
              const REWIND_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>`;
              const FORWARD_ICON = `<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>`;
              
              const createSkipBtn = (icon, delta) => {
                const btn = document.createElement('button');
                Object.assign(btn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', position: 'relative' });
                const tw = document.createElement('div');
                Object.assign(tw.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', [delta < 0 ? 'marginLeft' : 'marginRight']: '0.5em' });
                const t = document.createElement('div');
                t.textContent = "3s";
                Object.assign(t.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', pointerEvents: 'none' });
                tw.appendChild(t);
                if (delta < 0) { btn.innerHTML = icon; btn.appendChild(tw); }
                else { btn.appendChild(tw); btn.insertAdjacentHTML('beforeend', icon); }
                btn.onclick = (e) => { e.stopPropagation(); video.currentTime += delta; };
                return btn;
              };
              
              centerContainer.appendChild(createSkipBtn(REWIND_ICON, -3));
              centerContainer.appendChild(createSkipBtn(FORWARD_ICON, 3));

              const bottomContainer = document.createElement('div');
              Object.assign(bottomContainer.style, { display: 'flex', alignItems: 'center', width: '100%', gap: '2em', pointerEvents: 'none', paddingBottom: '2%', paddingLeft: '2%', paddingRight: '2%', boxSizing: 'border-box' });
              
              const PLAY_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
              const PAUSE_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
              const playBtn = document.createElement('button');
              Object.assign(playBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: "8em", height: "8em", pointerEvents: 'auto', flexShrink: '0' });
              const onPlay = () => { playBtn.innerHTML = PAUSE_SVG; bar.classList.remove('is-paused'); };
              const onPause = () => { playBtn.innerHTML = PLAY_SVG; bar.classList.add('is-paused'); };
              playBtn.innerHTML = video.paused ? PLAY_SVG : PAUSE_SVG;
              video.addEventListener('play', onPlay);
              video.addEventListener('pause', onPause);
              playBtn.onclick = (e) => { e.stopPropagation(); video.paused ? video.play() : video.pause(); };
              
              const progContainer = document.createElement('div');
              progContainer.className = 'custom-prog-container';
              Object.assign(progContainer.style, { flexGrow: '1', height: '1.2em', background: 'rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', borderRadius: '0.2em' });
              const progFill = document.createElement('div');
              Object.assign(progFill.style, { position: 'absolute', top: '0', left: '0', bottom: '0', width: '0%', background: 'white', pointerEvents: 'none', borderRadius: '0.2em' });
              progContainer.appendChild(progFill);
              
              const timeWrapper = document.createElement('div');
              timeWrapper.className = 'custom-time-wrapper';
              Object.assign(timeWrapper.style, { position: 'relative', width: '28em', height: '8em', flexShrink: '0', marginLeft: '1em' });
              const timeDisplay = document.createElement('div');
              Object.assign(timeDisplay.style, { position: 'absolute', top: '50%', left: '0', width: 'max-content', fontSize: '10em', transform: 'translateY(-50%) scale(0.35)', transformOrigin: 'left center', fontFamily: 'Inter, sans-serif', color: 'white', pointerEvents: 'none' });
              timeDisplay.textContent = "00:00 / 00:00";
              timeWrapper.appendChild(timeDisplay);
              
              const formatTime = (sec) => {
                if (isNaN(sec)) return "00:00";
                const m = Math.floor(sec / 60).toString().padStart(2, '0');
                const s = Math.floor(sec % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
              };
              
              const onTimeUpdate = () => {
                if (video.duration) {
                  progFill.style.width = `${(video.currentTime / video.duration) * 100}%`;
                  timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
                }
              };
              video.addEventListener('timeupdate', onTimeUpdate);
              video.addEventListener('loadedmetadata', onTimeUpdate);
              onTimeUpdate();
              
              progContainer.onpointerdown = (e) => {
                e.stopPropagation();
                const rect = progContainer.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                if (video.duration) video.currentTime = pct * video.duration;
                const onMove = (me) => {
                  const p = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                  if (video.duration) video.currentTime = p * video.duration;
                };
                const onUp = () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
              };

              const REPEAT_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;
              const repeatBtn = document.createElement('button');
              repeatBtn.className = 'custom-repeat-btn';
              Object.assign(repeatBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0', opacity: video.loop ? '1' : '0.5' });
              repeatBtn.innerHTML = REPEAT_SVG;
              repeatBtn.onclick = (e) => { e.stopPropagation(); video.loop = !video.loop; if(video.loop) video.setAttribute('loop',''); else video.removeAttribute('loop'); repeatBtn.style.opacity = video.loop ? '1' : '0.5'; };

              const FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
              const EXIT_FS_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
              const fsBtn = document.createElement('button');
              Object.assign(fsBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });
              
              const fsStyleId = 'custom-fs-style';
              if (!document.getElementById(fsStyleId)) {
                const style = document.createElement('style');
                style.id = fsStyleId;
                style.innerHTML = `
                  foreignObject:fullscreen, foreignObject:-webkit-full-screen, foreignObject:-moz-full-screen { width: 100vw !important; height: 100vh !important; background: black !important; transform: none !important; }
                  foreignObject:fullscreen video, foreignObject:-webkit-full-screen video, foreignObject:-moz-full-screen video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
                  #temp-fs-wrapper .custom-video-overlay { font-size: 0.3vw !important; }
                  #temp-fs-wrapper .custom-video-overlay svg { stroke-width: 2.5 !important; }
                  #temp-fs-wrapper .custom-video-overlay .time-display { margin-right: 0 !important; }
                `;
                document.head.appendChild(style);
              }

              const updateFsIcon = () => { fsBtn.innerHTML = document.fullscreenElement ? EXIT_FS_SVG : FS_SVG; };
              updateFsIcon();
              
              fsBtn.onclick = (e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) {
                  const fsWrapper = document.createElement('div');
                  fsWrapper.id = 'temp-fs-wrapper';
                  Object.assign(fsWrapper.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'black', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center' });
                  const vPlaceholder = document.createComment('video-placeholder');
                  const bPlaceholder = document.createComment('bar-placeholder');
                  video.parentElement.insertBefore(vPlaceholder, video);
                  bar.parentElement.insertBefore(bPlaceholder, bar);
                  const wasPlaying = !video.paused;
                  fsWrapper.appendChild(video);
                  fsWrapper.appendChild(bar);
                  document.body.appendChild(fsWrapper);
                  fsWrapper._vPlaceholder = vPlaceholder;
                  fsWrapper._bPlaceholder = bPlaceholder;
                  const reqFs = fsWrapper.requestFullscreen || fsWrapper.webkitRequestFullscreen;
                  if (reqFs) {
                    reqFs.call(fsWrapper).then(() => { if (wasPlaying) video.play().catch(() => {}); }).catch(err => {
                      if (vPlaceholder.parentNode) vPlaceholder.parentNode.insertBefore(video, vPlaceholder);
                      if (bPlaceholder.parentNode) bPlaceholder.parentNode.insertBefore(bar, bPlaceholder);
                      vPlaceholder.remove(); bPlaceholder.remove(); fsWrapper.remove();
                    });
                  }
                } else {
                  if (document.exitFullscreen) document.exitFullscreen();
                  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
              };
              
              const handleFsChange = () => {
                const isFs = !!document.fullscreenElement;
                fsBtn.innerHTML = isFs ? EXIT_FS_SVG : FS_SVG;
                if (!isFs) {
                  const fsWrapper = document.getElementById('temp-fs-wrapper');
                  if (fsWrapper) {
                    const wasPlaying = !video.paused;
                    const vp = fsWrapper._vPlaceholder;
                    const bp = fsWrapper._bPlaceholder;
                    if (vp && vp.parentNode) { vp.parentNode.insertBefore(video, vp); vp.remove(); }
                    if (bp && bp.parentNode) { bp.parentNode.insertBefore(bar, bp); bp.remove(); }
                    fsWrapper.remove();
                    if (wasPlaying) video.play().catch(() => {});
                  }
                }
              };
              document.addEventListener('fullscreenchange', handleFsChange);
              document.addEventListener('webkitfullscreenchange', handleFsChange);

              const disableFullScreen = video.getAttribute('data-disable-fullscreen') === 'true';

              bottomContainer.appendChild(playBtn);
              bottomContainer.appendChild(progContainer);
              bottomContainer.appendChild(timeWrapper);
              bottomContainer.appendChild(repeatBtn);
              if (!disableFullScreen) {
                 bottomContainer.appendChild(fsBtn);
              }

              bar.appendChild(topContainer);
              bar.appendChild(centerContainer);
              bar.appendChild(bottomContainer);
              mountPoint.appendChild(bar);

              bar._cleanup = () => {
                document.removeEventListener('fullscreenchange', handleFsChange);
                document.removeEventListener('webkitfullscreenchange', handleFsChange);
                if (ro) ro.disconnect();
                video.removeEventListener('play', onPlay);
                video.removeEventListener('pause', onPause);
                video.removeEventListener('timeupdate', onTimeUpdate);
                video.removeEventListener('loadedmetadata', onTimeUpdate);
                video.removeEventListener('volumechange', updateVolumeIcon);
                video.removeAttribute('data-custom-ctrl-active');
                if (mountPoint.style && mountPoint._prevPointerEvents !== undefined) {
                  mountPoint.style.pointerEvents = mountPoint._prevPointerEvents;
                }
              };
            }
          });
        };

        intervalId = setInterval(renderVideoControls, 200);
        return () => {
          clearInterval(intervalId);
          document.querySelectorAll('.custom-video-overlay').forEach(b => { if (b._cleanup) b._cleanup(); b.remove(); });
        };
    }, []);

    // Consistently handle centering offset across all layouts and engines
    useEffect(() => {
        if (!pages || pages.length === 0) {
            setOffset(0);
            return;
        }

        const totalPages = augmentedPages.length || pages.length;
        // Soft cover (turn.js): Shift left to center the front cover, shift right to center the back cover
        if (currentPage === 0) {
            setOffset(-(WIDTH / 2));
        } else if (currentPage >= totalPages - 2) {
            setOffset((currentPage % 2 === 0) ? -(WIDTH / 2) : (WIDTH / 2));
        } else {
            setOffset(0);
        }
    }, [currentPage, pages.length, augmentedPages.length, WIDTH, useHardCover]);

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
                    activeLayout={activeLayout}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    bookmarkSettings={settings.navigation?.bookmarkSettings?.[activeLayout] || settings.navigation?.bookmarkSettings}
                    layoutColors={layoutColors?.[activeLayout]}
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
                    activeLayout={activeLayout}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    layoutColors={layoutColors?.[activeLayout]}
                />

            )}

            {showNotesViewer && (
                <NotesViewerPopup
                    onClose={() => setShowNotesViewer(false)}
                    notes={notes.filter(n => n.layoutId === activeLayout)}
                    isSidebarOpen={isSidebarOpen}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    layoutColors={layoutColors?.[activeLayout]}
                    activeLayout={activeLayout}
                />

            )}

            {showViewBookmarkPopup && Number(activeLayout) !== 5 && (
                <ViewBookmarkPopup
                    onClose={() => setShowViewBookmarkPopup(false)}
                    bookmarks={bookmarks}
                    onDelete={onDeleteBookmark}
                    onUpdate={onUpdateBookmark}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowViewBookmarkPopup(false);
                    }}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isBigBars={settings.toolbar?.isBigBars}
                    layoutColors={layoutColors?.[activeLayout]}
                />

            )}

            {showProfilePopup && ![4, 5, '4', '5'].includes(activeLayout) && (
                <ProfilePopup
                    onClose={() => setShowProfilePopup(false)}
                    profileSettings={profileSettings}
                    addTextBelowIcons={settings?.toolbar?.addTextBelowIcons}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    isEditor={!onClose}
                    isFullscreen={isFullscreen}
                    isSidebarOpen={isSidebarOpen}
                />
            )}

            <Sound
                isOpen={showSoundPopup}
                onClose={() => setShowSoundPopup(false)}
                activeLayout={activeLayout}
                otherSetupSettings={otherSetupSettings}
                onUpdateOtherSetup={onUpdateOtherSetup}
                isSidebarOpen={isSidebarOpen}
                isMuted={activeDevice === 'Mobile' ? mobileIsMuted : isMuted}
                setIsMuted={activeDevice === 'Mobile' ? setMobileIsMuted : setIsMuted}
                isFlipMuted={activeDevice === 'Mobile' ? mobileIsFlipMuted : isFlipMuted}
                setIsFlipMuted={activeDevice === 'Mobile' ? setMobileIsFlipMuted : setIsFlipMuted}
                flipTrigger={activeDevice === 'Mobile' ? mobileFlipTrigger : flipTrigger}
                settings={settings}
                isTablet={isTablet}
                isMobile={isMobile}
                isLandscape={isLandscape}
                isEditor={!onClose}
                isFullscreen={isFullscreen}
                isLoading={isLoading}
            />

            {showTOC && !((isMobile && !isLandscape) || [4, 5, 6, 7].includes(Number(activeLayout))) && !isTablet && (
                <TableOfContentsPopup
                    onClose={() => setShowTOC(false)}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowTOC(false);
                    }}
                    settings={settings.tocSettings}
                    addTextBelowIcons={settings?.toolbar?.addTextBelowIcons}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isLandscape={isLandscape}
                    isSidebarOpen={isSidebarOpen}
                    isEditor={!onClose}
                    isFullscreen={isFullscreen}
                    layoutColors={layoutColors}
                />
            )}

            {showSharePopup && createPortal(
                <ShareModal
                    isOpen={showSharePopup}
                    onClose={() => setShowSharePopup(false)}
                    flipbookUrl={currentBook?.shareUrl}
                    flipbookThumbnail={currentBook?.thumbnail}
                    currentBook={currentBook}
                    activeLayout={activeLayout}
                />,
                document.body
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

            {showGalleryPopup && activeDevice !== 'Tablet' && (<GalleryPopup
                onClose={() => setShowGalleryPopupMemo(false)}
                settings={otherSetupSettings?.gallery}
                popupSettings={menuBarSettings?.appearance?.popup}
                isTablet={isTablet}
                activeLayout={activeLayout}
                isLandscape={isLandscape}
                isMobileLandscape={isMobileLandscape}
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

    const commonLayoutProps = {
        settings,
        bookName,
        activeLayout,
        hideHeader,
        searchQuery,
        setSearchQuery,
        handleQuickSearch,
        logoSettings,
        logoObjectFit,
        logoCropStyle,
        onPageClick,
        currentPage,
        pages,
        bookRef,
        showBookmarkMenu,
        setShowBookmarkMenu: setShowBookmarkMenuMemo,
        showMoreMenu,
        setShowMoreMenu: setShowMoreMenuMemo,
        showThumbnailBar,
        setShowThumbnailBar: setShowThumbnailBarMemo,
        showTOC,
        setShowTOC: setShowTOCMemo,
        showNotesMenu,
        setShowNotesMenu: setShowNotesMenuMemo,
        showExportPopup,
        setShowExportPopup,
        showSharePopup,
        setShowSharePopup,
        showProfilePopup,
        setShowProfilePopup,
        setShowAddNotesPopup: setShowAddNotesPopupMemo,
        setShowNotesViewer: setShowNotesViewerMemo,
        setShowAddBookmarkPopup: setShowAddBookmarkPopupMemo,
        setShowViewBookmarkPopup,
        setShowGalleryPopup: setShowGalleryPopupMemo,
        showSoundPopup,
        setShowSoundPopup: setShowSoundPopupMemo,
        isAutoFlipping,
        setIsPlaying,
        currentZoom,
        handleZoomIn,
        handleZoomOut,
        handleFullScreen,
        handleShare,
        handleDownload,
        offset,
        backgroundSettings: layoutBackgroundSettings,
        backgroundStyle: layoutBackgroundStyle,
        isMuted: mobileIsMuted,
        setIsMuted: setMobileIsMuted,
        isFlipMuted: mobileIsFlipMuted,
        setIsFlipMuted: setMobileIsFlipMuted,
        flipTrigger: mobileFlipTrigger,
        onToggleAudio: handleToggleAudio,
        isSidebarOpen,
        isFullscreen,
        isTablet,
        isMobile,
        isLandscape,
        isMobileLandscape
    };

    const backgroundLayers = (
        <>
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
            {backgroundSettings?.animation && backgroundSettings.animation !== 'None' && animationComponents[backgroundSettings.animation] && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {React.createElement(animationComponents[backgroundSettings.animation], { backgroundSettings, backgroundStyle })}
                </div>
            )}
        </>
    );

    return (
        <div
            ref={containerRef}
            id="preview-area-root"
            className={`flex-1 flex flex-col relative min-h-0 select-none overflow-hidden ${activeDevice !== 'Desktop' ? 'items-center justify-center' : ''}`}
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

            {backgroundLayers}

            {activeDevice === 'Mobile' ? (
                (() => {
                    const mobileContent = (
                        <div ref={screenRef} className="w-full h-full relative overflow-hidden">
                            {backgroundLayers}

                            <style>{`
                                #preview-area-root .flipbook-magazine-wrapper {
                                    transition: transform ${flipTime}ms ease-in-out !important;
                                }
                            `}</style>

                            <MobileLayoutRenderer
                                {...commonLayoutProps}
                                bookmarks={currentBookmarks}
                                notes={currentNotes}
                            >
                                <TurnJsBookRenderer
                                    {...bookRendererProps}
                                    bookmarks={currentBookmarks}
                                    bookmarkSpacing={5}
                                    singlePage={true}
                                />
                            </MobileLayoutRenderer>

                            {renderSharedOverlays()}

                            {/* Lead Form Overlay */}
                            {showLeadForm && (
                                <LeadFormPopup
                                    leadFormSettings={leadFormSettings}
                                    isTablet={isTablet}
                                    isMobile={true}
                                    onClose={() => setLeadFormSubmitted(true)}
                                />
                            )}
                        </div>
                    );

                    const isPhysicalMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                    return isPhysicalMobile ? mobileContent : (
                        <MobileFrame isLandscape={isLandscape} hideHomeIndicator={Number(activeLayout) === 1 || Number(activeLayout) === 2 || Number(activeLayout) === 7 || Number(activeLayout) === 8 || (Number(activeLayout) === 3 && !isLandscape)}>
                            {mobileContent}
                        </MobileFrame>
                    );
                })()
            ) : (
                <>
                    {/* Tablet Outer Background Layer */}
                    {activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none"
                            style={{ ...backgroundStyle, opacity: 0.4 }}
                        />
                    )}
                    {activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet && backgroundSettings?.style === 'ReactBits' && backgroundSettings.reactBitType && backgroundComponents[backgroundSettings.reactBitType] && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
                            {React.createElement(backgroundComponents[backgroundSettings.reactBitType])}
                        </div>
                    )}

                    <div style={{ ...((activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet) ? deviceStyles.Tablet : deviceStyles.Desktop), zIndex: 10 }} className="relative">
                        {/* Floor shadow effect for Tablet bottom (using the style of the SVG) */}
                        {activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet && (
                            <svg
                                viewBox="0 0 1000 100"
                                preserveAspectRatio="none"
                                className="absolute left-1/2 -translate-x-1/2 z-[-1] pointer-events-none opacity-60 -bottom-[6%] w-[94%] h-[7%]"
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

                            {backgroundLayers}

                            <style>{`
                                #preview-area-root .flipbook-magazine-wrapper {
                                    transition: transform ${flipTime}ms ease-in-out !important;
                                }
                            `}</style>

                            {showGalleryPopup && activeDevice === 'Tablet' && (
                                <TabletGalleryPopup
                                    onClose={() => setShowGalleryPopupMemo(false)}
                                    settings={otherSetupSettings?.gallery}
                                    popupSettings={menuBarSettings?.appearance?.popup}
                                />
                            )}

                            {activeDevice === 'Tablet' && (!activeLayout || Number(activeLayout) === 1) ? (
                                <TabletLayout1
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
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    showViewBookmarkPopup={showViewBookmarkPopup}
                                    setShowProfilePopup={setShowProfilePopup}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    isAutoFlipping={isAutoFlipping}
                                    setIsPlaying={setIsPlaying}
                                    currentZoom={currentZoom}
                                    handleZoomIn={handleZoomIn}
                                    handleZoomOut={handleZoomOut}
                                    handleFullScreen={handleFullScreen}
                                    handleShare={handleShare}
                                    handleDownload={handleDownload}
                                    offset={isSinglePage ? 0 : offset}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    isSidebarOpen={isSidebarOpen}
                                    isFullscreen={isFullscreen}
                                    isTablet={isTablet}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout1>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 2 ? (
                                <TabletLayout2
                                    bookRef={bookRef}
                                    currentPage={currentPage}
                                    pages={pages}
                                    offset={isSinglePage ? 0 : offset}
                                    onPageClick={onPageClick}
                                    settings={settings}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    handleDownload={handleDownload}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout2>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 3 ? (
                                <TabletLayout3
                                    bookRef={bookRef}
                                    currentPage={currentPage}
                                    pages={pages}
                                    offset={isSinglePage ? 0 : offset}
                                    onPageClick={onPageClick}
                                    settings={settings}
                                    bookName={bookName}
                                    showTOC={showTOC}
                                    setShowTOCMemo={setShowTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopupMemo={setShowExportPopup}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout3Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout3>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 9 ? (
                                <TabletLayout9
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
                                    showProfilePopup={showProfilePopup}
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
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopupMemo={setShowExportPopup}
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout9Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout9>
                            ) : Number(activeLayout) === 2 ? (
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
                                    showProfilePopup={showProfilePopup}
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
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout2Bookmarks}
                                        bookmarkSpacing={5}
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
                                    showProfilePopup={showProfilePopup}
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
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    isEditor={!onClose}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout3Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </Grid3Layout>
                            ) : Number(activeLayout) === 4 ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout4
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
                                        showProfilePopup={showProfilePopup}
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
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        isSidebarOpen={isSidebarOpen}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        isEditor={!onClose}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout4Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout4>
                                ) : (
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        isEditor={!onClose}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout4Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid4Layout>
                                )
                            ) : Number(activeLayout) === 5 ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout5
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
                                        showProfilePopup={showProfilePopup}
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
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout5Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout5>
                                ) : (
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout5Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid5Layout>
                                )
                            ) : (Number(activeLayout) === 6) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout6 gallerySettings={otherSetupSettings?.gallery}
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
                                    showSharePopup={showSharePopup}
                                    setShowSharePopup={setShowSharePopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopup={setShowExportPopup}
                                    showGalleryPopup={showGalleryPopup}
                                    handleFullScreen={handleFullScreen}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
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
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout6Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout6>
                                ) : (
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
                                    showSharePopup={showSharePopup}
                                    setShowSharePopup={setShowSharePopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopup={setShowExportPopup}
                                    showGalleryPopup={showGalleryPopup}
                                    handleFullScreen={handleFullScreen}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
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
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout6Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid6Layout>
                                )
                            ) : (Number(activeLayout) === 7) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout7
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout7Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout7>
                                ) : (
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout7Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid7Layout>
                                )
                            ) : (Number(activeLayout) === 8) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout8
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
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
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout8>
                                ) : (
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
                                        showProfilePopup={showProfilePopup}
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
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
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
                                            bookmarkSpacing={5}
                                        />
                                    </Grid8Layout>
                                )
                            ) : (Number(activeLayout) === 9) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout9
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
                                        showProfilePopup={showProfilePopup}
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
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout9Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout9>
                                ) : (
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
                                    showProfilePopup={showProfilePopup}
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
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
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
                                        bookmarkSpacing={5}
                                    />
                                </Grid9Layout>
                                )
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
                                    bookRef={bookRef}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    showSharePopup={showSharePopup}
                                    showExportPopup={showExportPopup}
                                    isSidebarOpen={isSidebarOpen}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    notes={notes}
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
                                    setShowNotesMenuMemo={setShowNotesMenuMemo}
                                    showNotesMenu={showNotesMenu}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    showViewBookmarkPopup={showViewBookmarkPopup}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
                                    setIsPlaying={setIsPlaying}
                                    isAutoFlipping={isAutoFlipping}
                                    currentZoom={currentZoom}
                                    handleZoomIn={handleZoomIn}
                                    handleZoomOut={handleZoomOut}
                                    handleFullScreen={handleFullScreen}
                                    handleShare={handleShare}
                                    handleDownload={handleDownload}
                                    offset={isSinglePage ? 0 : offset}
                                    bookmarks={layout1Bookmarks}
                                    isFullscreen={isFullscreen}
                                    layoutColors={settings?.layoutColors?.[1] ? {
                                        primary: settings.layoutColors[1].find(c => c.label === 'Icons color')?.hex || '#575C9C',
                                        secondary: settings.layoutColors[1].find(c => c.label === 'Bottom bar BG color')?.hex || '#E3E4EF'
                                    } : {
                                        primary: '#575C9C',
                                        secondary: '#E3E4EF'
                                    }}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
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

                    <AnimatePresence>
                        {activePopupInteraction && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-[2vw]"

                                onClick={() => setActivePopupInteraction(null)}
                            >
                                <motion.div
                                    initial={(() => {
                                        const anim = activePopupInteraction?.animation || 'Fade In /Out';
                                        if (anim === 'Slide Up') return { y: 50, opacity: 0 };
                                        if (anim === 'Slide Down') return { y: -50, opacity: 0 };
                                        if (anim === 'Zoom In') return { scale: 0.5, opacity: 0 };
                                        return { opacity: 0 }; // Fade In /Out
                                    })()}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={(() => {
                                        const anim = activePopupInteraction?.animation || 'Fade In /Out';
                                        if (anim === 'Slide Up') return { y: 50, opacity: 0 };
                                        if (anim === 'Slide Down') return { y: -50, opacity: 0 };
                                        if (anim === 'Zoom In') return { scale: 0.5, opacity: 0 };
                                        return { opacity: 0 };
                                    })()}
                                    transition={{ 
                                        duration: (() => {
                                            const s = activePopupInteraction?.speed || 'Medium';
                                            if (s === 'Slow') return 0.6;
                                            if (s === 'Fast') return 0.15;
                                            return 0.3; // Medium
                                        })(),
                                        ease: "easeOut" 
                                    }}
                                    className="relative pointer-events-auto flex items-center justify-center"
                                    style={{
                                        width: (() => {
                                            if (!activePopupInteraction?.html) return '800px';
                                            const match = activePopupInteraction.html.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
                                            if (match) {
                                                const w = parseFloat(match[3]);
                                                return w ? `${w}px` : '800px';
                                            }
                                            return '800px';
                                        })(),
                                        maxWidth: '90%',
                                        maxHeight: '90%',
                                        aspectRatio: (() => {
                                            if (!activePopupInteraction?.html) return '4/3';
                                            const match = activePopupInteraction.html.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
                                            if (match) {
                                                const w = parseFloat(match[3]);
                                                const h = parseFloat(match[4]);
                                                if (w && h) return `${w}/${h}`;
                                            }
                                            return '4/3';
                                        })(),
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => setActivePopupInteraction(null)}
                                        className="absolute top-[0.5vw] right-[4vw] md:top-1.5 md:right-[5.5vw] z-[100001] bg-white rounded-full p-[0.6vw] md:p-2 shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"

                                    >
                                        <Icon icon="lucide:x" className="w-[1.5vw] h-[1.5vw] md:w-5 md:h-5 text-gray-700" />
                                    </button>
                                    <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: activePopupInteraction.html }} />
                                </motion.div>
                            </motion.div>
                        )}
                        {activeSlideshowInteraction && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-[2vw]"
                                onClick={() => setActiveSlideshowInteraction(null)}
                            >
                                <button
                                    onClick={() => setActiveSlideshowInteraction(null)}
                                    className="absolute top-[2vw] right-[2vw] z-[100001] bg-white rounded-full p-[0.6vw] md:p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-100 transition-colors border border-gray-200"
                                >
                                    <Icon icon="lucide:x" className="w-[1.5vw] h-[1.5vw] md:w-5 md:h-5 text-gray-700" />
                                </button>
                                
                                <div className="relative w-full h-full max-w-[55vw] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 p-[1vw] flex items-center justify-center overflow-hidden" style={{ perspective: '1200px' }} onClick={e => e.stopPropagation()}>
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={activeSlideshowInteraction.currentIndex}
                                            src={activeSlideshowInteraction.images[activeSlideshowInteraction.currentIndex]?.data || activeSlideshowInteraction.images[activeSlideshowInteraction.currentIndex]?.url}
                                            initial={(() => {
                                                const effect = activeSlideshowInteraction.effect || 'Play Cards';
                                                if (effect === 'Spring Bounce') return { scale: 0.3, opacity: 0 };
                                                if (effect === 'Cover Flow') return { x: 300, rotateY: -60, scale: 0.7, opacity: 0 };
                                                if (effect === 'Slide') return { x: 300, opacity: 0 };
                                                if (effect === 'Zoom') return { scale: 0.5, opacity: 0 };
                                                if (effect === 'Drop') return { y: -300, opacity: 0 };
                                                if (effect === '3D Flip') return { rotateY: 90, opacity: 0 };
                                                if (effect === 'Play Cards') return { scale: 0.8, y: 100, opacity: 0, rotateZ: -8 };
                                                return { opacity: 0 }; // Fade
                                            })()}
                                            animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotateY: 0, rotateZ: 0 }}
                                            exit={(() => {
                                                const effect = activeSlideshowInteraction.effect || 'Play Cards';
                                                if (effect === 'Spring Bounce') return { scale: 1.5, opacity: 0 };
                                                if (effect === 'Cover Flow') return { x: -300, rotateY: 60, scale: 0.7, opacity: 0 };
                                                if (effect === 'Slide') return { x: -300, opacity: 0 };
                                                if (effect === 'Zoom') return { scale: 1.2, opacity: 0 };
                                                if (effect === 'Drop') return { y: 300, opacity: 0 };
                                                if (effect === '3D Flip') return { rotateY: -90, opacity: 0 };
                                                if (effect === 'Play Cards') return { scale: 0.8, y: -100, opacity: 0, rotateZ: 8 };
                                                return { opacity: 0 }; // Fade
                                            })()}
                                            transition={(() => {
                                                const s = activeSlideshowInteraction.speed || 'Medium';
                                                let dur = 0.5;
                                                if (s === 'Slow') dur = 0.8;
                                                if (s === 'Fast') dur = 0.3;
                                                
                                                if (activeSlideshowInteraction.effect === 'Spring Bounce') {
                                                    return { type: 'spring', bounce: 0.6, duration: dur * 1.5 };
                                                }
                                                return { duration: dur, ease: "easeInOut" };
                                            })()}
                                            className="absolute max-w-[95%] max-h-[95%] object-contain rounded-[0.5vw]"
                                        />
                                    </AnimatePresence>

                                    {/* Arrows */}
                                    {activeSlideshowInteraction.images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveSlideshowInteraction(prev => ({
                                                        ...prev,
                                                        currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
                                                    }));
                                                }}
                                                className="absolute left-[0.5vw] bg-white/90 hover:bg-white rounded-full p-[0.6vw] shadow-lg z-[100001] backdrop-blur-sm transition-transform hover:scale-110"
                                            >
                                                <Icon icon="lucide:chevron-left" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveSlideshowInteraction(prev => ({
                                                        ...prev,
                                                        currentIndex: (prev.currentIndex + 1) % prev.images.length
                                                    }));
                                                }}
                                                className="absolute right-[0.5vw] bg-white/90 hover:bg-white rounded-full p-[0.6vw] shadow-lg z-[100001] backdrop-blur-sm transition-transform hover:scale-110"
                                            >
                                                <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {active3DModelUrl && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 z-[100000] bg-black/80 flex items-center justify-center p-[2vw]"
                                onClick={() => setActive3DModelUrl(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="relative w-full h-full max-w-[80vw] max-h-[80vh] bg-white rounded-[1vw] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="absolute top-[1vw] right-[1vw] z-50 flex gap-[1vw]">
                                        <button
                                            onClick={() => setActive3DModelUrl(null)}
                                            className="w-[2.5vw] h-[2.5vw] bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-colors"
                                        >
                                            <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
                                        </button>
                                    </div>
                                    <div className="flex-1 w-full h-full relative">
                                        <Interaction3DPreview
                                            isOpen={true}
                                            dataUrl={active3DModelUrl}
                                            vId={active3DModelVId}
                                            {...(active3DModelConfig || {})}
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </>
            )}

            {interactionZoom?.active && (
                <div
                    className="absolute inset-0 z-[9999]"
                    style={{ cursor: 'zoom-out' }}
                    onClick={() => setInteractionZoom(null)}
                />
            )}
        </div>
    );
});

export default PreviewArea;
