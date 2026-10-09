import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";
import {
    globalTextureCache,
    sharedTextureLoader,
    getTextureSource,
    safeComputeTangents,
    ensurePhysicalMaterial,
    applyBoxUV
} from "../utils/genericModelMaterialUtils";
import MeshSelectionHighlight from "./MeshSelectionHighlight";
import { useModelSelection } from "../hooks/useModelSelection";
import { useModelAnimations } from "../hooks/useModelAnimations";
import { useModelMaterialApplier } from "../hooks/useModelMaterialApplier";

const GenericModel = React.memo(React.forwardRef(({
    scene,
    animations,
    wireframe,
    xrayMode,
    xrayMaterials,
    setModelStats,
    setMaterialList,
    selectedMaterial,
    onSelectMaterial,
    modelId,
    modelName,
    transformMode,
    materialSettings,
    customizedMaterials,
    hiddenMaterials,
    deletedMaterials,
    onTransformChange,
    onTransformStart,
    onTransformEnd,
    rootTransform,
    transformValues,
    meshTransforms,
    selectedTexture,
    onTextureApplied,
    onTextureIdentified,
    onUpdateMaterialSetting,
    resetKey,
    transformResetKey,
    sceneResetTrigger,
    uvUnwrapTrigger,
    isSelectionDisabled,
    includeTextures,
    onModelReady,
    isAnimationPlaying = true,
    onHasAnimationsChange,
    activeHotspotMeshUuid,
    activeHotspotMeshName
}, ref) => {
    const [position, setPosition] = useState(() => [0, 0, 0]);
    const [scale, setScale] = useState(() => 1);
    const meshPointerDownPosRef = useRef({ x: 0, y: 0 });
    const [modelGroup, setModelGroup] = useState(null);
    const [transformTarget, setTransformTarget] = useState(null);

    const [syncedSelectionSignature, setSyncedSelectionSignature] = useState(null);
    const activeTextureRef = React.useRef(selectedTexture);
    activeTextureRef.current = selectedTexture;
    const customizedMaterialsRef = React.useRef(customizedMaterials);
    customizedMaterialsRef.current = customizedMaterials;
    const lastAppliedTextureTsRef = React.useRef(0);
    const lastSyncedSigRef = React.useRef('');

    // Expose live Three.js scene and model group to parent ref for clean GLB exports and live sync
    React.useImperativeHandle(ref, () => scene || modelGroup, [scene, modelGroup]);

    const onUpdateMaterialSettingRef = React.useRef(onUpdateMaterialSetting);
    onUpdateMaterialSettingRef.current = onUpdateMaterialSetting;

    const onTextureIdentifiedRef = React.useRef(onTextureIdentified);
    onTextureIdentifiedRef.current = onTextureIdentified;

    // Mesh Index for fast material lookups - avoids expensive scene.traverse calls
    const meshIndexRef = React.useRef(new Map()); // Map<MaterialName | MeshUUID, Mesh[]>

    // Animation hook
    const { mixerRef } = useModelAnimations({
        scene,
        animations,
        isAnimationPlaying,
        onHasAnimationsChange
    });

    useFrame((state, delta) => {
        if (mixerRef.current && isAnimationPlaying !== false) {
            const safeDelta = Math.min(delta, 0.1);
            mixerRef.current.update(safeDelta);
        }
    });

    // Multi-mesh transform support for shared materials
    const relatedMeshesRef = React.useRef([]);
    const followerOffsetsRef = React.useRef(new Map()); // Map<UUID, Matrix4 (relative to leader)>
    const pivotRef = React.useRef(new THREE.Group());
    const pivotOffsetsRef = React.useRef(new Map()); // Map<UUID, Matrix4 (relative to pivot)>
    const isGizmoDraggingRef = React.useRef(false);

    const updatePivotToTarget = useCallback((target, related = []) => {
        if (!target) return;
        const pivot = pivotRef.current;
        if (!pivot) return;

        const list = (related && related.length > 0) ? related : [target];
        const box = new THREE.Box3();
        let hasValidMesh = false;
        list.forEach(m => {
            if (m && (m.isMesh || m.isSkinnedMesh) && m.visible !== false) {
                m.updateMatrixWorld(true);
                box.expandByObject(m);
                hasValidMesh = true;
            }
        });

        const worldCenter = new THREE.Vector3();
        if (hasValidMesh && !box.isEmpty() && isFinite(box.min.x)) {
            box.getCenter(worldCenter);
        } else if (typeof target.getWorldPosition === 'function') {
            target.getWorldPosition(worldCenter);
        } else if (target.position) {
            worldCenter.copy(target.position);
        }

        pivot.position.copy(worldCenter);
        if (list.length === 1 && target && target.quaternion) {
            pivot.quaternion.copy(target.quaternion);
        } else {
            pivot.rotation.set(0, 0, 0);
        }
        pivot.scale.set(1, 1, 1);
        pivot.updateMatrix();
        pivot.updateMatrixWorld(true);

        const pivotWorldInverse = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
        const offsets = new Map();
        list.forEach(mesh => {
            if (mesh && mesh.uuid) {
                mesh.updateMatrixWorld(true);
                const rel = new THREE.Matrix4().multiplyMatrices(pivotWorldInverse, mesh.matrixWorld);
                offsets.set(mesh.uuid, rel);
            }
        });
        pivotOffsetsRef.current = offsets;
    }, []);

    // Selection Resolution Hook
    const { resolveTargetMeshes, resolveTargetMaterial } = useModelSelection({
        scene,
        modelName,
        modelId,
        deletedMaterials,
        meshIndexRef
    });

    // Helper to ensure a mesh has its own unique, cloned material instance if shared with other meshes
    const ensureMeshUniqueMaterial = useCallback((mesh, allowedSharedSet = null) => {
        if (!mesh || !scene) return;
        const currentMat = mesh.userData?.__preXrayMaterial || mesh.material;
        if (!currentMat) return;
        const mats = Array.isArray(currentMat) ? currentMat : [currentMat];
        let didClone = false;
        const newMats = mats.map(m => {
            if (!m) return m;
            let isShared = false;
            scene.traverse(c => {
                if (isShared) return;
                if (c.isMesh && c !== mesh && (c.material || c.userData?.__preXrayMaterial)) {
                    if (allowedSharedSet && allowedSharedSet.has(c)) return;
                    const cMat = c.userData?.__preXrayMaterial || c.material;
                    const cm = Array.isArray(cMat) ? cMat : [cMat];
                    if (cm.some(mat => mat === m || (mat.uuid && mat.uuid === m.uuid))) {
                        isShared = true;
                    }
                }
            });
            if (isShared) {
                const cloned = m.clone();
                cloned.name = `${m.name || 'Material'}_${mesh.name || mesh.uuid.slice(0, 4)}`;
                cloned.userData = { ...m.userData };
                cloned.userData.baseMaterialName = m.userData.baseMaterialName || m.name;
                cloned.userData.initialName = m.userData.initialName || m.name;
                cloned.userData.initialUuid = m.userData.initialUuid || m.uuid;

                const pristine = m.userData.__pristineBaseline ||
                    scene.userData?.__pristineMaterialRegistry?.get(m.uuid) ||
                    scene.userData?.__pristineMaterialRegistry?.get(m.name) ||
                    scene.userData?.__pristineMaterialRegistry?.get(mesh.uuid) ||
                    scene.userData?.__pristineMaterialRegistry?.get(mesh.name);

                if (pristine) {
                    cloned.userData.__pristineBaseline = pristine;
                }

                // Ensure original textures and maps are preserved
                cloned.userData.originalMap = pristine?.map || m.userData.originalMap || m.map;
                cloned.userData.originalNormalMap = pristine?.normalMap || m.userData.originalNormalMap || m.normalMap;
                cloned.userData.originalRoughnessMap = pristine?.roughnessMap || m.userData.originalRoughnessMap || m.roughnessMap;
                cloned.userData.originalMetalnessMap = pristine?.metalnessMap || m.userData.originalMetalnessMap || m.metalnessMap;
                cloned.userData.originalAoMap = pristine?.aoMap || m.userData.originalAoMap || m.aoMap;
                cloned.userData.originalEmissiveMap = pristine?.emissiveMap || m.userData.originalEmissiveMap || m.emissiveMap;
                cloned.userData.originalAlphaMap = pristine?.alphaMap || m.userData.originalAlphaMap || m.alphaMap;
                cloned.userData.originalBumpMap = pristine?.bumpMap || m.userData.originalBumpMap || m.bumpMap;
                cloned.userData.originalDisplacementMap = pristine?.displacementMap || m.userData.originalDisplacementMap || m.displacementMap;

                // Ensure numeric and scalar baseline properties are preserved
                cloned.userData.originalRoughness = pristine?.roughness !== undefined ? pristine.roughness : (m.userData.originalRoughness !== undefined ? m.userData.originalRoughness : m.roughness);
                cloned.userData.originalMetalness = pristine?.metalness !== undefined ? pristine.metalness : (m.userData.originalMetalness !== undefined ? m.userData.originalMetalness : m.metalness);
                cloned.userData.originalOpacity = pristine?.opacity !== undefined ? pristine.opacity : (m.userData.originalOpacity !== undefined ? m.userData.originalOpacity : m.opacity);
                cloned.userData.originalAlphaTest = pristine?.alphaTest !== undefined ? pristine.alphaTest : (m.userData.originalAlphaTest !== undefined ? m.userData.originalAlphaTest : m.alphaTest);
                cloned.userData.originalTransparent = pristine?.transparent !== undefined ? pristine.transparent : (m.userData.originalTransparent !== undefined ? m.userData.originalTransparent : m.transparent);
                cloned.userData.originalDepthWrite = pristine?.depthWrite !== undefined ? pristine.depthWrite : (m.userData.originalDepthWrite !== undefined ? m.userData.originalDepthWrite : m.depthWrite);
                cloned.userData.originalSide = pristine?.side !== undefined ? pristine.side : (m.userData.originalSide !== undefined ? m.userData.originalSide : m.side);

                if (pristine?.normalScale && typeof pristine.normalScale.clone === 'function') {
                    cloned.userData.originalNormalScale = pristine.normalScale.clone();
                } else if (m.userData.originalNormalScale && typeof m.userData.originalNormalScale.clone === 'function') {
                    cloned.userData.originalNormalScale = m.userData.originalNormalScale.clone();
                } else if (m.normalScale && typeof m.normalScale.clone === 'function') {
                    cloned.userData.originalNormalScale = m.normalScale.clone();
                }

                if (pristine?.emissive && typeof pristine.emissive.clone === 'function') {
                    cloned.userData.originalEmissiveColor = pristine.emissive.clone();
                } else if (m.userData.originalEmissiveColor && typeof m.userData.originalEmissiveColor.clone === 'function') {
                    cloned.userData.originalEmissiveColor = m.userData.originalEmissiveColor.clone();
                } else if (m.emissive && typeof m.emissive.clone === 'function') {
                    cloned.userData.originalEmissiveColor = m.emissive.clone();
                }

                if (pristine?.color && typeof pristine.color.clone === 'function') {
                    cloned.userData.originalColor = pristine.color.clone();
                    cloned.userData.originalHex = pristine.hex;
                } else if (m.userData.originalColor && typeof m.userData.originalColor.clone === 'function') {
                    cloned.userData.originalColor = m.userData.originalColor.clone();
                    cloned.userData.originalHex = m.userData.originalHex || (cloned.userData.originalColor.isColor ? ('#' + cloned.userData.originalColor.getHexString()) : null);
                } else if (m.userData.originalColor) {
                    cloned.userData.originalColor = m.userData.originalColor;
                    cloned.userData.originalHex = m.userData.originalHex;
                } else if (m.color && typeof m.color.clone === 'function') {
                    cloned.userData.originalColor = m.color.clone();
                    cloned.userData.originalHex = '#' + m.color.getHexString();
                }

                if (scene.userData?.__pristineMaterialRegistry && pristine) {
                    scene.userData.__pristineMaterialRegistry.set(cloned.uuid, pristine);
                    scene.userData.__pristineMaterialRegistry.set(cloned.name, pristine);
                    scene.userData.__pristineMaterialRegistry.set(mesh.uuid, pristine);
                }

                if (m.userData.originalTexTransforms) {
                    cloned.userData.originalTexTransforms = JSON.parse(JSON.stringify(m.userData.originalTexTransforms));
                }
                didClone = true;
                if (meshIndexRef.current) {
                    meshIndexRef.current.set(cloned.name, [mesh]);
                }
                return cloned;
            }
            return m;
        });
        if (didClone) {
            const finalMat = Array.isArray(currentMat) ? newMats : newMats[0];
            if (mesh.userData?.__preXrayMaterial) {
                mesh.userData.__preXrayMaterial = finalMat;
            } else {
                mesh.material = finalMat;
                mesh.material.needsUpdate = true;
            }
        }
    }, [scene]);

     // Snapshot and preserve all original default textures and material properties on load
    const pristineCapturedRef = React.useRef(false);
    const lastSceneRef = React.useRef(null);
    if (lastSceneRef.current !== scene) {
        lastSceneRef.current = scene;
        pristineCapturedRef.current = false;
    }

    useEffect(() => {
        if (!scene) return;
        if (pristineCapturedRef.current) return;
        pristineCapturedRef.current = true;

        if (!scene.userData.__pristineMaterialRegistry) {
            scene.userData.__pristineMaterialRegistry = new Map();
        }
        const registry = scene.userData.__pristineMaterialRegistry;
        const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap'];
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(ensurePhysicalMaterial);
                } else {
                    child.material = ensurePhysicalMaterial(child.material);
                }
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                    if (mat && typeof mat.customProgramCacheKey !== 'function' && mat.customProgramCacheKey !== undefined) {
                        delete mat.customProgramCacheKey;
                    }
                    if (mat && typeof mat.onBeforeCompile !== 'function' && mat.onBeforeCompile !== undefined) {
                        delete mat.onBeforeCompile;
                    }
                    if (!mat.userData.origTexturesSnap) {
                        const snap = {};
                        TEX_KEYS.forEach(k => { if (mat[k]) snap[k] = mat[k]; });
                        mat.userData.origTexturesSnap = snap;
                        mat.userData.originalMap = mat.map;
                        mat.userData.originalNormalMap = mat.normalMap;
                        mat.userData.originalRoughnessMap = mat.roughnessMap;
                        mat.userData.originalMetalnessMap = mat.metalnessMap;
                        mat.userData.originalAoMap = mat.aoMap;
                        mat.userData.originalEmissiveMap = mat.emissiveMap;
                        mat.userData.originalAlphaMap = mat.alphaMap;
                        mat.userData.originalBumpMap = mat.bumpMap;
                        mat.userData.originalDisplacementMap = mat.displacementMap;
                        const isLikelyCutout = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha|logo|sticker|label|decal/i.test((child.name || '') + '_' + (mat.name || ''));
                        const hasAlphaMap = Boolean(mat.alphaMap);
                        const hasCutout = (mat.alphaTest !== undefined && mat.alphaTest > 0) || isLikelyCutout;
                        const isExplicitlyPartialOpacity = (mat.opacity !== undefined && mat.opacity < 0.999);
                        const isGLTFTransparent = Boolean(mat.transparent);

                        const isTrulyTransparent = isExplicitlyPartialOpacity || hasAlphaMap || (isGLTFTransparent && !hasCutout) || (isLikelyCutout && Boolean(mat.map));
                        mat.transparent = isTrulyTransparent;
                        mat.depthWrite = !isTrulyTransparent;

                        if (hasCutout) {
                            mat.alphaTest = (mat.alphaTest !== undefined && mat.alphaTest > 0) ? mat.alphaTest : 0.05;
                            mat.transparent = true;
                            mat.depthWrite = true;
                        }

                        if (mat.color) {
                            if ((mat.map || mat.alphaMap || (mat.alphaTest > 0) || isLikelyCutout) && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
                                mat.color.setRGB(1, 1, 1);
                            }
                            mat.userData.originalColor = mat.color.clone();
                        }
                        mat.userData.originalRoughness = mat.roughness;
                        mat.userData.originalMetalness = mat.metalness;
                        mat.userData.originalOpacity = mat.opacity;
                        if (mat.emissive && typeof mat.emissive.clone === 'function') {
                            mat.userData.originalEmissiveColor = mat.emissive.clone();
                        }
                        mat.userData.originalEmissiveIntensity = mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 0;
                        mat.userData.originalNormalScale = mat.normalScale ? mat.normalScale.clone() : new THREE.Vector2(1, 1);
                        mat.userData.originalClearcoat = mat.clearcoat !== undefined ? mat.clearcoat : 0;
                        mat.userData.originalSpecularIntensity = mat.specularIntensity !== undefined ? mat.specularIntensity : 1.0;
                        mat.userData.originalEnvMapIntensity = mat.envMapIntensity !== undefined ? mat.envMapIntensity : 1.0;
                        mat.userData.originalAlphaTest = mat.alphaTest !== undefined ? mat.alphaTest : (isLikelyCutout ? 0.5 : 0);
                        mat.userData.originalTransparent = isTrulyTransparent;
                        mat.userData.originalDepthWrite = true;
                        mat.userData.originalSide = mat.side !== undefined ? mat.side : THREE.DoubleSide;
                        mat.userData.baseMaterialName = mat.name;

                        const texProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap'];
                        const texTransforms = {};
                        texProps.forEach(prop => {
                            const t = mat[prop];
                            if (t && t.isTexture) {
                                texTransforms[prop] = {
                                    repeat: t.repeat ? t.repeat.clone() : new THREE.Vector2(1, 1),
                                    offset: t.offset ? t.offset.clone() : new THREE.Vector2(0, 0),
                                    rotation: t.rotation || 0,
                                    center: t.center ? t.center.clone() : new THREE.Vector2(0, 0),
                                    wrapS: t.wrapS,
                                    wrapT: t.wrapT
                                };
                            }
                        });
                        mat.userData.originalTexTransforms = texTransforms;

                        const pristineData = {
                            color: mat.color ? mat.color.clone() : new THREE.Color(1, 1, 1),
                            hex: '#' + (mat.color ? mat.color.getHexString() : 'ffffff'),
                            roughness: mat.roughness !== undefined ? mat.roughness : 0.5,
                            metalness: mat.metalness !== undefined ? mat.metalness : 0,
                            opacity: mat.opacity !== undefined ? mat.opacity : 1,
                            transparent: isTrulyTransparent,
                            alphaTest: mat.userData.originalAlphaTest,
                            depthWrite: true,
                            side: mat.userData.originalSide,
                            emissive: mat.emissive && typeof mat.emissive.clone === 'function' ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
                            emissiveIntensity: mat.userData.originalEmissiveIntensity,
                            normalScale: mat.normalScale ? mat.normalScale.clone() : new THREE.Vector2(1, 1),
                            clearcoat: mat.userData.originalClearcoat,
                            specularIntensity: mat.userData.originalSpecularIntensity,
                            envMapIntensity: mat.userData.originalEnvMapIntensity,
                            map: mat.map,
                            normalMap: mat.normalMap,
                            roughnessMap: mat.roughnessMap,
                            metalnessMap: mat.metalnessMap,
                            aoMap: mat.aoMap,
                            emissiveMap: mat.emissiveMap,
                            alphaMap: mat.alphaMap,
                            bumpMap: mat.bumpMap,
                            displacementMap: mat.displacementMap,
                            texTransforms: JSON.parse(JSON.stringify(texTransforms))
                        };

                        mat.userData.__pristineBaseline = pristineData;
                        mat.userData.originalHex = pristineData.hex;
                        child.userData.__pristineBaseline = pristineData;

                        const regKeys = [
                            child.uuid,
                            child.name,
                            mat.uuid,
                            mat.name,
                            mat.userData?.baseMaterialName,
                            mat.userData?.initialName
                        ].filter(Boolean);

                        regKeys.forEach(k => {
                            if (!registry.has(k)) registry.set(k, pristineData);
                        });
                    }

                    if (mat.userData.originalAlphaTest === undefined) {
                        const isLikelyCutout = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${mat.name || ''}`);
                        mat.userData.originalAlphaTest = (mat.alphaTest !== undefined && mat.alphaTest > 0) ? mat.alphaTest : (isLikelyCutout ? 0.5 : 0);
                        if (isLikelyCutout && (!mat.alphaTest || mat.alphaTest === 0)) mat.alphaTest = 0.5;
                    }
                    if (mat.userData.originalTransparent === undefined) {
                        mat.userData.originalTransparent = (mat.opacity !== undefined && mat.opacity < 0.999) || Boolean(mat.alphaMap);
                    }
                    if (mat.userData.originalDepthWrite === undefined) mat.userData.originalDepthWrite = true;
                    if (mat.userData.originalSide === undefined) mat.userData.originalSide = mat.side !== undefined ? mat.side : THREE.DoubleSide;

                    if (includeTextures === false) {
                        TEX_KEYS.forEach(k => { mat[k] = null; });
                    } else if (includeTextures === true && mat.userData.origTexturesSnap) {
                        TEX_KEYS.forEach(k => { mat[k] = mat.userData.origTexturesSnap[k]; });
                    }
                    mat.needsUpdate = true;
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    // Material Applier Hook
    useModelMaterialApplier({
        scene,
        xrayMode,
        xrayMaterials,
        materialSettings,
        customizedMaterials,
        modelName,
        selectedMaterial,
        resetKey,
        syncedSelectionSignature,
        resolveTargetMeshes,
        ensureMeshUniqueMaterial
    });

    // Expose Scene methods on Scene ref
    React.useImperativeHandle(ref, () => {
        if (!scene) return null;
        scene.deleteMaterial = (matName) => {
            const meshesToRemove = [];
            scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    let shouldDelete = false;
                    if (Array.isArray(child.material)) {
                        shouldDelete = child.material.some(m => m.name === matName);
                    } else {
                        shouldDelete = child.material.name === matName;
                    }
                    if (shouldDelete) meshesToRemove.push(child);
                }
            });
            meshesToRemove.forEach(mesh => {
                if (mesh.parent) {
                    mesh.parent.remove(mesh);
                    if (mesh.geometry) mesh.geometry.dispose();
                }
            });
        };
        scene.renameMaterial = (oldName, newName) => {
            if (!oldName || !newName) return;
            scene.traverse((child) => {
                if (child.name === oldName) {
                    child.name = newName;
                }
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        if (m.name === oldName) {
                            m.name = newName;
                        }
                    });
                }
            });
        };
        scene.scene = scene;
        return scene;
    }, [scene]);

   

    useEffect(() => {
        if (!scene) return;
        scene.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
                if (!mat) return;
                if (!mat.userData.originalMap && mat.map && mat.map.isTexture) {
                    mat.userData.originalMap = mat.map;
                }
                if (!mat.userData.originalNormalMap && mat.normalMap && mat.normalMap.isTexture) {
                    mat.userData.originalNormalMap = mat.normalMap;
                }
                if (!mat.userData.originalRoughnessMap && mat.roughnessMap && mat.roughnessMap.isTexture) {
                    mat.userData.originalRoughnessMap = mat.roughnessMap;
                }
                if (!mat.userData.originalMetalnessMap && mat.metalnessMap && mat.metalnessMap.isTexture) {
                    mat.userData.originalMetalnessMap = mat.metalnessMap;
                }
                if (!mat.userData.originalAoMap && mat.aoMap && mat.aoMap.isTexture) {
                    mat.userData.originalAoMap = mat.aoMap;
                }
                if (!mat.userData.originalAlphaMap && mat.alphaMap && mat.alphaMap.isTexture) {
                    mat.userData.originalAlphaMap = mat.alphaMap;
                }
                if (!mat.userData.originalBumpMap && mat.bumpMap && mat.bumpMap.isTexture) {
                    mat.userData.originalBumpMap = mat.bumpMap;
                }
                if (!mat.userData.originalEmissiveMap && mat.emissiveMap && mat.emissiveMap.isTexture) {
                    mat.userData.originalEmissiveMap = mat.emissiveMap;
                }
            });
        });
    }, [scene]);

  
    // 0.5 Detect Current Texture on Selection Change
    const lastTextureDetectResetKeyRef = useRef(resetKey);
    useEffect(() => {
        if (!scene) return;

        if (resetKey !== lastTextureDetectResetKeyRef.current) {
            lastTextureDetectResetKeyRef.current = resetKey;
            return;
        }

        const isFullModel = !selectedMaterial || (modelName && selectedMaterial.name === modelName) || selectedMaterial.name === "Scene";

        let foundMat = null;

        if (!isFullModel) {
            const targetParentGroup = selectedMaterial.parentGroup;
            if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") {
                onTextureIdentifiedRef.current?.(null);
                return;
            }
            if (selectedMaterial.isGroup && selectedMaterial.name !== modelName && selectedMaterial.name !== "Scene") {
                onTextureIdentifiedRef.current?.(null);
                return;
            }
        }

        foundMat = resolveTargetMaterial(selectedMaterial);

        const getTexUrl = (tex) => {
            return getTextureSource(tex) || "existing";
        };

        if (foundMat && foundMat.userData && foundMat.userData.appliedTextureId) {
            onTextureIdentifiedRef.current?.(foundMat.userData.appliedTextureId);
        } else {
            onTextureIdentifiedRef.current?.(null);
        }

        if (foundMat) {
            if (foundMat.userData && foundMat.userData.manualMaps) {
                onUpdateMaterialSettingRef.current?.('maps', foundMat.userData.manualMaps, true);
            } else {
                const nativeMaps = {};

                if (foundMat.map) nativeMaps.map = getTexUrl(foundMat.map);
                if (foundMat.normalMap) nativeMaps.normalMap = getTexUrl(foundMat.normalMap);
                if (foundMat.roughnessMap) nativeMaps.roughnessMap = getTexUrl(foundMat.roughnessMap);
                if (foundMat.metalnessMap) nativeMaps.metalnessMap = getTexUrl(foundMat.metalnessMap);
                if (foundMat.displacementMap) nativeMaps.displacementMap = getTexUrl(foundMat.displacementMap);
                if (foundMat.bumpMap) nativeMaps.bumpMap = getTexUrl(foundMat.bumpMap);
                if (foundMat.aoMap) nativeMaps.aoMap = getTexUrl(foundMat.aoMap);
                if (foundMat.alphaMap) nativeMaps.alphaMap = getTexUrl(foundMat.alphaMap);
                if (foundMat.emissiveMap) nativeMaps.emissiveMap = getTexUrl(foundMat.emissiveMap);

                const hasAny = Object.keys(nativeMaps).some(k => k !== 'envMap' && nativeMaps[k]);
                if (hasAny) {
                    onUpdateMaterialSettingRef.current?.('maps', nativeMaps, true);
                }
            }
        } else {
            onUpdateMaterialSettingRef.current?.('maps', {}, true);
        }

    }, [selectedMaterial, scene, modelName, resolveTargetMaterial, resetKey]);

    // A. Load Settings when Selection Changes
    useEffect(() => {
        if (!scene) return;
        if (xrayMode) return;

        const selMat = selectedMaterial;
        const selKey = selMat ? (selMat.uuid || selMat.meshUuid || selMat.name || '__mesh__') : '__FULL__';
        const syncSig = `${modelName || ''}_${selKey}_reset_${resetKey}_tx_${transformMode}`;
        if (syncSig === lastSyncedSigRef.current) return;
        lastSyncedSigRef.current = syncSig;

        lastMaterialResetKeyRef.current = resetKey;

        let foundMat = resolveTargetMaterial(selMat);

        if (foundMat) {
            const backup = foundMat.userData?.__xrayBackup;
            const m = {
                ...foundMat,
                color: backup?.color || foundMat.color,
                emissive: backup?.emissive || foundMat.emissive,
                emissiveIntensity: backup?.emissiveIntensity !== undefined ? backup.emissiveIntensity : foundMat.emissiveIntensity,
                roughness: backup?.roughness !== undefined ? backup.roughness : foundMat.roughness,
                metalness: backup?.metalness !== undefined ? backup.metalness : foundMat.metalness,
                opacity: backup?.opacity !== undefined ? backup.opacity : foundMat.opacity,
                userData: foundMat.userData
            };

            const batch = {};

            if (m.color && typeof m.color.getHexString === 'function') {
                batch.color = '#' + m.color.getHexString();
            }

            if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                batch.metallic = Math.round((m.metalness || 0) * 100);
                batch.roughness = Math.round((m.roughness || 0) * 100);
            } else if (m.isMeshPhongMaterial) {
                batch.metallic = Math.round((m.shininess || 0) / 100 * 100);
                batch.roughness = 0;
            }

            if (m.opacity !== undefined) {
                batch.alpha = Math.round(m.opacity * 100);
            }

            batch.colorIntensity = 100;
            if (m.emissiveIntensity !== undefined) {
                batch.emissiveIntensity = Math.round(m.emissiveIntensity * 100);
            }
            if (m.emissive && typeof m.emissive.getHexString === 'function') {
                batch.emissiveColor = '#' + m.emissive.getHexString();
            }

            if (m.normalMap && m.normalScale) {
                batch.normal = Math.round(m.normalScale.x * 100);
            }

            if (m.displacementMap && m.displacementScale !== undefined) {
                batch.bump = Math.round(m.displacementScale * 100);
            } else if (m.bumpMap && m.bumpScale !== undefined) {
                batch.bump = Math.round(m.bumpScale / 10 * 100);
            }

            if (!transformMode) {
                const tex = m.map || m.normalMap || m.roughnessMap;
                if (tex) {
                    if (m.userData.__textureScale !== undefined) {
                        batch.scale = m.userData.__textureScale;
                    } else if (tex.repeat && (tex.repeat.x !== 1 || tex.repeat.y !== 1)) {
                        batch.scale = Math.round(100 / (tex.repeat.x || 1));
                    }
                    if (tex.rotation !== undefined && tex.rotation !== 0) {
                        batch.rotation = Math.round(tex.rotation * (180 / Math.PI));
                    }
                    if (tex.offset && (tex.offset.x !== 0 || tex.offset.y !== 0)) {
                        batch.offset = { x: tex.offset.x * 100, y: tex.offset.y * 100 };
                    }
                }
            }

            if (m.userData.appliedTexture) {
                batch.appliedTexture = m.userData.appliedTexture;
            }

            // If customizedMaterials has an entry for this selection, ensure batch matches customized state
            const curCM = customizedMaterialsRef.current;
            if (curCM) {
                const lookupKeys = [
                    selMat?.uuid, selMat?.meshUuid, selMat?.name,
                    foundMat.uuid, foundMat.name, foundMat.userData?.baseMaterialName
                ].filter(Boolean);
                let customEntry = null;
                for (const k of lookupKeys) {
                    if (curCM[k]) {
                        customEntry = curCM[k];
                        break;
                    }
                }
                if (!customEntry && curCM['__ALL__']) {
                    customEntry = curCM['__ALL__'];
                }
                if (customEntry) {
                    if (customEntry.color) batch.color = customEntry.color;
                    if (customEntry.colorIntensity !== undefined) batch.colorIntensity = customEntry.colorIntensity;
                    if (customEntry.metallic !== undefined) batch.metallic = customEntry.metallic;
                    if (customEntry.roughness !== undefined) batch.roughness = customEntry.roughness;
                    if (customEntry.alpha !== undefined) batch.alpha = customEntry.alpha;
                    if (customEntry.normal !== undefined) batch.normal = customEntry.normal;
                    if (customEntry.bump !== undefined) batch.bump = customEntry.bump;
                    if (customEntry.scale !== undefined) batch.scale = customEntry.scale;
                    if (customEntry.rotation !== undefined) batch.rotation = customEntry.rotation;
                    if (customEntry.offset !== undefined) batch.offset = customEntry.offset;
                    if (customEntry.appliedTexture) batch.appliedTexture = customEntry.appliedTexture;
                }
            }

            if (onUpdateMaterialSettingRef.current && Object.keys(batch).length > 0) {
                onUpdateMaterialSettingRef.current(batch, true);
            }
        }

        const sig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
        setSyncedSelectionSignature(sig);

    }, [selectedMaterial, scene, modelName, resolveTargetMaterial, transformMode, resetKey]);

    // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
    useLayoutEffect(() => {
        if (!scene) return;

        scene.position.set(0, 0, 0);
        scene.scale.set(1, 1, 1);
        scene.rotation.set(0, 0, 0);
        scene.updateMatrixWorld(true);

        let box = new THREE.Box3();

        scene.traverse((child) => {
            if (child.isSkinnedMesh) {
                try {
                    child.computeBoundingBox();
                    if (child.boundingBox) {
                        const skinnedBox = child.boundingBox.clone().applyMatrix4(child.matrixWorld);
                        if (!skinnedBox.isEmpty() && isFinite(skinnedBox.min.x)) {
                            box.union(skinnedBox);
                            return;
                        }
                    }
                } catch (_) { }
            }
            if (child.isMesh && child.geometry) {
                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                if (child.geometry.boundingBox) {
                    const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
                    if (!geomBox.isEmpty() && isFinite(geomBox.min.x)) {
                        box.union(geomBox);
                    }
                }
            }
        });

        if (box.isEmpty()) {
            try {
                box.setFromObject(scene);
            } catch (e) {
                console.warn("[GenericModel] Bounding box computation notice:", e);
            }
        }

        if (box.isEmpty() || !isFinite(box.min.x)) {
            box.min.set(-1, -1, -1);
            box.max.set(1, 1, 1);
        }

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const TARGET_SIZE = 4.2;
        let targetScale = maxDim > 0 ? (TARGET_SIZE / maxDim) : 1;

        // Offset the inner scene so its geometric center is at X=0, Z=0 and its bottom sits on the ground floor Y=0.
        // This guarantees the parent modelGroup's origin (0, 0, 0) matches the model's visual center pivot.
        scene.position.set(-center.x, -box.min.y, -center.z);
        scene.scale.set(1, 1, 1);
        scene.updateMatrixWorld(true);

        setScale(targetScale);
        setPosition([0, 0, 0]);

        scene.userData.normalization = {
            position: [-center.x, -box.min.y, -center.z],
            scale: targetScale,
            centerOffset: { x: center.x, y: box.min.y, z: center.z }
        };
        if (modelId) {
            scene.userData.modelId = modelId;
        }
        if (modelGroup) {
            modelGroup.userData.originalTransform = {
                position: new THREE.Vector3(0, 0, 0),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(targetScale, targetScale, targetScale)
            };
        }

        let vertCount = 0;
        let polyCount = 0;
        const processedMaterials = new Map();
        const usedNames = new Set();
        let unnamedCount = 1;

        const groupMap = new Map();
        const ungroupedMats = new Set();
        const meshIndex = new Map();

        scene.traverse((child) => {
            if (child.isMesh || child.isSkinnedMesh) {
                if (!child.userData.originalTransform) {
                    child.userData.originalTransform = {
                        position: child.position.clone(),
                        rotation: child.rotation.clone(),
                        scale: child.scale.clone()
                    };
                }
                if (child.geometry) {
                    if (!child.geometry.boundingSphere) {
                        child.geometry.computeBoundingSphere();
                    }
                    child.frustumCulled = !child.isSkinnedMesh;
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(ensurePhysicalMaterial);
                    } else {
                        child.material = ensurePhysicalMaterial(child.material);
                    }
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        const name = m.name || m.uuid;
                        if (!meshIndex.has(name)) meshIndex.set(name, []);
                        meshIndex.get(name).push(child);
                    });
                }
                if (child.uuid) {
                    if (!meshIndex.has(child.uuid)) meshIndex.set(child.uuid, []);
                    meshIndex.get(child.uuid).push(child);
                }
                if (child.name) {
                    if (!meshIndex.has(child.name)) meshIndex.set(child.name, []);
                    meshIndex.get(child.name).push(child);
                }

                child.castShadow = true;
                child.receiveShadow = true;

                const geom = child.geometry;
                if (geom) {
                    const newGeom = child.geometry;
                    if (!newGeom.attributes.normal) {
                        newGeom.computeVertexNormals();
                    }

                    if (!newGeom.attributes.uv) {
                        applyBoxUV(child);
                    }

                    safeComputeTangents(newGeom);

                    if (newGeom.attributes.normal) newGeom.attributes.normal.needsUpdate = true;

                    vertCount += newGeom.attributes.position.count;
                    if (newGeom.index) {
                        polyCount += newGeom.index.count / 3;
                    } else {
                        polyCount += newGeom.attributes.position.count / 3;
                    }
                }

                if (child.material) {
                    let groupName = null;
                    if (child.parent && child.parent.isGroup && child.parent.name && child.parent.name !== 'Scene') {
                        groupName = child.parent.name;
                    }

                    const processMat = (m) => {
                        let uniqueName = processedMaterials.get(m.uuid);

                        if (!uniqueName) {
                            let name = m.name;
                            if (!name || name.trim() === '') {
                                const suffix = String(unnamedCount++).padStart(2, '0');
                                name = `Material_${suffix}`;
                            }

                            name = name.replace(/[:|]/g, " ").trim();

                            uniqueName = name;
                            let conflictCount = 1;
                            while (usedNames.has(uniqueName)) {
                                uniqueName = `${name}_${String(conflictCount++).padStart(2, '0')}`;
                            }

                            m.name = uniqueName;
                            processedMaterials.set(m.uuid, uniqueName);
                            usedNames.add(uniqueName);

                            const isLikelyCutoutM = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha|logo|sticker|label|decal/i.test((child.name || '') + '_' + (m.name || ''));
                            const hasAlphaMapM = Boolean(m.alphaMap);
                            const hasCutoutM = (m.alphaTest !== undefined && m.alphaTest > 0) || isLikelyCutoutM;
                            const isExplicitlyPartialOpacityM = (m.opacity !== undefined && m.opacity < 0.999);
                            const isGLTFTransparentM = Boolean(m.transparent);
                            const isTrulyTransparentM = isExplicitlyPartialOpacityM || hasAlphaMapM || (isGLTFTransparentM && !hasCutoutM) || (isLikelyCutoutM && Boolean(m.map));

                            m.transparent = isTrulyTransparentM;
                            m.depthWrite = !isTrulyTransparentM;

                            if (hasCutoutM) {
                                m.alphaTest = (m.alphaTest !== undefined && m.alphaTest > 0) ? m.alphaTest : 0.05;
                                m.transparent = true;
                                m.depthWrite = true;
                            }

                            if (m.userData.originalAlphaTest === undefined) {
                                m.userData.originalAlphaTest = m.alphaTest || 0;
                            }
                            if (m.userData.originalTransparent === undefined) m.userData.originalTransparent = isTrulyTransparentM;
                            if (m.userData.originalDepthWrite === undefined) m.userData.originalDepthWrite = true;
                            if (m.userData.originalSide === undefined) m.userData.originalSide = m.side !== undefined ? m.side : THREE.DoubleSide;

                            m.side = THREE.DoubleSide;
                            m.depthWrite = true;

                            if (!m.userData.originalColor && m.color) {
                                if ((m.map || m.alphaMap || (m.alphaTest > 0) || isLikelyCutoutM) && m.color.r < 0.05 && m.color.g < 0.05 && m.color.b < 0.05) {
                                    m.color.setRGB(1, 1, 1);
                                }
                                m.userData.originalColor = m.color.clone();
                            }
                            if (m.userData.originalOpacity === undefined) m.userData.originalOpacity = m.opacity;
                            if (m.userData.originalRoughness === undefined) m.userData.originalRoughness = m.roughness;
                            if (m.userData.originalMetalness === undefined) m.userData.originalMetalness = m.metalness;
                            if (m.userData.originalClearcoat === undefined) m.userData.originalClearcoat = m.clearcoat !== undefined ? m.clearcoat : 0;
                            if (m.userData.originalSpecularIntensity === undefined) m.userData.originalSpecularIntensity = m.specularIntensity !== undefined ? m.specularIntensity : 1.0;
                            if (m.userData.originalEnvMapIntensity === undefined) m.userData.originalEnvMapIntensity = m.envMapIntensity !== undefined ? m.envMapIntensity : 1.0;
                            if (m.map && !m.userData.originalMap) m.userData.originalMap = m.map;
                            if (m.normalMap && !m.userData.originalNormalMap) m.userData.originalNormalMap = m.normalMap;
                            if (m.roughnessMap && !m.userData.originalRoughnessMap) m.userData.originalRoughnessMap = m.roughnessMap;
                            if (m.metalnessMap && !m.userData.originalMetalnessMap) m.userData.originalMetalnessMap = m.metalnessMap;
                            if (m.aoMap && !m.userData.originalAoMap) m.userData.originalAoMap = m.aoMap;
                            if (m.alphaMap && !m.userData.originalAlphaMap) m.userData.originalAlphaMap = m.alphaMap;
                            if (!m.userData.baseMaterialName && m.name) m.userData.baseMaterialName = m.name;
                            if (!m.userData.originalTexTransforms) {
                                const texProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'displacementMap'];
                                const texTransforms = {};
                                texProps.forEach(prop => {
                                    const t = m[prop];
                                    if (t && t.isTexture) {
                                        texTransforms[prop] = {
                                            repeat: t.repeat ? t.repeat.clone() : new THREE.Vector2(1, 1),
                                            offset: t.offset ? t.offset.clone() : new THREE.Vector2(0, 0),
                                            rotation: t.rotation || 0,
                                            center: t.center ? t.center.clone() : new THREE.Vector2(0, 0),
                                            wrapS: t.wrapS,
                                            wrapT: t.wrapT
                                        };
                                    }
                                });
                                m.userData.originalTexTransforms = texTransforms;
                            }
                        }

                        if (groupName) {
                            if (!groupMap.has(groupName)) groupMap.set(groupName, new Set());
                            groupMap.get(groupName).add(uniqueName);
                        } else {
                            ungroupedMats.add(uniqueName);
                        }
                    };

                    if (Array.isArray(child.material)) {
                        child.material.forEach(processMat);
                    } else {
                        processMat(child.material);
                    }
                }
            }
        });

        meshIndexRef.current = meshIndex;

        const allGroupedMaterialNames = new Set();
        groupMap.forEach((matSet) => {
            matSet.forEach(name => allGroupedMaterialNames.add(name));
        });

        for (const name of ungroupedMats) {
            if (allGroupedMaterialNames.has(name)) {
                ungroupedMats.delete(name);
            }
        }

        const buildHierarchyNode = (obj) => {
            if (!obj) return null;
            if (
                obj.isLight ||
                obj.isCamera ||
                obj.isHelper ||
                obj.name?.toLowerCase().includes("transformcontrols") ||
                obj.name?.toLowerCase().includes("gizmo")
            ) {
                return null;
            }

            const isMesh = obj.isMesh || obj.isSkinnedMesh || obj.isLine || obj.isPoints;
            const childNodes = [];

            if (obj.children && obj.children.length > 0) {
                for (const child of obj.children) {
                    const childTree = buildHierarchyNode(child);
                    if (childTree) {
                        if (Array.isArray(childTree)) childNodes.push(...childTree);
                        else childNodes.push(childTree);
                    }
                }
            }

            if (isMesh) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                const matNames = mats.map((m, idx) => {
                    if (!m) return null;
                    if (!m.name) m.name = `Material_${idx + 1}`;
                    return m.name;
                }).filter(Boolean);
                const primaryMat = matNames[0] || "Default";
                const meshName = (obj.name && obj.name !== "Scene") ? obj.name : primaryMat;

                return {
                    id: obj.uuid,
                    name: meshName,
                    isMesh: true,
                    isGroup: false,
                    material: primaryMat,
                    materials: matNames,
                    meshUuid: obj.uuid,
                    children: childNodes
                };
            }

            if (childNodes.length > 0) {
                const allDescendantMaterials = new Set();
                const collectDescendantMats = (nodeItem) => {
                    if (nodeItem.materials) nodeItem.materials.forEach((m) => allDescendantMaterials.add(m));
                    if (nodeItem.children) nodeItem.children.forEach(collectDescendantMats);
                };
                childNodes.forEach(collectDescendantMats);

                const groupName = (obj.name && obj.name !== "Scene") ? obj.name : "Group";

                return {
                    id: obj.uuid,
                    name: groupName,
                    isMesh: false,
                    isGroup: true,
                    materials: Array.from(allDescendantMaterials),
                    children: childNodes
                };
            }

            return null;
        };

        const simplifyHierarchy = (nodes) => {
            if (!Array.isArray(nodes)) return [];

            const isGenericWrapper = (name) => /^(rootnode|root|scene|object3d|sketchfab_model|model|group_\d+|null)$/i.test((name || "").trim());

            const cleanNode = (n) => {
                if (!n) return null;
                if (n.isMesh) return n;

                let cleanChildren = [];
                if (n.children && n.children.length > 0) {
                    n.children.forEach((c) => {
                        const cleaned = cleanNode(c);
                        if (cleaned) {
                            if (Array.isArray(cleaned)) cleanChildren.push(...cleaned);
                            else cleanChildren.push(cleaned);
                        }
                    });
                }

                if (cleanChildren.length === 0) return null;

                let currentNodeName = n.name;
                while (cleanChildren.length === 1 && cleanChildren[0].isGroup) {
                    const onlyChild = cleanChildren[0];
                    if (!isGenericWrapper(currentNodeName) && isGenericWrapper(onlyChild.name)) {
                        onlyChild.name = currentNodeName;
                    }
                    cleanChildren = onlyChild.children || [];
                }

                if (isGenericWrapper(currentNodeName) && cleanChildren.length === 1) {
                    return cleanChildren[0];
                }

                return {
                    ...n,
                    name: currentNodeName,
                    children: cleanChildren
                };
            };

            const result = [];
            nodes.forEach((n) => {
                const cleaned = cleanNode(n);
                if (cleaned) {
                    if (Array.isArray(cleaned)) result.push(...cleaned);
                    else result.push(cleaned);
                }
            });
            return result;
        };

        const rawHierarchy = [];
        if (scene.children && scene.children.length > 0) {
            for (const rootChild of scene.children) {
                const node = buildHierarchyNode(rootChild);
                if (node) {
                    if (Array.isArray(node)) rawHierarchy.push(...node);
                    else rawHierarchy.push(node);
                }
            }
        }

        const fullHierarchy = simplifyHierarchy(rawHierarchy);

        const materialDataMap = {};
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m, mIdx) => {
                    if (!m) return;
                    if (!m.name) m.name = `Material_${mIdx + 1}`;

                    [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.bumpMap, m.displacementMap, m.alphaMap, m.emissiveMap].forEach(t => {
                        if (t && t !== m.aoMap && t !== m.lightMap) {
                            t.wrapS = THREE.RepeatWrapping;
                            t.wrapT = THREE.RepeatWrapping;
                        }
                    });

                    if (!m.userData.originalMap && m.map) m.userData.originalMap = m.map;
                    if (!m.userData.originalNormalMap && m.normalMap) m.userData.originalNormalMap = m.normalMap;
                    if (!m.userData.originalAlphaMap && m.alphaMap) m.userData.originalAlphaMap = m.alphaMap;

                    const extractTexture = (tex) => getTextureSource(tex);
                    const nativeMaps = {};
                    const baseSrc = extractTexture(m.map);
                    if (baseSrc) nativeMaps.map = baseSrc;
                    const normSrc = extractTexture(m.normalMap);
                    if (normSrc) nativeMaps.normalMap = normSrc;
                    const roughSrc = extractTexture(m.roughnessMap);
                    if (roughSrc) nativeMaps.roughnessMap = roughSrc;
                    const metalSrc = extractTexture(m.metalnessMap);
                    if (metalSrc) nativeMaps.metalnessMap = metalSrc;
                    const emissiveSrc = extractTexture(m.emissiveMap);
                    if (emissiveSrc) nativeMaps.emissiveMap = emissiveSrc;
                    const aoSrc = extractTexture(m.aoMap);
                    if (aoSrc) nativeMaps.aoMap = aoSrc;
                    const bumpSrc = extractTexture(m.bumpMap);
                    if (bumpSrc) nativeMaps.bumpMap = bumpSrc;
                    const dispSrc = extractTexture(m.displacementMap);
                    if (dispSrc) nativeMaps.displacementMap = dispSrc;
                    const alphaSrc = extractTexture(m.alphaMap);
                    if (alphaSrc) nativeMaps.alphaMap = alphaSrc;

                    const data = {
                        color: '#' + (m.color ? m.color.getHexString() : 'ffffff'),
                        metallic: m.metalness !== undefined ? m.metalness * 100 : 0,
                        roughness: m.roughness !== undefined ? m.roughness * 100 : 50,
                        opacity: m.opacity !== undefined ? m.opacity * 100 : 100,
                        alpha: m.opacity !== undefined ? m.opacity * 100 : 100,
                        scale: m.map && m.map.repeat ? Math.round(100 / (m.map.repeat.x || 1)) : 100,
                        maps: nativeMaps
                    };

                    const targetKeys = [
                        m.name,
                        m.uuid,
                        m.userData?.baseMaterialName,
                        m.userData?.initialName,
                        child.name,
                        child.uuid,
                        child.userData?.meshUuid,
                        child.userData?.initialUuid,
                        child.userData?.initialName
                    ].filter(Boolean);

                    targetKeys.forEach(k => {
                        if (!materialDataMap[k]) {
                            materialDataMap[k] = data;
                        }
                    });
                });
            }
        });

        if (fullHierarchy.length > 0) {
            if (typeof setMaterialList === 'function') setMaterialList(fullHierarchy, materialDataMap);
        } else {
            if (typeof setMaterialList === 'function') setMaterialList(Array.from(ungroupedMats).sort(), materialDataMap);
        }

        if (typeof setModelStats === 'function') {
            setModelStats({
                vertexCount: vertCount.toLocaleString(),
                polygonCount: Math.round(polyCount).toLocaleString(),
                materialCount: processedMaterials.size,
                dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
            });
        }

        if (typeof onModelReady === 'function') {
            const boundsPayload = {
                box: box.clone(),
                size: size.clone(),
                center: center.clone(),
                targetScale,
                maxDim: maxDim * targetScale,
                height: size.y * targetScale,
                width: size.x * targetScale,
                depth: size.z * targetScale
            };
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    onModelReady(boundsPayload);
                });
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    // 2. Wireframe Update Effect
    useLayoutEffect(() => {
        if (!scene) return;
        meshIndexRef.current.forEach(meshes => {
            meshes.forEach(child => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        m.wireframe = !!wireframe;
                    });
                }
            });
        });
    }, [scene, wireframe]);

    const lastMaterialResetKeyRef = React.useRef(resetKey);

    // Visibility & Deletion
    useEffect(() => {
        if (!scene) return;

        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                const childMatNames = Array.isArray(child.material)
                    ? child.material.map(m => m?.name).filter(Boolean)
                    : [child.material?.name].filter(Boolean);

                const isDeleted = deletedMaterials && (
                    (child.uuid && deletedMaterials.has(child.uuid)) ||
                    childMatNames.some(mName => deletedMaterials.has(mName))
                );

                if (isDeleted) {
                    child.visible = false;
                    child.raycast = () => { };
                    return;
                }

                delete child.raycast;

                let isHidden = false;
                if (hiddenMaterials) {
                    isHidden = (child.uuid && hiddenMaterials.has(child.uuid)) ||
                        (child.name && hiddenMaterials.has(child.name)) ||
                        childMatNames.some(mName => hiddenMaterials.has(mName));
                }
                child.visible = !isHidden;
            }
        });
    }, [scene, hiddenMaterials, deletedMaterials]);

    // Selective X-Ray View Mode
    useEffect(() => {
        if (!scene) return;

        const xrayColor = new THREE.Color('#5ec4e0');
        const xrayEmissive = new THREE.Color('#3a8fb0');
        const xrayRoughness = 0.42;
        const xrayMetalness = 0;
        const xrayOpacity = 0.42;

        const xrayOnBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <emissivemap_fragment>',
                `
        #include <emissivemap_fragment>
        #ifdef USE_EMISSIVE
          vec3 xrayV = normalize( - vViewPosition );
          float xrayRim = pow( clamp( 1.0 - abs( dot( xrayV, normal ) ), 0.0, 1.0 ), 2.8 );
          totalEmissiveRadiance = emissive * ( 0.40 + xrayRim * 0.60 );
        #endif
        `
            );
        };

        scene.traverse((child) => {
            if ((child.isMesh || child.isSkinnedMesh) && child.material) {
                const childMatNames = Array.isArray(child.material)
                    ? child.material.map(m => m?.name).filter(Boolean)
                    : [child.material?.name].filter(Boolean);

                let isXrayMesh = false;
                if (xrayMode) {
                    isXrayMesh = true;
                } else if (xrayMaterials && xrayMaterials.size > 0) {
                    isXrayMesh = (child.uuid && xrayMaterials.has(child.uuid)) ||
                        (child.name && xrayMaterials.has(child.name)) ||
                        childMatNames.some(mName => xrayMaterials.has(mName));
                }

                // Also check if applied texture is X-Ray preset
                if (!isXrayMesh) {
                    const lookupKeys = [
                        child.uuid,
                        child.userData?.meshUuid,
                        child.userData?.initialUuid,
                        child.name,
                        child.userData?.initialName,
                        ...childMatNames
                    ].filter(Boolean);

                    let customSetting = null;
                    if (customizedMaterials) {
                        for (const k of lookupKeys) {
                            if (customizedMaterials[k]) {
                                customSetting = customizedMaterials[k];
                                break;
                            }
                        }
                        if (!customSetting && customizedMaterials['__ALL__']) {
                            const allEntry = customizedMaterials['__ALL__'];
                            const allowList = Array.isArray(allEntry.__meshes__) ? allEntry.__meshes__ : null;
                            if (!allowList) {
                                customSetting = allEntry;
                            } else {
                                const inList = lookupKeys.some(k => allowList.includes(k));
                                if (inList) customSetting = allEntry;
                            }
                        }
                    }

                    if (customSetting?.appliedTexture?.isXray) {
                        isXrayMesh = true;
                    } else if (materialSettings?.appliedTexture?.isXray) {
                        const selMat = selectedMaterial;
                        const isExplicitAll = Boolean(selMat && (selMat.isAll || selMat.name === 'All Meshes'));
                        if (isExplicitAll) {
                            isXrayMesh = true;
                        } else if (selMat) {
                            const targetMeshes = resolveTargetMeshes(selMat);
                            if (targetMeshes && targetMeshes.includes(child)) {
                                isXrayMesh = true;
                            }
                        }
                    }
                }

                if (isXrayMesh && !xrayMode && (!xrayMaterials || xrayMaterials.size === 0)) {
                    ensureMeshUniqueMaterial(child);
                }

                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    if (!m) return;

                    if (isXrayMesh) {
                        if (!m.userData.__xrayBackup) {
                            m.userData.__xrayBackup = {
                                color: m.color ? m.color.clone() : new THREE.Color('#ffffff'),
                                emissive: m.emissive ? m.emissive.clone() : new THREE.Color('#000000'),
                                emissiveIntensity: m.emissiveIntensity !== undefined ? m.emissiveIntensity : 0,
                                roughness: m.roughness !== undefined ? m.roughness : 0.5,
                                metalness: m.metalness !== undefined ? m.metalness : 0,
                                opacity: m.opacity !== undefined ? m.opacity : 1.0,
                                transparent: m.transparent !== undefined ? m.transparent : false,
                                depthWrite: m.depthWrite !== undefined ? m.depthWrite : true,
                                side: m.side !== undefined ? m.side : THREE.FrontSide,
                                map: m.map || null,
                                roughnessMap: m.roughnessMap || null,
                                metalnessMap: m.metalnessMap || null,
                                onBeforeCompile: m.onBeforeCompile || null,
                                customProgramCacheKey: m.customProgramCacheKey || null
                            };
                        }

                        if (m.color) m.color.copy(xrayColor);
                        if (m.emissive) m.emissive.copy(xrayEmissive);
                        m.emissiveIntensity = 1.0;
                        m.roughness = xrayRoughness;
                        m.metalness = xrayMetalness;
                        m.opacity = xrayOpacity;
                        m.transparent = true;
                        m.depthWrite = true;
                        m.side = THREE.DoubleSide;
                        m.map = null;
                        m.roughnessMap = null;
                        m.metalnessMap = null;
                        m.onBeforeCompile = xrayOnBeforeCompile;
                        m.customProgramCacheKey = () => 'xray_fresnel_v1';
                        m.needsUpdate = true;
                    } else if (m.userData.__xrayBackup) {
                        const backup = m.userData.__xrayBackup;
                        if (m.color && backup.color) m.color.copy(backup.color);
                        if (m.emissive && backup.emissive) m.emissive.copy(backup.emissive);
                        m.emissiveIntensity = backup.emissiveIntensity;
                        m.roughness = backup.roughness;
                        m.metalness = backup.metalness;
                        m.opacity = backup.opacity;
                        m.transparent = backup.transparent;
                        m.depthWrite = backup.depthWrite;
                        m.side = backup.side;
                        m.map = backup.map;
                        m.roughnessMap = backup.roughnessMap;
                        m.metalnessMap = backup.metalnessMap;
                        m.onBeforeCompile = typeof backup.onBeforeCompile === 'function' ? backup.onBeforeCompile : null;
                        if (typeof backup.customProgramCacheKey === 'function') {
                            m.customProgramCacheKey = backup.customProgramCacheKey;
                        } else {
                            delete m.customProgramCacheKey;
                        }
                        m.needsUpdate = true;
                        delete m.userData.__xrayBackup;
                    }
                });
            }
        });

        return () => {
            if (scene) {
                scene.traverse((child) => {
                    if ((child.isMesh || child.isSkinnedMesh) && child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach((m) => {
                            if (m?.userData?.__xrayBackup) {
                                const backup = m.userData.__xrayBackup;
                                if (m.color && backup.color) m.color.copy(backup.color);
                                if (m.emissive && backup.emissive) m.emissive.copy(backup.emissive);
                                m.emissiveIntensity = backup.emissiveIntensity;
                                m.roughness = backup.roughness;
                                m.metalness = backup.metalness;
                                m.opacity = backup.opacity;
                                m.transparent = backup.transparent;
                                m.depthWrite = backup.depthWrite;
                                m.side = backup.side;
                                m.map = backup.map;
                                m.roughnessMap = backup.roughnessMap;
                                m.metalnessMap = backup.metalnessMap;
                                m.onBeforeCompile = typeof backup.onBeforeCompile === 'function' ? backup.onBeforeCompile : null;
                                if (typeof backup.customProgramCacheKey === 'function') {
                                    m.customProgramCacheKey = backup.customProgramCacheKey;
                                } else {
                                    delete m.customProgramCacheKey;
                                }
                                m.needsUpdate = true;
                                delete m.userData.__xrayBackup;
                            }
                        });
                    }
                });
            }
        };
    }, [scene, xrayMode, xrayMaterials, materialSettings?.appliedTexture, customizedMaterials, selectedMaterial, modelName]);

    const prevTransformTargetRef = React.useRef(null);
    const lastTransformResetKeyRef = React.useRef(transformResetKey || resetKey);

    // Initial Transforms Capture
    useEffect(() => {
        if (!scene) return;

        const capture = (obj) => {
            if (!obj.userData.originalTransform) {
                obj.userData.originalTransform = {
                    position: obj.position.clone(),
                    rotation: obj.rotation.clone(),
                    scale: obj.scale.clone()
                };
            }
        };

        capture(scene);
        scene.traverse(capture);
    }, [scene]);

    // Sync meshTransforms from Undo / Redo or History Restore
    useEffect(() => {
        if (!scene) return;
        if (isGizmoDraggingRef.current) return;

        scene.traverse(obj => {
            if (!obj.isMesh && !obj.isSkinnedMesh) return;
            const matName = (obj.material && !Array.isArray(obj.material) && obj.material.name) ? obj.material.name : null;
            const saved = meshTransforms ? (
                meshTransforms[obj.uuid] ||
                (obj.name ? meshTransforms[obj.name] : null) ||
                (obj.userData?.meshUuid ? meshTransforms[obj.userData.meshUuid] : null) ||
                (matName ? meshTransforms[matName] : null) ||
                (Array.isArray(obj.material) ? obj.material.map(m => m?.name).find(n => n && meshTransforms[n]) : null)
            ) : null;
            if (saved) {
                if (saved.position) obj.position.set(saved.position.x, saved.position.y, saved.position.z);
                if (saved.rotation) obj.rotation.set(saved.rotation.x, saved.rotation.y, saved.rotation.z);
                if (saved.scale) obj.scale.set(saved.scale.x, saved.scale.y, saved.scale.z);
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            } else if (obj.userData?.originalTransform) {
                const orig = obj.userData.originalTransform;
                obj.position.copy(orig.position);
                obj.rotation.copy(orig.rotation);
                obj.scale.copy(orig.scale);
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            } else if (obj.userData?.__bindPos) {
                obj.position.set(obj.userData.__bindPos[0], obj.userData.__bindPos[1], obj.userData.__bindPos[2]);
                if (obj.userData.__bindQuat) obj.quaternion.set(obj.userData.__bindQuat[0], obj.userData.__bindQuat[1], obj.userData.__bindQuat[2], obj.userData.__bindQuat[3]);
                if (obj.userData.__bindScale) obj.scale.set(obj.userData.__bindScale[0], obj.userData.__bindScale[1], obj.userData.__bindScale[2]);
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            }
        });

        scene.updateMatrixWorld(true);

        if (transformTarget && transformTarget !== modelGroup) {
            updatePivotToTarget(transformTarget, relatedMeshesRef.current);
        }
    }, [meshTransforms, transformResetKey, resetKey, scene, transformTarget, modelGroup, updatePivotToTarget, selectedMaterial]);

    // Determine Transform Target & Pivot
    useEffect(() => {
        if (!scene) return;

        // If nothing is selected, do not show any gizmo controls on this model
        if (!selectedMaterial) {
            setTransformTarget(null);
            relatedMeshesRef.current = [];
            followerOffsetsRef.current.clear();
            return;
        }

        const targetName = typeof selectedMaterial === 'string' ? selectedMaterial : selectedMaterial.name;
        const parentGroup = typeof selectedMaterial === 'object' ? selectedMaterial.parentGroup : null;
        const selectedId = typeof selectedMaterial === 'object' ? (selectedMaterial.id || selectedMaterial.modelId) : null;
        const isGroup = typeof selectedMaterial === 'object' ? selectedMaterial.isGroup : false;
        const isAll = typeof selectedMaterial === 'object' ? selectedMaterial.isAll : false;
        const isModel = typeof selectedMaterial === 'object' ? selectedMaterial.isModel : false;

        // Check if the selection belongs to this specific model instance
        const isSelectedThisModel =
            isAll ||
            selectedMaterial.isAll ||
            parentGroup === 'All Models' ||
            targetName === 'All Models' ||
            (selectedId && (selectedId === modelId || selectedId === scene?.userData?.modelId)) ||
            (parentGroup && (parentGroup === modelName || parentGroup === scene?.name)) ||
            (selectedMaterial && (selectedMaterial.name === modelName || targetName === modelName));

        if (!isSelectedThisModel) {
            setTransformTarget(null);
            relatedMeshesRef.current = [];
            followerOffsetsRef.current.clear();
            return;
        }

        // If selecting the entire model
        const isModelLevel = isModel || isAll || !selectedMaterial.isMesh;

        if (isModelLevel) {
            relatedMeshesRef.current = [];
            followerOffsetsRef.current.clear();
            setTransformTarget(modelGroup || null);
            return;
        }

        // Check if selecting a specific mesh/material within this model
        const targetedMeshes = resolveTargetMeshes(selectedMaterial);

        if (targetedMeshes && targetedMeshes.length > 0) {
            const leader = targetedMeshes[0];
            setTransformTarget(leader);
            relatedMeshesRef.current = targetedMeshes;
            updatePivotToTarget(leader, targetedMeshes);

            if (targetedMeshes.length > 1) {
                leader.updateMatrixWorld(true);
                const leaderWorldInverse = new THREE.Matrix4().copy(leader.matrixWorld).invert();

                const offsets = new Map();
                targetedMeshes.forEach(mesh => {
                    if (mesh === leader) return;
                    mesh.updateMatrixWorld(true);
                    const relativeMatrix = new THREE.Matrix4().multiplyMatrices(leaderWorldInverse, mesh.matrixWorld);
                    offsets.set(mesh.uuid, relativeMatrix);
                });
                followerOffsetsRef.current = offsets;
            } else {
                followerOffsetsRef.current.clear();
            }
            return;
        }

        setTransformTarget(null);
        relatedMeshesRef.current = [];
        followerOffsetsRef.current.clear();
    }, [scene, selectedMaterial, transformMode, modelName, onTransformChange, modelGroup, updatePivotToTarget, resolveTargetMeshes]);

    // Sync transformValues to active target
    useEffect(() => {
        const activeKey = transformResetKey || resetKey;
        const isResetOrUndo = activeKey !== lastTransformResetKeyRef.current;
        lastTransformResetKeyRef.current = activeKey;

        if (!transformTarget) {
            prevTransformTargetRef.current = null;
            return;
        }

        if (!transformValues || !transformValues.position || !transformValues.rotation || !transformValues.scale) return;

        const targetName = selectedMaterial ? selectedMaterial.name : (modelName || "Scene");
        const isTargetValid = (() => {
            if (!selectedMaterial || targetName === modelName || targetName === "Scene") {
                return transformTarget === modelGroup || transformTarget === scene;
            }
            if (selectedMaterial.uuid && transformTarget.uuid === selectedMaterial.uuid) {
                return true;
            }
            if (selectedMaterial.isGroup && Array.isArray(selectedMaterial.materials)) {
                const m = transformTarget.material;
                const mats = Array.isArray(m) ? m : [m];
                return mats.some(mat => selectedMaterial.materials.includes(mat?.name));
            }
            const m = transformTarget.material;
            const mats = Array.isArray(m) ? m : [m];
            return mats.some(mat => mat?.name === targetName);
        })();

        if (!isTargetValid) {
            return;
        }

        prevTransformTargetRef.current = transformTarget;

        if (!isResetOrUndo && isGizmoDraggingRef.current) {
            return;
        }

        // ModelGroup transform is managed declaratively via rootTransform JSX props
    }, [transformTarget, rootTransform, transformValues,
        transformValues?.position?.x, transformValues?.position?.y, transformValues?.position?.z,
        transformValues?.rotation?.x, transformValues?.rotation?.y, transformValues?.rotation?.z,
        transformValues?.scale?.x, transformValues?.scale?.y, transformValues?.scale?.z,
        selectedMaterial, modelName, transformResetKey, resetKey, modelGroup, scene, updatePivotToTarget]);

    // Scene-Wide Reset Effect
    useEffect(() => {
        if (sceneResetTrigger > 0 && scene) {
            if (scene.userData.normalization) {
                const norm = scene.userData.normalization;
                scene.position.set(0, 0, 0);
                scene.rotation.set(0, 0, 0);
                scene.scale.set(1, 1, 1);
                scene.updateMatrixWorld(true);
                setPosition(norm.position);
                setScale(norm.scale);
            } else if (scene.userData.originalTransform) {
                const orig = scene.userData.originalTransform;
                scene.position.copy(orig.position);
                scene.rotation.copy(orig.rotation);
                scene.scale.copy(orig.scale);
                scene.updateMatrix();
            }

            meshIndexRef.current.forEach(meshes => {
                meshes.forEach(child => {
                    if (child.userData && child.userData.originalTransform) {
                        const original = child.userData.originalTransform;
                        child.position.copy(original.position);
                        child.rotation.copy(original.rotation);
                        child.scale.copy(original.scale);
                        child.updateMatrix();
                        child.updateMatrixWorld(true);
                    }
                });
            });

            if (modelGroup) {
                const norm = scene.userData?.normalization;
                const activeRoot = rootTransform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
                if (norm) {
                    const [bx, by, bz] = norm.position || [0, 0, 0];
                    const bScale = norm.scale || 1;
                    modelGroup.position.set(
                        bx + (activeRoot?.position?.x || 0),
                        by + (activeRoot?.position?.y || 0),
                        bz + (activeRoot?.position?.z || 0)
                    );
                    modelGroup.rotation.set(
                        activeRoot?.rotation?.x || 0,
                        activeRoot?.rotation?.y || 0,
                        activeRoot?.rotation?.z || 0
                    );
                    modelGroup.scale.set(
                        bScale * (activeRoot?.scale?.x || 1),
                        bScale * (activeRoot?.scale?.y || 1),
                        bScale * (activeRoot?.scale?.z || 1)
                    );
                } else if (modelGroup.userData.originalTransform) {
                    const original = modelGroup.userData.originalTransform;
                    modelGroup.position.set(
                        original.position.x + (activeRoot?.position?.x || 0),
                        original.position.y + (activeRoot?.position?.y || 0),
                        original.position.z + (activeRoot?.position?.z || 0)
                    );
                    modelGroup.rotation.copy(original.rotation);
                    modelGroup.scale.copy(original.scale);
                } else {
                    modelGroup.position.set(
                        activeRoot?.position?.x || 0,
                        activeRoot?.position?.y || 0,
                        activeRoot?.position?.z || 0
                    );
                    modelGroup.rotation.set(
                        activeRoot?.rotation?.x || 0,
                        activeRoot?.rotation?.y || 0,
                        activeRoot?.rotation?.z || 0
                    );
                    modelGroup.scale.set(
                        activeRoot?.scale?.x || 1,
                        activeRoot?.scale?.y || 1,
                        activeRoot?.scale?.z || 1
                    );
                }
                modelGroup.updateMatrix();
                modelGroup.updateMatrixWorld(true);
            }
        }
    }, [sceneResetTrigger, scene, modelGroup]);

    // UV Unwrap Logic
    useEffect(() => {
        if (scene && uvUnwrapTrigger > 0) {
            const targetMatName = selectedMaterial ? selectedMaterial.name : null;
            const isFullModel = !targetMatName || (modelName && targetMatName === modelName);

            let modifiedAny = false;

            const applyToSelection = (meshes) => {
                meshes.forEach(child => {
                    if (child.isMesh && child.material) {
                        applyBoxUV(child);
                        modifiedAny = true;
                    }
                });
            };

            if (isFullModel) {
                meshIndexRef.current.forEach(applyToSelection);
            } else {
                const targetMeshes = resolveTargetMeshes(selectedMaterial);
                applyToSelection(targetMeshes);
            }

            if (modifiedAny) {
                if (onUpdateMaterialSettingRef.current) {
                    onUpdateMaterialSettingRef.current('uvUnwrap', Date.now(), false);
                }
            }
        }
    }, [uvUnwrapTrigger, scene, selectedMaterial, modelName, resolveTargetMeshes]);

    return (
        <>
            <primitive object={pivotRef.current} />
            {transformMode && transformTarget && !selectedMaterial?.isAll && selectedMaterial?.name !== 'All Models' && (
                <TransformControls
                    key={`gizmo_${transformMode}_${selectedMaterial?.isAll ? 'all' : (selectedMaterial?.name || 'sel')}_${relatedMeshesRef.current.length}_${transformTarget === modelGroup ? 'mg' : (transformTarget?.uuid || 'pv')}`}
                    object={transformTarget === modelGroup ? modelGroup : pivotRef.current}
                    mode={transformMode}
                    size={0.8}
                    space="local"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                        isGizmoDraggingRef.current = true;
                        if (typeof onTransformStart === 'function') onTransformStart(e);
                    }}
                    onChange={() => {
                        if (transformTarget === modelGroup) {
                            const norm = scene.userData?.normalization;
                            const bx = norm?.position?.[0] ?? 0;
                            const by = norm?.position?.[1] ?? 0;
                            const bz = norm?.position?.[2] ?? 0;
                            const bScale = norm?.scale ?? 1;
                            if (typeof onTransformChange === 'function') {
                                onTransformChange({
                                    isModelLevel: true,
                                    modelId: modelId || scene?.userData?.modelId,
                                    modelName: modelName,
                                    position: {
                                        x: transformTarget.position.x - bx,
                                        y: transformTarget.position.y - by,
                                        z: transformTarget.position.z - bz
                                    },
                                    rotation: {
                                        x: transformTarget.rotation.x,
                                        y: transformTarget.rotation.y,
                                        z: transformTarget.rotation.z
                                    },
                                    scale: {
                                        x: bScale ? transformTarget.scale.x / bScale : 1,
                                        y: bScale ? transformTarget.scale.y / bScale : 1,
                                        z: bScale ? transformTarget.scale.z / bScale : 1
                                    }
                                });
                            }
                        } else {
                            const pivot = pivotRef.current;
                            if (pivot) {
                                pivot.updateMatrixWorld(true);
                                const pivotWorldMatrix = pivot.matrixWorld;
                                const list = (relatedMeshesRef.current && relatedMeshesRef.current.length > 0)
                                    ? relatedMeshesRef.current
                                    : (transformTarget ? [transformTarget] : []);

                                list.forEach(mesh => {
                                    const relMatrix = pivotOffsetsRef.current.get(mesh.uuid);
                                    if (relMatrix && mesh.parent) {
                                        const newWorldMatrix = new THREE.Matrix4().multiplyMatrices(pivotWorldMatrix, relMatrix);
                                        const parentInverse = new THREE.Matrix4().copy(mesh.parent.matrixWorld).invert();
                                        const newLocalMatrix = new THREE.Matrix4().multiplyMatrices(parentInverse, newWorldMatrix);
                                        newLocalMatrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
                                        mesh.updateMatrix();
                                        mesh.updateMatrixWorld(true);
                                    }
                                });
                            }

                            if (typeof onTransformChange === 'function' && transformTarget) {
                                const pivot = pivotRef.current;
                                onTransformChange({
                                    position: pivot ? pivot.position : transformTarget.position,
                                    rotation: pivot ? pivot.rotation : transformTarget.rotation,
                                    scale: pivot ? pivot.scale : transformTarget.scale,
                                    meshUuid: transformTarget.uuid,
                                    meshName: transformTarget.name || selectedMaterial?.name,
                                    modelId: modelId || scene?.userData?.modelId,
                                    modelName: modelName
                                });
                            }
                        }
                    }}
                    onMouseUp={(e) => {
                        isGizmoDraggingRef.current = false;
                        const all = {};
                        const list = (relatedMeshesRef.current && relatedMeshesRef.current.length > 0)
                            ? relatedMeshesRef.current
                            : (transformTarget ? [transformTarget] : []);
                        list.forEach(m => {
                            if (m && m.uuid) {
                                all[m.uuid] = {
                                    position: { x: m.position.x, y: m.position.y, z: m.position.z },
                                    rotation: { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z },
                                    scale: { x: m.scale.x, y: m.scale.y, z: m.scale.z },
                                    name: m.name || ''
                                };
                            }
                        });
                        if (typeof onTransformEnd === 'function') {
                            onTransformEnd(all, transformTarget === modelGroup, { modelId: modelId || scene?.userData?.modelId, modelName });
                        }
                        if (transformTarget !== modelGroup) {
                            updatePivotToTarget(transformTarget, relatedMeshesRef.current);
                        }
                    }}
                />
            )}
            {(() => {
                const activeRoot = rootTransform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
                return (
                    <group
                        ref={setModelGroup}
                        position={[
                            (position[0] || 0) + (activeRoot?.position?.x || 0),
                            (position[1] || 0) + (activeRoot?.position?.y || 0),
                            (position[2] || 0) + (activeRoot?.position?.z || 0)
                        ]}
                        rotation={[
                            activeRoot?.rotation?.x || 0,
                            activeRoot?.rotation?.y || 0,
                            activeRoot?.rotation?.z || 0
                        ]}
                        scale={[
                            (scale || 1) * (activeRoot?.scale?.x || 1),
                            (scale || 1) * (activeRoot?.scale?.y || 1),
                            (scale || 1) * (activeRoot?.scale?.z || 1)
                        ]}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            meshPointerDownPosRef.current = { x: e.clientX, y: e.clientY };
                        }}
                        onClick={(e) => {
                            e.stopPropagation();

                            if (meshPointerDownPosRef.current) {
                                const dx = Math.abs(e.clientX - meshPointerDownPosRef.current.x);
                                const dy = Math.abs(e.clientY - meshPointerDownPosRef.current.y);
                                if (dx > 6 || dy > 6) return;
                            }

                            const intersections = e.intersections;
                            if (intersections && intersections.length > 0) {
                                const closest = intersections[0].object;
                                let isGizmo = false;
                                let p = closest;
                                while (p) {
                                    if (p.isTransformControls || p.name?.includes('Transform') || p.name?.includes('Gizmo')) {
                                        isGizmo = true;
                                        break;
                                    }
                                    p = p.parent;
                                }
                                if (isGizmo) return;
                            }

                            let mesh = e.object;
                            if (intersections && intersections.length > 0) {
                                const currentSelectedUuid = selectedMaterial?.uuid || selectedMaterial?.meshUuid;
                                const candidateHits = [];
                                for (const hit of intersections) {
                                    let curr = hit.object;
                                    let isPartOfScene = false;
                                    while (curr) {
                                        if (curr === scene) {
                                            isPartOfScene = true;
                                            break;
                                        }
                                        curr = curr.parent;
                                    }
                                    if (isPartOfScene && (hit.object.isMesh || hit.object.isSkinnedMesh)) {
                                        candidateHits.push(hit.object);
                                    }
                                }

                                if (candidateHits.length > 0) {
                                    const isAnyXrayActive = Boolean(xrayMode || (xrayMaterials && xrayMaterials.size > 0));
                                    if (isAnyXrayActive && candidateHits[0]?.uuid === currentSelectedUuid && candidateHits.length > 1) {
                                        mesh = candidateHits[1];
                                    } else {
                                        mesh = candidateHits[0];
                                    }
                                }
                            }

                            if (mesh && (mesh.isMesh || mesh.isSkinnedMesh)) {
                                let mat = mesh.userData?.__preXrayMaterial || mesh.material;
                                if (Array.isArray(mat)) {
                                    if (e.face && e.face.materialIndex !== undefined) {
                                        mat = mat[e.face.materialIndex];
                                    } else {
                                        mat = mat[0];
                                    }
                                }
                                const matName = (mat && mat.name) ? mat.name : (mesh.name || "Material");
                                const meshName = mesh.name || matName;

                                const freshMaps = {};
                                if (mat) {
                                    const texSlots = [
                                        'map', 'normalMap', 'roughnessMap', 'metalnessMap',
                                        'emissiveMap', 'aoMap', 'bumpMap', 'displacementMap', 'alphaMap'
                                    ];
                                    for (const slot of texSlots) {
                                        if (mat[slot]) {
                                            const src = getTextureSource(mat[slot]);
                                            if (src) freshMaps[slot] = src;
                                        }
                                    }
                                }

                                let worldNormal = null;
                                if (e.intersections?.[0]?.face?.normal && mesh) {
                                    try {
                                        const nMat = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
                                        const nVec = e.intersections[0].face.normal.clone().applyMatrix3(nMat).normalize();
                                        worldNormal = { x: nVec.x, y: nVec.y, z: nVec.z };
                                    } catch (_) {
                                        worldNormal = {
                                            x: e.intersections[0].face.normal.x,
                                            y: e.intersections[0].face.normal.y,
                                            z: e.intersections[0].face.normal.z
                                        };
                                    }
                                }

                                if (typeof onSelectMaterial === 'function') {
                                    onSelectMaterial({
                                        name: meshName,
                                        material: matName,
                                        uuid: mesh.uuid,
                                        meshUuid: mesh.uuid,
                                        meshName: mesh.name || meshName,
                                        parentGroup: modelName,
                                        modelId: modelId || scene?.userData?.modelId,
                                        isMesh: true,
                                        isShift: e.shiftKey,
                                        isTransformSelect: !!transformMode,
                                        freshMaps,
                                        clickPoint: e.point ? { x: e.point.x, y: e.point.y, z: e.point.z } : null,
                                        clickNormal: worldNormal
                                    });
                                }
                            }
                        }}
                    >
                        <primitive
                            object={scene}
                        />
                    </group>
                );
            })()}

            {(() => {
                if (!selectedMaterial || selectedMaterial.name === 'Scene' || selectedMaterial.isAll || selectedMaterial.name === 'All Models') return null;
                const target = resolveTargetMeshes(selectedMaterial);
                if (!target || (Array.isArray(target) && target.length === 0)) return null;
                const targetKey = Array.isArray(target) ? target.map(m => m.uuid).join('_') : (target.uuid || 'sel');
                return <MeshSelectionHighlight key={targetKey} target={target} />;
            })()}
        </>
    );
}));

export default GenericModel;
