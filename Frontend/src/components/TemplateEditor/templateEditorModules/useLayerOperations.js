/**
 * useLayerOperations.js
 * Comprehensive layer manipulation hook:
 * visibility, locking, renaming, z-index ordering (bringToFront, sendToBack, moveForward, moveBackward),
 * hierarchical reordering, delete, copy, cut, paste, and duplicate.
 */

export const useLayerOperations = ({
  pages,
  setPages,
  saveToHistory,
  clipboard,
  setClipboard,
  selectedLayerId,
  setSelectedLayerId,
  setMultiSelectedIds,
  currentFrameId,
  setCurrentFrameId,
  v_id,
  currentBook,
  skipPasteResetRef
}) => {
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

            if (!newLayer.visible) {
              document.querySelectorAll('.selection-overlay-layer').forEach(overlay => {
                overlay.querySelectorAll(`[id*="${layer.id}"]`).forEach(n => n.remove());
              });
              document.querySelectorAll('[id^="highlight-overlay-html-"]').forEach(htmlOverlay => {
                htmlOverlay.querySelectorAll(`[id*="${layer.id}"], [id^="resize-handle-${layer.id}-"], [id^="rotate-handle-${layer.id}"], [id^="rotation-degree-badge-${layer.id}"], [id^="rotate-hotspot-${layer.id}-"]`).forEach(h => h.remove());
              });
              document.querySelectorAll(`[id="${layer.id}"]`).forEach(liveEl => {
                liveEl.setAttribute('data-hidden', 'true');
                liveEl.style.display = 'none';
              });
            } else {
              document.querySelectorAll(`[id="${layer.id}"]`).forEach(liveEl => {
                liveEl.removeAttribute('data-hidden');
                liveEl.style.display = '';
              });
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
              if (element && element.parentNode) {
                const overlay = element.parentNode.querySelector(':scope > [data-name="Overlay"]');
                if (overlay) {
                  // If there is an overlay, move after it
                  element.parentNode.insertBefore(element, overlay.nextSibling);
                } else {
                  // Standard send to back
                  element.parentNode.insertBefore(element, element.parentNode.firstChild);
                }
              }
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
              const prev = element.previousElementSibling;
              // Check if we are trying to move behind the Overlay
              if (prev.getAttribute('data-name') === 'Overlay') {
                // Do nothing, we are already as far back as we can go!
                return;
              }
              element.parentNode.insertBefore(element, prev);
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
      const findAndRemove = (list) => {
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === sourceId) {
            sourceItem = list.splice(i, 1)[0];
            return true;
          }
          if (list[i].children && findAndRemove(list[i].children)) return true;
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



    const deleteLayer = (pageIndex, ids) => {
    const idList = Array.isArray(ids) ? ids : (ids instanceof Set ? Array.from(ids) : [ids]);
    const page = pages[pageIndex];
    if (!page) return;
    saveToHistory();
    setPages(prev => {
      const updated = [...prev];
      const targetPage = updated[pageIndex];
      if (!targetPage || !targetPage.html || !targetPage.layers) return updated;

      const parser = new DOMParser();
      const doc = parser.parseFromString(targetPage.html, 'image/svg+xml');

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

            // Clean up any associated slideshow key from localStorage
            try {
              const effectiveVId = v_id || currentBook?.v_id || 'local';
              localStorage.removeItem(`slideshow_${effectiveVId}_${layerId}`);
            } catch  { /* ignore */ }
          } else if (layersList[i].children) {
            deleteFromLayers(layersList[i].children);
          }
        }
      };

      const newLayers = JSON.parse(JSON.stringify(targetPage.layers));
      deleteFromLayers(newLayers);

      const serializer = new XMLSerializer();
      const newHtml = serializer.serializeToString(doc.documentElement);

      updated[pageIndex] = { ...targetPage, layers: newLayers, html: newHtml };
      return updated;
    });

    if (idList.includes(selectedLayerId)) {
      const rootId = page.layers?.[0]?.id;
      if (rootId) {
        setSelectedLayerId(rootId);
        setMultiSelectedIds(new Set([rootId]));
        if (setCurrentFrameId) setCurrentFrameId(rootId);
      } else {
        setSelectedLayerId(null);
      }
    }
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
    const findLayers = (layersList, parentId = null, alreadyCopyingAncestor = false) => {
      for (let layer of layersList) {
        const isSelected = idList.includes(layer.id);

        if (isSelected && !alreadyCopyingAncestor) {
          const element = doc.querySelector(`[id="${layer.id}"]`);
          if (element) {
            let svgSnippet = new XMLSerializer().serializeToString(element);

            // Extract external definitions (clipPath, grads) used by this snippet
            const defSnippets = [];
            const collectedIds = new Set();
            const extractDefs = (snippet) => {
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
                    extractDefs(defHtml);
                  }
                }
              }

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

        if (layer.children) {
          findLayers(layer.children, layer.id, alreadyCopyingAncestor || isSelected);
        }
      }
    };

    findLayers(page.layers);
    if (clipboardItems.length > 0) {
      setClipboard(clipboardItems);
    }
    return clipboardItems;
  };

  const cutLayer = (pageIndex, ids) => {
    copyLayer(pageIndex, ids);
    deleteLayer(pageIndex, ids);
  };

  const pasteLayer = (pageIndex, itemsToPaste = clipboard) => {
    if (!itemsToPaste || !Array.isArray(itemsToPaste)) return;
    saveToHistory();

    const prepareLayer = (l) => {
      const id = `${l.type}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...l,
        id: id,
        children: l.children ? l.children.map(prepareLayer) : undefined
      };
    };

    const newItems = itemsToPaste.map(item => ({
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

        // Apply an offset to the duplicated/pasted element so it doesn't perfectly overlap
        // Avoid offsetting structural elements like 'g' that are marked as 'frame' (folders)
        if (newElement.tagName !== 'g' || newElement.getAttribute('data-type') !== 'frame') {
          const currentTransform = newElement.getAttribute('transform') || '';
          newElement.setAttribute('transform', (currentTransform + ' translate(20, 20)').trim());
        }

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

    // Select all newly pasted elements.
    // Set guard first so the page-selection useEffect (which reacts to pages changing)
    // doesn't reset selection back to the root frame during this paste operation.
    const newIds = new Set(newItems.map(item => item.newLayer.id));
    const lastNewId = newItems.length > 0 ? newItems[newItems.length - 1].newLayer.id : null;

    skipPasteResetRef.current = true;

    // We can set multiSelectedIds immediately for visual handles
    setMultiSelectedIds(newIds);

    // Defer setSelectedLayerId so that when RightSidebar renders the properties panel (e.g. TextEditor),
    // the LIVE DOM has already been updated with the new HTML. Otherwise, document.getElementById
    // during render will return null and the property editors will crash/return null.
    setTimeout(() => {
      if (lastNewId) setSelectedLayerId(lastNewId);

      // Clear the guard after the selection has been safely applied
      setTimeout(() => { skipPasteResetRef.current = false; }, 50);
    }, 50);
  };

  const duplicateLayer = (pageIndex, ids) => {
    const items = copyLayer(pageIndex, ids);
    if (items && items.length > 0) {
      pasteLayer(pageIndex, items);
    }
  };


  return {
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    bringLayerToFront,
    sendLayerToBack,
    moveLayerForward,
    moveLayerBackward,
    reorderLayer,
    deleteLayer,
    copyLayer,
    cutLayer,
    pasteLayer,
    duplicateLayer
  };
};
