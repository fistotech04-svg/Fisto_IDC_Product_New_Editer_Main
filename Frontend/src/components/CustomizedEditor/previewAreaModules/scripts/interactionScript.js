export const getInteractionScript = (pageNumber) => `  <style>
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
                   e.preventDefault();
                   e.stopPropagation();

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
                       if (!customHtml && value) {
                           customHtml = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><rect width="100%" height="100%" fill="#ffffff" rx="16" /><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Content</text></svg>';
                       }
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
                        let vId = null;
                        let modelName = '3D Model';
                        let parsedHotspots = [];
                        if (value && value.startsWith('{')) {
                            try {
                                var parsed = JSON.parse(value);
                                modelUrl = parsed.data || parsed.url || value;
                                if (parsed.v_id || parsed.modelId || parsed.sourceModelId) {
                                    vId = parsed.v_id || parsed.modelId || parsed.sourceModelId;
                                }
                                if (Array.isArray(parsed.hotspots)) {
                                    parsedHotspots = parsed.hotspots;
                                }
                                if (parsed.displayName || parsed.name) {
                                    modelName = parsed.displayName || parsed.name;
                                }
                            } catch(e) {}
                        }
                        const configStr = el.dataset.interactionConfig || el.getAttribute('data-interaction-config');
                        if (configStr) {
                            try {
                                configObj = JSON.parse(configStr);
                            } catch(e) {}
                        }
                        if (!configObj) {
                            configObj = {
                                topText: 'You can Rotate 3D Model',
                                bottomText: modelName,
                                shadowStrength: 35,
                                shadowSoftness: 35,
                                autoRotate: true,
                                autoRotateSpeed: 1.5,
                                lockMaxZoom: true,
                                maxZoom: 4.5,
                                bgType: 'Solid',
                                bgColor: '#ffffff',
                                customBg: true,
                                enableAR: true,
                                qrText: 'Scan Me',
                                qrColor: '#000000',
                                qrBgType: 'Solid',
                                qrBgColor: '#ffffff'
                            };
                        } else {
                            if (!configObj.topText) configObj.topText = 'You can Rotate 3D Model';
                            if (!configObj.bottomText) configObj.bottomText = modelName;
                        }
                        window.parent.postMessage({
                            type: 'show-3d-viewer',
                            url: modelUrl,
                            v_id: vId,
                            vId: vId,
                            hotspots: parsedHotspots,
                            config: configObj
                        }, '*');
                    } else if (type === 'audio' && value) {
                       e.preventDefault();
                       e.stopPropagation();
                       try {
                           let audioSrc = null;
                           if (typeof value === 'string' && value.startsWith('{')) {
                               const audioData = JSON.parse(value);
                               audioSrc = audioData.data || audioData.url || audioData.src;
                           } else {
                               audioSrc = value;
                           }

                           if (audioSrc) {
                               let targetWin = window;
                               try {
                                   if (window.parent && window.parent.document) targetWin = window.parent;
                               } catch (err) {
                                   targetWin = window;
                               }

                               if (typeof audioSrc === 'string' && audioSrc.startsWith('/uploads/')) {
                                   try {
                                       if (targetWin && typeof targetWin.resolveUploadsPath === 'function') {
                                           audioSrc = targetWin.resolveUploadsPath(audioSrc);
                                       } else if (!audioSrc.startsWith('http')) {
                                           audioSrc = (targetWin?.location?.origin || '') + audioSrc;
                                       }
                                   } catch (_) {}
                               }

                               if (targetWin._activePreviewAudio && targetWin._activePreviewAudioEl === el) {
                                   if (!targetWin._activePreviewAudio.paused) {
                                       targetWin._activePreviewAudio.pause();
                                       targetWin._activePreviewAudio.currentTime = 0;
                                   } else {
                                       targetWin._activePreviewAudio.play().catch(function(err) { console.error('Audio playback failed', err); });
                                   }
                               } else {
                                   if (targetWin._activePreviewAudio) {
                                       targetWin._activePreviewAudio.pause();
                                       targetWin._activePreviewAudio.currentTime = 0;
                                   }
                                   const audio = new Audio(audioSrc);
                                   targetWin._activePreviewAudio = audio;
                                   targetWin._activePreviewAudioEl = el;

                                   audio.onended = function() {
                                       if (targetWin._activePreviewAudio === audio) {
                                           targetWin._activePreviewAudio = null;
                                           targetWin._activePreviewAudioEl = null;
                                       }
                                   };

                                   audio.play().catch(function(err) { console.error('Audio playback failed', err); });
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
                                settings.isWidthAuto = true;
                                settings.isHeightAuto = true;
                                settings.shape = settings.shape || 'bottom-center';
                                if (settings.text && settings.text.length > 15) {
                                    settings.text = settings.text.slice(0, 15);
                                }
                            } else {
                                settings = { isInfoBox: true, isWidthAuto: true, isHeightAuto: true, shape: 'bottom-center' };
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
                        window._isIframeDragging = true;
                        try {
                        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                        const screenX = e.touches ? e.touches[0].screenX : e.screenX;
                        const screenY = e.touches ? e.touches[0].screenY : e.screenY;
                        window.parent.postMessage({
                            type: 'IFRAME_MOUSEDOWN',
                            originalClientX: clientX,
                            originalClientY: clientY,
                            screenX: screenX,
                            screenY: screenY,
                            pageNumber: window._pageNumber
                        }, '*');
                    } catch (err) {}
               } else if (e.type === 'click') {
                   const interactionEls = document.querySelectorAll('[data-interaction]');
                   interactionEls.forEach(interactionEl => {
                       const showHighlight = interactionEl.getAttribute('data-show-highlight');
                       if (showHighlight !== 'false') {
                           playHighlightBlink(interactionEl);
                       }
                   });
               }
                }
            };
           
            document.addEventListener('mousedown', handleStart);
            document.addEventListener('touchstart', handleStart, { passive: true });
            document.addEventListener('click', handleStart);

            const handleMove = (e) => {
                if (!window._isIframeDragging) return;
                try {
                    const screenX = e.touches ? e.touches[0].screenX : e.screenX;
                    const screenY = e.touches ? e.touches[0].screenY : e.screenY;
                    window.parent.postMessage({
                        type: 'IFRAME_MOUSEMOVE',
                        screenX: screenX,
                        screenY: screenY
                    }, '*');
                } catch(err) {}
            };

            const handleEnd = (e) => {
                const el = findInteractionEl(e.target);
                if (el) {
                    e.stopPropagation();
                    return;
                }
                if (!window._isIframeDragging) return;
                window._isIframeDragging = false;
                try {
                    const touch = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : null;
                    const screenX = touch ? touch.screenX : e.screenX;
                    const screenY = touch ? touch.screenY : e.screenY;
                    window.parent.postMessage({
                        type: 'IFRAME_MOUSEUP',
                        screenX: screenX,
                        screenY: screenY
                    }, '*');
                } catch(err) {}
            };

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('touchmove', handleMove, { passive: true });
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);

 
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

            function playHighlightBlink(el) {
                if (el.__isBlinking) return;
                el.__isBlinking = true;
                
                const rect = el.getBoundingClientRect();
                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.left = (rect.left + window.scrollX) + 'px';
                overlay.style.top = (rect.top + window.scrollY) + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                // Same style as template editor highlight box
                overlay.style.backgroundColor = 'rgba(81, 69, 246, 0.4)'; 
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '999999';
                overlay.style.opacity = '0';
                
                document.body.appendChild(overlay);
                
                const keyframes = [
                    { opacity: 0 },
                    { opacity: 1, offset: 0.25 },
                    { opacity: 0, offset: 0.5 },
                    { opacity: 1, offset: 0.75 },
                    { opacity: 0, offset: 1 }
                ];
                
                const anim = overlay.animate(keyframes, {
                    duration: 1200,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });
                
                anim.onfinish = () => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    el.__isBlinking = false;
                };
            };

            window.addEventListener('message', function(e) {
                if (!e.data) return;
                if (e.data.type === 'PAGE_TURNED' || e.data.type === 'BLINK_INTERACTIONS') {
                    if (e.data.type === 'PAGE_TURNED') {
                        const visiblePages = e.data.visiblePages || [];
                        if (!visiblePages.includes(window._pageNumber)) return;
                    }
                    const interactionEls = document.querySelectorAll('[data-interaction]');
                    interactionEls.forEach(el => {
                        const showHighlight = el.getAttribute('data-show-highlight');
                        if (showHighlight !== 'false') {
                            playHighlightBlink(el);
                        }
                    });
                }
            });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    })();
  </script>
`;
;
export default getInteractionScript;
