/**
 * usePageManager.js
 * Manages flipbook page CRUD operations, ordering, renumbering,
 * and undo/redo history snapshot stack.
 */

import { useState, useCallback } from 'react';
import { parseLayersFromSVG } from './svgFilterUtils';
import pageCacheManager from '../PageCacheManager';

const MAX_HISTORY = 50;

export const usePageManager = ({
  pages,
  setPages,
  activePageIndex,
  setActivePageIndex,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds,
  setMultiSelectedIds,
  setHasUnsavedChanges,
  createDefaultPageData,
  isUndoRedoActiveRef,
  prevSelectedLayerIdRef,
  prevMultiSelectedIdsRef,
  setAlertState,
  currentBook
}) => {
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

    const saveToHistory = (
    customPages = pages,
    customLayerId = selectedLayerId,
    customPageIndex = activePageIndex,
    customMultiIds = multiSelectedIds
  ) => {
    const snap = {
      pages: JSON.parse(JSON.stringify(customPages)),
      selectedLayerId: customLayerId,
      activePageIndex: customPageIndex,
      multiSelectedIds: Array.from(customMultiIds || [])
    };

    setHistory(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const lastPages = Array.isArray(last) ? last : last.pages;
        const lastLayerId = Array.isArray(last) ? null : last.selectedLayerId;
        const lastPageIndex = Array.isArray(last) ? null : last.activePageIndex;
        const lastMultiIds = Array.isArray(last) ? [] : (last.multiSelectedIds || []);

        const isSamePages = JSON.stringify(lastPages) === JSON.stringify(snap.pages);
        const isSameLayerId = lastLayerId === snap.selectedLayerId;
        const isSamePageIndex = lastPageIndex === snap.activePageIndex;
        const isSameMultiIds = JSON.stringify(lastMultiIds.sort()) === JSON.stringify(snap.multiSelectedIds.sort());

        if (isSamePages && isSameLayerId && isSamePageIndex && isSameMultiIds) {
          return prev;
        }
      }
      return [...prev.slice(-(MAX_HISTORY - 1)), snap];
    });
    setRedoStack([]); // Clear redo stack on new action
  };

  const undo = () => {
    if (history.length === 0) return;

    isUndoRedoActiveRef.current = true;

    const currentSnap = {
      pages: JSON.parse(JSON.stringify(pages)),
      selectedLayerId,
      activePageIndex,
      multiSelectedIds: Array.from(multiSelectedIds || [])
    };

    const prevSnap = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRedoStack(prev => [currentSnap, ...prev]);

    const targetPages = Array.isArray(prevSnap) ? prevSnap : prevSnap.pages;
    const targetLayerId = Array.isArray(prevSnap) ? null : prevSnap.selectedLayerId;
    const targetPageIndex = Array.isArray(prevSnap) ? activePageIndex : prevSnap.activePageIndex;
    const targetMultiIds = Array.isArray(prevSnap) ? new Set() : new Set(prevSnap.multiSelectedIds || []);

    prevSelectedLayerIdRef.current = targetLayerId;
    prevMultiSelectedIdsRef.current = targetMultiIds;

    setPages(targetPages);
    if (targetPageIndex !== undefined && targetPageIndex !== null && targetPageIndex >= 0) {
      setActivePageIndex(targetPageIndex);
    }

    // Restore selection state exactly as captured in the snapshot (Figma style)
    if (targetLayerId) {
      setSelectedLayerId(targetLayerId);
      setMultiSelectedIds(new Set([targetLayerId]));
    } else {
      setSelectedLayerId(null);
      setMultiSelectedIds(targetMultiIds);
    }

    // Trigger immediate & multi-frame rebind of selection handles if an element was selected in the snapshot
    const rebind = () => {
      if (targetLayerId) {
        window.dispatchEvent(new CustomEvent('rebind-selection-overlay', { detail: { layerId: targetLayerId } }));
      }
    };
    requestAnimationFrame(() => {
      rebind();
      setTimeout(rebind, 30);
      setTimeout(rebind, 100);
    });
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    isUndoRedoActiveRef.current = true;

    const currentSnap = {
      pages: JSON.parse(JSON.stringify(pages)),
      selectedLayerId,
      activePageIndex,
      multiSelectedIds: Array.from(multiSelectedIds || [])
    };

    const nextSnap = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setHistory(prev => [...prev, currentSnap]);

    const targetPages = Array.isArray(nextSnap) ? nextSnap : nextSnap.pages;
    const targetLayerId = Array.isArray(nextSnap) ? null : nextSnap.selectedLayerId;
    const targetPageIndex = Array.isArray(nextSnap) ? activePageIndex : nextSnap.activePageIndex;
    const targetMultiIds = Array.isArray(nextSnap) ? new Set() : new Set(nextSnap.multiSelectedIds || []);

    prevSelectedLayerIdRef.current = targetLayerId;
    prevMultiSelectedIdsRef.current = targetMultiIds;

    setPages(targetPages);
    if (targetPageIndex !== undefined && targetPageIndex !== null && targetPageIndex >= 0) {
      setActivePageIndex(targetPageIndex);
    }

    // Restore selection state exactly as captured in the snapshot (Figma style)
    if (targetLayerId) {
      setSelectedLayerId(targetLayerId);
      setMultiSelectedIds(new Set([targetLayerId]));
    } else {
      setSelectedLayerId(null);
      setMultiSelectedIds(targetMultiIds);
    }

    // Trigger immediate & multi-frame rebind of selection handles if an element was selected in the snapshot
    const rebind = () => {
      if (targetLayerId) {
        window.dispatchEvent(new CustomEvent('rebind-selection-overlay', { detail: { layerId: targetLayerId } }));
      }
    };
    requestAnimationFrame(() => {
      rebind();
      setTimeout(rebind, 30);
      setTimeout(rebind, 100);
    });
  };

  const updatePageHtml = (pageIndex, html) => {
    setPages(prev => {
      saveToHistory(prev, selectedLayerId, pageIndex);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      const newLayers = svgEl ? parseLayersFromSVG(svgEl) : [];

      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return prev;

      // Update layer cache and debounced thumbnail in PageCacheManager
      pageCacheManager.setCachedLayers(page.id, html, newLayers);
      pageCacheManager.updateThumbnailDebounced(page.id, html, 300);

      updated[pageIndex] = {
        ...page,
        html,
        layers: newLayers
      };
      return updated;
    });
  };

  const clearPage = (index) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        // Find existing background color to preserve it
        let currentBg = '#ffffff';
        const parser = new DOMParser();
        if (updated[index].html) {
          const oldDoc = parser.parseFromString(updated[index].html, 'image/svg+xml');
          currentBg = oldDoc.querySelector('[data-name="Overlay"]')?.getAttribute('fill') || '#ffffff';
        }

        const { html, layers } = createDefaultPageData(updated[index].name);

        // Apply existing background to new default HTML
        const newDoc = parser.parseFromString(html, 'image/svg+xml');
        const newOverlay = newDoc.querySelector('[data-name="Overlay"]');
        if (newOverlay) {
          newOverlay.setAttribute('fill', currentBg);
        }

        updated[index] = {
          ...updated[index],
          html: new XMLSerializer().serializeToString(newDoc),
          layers
        };
      }
      return updated;
    });
    setHasUnsavedChanges(true);
    setSelectedLayerId(null);
    setMultiSelectedIds(new Set());
  };

  const insertPageAfter = (index) => {
    // PDF / Page limit (commented out for now - can re-enable later):
    /*
    if (pages.length >= 12) {
      setAlertState({
        isOpen: true,
        title: 'Limit Reached',
        message: 'You can only have up to 12 pages in a flipbook.',
        type: 'warning'
      });
      return;
    }
    */
    saveToHistory();
    setPages(prev => {
      const name = `Page ${prev.length + 1}`;
      const { html, layers } = createDefaultPageData(name);
      const newPage = {
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: name,
        html,
        layers
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const duplicatePage = (index) => {
    // PDF / Page limit (commented out for now - can re-enable later):
    /*
    if (pages.length >= 12) {
      setAlertState({
        isOpen: true,
        title: 'Limit Reached',
        message: 'You can only have up to 12 pages in a flipbook.',
        type: 'warning'
      });
      return;
    }
    */
    saveToHistory();
    setPages(prev => {
      const pageToDuplicate = prev[index];
      if (!pageToDuplicate) return prev;

      const newPageId = 'page_' + Math.random().toString(36).substr(2, 9);
      const baseName = pageToDuplicate.name ? pageToDuplicate.name.replace(/\s*\(Copy(?:\s+\d+)?\)$/i, '') : 'Page';
      let copyName = `${baseName} (Copy)`;
      let copyCounter = 1;
      const existingNames = new Set(prev.map(p => p.name?.toLowerCase()));
      while (existingNames.has(copyName.toLowerCase())) {
        copyCounter++;
        copyName = `${baseName} (Copy ${copyCounter})`;
      }

      // Synchronize name in the SVG's root frame data-name
      let newHtml = pageToDuplicate.html;
      if (newHtml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newHtml, 'image/svg+xml');
        const rootGroup = doc.querySelector('g[data-type="frame"]');
        if (rootGroup) {
          rootGroup.setAttribute('data-name', copyName);
          rootGroup.setAttribute('id', `g-frame-${Math.random().toString(36).substr(2, 7)}`);
          newHtml = new XMLSerializer().serializeToString(doc);
        }
      }

      const newPage = {
        ...pageToDuplicate,
        id: newPageId,
        v_id: newPageId,
        name: copyName,
        html: newHtml,
        layers: pageToDuplicate.layers ? JSON.parse(JSON.stringify(pageToDuplicate.layers)) : []
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const renamePage = (id, newName) => {
    setPages(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPage = { ...p, name: newName };

        // Synchronize name with the SVG's root frame data-name
        if (p.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(p.html, 'image/svg+xml');
          const rootGroup = doc.querySelector('g[data-type="frame"]');
          if (rootGroup) {
            rootGroup.setAttribute('data-name', newName);
            updatedPage.html = new XMLSerializer().serializeToString(doc);
            // Re-parse layers to keep the layer panel header in sync
            updatedPage.layers = parseLayersFromSVG(doc.documentElement);
          }
        }
        return updatedPage;
      }
      return p;
    }));
    setHasUnsavedChanges(true);
  };

  const togglePageVisibility = (index) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const newHiddenState = !updated[index].isHidden;
      updated[index] = { ...updated[index], isHidden: newHiddenState };
      
      if (newHiddenState && index === activePageIndex) {
        setSelectedLayerId(null);
        setMultiSelectedIds(new Set());
      }
      
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const deletePage = (index) => {
    if (pages.length <= 1) {
      setAlertState({
        isOpen: true,
        title: 'Cannot Delete Page',
        message: 'A flipbook must have at least one page. You cannot delete the only remaining page.',
        type: 'warning'
      });
      return;
    }
    saveToHistory();
    setPages(prev => {
      const updated = prev.filter((_p, i) => i !== index);
      return updated;
    });
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
    setHasUnsavedChanges(true);
  };

  const movePageUp = (index) => {
    if (index === 0) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
    setActivePageIndex(index - 1);
  };

  const movePageDown = (index) => {
    if (index === pages.length - 1) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
    setActivePageIndex(index + 1);
  };

  const movePageToFirst = (index) => {
    if (index === 0) return;
    saveToHistory();
    movePage(index, 0, true); // true indicates history is already saved
  };

  const movePageToLast = (index) => {
    if (index === pages.length - 1) return;
    saveToHistory();
    movePage(index, pages.length - 1, true); // true indicates history is already saved
  };


  const movePage = (fromIndex, toIndex, alreadySaved = false) => {
    if (fromIndex === toIndex) return;
    if (!alreadySaved) saveToHistory();

    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, page);
      return updated;
    });
    setActivePageIndex(toIndex);
    setHasUnsavedChanges(true);
  };


    const handleClearAllPages = useCallback(() => {
    setPages(prevPages => 
      prevPages.map((p, i) => {
        const name = p.name || `Page ${i + 1}`;
        const { html, layers } = createDefaultPageData(name, currentBook?.width, currentBook?.height);
        return {
          ...p,
          html: html,
          layers: layers || []
        };
      })
    );
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  }, [createDefaultPageData, currentBook, setHasUnsavedChanges, setPages]);

  return {
    history,
    redoStack,
    setHistory,
    setRedoStack,
    saveToHistory,
    undo,
    redo,
    updatePageHtml,
    clearPage,
    insertPageAfter,
    duplicatePage,
    renamePage,
    togglePageVisibility,
    deletePage,
    movePageUp,
    movePageDown,
    movePageToFirst,
    movePageToLast,
    movePage,
    handleClearAllPages
  };
};
