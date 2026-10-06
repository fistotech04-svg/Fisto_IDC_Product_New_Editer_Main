import { useEffect } from 'react';

/**
 * Hook to manage global slideshow playback and manual click progression
 * across all [data-is-slideshow="true"] SVG canvas elements.
 */
export const useSlideshowManager = () => {
  // Ensures all slideshows on the template slide automatically even when not selected.
  // This logic runs independently for every element with [data-is-slideshow="true"].
  useEffect(() => {
    const globalSlideshowInterval = setInterval(() => {
      const slideshows = document.querySelectorAll('[data-is-slideshow="true"]');
      slideshows.forEach(el => {
        // Skip if manual control/overlay is active or if user is hovering (prevents conflicts)
        if (el._slideshowManual ||
          el._isHovering === true ||
          el.matches(':hover') ||
          (el._globalSsOverlay && el._globalSsOverlay.querySelector(':hover'))) return;

        try {
          const dataStr = el.getAttribute('data-slideshow');
          if (!dataStr) return;
          const data = JSON.parse(dataStr);
          const settings = data.settings || {};

          // Only auto-slide if enabled in settings
          if (!settings.autoPlay && !settings.autoSlide) return;

          const images = data.images || [];
          if (images.length <= 1) return;

          const speed = (settings.speed || 3) * 1000;
          const now = Date.now();
          const lastTime = el._lastSlideTime || 0;

          if (now - lastTime >= speed) {
            let currentIndex = parseInt(el.getAttribute('data-active-index') || '0');
            let nextIndex = (currentIndex + 1) % images.length;

            // If not infinite and reached end, stop
            if (nextIndex === 0 && settings.infiniteLoop === false && currentIndex !== 0) return;

            // Update DOM attributes
            el.setAttribute('data-active-index', nextIndex.toString());
            el._lastSlideTime = now;

            // ── Resolve the actual <image>/<img>, including SVG pattern fills ──
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
            if (elTag === 'image' || elTag === 'img') {
              imgEl = el;
            } else {
              // 1. Pattern fill on the element itself
              imgEl = _findImgInPattern(el);
              // 2. Direct child <image>/<img>
              if (!imgEl) imgEl = el.querySelector('image') || el.querySelector('img');
              // 3. Pattern fills on children
              if (!imgEl) {
                const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
                for (const child of Array.from(childrenWithPatterns)) {
                  const t = _findImgInPattern(child);
                  if (t) { imgEl = t; break; }
                }
              }
              // 4. Fallback to element itself
              if (!imgEl) imgEl = el;
            }

            const url = images[nextIndex]?.url;
            if (url && imgEl) {
              const imgTag = imgEl.tagName?.toLowerCase();
              if (imgTag === 'image') {
                imgEl.setAttribute('href', url);
                try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch { /* ignored */ }
              } else if (imgTag === 'img') {
                imgEl.src = url;
              } else {
                imgEl.style.backgroundImage = `url("${url}")`;
              }
            }
          }
        } catch {
          // Silent catch for parse errors during rapid edits
        }
      });

      // ── Safety: clear stale data-slideshow-manual flags ──
      // If an overlay element is marked manual but no active editor overlay div exists,
      // the flag was left behind when the properties panel closed unexpectedly. Clear it.
      if (!document.querySelector('.editor-ss-overlay')) {
        document.querySelectorAll('[data-is-slideshow="true"]').forEach(el => {
          el._slideshowManual = false;
        });
      }
    }, 50); // Check every 50ms for accurate timing

    return () => clearInterval(globalSlideshowInterval);
  }, []);

  // ── Global Slideshow Manual Click Handler ─────────────────────────────────
  // Advances a slideshow to the next image on click (even when NOT selected).
  // Uses mousedown+mouseup in capture phase to avoid being blocked by
  // handleSvgClick's stopPropagation, and guards against drag-clicks.
  useEffect(() => {
    // Shared pattern-traversal helper (same logic as auto-runner above)
    const findImgInPattern = (node) => {
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

    const resolveImgEl = (el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === 'image' || tag === 'img') return el;
      let img = findImgInPattern(el);
      if (!img) img = el.querySelector('image') || el.querySelector('img');
      if (!img) {
        const childrenWithPatterns = el.querySelectorAll('[fill^="url(#"]');
        for (const child of Array.from(childrenWithPatterns)) {
          const t = findImgInPattern(child);
          if (t) { img = t; break; }
        }
      }
      return img || el;
    };

    // Track mouse-down position to distinguish clicks from drags
    let mdX = 0, mdY = 0;

    const advanceSlideshow = (slideshowEl) => {
      try {
        const dataStr = slideshowEl.getAttribute('data-slideshow');
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        const images = data.images || [];
        if (images.length <= 1) return;

        const settings = data.settings || {};
        const infiniteLoop = settings.infiniteLoop !== false;

        let currentIndex = parseInt(slideshowEl.getAttribute('data-active-index') || '0');
        let nextIndex = currentIndex + 1;
        if (nextIndex >= images.length) nextIndex = infiniteLoop ? 0 : images.length - 1;
        if (nextIndex === currentIndex) return;

        const url = images[nextIndex]?.url;
        if (!url) return;

        const imgEl = resolveImgEl(slideshowEl);
        const imgTag = imgEl.tagName?.toLowerCase();
        if (imgTag === 'image') {
          imgEl.setAttribute('href', url);
          try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch { /* ignored */ }
        } else if (imgTag === 'img') {
          imgEl.src = url;
        } else {
          imgEl.style.backgroundImage = `url("${url}")`;
        }

        slideshowEl.setAttribute('data-active-index', nextIndex.toString());
        slideshowEl._lastSlideTime = Date.now();
      } catch {
        // Silent catch
      }
    };

    const handleMouseDown = (e) => {
      mdX = e.clientX;
      mdY = e.clientY;
    };

    const handleMouseUp = (e) => {
      // Ignore if mouse moved too much (drag, not click)
      if (Math.abs(e.clientX - mdX) > 5 || Math.abs(e.clientY - mdY) > 5) return;

      // Walk up using parentNode (works for SVG elements, unlike parentElement)
      let node = e.target;
      let slideshowEl = null;
      while (node && node.nodeType === 1) {
        if (node.getAttribute?.('data-is-slideshow') === 'true') {
          slideshowEl = node;
          break;
        }
        node = node.parentNode;
      }
      if (!slideshowEl) return;

      // Defer to the live-runner overlay when the element is selected
      if (slideshowEl._slideshowManual) return;

      advanceSlideshow(slideshowEl);
    };

    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, []);

};
