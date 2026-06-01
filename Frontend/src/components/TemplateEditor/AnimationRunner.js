export const initAnimationRunner = function(doc) {
  // Re-initialization is allowed as doc.write wipes the body but doc object might persist
  doc.__animationRunnerInitialized = true;  const WAAPI_ANIMATIONS = {
    'none': [],
    'fade-in': [{ opacity: 0 }, { opacity: 1 }],
    'fade-out': [{ opacity: 1 }, { opacity: 0 }],
    'blur-in': [{ filter: 'blur(20px)', opacity: 0 }, { filter: 'blur(0)', opacity: 1 }],
    'focus-in': [{ filter: 'blur(12px)', opacity: 0, scale: '1.2' }, { filter: 'blur(0)', opacity: 1, scale: '1' }],
    'glass-reveal': [{ opacity: 0, backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)' }, { opacity: 1, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' }],
    'perspective-in': [{ transform: 'perspective(400px) rotateX(-60deg) translateZ(-500px)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg) translateZ(0)', opacity: 1 }],
    'slide-up': [{ translate: '0 100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-down': [{ translate: '0 -100px', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-left': [{ translate: '100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'slide-right': [{ translate: '-100px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }],
    'back-in-up': [{ translate: '0 500px', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-down': [{ translate: '0 -500px', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-left': [{ translate: '-500px 0', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'back-in-right': [{ translate: '500px 0', scale: '0.7', opacity: 0 }, { translate: '0 0', scale: '0.7', opacity: 0.7, offset: 0.8 }, { translate: '0 0', scale: '1', opacity: 1 }],
    'zoom-in': [{ scale: '0', opacity: 0 }, { scale: '1', opacity: 1 }],
    'zoom-out': [{ scale: '1', opacity: 1 }, { scale: '0', opacity: 0 }],
    'zoom-in-up': [{ scale: '0.1', translate: '0 100px', opacity: 0 }, { scale: '1', translate: '0 0', opacity: 1 }],
    'zoom-in-down': [{ scale: '0.1', translate: '0 -100px', opacity: 0 }, { scale: '1', translate: '0 0', opacity: 1 }],
    'rotate-in': [{ rotate: '-200deg', scale: '0', opacity: 0 }, { rotate: '0deg', scale: '1', opacity: 1 }],
    'rotate-in-down-left': [{ rotate: '-45deg', transformOrigin: 'left bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'left bottom', opacity: 1 }],
    'rotate-in-up-right': [{ rotate: '-90deg', transformOrigin: 'right bottom', opacity: 0 }, { rotate: '0deg', transformOrigin: 'right bottom', opacity: 1 }],
    'bounce-in': [{ scale: '0.3', opacity: 0 }, { scale: '1.1', opacity: 0.8, offset: 0.5 }, { scale: '0.9', opacity: 1, offset: 0.7 }, { scale: '1', opacity: 1 }],
    'bounce-out': [{ scale: '1', opacity: 1 }, { scale: '1.1', opacity: 0.8, offset: 0.2 }, { scale: '0.3', opacity: 0, offset: 1 }],
    'flip-in': [{ transform: 'perspective(400px) rotateX(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 }],
    'flip-in-y': [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 }],
    'roll-in': [{ translate: '-100px 0', rotate: '-120deg', opacity: 0 }, { translate: '0 0', rotate: '0deg', opacity: 1 }],
    'pulse': [{ scale: '1' }, { scale: '1.1', offset: 0.5 }, { scale: '1' }],
    'heartbeat': [{ scale: '1' }, { scale: '1.3', offset: 0.14 }, { scale: '1', offset: 0.28 }, { scale: '1.3', offset: 0.42 }, { scale: '1', offset: 0.7 }],
    'float': [{ translate: '0 0' }, { translate: '0 -15px', offset: 0.5 }, { translate: '0 0' }],
    'neon-glow': [{ filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }, { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))', offset: 0.5 }, { filter: 'brightness(1) drop-shadow(0 0 0px rgba(79, 70, 229, 0))' }],
    'tada': [{ scale: '1', rotate: '0deg' }, { scale: '0.9', rotate: '-3deg', offset: 0.1 }, { scale: '0.9', rotate: '-3deg', offset: 0.2 }, { scale: '1.1', rotate: '3deg', offset: 0.3 }, { scale: '1.1', rotate: '-3deg', offset: 0.4 }, { scale: '1.1', rotate: '3deg', offset: 0.5 }, { scale: '1.1', rotate: '-3deg', offset: 0.6 }, { scale: '1.1', rotate: '3deg', offset: 0.7 }, { scale: '1.1', rotate: '-3deg', offset: 0.8 }, { scale: '1.1', rotate: '3deg', offset: 0.9 }, { scale: '1', rotate: '0deg' }],
    'rubber-band': [{ scale: '1 1' }, { scale: '1.25 0.75', offset: 0.3 }, { scale: '0.75 1.25', offset: 0.4 }, { scale: '1.15 0.85', offset: 0.5 }, { scale: '0.95 1.05', offset: 0.65 }, { scale: '1.05 0.95', offset: 0.75 }, { scale: '1 1' }],
    'jello': [{ transform: 'skew(0,0)' }, { transform: 'skew(-12.5deg, -12.5deg)', offset: 0.22 }, { transform: 'skew(6.25deg, 6.25deg)', offset: 0.33 }, { transform: 'skew(-3.125deg, -3.125deg)', offset: 0.44 }, { transform: 'skew(1.5625deg, 1.5625deg)', offset: 0.55 }, { transform: 'skew(-0.78deg, -0.78deg)', offset: 0.66 }, { transform: 'skew(0.39deg, 0.39deg)', offset: 0.77 }, { transform: 'skew(-0.2deg, -0.2deg)', offset: 0.88 }, { transform: 'skew(0,0)' }],
    'swing': [{ rotate: '0deg' }, { rotate: '15deg', offset: 0.2 }, { rotate: '-10deg', offset: 0.4 }, { rotate: '5deg', offset: 0.6 }, { rotate: '-5deg', offset: 0.8 }, { rotate: '0deg' }],
    'wobble': [{ translate: '0 0', rotate: '0deg' }, { translate: '-25% 0', rotate: '-5deg', offset: 0.15 }, { translate: '20% 0', rotate: '3deg', offset: 0.3 }, { translate: '-15% 0', rotate: '-3deg', offset: 0.45 }, { translate: '10% 0', rotate: '2deg', offset: 0.6 }, { translate: '-5% 0', rotate: '-1deg', offset: 0.75 }, { translate: '0 0', rotate: '0deg' }],
    'glitch': [{ translate: '0' }, { translate: '-2px 2px', offset: 0.2 }, { translate: '2px -2px', offset: 0.4 }, { translate: '-2px 2px', offset: 0.6 }, { translate: '2px -2px', offset: 0.8 }, { translate: '0' }],
  };

  const LOOP_ANIMATIONS = ['pulse', 'tada', 'rubber-band', 'jello', 'heartbeat', 'glitch', 'neon-glow', 'swing', 'wobble', 'float'];

  const getWaapiEase = (name) => {
    const map = {
      'Linear': 'linear',
      'Smooth': 'ease-in-out',
      'Ease In': 'ease-in',
      'Ease Out': 'ease-out',
      'Ease In & Out': 'ease-in-out',
      'Bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };
    return map[name] || 'linear';
  };

  const runAnim = (el, type, settings) => {
    if (!type || !WAAPI_ANIMATIONS[type] || type === 'none') {
        if (el.__currentAnimation) {
            el.__currentAnimation.cancel();
            el.__currentAnimation = null;
        }
        return;
    }
    
    if (el.__currentAnimation) {
      el.__currentAnimation.cancel();
    }

    const duration = ((parseFloat(settings?.duration || 1)) / (parseFloat(settings?.speed || 1))) * 1000;
    const delay = (parseFloat(settings?.delay || 0)) * 1000;
    const easing = getWaapiEase(settings?.easing || 'Linear');
    const isLoop = LOOP_ANIMATIONS.includes(type) || settings?.isAlways;

    try {
      let cx = 0, cy = 0;
      let useMathOrigin = false;
      const isSVG = el.namespaceURI === 'http://www.w3.org/2000/svg' || el.ownerSVGElement !== undefined;
      if (isSVG) {
          try {
              const bbox = el.getBBox();
              cx = bbox.x + bbox.width / 2;
              cy = bbox.y + bbox.height / 2;
              useMathOrigin = true;
              el.style.transformOrigin = '0 0';
          } catch(e) {
              el.style.transformBox = 'fill-box';
              el.style.transformOrigin = 'center';
          }
      }
      if (el.__originalTransform === undefined) {
          let baseTransform = window.getComputedStyle(el).transform;
          if (!baseTransform || baseTransform === 'none') {
              const transformAttr = el.getAttribute('transform');
              if (transformAttr) {
                  try {
                      const dummy = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                      dummy.setAttribute('transform', transformAttr);
                      if (dummy.transform.baseVal) {
                          dummy.transform.baseVal.consolidate();
                          if (dummy.transform.baseVal.numberOfItems > 0) {
                              const m = dummy.transform.baseVal.getItem(0).matrix;
                              baseTransform = `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`;
                          }
                      }
                  } catch(e) {}
              }
          }
          el.__originalTransform = (!baseTransform || baseTransform === 'none') ? '' : baseTransform;
      }

      const baseTransform = el.__originalTransform;

      const keyframes = WAAPI_ANIMATIONS[type].map(kf => {
          const newKf = { ...kf };
          if (baseTransform || useMathOrigin) {
              if (kf.transform) {
                  if (useMathOrigin) {
                      newKf.transform = `${baseTransform} translate(${cx}px, ${cy}px) ${kf.transform} translate(-${cx}px, -${cy}px)`;
                  } else {
                      newKf.transform = `${baseTransform} ${kf.transform}`;
                  }
              } else {
                  newKf.transform = baseTransform;
              }
          }
          return newKf;
      });

      el.setAttribute('data-is-animating', 'true');
      const anim = el.animate(keyframes, {
        duration,
        delay,
        easing,
        fill: isLoop ? 'none' : 'forwards',
        iterations: isLoop ? Infinity : 1
      });

      const cleanup = () => {
        el.removeAttribute('data-is-animating');
      };
      anim.onfinish = cleanup;
      anim.oncancel = cleanup;

      el.__currentAnimation = anim;
    } catch (e) {
      console.error("Animation error", e);
    }
  };

  const handleTrigger = () => {
    doc.querySelectorAll('[data-animation-intent="true"]').forEach(el => {
        const trigger = el.getAttribute('data-animation-trigger');
        
        // 1. While Opening
        if (trigger === 'While Opening') {
            const type = el.getAttribute('data-animation-open-type');
            if (type && type !== 'none') {
                const everyVisit = el.getAttribute('data-animation-open-every-visit') !== 'false';
                const settingsStr = JSON.stringify({
                   type,
                   duration: el.getAttribute('data-animation-open-duration'),
                   speed: el.getAttribute('data-animation-open-speed'),
                   delay: el.getAttribute('data-animation-open-delay'),
                   easing: el.getAttribute('data-animation-open-easing')
                });

                const hasChanged = el.__lastOpenSettings !== settingsStr;
                if (!everyVisit && el.__animOpened && !hasChanged) return;
                
                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-open-duration'),
                  speed: el.getAttribute('data-animation-open-speed'),
                  delay: el.getAttribute('data-animation-open-delay'),
                  easing: el.getAttribute('data-animation-open-easing')
                });
                
                el.__animOpened = true;
                el.__lastOpenSettings = settingsStr;
            } else {
                runAnim(el, 'none'); // Cleanup
            }
        }
        
        // 2. On Page - Always
        else if (trigger === 'On Page' && el.getAttribute('data-animation-action') === 'Always') {
            const type = el.getAttribute('data-animation-interact-type');
            if (type && type !== 'none') {
                const settingsStr = JSON.stringify({
                  type,
                  duration: el.getAttribute('data-animation-interact-duration'),
                  speed: el.getAttribute('data-animation-interact-speed'),
                  delay: el.getAttribute('data-animation-interact-delay'),
                  easing: el.getAttribute('data-animation-interact-easing')
                });

                if (el.__lastAlwaysSettings === settingsStr) return;

                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-interact-duration'),
                  speed: el.getAttribute('data-animation-interact-speed'),
                  delay: el.getAttribute('data-animation-interact-delay'),
                  easing: el.getAttribute('data-animation-interact-easing'),
                  isAlways: true
                });
                el.__lastAlwaysSettings = settingsStr;
            } else {
                runAnim(el, 'none');
                el.__lastAlwaysSettings = null;
            }
        }

        // 3. On Page - Click/Hover
        else if (trigger === 'On Page') {
            const action = el.getAttribute('data-animation-action');
            if (action === 'Click') {
                if (!el.__clickBound) {
                    el.__clickBound = true;
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', (e) => {
                        if (el.getAttribute('data-animation-trigger') !== 'On Page' || el.getAttribute('data-animation-action') !== 'Click') return;
                        e.stopPropagation();
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing')
                        });
                    });
                }
            } else if (action === 'Hover') {
                if (!el.__hoverBound) {
                    el.__hoverBound = true;
                    el.addEventListener('mouseenter', () => {
                        if (el.getAttribute('data-animation-trigger') !== 'On Page' || el.getAttribute('data-animation-action') !== 'Hover') return;
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing')
                        });
                    });
                }
            }
            // If it was "Always" but now it's "Click", Always loop should stop
            if (el.__lastAlwaysSettings) {
                runAnim(el, 'none');
                el.__lastAlwaysSettings = null;
            }
        }
        
        // 4. Default if trigger is unknown or none
        else {
            runAnim(el, 'none');
            el.__lastAlwaysSettings = null;
        }
    });
  };

  const observer = new MutationObserver((mutations) => {
    let shouldTrigger = false;
    mutations.forEach(m => {
      if (m.type === 'attributes' && m.attributeName.startsWith('data-animation-')) {
        shouldTrigger = true;
      }
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        shouldTrigger = true;
      }
    });
    if (shouldTrigger) handleTrigger();
  });

  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true
  });

  // Listen for re-trigger messages (for flipbook flips)
  window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'RETRIGGER_ANIMATIONS') {
          // Only reset entrance state if everyVisit is enabled
          doc.querySelectorAll('[data-animation-trigger="While Opening"]').forEach(el => {
              const everyVisit = el.getAttribute('data-animation-open-every-visit') !== 'false';
              if (everyVisit) {
                  el.__animOpened = false;
                  el.__lastOpenSettings = null;
              }
          });
          handleTrigger();
      }
  });

  handleTrigger();
};
