import React, { useMemo, useCallback, useEffect } from "react";
import axios from "axios";

export function useThreedMaterialTree({
  models,
  setModels,
  modelName,
  setModelName,
  setModelUrl,
  urlModelId,
  modelMaterialLists,
  setModelMaterialLists,
  modelStatsMap,
  setModelStatsMap,
  setModelHasAnimationsMap,
  hiddenMaterials,
  setHiddenMaterials,
  xrayMaterials,
  setXrayMaterials,
  xrayMode,
  setXrayMode,
  deletedMaterials,
  setDeletedMaterials,
  selectedMaterial,
  setSelectedMaterial,
  materialSettings,
  setMaterialSettings,
  hotspots,
  setHotspots,
  activeHotspotId,
  setActiveHotspotId,
  setEditingHotspot,
  setShowHotspotModal,
  setIsPlacingHotspot,
  isPlacingHotspotRef,
  setRightPanelMode,
  setIsSidebarCollapsed,
  sceneWrapperRef,
  modelRef,
  modelRefs,
  commitHistoryNow,
  handleUndo,
  handleRedo,
  buildSnapshot,
  setThreedState
}) {

  const activeMaterialList = useMemo(() => {
    const isNodeDeleted = (n) => {
      if (!n || !deletedMaterials || deletedMaterials.size === 0) return false;
      if (typeof n === 'string') return deletedMaterials.has(n);
      if (n.uuid && deletedMaterials.has(n.uuid)) return true;
      if (n.meshUuid && deletedMaterials.has(n.meshUuid)) return true;
      if (n.id && deletedMaterials.has(n.id)) return true;
      if (n.isMesh) {
        return false;
      }
      if (n.name && deletedMaterials.has(n.name)) return true;
      if (n.material && deletedMaterials.has(n.material)) return true;
      if (Array.isArray(n.materials) && n.materials.length > 0 && n.materials.every(m => deletedMaterials.has(typeof m === 'string' ? m : (m?.name || m)))) {
        return true;
      }
      return false;
    };

    const filterTreeNodes = (nodes) => {
      if (!Array.isArray(nodes)) return [];
      const filtered = [];
      for (const node of nodes) {
        if (isNodeDeleted(node)) continue;
        if (Array.isArray(node.children) && node.children.length > 0) {
          const cleanedChildren = filterTreeNodes(node.children);
          if (node.isGroup && cleanedChildren.length === 0) {
            continue;
          }
          filtered.push({ ...node, children: cleanedChildren });
        } else {
          filtered.push(node);
        }
      }
      return filtered;
    };

    const result = [];
    models.forEach(model => {
      const rawList = modelMaterialLists[model.id] || [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        const cleanedTree = filterTreeNodes(rawList);
        const matNames = new Set();
        const findMats = (node) => {
          if (!node) return;
          if (typeof node === 'string') {
            if (!deletedMaterials.has(node)) matNames.add(node);
            return;
          }
          if (typeof node.material === 'string' && !deletedMaterials.has(node.material)) {
            matNames.add(node.material);
          }
          if (Array.isArray(node.materials)) {
            node.materials.forEach(m => {
              const mName = typeof m === 'string' ? m : (m?.name || m);
              if (mName && !deletedMaterials.has(mName)) matNames.add(mName);
            });
          }
          if (Array.isArray(node.children)) node.children.forEach(findMats);
        };
        cleanedTree.forEach(findMats);

        result.push({
          id: model.id,
          group: model.name,
          tree: cleanedTree,
          materials: Array.from(matNames)
        });
      }
    });
    return result;
  }, [models, modelMaterialLists, deletedMaterials]);

  const handleToggleVisibility = useCallback((matTarget, isVisible) => {
    const next = new Set(hiddenMaterials);

    const keysToProcess = [];
    if (Array.isArray(matTarget)) {
      matTarget.forEach(t => {
        if (typeof t === 'string') keysToProcess.push(t);
        else if (t?.uuid) keysToProcess.push(t.uuid);
        else if (t?.meshUuid) keysToProcess.push(t.meshUuid);
      });
    } else if (matTarget && typeof matTarget === 'object') {
      if (matTarget.isMesh || (!matTarget.isGroup && (matTarget.meshUuid || matTarget.uuid))) {
        if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
        if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
      } else if (matTarget.isMultiSelect || Array.isArray(matTarget.items) || Array.isArray(matTarget.uuids)) {
        if (Array.isArray(matTarget.uuids)) keysToProcess.push(...matTarget.uuids);
        if (Array.isArray(matTarget.items)) {
          matTarget.items.forEach(it => {
            if (it?.uuid) keysToProcess.push(it.uuid);
            if (it?.meshUuid) keysToProcess.push(it.meshUuid);
          });
        }
      } else {
        if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
        if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
        if (matTarget.name) keysToProcess.push(matTarget.name);
        if (!matTarget.uuid && !matTarget.meshUuid && matTarget.material && typeof matTarget.material === 'string') {
          keysToProcess.push(matTarget.material);
        }
      }
    } else if (matTarget) {
      keysToProcess.push(matTarget);
    }

    keysToProcess.forEach(k => {
      if (!k || typeof k !== 'string') return;
      if (isVisible) {
        next.delete(k);
      } else {
        next.add(k);
      }
    });

    setHiddenMaterials(next);

    commitHistoryNow(buildSnapshot({
      hiddenMaterials: Array.from(next),
      materialSettings: materialSettings
    }));
  }, [hiddenMaterials, materialSettings, commitHistoryNow, buildSnapshot, setHiddenMaterials]);

  const handleToggleXray = useCallback((matTarget, isCurrentlyXray) => {
    const next = new Set(xrayMaterials);

    const keysToProcess = [];
    if (Array.isArray(matTarget)) {
      matTarget.forEach(t => {
        if (typeof t === 'string') keysToProcess.push(t);
        else if (t?.uuid) keysToProcess.push(t.uuid);
        else if (t?.meshUuid) keysToProcess.push(t.meshUuid);
      });
    } else if (matTarget && typeof matTarget === 'object') {
      if (matTarget.isMesh || (!matTarget.isGroup && (matTarget.meshUuid || matTarget.uuid))) {
        if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
        if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
      } else if (matTarget.isMultiSelect || Array.isArray(matTarget.items) || Array.isArray(matTarget.uuids)) {
        if (Array.isArray(matTarget.uuids)) keysToProcess.push(...matTarget.uuids);
        if (Array.isArray(matTarget.items)) {
          matTarget.items.forEach(it => {
            if (it?.uuid) keysToProcess.push(it.uuid);
            if (it?.meshUuid) keysToProcess.push(it.meshUuid);
          });
        }
      } else {
        if (matTarget.meshUuid) keysToProcess.push(matTarget.meshUuid);
        if (matTarget.uuid) keysToProcess.push(matTarget.uuid);
        if (matTarget.name) keysToProcess.push(matTarget.name);
        if (!matTarget.uuid && !matTarget.meshUuid && matTarget.material && typeof matTarget.material === 'string') {
          keysToProcess.push(matTarget.material);
        }
      }
    } else if (matTarget) {
      keysToProcess.push(matTarget);
    }

    keysToProcess.forEach(k => {
      if (!k || typeof k !== 'string') return;
      if (isCurrentlyXray) {
        next.delete(k);
      } else {
        next.add(k);
      }
    });

    if (xrayMode) {
      setXrayMode(false);
    }
    setXrayMaterials(next);

    commitHistoryNow(buildSnapshot({
      xrayMaterials: Array.from(next)
    }));
  }, [xrayMaterials, xrayMode, commitHistoryNow, buildSnapshot, setXrayMode, setXrayMaterials]);

  const handleDeleteModel = useCallback((modelId) => {
    const modelToDelete = models.find(m => m.id === modelId || m.name === modelId);
    const targetId = modelToDelete ? modelToDelete.id : (modelId || models[0]?.id);
    if (!targetId && models.length === 0) return;

    const nextModels = targetId ? models.filter(m => m.id !== targetId) : [];
    setModels(nextModels);

    const nextMaterialLists = { ...modelMaterialLists };
    if (targetId) delete nextMaterialLists[targetId];
    else Object.keys(nextMaterialLists).forEach(k => delete nextMaterialLists[k]);
    setModelMaterialLists(nextMaterialLists);

    const nextStatsMap = { ...modelStatsMap };
    if (targetId) delete nextStatsMap[targetId];
    else Object.keys(nextStatsMap).forEach(k => delete nextStatsMap[k]);
    setModelStatsMap(nextStatsMap);

    setModelHasAnimationsMap(prev => {
      if (!targetId) return {};
      if (!prev[targetId]) return prev;
      const next = { ...prev };
      delete next[targetId];
      return next;
    });

    setSelectedMaterial(null);

    const nextHotspots = nextModels.length === 0
      ? []
      : hotspots.filter(h => h.modelId !== targetId && h.meshName !== modelToDelete?.name);

    setHotspots(nextHotspots);
    if (nextModels.length === 0 || nextHotspots.length === 0) {
      setActiveHotspotId(null);
      setEditingHotspot(null);
      setShowHotspotModal(false);
      setIsPlacingHotspot(false);
      if (isPlacingHotspotRef) isPlacingHotspotRef.current = false;
      if (nextModels.length === 0) {
        setRightPanelMode('edit');
      }
    }

    setThreedState(prev => ({
      ...prev,
      models: nextModels,
      hotspots: nextHotspots
    }));

    commitHistoryNow(buildSnapshot({
      models: nextModels,
      modelMaterialLists: nextMaterialLists,
      selectedMaterial: null,
      hotspots: nextHotspots
    }));
  }, [models, modelMaterialLists, modelStatsMap, hotspots, commitHistoryNow, buildSnapshot, setThreedState, setModels, setModelMaterialLists, setModelStatsMap, setModelHasAnimationsMap, setSelectedMaterial, setHotspots, setActiveHotspotId, setEditingHotspot, setShowHotspotModal, setIsPlacingHotspot, isPlacingHotspotRef, setRightPanelMode]);

  const handleDeleteMaterial = useCallback((matTarget) => {
    const next = new Set(deletedMaterials);

    const addKeys = (item) => {
      if (!item) return;
      if (typeof item === 'string') { next.add(item); return; }

      if (item.isMesh || item.isMultiSelect || Array.isArray(item.items) || Array.isArray(item.uuids)) {
        if (item.uuid) next.add(item.uuid);
        if (item.meshUuid) next.add(item.meshUuid);
        if (item.id) next.add(item.id);
        if (Array.isArray(item.uuids)) item.uuids.forEach(u => next.add(u));
        if (Array.isArray(item.items)) {
          item.items.forEach(it => {
            if (it?.uuid) next.add(it.uuid);
            if (it?.meshUuid) next.add(it.meshUuid);
            if (it?.id) next.add(it.id);
          });
        }
        return;
      }

      if (item.uuid) next.add(item.uuid);
      if (item.meshUuid) next.add(item.meshUuid);
      if (item.id) next.add(item.id);
      if (Array.isArray(item.children)) item.children.forEach(addKeys);
      if (Array.isArray(item.meshNames)) item.meshNames.forEach(addKeys);

      if (!item.uuid && !item.meshUuid && item.material && typeof item.material === 'string') {
        next.add(item.material);
      }
    };

    if (Array.isArray(matTarget)) {
      matTarget.forEach(addKeys);
    } else {
      addKeys(matTarget);
    }

    setDeletedMaterials(next);
    setSelectedMaterial(null);

    const remainingHotspots = hotspots.filter(h => {
      if (h.meshUuid && next.has(h.meshUuid)) return false;
      if (h.meshName && next.has(h.meshName)) return false;
      return true;
    });
    if (remainingHotspots.length !== hotspots.length) {
      setHotspots(remainingHotspots);
      if (activeHotspotId && !remainingHotspots.some(h => String(h.id) === String(activeHotspotId))) {
        setActiveHotspotId(null);
      }
    }

    commitHistoryNow(buildSnapshot({
      deletedMaterials: Array.from(next),
      materialSettings: materialSettings,
      selectedMaterial: null,
      hotspots: remainingHotspots
    }));
  }, [deletedMaterials, materialSettings, hotspots, activeHotspotId, commitHistoryNow, buildSnapshot, setDeletedMaterials, setSelectedMaterial, setHotspots, setActiveHotspotId]);

  const handleRename = useCallback(async (newName) => {
    if (!newName || !newName.trim()) return;

    const oldModelName = modelName;
    setModelName(newName);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

      const nextModels = models.map(m => {
        if (m.name === oldModelName || models.length === 1) {
          return { ...m, name: newName };
        }
        return m;
      });
      setModels(nextModels);

      const nextSnapshot = buildSnapshot({
        modelName: newName,
        models: nextModels
      });
      commitHistoryNow(nextSnapshot);

      if (urlModelId) {
        try {
          await axios.post(`${backendUrl}/api/3d-models/rename-label`, {
            emailId: user.emailId,
            modelId: urlModelId,
            newName: newName.trim()
          });
        } catch (e) {
          console.error("DB label rename failed:", e);
        }

        await axios.post(`${backendUrl}/api/3d-models/save-session`, {
          emailId: user.emailId,
          state: nextSnapshot
        });
        return;
      }

      const renameIndex = nextModels.findIndex(m => m.name === newName);
      if (renameIndex !== -1) {
        const target = nextModels[renameIndex];
        if (target.url && !target.url.startsWith('blob:')) {
          const oldFileName = target.url.split('/').pop();
          try {
            const renameRes = await axios.post(`${backendUrl}/api/3d-models/rename-model`, {
              emailId: user.emailId,
              oldName: oldFileName,
              newName: newName,
              modelId: target.modelId
            });
            if (renameRes.data && renameRes.data.url) {
              const updatedUrl = `${backendUrl}${renameRes.data.url}`;
              nextModels[renameIndex].url = updatedUrl;

              setModels([...nextModels]);
              if (renameIndex === 0) setModelUrl(updatedUrl);

              try {
                const bc = new BroadcastChannel('threed_model_updates');
                bc.postMessage({
                  type: 'model-renamed',
                  modelId: target.modelId,
                  oldName: oldFileName,
                  newName: renameRes.data.newName || newName,
                  newUrl: updatedUrl,
                  newRelativeUrl: renameRes.data.url
                });
                bc.close();
              } catch (bcErr) {
                console.warn('BroadcastChannel not supported:', bcErr);
              }
            }
          } catch (e) {
            console.error("Server-side file rename failed:", e);
          }
        }
      }

      await axios.post(`${backendUrl}/api/3d-models/save-session`, {
        emailId: user.emailId,
        state: nextSnapshot
      });

    } catch (error) {
      console.error("Failed to update backend rename:", error);
    }
  }, [models, modelName, commitHistoryNow, buildSnapshot, setModelUrl, urlModelId, setModelName, setModels]);

  const handleRenameMaterial = useCallback((oldName, newName, mName) => {
    const model = models.find(m => m.name === mName || m.originalName === mName);
    if (model && modelRefs.current.get(model.id)) {
      modelRefs.current.get(model.id).renameMaterial(oldName, newName);
    } else if (modelRef.current) {
      modelRef.current.renameMaterial(oldName, newName);
    }

    let nextMaterialLists = modelMaterialLists;
    if (model) {
      const prevList = modelMaterialLists[model.id] || [];
      const renameNode = (item) => {
        if (typeof item === 'string') {
          return item === oldName ? newName : item;
        }
        if (!item || typeof item !== 'object') return item;
        const updated = { ...item };
        if (updated.name === oldName) updated.name = newName;
        if (updated.material === oldName) updated.material = newName;
        if (Array.isArray(updated.materials)) {
          updated.materials = updated.materials.map(m => m === oldName ? newName : m);
        }
        if (Array.isArray(updated.children)) {
          updated.children = updated.children.map(renameNode);
        }
        return updated;
      };
      const nextList = prevList.map(renameNode);
      nextMaterialLists = { ...modelMaterialLists, [model.id]: nextList };
      setModelMaterialLists(nextMaterialLists);

      commitHistoryNow(buildSnapshot({
        modelMaterialLists: nextMaterialLists
      }));
    }

    if (selectedMaterial && (selectedMaterial.name === oldName)) {
      setSelectedMaterial(prev => {
        if (!prev) return prev;
        return { ...prev, name: newName };
      });
    }
  }, [models, selectedMaterial, modelMaterialLists, commitHistoryNow, buildSnapshot, modelRefs, modelRef, setModelMaterialLists, setSelectedMaterial]);

  const handleSelectAllMeshes = useCallback(() => {
    if (models.length === 0) return;

    const allMaterials = [];
    const allUuids = [];
    const allMeshNames = [];

    if (sceneWrapperRef.current) {
      sceneWrapperRef.current.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && child.material && !deletedMaterials.has(child.uuid)) {
          if (child.uuid) allUuids.push(child.uuid);
          if (child.name) allMeshNames.push(child.name);
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m?.name) allMaterials.push(m.name);
          });
        }
      });
    }

    models.forEach((model) => {
      const rawList = modelMaterialLists[model.id] || [];
      const findMats = (node) => {
        if (!node) return;
        if (node.uuid && !deletedMaterials.has(node.uuid)) allUuids.push(node.uuid);
        if (node.meshUuid && !deletedMaterials.has(node.meshUuid)) allUuids.push(node.meshUuid);
        if (node.name) allMeshNames.push(node.name);
        if (node.material) allMaterials.push(node.material);
        if (Array.isArray(node.materials)) {
          node.materials.forEach((m) => allMaterials.push(typeof m === 'string' ? m : (m?.name || m)));
        }
        if (Array.isArray(node.children)) node.children.forEach(findMats);
      };
      rawList.forEach(findMats);
    });

    const uniqueMats = Array.from(new Set(allMaterials)).filter((m) => !deletedMaterials.has(m));
    const uniqueUuids = Array.from(new Set(allUuids));
    const uniqueNames = Array.from(new Set(allMeshNames));

    setSelectedMaterial({
      name: modelName || "All Meshes",
      parentGroup: modelName,
      isAll: true,
      isGroup: true,
      isMultiSelect: true,
      uuids: uniqueUuids,
      meshNames: uniqueNames,
      materials: uniqueMats,
      ts: Date.now()
    });
  }, [models, modelMaterialLists, deletedMaterials, modelName, sceneWrapperRef, setSelectedMaterial]);

  const handleDeleteCurrentSelection = useCallback(() => {
    if (!selectedMaterial) {
      if (models.length > 0) {
        handleDeleteModel(models[0]?.id);
      }
      return;
    }

    if (selectedMaterial.isAll) {
      if (models.length > 0) {
        handleDeleteModel(models[0]?.id);
      } else {
        handleDeleteMaterial(selectedMaterial);
      }
      return;
    }

    if (selectedMaterial.isGroup || selectedMaterial.isMultiSelect || Array.isArray(selectedMaterial.items) || Array.isArray(selectedMaterial.uuids)) {
      handleDeleteMaterial(selectedMaterial);
      return;
    }

    const matName = selectedMaterial.name;
    if (matName === modelName || matName === "Scene") {
      handleDeleteModel(models[0]?.id || matName);
    } else {
      handleDeleteMaterial(selectedMaterial);
    }
  }, [selectedMaterial, models, modelName, handleDeleteModel, handleDeleteMaterial]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        e.target.closest?.('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && keyLower === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && keyLower === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (keyLower === 'a' && !e.altKey) {
        e.preventDefault();
        handleSelectAllMeshes();
      } else if (e.key === 'Escape') {
        setSelectedMaterial(null);
      } else if (keyLower === 'h') {
        if (selectedMaterial && selectedMaterial.name) {
          e.preventDefault();
          const matName = selectedMaterial.name;
          const isCurrentlyHidden = hiddenMaterials.has(matName);
          handleToggleVisibility(matName, isCurrentlyHidden);
        }
      } else if (e.key === 'Delete' || e.key === 'Del' || keyLower === 'delete' || e.key === 'Backspace' || keyLower === 'd') {
        e.preventDefault();
        handleDeleteCurrentSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSelectAllMeshes,
    handleDeleteCurrentSelection,
    selectedMaterial,
    hiddenMaterials,
    handleToggleVisibility,
    setSelectedMaterial
  ]);

  return {
    activeMaterialList,
    handleToggleVisibility,
    handleToggleXray,
    handleDeleteModel,
    handleDeleteMaterial,
    handleRename,
    handleRenameMaterial,
    handleSelectAllMeshes,
    handleDeleteCurrentSelection
  };
}
