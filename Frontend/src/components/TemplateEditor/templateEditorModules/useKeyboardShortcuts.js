/**
 * useKeyboardShortcuts.js
 * Handles editor keyboard shortcuts (undo, redo, copy, cut, paste, delete)
 * and native OS paste events (images, videos, animated webp/gif, raw SVG, urls).
 */

import { useEffect } from 'react';
import { checkIsAnimatedWebp } from '../editorUtils';

export const useKeyboardShortcuts = ({
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds,
  setMultiSelectedIds,
  activePageIndex,
  clipboard,
  copyLayer,
  cutLayer,
  pasteLayer,
  deleteLayer,
  undo,
  redo,
  pages,
  activeTopTool,
  updateElementAttribute
}) => {
  // ── KEYBOARD SHORTCUTS (Cut, Copy, Paste, Delete, Undo, Redo) ─────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input, textarea or contenteditable element
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ||
        document.activeElement.contentEditable === 'true') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            redo(); // Ctrl+Shift+Z
          } else {
            undo(); // Ctrl+Z
          }
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'y') {
          redo(); // Ctrl+Y
          e.preventDefault();
        } else if (e.key.toLowerCase() === 'c') {
          const idsToCopy = multiSelectedIds.size > 0 ? multiSelectedIds : (selectedLayerId ? [selectedLayerId] : []);
          if (idsToCopy && (Array.isArray(idsToCopy) ? idsToCopy.length > 0 : idsToCopy.size > 0)) {
            copyLayer(activePageIndex, idsToCopy);
          }
        } else if (e.key.toLowerCase() === 'x') {
          const idsToCut = multiSelectedIds.size > 0 ? multiSelectedIds : (selectedLayerId ? [selectedLayerId] : []);
          if (idsToCut && (Array.isArray(idsToCut) ? idsToCut.length > 0 : idsToCut.size > 0)) {
            cutLayer(activePageIndex, idsToCut);
          }
        } else if (e.key.toLowerCase() === 'v') {
          if (clipboard) {
            pasteLayer(activePageIndex);
          }
        }
      } else {
        // Handle physical Delete and Backspace keys (no modifiers)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (window.__nodeEditModeActive && activeTopTool === 'editor') {
            window.dispatchEvent(new CustomEvent('vector-path-action', { detail: { action: 'delete-node' } }));
            return;
          }

          const idsToDelete = multiSelectedIds && multiSelectedIds.size > 0
            ? Array.from(multiSelectedIds)
            : (selectedLayerId ? [selectedLayerId] : []);

          if (idsToDelete.length === 0) return;

          // Helper to purge overlays from canvas immediately
          const purgeOverlays = (id) => {
            document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
              overlay.querySelectorAll(`[id*="${id}"]`).forEach(n => n.remove());
            });
            document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
              htmlOverlay.querySelectorAll(`[id*="${id}"], [id^="resize-handle-${id}-"], [id^="rotate-handle-${id}"], [id^="rotation-degree-badge-${id}"], [id^="rotate-hotspot-${id}-"]`).forEach(h => h.remove());
            });
          };

          // Helper to find element anywhere (iframe, document, or pages HTML)
          const findElementById = (id) => {
            const iframeDoc = document.getElementById('main-flipbook-editor')?.contentDocument;
            const docs = [iframeDoc, document].filter(Boolean);
            for (const doc of docs) {
              const activeContainer = doc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`)
                || doc.querySelector('.active-page-outline')
                || doc.querySelector('.flipbook-page-active');

              let el = null;
              if (activeContainer) {
                try {
                  el = activeContainer.querySelector(`[id="${CSS.escape(id)}"], [data-name="${CSS.escape(id)}"]`);
                } catch (_) {
                  el = activeContainer.querySelector(`[id="${id}"], [data-name="${id}"]`);
                }
              }
              if (!el) {
                try {
                  el = doc.querySelector(`[id="${CSS.escape(id)}"], [data-name="${CSS.escape(id)}"]`);
                } catch (_) {
                  el = doc.getElementById(id);
                }
              }
              if (el) return el;
            }

            if (pages && pages[activePageIndex]?.html) {
              try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(pages[activePageIndex].html, 'text/html');
                return doc.querySelector(`[id="${CSS.escape(id)}"], [data-name="${CSS.escape(id)}"]`);
              } catch (_) {}
            }
            return null;
          };

          const isFreeFrameCheck = (el, id) => {
            if (id && (id.startsWith('free-frame') || id.startsWith('freeframe'))) return true;
            if (!el) return false;
            return (
              el.getAttribute('data-type') === 'free-frame' ||
              el.getAttribute('data-name')?.toLowerCase() === 'free frame' ||
              (el.id && (el.id.startsWith('free-frame') || el.id.startsWith('freeframe')))
            );
          };

          const isHotspotCheck = (el, id) => {
            if (id && (id.startsWith('hotspot-') || id.startsWith('hotspot'))) return true;
            if (!el) return false;
            return (
              el.getAttribute('data-is-hotspot') === 'true' ||
              el.getAttribute('data-type') === 'hotspot' ||
              (el.id && el.id.startsWith('hotspot-'))
            );
          };

          if (activeTopTool === 'editor') {
            idsToDelete.forEach(id => purgeOverlays(id));
            deleteLayer(activePageIndex, idsToDelete);
            setMultiSelectedIds(new Set());
            setSelectedLayerId(null);
            return;
          }

          if (activeTopTool === 'interaction') {
            // In Interaction Mode:
            // - If it's a Free Frame or Hotspot: delete the free frame/hotspot layer completely.
            // - If an existing element: remove interaction ONLY. NEVER delete the element itself!
            const freeFramesToDelete = [];

            idsToDelete.forEach(id => {
              const el = findElementById(id);
              const isFreeFrame = isFreeFrameCheck(el, id);
              const isHotspot = isHotspotCheck(el, id);

              if (isFreeFrame || isHotspot) {
                purgeOverlays(id);
                freeFramesToDelete.push(id);
              } else {
                // It is an existing element!
                // Clear any interaction attached to it, but NEVER delete the element itself!
                if (updateElementAttribute) {
                  updateElementAttribute(activePageIndex, id, {
                    'data-interaction': null,
                    'data-interaction-value': null,
                    'data-interaction-intent': null,
                    'data-interaction-config': null,
                    'data-interaction-popup-custom-html': null,
                    'data-interaction-popup-animation': null,
                    'data-interaction-popup-speed': null,
                    'data-interaction-whatsapp-message': null,
                    'data-tooltip-settings': null
                  });
                }
                // Clear attributes from live DOM element(s) in document & iframe
                const docs = [document.getElementById('main-flipbook-editor')?.contentDocument, document].filter(Boolean);
                docs.forEach(doc => {
                  try {
                    doc.querySelectorAll(`[id="${CSS.escape(id)}"]`).forEach(liveEl => {
                      [
                        'data-interaction',
                        'data-interaction-value',
                        'data-interaction-intent',
                        'data-interaction-config',
                        'data-interaction-popup-custom-html',
                        'data-interaction-popup-animation',
                        'data-interaction-popup-speed',
                        'data-interaction-whatsapp-message',
                        'data-tooltip-settings'
                      ].forEach(attr => liveEl.removeAttribute(attr));
                    });
                  } catch (_) {
                    const liveEl = doc.getElementById(id);
                    if (liveEl) {
                      [
                        'data-interaction',
                        'data-interaction-value',
                        'data-interaction-intent',
                        'data-interaction-config',
                        'data-interaction-popup-custom-html',
                        'data-interaction-popup-animation',
                        'data-interaction-popup-speed',
                        'data-interaction-whatsapp-message',
                        'data-tooltip-settings'
                      ].forEach(attr => liveEl.removeAttribute(attr));
                    }
                  }
                  doc.querySelectorAll(`[id="interaction-badge-${id}"]`).forEach(b => b.remove());
                });

                window.dispatchEvent(new CustomEvent('interaction-removed', { detail: { id, pageIndex: activePageIndex } }));
                window.dispatchEvent(new CustomEvent('update-interaction-badge', { detail: { id, pageIndex: activePageIndex } }));
              }
            });

            if (freeFramesToDelete.length > 0) {
              deleteLayer(activePageIndex, freeFramesToDelete);
              setMultiSelectedIds(new Set());
              setSelectedLayerId(null);
            }
            return;
          }

          if (activeTopTool === 'animation') {
            // In Animation Mode:
            // - If it's a Free Frame: delete the free frame layer completely.
            // - If an existing element: remove animation ONLY. NEVER delete the element itself!
            const freeFramesToDelete = [];

            idsToDelete.forEach(id => {
              const el = findElementById(id);
              const isFreeFrame = isFreeFrameCheck(el, id);

              if (isFreeFrame) {
                purgeOverlays(id);
                freeFramesToDelete.push(id);
              } else {
                // It is an existing element!
                // Clear any animation attached to it, but NEVER delete the element itself!
                const animationAttrs = [
                  'data-animation-intent',
                  'data-animation-trigger',
                  'data-animation-action',
                  'data-animation-open-type',
                  'data-animation-open-duration',
                  'data-animation-open-delay',
                  'data-animation-open-easing',
                  'data-animation-open-repeat',
                  'data-animation-open-every-visit',
                  'data-animation-interact-type',
                  'data-animation-interact-duration',
                  'data-animation-interact-delay',
                  'data-animation-interact-easing',
                  'data-animation-interact-repeat',
                  'data-animation-interact-every-visit',
                  'data-animation-interact-action',
                  'data-is-animating'
                ];
                const animClearObj = {};
                animationAttrs.forEach(a => { animClearObj[a] = null; });
                if (updateElementAttribute) {
                  updateElementAttribute(activePageIndex, id, animClearObj);
                }

                // Clear live DOM element attributes, styles, and active WAAPI animations
                const docs = [document.getElementById('main-flipbook-editor')?.contentDocument, document].filter(Boolean);
                docs.forEach(doc => {
                  try {
                    doc.querySelectorAll(`[id="${CSS.escape(id)}"]`).forEach(liveEl => {
                      try {
                        const anims = liveEl.getAnimations?.() || [];
                        anims.forEach(anim => { try { anim.cancel(); } catch (_) { } });
                      } catch (_) { }
                      animationAttrs.forEach(attr => liveEl.removeAttribute(attr));
                      liveEl.style.opacity = '';
                      liveEl.style.transform = '';
                      liveEl.style.filter = '';
                      liveEl.style.backdropFilter = '';
                      liveEl.style.translate = '';
                      liveEl.style.scale = '';
                      liveEl.style.rotate = '';
                      liveEl.style.animation = '';
                    });
                  } catch (_) {
                    const liveEl = doc.getElementById(id);
                    if (liveEl) {
                      try {
                        const anims = liveEl.getAnimations?.() || [];
                        anims.forEach(anim => { try { anim.cancel(); } catch (_) { } });
                      } catch (_) { }
                      animationAttrs.forEach(attr => liveEl.removeAttribute(attr));
                      liveEl.style.opacity = '';
                      liveEl.style.transform = '';
                      liveEl.style.filter = '';
                      liveEl.style.backdropFilter = '';
                      liveEl.style.translate = '';
                      liveEl.style.scale = '';
                      liveEl.style.rotate = '';
                      liveEl.style.animation = '';
                    }
                  }
                  doc.querySelectorAll(`[id="interaction-badge-${id}"]`).forEach(b => b.remove());
                });

                // Dispatch events
                window.dispatchEvent(new CustomEvent('animation-removed', { detail: { id } }));
                window.dispatchEvent(new CustomEvent('update-interaction-badge', { detail: { id, pageIndex: activePageIndex } }));
              }
            });

            if (freeFramesToDelete.length > 0) {
              deleteLayer(activePageIndex, freeFramesToDelete);
              setMultiSelectedIds(new Set());
              setSelectedLayerId(null);
            }
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, setSelectedLayerId, multiSelectedIds, setMultiSelectedIds, activePageIndex, clipboard, copyLayer, cutLayer, pasteLayer, deleteLayer, undo, redo, pages, activeTopTool, updateElementAttribute]);

  // Handle native paste events for external files, screenshots, images, videos, GIFs, SVGs, and URLs
  useEffect(() => {
    const handleNativePaste = async (e) => {
      const activeEl = document.activeElement;
      const isEditingInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable ||
        activeEl.closest('[contenteditable="true"]') ||
        window.__isEditingText
      );

      const clipboardData = e.clipboardData || e.originalEvent?.clipboardData;
      let handledExternal = false;

      if (clipboardData) {
        const files = Array.from(clipboardData.files || []);
        const items = Array.from(clipboardData.items || []);

        let fileToProcess = files.find(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

        if (!fileToProcess) {
          const mediaItem = items.find(item => item.type.startsWith('image/') || item.type.startsWith('video/'));
          if (mediaItem) {
            fileToProcess = mediaItem.getAsFile();
          }
        }

        if (fileToProcess) {
          e.preventDefault();
          e.stopPropagation();
          handledExternal = true;

          const isVideo = fileToProcess.type.startsWith('video/');
          let isGif = fileToProcess.type === 'image/gif';
          if (!isGif && fileToProcess.type.includes('webp')) {
            isGif = await checkIsAnimatedWebp(fileToProcess);
          }
          const isSvg = fileToProcess.type === 'image/svg+xml';

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            if (isVideo) {
              const tempVid = document.createElement('video');
              tempVid.onloadedmetadata = () => {
                window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                  detail: {
                    videoUrl: dataUrl,
                    pageIndex: activePageIndex,
                    file: fileToProcess,
                    isTemporary: true,
                    videoWidth: tempVid.videoWidth,
                    videoHeight: tempVid.videoHeight,
                    isPortrait: tempVid.videoHeight > tempVid.videoWidth
                  }
                }));
              };
              tempVid.onerror = () => {
                window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                  detail: { videoUrl: dataUrl, pageIndex: activePageIndex, file: fileToProcess, isTemporary: true }
                }));
              };
              tempVid.src = dataUrl;
            } else {
              window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
                detail: {
                  dataUrl: dataUrl,
                  pageIndex: activePageIndex,
                  dataType: isSvg ? 'svg' : (isGif ? 'gif' : 'image')
                }
              }));
            }
          };
          reader.readAsDataURL(fileToProcess);
          return;
        }

        // Process pasted text data if not editing an input
        if (!isEditingInput) {
          const pastedText = clipboardData.getData('text/plain')?.trim() || '';
          if (pastedText) {
            // SVG code snippet pasted
            if (pastedText.startsWith('<svg') && pastedText.includes('</svg>')) {
              e.preventDefault();
              e.stopPropagation();
              handledExternal = true;
              const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pastedText);
              window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
                detail: {
                  dataUrl: encodedSvg,
                  pageIndex: activePageIndex,
                  dataType: 'svg'
                }
              }));
              return;
            }

            // Image Data URI or Image URL pasted
            const lowerText = pastedText.toLowerCase();
            const isDataUriImage = lowerText.startsWith('data:image/');
            const isImageUrl = /^https?:\/\/.*\.(png|jpg|jpeg|gif|svg|webp|bmp)(\?.*)?$/i.test(pastedText);

            if (isDataUriImage || isImageUrl) {
              e.preventDefault();
              e.stopPropagation();
              handledExternal = true;
              const isGif = lowerText.includes('.gif') || lowerText.startsWith('data:image/gif');
              const isSvg = lowerText.includes('.svg') || lowerText.startsWith('data:image/svg+xml');
              window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
                detail: {
                  dataUrl: pastedText,
                  pageIndex: activePageIndex,
                  dataType: isSvg ? 'svg' : (isGif ? 'gif' : 'image')
                }
              }));
              return;
            }
          }
        }
      }

      // Asynchronous Clipboard API Fallback (for system screenshots or copied file objects)
      if (!handledExternal && !isEditingInput && navigator.clipboard && navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            const mediaType = item.types.find(t => t.startsWith('image/') || t.startsWith('video/'));
            if (mediaType) {
              e.preventDefault();
              e.stopPropagation();
              const blob = await item.getType(mediaType);
              const isVideo = mediaType.startsWith('video/');
              let isGif = mediaType === 'image/gif';
              if (!isGif && mediaType.includes('webp')) {
                isGif = await checkIsAnimatedWebp(blob);
              }
              const isSvg = mediaType === 'image/svg+xml';

              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target.result;
                if (isVideo) {
                  window.dispatchEvent(new CustomEvent('upload-video-to-editor', {
                    detail: { videoUrl: dataUrl, pageIndex: activePageIndex, file: blob, isTemporary: true }
                  }));
                } else {
                  window.dispatchEvent(new CustomEvent('upload-image-to-editor', {
                    detail: {
                      dataUrl: dataUrl,
                      pageIndex: activePageIndex,
                      dataType: isSvg ? 'svg' : (isGif ? 'gif' : 'image')
                    }
                  }));
                }
              };
              reader.readAsDataURL(blob);
              break;
            }
          }
        } catch {
          // Ignore permission errors
        }
      }
    };

    window.addEventListener('paste', handleNativePaste);
    return () => window.removeEventListener('paste', handleNativePaste);
  }, [activePageIndex]);
};
