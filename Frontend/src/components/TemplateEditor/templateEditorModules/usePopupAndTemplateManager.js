/**
 * usePopupAndTemplateManager.js
 * Manages modal-based interactive popup customization (sub-template picker,
 * popup editing context, live apply/cancel) and template ingestion/page insertion.
 */

import { useState } from 'react';
import { TEMPLATES as popupTemplates } from '../PopupTemplateSelection';
import { formatTemplateSvgToPageSvg } from '../../../utils/editorUtils';
import { parseLayersFromSVG } from './svgFilterUtils';

export const usePopupAndTemplateManager = ({
  pages,
  setPages,
  activePageIndex,
  setActivePageIndex,
  saveToHistory,
  setHasUnsavedChanges,
  getFlipbookDimensions,
  isDoublePage,
  setIsDoublePage,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds,
  setMultiSelectedIds,
  currentFrameId,
  setCurrentFrameId,
  history,
  setHistory,
  redoStack,
  setRedoStack,
  activeTopTool,
  setActiveTopTool,
  createDefaultPageData
}) => {
  const [popupEditContext, setPopupEditContext] = useState(null);
  const [showPopupTemplateChange, setShowPopupTemplateChange] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState(null);

    const onCustomizePopup = async (templateId, elementId, pageIndex) => {
    const isAlreadyEditing = !!popupEditContext;

    // Try to find existing custom HTML on the element
    let initialSvgText = null;
    let existingTemplateId = null;
    try {
      const originalPage = isAlreadyEditing ? popupEditContext.backup.pages[pageIndex] : pages[pageIndex];
      if (originalPage && originalPage.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalPage.html, 'image/svg+xml');
        const el = doc.getElementById(elementId) || doc.querySelector(`[data-name="${elementId}"]`);
        if (el) {
          existingTemplateId = el.getAttribute('data-interaction-value');
          if (existingTemplateId === templateId || !templateId) {
            initialSvgText = el.getAttribute('data-interaction-popup-custom-html');
          }
        }
      }
      if (!initialSvgText) {
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        const liveEl = editorDoc.getElementById?.(elementId) || document.getElementById(elementId) || editorDoc.querySelector?.(`[data-name="${elementId}"]`);
        if (liveEl) {
          initialSvgText = liveEl.getAttribute('data-interaction-popup-custom-html');
        }
      }
    } catch (e) {
      console.error("Error checking for existing custom HTML:", e);
    }

    // Backup current states
    const backupContext = isAlreadyEditing ? { ...popupEditContext, templateId } : {
      backup: {
        pages: [...pages],
        activePageIndex,
        isDoublePage,
        selectedLayerId,
        multiSelectedIds: new Set(multiSelectedIds),
        currentFrameId,
        history: [...history],
        redoStack: [...redoStack],
        activeTopTool
      },
      elementId,
      pageIndex,
      templateId
    };

    const loadPopupData = (svgText, isNewTemplate = false) => {
      // If it's a new template, patch the backup pages so a 'Cancel' leaves the new template applied
      if (isNewTemplate) {
        const newBackupPages = [...backupContext.backup.pages];
        if (newBackupPages[pageIndex]) {
          const pageParser = new DOMParser();
          const pageDoc = pageParser.parseFromString(newBackupPages[pageIndex].html, 'image/svg+xml');
          const targetEl = pageDoc.getElementById(elementId) || pageDoc.querySelector(`[data-name="${elementId}"]`);
          if (targetEl) {
            targetEl.setAttribute('data-interaction', 'popup');
            targetEl.setAttribute('data-interaction-value', templateId);
            targetEl.setAttribute('data-interaction-popup-custom-html', svgText);
            const serializer = new XMLSerializer();
            newBackupPages[pageIndex] = {
              ...newBackupPages[pageIndex],
              html: serializer.serializeToString(pageDoc.documentElement)
            };
            backupContext.backup.pages = newBackupPages;
          }
        }
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.documentElement;

      let popupWidth = 800;
      let popupHeight = 600;
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/);
        if (parts.length === 4) {
          popupWidth = parseFloat(parts[2]);
          popupHeight = parseFloat(parts[3]);
        }
      } else {
        const w = svgEl.getAttribute('width');
        const h = svgEl.getAttribute('height');
        if (w && h && !w.includes('%') && !h.includes('%')) {
          popupWidth = parseFloat(w);
          popupHeight = parseFloat(h);
        }
      }
      backupContext.dimensions = { width: popupWidth, height: popupHeight };

      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');

      // Wrap popup content in a frame if it doesn't already have one,
      // so it behaves exactly like a page in the normal editor.
      const hasFrame = Array.from(svgEl.children).some(c => c.getAttribute('data-type') === 'frame');
      if (!hasFrame) {
        const frame = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        frame.setAttribute('data-type', 'frame');
        frame.setAttribute('data-name', 'Popup Template');
        frame.setAttribute('id', `popup-frame-${Math.random().toString(36).substr(2, 9)}`);

        // Move children into the frame (leaving defs/style at the root if possible)
        const childrenToMove = Array.from(svgEl.children).filter(c =>
          c.tagName.toLowerCase() !== 'defs' &&
          c.tagName.toLowerCase() !== 'style'
        );
        childrenToMove.forEach(c => frame.appendChild(c));

        svgEl.appendChild(frame);
      }

      let layers = parseLayersFromSVG(svgEl);
      if (layers.length === 0) {
        layers = [{
          id: 'layer-1',
          name: 'Background',
          type: 'rect',
          visible: true,
          locked: false
        }];
      }

      const serializer = new XMLSerializer();
      const serializedSvg = serializer.serializeToString(svgEl);

      // Perform the swap
      setPopupEditContext(backupContext);
      setPages([{
        id: 'popup-1',
        name: 'Popup Template',
        html: serializedSvg,
        layers: layers
      }]);
      setActivePageIndex(0);
      setIsDoublePage(false);
      setSelectedLayerId(null);
      setMultiSelectedIds(new Set());
      setCurrentFrameId(null);
      setHistory([]);
      setRedoStack([]);
      setActiveTopTool('editor');
    };

    if (initialSvgText && initialSvgText.trim() !== '') {
      loadPopupData(initialSvgText, false);
    } else {
      const template = popupTemplates.find(t => t.id === templateId);
      if (template && template.image) {
        try {
          const res = await fetch(template.image);
          if (!res.ok) throw new Error("Failed to fetch template image");
          const svgText = await res.text();
          loadPopupData(svgText, true);
        } catch (err) {
          console.error("Failed to fetch template SVG, using fallback:", err);
          const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
            <g id="layer-1" data-name="Background">
              <rect width="100%" height="100%" fill="#ffffff" rx="16" />
            </g>
            <g id="layer-2" data-name="Content">
              <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Template</text>
            </g>
          </svg>`;
          loadPopupData(fallbackSvg, true);
        }
      } else {
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
          <g id="layer-1" data-name="Background">
            <rect width="100%" height="100%" fill="#ffffff" rx="16" />
          </g>
          <g id="layer-2" data-name="Content">
            <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Popup Template</text>
          </g>
        </svg>`;
        loadPopupData(fallbackSvg, true);
      }
    }
  };

  const handleApplyPopupChanges = () => {
    if (!popupEditContext) return;
    const { backup, elementId, pageIndex, templateId } = popupEditContext;

    // Save customized HTML
    const customHtml = pages[0]?.html || '';

    // Prepare updated pages with custom HTML directly embedded in the target page
    const updatedPages = [...backup.pages];
    if (updatedPages[pageIndex]) {
      try {
        const serializer = new XMLSerializer();
        const parser = new DOMParser();
        const doc = parser.parseFromString(updatedPages[pageIndex].html, 'image/svg+xml');
        const targetEl = doc.getElementById(elementId) || doc.querySelector(`[data-name="${elementId}"]`);
        if (targetEl) {
          targetEl.setAttribute('data-interaction', 'popup');
          targetEl.setAttribute('data-interaction-value', templateId);
          targetEl.setAttribute('data-interaction-popup-custom-html', customHtml);
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            html: serializer.serializeToString(doc.documentElement)
          };
        }
      } catch (err) {
        console.error("Error embedding custom popup HTML into page:", err);
      }
    }

    // Restore original book states WITH the updated pages containing the customized popup
    setPages(updatedPages);
    setActivePageIndex(backup.activePageIndex);
    setIsDoublePage(backup.isDoublePage);
    setSelectedLayerId(backup.selectedLayerId);
    setMultiSelectedIds(backup.multiSelectedIds);
    setCurrentFrameId(backup.currentFrameId);
    setHistory(backup.history);
    setRedoStack(backup.redoStack);
    setActiveTopTool(backup.activeTopTool);

    // Reset context
    setPopupEditContext(null);

    // Update live DOM elements in main document and iframe, then dispatch event
    setTimeout(() => {
      try {
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        const mainEl = document.getElementById(elementId) || document.querySelector(`[data-name="${elementId}"]`);
        const iframeEl = editorDoc.getElementById?.(elementId) || editorDoc.querySelector?.(`[data-name="${elementId}"]`);
        [mainEl, iframeEl].forEach(el => {
          if (el) {
            el.setAttribute('data-interaction', 'popup');
            el.setAttribute('data-interaction-value', templateId);
            el.setAttribute('data-interaction-popup-custom-html', customHtml);
          }
        });
      } catch (err) {
        console.error("Error setting custom popup attributes on live DOM:", err);
      }

      // Notify InteractionPanel immediately
      window.dispatchEvent(new CustomEvent('update-popup-custom-html', {
        detail: { elementId, templateId, customHtml }
      }));
    }, 50);
  };

  const handleCancelPopupChanges = () => {
    if (!popupEditContext) return;
    const { backup } = popupEditContext;

    // Restore everything
    setPages(backup.pages);
    setActivePageIndex(backup.activePageIndex);
    setIsDoublePage(backup.isDoublePage);
    setSelectedLayerId(backup.selectedLayerId);
    setMultiSelectedIds(backup.multiSelectedIds);
    setCurrentFrameId(backup.currentFrameId);
    setHistory(backup.history);
    setRedoStack(backup.redoStack);
    setActiveTopTool(backup.activeTopTool);

    setPopupEditContext(null);
  };


    const loadTemplate = async (templateUrl, prefetchedContent = null) => {
    try {
      let content = prefetchedContent;
      if (!content) {
        const response = await fetch(templateUrl);
        content = await response.text();
      }

      const parser = new DOMParser();
      const targetIndex = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;
      const currentPage = pages[targetIndex];

      if (!currentPage) return;

      // 0. Detect and dynamically load any new fonts used in the template
      const fontsToLoad = new Set();
      const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
      let match;
      while ((match = cssRegex.exec(content)) !== null) {
        let f = match[1] || match[2];
        f = f.split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }
      const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
      while ((match = attrRegex.exec(content)) !== null) {
        let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
      }

      fontsToLoad.forEach(font => {
        const fontId = `dynamic-font-${font.replace(/\s+/g, '-')}`;
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.href = `https://fonts.googleapis.com/css?family=${font.replace(/\s+/g, '+')}:300,400,500,600,700,800,900&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      });

      // 1. Parse template content
      const templateDoc = parser.parseFromString(content, 'image/svg+xml');
      const templateSvg = templateDoc.querySelector('svg');
      if (!templateSvg) return;

      // --- CRITICAL: Scope all IDs and Classes in the template to avoid collisions ---
      const tplPrefix = `tpl-${Math.random().toString(36).substr(2, 4)}`;
      const allTplElements = templateSvg.querySelectorAll('*');
      const idRefRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;

      // Step A: Prefix every ID and update references in attributes
      allTplElements.forEach(el => {
        // IDs
        if (el.id) el.id = `${tplPrefix}-${el.id}`;

        // Classes
        const classVal = el.getAttribute('class');
        if (classVal) {
          const prefixedClasses = classVal.split(/\s+/).map(c => c ? `${tplPrefix}-${c}` : c).join(' ');
          el.setAttribute('class', prefixedClasses);
        }

        // Direct Attributes that refer to IDs (fill, stroke, etc.)
        const refAttrs = ['fill', 'stroke', 'filter', 'mask', 'clip-path'];
        refAttrs.forEach(attr => {
          const val = el.getAttribute(attr);
          if (val) {
            const newVal = val.replace(idRefRegex, `url(#${tplPrefix}-$1)`);
            if (newVal !== val) el.setAttribute(attr, newVal);
          }
        });

        // Inline Styles (e.g. style="fill:url(#id)")
        const styleText = el.getAttribute('style');
        if (styleText && styleText.includes('url(#')) {
          el.setAttribute('style', styleText.replace(idRefRegex, `url(#${tplPrefix}-$1)`));
        }

        // Links
        ['xlink:href', 'href'].forEach(attr => {
          const val = el.getAttribute(attr);
          if (val && val.startsWith('#')) {
            el.setAttribute(attr, `#${tplPrefix}-${val.substring(1)}`);
          }
        });
      });

      // Step B: Update references and CLASS selectors INSIDE <style> blocks
      const tplStyles_scoping = templateSvg.querySelectorAll('style');
      tplStyles_scoping.forEach(style => {
        if (style.textContent) {
          // 1. Update ID references: url(#id) -> url(#prefix-id)
          let css = style.textContent.replace(idRefRegex, `url(#${tplPrefix}-$1)`);
          // 2. Update Class selectors: .st0 { -> .prefix-st0 {
          // This matches a dot followed by alphanumeric/dashes, ensuring it's a class selector
          css = css.replace(/\.([a-zA-Z0-9_-]+)(?=[^{}]*\{)/g, `.${tplPrefix}-$1`);
          style.textContent = css;
        }
      });
      // -------------------------------------------------------------------

      // 2. Always start with a fresh canvas when applying a template, preserving the background color
      const oldDoc = parser.parseFromString(currentPage.html || '', 'image/svg+xml');
      const currentBg = oldDoc.querySelector('[data-name="Overlay"]')?.getAttribute('fill') || '#ffffff';

      const { html: defaultHtml } = createDefaultPageData(currentPage.name);
      const pageDoc = parser.parseFromString(defaultHtml, 'image/svg+xml');
      let pageSvg = pageDoc.querySelector('svg');

      const newOverlay = pageSvg.querySelector('[data-name="Overlay"]');
      if (newOverlay) {
        newOverlay.setAttribute('fill', currentBg);
      }

      // 3. Find the Root Folder (<g>) - prioritized by data-type="frame"
      const rootFolder = pageSvg.querySelector('g[data-type="frame"]') || pageSvg.querySelector('g');

      // 4. Calculate Scale to Fit (Target: Actual Flipbook Dimensions)
      const { width: targetW, height: targetH } = getFlipbookDimensions();
      let templateWidth = parseFloat(templateSvg.getAttribute('width'));
      let templateHeight = parseFloat(templateSvg.getAttribute('height'));
      const viewBoxStr = templateSvg.getAttribute('viewBox');
      let viewBoxX = 0;
      let viewBoxY = 0;

      if (viewBoxStr) {
        const parts = viewBoxStr.trim().split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          viewBoxX = parts[0];
          viewBoxY = parts[1];
          templateWidth = parts[2];
          templateHeight = parts[3];
        }
      }

      // Default to target dimensions if unknown to avoid division by zero
      if (!templateWidth) templateWidth = targetW;
      if (!templateHeight) templateHeight = targetH;

      const scale = Math.min(targetW / templateWidth, targetH / templateHeight);
      const offsetX = (targetW - templateWidth * scale) / 2;
      const offsetY = (targetH - templateHeight * scale) / 2;

      // 5. Handle Defs, Style and Resource merging
      const RESOURCE_TAGS = ['mask', 'clippath', 'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'marker'];

      // Automatically move ALL resource tags found ANYWHERE in the template into our target defs
      const allResources = templateSvg.querySelectorAll(RESOURCE_TAGS.join(','));
      let targetDefs = pageSvg.querySelector('defs');

      if (allResources.length > 0) {
        if (!targetDefs) {
          targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
        }
        allResources.forEach(res => {
          const imported = pageDoc.importNode(res, true);
          targetDefs.appendChild(imported);
        });
      }

      const templateDefs = templateSvg.querySelector('defs');
      if (templateDefs) {
        if (!targetDefs) {
          targetDefs = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
          pageSvg.insertBefore(targetDefs, pageSvg.firstChild);
        }
        Array.from(templateDefs.children).forEach(child => {
          targetDefs.appendChild(pageDoc.importNode(child, true));
        });
      }

      const templateStyles = templateSvg.querySelectorAll('style');
      if (templateStyles.length > 0) {
        let targetStyle = pageSvg.querySelector('style');
        if (!targetStyle) {
          targetStyle = pageDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
          const firstEl = pageSvg.firstChild;
          pageSvg.insertBefore(targetStyle, firstEl);
        }
        templateStyles.forEach(s => {
          targetStyle.textContent += s.textContent + '\n';
        });
      }

      // 6. Inject template content into root folder (Ungrouped)
      // Extract children from the template - unwrap any outermost artboard/parent container <g> tags
      const getExplodedTemplateChildren = (svg) => {
        const unwrapGroup = (group) => {
          // IMPORTANT: Transfer visual inheritance (fill, stroke, masks, clip-path, etc.)
          const attrsToInherit = [
            'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
            'opacity', 'visibility', 'filter', 'color', 'clip-path', 'mask',
            'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
          ];
          attrsToInherit.forEach(attr => {
            const val = group.getAttribute(attr);
            if (val) {
              Array.from(group.children).forEach(child => {
                if (!child.hasAttribute(attr)) {
                  child.setAttribute(attr, val);
                }
              });
            }
          });

          // Inherit style
          const groupStyle = group.getAttribute('style');
          if (groupStyle) {
            Array.from(group.children).forEach(child => {
              const childStyle = child.getAttribute('style');
              child.setAttribute('style', childStyle ? `${groupStyle}; ${childStyle}` : groupStyle);
            });
          }

          // Inherit classes
          const groupClass = group.getAttribute('class');
          if (groupClass) {
            Array.from(group.children).forEach(child => {
              const childClass = child.getAttribute('class');
              child.setAttribute('class', childClass ? `${groupClass} ${childClass}` : groupClass);
            });
          }

          // Inherit transform
          const groupTransform = group.getAttribute('transform') || '';
          if (groupTransform) {
            Array.from(group.children).forEach(child => {
              const childTransform = child.getAttribute('transform') || '';
              child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
            });
          }

          // Move children before group and remove group
          const children = Array.from(group.children);
          children.forEach(c => group.parentNode.insertBefore(c, group));
          group.parentNode.removeChild(group);
        };

        const getContentChildren = () => Array.from(svg.children).filter(child =>
          !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
          !RESOURCE_TAGS.includes(child.tagName.toLowerCase())
        );

        let infants = getContentChildren();
        let unwrapped = true;
        while (unwrapped) {
          unwrapped = false;
          infants = getContentChildren();

          // If there's exactly one main group, unwrap it
          if (infants.length === 1 && infants[0].tagName.toLowerCase() === 'g') {
            unwrapGroup(infants[0]);
            unwrapped = true;
            continue;
          }

          // If there are 2 elements (one background rect and one content group), unwrap the group
          if (infants.length === 2) {
            const groupEl = infants.find(c => c.tagName.toLowerCase() === 'g');
            const rectEl = infants.find(c => c.tagName.toLowerCase() === 'rect');
            if (groupEl && rectEl) {
              unwrapGroup(groupEl);
              unwrapped = true;
              continue;
            }
          }
        }

        return getContentChildren();
      };

      const finalTemplateElements = getExplodedTemplateChildren(templateSvg);

      // 6. Inject template content into root folder (Ungrouped & Non-Destructive)
      if (rootFolder || pageSvg) {
        const targetParent = rootFolder || pageSvg;

        // Find the 'Overlay' layer (absolute background) to insert AFTER it
        const overlayChild = Array.from(targetParent.children).find(el => el.getAttribute('data-name') === 'Overlay');
        const nextSiblingRef = overlayChild ? overlayChild.nextSibling : targetParent.firstChild;

        // Inherit visual attributes from the original template SVG
        const svgAttrs = [
          'fill', 'stroke', 'stroke-width', 'opacity', 'visibility', 'filter', 'color', 'clip-path', 'mask',
          'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'letter-spacing', 'word-spacing'
        ];

        finalTemplateElements.forEach(child => {
          const imported = pageDoc.importNode(child, true);

          // Inherit top-level SVG attributes if not explicitly set on element
          svgAttrs.forEach(attr => {
            const val = templateSvg.getAttribute(attr);
            if (val && !imported.hasAttribute(attr)) {
              imported.setAttribute(attr, val);
            }
          });

          // Inherit top-level style
          const svgStyle = templateSvg.getAttribute('style');
          if (svgStyle) {
            const importedStyle = imported.getAttribute('style');
            imported.setAttribute('style', importedStyle ? `${svgStyle}; ${importedStyle}` : svgStyle);
          }

          // Inherit top-level class
          const svgClass = templateSvg.getAttribute('class');
          if (svgClass) {
            const importedClass = imported.getAttribute('class');
            imported.setAttribute('class', importedClass ? `${svgClass} ${importedClass}` : svgClass);
          }

          // Apply scaling and translation to fit A4
          const currentTransform = imported.getAttribute('transform') || '';
          const fittingTransform = `translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-viewBoxX}, ${-viewBoxY})`;
          imported.setAttribute('transform', `${fittingTransform} ${currentTransform}`.trim());

          // Insert into target parent
          if (nextSiblingRef) {
            targetParent.insertBefore(imported, nextSiblingRef);
          } else {
            targetParent.appendChild(imported);
          }
        });
      }

      // 7. Update HTML and Layers state
      const serializer = new XMLSerializer();

      const parseLayersAndSetIds = (element) => {
        return Array.from(element.children)
          .filter(child =>
            !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
            child.getAttribute('data-name') !== 'Overlay'
          )
          .map((child) => {
            const id = child.getAttribute('id') || child.id || `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
            if (!child.getAttribute('id') && !child.id) child.setAttribute('id', id);

            const rawName = child.getAttribute('data-name') || id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
            // Strip the unique template prefix for cleaner display (e.g. tpl-a1b2-MyLayer -> MyLayer)
            const cleanName = rawName.replace(/^tpl-[a-z0-9]{4}-/, '');

            const layer = {
              id: id,
              name: cleanName,
              type: child.tagName.toLowerCase(),
              visible: true,
              locked: false
            };

            if (child.tagName.toLowerCase() === 'g' && child.children.length > 0) {
              layer.children = parseLayersAndSetIds(child);
            }

            return layer;
          });
      };

      const updatedLayers = parseLayersAndSetIds(pageSvg);
      const updatedHtml = serializer.serializeToString(pageSvg);

      setPages(prev => {
        const updated = [...prev];
        if (updated[targetIndex]) {
          updated[targetIndex] = {
            ...updated[targetIndex],
            html: updatedHtml,
            layers: updatedLayers
          };
        }
        return updated;
      });

      // Update selection to the new root folder of the active page
      if (updatedLayers.length > 0 && targetIndex === activePageIndex) {
        const rootId = updatedLayers[0].id;
        setSelectedLayerId(rootId);
        setMultiSelectedIds(new Set([rootId]));
        setCurrentFrameId(rootId);
      }

      setTemplateTargetIndex(null);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  // Handler to add or replace template pages into the active flipbook
  const handleAddTemplatePages = async ({ selectedPages, placement = 'start_at', targetIndex }) => {
    if (!selectedPages || selectedPages.length === 0) return;
    saveToHistory();

    const { width: targetW, height: targetH } = getFlipbookDimensions();
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const insertIdx = targetIndex !== undefined && targetIndex !== null ? targetIndex : activePageIndex;

    const formattedPages = await Promise.all(
      selectedPages.map(async (p, idx) => {
        let svgText = p.rawSvg || '';
        if (!svgText && p.url) {
          try {
            const fetchUrl = p.url.startsWith('http') ? p.url : `${backendUrl}${p.url}`;
            const res = await fetch(fetchUrl);
            if (res.ok) svgText = await res.text();
          } catch (e) {
            console.error('Failed to fetch page svg:', e);
          }
        }

        let targetPageNum;
        if (placement === 'start_at' || placement === 'replace') {
          targetPageNum = insertIdx + idx + 1;
        } else if (placement === 'after') {
          targetPageNum = insertIdx + idx + 2;
        } else if (placement === 'before' || placement === 'start') {
          targetPageNum = (placement === 'start' ? 0 : insertIdx) + idx + 1;
        } else {
          targetPageNum = pages.length + idx + 1;
        }

        const pageName = `Page ${targetPageNum}`;
        const formattedHtml = formatTemplateSvgToPageSvg(svgText || '', targetW, targetH, pageName);
        const parser = new DOMParser();
        const doc = parser.parseFromString(formattedHtml, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        const layers = svgEl ? parseLayersFromSVG(svgEl) : [];

        const newPageId = 'page_' + Math.random().toString(36).substr(2, 9);
        return {
          id: newPageId,
          v_id: newPageId,
          name: pageName,
          html: formattedHtml,
          layers: layers,
          isHidden: false,
          isLazy: false
        };
      })
    );

    let newActiveIdx = insertIdx;

    setPages(prev => {
      let updated = [...prev];

      if (placement === 'start_at' || placement === 'replace') {
        // Place template pages starting at the open page (insertIdx), continuing sequentially
        formattedPages.forEach((fPage, idx) => {
          const currentIdx = insertIdx + idx;
          if (currentIdx < updated.length) {
            updated[currentIdx] = {
              ...updated[currentIdx],
              html: fPage.html,
              layers: fPage.layers
            };
          } else {
            updated.push(fPage);
          }
        });
        newActiveIdx = insertIdx;
      } else if (placement === 'after') {
        updated.splice(insertIdx + 1, 0, ...formattedPages);
        newActiveIdx = insertIdx + 1;
      } else if (placement === 'before') {
        updated.splice(insertIdx, 0, ...formattedPages);
        newActiveIdx = insertIdx;
      } else if (placement === 'start') {
        updated.unshift(...formattedPages);
        newActiveIdx = 0;
      } else if (placement === 'end') {
        newActiveIdx = updated.length;
        updated.push(...formattedPages);
      } else {
        formattedPages.forEach((fPage, idx) => {
          const currentIdx = insertIdx + idx;
          if (currentIdx < updated.length) {
            updated[currentIdx] = {
              ...updated[currentIdx],
              html: fPage.html,
              layers: fPage.layers
            };
          } else {
            updated.push(fPage);
          }
        });
        newActiveIdx = insertIdx;
      }

      // Re-index all pages so names and layer data-name are continuous: Page 1, Page 2, Page 3...
      updated = updated.map((page, i) => {
        const canonicalName = `Page ${i + 1}`;
        let updatedHtml = page.html || '';

        if (updatedHtml) {
          updatedHtml = updatedHtml.replace(
            /(<g\b[^>]*\bdata-type=["']frame["'][^>]*\bdata-name=["'])[^"']*([ "'])/i,
            `$1${canonicalName}$2`
          );
        }

        const updatedLayers = Array.isArray(page.layers) ? page.layers.map(l => {
          if (l.children && (l.type === 'g' || l.name?.startsWith('Page '))) {
            return { ...l, name: canonicalName };
          }
          return l;
        }) : page.layers;

        return {
          ...page,
          name: canonicalName,
          html: updatedHtml,
          layers: updatedLayers
        };
      });

      return updated;
    });

    setTimeout(() => {
      const firstRootId = formattedPages[0]?.layers?.[0]?.id;
      if (firstRootId) {
        setSelectedLayerId(firstRootId);
        setMultiSelectedIds(new Set([firstRootId]));
        setCurrentFrameId(firstRootId);
      }
    }, 50);

    setActivePageIndex(newActiveIdx);
    setHasUnsavedChanges(true);
    setShowTemplateModal(false);
    setTemplateTargetIndex(null);
  };

  const handleOpenTemplateModal = (index) => {
    if (popupEditContext) {
      setShowPopupTemplateChange(true);
    } else {
      setTemplateTargetIndex(index !== undefined ? index : activePageIndex);
      setShowTemplateModal(true);
    }
  };


  return {
    popupEditContext,
    setPopupEditContext,
    showPopupTemplateChange,
    setShowPopupTemplateChange,
    showTemplateModal,
    setShowTemplateModal,
    templateTargetIndex,
    setTemplateTargetIndex,
    onCustomizePopup,
    handleApplyPopupChanges,
    handleCancelPopupChanges,
    loadTemplate,
    handleAddTemplatePages,
    handleOpenTemplateModal
  };
};
