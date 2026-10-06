export const getSlideshowScript = () => `  <script>
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
            let manualMode = false;
            let isHovering = false;

            // --- Setup Container ---
            const container = el.parentElement || el;
            if (getComputedStyle(container).position === 'static') {
              container.style.position = 'relative';
            }
            container.style.overflow = 'hidden';

            // --- Helper: set image src (handles SVG <image> and <img>) ---
            const setElSrc = (target, imgObj) => {
              if (!imgObj || !imgObj.url) return;
              const url = imgObj.url;
              let imgEl = target;
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
                  imgEl = svgImg;
                  svgImg.setAttribute('href', url);
                  try { svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch(e){}
                } else {
                  const img = target.querySelector('img');
                  if (img) { imgEl = img; img.src = url; }
                  else target.style.backgroundImage = 'url(' + url + ')';
                }
              }

              const cropStr = target.getAttribute('data-crop-data');
              if (cropStr && cropStr !== 'null') {
                try {
                  const crop = JSON.parse(cropStr);
                  const origX = parseFloat(target.getAttribute('data-crop-orig-x') || imgEl.getAttribute('data-crop-orig-x') || '0');
                  const origY = parseFloat(target.getAttribute('data-crop-orig-y') || imgEl.getAttribute('data-crop-orig-y') || '0');
                  const origW = parseFloat(target.getAttribute('data-crop-orig-w') || imgEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '100');
                  const origH = parseFloat(target.getAttribute('data-crop-orig-h') || imgEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '100');

                  if (imgObj.isOriginalCrop) {
                    imgEl.setAttribute('x', origX);
                    imgEl.setAttribute('y', origY);
                    imgEl.setAttribute('width', origW);
                    imgEl.setAttribute('height', origH);
                    imgEl.style.setProperty('transform', 'translate(' + (crop.offX || 0) + '%, ' + (crop.offY || 0) + '%) scale(' + (crop.scale || 1) + ')', 'important');
                  } else {
                    const cropX = origX + (origW * (parseFloat(crop.left) / 100));
                    const cropY = origY + (origH * (parseFloat(crop.top) / 100));
                    const cropW = origW * (parseFloat(crop.width) / 100);
                    const cropH = origH * (parseFloat(crop.height) / 100);

                    imgEl.setAttribute('x', cropX);
                    imgEl.setAttribute('y', cropY);
                    imgEl.setAttribute('width', cropW);
                    imgEl.setAttribute('height', cropH);
                    imgEl.style.setProperty('transform', 'none', 'important');
                  }
                } catch(e) {}
              }
            };

            // Set initial image
            if (images[currentIndex]) setElSrc(el, images[currentIndex]);

            // --- Transition Engine ---
            const transitionEffect = (settings.transitionEffect || 'Linear').toLowerCase();
            const duration = 400;

            const applyTransition = (newIndex, dir) => {
              if (isAnimating) return;
              if (newIndex === currentIndex && images.length > 1) {
                // allow same index only on init
              }
              const oldIndex = currentIndex;
              const nextImg = images[newIndex];
              if (!nextImg) return;

              isAnimating = true;
              currentIndex = newIndex;

              // Update dots
              const dotsContainer = el.parentNode.querySelector('.ss-dots-container') || container.querySelector('.ss-dots-container');
              if (dotsContainer) {
                const dots = dotsContainer.querySelectorAll('.ss-dot');
                dots.forEach((d, i) => {
                  d.style.opacity = i === currentIndex ? '1' : '0.4';
                  d.style.transform = i === currentIndex ? 'scale(1.4)' : 'scale(1)';
                });
              }

              const effect = transitionEffect;
              const baseOpacity = el.dataset.baseOpacity || '1';

              // Create a temporary clone for seamless simultaneous transitions
              const clone = el.cloneNode(true);
              clone.removeAttribute('id');
              clone.classList.add('slideshow-transition-clone');
              const kidsWithId = clone.querySelectorAll ? clone.querySelectorAll('[id]') : [];
              kidsWithId.forEach(child => child.removeAttribute('id'));
              clone.style.pointerEvents = 'none';

              // Pattern handling
              let imgEl = el;
              if (el.tagName && el.tagName.toLowerCase() !== 'image' && el.tagName.toLowerCase() !== 'img') {
                imgEl = el.querySelector('image') || el.querySelector('img') || el;
              }
              if (imgEl && imgEl.closest && imgEl.closest('pattern')) {
                const originalPattern = imgEl.closest('pattern');
                if (originalPattern && originalPattern.parentNode) {
                  const newPattern = originalPattern.cloneNode(true);
                  const clonedPatternId = 'pattern-clone-' + Date.now() + Math.random().toString(36).substring(2, 7);
                  newPattern.setAttribute('id', clonedPatternId);
                  originalPattern.parentNode.appendChild(newPattern);
                  const origId = originalPattern.getAttribute('id');
                  const updateFillStroke = (targetEl) => {
                    ['fill', 'stroke'].forEach(attr => {
                      const val = targetEl.getAttribute(attr) || (targetEl.style ? targetEl.style[attr] : null);
                      if (val && val.includes('#' + origId)) {
                        const newVal = val.replace('#' + origId, '#' + clonedPatternId);
                        if (targetEl.hasAttribute(attr)) targetEl.setAttribute(attr, newVal);
                        if (targetEl.style && targetEl.style[attr]) targetEl.style[attr] = newVal;
                      }
                    });
                  };
                  updateFillStroke(clone);
                  const cloneChildren = clone.querySelectorAll ? clone.querySelectorAll('*') : [];
                  cloneChildren.forEach(updateFillStroke);
                }
              }

              el.parentNode.insertBefore(clone, el);
              setElSrc(el, nextImg);

              let w = 100;
              try { w = el.getBBox().width; } catch(e) { w = el.clientWidth || 100; }

              let cloneAnim, realAnim;

              if (effect === 'fade') {
                cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
                realAnim = el.animate([{ opacity: 0 }, { opacity: baseOpacity }], { duration, easing: 'ease-in-out', fill: 'forwards' });
              } else if (effect === 'push' || effect === 'slide') {
                const dx = dir === 'next' ? -w : w;
                cloneAnim = clone.animate([{ translate: '0px 0px' }, { translate: dx + 'px 0px' }], { duration, easing: 'ease-in-out', fill: 'forwards' });
                realAnim = el.animate([{ translate: -dx + 'px 0px' }, { translate: '0px 0px' }], { duration, easing: 'ease-in-out', fill: 'forwards' });
              } else if (effect === 'linear') {
                cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration: 0, fill: 'forwards' });
                realAnim = el.animate([{ opacity: baseOpacity }, { opacity: baseOpacity }], { duration: 0, fill: 'forwards' });
              } else if (effect === 'flip') {
                el.style.transformBox = 'fill-box';
                el.style.transformOrigin = 'center';
                cloneAnim = clone.animate([{ opacity: 0 }, { opacity: 0 }], { duration, fill: 'forwards' });
                realAnim = el.animate([
                  { rotate: 'y 90deg', opacity: 0 },
                  { rotate: 'y 0deg', opacity: baseOpacity }
                ], { duration, easing: 'ease-out', fill: 'forwards' });
              } else if (effect === 'reveal') {
                const startClip = dir === 'next' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
                cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration, fill: 'forwards' });
                realAnim = el.animate([
                  { clipPath: startClip },
                  { clipPath: 'inset(0 0% 0 0%)' }
                ], { duration, easing: 'ease-in-out', fill: 'forwards' });
              } else {
                cloneAnim = clone.animate([{ opacity: baseOpacity }, { opacity: 0 }], { duration: 0, fill: 'forwards' });
                realAnim = el.animate([{ opacity: baseOpacity }, { opacity: baseOpacity }], { duration: 0, fill: 'forwards' });
              }

              Promise.all([
                cloneAnim ? cloneAnim.finished : Promise.resolve(),
                realAnim ? realAnim.finished : Promise.resolve()
              ]).then(() => {
                if (clone.parentNode) clone.parentNode.removeChild(clone);
                isAnimating = false;
              }).catch(() => {
                if (clone.parentNode) clone.parentNode.removeChild(clone);
                isAnimating = false;
              });
            };

            // Store base opacity and setup transform box
            el.dataset.baseOpacity = el.style.opacity || '1';
            el.style.transformBox = 'fill-box';
            el.style.transformOrigin = 'center';

            // --- Overlay Container for HTML Controls in SVG ---
            let overlayContainer = container;
            let bbox = null;
            let w = 300;
            let h = 88;
            if (el.ownerSVGElement || el.tagName.toLowerCase() === 'svg') {
              const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
              bbox = { x: 0, y: 0, width: 100, height: 100 };
              try { 
                // Find the base <rect> which defines the visual boundaries and border of the element
                const rect = el.tagName.toLowerCase() === 'rect' ? el : el.querySelector('rect');
                if (rect && rect.getBBox().width > 0) {
                  bbox = rect.getBBox();
                } else {
                  const anchor = el.querySelector('.bbox-anchor') || 
                                 (el.parentNode && el.parentNode.querySelector('.bbox-anchor')) ||
                                 (el.tagName.toLowerCase() === 'g' ? el.querySelector('rect') : null);
                  if (anchor && anchor.getBBox().width > 0) bbox = anchor.getBBox();
                  else bbox = el.getBBox(); 
                }
              } catch(e) { 
                console.error('Slideshow bbox error:', e);
                bbox = el.getBoundingClientRect(); 
              }

              const imgEl = el.querySelector('image') || el;
              w = (bbox && bbox.width) || parseFloat(el.getAttribute('data-crop-orig-w') || imgEl.getAttribute('data-crop-orig-w') || imgEl.getAttribute('width') || '135');
              h = (bbox && bbox.height) || parseFloat(el.getAttribute('data-crop-orig-h') || imgEl.getAttribute('data-crop-orig-h') || imgEl.getAttribute('height') || '88');

              fo.setAttribute('x', (bbox && bbox.x) || 0);
              fo.setAttribute('y', (bbox && bbox.y) || 0);
              fo.setAttribute('width', w);
              fo.setAttribute('height', h);
              fo.style.pointerEvents = 'none';
              fo.classList.add('slideshow-overlay-fo');
              fo.setAttribute('data-scrollable', 'true');
              
              overlayContainer = document.createElement('div');
              overlayContainer.style.cssText = 'position:relative; width:' + w + 'px; height:' + h + 'px; pointer-events:none;';
              fo.appendChild(overlayContainer);
              
              if (el.tagName.toLowerCase() === 'g') {
                el.appendChild(fo);
              } else {
                el.parentNode.appendChild(fo);
              }
            }

            // --- Dynamic Scaling Factor ---
            let widthForScale = w || 300;
            if (!widthForScale) {
              try { widthForScale = el.clientWidth || 300; } catch(e) {}
            }
            const scaleFactor = Math.max(0.4, Math.min(1.8, widthForScale / 300));

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
                const btnSize = 48 * scaleFactor;
                const offset = 12 * scaleFactor;
                btn.style.cssText = [
                  'position:absolute',
                  'top:50%',
                  'transform:translateY(-50%)',
                  type === 'prev' ? 'left:' + offset + 'px' : 'right:' + offset + 'px',
                  'z-index:100',
                  'background:transparent',
                  'border:none',
                  'border-radius:50%',
                  'width:' + btnSize + 'px',
                  'height:' + btnSize + 'px',
                  'display:flex',
                  'align-items:center',
                  'justify-content:center',
                  'cursor:pointer',
                  'box-shadow:none',
                  'transition:opacity 0.2s',
                  'padding:0',
                  'pointer-events:auto',
                  'opacity:0'
                ].join(';');
                const svgSize = 32 * scaleFactor;
                btn.innerHTML = '<svg width="' + svgSize + '" height="' + svgSize + '" viewBox="0 0 24 24" fill="none" stroke="' + navColor + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.2)) drop-shadow(0 2px 2px rgba(255,255,255,0.2)); overflow:visible;"><path d="' + getArrowPath(type) + '"/></svg>';
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  manualMode = true;
                  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
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
                overlayContainer.appendChild(btn);
              });
            }

            // --- Pagination Dots ---
            const showDots = settings.showDots !== false;
            const dotColor = settings.dotColor || '#4F46E5';

            if (showDots && images.length > 1) {
              const dotsContainer = document.createElement('div');
              dotsContainer.className = 'ss-dots-container';
              const bottomOffset = 8 * scaleFactor;
              const gap = 5 * scaleFactor;
              dotsContainer.style.cssText = 'position:absolute;bottom:' + bottomOffset + 'px;left:50%;transform:translateX(-50%);display:flex;gap:' + gap + 'px;z-index:100;align-items:center;pointer-events:auto;';
              images.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'ss-dot';
                const dotSize = 7 * scaleFactor;
                dot.style.cssText = [
                  'width:' + dotSize + 'px',
                  'height:' + dotSize + 'px',
                  'border-radius:50%',
                  'background:' + dotColor,
                  'cursor:pointer',
                  'transition:opacity 0.3s,transform 0.3s',
                  'opacity:' + (i === currentIndex ? '1' : '0.4'),
                  'transform:' + (i === currentIndex ? 'scale(1.4)' : 'scale(1)'),
                  'pointer-events:auto'
                ].join(';');
                dot.addEventListener('click', (e) => {
                  e.stopPropagation();
                  manualMode = true;
                  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
                  if (i !== currentIndex) {
                    applyTransition(i, i > currentIndex ? 'next' : 'prev');
                  }
                });
                dotsContainer.appendChild(dot);
              });
              dotsContainer.style.pointerEvents = 'auto';
              overlayContainer.appendChild(dotsContainer);
            }

            // --- Auto Play & Hover ---

            const startTimer = () => {
              if (manualMode || isHovering) return;
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

            // Turn auto mode into manual mode while hovering and reveal controls
            // Turn auto mode into manual mode while hovering and reveal controls
            const showControls = () => {
              isHovering = true;
              if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
              const controls = overlayContainer.querySelectorAll('.ss-nav-btn');
              controls.forEach(c => c.style.opacity = '1');
            };

            const hideControls = (e) => {
              if (e && e.relatedTarget) {
                if (e.relatedTarget === overlayContainer || overlayContainer.contains(e.relatedTarget)) return;
                if (e.relatedTarget === el || el.contains(e.relatedTarget)) return;
              }
              isHovering = false;
              manualMode = false;
              resetTimer();
              const controls = overlayContainer.querySelectorAll('.ss-nav-btn');
              controls.forEach(c => c.style.opacity = '0');
            };

            el.addEventListener('mouseenter', showControls);
            el.addEventListener('mouseleave', hideControls);
            overlayContainer.addEventListener('mouseenter', showControls);
            overlayContainer.addEventListener('mouseleave', hideControls);

            startTimer();

          } catch(e) { console.error('Slideshow init error', e); }
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSlideshows);
      else initSlideshows();
    })();
  </script>
`;
;
export default getSlideshowScript;
