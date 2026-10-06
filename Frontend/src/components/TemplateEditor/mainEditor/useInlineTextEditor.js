import { checkSpellingAndGrammar, getSpellingSuggestions } from '../spellGrammarChecker';
import { convertTextToForeignObject } from './textConversionUtils';
import { clearOverlayType } from './geometryUtils';
import { getTopLevelFrames } from './frameHierarchyUtils';
import { TYPE_CURSOR, PENCIL_CURSOR, PEN_CURSOR, SHAPE_CURSOR } from './constants';

/**
 * Custom hook to manage inline text editing within SVG foreignObjects,
 * caret positioning, auto-resizing, font styles, and Google Docs-style spell/grammar checking.
 */
export const useInlineTextEditor = ({
  isEditingTextRef,
  selectedLayerIdRef,
  multiSelectedIdsRef,
  activeMainToolRef,
  selectedPenToolRef,
  suppressClickRef,
  currentFrameIdRef,
  activeTopTool,
  activePageIndex,
  pages,
  setSelectedLayerId,
  setMultiSelectedIds,
  setCurrentFrameId,
  drawOverlayHighlight,
  saveModifiedPageHtml
}) => {
  const enterTextEditMode = (target, clientX = null, clientY = null, selectAll = false) => {
    if (!target || !target.id) return;
    if (activeTopTool === 'interaction' || activeTopTool === 'animation') return;

    let foTarget = target;

    // If the target is a raw <text> element, convert it to foreignObject first
    if (target.tagName.toLowerCase() === 'text' || target.tagName.toLowerCase() === 'tspan') {
      const textEl = target.tagName.toLowerCase() === 'tspan' ? target.closest('text') : target;
      if (!textEl) return;
      const fo = convertTextToForeignObject(textEl);
      if (!fo) return;
      textEl.replaceWith(fo);
      foTarget = fo;

      // Explicitly redraw the highlight now that the FO is in the DOM
      requestAnimationFrame(() => {
        const highlightType = document.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`) ? 'child-selected' : 'selected';
        drawOverlayHighlight(foTarget, highlightType);
      });

      // Update selection to reflect new FO id (same as original text id)
      if (setSelectedLayerId) setSelectedLayerId(fo.id);
      selectedLayerIdRef.current = fo.id;
      if (setMultiSelectedIds) {
        setMultiSelectedIds(new Set([fo.id]));
        multiSelectedIdsRef.current = new Set([fo.id]);
      }
    }

    if (foTarget.tagName.toLowerCase() !== 'foreignobject') return;

    let div = foTarget.firstElementChild;
    if (!div) return;
    if (div.classList.contains('flipbook-text-outer')) {
      const scrollbarDiv = div.querySelector('.flipbook-text-scrollbar');
      if (scrollbarDiv) div = scrollbarDiv;
    }

    isEditingTextRef.current = true;
    const svgRoot = foTarget.ownerSVGElement;

    // Set cursor for the wrapper container
    const svgContainer = foTarget.closest('.page-svg-container');
    if (svgContainer) {
      const divWrapper = svgContainer.querySelector('div');
      if (divWrapper) divWrapper.style.cursor = 'text';
    }

    // Keep the main selection overlay but remove the corner dots
    document.querySelectorAll('.selection-overlay-layer .resize-handle').forEach(h => h.remove());
    document.querySelectorAll('[id^="highlight-overlay-html-"] .resize-handle').forEach(h => h.remove());

    clearOverlayType('hover');
    clearOverlayType('child-hover');

    // Mark as editing
    foTarget.setAttribute('data-editing', 'true');
    div.setAttribute('contenteditable', 'true');
    div.style.outline = 'none';
    div.style.userSelect = 'text';
    div.style.pointerEvents = 'auto';
    div.style.cursor = 'text';

    const stopScrollPropagation = (e) => {
      e.stopPropagation();
    };
    div.addEventListener('mousedown', stopScrollPropagation);
    div.addEventListener('pointerdown', stopScrollPropagation);
    div.addEventListener('touchstart', stopScrollPropagation);
    div.addEventListener('wheel', stopScrollPropagation);

    const handleInput = () => {
      const sizingMode = foTarget.getAttribute('data-sizing-mode') || 'auto-height';
      const isScrollable = foTarget.getAttribute('data-scrollable') === 'true';

      if (!isScrollable) {
        const oldHeight = div.style.height;
        const oldMinHeight = div.style.minHeight;
        const oldWidth = div.style.width;

        // Temporarily allow height to shrink to measure true text height
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');

        if (sizingMode === 'auto-width') {
          div.style.setProperty('width', 'max-content', 'important');
        }

        const contentH = div.scrollHeight;
        const contentW = div.scrollWidth;

        div.style.setProperty('height', oldHeight || '100%', 'important');
        div.style.setProperty('min-height', oldMinHeight || '100%', 'important');
        if (sizingMode === 'auto-width') {
          div.style.setProperty('width', oldWidth || '100%', 'important');
        }

        const foH = parseFloat(foTarget.getAttribute('height')) || 0;
        const foW = parseFloat(foTarget.getAttribute('width')) || 0;
        const currentX = parseFloat(foTarget.getAttribute('x')) || 0;

        if (sizingMode === 'auto-width' && Math.abs(contentW - foW) > 2) {
          const widthDiff = contentW - foW;
          const align = window.getComputedStyle(div).textAlign;
          foTarget.setAttribute('width', Math.max(contentW + 4, 10));
          if (align === 'center') {
            foTarget.setAttribute('x', currentX - (widthDiff / 2));
          } else if (align === 'right' || align === 'end') {
            foTarget.setAttribute('x', currentX - widthDiff);
          }
        }

        if (sizingMode !== 'fixed' && Math.abs(contentH - foH) > 2) {
          foTarget.setAttribute('height', contentH + 4);
        }

        // Always ensure the selection overlay highlight precisely encloses the current element
        const highlightType = document.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`) ? 'child-selected' : 'selected';
        const container = foTarget.closest('.page-svg-container');
        if (container) {
          const pageIdx = container.getAttribute('data-page-index');
          const overlay = document.getElementById(`highlight-overlay-${pageIdx}`);
          if (overlay) {
            const oldSel = overlay.querySelector(`[id="overlay-poly-selected-${foTarget.id}"]`);
            if (oldSel) oldSel.remove();
            const oldChildSel = overlay.querySelector(`[id="overlay-poly-child-selected-${foTarget.id}"]`);
            if (oldChildSel) oldChildSel.remove();
          }
        }
        drawOverlayHighlight(foTarget, highlightType);
        clearOverlayType('hover');
        clearOverlayType('child-hover');

        // Also redraw parent group's entered overlay to prevent the dashed line from sticking in the middle
        const parentGroup = foTarget.closest('g');
        if (parentGroup && parentGroup.getAttribute('data-name') === 'Group') {
          const overlayNode = document.querySelector(`[id="overlay-poly-entered-${parentGroup.id}"]`);
          if (overlayNode) {
            overlayNode.remove();
            drawOverlayHighlight(parentGroup, 'entered');
          }
        }
      }
    };
    div.addEventListener('input', handleInput);
    div.focus();

    // Immediately trigger a resize so it precisely shrink-wraps the initial text
    handleInput();

    // Place cursor at the clicked position using caretRangeFromPoint if coords are available
    // Otherwise fall back to end of text
    const placeCaretAtClick = (cx, cy) => {
      let placed = false;
      if (selectAll) {
        const range = document.createRange();
        range.selectNodeContents(div);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        placed = true;
      } else if (cx !== null && cy !== null) {
        // Standard (Chrome/Edge/Safari)
        if (document.caretRangeFromPoint) {
          const clickRange = document.caretRangeFromPoint(cx, cy);
          if (clickRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(clickRange);
            placed = true;
          }
          // Firefox
        } else if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(cx, cy);
          if (pos) {
            const range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            placed = true;
          }
        }
      }
      if (!placed) {
        // Fallback: move to end
        const range = document.createRange();
        range.selectNodeContents(div);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    // Use a tiny timeout so the browser has fully rendered the contenteditable before we place the caret
    setTimeout(() => placeCaretAtClick(clientX, clientY), 0);

    // ── Google Docs-Style Spell & Grammar Checker & Suggestion Popup ──
    div.setAttribute('spellcheck', 'true');

    let grammarCheckTimer = null;
    let activeSuggestionPopup = null;

    const closeSuggestionPopup = () => {
      if (activeSuggestionPopup) {
        activeSuggestionPopup.remove();
        activeSuggestionPopup = null;
      }
    };

    const runSpellGrammarCheck = () => {
      if (!isEditingTextRef.current) return;
      if (foTarget.getAttribute('data-grammar-check') === 'false') {
        div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
          m.replaceWith(document.createTextNode(m.textContent || ''));
        });
        return;
      }
      const text = div.innerText || div.textContent || '';
      if (!text || text.trim().length === 0) return;

      const issues = checkSpellingAndGrammar(text);

      // Save cursor position
      let selOffset = 0;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preRange = range.cloneRange();
        preRange.selectNodeContents(div);
        preRange.setEnd(range.startContainer, range.startOffset);
        selOffset = preRange.toString().length;
      }

      // 1. Unwrap existing mark tags in-place while keeping text intact
      const existingMarks = Array.from(div.querySelectorAll('mark.grammar-issue-word'));
      existingMarks.forEach(m => {
        const parent = m.parentNode;
        while (m.firstChild) {
          parent.insertBefore(m.firstChild, m);
        }
        m.remove();
        parent.normalize();
      });

      if (issues.length === 0) {
        handleInput();
        return;
      }

      // 2. Wrap matching incorrect words in-place without altering any line breaks or DOM tree
      const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue && n.nodeValue.length > 0) {
          textNodes.push(n);
        }
      }

      // Track global text offset across text nodes
      let runningOffset = 0;
      for (const textNode of textNodes) {
        const nodeText = textNode.nodeValue;
        const nodeStart = runningOffset;
        const nodeEnd = runningOffset + nodeText.length;

        // Find issues that fall strictly within this text node
        const nodeIssues = issues.filter(iss => iss.startIndex >= nodeStart && iss.endIndex <= nodeEnd)
          .sort((a, b) => b.startIndex - a.startIndex); // Process backwards so offsets remain valid

        for (const iss of nodeIssues) {
          const relStart = iss.startIndex - nodeStart;
          const relEnd = iss.endIndex - nodeStart;

          const word = nodeText.substring(relStart, relEnd);
          const cls = iss.type === 'spelling' ? 'grammar-issue-word issue-spelling' : 'grammar-issue-word issue-grammar';
          const suggData = encodeURIComponent(JSON.stringify(iss.suggestions || []));
          const msg = encodeURIComponent(iss.message || '');

          try {
            const range = document.createRange();
            range.setStart(textNode, relStart);
            range.setEnd(textNode, relEnd);

            const mark = document.createElement('mark');
            mark.className = cls;
            mark.setAttribute('data-word', word);
            mark.setAttribute('data-suggestions', suggData);
            mark.setAttribute('data-message', msg);
            range.surroundContents(mark);
          } catch { /* ignored */ }
        }

        runningOffset = nodeEnd;
      }

      // Restore caret position
      restoreCaretPosition(div, selOffset);

      // Re-measure content to ensure text frame and selection boundary precisely enclose all wrapped lines
      handleInput();
    };



    function restoreCaretPosition(container, targetOffset) {
      try {
        let currentOffset = 0;
        let targetNode = null;
        let nodeOffset = 0;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
          const len = node.nodeValue.length;
          if (currentOffset + len >= targetOffset) {
            targetNode = node;
            nodeOffset = targetOffset - currentOffset;
            break;
          }
          currentOffset += len;
        }

        if (targetNode) {
          const newRange = document.createRange();
          newRange.setStart(targetNode, Math.min(nodeOffset, targetNode.nodeValue.length));
          newRange.collapse(true);
          const s = window.getSelection();
          if (s) {
            s.removeAllRanges();
            s.addRange(newRange);
          }
        }
      } catch { /* ignored */ }
    }

    const showSuggestionPopup = (markEl) => {
      closeSuggestionPopup();

      const word = markEl.getAttribute('data-word') || markEl.textContent;
      let suggestions = [];
      try {
        suggestions = JSON.parse(decodeURIComponent(markEl.getAttribute('data-suggestions') || '[]'));
      } catch { /* ignored */ }

      if (suggestions.length === 0) {
        suggestions = getSpellingSuggestions(word);
      }



      const rect = markEl.getBoundingClientRect();
      const popup = document.createElement('div');
      popup.className = 'grammar-suggestion-popup';
      popup.style.top = `${rect.bottom + 6}px`;
      popup.style.left = `${Math.max(10, Math.min(window.innerWidth - 220, rect.left))}px`;

      let headerText = markEl.classList.contains('issue-grammar') ? 'Grammar' : 'Spelling';
      let html = `<div class="grammar-suggestion-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${markEl.classList.contains('issue-grammar') ? '#1a73e8' : '#ea4335'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span>${headerText}</span>
      </div>`;

      if (suggestions.length > 0) {
        suggestions.forEach((sugg, idx) => {
          html += `<div class="grammar-suggestion-item" data-suggestion="${sugg}">
            <span>${sugg}</span>
            <span class="suggestion-action-label">${idx === 0 ? 'Accept' : ''}</span>
          </div>`;
        });
      } else {
        html += `<div style="padding: 8px 12px; font-size: 12px; color: #5f6368;">No suggestions available</div>`;
      }

      html += `<div class="grammar-suggestion-footer">
        <button class="grammar-suggestion-ignore" id="docs-btn-ignore">Ignore</button>
        <span style="font-size: 11px; color: #80868b;">${word}</span>
      </div>`;

      popup.innerHTML = html;
      document.body.appendChild(popup);
      activeSuggestionPopup = popup;

      // Handle suggestion clicks
      popup.querySelectorAll('.grammar-suggestion-item').forEach(item => {
        item.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const chosen = item.getAttribute('data-suggestion');
          if (chosen === '(Delete word)') {
            markEl.remove();
          } else {
            markEl.replaceWith(document.createTextNode(chosen));
          }
          closeSuggestionPopup();
          handleInput();
        });
      });

      // Handle ignore
      const ignoreBtn = popup.querySelector('#docs-btn-ignore');
      if (ignoreBtn) {
        ignoreBtn.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          markEl.replaceWith(document.createTextNode(word));
          closeSuggestionPopup();
        });
      }
    };

    const handleTextClick = (e) => {
      const mark = e.target.closest('mark.grammar-issue-word');
      if (mark) {
        e.stopPropagation();
        showSuggestionPopup(mark);
      } else {
        closeSuggestionPopup();
      }
    };
    div.addEventListener('click', handleTextClick);

    const debounceCheck = () => {
      clearTimeout(grammarCheckTimer);
      grammarCheckTimer = setTimeout(() => {
        runSpellGrammarCheck();
      }, 700);
    };

    div.addEventListener('keyup', (e) => {
      // Don't trigger on arrow navigation keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Backspace' || e.key === '.') {
        debounceCheck();
      }
    });

    // Run initial spell & grammar check after initial text paints
    setTimeout(runSpellGrammarCheck, 350);

    const cleanup = () => {
      isEditingTextRef.current = false;
      closeSuggestionPopup();
      clearTimeout(grammarCheckTimer);

      // Strip all mark highlight wrappers to ensure completely clean SVG serialization
      div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent || ''));
      });

      foTarget.removeAttribute('data-editing');
      div.removeAttribute('contenteditable');
      div.style.outline = 'none';
      div.style.boxShadow = '';
      div.style.userSelect = 'none';
      div.style.pointerEvents = 'none';
      div.style.cursor = '';
      div.classList.remove('text-edit-box');
      div.removeEventListener('blur', handleBlur);
      div.removeEventListener('keydown', handleKeyDown);
      div.removeEventListener('click', handleTextClick);
      div.removeEventListener('mousedown', stopScrollPropagation);
      div.removeEventListener('pointerdown', stopScrollPropagation);
      div.removeEventListener('touchstart', stopScrollPropagation);
      div.removeEventListener('wheel', stopScrollPropagation);
      const s = window.getSelection();
      if (s) s.removeAllRanges();

      // Restore cursor for wrapper
      if (svgContainer) {
        const divWrapper = svgContainer.querySelector('div');
        if (divWrapper) {
          const isPencilActive = activeMainToolRef.current === 'pen' && selectedPenToolRef.current === 'pencil';
          const isPenToolActive = activeMainToolRef.current === 'pen';
          const isShapeActive = activeMainToolRef.current === 'shapes';
          const isTypeActive = activeMainToolRef.current === 'type';
          divWrapper.style.cursor = isPencilActive ? PENCIL_CURSOR : (isPenToolActive ? PEN_CURSOR : (isShapeActive ? SHAPE_CURSOR : (isTypeActive ? TYPE_CURSOR : 'default')));
        }
      }
    };

    const handleBlur = () => {
      const activeEl = document.activeElement;
      const isSidebarTarget = activeEl && (
        activeEl.closest('.right-sidebar') ||
        activeEl.closest('#right-sidebar') ||
        activeEl.closest('[data-panel]') ||
        activeEl.closest('.z-50') ||
        activeEl.closest('.text-editor-panel') ||
        activeEl.closest('.color-picker') ||
        activeEl.closest('.grammar-suggestion-popup')
      );

      if (window.__isInteractingWithSidebar || isSidebarTarget) {
        return;
      }

      suppressClickRef.current = true;
      setTimeout(() => { suppressClickRef.current = false; }, 200);

      // Strip grammar marks before saving and sizing
      div.querySelectorAll('mark.grammar-issue-word').forEach(m => {
        m.replaceWith(document.createTextNode(m.textContent || ''));
      });

      const finalContent = div.innerText || '';

      if (finalContent.trim().length === 0) {
        const container = foTarget.closest('.page-svg-container');
        foTarget.remove();
        cleanup();
        const pageIdx = container ? parseInt(container.getAttribute('data-page-index')) : activePageIndex;
        const topFrames = svgRoot ? getTopLevelFrames(svgRoot) : [];
        const rootId = (topFrames && topFrames.length > 0 ? topFrames[0].id : pages[pageIdx]?.layers?.[0]?.id);

        if (rootId) {
          if (setSelectedLayerId) setSelectedLayerId(rootId);
          selectedLayerIdRef.current = rootId;
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set([rootId]));
            multiSelectedIdsRef.current = new Set([rootId]);
          }
          if (setCurrentFrameId) setCurrentFrameId(rootId);
          currentFrameIdRef.current = rootId;
        } else {
          if (setSelectedLayerId) setSelectedLayerId(null);
          selectedLayerIdRef.current = null;
          if (setMultiSelectedIds) {
            setMultiSelectedIds(new Set());
            multiSelectedIdsRef.current = new Set();
          }
        }
        if (container) saveModifiedPageHtml(pageIdx, svgRoot);
        return;
      }

      // Auto-grow height and width to fit content
      const sizingMode = foTarget.getAttribute('data-sizing-mode') || 'auto-height';
      const isScrollable = foTarget.getAttribute('data-scrollable') === 'true';

      if (!isScrollable) {
        const oldWidth = div.style.width;
        const oldHeight = div.style.height;
        const oldMinHeight = div.style.minHeight;

        if (sizingMode === 'auto-width') {
          div.style.width = 'max-content';
        }

        // Temporarily allow height to shrink to measure true text height
        div.style.setProperty('height', 'auto', 'important');
        div.style.setProperty('min-height', '0px', 'important');

        const contentW = div.scrollWidth;
        const contentH = div.scrollHeight;

        div.style.width = oldWidth;
        div.style.setProperty('height', oldHeight || '100%', 'important');
        div.style.setProperty('min-height', oldMinHeight || '100%', 'important');

        const currentW = parseFloat(foTarget.getAttribute('width')) || 0;
        const currentH = parseFloat(foTarget.getAttribute('height')) || 0;
        const currentX = parseFloat(foTarget.getAttribute('x')) || 0;

        if (sizingMode === 'auto-width' && Math.abs(contentW - currentW) > 2) {
          const widthDiff = contentW - currentW;
          const align = window.getComputedStyle(div).textAlign;
          foTarget.setAttribute('width', Math.max(contentW + 4, 10));
          if (align === 'center') {
            foTarget.setAttribute('x', currentX - (widthDiff / 2));
          } else if (align === 'right' || align === 'end') {
            foTarget.setAttribute('x', currentX - widthDiff);
          }
        }

        if (sizingMode !== 'fixed' && Math.abs(contentH - currentH) > 2) {
          foTarget.setAttribute('height', contentH + 4);
        }
      }

      cleanup();

      // Re-select the element and redraw handles
      if (foTarget.id) {
        if (setSelectedLayerId) setSelectedLayerId(foTarget.id);
        selectedLayerIdRef.current = foTarget.id;
        if (setMultiSelectedIds) {
          setMultiSelectedIds(new Set([foTarget.id]));
          multiSelectedIdsRef.current = new Set([foTarget.id]);
        }
        drawOverlayHighlight(foTarget, 'selected');
      }

      const container = foTarget.closest('.page-svg-container');
      if (container) saveModifiedPageHtml(parseInt(container.getAttribute('data-page-index')), svgRoot);
    };

    const handleKeyDown = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSuggestionPopup();
        div.blur();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;

          let lineText = '';
          let walker = document.createTreeWalker(div, NodeFilter.SHOW_ALL, null, false);
          walker.currentNode = node;

          if (node.nodeType === Node.TEXT_NODE) {
            lineText = node.textContent.substring(0, range.startOffset);
          }

          let prev = walker.previousNode();
          while (prev) {
            if (prev.nodeName === 'BR' || prev.nodeName === 'DIV' || prev.nodeName === 'P') break;
            if (prev.nodeType === Node.TEXT_NODE) lineText = prev.textContent + lineText;
            prev = walker.previousNode();
          }

          const bulletMatch = lineText.match(/^\s*(•|-)\s+/);
          const numberMatch = lineText.match(/^\s*(\d+)\.\s+/);

          if (bulletMatch || numberMatch) {
            e.preventDefault();
            let prefix = '';
            let isEmpty = false;

            if (bulletMatch) {
              if (lineText.trim() === bulletMatch[0].trim()) isEmpty = true;
              else prefix = bulletMatch[0].trim() + ' ';
            } else if (numberMatch) {
              if (lineText.trim() === numberMatch[0].trim()) isEmpty = true;
              else {
                const nextNum = parseInt(numberMatch[1], 10) + 1;
                prefix = nextNum + '. ';
              }
            }

            if (isEmpty) {
              const deleteRange = document.createRange();
              deleteRange.setEnd(range.startContainer, range.startOffset);
              let startNode = node;
              let startOffset = 0;
              walker.currentNode = node;
              let p = walker.previousNode();
              while (p) {
                if (p.nodeName === 'BR' || p.nodeName === 'DIV' || p.nodeName === 'P') break;
                if (p.nodeType === Node.TEXT_NODE) {
                  startNode = p;
                  startOffset = 0;
                }
                p = walker.previousNode();
              }
              deleteRange.setStart(startNode, startOffset);
              sel.removeAllRanges();
              sel.addRange(deleteRange);
              document.execCommand('delete', false);
            } else {
              document.execCommand('insertHTML', false, '<br>' + prefix);
            }
          }
        }
      }
    };

    div.addEventListener('blur', handleBlur);
    div.addEventListener('keydown', handleKeyDown);
  };



  return {
    enterTextEditMode
  };
};
