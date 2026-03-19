import React, { useState, useEffect } from 'react';
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
  
  const [isDoublePage, setIsDoublePage] = useState(true);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTargetIndex, setTemplateTargetIndex] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState(new Set());
  const [clipboard, setClipboard] = useState(null); // { layer, svgSnippet }
  const [currentFrameId, setCurrentFrameId] = useState(null); // Figma-style "entered" frame

  // ── HISTORY STATE (Undo / Redo) ───────────────────────────────────────────
  const [history, setHistory] = useState([]); // Past states
  const [redoStack, setRedoStack] = useState([]); // States for redo
  const MAX_HISTORY = 50;

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
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];

      if (!page) return prev;

      updated[pageIndex] = {
        ...page,
        html
      };

      return updated;
    });
  };

  const clearPage = (index) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], html: '', layers: [] };
      }
      return updated;
    });
    setSelectedLayerId(null);
    setMultiSelectedIds(new Set());
  };

  const insertPageAfter = (index) => {
    saveToHistory();
    setPages(prev => {
      const newPage = {
        id: 'page_' + Math.random().toString(36).substr(2, 9),
        name: `Page ${prev.length + 1}`,
        html: ''
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

  const toggleLayerVisibility = (pageIndex, layerId) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let newVisibility = true;
      const toggleInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            newVisibility = !layer.visible;
            return { ...layer, visible: newVisibility };
          }
          if (layer.children) {
            return { ...layer, children: toggleInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = toggleInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        if (!newVisibility) {
          element.setAttribute('data-hidden', 'true');
          element.style.display = 'none';
        } else {
          element.removeAttribute('data-hidden');
          element.style.display = '';
        }
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

  const toggleLayerLock = (pageIndex, layerId) => {
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      let newLocked = false;
      const toggleInLayers = (layersList) => {
        return layersList.map(layer => {
          if (layer.id === layerId) {
            newLocked = !layer.locked;
            return { ...layer, locked: newLocked };
          }
          if (layer.children) {
            return { ...layer, children: toggleInLayers(layer.children) };
          }
          return layer;
        });
      };

      const newLayers = toggleInLayers(page.layers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        if (newLocked) {
          element.setAttribute('data-locked', 'true');
          element.style.pointerEvents = 'none';
        } else {
          element.removeAttribute('data-locked');
          element.style.pointerEvents = '';
        }
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

  const bringLayerToFront = (pageIndex, layerId) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const moveToFront = (layersList) => {
        const index = layersList.findIndex(l => l.id === layerId);
        if (index !== -1) {
          const item = layersList.splice(index, 1)[0];
          layersList.push(item);
          return true;
        }
        for (let layer of layersList) {
          if (layer.children && moveToFront(layer.children)) return true;
        }
        return false;
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      moveToFront(newLayers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element && element.parentNode) {
        element.parentNode.appendChild(element);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
  };

  const sendLayerToBack = (pageIndex, layerId) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const moveToBack = (layersList) => {
        const index = layersList.findIndex(l => l.id === layerId);
        if (index !== -1) {
          const item = layersList.splice(index, 1)[0];
          layersList.unshift(item);
          return true;
        }
        for (let layer of layersList) {
          if (layer.children && moveToBack(layer.children)) return true;
        }
        return false;
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      moveToBack(newLayers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element && element.parentNode) {
        element.parentNode.insertBefore(element, element.parentNode.firstChild);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
  };

  const moveLayerForward = (pageIndex, layerId) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const moveForward = (layersList) => {
        const index = layersList.findIndex(l => l.id === layerId);
        if (index !== -1) {
          if (index < layersList.length - 1) {
            const item = layersList.splice(index, 1)[0];
            layersList.splice(index + 1, 0, item);
            return true;
          }
          return false;
        }
        for (let layer of layersList) {
          if (layer.children && moveForward(layer.children)) return true;
        }
        return false;
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      moveForward(newLayers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element && element.parentNode && element.nextElementSibling) {
        // Swap with next element
        element.parentNode.insertBefore(element.nextElementSibling, element);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
  };

  const moveLayerBackward = (pageIndex, layerId) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const moveBackward = (layersList) => {
        const index = layersList.findIndex(l => l.id === layerId);
        if (index !== -1) {
          if (index > 0) {
            const item = layersList.splice(index, 1)[0];
            layersList.splice(index - 1, 0, item);
            return true;
          }
          return false;
        }
        for (let layer of layersList) {
          if (layer.children && moveBackward(layer.children)) return true;
        }
        return false;
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      moveBackward(newLayers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element && element.parentNode && element.previousElementSibling) {
        element.parentNode.insertBefore(element, element.previousElementSibling);
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
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

  const deleteLayer = (pageIndex, layerId) => {
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page || !page.html || !page.layers) return updated;

      const deleteFromLayers = (layersList) => {
        const index = layersList.findIndex(l => l.id === layerId);
        if (index !== -1) {
          layersList.splice(index, 1);
          return true;
        }
        for (let layer of layersList) {
          if (layer.children && deleteFromLayers(layer.children)) return true;
        }
        return false;
      };

      const newLayers = JSON.parse(JSON.stringify(page.layers));
      deleteFromLayers(newLayers);

      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html, 'image/svg+xml');
      const element = doc.querySelector(`[id="${layerId}"]`);
      if (element) {
        element.remove();
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });
    if (selectedLayerId === layerId) setSelectedLayerId(null);
  };

  const copyLayer = (pageIndex, layerId) => {
    const page = pages[pageIndex];
    if (!page) return;

    // Find layer and its parent to remember context
    let parentId = null;
    const findLayerAndParent = (layersList, pid = null) => {
      for (let layer of layersList) {
        if (layer.id === layerId) return { layer, parentId: pid };
        if (layer.children) {
          const found = findLayerAndParent(layer.children, layer.id);
          if (found) return found;
        }
      }
      return null;
    };

    const result = findLayerAndParent(page.layers);
    if (!result) return;

    const { layer, parentId: originalParentId } = result;

    const parser = new DOMParser();
    const doc = parser.parseFromString(page.html, 'image/svg+xml');
    const element = doc.querySelector(`[id="${layerId}"]`);
    if (!element) return;

    const serializer = new XMLSerializer();
    setClipboard({
      layer: JSON.parse(JSON.stringify(layer)),
      svgSnippet: serializer.serializeToString(element),
      originalParentId
    });
  };

  const cutLayer = (pageIndex, layerId) => {
    copyLayer(pageIndex, layerId);
    deleteLayer(pageIndex, layerId);
  };

  const pasteLayer = (pageIndex) => {
    if (!clipboard) return;
    saveToHistory();

    // Deep copy and regenerate IDs for uniqueness
    const prepareLayer = (l) => {
      const id = `${l.type}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...l,
        id: id,
        children: l.children ? l.children.map(prepareLayer) : undefined
      };
    };

    const newLayer = prepareLayer(clipboard.layer);

    setPages(prev => {
      const updated = [...prev];
      const page = updated[pageIndex];
      if (!page) return updated;

      let newLayers = JSON.parse(JSON.stringify(page.layers || []));
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(page.html || '<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'image/svg+xml');
      const svgRoot = doc.querySelector('svg');

      const snippetDoc = parser.parseFromString(clipboard.svgSnippet, 'image/svg+xml');
      const newElement = doc.importNode(snippetDoc.documentElement, true);
      
      // Update the root element ID
      newElement.setAttribute('id', newLayer.id);
      
      // If it's a group, recursively update IDs in the DOM
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

      // ── SMART PASTE LOGIC ──────────────────────────────────────────────────
      let pasted = false;

      // 1. If we have a selection, paste in same parent as selection, immediately on top of it
      if (selectedLayerId) {
        const insertNextTo = (list) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id === selectedLayerId) {
              // Paste AFTER selected in array (which is ABOVE in z-order/sidebar)
              list.splice(i + 1, 0, newLayer);
              return true;
            }
            if (list[i].children && insertNextTo(list[i].children)) return true;
          }
          return false;
        };

        if (insertNextTo(newLayers)) {
          const selectedEl = doc.querySelector(`[id="${selectedLayerId}"]`);
          if (selectedEl && selectedEl.parentNode) {
            // SVG z-index: last child is on top. 
            // To place ABOVE selection in canvas/sidebar, we insert it AFTER selection in DOM.
            selectedEl.parentNode.insertBefore(newElement, selectedEl.nextSibling);
            pasted = true;
          }
        }
      }

      // 2. If nothing pasted yet, but we have an "Entered Frame" (Figma-style), paste inside it at the top
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

      // 3. Fallback to Original Parent (if it still exists in the same page)
      if (!pasted && clipboard.originalParentId) {
        const insertAtEnd = (list) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id === clipboard.originalParentId) {
              list[i].children = [...(list[i].children || []), newLayer];
              return true;
            }
            if (list[i].children && insertAtEnd(list[i].children)) return true;
          }
          return false;
        };

        if (insertAtEnd(newLayers)) {
          const parentEl = doc.querySelector(`[id="${clipboard.originalParentId}"]`);
          if (parentEl) {
            parentEl.appendChild(newElement);
            pasted = true;
          }
        }
      }

      // 4. Last fallback: Paste at the very top (SVG root level)
      if (!pasted) {
        // If there is a single root "Root Folder" group, paste inside it
        if (newLayers.length === 1 && newLayers[0].type === 'g') {
          newLayers[0] = {
            ...newLayers[0],
            children: [...(newLayers[0].children || []), newLayer]
          };
          const rootEl = doc.querySelector(`[id="${newLayers[0].id}"]`);
          if (rootEl) {
            rootEl.appendChild(newElement);
          } else {
            svgRoot.appendChild(newElement);
          }
        } else {
          newLayers = [...newLayers, newLayer];
          svgRoot.appendChild(newElement);
        }
      }

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...page, layers: newLayers, html: newHtml };
      return updated;
    });

    // ── SELECT NEWLY PASTED ELEMENT ───────────────────────────────────────────
    setSelectedLayerId(newLayer.id);
    setMultiSelectedIds(new Set([newLayer.id]));
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
      const doc = parser.parseFromString(content, 'image/svg+xml');
      let svgRoot = doc.querySelector('svg');
      
      let layers = [];
      let updatedHtml = content;

      if (svgRoot) {
        const parseLayers = (element) => {
          return Array.from(element.children)
            .filter(child => !['defs', 'metadata', 'style', 'title', 'desc'].includes(child.tagName.toLowerCase()))
            .map((child, idx) => {
              const id = child.id || `${child.tagName}-${Math.random().toString(36).substr(2, 5)}`;
              if (!child.id) child.setAttribute('id', id);

              const name = child.getAttribute('data-name') || child.id || `${child.tagName.charAt(0).toUpperCase() + child.tagName.slice(1)}`;
              
              const layer = {
                id: id,
                name: name,
                type: child.tagName.toLowerCase(),
                visible: true,
                locked: false
              };

              if (child.tagName.toLowerCase() === 'g' && child.children.length > 0) {
                layer.children = parseLayers(child);
              }

              return layer;
            });
        };

        layers = parseLayers(svgRoot);
        const serializer = new XMLSerializer();
        updatedHtml = serializer.serializeToString(svgRoot);
      }

      const targetIndex = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;

      setPages(prev => {
        const updated = [...prev];
        if (updated[targetIndex]) {
          updated[targetIndex] = { 
            ...updated[targetIndex], 
            html: updatedHtml,
            layers: layers
          };
        }
        return updated;
      });
      
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
                  setPages(res.data.pages.map((p, i) => ({
                      id: p.v_id || i + 1,
                      name: p.name,
                      html: p.html
                  })));
                  setCurrentBook(res.data.meta);
              }
          } catch (err) {
              console.error("Failed to fetch flipbook:", err);
          }
      } 
      else if (location.state && location.state.pageCount) {
          const count = location.state.pageCount;
          const newPages = Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              name: `Page ${i + 1}`,
              html: '' 
          }));
          setPages(newPages);
      }
      else {
          setPages(Array.from({ length: 12 }, (_, i) => ({
              id: i + 1,
              name: `Page ${i + 1}`,
              html: ''
          })));
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
      />
      <RightSidebar isDoublePage={isDoublePage} setIsDoublePage={setIsDoublePage} />
      
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
