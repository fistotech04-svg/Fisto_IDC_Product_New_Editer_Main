import React, { useCallback } from "react";
import { getFromDB, saveToDB } from "../../../utils/dbUtils";

export function useThreedMaterialSettings({
  materialSettings,
  setMaterialSettings,
  savedHdrs,
  setSavedHdrs,
  stateRef,
  customizedMaterialsRef,
  setCustomizedMaterials,
  sceneWrapperRef,
  getMaterialTargetKeys,
  commitHistoryNow,
  commitHistoryDebounced,
  buildSnapshot
}) {

  const updateMaterialSetting = useCallback((key, val, fromSync = false) => {
    setMaterialSettings((prev) => {
      if (val !== null && typeof val === 'object') {
        if (prev[key] === val) return prev;
        try {
          if (JSON.stringify(prev[key]) === JSON.stringify(val)) return prev;
        } catch (_) { }
      } else if (prev[key] === val) {
        return prev;
      }

      let effectiveVal = val;
      if (key === 'maps') {
        const preservedEnvMap = prev.customEnvMap || prev.maps?.envMap || null;
        if (preservedEnvMap && val && typeof val === 'object') {
          effectiveVal = { ...val, envMap: preservedEnvMap };
        }
      }

      const next = { ...prev, [key]: effectiveVal };
      if (key === 'maps' && prev.customEnvMap) {
        next.customEnvMap = prev.customEnvMap;
      }

      if (!fromSync) {
        const materialKeys = [
          'color', 'metallic', 'roughness', 'alpha', 'emissiveIntensity',
          'emissiveColor', 'normal', 'bump', 'scale', 'rotation', 'offset',
          'colorIntensity', 'ao', 'reflection', 'specular', 'worldOpacity', 'worldBlur',
          'shadow', 'softness', 'envRotation', 'lightPosition'
        ];
        if (materialKeys.includes(key)) {
          next.useFactorColor = true;
          next.lastChangedProp = key;
        }

        const curSel = stateRef.current.selectedMaterial;
        const targetKeys = getMaterialTargetKeys(curSel);
        if (targetKeys.length > 0) {
          const nextCustomMap = { ...(customizedMaterialsRef.current || {}) };
          targetKeys.forEach(tKey => {
            const prevEntry = nextCustomMap[tKey] || {};
            nextCustomMap[tKey] = {
              ...prevEntry,
              [key]: effectiveVal,
              ...(materialKeys.includes(key) ? { useFactorColor: true } : {})
            };
            if (tKey === '__ALL__') {
              try {
                const liveMeshes = [];
                if (sceneWrapperRef.current) {
                  sceneWrapperRef.current.traverse((obj) => {
                    if ((obj.isMesh || obj.isSkinnedMesh) && obj.uuid) {
                      liveMeshes.push(obj.uuid);
                      if (obj.name) liveMeshes.push(obj.name);
                    }
                  });
                }
                nextCustomMap[tKey].__meshes__ = Array.from(new Set(liveMeshes));
              } catch (_) { /* non-fatal */ }
            }
          });
          customizedMaterialsRef.current = nextCustomMap;
          setCustomizedMaterials(nextCustomMap);
        }

        const snapshot = buildSnapshot({
          materialSettings: next,
          customizedMaterials: customizedMaterialsRef.current
        });
        const instantKeys = ['environment', 'appliedTexture'];
        if (instantKeys.includes(key)) {
          commitHistoryNow(snapshot);
        } else {
          commitHistoryDebounced(snapshot, key === 'color' || key === 'emissiveColor' ? 500 : 400);
        }

      } else {
        next.useFactorColor = false;
        next.lastChangedProp = null;
      }

      return next;
    });
  }, [buildSnapshot, commitHistoryNow, commitHistoryDebounced, getMaterialTargetKeys, setMaterialSettings, stateRef, customizedMaterialsRef, setCustomizedMaterials, sceneWrapperRef]);

  const handleMaterialSync = useCallback((key, val) => {
    updateMaterialSetting(key, val, true);
  }, [updateMaterialSetting]);

  const handleMaterialUIUpdate = useCallback((key, val) => {
    if (key === 'environment') {
      React.startTransition(() => {
        if (val && val.startsWith('custom_')) {
          const matched = savedHdrs.find(h => h.id === val || `custom_${h.id}` === val);
          if (matched && matched.url) {
            setMaterialSettings(prev => {
              const nextMaps = { ...(prev.maps || {}), envMap: matched.url };
              return {
                ...prev,
                environment: val,
                customEnvMap: matched.url,
                maps: nextMaps
              };
            });
            saveToDB('active_hdr_id', matched.id);
            return;
          }
        }
        updateMaterialSetting(key, val, false);
      });
    } else {
      updateMaterialSetting(key, val, false);
    }
  }, [updateMaterialSetting, savedHdrs, setMaterialSettings]);

  const handleDeleteHdr = useCallback(async (hdrId) => {
    try {
      const existingHdrs = (await getFromDB('saved_hdrs')) || [];
      const updated = existingHdrs.filter(h => h.id !== hdrId && `custom_${h.id}` !== hdrId);
      await saveToDB('saved_hdrs', updated);
      setSavedHdrs(prev => prev.filter(h => h.id !== hdrId && `custom_${h.id}` !== hdrId));

      setMaterialSettings(prev => {
        if (prev.environment === hdrId || prev.environment === `custom_${hdrId}`) {
          const nextMaps = { ...(prev.maps || {}) };
          delete nextMaps.envMap;
          saveToDB('active_hdr_id', null);
          return {
            ...prev,
            environment: 'studio',
            customEnvMap: null,
            maps: nextMaps
          };
        }
        return prev;
      });
    } catch (e) {
      console.warn("[ThreedEditor] Error deleting HDR:", e);
    }
  }, [setSavedHdrs, setMaterialSettings]);

  const handleMapUpload = useCallback(async (mapType, file) => {
    if (mapType === 'envMap') {
      if (file === null) {
        setMaterialSettings(prev => {
          const nextMaps = { ...(prev.maps || {}) };
          delete nextMaps.envMap;
          const next = {
            ...prev,
            customEnvMap: null,
            environment: 'studio',
            maps: nextMaps
          };
          commitHistoryNow(buildSnapshot({
            materialSettings: next
          }));
          return next;
        });
        saveToDB('active_hdr_id', null);
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      const isHDREXR = ext === 'hdr' || ext === 'exr';
      const url = URL.createObjectURL(file) + (isHDREXR ? `#.${ext}` : '');
      const hdrId = `custom_${Date.now()}`;
      const newHdr = {
        id: hdrId,
        name: file.name,
        file: file,
        url: url,
        date: Date.now()
      };

      try {
        const existingHdrs = (await getFromDB('saved_hdrs')) || [];
        const updated = [newHdr, ...existingHdrs.filter(h => h.name !== file.name)].slice(0, 15);
        await saveToDB('saved_hdrs', updated);
        await saveToDB('active_hdr_id', hdrId);
        setSavedHdrs(updated);
      } catch (e) {
        console.warn("[ThreedEditor] Could not save HDR to IndexedDB:", e);
      }

      setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), envMap: url };
        const next = {
          ...prev,
          customEnvMap: url,
          environment: hdrId,
          maps: nextMaps
        };
        commitHistoryNow(buildSnapshot({
          materialSettings: next
        }));
        return next;
      });
      return;
    }

    if (file === null) {
      setMaterialSettings(prev => {
        const nextMaps = { ...(prev.maps || {}), [mapType]: null };
        const next = { ...prev, maps: nextMaps, useFactorColor: true, lastChangedProp: 'maps' };

        commitHistoryNow(buildSnapshot({
          materialSettings: next
        }));

        return next;
      });
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const isHDREXR = ext === 'hdr' || ext === 'exr';
    const url = URL.createObjectURL(file) + (isHDREXR ? `#.${ext}` : '');

    setMaterialSettings(prev => {
      const nextMaps = { ...(prev.maps || {}), [mapType]: url };
      let next = { ...prev, maps: nextMaps, useFactorColor: true, lastChangedProp: 'maps' };

      if (mapType === 'map' || !prev.maps?.map) next.scale = 50;

      if (mapType === 'map') next.color = '#ffffff';
      if (mapType === 'metalnessMap') next.metallic = 100;
      if (mapType === 'roughnessMap') next.roughness = 100;
      if (mapType === 'normalMap') next.normal = 100;
      if (mapType === 'bumpMap') next.bump = 100;
      if (mapType === 'aoMap') next.ao = 100;

      commitHistoryNow(buildSnapshot({
        materialSettings: next
      }));

      return next;
    });
  }, [commitHistoryNow, buildSnapshot, setMaterialSettings, setSavedHdrs]);

  return {
    updateMaterialSetting,
    handleMaterialSync,
    handleMaterialUIUpdate,
    handleDeleteHdr,
    handleMapUpload
  };
}
