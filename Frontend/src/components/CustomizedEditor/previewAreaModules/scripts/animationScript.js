export const getAnimationScript = (pageNumber) => `  <script>
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
;
export default getAnimationScript;
