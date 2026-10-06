/**
 * interactionValidation.js
 * Comprehensive validation engine for interactive elements before save/export:
 * links, phone numbers, emails, whatsapp, popups, slideshows, audio, video, 3D viewers.
 */

  export const validateInteractions = (pagesList, activePageIndex = 0) => {
    if (!pagesList || !Array.isArray(pagesList) || pagesList.length === 0) {
      return { isValid: true };
    }

    const actionLabels = {
      'open-link': 'Open Link',
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'call': 'Call',
      'navigate-to': 'Navigate to',
      'slideshow': 'Slideshow',
      'audio': 'Audio',
      'download': 'Download',
      '3d-viewer': '3D Viewer',
      'popup': 'Popup',
      'info-box': 'Info Box',
      'tooltip': 'Tooltip'
    };

    const SOCIAL_PLATFORMS = {
      youtube: {
        name: 'YouTube',
        regex: /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com(\/[^\s]*)?|youtu\.be\/[^\s]+)$/i
      },
      instagram: {
        name: 'Instagram',
        regex: /^(https?:\/\/)?((www)\.)?(instagram\.com|instagr\.am)(\/[^\s]*)?$/i
      },
      x: {
        name: 'X (Twitter)',
        regex: /^(https?:\/\/)?((www|mobile)\.)?(x\.com|twitter\.com)(\/[^\s]*)?$/i
      },
      facebook: {
        name: 'Facebook',
        regex: /^(https?:\/\/)?((www|m|web)\.)?(facebook\.com|fb\.com|fb\.me|fb\.watch)(\/[^\s]*)?$/i
      },
      linkedin: {
        name: 'LinkedIn',
        regex: /^(https?:\/\/)?((www|mobile)\.)?(linkedin\.com|lnkd\.in)(\/[^\s]*)?$/i
      }
    };

    const genericUrlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const isValidPhone = (phoneStr) => {
      if (!phoneStr || typeof phoneStr !== 'string') return false;
      const digitsOnly = phoneStr.replace(/\D/g, '');
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    };

    const isBlank = (v) => !v || typeof v !== 'string' || !v.trim() || v === 'null' || v === 'undefined';

    const getPlatformConfig = (targetEl, rawVal = '') => {
      const presetId = (targetEl.getAttribute('data-preset-id') || '').toLowerCase();
      if (SOCIAL_PLATFORMS[presetId]) return { platformKey: presetId, ...SOCIAL_PLATFORMS[presetId] };
      if (presetId === 'twitter') return { platformKey: 'x', ...SOCIAL_PLATFORMS.x };

      const name = ((targetEl.getAttribute('data-name') || targetEl.id || '') + '').toLowerCase();
      if (name.includes('youtube')) return { platformKey: 'youtube', ...SOCIAL_PLATFORMS.youtube };
      if (name.includes('instagram')) return { platformKey: 'instagram', ...SOCIAL_PLATFORMS.instagram };
      if (name.includes('twitter') || name.includes('x')) return { platformKey: 'x', ...SOCIAL_PLATFORMS.x };
      if (name.includes('facebook')) return { platformKey: 'facebook', ...SOCIAL_PLATFORMS.facebook };
      if (name.includes('linkedin')) return { platformKey: 'linkedin', ...SOCIAL_PLATFORMS.linkedin };

      const val = (rawVal || '').trim().toLowerCase();
      if (val.includes('youtube.com') || val.includes('youtu.be')) return { platformKey: 'youtube', ...SOCIAL_PLATFORMS.youtube };
      if (val.includes('instagram.com') || val.includes('instagr.am')) return { platformKey: 'instagram', ...SOCIAL_PLATFORMS.instagram };
      if (val.includes('twitter.com') || val.includes('x.com')) return { platformKey: 'x', ...SOCIAL_PLATFORMS.x };
      if (val.includes('facebook.com') || val.includes('fb.com') || val.includes('fb.watch') || val.includes('fb.me')) return { platformKey: 'facebook', ...SOCIAL_PLATFORMS.facebook };
      if (val.includes('linkedin.com') || val.includes('lnkd.in')) return { platformKey: 'linkedin', ...SOCIAL_PLATFORMS.linkedin };

      const displayName = presetId === 'location' ? 'Location' : (presetId === 'interactive-button' ? 'Button' : 'Open Link');
      return {
        platformKey: 'generic',
        name: displayName,
        regex: genericUrlRegex
      };
    };

    const parser = new DOMParser();
    const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;

    for (let pageIdx = 0; pageIdx < pagesList.length; pageIdx++) {
      const page = pagesList[pageIdx];
      if (!page || !page.html) continue;

      let safeStr = page.html;
      if (!safeStr.includes('xmlns:xlink=')) safeStr = safeStr.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
      let doc;
      try {
        doc = parser.parseFromString(safeStr, 'image/svg+xml');
        if (doc.querySelector('parsererror')) {
          doc = parser.parseFromString(safeStr, 'text/html');
        }
      } catch {
        continue;
      }

      let activeContainer = null;
      if (pageIdx === activePageIndex && editorDoc) {
        activeContainer = editorDoc.querySelector(`.page-svg-container[data-page-index="${activePageIndex}"]`);
      }

      const interactiveEls = Array.from(doc.querySelectorAll('[data-interaction], [data-is-hotspot="true"]'));

      if (activeContainer) {
        const liveEls = activeContainer.querySelectorAll('[data-interaction], [data-is-hotspot="true"]');
        liveEls.forEach(liveEl => {
          if (!interactiveEls.some(el => el.id && el.id === liveEl.id)) {
            interactiveEls.push(liveEl);
          }
        });
      }

      for (let el of interactiveEls) {
        if (el.getAttribute('data-name') === 'Overlay' || el.getAttribute('data-type') === 'shield') continue;

        let liveEl = null;
        if (activeContainer && el.id) {
          try {
            liveEl = activeContainer.querySelector(`[id="${CSS.escape(el.id)}"]`);
          } catch  { /* ignore */ }
        }
        const targetEl = liveEl || el;

        let action = targetEl.getAttribute('data-interaction');
        if (!action && targetEl.getAttribute('data-is-hotspot') === 'true') {
          action = 'open-link';
        }

        if (!action || action === 'none' || action === 'null' || action === 'undefined' || !action.trim()) {
          continue;
        }

        action = action.trim();
        const val = targetEl.getAttribute('data-interaction-value');

        if (action === 'open-link') {
          const platform = getPlatformConfig(targetEl, val);
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: platform.name,
              message: `Please enter a URL for "${platform.name}" on Page ${pageIdx + 1}`
            };
          } else if (!platform.regex.test(val.trim())) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: platform.name,
              message: `Please enter a valid ${platform.name} link on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'whatsapp') {
          const waMessage = targetEl.getAttribute('data-interaction-whatsapp-message');
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'WhatsApp',
              message: `Please enter a WhatsApp number on Page ${pageIdx + 1}`
            };
          } else if (!isValidPhone(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'WhatsApp',
              message: `Please enter a valid WhatsApp number on Page ${pageIdx + 1}`
            };
          } else if (isBlank(waMessage)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'WhatsApp',
              message: `Please enter a message for "WhatsApp" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'email') {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Email',
              message: `Please enter an email address for "Email" on Page ${pageIdx + 1}`
            };
          } else if (!emailRegex.test(val.trim())) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Email',
              message: `Please enter a valid email address on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'call') {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Call',
              message: `Please enter a phone number for "Call" on Page ${pageIdx + 1}`
            };
          } else if (!isValidPhone(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Call',
              message: `Please enter a valid phone number for "Call" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'navigate-to') {
          const pageNum = parseInt(val, 10);
          if (isBlank(val) || isNaN(pageNum) || pageNum < 1 || pageNum > pagesList.length) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Navigate to',
              message: `Please select a valid target page for "Navigate to" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'slideshow') {
          let hasImages = false;
          if (!isBlank(val) && val.trim() !== '[]') {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed) && parsed.length > 0) hasImages = true;
            } catch  { /* ignore */ }
          }
          if (!hasImages) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Slideshow',
              message: `Please upload images for "Slideshow" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'audio') {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Audio',
              message: `Please upload or select an audio file for "Audio" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'download') {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Download',
              message: `Please upload a file for "Download" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === '3d-viewer') {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: '3D Viewer',
              message: `Please select or upload a 3D model for "3D Viewer" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'popup') {
          const hasCustomHtml = targetEl.getAttribute('data-interaction-popup-custom-html');
          if (isBlank(val) && isBlank(hasCustomHtml)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Popup',
              message: `Please select a template for "Popup" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'info-box') {
          let hasText = false;
          if (!isBlank(val)) {
            try {
              const parsed = JSON.parse(val);
              if (parsed && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
                hasText = true;
              }
            } catch {
              if (val.trim().length > 0) hasText = true;
            }
          }
          if (!hasText) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Info Box',
              message: `Please enter text for "Info Box" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'tooltip') {
          const tooltipSettings = targetEl.getAttribute('data-tooltip-settings') || val;
          let hasText = false;
          if (!isBlank(tooltipSettings)) {
            try {
              const parsed = JSON.parse(tooltipSettings);
              if (parsed && typeof parsed.text === 'string' && parsed.text.trim().length > 0) {
                hasText = true;
              }
            } catch {
              if (tooltipSettings.trim().length > 0) hasText = true;
            }
          }
          if (!hasText) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: 'Tooltip',
              message: `Please enter text for "Tooltip" on Page ${pageIdx + 1}`
            };
          }
        } else if (action === 'zoom') {
          // Zoom uses default levels
        } else {
          if (isBlank(val)) {
            return {
              isValid: false,
              pageIndex: pageIdx,
              elementId: targetEl.id,
              action: action,
              actionLabel: actionLabels[action] || action,
              message: `Please provide input for "${actionLabels[action] || action}" on Page ${pageIdx + 1}`
            };
          }
        }
      }
    }

    return { isValid: true };
  };
