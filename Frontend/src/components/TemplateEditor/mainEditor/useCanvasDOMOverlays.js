import { useEffect, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { NavIconRenderer } from '../../CustomizedEditor/popups/NavIconStylesPopup';
import { DotRenderer } from '../../CustomizedEditor/popups/DotStylesPopup';
import { getVisualBBox } from './geometryUtils';

/**
 * Hook managing canvas DOM overlays:
 * - Slideshow pagination dots and hover navigation arrows
 * - Global dynamic scrollbars observer (custom scrollbar thumbs and backgrounds)
 * - Inside/Outside stroke position rendering via SVG masks and clipPaths
 */
export const useCanvasDOMOverlays = ({ activePageIndex = 0 }) => {
  // ── Global Slideshow UI Manager ───────────────────────────────────────────
  // Maintains pagination dots and hover arrows for all slideshows even when not selected
  useEffect(() => {
    const renderOverlays = () => {
      const slideshows = document.querySelectorAll('[data-is-slideshow="true"]');
      slideshows.forEach(el => {
        // Skip if selected (SlideshowProperties handles it)
        if (el._slideshowManual) {
          const existing = el._globalSsOverlay;
          if (existing) {
            existing.remove();
            delete el._globalSsOverlay;
          }
          return;
        }

        const dataStr = el.getAttribute('data-slideshow');
        if (!dataStr) return;
        let data;
        try { data = JSON.parse(dataStr); } catch { return; }

        const settings = data.settings || {};
        const images = data.images || [];
        if (images.length < 2) return;

        const activeIndex = parseInt(el.getAttribute('data-active-index') || '0');
        const pageContainer = el.closest('.page-svg-container');
        if (!pageContainer) return;

        let overlay = el._globalSsOverlay;
        if (!overlay || !pageContainer.contains(overlay)) {
          overlay = document.createElement('div');
          overlay.className = 'global-ss-overlay';
          Object.assign(overlay.style, {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: '9998',
          });
          pageContainer.style.position = 'relative';
          if (pageContainer.style.overflow !== 'visible') {
            pageContainer.style.overflow = 'visible';
          }
          pageContainer.appendChild(overlay);
          el._globalSsOverlay = overlay;

          let leaveTimeout = null;
          const handleEnter = () => {
            if (leaveTimeout) clearTimeout(leaveTimeout);
            overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
              btn.style.opacity = '1';
              btn.style.pointerEvents = 'auto';
            });
            el._isHovering = true;
          };
          const handleLeave = () => {
            leaveTimeout = setTimeout(() => {
              overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
                btn.style.opacity = '0';
                btn.style.pointerEvents = 'none';
              });
              el._isHovering = false;
            }, 50);
          };

          overlay.addEventListener('mouseenter', handleEnter);
          overlay.addEventListener('mouseleave', handleLeave);
          el.addEventListener('mouseenter', handleEnter);
          el.addEventListener('mouseleave', handleLeave);

          overlay._cleanupHover = () => {
            if (leaveTimeout) clearTimeout(leaveTimeout);
            overlay.removeEventListener('mouseenter', handleEnter);
            overlay.removeEventListener('mouseleave', handleLeave);
            el.removeEventListener('mouseenter', handleEnter);
            el.removeEventListener('mouseleave', handleLeave);
          };
        }

        const containerRect = pageContainer.getBoundingClientRect();

        let elRect;
        try {
          const bbox = getVisualBBox(el);
          const ctm = el.getScreenCTM();
          const pt = el.ownerSVGElement.createSVGPoint();
          const corners = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x, y: bbox.y + bbox.height },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
          ];
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (let c of corners) {
            pt.x = c.x; pt.y = c.y;
            const mapped = pt.matrixTransform(ctm);
            if (mapped.x < minX) minX = mapped.x;
            if (mapped.y < minY) minY = mapped.y;
            if (mapped.x > maxX) maxX = mapped.x;
            if (mapped.y > maxY) maxY = mapped.y;
          }
          elRect = { left: minX, top: minY, right: maxX, bottom: maxY, width: maxX - minX, height: maxY - minY };
        } catch {
          elRect = el.getBoundingClientRect();
        }

        const scaleX = containerRect.width / (pageContainer.offsetWidth || 1);
        const scaleY = containerRect.height / (pageContainer.offsetHeight || 1);
        const localLeft = (elRect.left - containerRect.left) / scaleX;
        const localTop = (elRect.top - containerRect.top) / scaleY;
        const localWidth = elRect.width / scaleX;
        const localHeight = elRect.height / scaleY;

        overlay.style.left = localLeft + 'px';
        overlay.style.top = localTop + 'px';
        overlay.style.width = localWidth + 'px';
        overlay.style.height = localHeight + 'px';

        const scaleFactor = Math.max(0.4, Math.min(1.8, localWidth / 300));

        const { dotColor = '#000000', navIconColor = '#000000', showDots = true, showArrows = true, showNav = true } = settings;

        const signature = JSON.stringify({
          imagesCount: images.length,
          scaleFactor: scaleFactor.toFixed(2),
          dotColor, navIconColor, showDots, showArrows, showNav
        });

        if (overlay.dataset.signature !== signature) {
          overlay.dataset.signature = signature;
          overlay.innerHTML = '';

          const showNavArrows = showArrows !== false && showNav !== false;
          if (showNavArrows) {
            ['prev', 'next'].forEach(type => {
              const btn = document.createElement('button');
              btn.className = 'editor-ss-nav editor-ss-nav-' + type;
              const size = 48 * scaleFactor;
              const offset = 12 * scaleFactor;
              Object.assign(btn.style, {
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [type === 'prev' ? 'left' : 'right']: offset + 'px',
                zIndex: '10',
                background: 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: size + 'px',
                height: size + 'px',
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
              const svgSize = 32 * scaleFactor;

              // We'll use a container inside the button for React to render into
              const iconContainer = document.createElement('div');
              Object.assign(iconContainer.style, {
                width: svgSize + 'px',
                height: svgSize + 'px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              });
              btn.appendChild(iconContainer);

              const root = createRoot(iconContainer);
              const iconKey = type === 'prev' ? 'left' : 'right';
              // Default to style 1 if navStyle is missing
              const styleId = settings.navStyle || 1;
              root.render(NavIconRenderer({ styleId, size: svgSize + 'px', color: navIconColor })[iconKey]);

              // Attach the root to the btn so we can clean it up later if needed
              btn._reactRoot = root;

              // btn.addEventListener('mouseenter', () => btn.style.transform = `translateY(-50%) scale(1.25)`);
              btn.addEventListener('mouseleave', () => btn.style.transform = `translateY(-50%)`);
              btn.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
              btn.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                let next = type === 'prev' ? parseInt(el.getAttribute('data-active-index') || '0') - 1 : parseInt(el.getAttribute('data-active-index') || '0') + 1;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                el.setAttribute('data-active-index', next.toString());
                el._lastSlideTime = Date.now();

                const evt = new CustomEvent('force-slideshow-advance', { detail: { el, nextIndex: next } });
                window.dispatchEvent(evt);
              });
              overlay.appendChild(btn);
            });
          }

          if (showDots) {
            let dotsWrap = overlay.querySelector('.editor-ss-dots-wrap');
            if (!dotsWrap) {
              dotsWrap = document.createElement('div');
              dotsWrap.className = 'editor-ss-dots-wrap';
              Object.assign(dotsWrap.style, {
                position: 'absolute',
                bottom: (8 * scaleFactor) + 'px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: (5 * scaleFactor) + 'px',
                alignItems: 'center',
                pointerEvents: 'auto',
              });
              overlay.appendChild(dotsWrap);
            }

            if (!dotsWrap._reactRoot) {
              dotsWrap._reactRoot = createRoot(dotsWrap);
            }

            const dotStyleId = settings.dotStyle || 1;
            const dotsSig = `${dotStyleId}-${activeIndex}-${images.length}-${dotColor}-${scaleFactor.toFixed(2)}`;

            if (dotsWrap._lastSig !== dotsSig) {
              dotsWrap._lastSig = dotsSig;
              dotsWrap._reactRoot.render(
                createElement(DotRenderer, {
                  styleId: dotStyleId,
                  size: `${Math.max(6, 8 * scaleFactor)}px`,
                  color: dotColor || '#000000',
                  activeIndex,
                  count: images.length,
                  onDotClick: (e, i) => {
                    e.stopPropagation(); e.preventDefault();
                    const current = parseInt(el.getAttribute('data-active-index') || '0');
                    if (i === current) return;
                    el.setAttribute('data-active-index', i.toString());
                    el._lastSlideTime = Date.now();

                    const evt = new CustomEvent('force-slideshow-advance', { detail: { el, nextIndex: i } });
                    window.dispatchEvent(evt);
                  }
                })
              );
            }
          }
        }

        // Sync state continuously
        const isHovering = el._isHovering === true;
        overlay.querySelectorAll('.editor-ss-nav').forEach(btn => {
          btn.style.opacity = isHovering ? '1' : '0';
          btn.style.pointerEvents = isHovering ? 'auto' : 'none';
        });
      });

      document.querySelectorAll('.global-ss-overlay').forEach(overlay => {
        const found = Array.from(slideshows).some(el => el._globalSsOverlay === overlay);
        if (!found) {
          if (overlay._cleanupHover) overlay._cleanupHover();
          overlay.remove();
        }
      });
    };

    const interval = setInterval(renderOverlays, 200);

    const handleForceAdvance = (e) => {
      const { el, nextIndex } = e.detail;
      if (!el) return;
      try {
        const dataStr = el.getAttribute('data-slideshow');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        const images = data.images || [];
        const url = images[nextIndex]?.url;
        if (!url) return;

        const _findImgInPattern = (node) => {
          const fill = node.getAttribute?.('fill') || '';
          if (fill?.startsWith('url(#')) {
            const patternId = fill.match(/url\(#([^)]+)\)/)?.[1];
            if (patternId) {
              const ownerSvg = node.closest('svg');
              const pattern = ownerSvg?.querySelector(`[id="${patternId}"]`);
              if (pattern) {
                const img = pattern.querySelector('image');
                if (img) return img;
                const useEl = pattern.querySelector('use');
                if (useEl) {
                  const refId = (useEl.getAttribute('href') || useEl.getAttribute('xlink:href'))?.replace('#', '');
                  if (refId) return ownerSvg?.querySelector(`[id="${refId}"]`) || null;
                }
              }
            }
          }
          return null;
        };
        let imgEl = null;
        const elTag = el.tagName?.toLowerCase();
        if (elTag === 'image' || elTag === 'img') imgEl = el;
        else {
          imgEl = _findImgInPattern(el) || el.querySelector('image') || el.querySelector('img');
          if (!imgEl) {
            const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
            for (const child of Array.from(childrenWithPatterns)) {
              const t = _findImgInPattern(child);
              if (t) { imgEl = t; break; }
            }
          }
          if (!imgEl) imgEl = el;
        }

        if (!imgEl) return;
        const imgTag2 = imgEl.tagName?.toLowerCase();
        if (imgTag2 === 'image') {
          imgEl.setAttribute('href', url);
          try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch { /* ignored */ }
        } else if (imgTag2 === 'img') {
          imgEl.src = url;
        } else {
          imgEl.style.backgroundImage = `url("${url}")`;
        }
        renderOverlays();
      } catch { /* ignored */ }
    };

    window.addEventListener('force-slideshow-advance', handleForceAdvance);

    return () => {
      clearInterval(interval);
      window.removeEventListener('force-slideshow-advance', handleForceAdvance);
      document.querySelectorAll('.global-ss-overlay').forEach(overlay => {
        if (overlay._cleanupHover) overlay._cleanupHover();
        overlay.remove();
      });
    };
  }, []);

  // Global observer for dynamic styling to bypass WebKit pseudo-element bugs and ensure styles persist on load
  useEffect(() => {
    let animationFrameId;

    const hexToRgbaStr = (color, opacityVal) => {
      if (!color || color === 'transparent' || color === 'none' || color === '#') return 'transparent';
      if (color.startsWith('rgba') || color.startsWith('hsla') || color.includes('gradient')) return color;
      let c = color.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (isNaN(num)) return color;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      const op = parseFloat(opacityVal);
      const clampedOp = isNaN(op) ? 1 : (op > 1 ? op / 100 : op);
      return `rgba(${r}, ${g}, ${b}, ${clampedOp})`;
    };

    const updateScrollbarStyles = () => {
      const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
      const elsDoc = Array.from(document.querySelectorAll('[data-scrollbar-color], [data-bg-fill], [data-bg-stroke]'));
      const elsIframe = editorDoc ? Array.from(editorDoc.querySelectorAll('[data-scrollbar-color], [data-bg-fill], [data-bg-stroke]')) : [];
      const els = [...elsDoc, ...elsIframe];

      let cssRules = '';
      els.forEach(el => {
        if (el.id) {
          if (el.hasAttribute('data-scrollbar-color')) {
            cssRules += `[id="${el.id}"] .flipbook-text-scrollbar::-webkit-scrollbar-thumb { background-color: ${el.getAttribute('data-scrollbar-color')} !important; border-radius: 20px !important; border: 3px solid transparent !important; background-clip: padding-box !important; }\n`;
          }
          if (el.hasAttribute('data-bg-fill')) {
            const bgFill = el.getAttribute('data-bg-fill');
            const bgFillOpacity = el.getAttribute('data-bg-fill-opacity') !== null ? el.getAttribute('data-bg-fill-opacity') : '1';
            if (bgFill && bgFill !== 'transparent' && bgFill !== 'none' && bgFill !== '#') {
              const finalBgFill = hexToRgbaStr(bgFill, bgFillOpacity);
              if (finalBgFill.includes('gradient')) {
                cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-image: ${finalBgFill} !important; background-color: transparent !important; --bg-fill: ${finalBgFill} !important; }\n`;
              } else {
                cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-color: ${finalBgFill} !important; background-image: none !important; --bg-fill: ${finalBgFill} !important; }\n`;
              }
            } else {
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { background-color: transparent !important; background-image: none !important; --bg-fill: transparent !important; }\n`;
            }
          }
          if (el.hasAttribute('data-bg-stroke')) {
            const bgStroke = el.getAttribute('data-bg-stroke');
            const bgStrokeOpacity = el.getAttribute('data-bg-stroke-opacity') !== null ? el.getAttribute('data-bg-stroke-opacity') : '1';
            const sw = el.getAttribute('data-bg-stroke-width') !== null ? el.getAttribute('data-bg-stroke-width') : 0;
            const dash = el.getAttribute('data-bg-stroke-dasharray');
            const borderStyle = (dash && dash !== 'none') ? 'dashed' : 'solid';
            if (bgStroke && bgStroke !== 'none' && bgStroke !== 'transparent' && bgStroke !== '#' && Number(sw) > 0) {
              const finalBgStroke = hexToRgbaStr(bgStroke, bgStrokeOpacity);
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { border: ${sw}px ${borderStyle} ${finalBgStroke} !important; --bg-stroke: ${finalBgStroke} !important; --bg-stroke-width: ${sw} !important; }\n`;
            } else {
              cssRules += `[id="${el.id}"] .flipbook-text-outer, [id="${el.id}"] > div { border: none !important; }\n`;
            }
          }
        }
      });
      let styleTag = document.getElementById('global-scrollbar-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'global-scrollbar-styles';
        document.head.appendChild(styleTag);
      }
      if (styleTag.textContent !== cssRules) {
        styleTag.textContent = cssRules;
        setTimeout(() => {
          els.forEach(el => {
            const innerDiv = el.querySelector('.flipbook-text-scrollbar');
            if (innerDiv) {
              const currentOverflow = innerDiv.style.overflowY;
              innerDiv.style.overflowY = 'hidden';
              void innerDiv.offsetHeight;
              innerDiv.style.overflowY = currentOverflow || 'auto';
            }
          });
        }, 10);
      }
      if (editorDoc) {
        let iframeStyleTag = editorDoc.getElementById('global-scrollbar-styles');
        if (!iframeStyleTag) {
          iframeStyleTag = editorDoc.createElement('style');
          iframeStyleTag.id = 'global-scrollbar-styles';
          (editorDoc.head || editorDoc.documentElement).appendChild(iframeStyleTag);
        }
        if (iframeStyleTag.textContent !== cssRules) {
          iframeStyleTag.textContent = cssRules;
        }
      }
    };

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateScrollbarStyles);
    });

    updateScrollbarStyles();
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-scrollbar-color', 'data-bg-fill', 'data-bg-fill-opacity', 'data-bg-stroke', 'data-bg-stroke-opacity', 'data-bg-stroke-width', 'id'] });

    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
    if (editorDoc && editorDoc.body) {
      try {
        observer.observe(editorDoc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-scrollbar-color', 'data-bg-fill', 'data-bg-fill-opacity', 'data-bg-stroke', 'data-bg-stroke-opacity', 'data-bg-stroke-width', 'id'] });
      } catch { /* ignored */ }
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Global Stroke Overlay Sync
  useEffect(() => {
    const syncOverlays = () => {
      const container = document.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      if (!container) return;
      const svg = container.querySelector('svg');
      if (!svg) return;

      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      const shapes = svg.querySelectorAll('[data-stroke-position="Outside"], [data-stroke-position="Inside"]');
      shapes.forEach(el => {
        // Skip elements that manage their own stroke offsets (Images, Videos, and their dedicated overlays)
        if (
          el.tagName.toLowerCase() === 'image' ||
          el.tagName.toLowerCase() === 'foreignobject' ||
          el.tagName.toLowerCase() === 'g' ||
          el.classList.contains('svg-image-stroke-overlay') ||
          el.classList.contains('svg-video-stroke-overlay')
        ) {
          const existingOverlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
          if (existingOverlay) existingOverlay.remove();
          return;
        }
        const pos = el.getAttribute('data-stroke-position');
        const sw = parseFloat(el.getAttribute('data-stroke-width') || '0');
        if (sw <= 0) {
          const existingOverlay = el.parentNode?.querySelector(`.svg-shape-stroke-overlay[data-target="${el.id}"]`);
          if (existingOverlay) existingOverlay.remove();
          return;
        }

        // Hide original stroke and capture its color
        const currentStroke = el.getAttribute('stroke');
        if (currentStroke && currentStroke !== 'none') {
          el.setAttribute('data-original-stroke', currentStroke);
          el.setAttribute('stroke', 'none');
        }
        if (el.hasAttribute('stroke-width')) {
          el.removeAttribute('stroke-width');
        }

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
        }

        if (pos === 'Inside') {
          const safeElId = (el.id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
          let clip = defs.querySelector(`clipPath[id="clip-shape-${safeElId}"]`);
          if (!clip) {
            clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
            clip.id = `clip-shape-${safeElId}`;
            const clipShape = document.createElementNS('http://www.w3.org/2000/svg', el.tagName);
            clip.appendChild(clipShape);
            defs.appendChild(clip);
          }
          overlay.setAttribute('clip-path', `url(#clip-shape-${safeElId})`);
          overlay.removeAttribute('mask');
        } else {
          const safeElId = (el.id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
          let mask = defs.querySelector(`mask[id="mask-shape-${safeElId}"]`);
          if (!mask) {
            mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
            mask.id = `mask-shape-${safeElId}`;
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
          overlay.setAttribute('mask', `url(#mask-shape-${safeElId})`);
          overlay.removeAttribute('clip-path');
        }

        // Sync visual attributes
        overlay.setAttribute('stroke', el.getAttribute('data-original-stroke') || '#000');
        overlay.setAttribute('stroke-width', (sw * 2).toString());
        overlay.setAttribute('fill', 'none');
        overlay.setAttribute('stroke-opacity', el.getAttribute('data-stroke-opacity') || '1');

        const dashArray = el.getAttribute('data-stroke-dasharray') || el.getAttribute('stroke-dasharray');
        if (dashArray && dashArray !== 'none') overlay.setAttribute('stroke-dasharray', dashArray);
        else overlay.removeAttribute('stroke-dasharray');

        overlay.setAttribute('stroke-linecap', el.getAttribute('stroke-linecap') || 'butt');
        overlay.setAttribute('stroke-linejoin', (el.getAttribute('stroke-linecap') || 'butt') === 'round' ? 'round' : 'miter');

        // Sync geometry
        const attrsToSync = ['x', 'y', 'width', 'height', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'points'];
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

        // ONLY copy transform to the overlay, NOT to the clip/mask shapes (which use userSpaceOnUse coordinate system)
        const transformAttr = el.getAttribute('transform');
        if (transformAttr !== null) overlay.setAttribute('transform', transformAttr);
        else overlay.removeAttribute('transform');

        overlay.style.transform = el.style.transform;
        overlay.style.translate = el.style.translate;
        overlay.style.scale = el.style.scale;
        overlay.style.rotate = el.style.rotate;
        // Do NOT copy style.transform to refShape, because the mask/clip automatically operates
        // in the user coordinate space of the overlay. Applying it again causes double-transform bugs.
      });

      // Sync video / iframe elements inside foreignObjects
      svg.querySelectorAll('foreignObject iframe').forEach(iframe => {
        const fo = iframe.closest('foreignObject');
        if (fo) {
          const foW = parseFloat(fo.getAttribute('width') || '0');
          const foH = parseFloat(fo.getAttribute('height') || '0');
          const origW = parseFloat(iframe.getAttribute('data-original-width')) || 640;
          const origH = parseFloat(iframe.getAttribute('data-original-height')) || 360;
          iframe.setAttribute('data-original-width', origW.toString());
          iframe.setAttribute('data-original-height', origH.toString());
          iframe.setAttribute('width', origW.toString());
          iframe.setAttribute('height', origH.toString());
          iframe.style.setProperty('width', origW + 'px', 'important');
          iframe.style.setProperty('height', origH + 'px', 'important');
          iframe.style.setProperty('transform-origin', '0 0', 'important');
          
          const isInteractive = fo.getAttribute('data-video-interactive') === 'true';
          iframe.style.setProperty('pointer-events', isInteractive ? 'auto' : 'none', 'important');
          iframe.style.setProperty('border', 'none', 'important');
          iframe.style.setProperty('display', 'block', 'important');

          if (foW > 0 && foH > 0 && origW > 0 && origH > 0) {
            const scaleX = foW / origW;
            const scaleY = foH / origH;
            iframe.style.setProperty('transform', `scale(${scaleX}, ${scaleY})`, 'important');
          }
        }
      });
      svg.querySelectorAll('foreignObject video').forEach(video => {
        const fo = video.closest('foreignObject');
        const isInteractive = fo ? fo.getAttribute('data-video-interactive') === 'true' : true;
        video.style.setProperty('width', '100%', 'important');
        video.style.setProperty('height', '100%', 'important');
        video.style.setProperty('display', 'block', 'important');
        video.style.setProperty('pointer-events', isInteractive ? 'auto' : 'none', 'important');
      });

      // Sync Image Masks
      svg.querySelectorAll('[data-masked-image-url]').forEach(shapeEl => {
        const shapeId = shapeEl.id;
        if (!shapeId) return;
        const imgEl = svg.querySelector(`[id="masked-img-${shapeId}"]`);
        const clipPath = defs?.querySelector(`clipPath[id="clip-shape-${shapeId}"]`);
        if (imgEl && clipPath) {
          const clipShape = clipPath.firstElementChild;
          if (clipShape) {
            // Sync geometry attributes (NO transform)
            const attrsToSync = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points'];
            attrsToSync.forEach(attr => {
              const val = shapeEl.getAttribute(attr);
              if (val !== null) clipShape.setAttribute(attr, val);
              else clipShape.removeAttribute(attr);
            });
          }
          
          // Sync Image properties
          const transform = shapeEl.getAttribute('transform');
          if (transform) imgEl.setAttribute('transform', transform);
          else imgEl.removeAttribute('transform');

          if (typeof shapeEl.getBBox === 'function') {
             try {
                const bbox = shapeEl.getBBox();
                if (bbox && bbox.width > 0 && bbox.height > 0) {
                   imgEl.setAttribute('x', bbox.x);
                   imgEl.setAttribute('y', bbox.y);
                   imgEl.setAttribute('width', bbox.width);
                   imgEl.setAttribute('height', bbox.height);
                }
             } catch { /* ignored */ }
          }
        }
      });

      // Cleanup orphan overlays
      svg.querySelectorAll('.svg-shape-stroke-overlay').forEach(overlay => {
        const targetId = overlay.getAttribute('data-target');
        const target = svg.querySelector(`[id="${targetId}"]`);
        if (!target || target.getAttribute('data-stroke-position') === 'Center') {
          overlay.remove();
          const mask = defs?.querySelector(`mask[id="mask-shape-${targetId}"]`);
          if (mask) mask.remove();
          const clip = defs?.querySelector(`clipPath[id="clip-shape-${targetId}"]`);
          if (clip) clip.remove();
        }
      });
    };

    const interval = setInterval(syncOverlays, 100);
    return () => clearInterval(interval);
  }, [activePageIndex]);
};

export default useCanvasDOMOverlays;
