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
    let iterations = 1;
    let isLoop = LOOP_ANIMATIONS.includes(type) || settings?.isAlways;

    if (isLoop) {
        iterations = Infinity;
    } else if (settings?.repeat) {
        if (settings.repeat === 'Infinite') {
            iterations = Infinity;
            isLoop = true;
        }
        else if (settings.repeat === 'Once') iterations = 1;
        else if (settings.repeat === 'Twice') iterations = 2;
        else if (settings.repeat === 'Thrice') iterations = 3;
        else if (settings.repeat === 'None') iterations = 1;
        else {
            const parsed = parseInt(settings.repeat);
            if (!isNaN(parsed) && parsed > 0) iterations = parsed;
        }
    }

    try {
      let cx = 0, cy = 0;
      let useMathOrigin = false;
      let cachedBBox = { x: 0, y: 0, width: 0, height: 0 };
      const isSVG = el.namespaceURI === 'http://www.w3.org/2000/svg' || el.ownerSVGElement !== undefined;
      if (isSVG) {
          try {
              cachedBBox = el.getBBox();
              cx = cachedBBox.x + cachedBBox.width / 2;
              cy = cachedBBox.y + cachedBBox.height / 2;
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
      const shadowCaster = el.previousElementSibling?.classList?.contains('svg-drop-shadow-caster') ? el.previousElementSibling : null;

      const finalKeyframes = WAAPI_ANIMATIONS[type].map(kf => {
          const newKf = { ...kf };
          let transformParts = [];
          if (newKf.translate) { transformParts.push(`translate(${String(newKf.translate).split(' ').join(',')})`); delete newKf.translate; }
          if (newKf.rotate) { const r = String(newKf.rotate).trim(); transformParts.push(`rotate(${r === '0' ? '0deg' : r})`); delete newKf.rotate; }
          if (newKf.scale !== undefined) { transformParts.push(`scale(${String(newKf.scale).split(' ').join(',')})`); delete newKf.scale; }
          if (newKf.skew) { const parts = String(newKf.skew).split(',').map(p => p.trim() === '0' ? '0deg' : p.trim()); transformParts.push(`skew(${parts.join(',')})`); delete newKf.skew; }
          
          let combinedKfTransform = newKf.transform || '';
          if (transformParts.length > 0) { combinedKfTransform = `${combinedKfTransform} ${transformParts.join(' ')}`.trim(); }
          
          if (baseTransform || useMathOrigin) {
              if (combinedKfTransform) {
                  if (useMathOrigin) {
                      let px = cx; let py = cy;
                      if (newKf.transformOrigin) {
                          const origin = newKf.transformOrigin;
                          if (origin.includes('left')) px = cachedBBox.x;
                          if (origin.includes('right')) px = cachedBBox.x + cachedBBox.width;
                          if (origin.includes('top')) py = cachedBBox.y;
                          if (origin.includes('bottom')) py = cachedBBox.y + cachedBBox.height;
                          delete newKf.transformOrigin;
                      }
                      newKf.transform = `${baseTransform} translate(${px}px, ${py}px) ${combinedKfTransform} translate(-${px}px, -${py}px)`;
                  } else {
                      newKf.transform = `${baseTransform} ${combinedKfTransform}`;
                  }
              } else {
                  newKf.transform = baseTransform;
              }
          } else if (combinedKfTransform) {
              newKf.transform = combinedKfTransform;
          }
          return newKf;
      });

      el.setAttribute('data-is-animating', 'true');
      const animSettings = { duration, delay, easing, fill: isLoop ? 'none' : 'forwards', iterations };
      const anim = el.animate(finalKeyframes, animSettings);

      let shadowAnim = null;
      if (shadowCaster) {
          if (shadowCaster.__currentAnimation) {
              try { shadowCaster.__currentAnimation.cancel(); } catch(err) {}
          }
          shadowCaster.setAttribute('data-is-animating', 'true');
          shadowAnim = shadowCaster.animate(finalKeyframes, animSettings);
      }

      const cleanup = () => {
        el.removeAttribute('data-is-animating');
        if (shadowCaster) shadowCaster.removeAttribute('data-is-animating');
        if (el.__currentAnimation === anim) el.__currentAnimation = null;
        if (shadowCaster && shadowCaster.__currentAnimation === shadowAnim) shadowCaster.__currentAnimation = null;
      };
      anim.onfinish = cleanup;
      anim.oncancel = cleanup;

      el.__currentAnimation = anim;
      if (shadowCaster) shadowCaster.__currentAnimation = shadowAnim;
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
                
                if (!everyVisit) {
                    const runKey = `anim_run_${el.id || el.getAttribute('data-name')}`;
                    if (sessionStorage.getItem(runKey)) return;
                    sessionStorage.setItem(runKey, 'true');
                }

                const settingsStr = JSON.stringify({
                   type,
                   duration: el.getAttribute('data-animation-open-duration'),
                   speed: el.getAttribute('data-animation-open-speed'),
                   delay: el.getAttribute('data-animation-open-delay'),
                   easing: el.getAttribute('data-animation-open-easing'),
                   repeat: el.getAttribute('data-animation-open-repeat')
                });

                const hasChanged = el.__lastOpenSettings !== settingsStr;
                if (!everyVisit && el.__animOpened && !hasChanged) return;
                
                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-open-duration'),
                  speed: el.getAttribute('data-animation-open-speed'),
                  delay: el.getAttribute('data-animation-open-delay'),
                  easing: el.getAttribute('data-animation-open-easing'),
                  repeat: el.getAttribute('data-animation-open-repeat')
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
                  easing: el.getAttribute('data-animation-interact-easing'),
                  repeat: el.getAttribute('data-animation-interact-repeat')
                });

                if (el.__lastAlwaysSettings === settingsStr) return;

                runAnim(el, type, {
                  duration: el.getAttribute('data-animation-interact-duration'),
                  speed: el.getAttribute('data-animation-interact-speed'),
                  delay: el.getAttribute('data-animation-interact-delay'),
                  easing: el.getAttribute('data-animation-interact-easing'),
                  repeat: el.getAttribute('data-animation-interact-repeat'),
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
                        if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
                        e.stopPropagation();
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing'),
                            repeat: el.getAttribute('data-animation-interact-repeat')
                        });
                    });
                }
            } else if (action === 'Hover') {
                if (!el.__hoverBound) {
                    el.__hoverBound = true;
                    el.addEventListener('mouseenter', () => {
                        if (el.getAttribute('data-animation-trigger') !== 'On Page' || el.getAttribute('data-animation-action') !== 'Hover') return;
                        if (el.__currentAnimation && el.__currentAnimation.playState === 'running') return;
                        const type = el.getAttribute('data-animation-interact-type');
                        runAnim(el, type, {
                            duration: el.getAttribute('data-animation-interact-duration'),
                            speed: el.getAttribute('data-animation-interact-speed'),
                            delay: el.getAttribute('data-animation-interact-delay'),
                            easing: el.getAttribute('data-animation-interact-easing'),
                            repeat: el.getAttribute('data-animation-interact-repeat')
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
