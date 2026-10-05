import { useCallback } from "react";

/**
 * Hook providing selection resolution helpers for GenericModel.
 * Resolves targeted meshes and active materials based on single-mesh, multi-mesh, or group selections.
 */
export function useModelSelection({ scene, modelName, deletedMaterials, meshIndexRef }) {
    // Helper to resolve all 3D meshes targeted by the current selection
    const resolveTargetMeshes = useCallback((selMat) => {
        if (!selMat || !scene) return [];

        const isMeshDeleted = (child) => {
            if (!deletedMaterials || deletedMaterials.size === 0) return false;
            if (child.uuid && deletedMaterials.has(child.uuid)) return true;
            const m = child.userData?.__preXrayMaterial || child.material;
            const mats = Array.isArray(m) ? m : [m];
            return mats.some(mat => mat?.name && deletedMaterials.has(mat.name));
        };

        const isFullModel = !selMat || selMat.isAll || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene" || selMat.name === "All Meshes";
        if (isFullModel) {
            const all = [];
            scene.traverse(child => {
                if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && child.visible !== false && !isMeshDeleted(child)) {
                    all.push(child);
                }
            });
            return all;
        }

        // 1. Group / Multi-Selection
        if (selMat.isGroup || selMat.isMultiSelect || Array.isArray(selMat.items) || Array.isArray(selMat.uuids)) {
            const rawUuids = Array.isArray(selMat.uuids) ? selMat.uuids :
                (Array.isArray(selMat.items) ? selMat.items.map(it => it?.uuid || it?.meshUuid).filter(Boolean) : []);

            if (rawUuids.length > 0) {
                const uuidSet = new Set(rawUuids);
                const result = new Set();
                rawUuids.forEach(u => {
                    if (meshIndexRef.current.has(u)) {
                        meshIndexRef.current.get(u).forEach(c => {
                            if (!isMeshDeleted(c)) result.add(c);
                        });
                    }
                });
                if (result.size < uuidSet.size) {
                    scene.traverse(child => {
                        if (child.isMesh && uuidSet.has(child.uuid) && !isMeshDeleted(child)) {
                            result.add(child);
                        }
                    });
                }
                if (result.size > 0) return Array.from(result);
            }

            // Fallback for group defined by material names (e.g. material folder)
            if (Array.isArray(selMat.materials) && selMat.materials.length > 0) {
                const result = new Set();
                selMat.materials.forEach(mName => {
                    if (meshIndexRef.current.has(mName)) {
                        meshIndexRef.current.get(mName).forEach(c => {
                            if (!isMeshDeleted(c)) result.add(c);
                        });
                    }
                });
                if (result.size > 0) return Array.from(result);

                const matSet = new Set(selMat.materials);
                scene.traverse(child => {
                    if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && child.visible !== false && !isMeshDeleted(child)) {
                        const m = child.userData?.__preXrayMaterial || child.material;
                        const mats = Array.isArray(m) ? m : [m];
                        if (
                            matSet.has(child.uuid) ||
                            matSet.has(child.name) ||
                            mats.some(mat => mat && matSet.has(mat.name))
                        ) {
                            result.add(child);
                        }
                    }
                });
                if (result.size > 0) return Array.from(result);
            }
        }

        const targetUuid = selMat.uuid || selMat.meshUuid;
        const targetMat = typeof selMat.material === 'string' ? selMat.material : selMat.material?.name;
        const targetName = selMat.meshName || selMat.name;

        // 1. Single mesh selection: Strictly resolve by targetUuid if available
        if (targetUuid && !selMat.isGroup && !selMat.isAll) {
            if (meshIndexRef.current.has(targetUuid)) {
                const list = meshIndexRef.current.get(targetUuid).filter(c => !isMeshDeleted(c));
                if (list.length > 0) return list;
            }
            const exactMatch = [];
            scene.traverse(child => {
                if (child.isMesh && child.uuid === targetUuid && !isMeshDeleted(child)) {
                    exactMatch.push(child);
                }
            });
            if (exactMatch.length > 0) return exactMatch;
        }

        // 2. Fallback when targetUuid is not available (e.g. legacy selection)
        if (selMat.isMesh) {
            if (targetName && meshIndexRef.current.has(targetName)) {
                const list = meshIndexRef.current.get(targetName).filter(c => !isMeshDeleted(c));
                if (list.length > 0) return [list[0]];
            }
            let singleFound = null;
            scene.traverse(child => {
                if (singleFound) return;
                if (child.isMesh && child.name === targetName && !isMeshDeleted(child)) {
                    singleFound = child;
                }
            });
            if (singleFound) return [singleFound];
        }

        // 3. Material-level selection (e.g. selecting an entire shared material)
        if (targetMat && meshIndexRef.current.has(targetMat)) {
            return meshIndexRef.current.get(targetMat).filter(c => !isMeshDeleted(c));
        }

        const matches = [];
        scene.traverse(child => {
            if (child.isMesh && (child.material || child.userData?.__preXrayMaterial) && !isMeshDeleted(child)) {
                const activeMat = child.userData?.__preXrayMaterial || child.material;
                if (targetMat) {
                    const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
                    if (mats.some(m => m && m.name === targetMat)) {
                        matches.push(child);
                    }
                }
            }
        });
        return matches;
    }, [scene, modelName, deletedMaterials, meshIndexRef]);

    // Helper to resolve the primary THREE.Material targeted by the current selection
    const resolveTargetMaterial = useCallback((selMat) => {
        if (!selMat || !scene) return null;

        const isFullModel = !selMat || (modelName && (selMat.name === modelName || selMat === modelName)) || selMat.name === "Scene" || selMat === "Scene";
        if (isFullModel) {
            return null;
        }

        const targetUuid = selMat.uuid || selMat.meshUuid ||
            (Array.isArray(selMat.uuids) && selMat.uuids[0]) ||
            (Array.isArray(selMat.items) && (selMat.items[0]?.uuid || selMat.items[0]?.meshUuid));
        const targetMat = typeof selMat.material === 'string' ? selMat.material : (selMat.material?.name || (Array.isArray(selMat.materials) ? selMat.materials[0] : null));
        const targetName = selMat.meshName || selMat.name || (Array.isArray(selMat.meshNames) ? selMat.meshNames[0] : null);

        if (targetUuid) {
            let found = null;
            scene.traverse(child => {
                if (found) return;
                if (child.isMesh && child.uuid === targetUuid && (child.material || child.userData?.__preXrayMaterial)) {
                    const activeMat = child.userData?.__preXrayMaterial || child.material;
                    if (Array.isArray(activeMat)) {
                        found = targetMat ? (activeMat.find(m => m.name === targetMat) || activeMat[0]) : activeMat[0];
                    } else {
                        found = activeMat;
                    }
                }
            });
            if (found) return found;
        }

        if (targetMat && meshIndexRef.current.has(targetMat)) {
            const meshes = meshIndexRef.current.get(targetMat);
            if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
                const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
                return Array.isArray(m) ? (m.find(mat => mat.name === targetMat) || m[0]) : m;
            }
        }

        if (targetName && meshIndexRef.current.has(targetName)) {
            const meshes = meshIndexRef.current.get(targetName);
            if (meshes.length > 0 && (meshes[0].material || meshes[0].userData?.__preXrayMaterial)) {
                const m = meshes[0].userData?.__preXrayMaterial || meshes[0].material;
                return Array.isArray(m) ? m[0] : m;
            }
        }

        let found = null;
        scene.traverse(child => {
            if (found) return;
            if (child.isMesh && (child.material || child.userData?.__preXrayMaterial)) {
                const activeMat = child.userData?.__preXrayMaterial || child.material;
                const mats = Array.isArray(activeMat) ? activeMat : [activeMat];
                for (const m of mats) {
                    if (m && ((targetMat && m.name === targetMat) || (targetName && m.name === targetName))) {
                        found = m;
                        break;
                    }
                }
            }
        });
        return found;
    }, [scene, modelName, meshIndexRef]);

    return {
        resolveTargetMeshes,
        resolveTargetMaterial
    };
}
