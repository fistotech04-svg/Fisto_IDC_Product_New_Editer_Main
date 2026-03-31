import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';
import TemplateModal from './TemplateModal';

/**
 * TemplateEditor Layout Component
 * Integrates the various sub-components into a single editor interface.
 */
const TemplateEditor = () => {
  const { folder, v_id } = useParams();
  const location = useLocation();
  const { setCurrentBook } = useOutletContext();
  
  const [isDoublePage, setIsDoublePage] = useState(false);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [clipboard, setClipboard] = useState(null); // { layer, svgSnippet }
  const [currentFrameId, setCurrentFrameId] = useState(null); // Figma-style "entered" frame
  const [activeMainTool, setActiveMainTool] = useState('select'); // 'upload', 'select', 'pen', 'type', 'shapes', 'grid'

  const createDefaultPageData = (name) => {
    const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
    const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
    const html = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 210 297" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${name}" data-type="frame">
\n    <rect id="${overlayId}" x="0" y="0" width="210" height="297" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" />\n  </g>\n</svg>`;

    const layers = [
      {
        id: rootId,
        name: name,
        type: 'g',
        visible: true,
        locked: false,
        children: []
      }
    ];

    return { html, layers };
  };

  const [history, setHistory] = useState([]); // Past states
  const [redoStack, setRedoStack] = useState([]); // States for redo
  const MAX_HISTORY = 50;

  const lastPageIndexRef = useRef(-1);

  // ── FIGMA-STYLE: Unified Page Selection & Frame Sync ──────────────────────────
  useEffect(() => {
    if (pages.length === 0 || activePageIndex < 0 || activePageIndex >= pages.length) return;

    // Track spread transitions to avoid unnecessary selection resets
    const lastSpreadStart = (lastPageIndexRef.current > 0) ? (lastPageIndexRef.current % 2 === 1 ? lastPageIndexRef.current : lastPageIndexRef.current - 1) : 0;
    const currentSpreadStart = (activePageIndex > 0) ? (activePageIndex % 2 === 1 ? activePageIndex : activePageIndex - 1) : 0;
    
    const hasSwitchedPage = lastPageIndexRef.current !== activePageIndex;
    const hasSwitchedSpread = lastSpreadStart !== currentSpreadStart;
    lastPageIndexRef.current = activePageIndex;

    // A: Double Page Spread Logic (Can be on odd OR even index if it's a middle spread)
    const isSpread = isDoublePage && activePageIndex > 0 && (
      (activePageIndex % 2 === 1 && activePageIndex + 1 < pages.length) || 
      (activePageIndex % 2 === 0 && activePageIndex - 1 > 0)
    );


    if (isSpread) {
        const leftIdx = activePageIndex % 2 === 1 ? activePageIndex : activePageIndex - 1;
        const rightIdx = activePageIndex % 2 === 1 ? activePageIndex + 1 : activePageIndex;
        
        const page1 = pages[leftIdx];
        const page2 = pages[rightIdx];

        if (page1?.layers?.[0] && page2?.layers?.[0]) {
          const root1 = page1.layers[0].id;
          const root2 = page2.layers[0].id;
          // The active page root — determines which frame context is "entered"
          const activeRoot = activePageIndex === leftIdx ? root1 : root2;

          // On any page switch: always clear old selection and reset to roots.
          // Set currentFrameId to the active page root so the first single click
          // can immediately select child elements without needing to enter the frame first.
          if (hasSwitchedPage || hasSwitchedSpread) {
            setMultiSelectedIds(new Set([root1, root2]));
            setSelectedLayerId(activeRoot);
            setCurrentFrameId(activeRoot);
          } else {
            // Selection became empty — restore roots (Only if not using a tool)
            const currentIds = multiSelectedIds || new Set();
            if (currentIds.size === 0 && activeMainTool === 'select') {
              setMultiSelectedIds(new Set([root1, root2]));
              setSelectedLayerId(activeRoot);
              setCurrentFrameId(activeRoot);
            }
          }
        }
    } else {
      // B: Single Page Logic (Cover, Last Page, or Standard Single View)
      const page = pages[activePageIndex];
      if (page?.layers?.[0]) {
        const rootId = page.layers[0].id;
        
        // Auto-select root ONLY if we just landed here OR selection became empty (Only if not using a tool)
        const currentIds = multiSelectedIds || new Set();
        if (hasSwitchedPage || (currentIds.size === 0 && activeMainTool === 'select')) {
          setMultiSelectedIds(new Set([rootId]));
          setSelectedLayerId(rootId);
          setCurrentFrameId(rootId);
        }
      }
    }
  }, [activePageIndex, isDoublePage, pages, multiSelectedIds.size]);

  // ── NEW: Spread Alignment Snapping ───────────────────────────────────────────
  // UPDATED: Only snap if we are in double-page mode AND current logic requires it for initial navigation.
  // We allow clicking the right-side page to set the active index to even (right page).
  useEffect(() => {
    if (!isDoublePage) return;
    // If we were on single page view and switched to double, we might need a jump.
  }, [isDoublePage]);


  const saveToHistory = () => {
    setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), pages]);
    setRedoStack([]); // Clear redo on new action
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setRedoStack(prev => [pages, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setPages(prevState);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory(prev => [...prev, pages]);
    setRedoStack(prev => prev.slice(1));
    setPages(nextState);
  };

  const updatePageHtml = (pageIndex, html) => {
    saveToHistory();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    const parseLayersRecursive = (element) => {
      return Array.from(element.children)
        .filter(child => 
          !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
          child.getAttribute('data-name') !== 'Overlay'
        )
        .map(child => {
          const id = child.id || `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
          const rawName = child.getAttribute('data-name') || child.id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
          const cleanName = rawName.replace(/^tpl-[a-z0-9]{4}-/, '');

          const layer = {
            id,
            name: cleanName,
            type: child.tagName.toLowerCase(),
            visible: child.getAttribute('data-hidden') !== 'true',
            locked: child.getAttribute('data-locked') === 'true'
          };

          if (child.tagName.toLowerCase() === 'g' && child.children.length > 0) {
            const subLayers = parseLayersRecursive(child);
            if (subLayers.length > 0) layer.children = subLayers;
          }

          return layer;
        });
    };

    const newLayers = svgEl ? parseLayersRecursive(svgEl) : [];
    
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return prev;

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
    setSelectedLayerId(null);
    setMultiSelectedIds(new Set());
  };

  const insertPageAfter = (index) => {
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
  };

  const duplicatePage = (index) => {
    saveToHistory();
    setPages(prev => {
      const pageToDuplicate = prev[index];
      const newPage = {
        ...pageToDuplicate,
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: `${pageToDuplicate.name} (Copy)`
      };
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
  };

  const renamePage = (id, newName) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const deletePage = (index) => {
    if (pages.length <= 1) return;
    saveToHistory();
    setPages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
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
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(index, 1)[0];
      updated.unshift(page);
      return updated;
    });
    setActivePageIndex(0);
  };

  const movePageToLast = (index) => {
    if (index === pages.length - 1) return;
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(index, 1)[0];
      updated.push(page);
      return updated;
    });
    setActivePageIndex(pages.length - 1);
  };


  const movePage = (fromIndex, toIndex) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, page);
      return updated;
    });
    setActivePageIndex(toIndex);
  };

  const toggleLayerVisibility = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let forceState = null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const processLayers = (layersList) => {
        return layersList.map(layer => {
          let newLayer = { ...layer };
          if (idList.includes(layer.id)) {
            if (forceState === null) forceState = !layer.visible;
            newLayer.visible = forceState;
            const element = doc.querySelector(`[id="${layer.id}"]`);
            if (element) {
              if (!newLayer.visible) {
                element.setAttribute('data-hidden', 'true');
                element.style.display = 'none';
              } else {
                element.removeAttribute('data-hidden');
                element.style.display = '';
              }
            }
          }
          if (newLayer.children) newLayer.children = processLayers(newLayer.children);
          return newLayer;
        });
      };

      const newLayers = processLayers(page.layers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const toggleLayerLock = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let forceState = null;
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const processLayers = (layersList) => {
        return layersList.map(layer => {
          let newLayer = { ...layer };
          if (idList.includes(layer.id)) {
            if (forceState === null) forceState = !layer.locked;
            newLayer.locked = forceState;
            const element = doc.querySelector(`[id="${layer.id}"]`);
            if (element) {
              if (newLayer.locked) {
                element.setAttribute('data-locked', 'true');
                element.style.pointerEvents = 'none';
              } else {
                element.removeAttribute('data-locked');
                element.style.pointerEvents = '';
              }
            }
          }
          if (newLayer.children) newLayer.children = processLayers(newLayer.children);
          return newLayer;
        });
      };

      const newLayers = processLayers(page.layers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const renameLayer = (pageIndex, layerId, newName) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const renameInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            return { ...layer, name: newName };
          }
          if (layer.children) {
            return { ...layer, children: renameInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = renameInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        element.setAttribute('data-name', newName);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = {
        ...page,
        layers: newLayers,
        html: newHtml
      };
      return updated;
    });
  };

  const bringLayerToFront = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        const toMove = list.filter(l => idList.includes(l.id));
        if (toMove.length > 0) {
          toMove.forEach(item => {
            const idx = list.findIndex(l => l.id === item.id);
            if (idx !== -1) {
              list.splice(idx, 1);
              list.push(item);
              const element = doc.querySelector(`[id="${item.id}"]`);
              if (element && element.parentNode) element.parentNode.appendChild(element);
            }
          });
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const sendLayerToBack = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        const toMove = list.filter(l => idList.includes(l.id)).reverse();
        if (toMove.length > 0) {
          toMove.forEach(item => {
            const idx = list.findIndex(l => l.id === item.id);
            if (idx !== -1) {
              list.splice(idx, 1);
              list.unshift(item);
              const element = doc.querySelector(`[id="${item.id}"]`);
              if (element && element.parentNode) element.parentNode.insertBefore(element, element.parentNode.firstChild);
            }
          });
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const moveLayerForward = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        // Iterate backwards to not mess up indices as we move things forward
        for (let i = list.length - 1; i >= 0; i--) {
          if (idList.includes(list[i].id) && i < list.length - 1) {
            const item = list.splice(i, 1)[0];
            list.splice(i + 1, 0, item);
            const element = doc.querySelector(`[id="${item.id}"]`);
            if (element && element.parentNode && element.nextElementSibling) {
              element.parentNode.insertBefore(element.nextElementSibling, element);
            }
          }
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const moveLayerBackward = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const newLayers = JSON.parse(JSON.stringify(page.layers));

      const processList = (list) => {
        for (let i = 0; i < list.length; i++) {
          if (idList.includes(list[i].id) && i > 0) {
            const item = list.splice(i, 1)[0];
            list.splice(i - 1, 0, item);
            const element = doc.querySelector(`[id="${item.id}"]`);
            if (element && element.parentNode && element.previousElementSibling) {
              element.parentNode.insertBefore(element, element.previousElementSibling);
            }
          }
        }
        list.forEach(l => { if (l.children) processList(l.children); });
      };

      processList(newLayers);
      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });
  };

  const reorderLayer = (pageIndex, sourceId, targetId) => {
    if (sourceId === targetId) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const newLayers = JSON.parse(JSON.stringify(page.layers));

      // 1. Find and remove source item
      let sourceItem = null;
      let sourcePath = null;
      const findAndRemove = (list, path = []) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === sourceId) {
            sourceItem = list.splice(i, 1)[0];
            sourcePath = [...path];
            return true;
          }
          if (list[i].children && findAndRemove(list[i].children, [...path, list[i].id])) return true;
        }
        return false;
      };

      findAndRemove(newLayers);
      if (!sourceItem) return updated;

      // 2. Find target and its parent to insert
      let inserted = false;
      const findAndInsert = (list) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === targetId) {
            // To move ABOVE in sidebar (rendered TOP in canvas), we insert AFTER in array
            // since the list is reversed in the UI component
            list.splice(i + 1, 0, sourceItem);
            inserted = true;
            return true;
          }
          if (list[i].children && findAndInsert(list[i].children)) return true;
        }
        return false;
      };

      findAndInsert(newLayers);
      
      if (!inserted) {
        // Fallback: Return to original spot or just append if target lost
        newLayers.push(sourceItem);
      }

      // 3. Update SVG DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const sourceEl = doc.querySelector(`[id="${sourceId}"]`);
      const targetEl = doc.querySelector(`[id="${targetId}"]`);
      
      if (sourceEl && targetEl && targetEl.parentNode) {
        // SVG z-index: last child is on top. 
        // To move ABOVE target in sidebar, it must be AFTER target in DOM.
        targetEl.parentNode.insertBefore(sourceEl, targetEl.nextSibling);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
  };

  const updatePageBackground = (pageIndex, color) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (page && page.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(page.html, 'image/svg+xml');
          const overlay = doc.querySelector('[data-name="Overlay"]');
          if (overlay) {
              overlay.setAttribute('fill', color);
              page.html = new XMLSerializer().serializeToString(doc);
          }
          updated[pageIndex] = { ...page };
      }
      return updated;
    });
  };

  const deleteLayer = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');

      const deleteFromLayers = (layersList) => {
        for (let i = layersList.length - 1; i >= 0; i--) {
          const layerId = layersList[i].id;
          if (idList.includes(layerId)) {
            const element = doc.querySelector(`[id="${layerId}"]`);
            // PROTECT THE BASE OVERLAY & ROOT FOLDER
            if (element && (element.getAttribute('data-name') === 'Overlay' || element.getAttribute('data-type') === 'frame')) {
              continue; 
            }
            layersList.splice(i, 1);
            if (element) element.remove();
          } else if (layersList[i].children) {
            deleteFromLayers(layersList[i].children);
          }
        }
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      deleteFromLayers(newLayers);

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });

    if (idList.includes(selectedLayerId)) setSelectedLayerId(null);
    setMultiSelectedIds(prev => {
      const next = new Set(prev);
      idList.forEach(id => next.delete(id));
      return next;
    });
  };

  const copyLayer = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    const page = pages[pageIndex];
    if (!page) return;

    const parser = new DOMParser();
    if (!page.html) return;
    const doc = parser.parseFromString(page.html, 'image/svg+xml');

    const clipboardItems = [];
    const findLayers = (layersList, parentId = null) => {
      for (let layer of layersList) {
        if (idList.includes(layer.id)) {
          const element = doc.querySelector(`[id="${layer.id}"]`);
          if (element) {
            let svgSnippet = new XMLSerializer().serializeToString(element);
            
            // Extract external definitions (clipPath, grads) used by this snippet
            const defSnippets = [];
            const collectedIds = new Set();
            const extractDefs = (snippet) => {
              // match url(#id) or url('#id') or url("#id")
              const urlRegex = /url\(['"]?#([^)'"]+)['"]?\)/g;
              let match;
              while ((match = urlRegex.exec(snippet)) !== null) {
                const defId = match[1];
                if (!collectedIds.has(defId)) {
                  collectedIds.add(defId);
                  const safeId = defId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                  const defEl = doc.querySelector(`[id="${safeId}"]`);
                  if (defEl) {
                    const defHtml = new XMLSerializer().serializeToString(defEl);
                    defSnippets.push(defHtml);
                    extractDefs(defHtml); // recursively find deeper dependencies
                  }
                }
              }

              // match href="#id" or xlink:href="#id"
              const hrefRegex = /href=['"]#([^'"]+)['"]/g;
              while ((match = hrefRegex.exec(snippet)) !== null) {
                const defId = match[1];
                if (!collectedIds.has(defId)) {
                  collectedIds.add(defId);
                  const safeId = defId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                  const defEl = doc.querySelector(`[id="${safeId}"]`);
                  if (defEl) {
                    const defHtml = new XMLSerializer().serializeToString(defEl);
                    defSnippets.push(defHtml);
                    extractDefs(defHtml);
                  }
                }
              }
            };
            extractDefs(svgSnippet);

            clipboardItems.push({
              layer: JSON.parse(JSON.stringify(layer)),
              svgSnippet: svgSnippet,
              defSnippets: defSnippets,
              originalParentId: parentId
            });
          }
        }
        if (layer.children) findLayers(layer.children, layer.id);
      }
    };

    findLayers(page.layers);
    if (clipboardItems.length > 0) {
      setClipboard(clipboardItems);
    }
  };

  const cutLayer = (pageIndex, ids) => {
    copyLayer(pageIndex, ids);
    deleteLayer(pageIndex, ids);
  };

  const pasteLayer = (pageIndex) => {
    if (!clipboard || !Array.isArray(clipboard)) return;
    saveToHistory();

    const prepareLayer = (l) => {
      const id = `${l.type}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...l,
        id: id,
        children: l.children ? l.children.map(prepareLayer) : undefined
      };
    };

    const newItems = clipboard.map(item => ({
      ...item,
      newLayer: prepareLayer(item.layer)
    }));

    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return updated;

      let newLayers = JSON.parse(JSON.stringify(page.layers || []));
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'image/svg+xml');
      const svgRoot = doc.querySelector('svg');

      // Ensure <defs> exists on the target page
      let defs = doc.querySelector('defs');
      if (!defs && svgRoot) {
         defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
         svgRoot.insertBefore(defs, svgRoot.firstChild);
      }

      newItems.forEach(({ svgSnippet, defSnippets, newLayer, originalParentId }) => {
        // Add missing defs to the current page's <defs>
        if (defSnippets && defs) {
           defSnippets.forEach(defHtml => {
              const defDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${defHtml}</svg>`, 'image/svg+xml');
              const defEl = defDoc.querySelector('svg').firstElementChild;
              if (defEl && defEl.id) {
                // Check if it already exists, if not, append to defs
                const safeId = defEl.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                if (!doc.querySelector(`[id="${safeId}"]`)) {
                   defs.appendChild(doc.importNode(defEl, true));
                }
              }
           });
        }

        const snippetDoc = parser.parseFromString(svgSnippet, 'image/svg+xml');
        const newElement = doc.importNode(snippetDoc.documentElement, true);
        newElement.setAttribute('id', newLayer.id);

        if (newLayer.type === 'g') {
          const updateRecursiveIds = (el, meta) => {
            if (meta.children) {
              Array.from(el.children).forEach((childEl, i) => {
                if (meta.children[i]) {
                  childEl.setAttribute('id', meta.children[i].id);
                  updateRecursiveIds(childEl, meta.children[i]);
                }
              });
            }
          };
          updateRecursiveIds(newElement, newLayer);
        }

        let pasted = false;
        if (selectedLayerId) {
          const insertNextTo = (list, isTopLevel = true) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === selectedLayerId) {
                if (isTopLevel) {
                  // Never paste alongside a top-level root folder, paste inside it
                  list[i].children = [...(list[i].children || []), newLayer];
                  return { method: 'inside', parentId: list[i].id };
                } else {
                  list.splice(i + 1, 0, newLayer);
                  return { method: 'alongside' };
                }
              }
              if (list[i].children) {
                const res = insertNextTo(list[i].children, false);
                if (res) return res;
              }
            }
            return false;
          };
          
          const result = insertNextTo(newLayers, true);
          if (result) {
            if (result.method === 'inside') {
              const parentEl = doc.querySelector(`[id="${result.parentId}"]`);
              if (parentEl) {
                parentEl.appendChild(newElement);
                pasted = true;
              }
            } else {
              const selectedEl = doc.querySelector(`[id="${selectedLayerId}"]`);
              if (selectedEl && selectedEl.parentNode) {
                selectedEl.parentNode.insertBefore(newElement, selectedEl.nextSibling);
                pasted = true;
              }
            }
          }
        }

        if (!pasted && currentFrameId) {
          const insertInside = (list) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === currentFrameId) {
                list[i].children = [...(list[i].children || []), newLayer];
                return true;
              }
              if (list[i].children && insertInside(list[i].children)) return true;
            }
            return false;
          };
          if (insertInside(newLayers)) {
            const parentEl = doc.querySelector(`[id="${currentFrameId}"]`);
            if (parentEl) {
              parentEl.appendChild(newElement);
              pasted = true;
            }
          }
        }

        if (!pasted && originalParentId) {
          const insertAtEnd = (list) => {
            for (let i = 0; i < list.length; i++) {
              if (list[i].id === originalParentId) {
                list[i].children = [...(list[i].children || []), newLayer];
                return true;
              }
              if (list[i].children && insertAtEnd(list[i].children)) return true;
            }
            return false;
          };
          if (insertAtEnd(newLayers)) {
            const parentEl = doc.querySelector(`[id="${originalParentId}"]`);
            if (parentEl) {
              parentEl.appendChild(newElement);
              pasted = true;
            }
          }
        }
        
        // 4. Fallback: Always insert into the page's root frame to keep it inside the page layer
        if (!pasted) {
           const topFrame = newLayers.find(l => l.type === 'g');
           if (topFrame) {
              topFrame.children = [...(topFrame.children || []), newLayer];
              const rootEl = doc.querySelector(`[id="${topFrame.id}"]`);
              if (rootEl) rootEl.appendChild(newElement);
              else if (svgRoot) svgRoot.appendChild(newElement);
           } else {
              newLayers.push(newLayer);
              if (svgRoot) svgRoot.appendChild(newElement);
           }
        }
      });

      const serializer = new XMLSerializer();
      updated[pageIndex] = { ...page, layers: newLayers, html: serializer.serializeToString(doc.documentElement) };
      return updated;
    });

    // Select all newly pasted elements
    const newIds = new Set(newItems.map(item => item.newLayer.id));
    setMultiSelectedIds(newIds);
    if (newItems.length > 0) setSelectedLayerId(newItems[newItems.length - 1].newLayer.id);
  };

  // ── KEYBOARD SHORTCUTS (Cut, Copy, Paste) ──────────────────────────────────
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
          if (selectedLayerId) {
            copyLayer(activePageIndex, selectedLayerId);
          }
        } else if (e.key.toLowerCase() === 'x') {
          if (selectedLayerId) {
            cutLayer(activePageIndex, selectedLayerId);
          }
        } else if (e.key.toLowerCase() === 'v') {
          if (clipboard) {
            pasteLayer(activePageIndex);
          }
        }
      } else {
        // Handle physical Delete and Backspace keys (no modifiers)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (multiSelectedIds.size > 0) {
            multiSelectedIds.forEach(id => deleteLayer(activePageIndex, id));
            setMultiSelectedIds(new Set());
          } else if (selectedLayerId) {
            deleteLayer(activePageIndex, selectedLayerId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, multiSelectedIds, activePageIndex, clipboard, copyLayer, cutLayer, pasteLayer, deleteLayer, undo, redo, pages]);

  const loadTemplate = async (templateUrl) => {
    try {
      const response = await fetch(templateUrl);
      const content = await response.text();
      
      const parser = new DOMParser();
      const targetIndex = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;
      const currentPage = pages[targetIndex];
      
      if (!currentPage) return;

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
      
      // 4. Calculate Scale to Fit (Target: A4 210x297)
      const targetW = 210;
      const targetH = 297;
      let templateWidth = parseFloat(templateSvg.getAttribute('width'));
      let templateHeight = parseFloat(templateSvg.getAttribute('height'));
      const viewBoxStr = templateSvg.getAttribute('viewBox');
      
      if (viewBoxStr) {
        const parts = viewBoxStr.trim().split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
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
      // Extract children from the template - if it has a single main container <g>, we enter it
      const getExplodedTemplateChildren = (svg) => {
        // Now identify renderable content (filtering out metadata/defs/style)
        let infants = Array.from(svg.children).filter(child => 
          !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()) &&
          !RESOURCE_TAGS.includes(child.tagName.toLowerCase())
        );
        
        // If there's exactly one main group, we "explode" it to take its contents directly
        if (infants.length === 1 && infants[0].tagName.toLowerCase() === 'g') {
          const mainGroup = infants[0];
          const children = Array.from(mainGroup.children);
          
          // IMPORTANT: Transfer visual inheritance (fill, stroke, masks, etc.)
          // This prevents elements from losing their masks or colors when the container is exploded.
          const attrsToInherit = [
            'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 
            'opacity', 'visibility', 'filter', 'color'
          ];
          attrsToInherit.forEach(attr => {
            const val = mainGroup.getAttribute(attr);
            if (val) {
              children.forEach(child => {
                if (!child.hasAttribute(attr)) {
                  child.setAttribute(attr, val);
                }
              });
            }
          });

          // Inherit the main container's transform to keep positions stable
          const groupTransform = mainGroup.getAttribute('transform') || '';
          if (groupTransform) {
            children.forEach(child => {
              const childTransform = child.getAttribute('transform') || '';
              child.setAttribute('transform', `${groupTransform} ${childTransform}`.trim());
            });
          }

          return children;
        }
        return infants;
      };

      const finalTemplateElements = getExplodedTemplateChildren(templateSvg);

      // 6. Inject template content into root folder (Ungrouped & Non-Destructive)
      if (rootFolder || pageSvg) {
        const targetParent = rootFolder || pageSvg;
        
        // Find the 'Overlay' layer (absolute background) to insert AFTER it
        const overlayChild = Array.from(targetParent.children).find(el => el.getAttribute('data-name') === 'Overlay');
        const nextSiblingRef = overlayChild ? overlayChild.nextSibling : targetParent.firstChild;

        // Inherit visual attributes from the original template SVG
        const svgAttrs = ['fill', 'stroke', 'stroke-width', 'opacity', 'visibility', 'filter', 'color'];
        
        finalTemplateElements.forEach(child => {
          const imported = pageDoc.importNode(child, true);
          
          // Inherit top-level SVG attributes if not explicitly set on element
          svgAttrs.forEach(attr => {
            const val = templateSvg.getAttribute(attr);
            if (val && !imported.hasAttribute(attr)) {
              imported.setAttribute(attr, val);
            }
          });

          // Apply scaling and translation to fit A4
          const currentTransform = imported.getAttribute('transform') || '';
          const fittingTransform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
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
            const id = child.id || `${child.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;
            if (!child.id) child.setAttribute('id', id);

            const rawName = child.getAttribute('data-name') || child.id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
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

  const handleOpenTemplateModal = (index) => {
    setTemplateTargetIndex(index !== undefined ? index : activePageIndex);
    setShowTemplateModal(true);
  };

  useEffect(() => {
    const initializeEditor = async () => {
      setIsLoading(true);
      
      if (v_id) {
          try {
              const storedUser = localStorage.getItem('user');
              const user = storedUser ? JSON.parse(storedUser) : null;
              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
              
              const res = await axios.get(`${backendUrl}/api/flipbook/get`, {
                  params: { emailId: user?.emailId, v_id }
              });
              
              if (res.data && res.data.pages) {
                  setPages(res.data.pages.map((p, i) => {
                      const name = p.name || `Page ${i + 1}`;
                      if (!p.html || p.html.trim() === '') {
                          const { html, layers } = createDefaultPageData(name);
                          return {
                              id: p.v_id || i + 1,
                              name: name,
                              html: html,
                              layers: layers
                          };
                      }
                      return {
                          id: p.v_id || i + 1,
                          name: name,
                          html: p.html,
                          layers: p.layers
                      };
                  }));
                  setCurrentBook(res.data.meta);
              }
          } catch (err) {
              console.error("Failed to fetch flipbook:", err);
          }
      } 
      else if (location.state && location.state.pageCount) {
          const count = location.state.pageCount;
          const newPages = Array.from({ length: count }, (_, i) => {
              const name = `Page ${i + 1}`;
              const { html, layers } = createDefaultPageData(name);
              return {
                  id: i + 1,
                  name,
                  html,
                  layers
              };
          });
          setPages(newPages);
      }
      else {
          setPages(Array.from({ length: 12 }, (_, i) => {
              const name = `Page ${i + 1}`;
              const { html, layers } = createDefaultPageData(name);
              return {
                  id: i + 1,
                  name,
                  html,
                  layers
              };
          }));
      }
      
      setIsLoading(false);
    };

    initializeEditor();
  }, [v_id, location.state]);

  if (isLoading) {
      return (
          <div className="flex-1 flex items-center justify-center bg-white h-[92vh]">
              <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden">
      <Layer 
        pages={pages} 
        activePageIndex={activePageIndex} 
        setActivePageIndex={setActivePageIndex} 
        isDoublePage={isDoublePage} 
        insertPageAfter={insertPageAfter}
        duplicatePage={duplicatePage}
        renamePage={renamePage}
        renameLayer={renameLayer}
        deletePage={deletePage}
        movePageUp={movePageUp}
        movePageDown={movePageDown}
        movePageToFirst={movePageToFirst}
        movePageToLast={movePageToLast}
        movePage={movePage}
        clearPage={clearPage}
        onOpenTemplateModal={handleOpenTemplateModal}
        toggleLayerVisibility={toggleLayerVisibility}
        toggleLayerLock={toggleLayerLock}
        bringLayerToFront={bringLayerToFront}
        sendLayerToBack={sendLayerToBack}
        moveLayerForward={moveLayerForward}
        moveLayerBackward={moveLayerBackward}
        reorderLayer={reorderLayer}
        deleteLayer={deleteLayer}
        copyLayer={copyLayer}
        cutLayer={cutLayer}
        pasteLayer={pasteLayer}
        selectedLayerId={selectedLayerId}
        setSelectedLayerId={setSelectedLayerId}
        multiSelectedIds={multiSelectedIds}
        setMultiSelectedIds={setMultiSelectedIds}
        currentFrameId={currentFrameId}
        setCurrentFrameId={setCurrentFrameId}
        clipboard={clipboard}
      />

      <MainEditor 
        isDoublePage={isDoublePage} 
        pages={pages} 
        activePageIndex={activePageIndex} 
        setActivePageIndex={setActivePageIndex} 
        insertPageAfter={insertPageAfter}
        duplicatePage={duplicatePage}
        clearPage={clearPage}
        deletePage={deletePage}
        onOpenTemplateModal={handleOpenTemplateModal}
        selectedLayerId={selectedLayerId}
        setSelectedLayerId={setSelectedLayerId}
        updatePageHtml={updatePageHtml}
        multiSelectedIds={multiSelectedIds}
        setMultiSelectedIds={setMultiSelectedIds}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        currentFrameId={currentFrameId}
        setCurrentFrameId={setCurrentFrameId}
        activeMainTool={activeMainTool}
        setActiveMainTool={setActiveMainTool}
      />
      <RightSidebar 
        isDoublePage={isDoublePage} 
        setIsDoublePage={setIsDoublePage} 
        activeMainTool={activeMainTool}
        activePageIndex={activePageIndex}
        pages={pages}
        updatePageBackground={updatePageBackground}
        selectedLayerId={selectedLayerId}
      />
      
      {showTemplateModal && (
        <TemplateModal 
          showTemplateModal={showTemplateModal} 
          setShowTemplateModal={setShowTemplateModal} 
          clearCanvas={() => clearPage(templateTargetIndex !== null ? templateTargetIndex : activePageIndex)} 
          loadTemplate={loadTemplate} 
        />
      )}
    </div>
  );
};

export default TemplateEditor;
