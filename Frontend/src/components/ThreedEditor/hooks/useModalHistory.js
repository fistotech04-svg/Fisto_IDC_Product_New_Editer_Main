// useModalHistory.js
import { useState, useCallback, useRef } from 'react';

function toComparableArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return [...val].sort();
    if (val instanceof Set) return Array.from(val).sort();
    try { return Array.from(val).sort(); } catch { return []; }
}

const stableStringify = (obj) => {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
};

function sanitizeMaterialSettingsForCompare(ms) {
    if (!ms) return {};
    const { useFactorColor, lastChangedProp, uvUnwrap, ...rest } = ms;
    return rest;
}

function areStatesEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    try {
        if (a.modelName !== b.modelName) return false;
        if ((a.selectedTextureId || null) !== (b.selectedTextureId || null)) return false;
        if ((a.models?.length || 0) !== (b.models?.length || 0)) return false;

        // selectedMaterial — compare name + uuid + meshUuid, not just name
        const aMat = a.selectedMaterial;
        const bMat = b.selectedMaterial;
        if ((aMat?.name || null) !== (bMat?.name || null)) return false;
        if ((aMat?.uuid || null) !== (bMat?.uuid || null)) return false;
        if ((aMat?.meshUuid || null) !== (bMat?.meshUuid || null)) return false;
        if (!!aMat?.isGroup !== !!bMat?.isGroup) return false;
        if (!!aMat?.isMultiSelect !== !!bMat?.isMultiSelect) return false;

        // selectedTexture — full identity, not just id
        const aTex = a.selectedTexture;
        const bTex = b.selectedTexture;
        if ((aTex?.id || null) !== (bTex?.id || null)) return false;
        if ((aTex?.ts || null) !== (bTex?.ts || null)) return false;

        // Sets / arrays
        if (JSON.stringify(toComparableArray(a.hiddenMaterials)) !== JSON.stringify(toComparableArray(b.hiddenMaterials))) return false;
        if (JSON.stringify(toComparableArray(a.deletedMaterials)) !== JSON.stringify(toComparableArray(b.deletedMaterials))) return false;
        if (JSON.stringify(toComparableArray(a.xrayMaterials)) !== JSON.stringify(toComparableArray(b.xrayMaterials))) return false;

        if (stableStringify(a.transformValues) !== stableStringify(b.transformValues)) return false;
        if (stableStringify(a.meshTransforms || {}) !== stableStringify(b.meshTransforms || {})) return false;
        if (stableStringify(a.customizedMaterials || {}) !== stableStringify(b.customizedMaterials || {})) return false;
        if (stableStringify(sanitizeMaterialSettingsForCompare(a.materialSettings)) !== stableStringify(sanitizeMaterialSettingsForCompare(b.materialSettings))) return false;
        if (stableStringify(a.rootTransform || {}) !== stableStringify(b.rootTransform || {})) return false;
        if (stableStringify(a.hotspots || []) !== stableStringify(b.hotspots || [])) return false;
        if (stableStringify(a.modelMaterialLists || {}) !== stableStringify(b.modelMaterialLists || {})) return false;

        return true;
    } catch {
        return false;
    }
}

export default function useModalHistory(initialState) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);

    const historyRef = useRef([initialState]);
    const indexRef = useRef(0);

    const setState = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;

        if (curHistory[curIndex] && areStatesEqual(curHistory[curIndex], newState)) {
            return;
        }

        const sliced = curHistory.slice(0, curIndex + 1);
        const nextHistory = sliced.length >= 60
            ? [...sliced.slice(sliced.length - 59), newState]
            : [...sliced, newState];
        const nextIndex = nextHistory.length - 1;

        historyRef.current = nextHistory;
        indexRef.current = nextIndex;
        setHistory(nextHistory);
        setIndex(nextIndex);
    }, []);

    const undo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex > 0) {
            const prevIndex = curIndex - 1;
            indexRef.current = prevIndex;
            setIndex(prevIndex);
            return curHistory[prevIndex];
        }
        return null;
    }, []);

    const redo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex < curHistory.length - 1) {
            const nextIndex = curIndex + 1;
            indexRef.current = nextIndex;
            setIndex(nextIndex);
            return curHistory[nextIndex];
        }
        return null;
    }, []);

    const resetHistory = useCallback((newState) => {
        historyRef.current = [newState];
        indexRef.current = 0;
        setHistory([newState]);
        setIndex(0);
    }, []);

    const update = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = [...historyRef.current];
        curHistory[curIndex] = newState;
        historyRef.current = curHistory;
        setHistory(curHistory);
    }, []);

    const currentState = history[index] ?? history[0] ?? null;

    return {
        state: currentState,
        past: history.slice(0, index),
        future: history.slice(index + 1),
        set: setState,
        update,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
        resetHistory,
        historyRef,
        indexRef
    };
}