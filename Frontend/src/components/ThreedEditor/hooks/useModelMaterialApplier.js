import { useEffect, useRef } from "react";
import * as THREE from "three";
import { globalTextureCache, sharedTextureLoader } from "../utils/genericModelMaterialUtils";

/**
 * Hook to apply material settings and maps to Three.js meshes.
 */
export function useModelMaterialApplier({
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
}) {
    const lastApplyResetKeyRef = useRef(resetKey);
    const lastMapResetKeyRef = useRef(resetKey);

    // B. Apply Settings when UI changes
    useEffect(() => {
        if (!scene || !materialSettings) return;
        if (xrayMode) return;

        const selMat = selectedMaterial;
        const targetMatName = selMat ? selMat.name : (modelName || "Scene");
        const isExplicitFullModel = Boolean(selMat?.isAll || selMat?.name === "All Meshes");
        const isSceneOrNull = !selMat || targetMatName === modelName || targetMatName === "Scene";
        const isFullModel = isExplicitFullModel || isSceneOrNull;

        const rawScale = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 50;
        const safeScale = Math.max(1, Math.min(1000, isNaN(rawScale) ? 100 : rawScale));
        const texScaleX = 100 / safeScale;
        const texScaleY = 100 / safeScale;
        const texRotation = (materialSettings.rotation ?? 0) * (Math.PI / 180);
        const texOffsetX = (materialSettings.offset?.x ?? 0) / 100;
        const texOffsetY = (materialSettings.offset?.y ?? 0) / 100;

        const isResetOrUndo = resetKey !== lastApplyResetKeyRef.current;
        lastApplyResetKeyRef.current = resetKey;

        const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
        if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
            return;
        }

        if (isResetOrUndo) {
            const restoreOriginalTexTransform = (mat, propName) => {
                const tex = mat[propName];
                if (!tex || !tex.isTexture) return;
                const orig = mat.userData.originalTexTransforms?.[propName];
                if (!orig) return;
                if (orig.repeat && tex.repeat) tex.repeat.copy(orig.repeat);
                if (orig.offset && tex.offset) tex.offset.copy(orig.offset);
                if (orig.rotation !== undefined) tex.rotation = orig.rotation;
                if (orig.center && tex.center) tex.center.copy(orig.center);
                if (orig.wrapS !== undefined) tex.wrapS = orig.wrapS;
                if (orig.wrapT !== undefined) tex.wrapT = orig.wrapT;
                tex.matrixAutoUpdate = true;
                if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
            };

            scene.traverse((child) => {
                if ((!child.isMesh && !child.isSkinnedMesh) || !child.material) return;

                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(m => {
                    const lookupKeys = [
                        child.uuid,
                        child.userData?.meshUuid,
                        child.userData?.initialUuid,
                        child.name,
                        child.userData?.initialName,
                        m.name,
                        m.uuid
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
                                const inList =
                                    allowList.includes(child.uuid) ||
                                    allowList.includes(child.name) ||
                                    allowList.includes(m.name) ||
                                    allowList.includes(m.uuid);
                                if (inList) customSetting = allEntry;
                            }
                        }
                    }

                    if (customSetting) {
                        if (customSetting.color && m.color && typeof m.color.set === 'function') {
                            const intensity = (customSetting.colorIntensity ?? 100) / 100;
                            const finalCol = new THREE.Color(customSetting.color);
                            finalCol.multiplyScalar(intensity);
                            m.color.copy(finalCol);
                        } else if (m.userData.originalColor && m.color && typeof m.color.set === 'function') {
                            try {
                                if (m.userData.originalColor.isColor) {
                                    m.color.copy(m.userData.originalColor);
                                } else if (typeof m.userData.originalColor === 'string') {
                                    m.color.set(m.userData.originalColor);
                                } else if (typeof m.userData.originalColor === 'object' && typeof m.userData.originalColor.r === 'number') {
                                    m.color.setRGB(m.userData.originalColor.r, m.userData.originalColor.g, m.userData.originalColor.b);
                                }
                            } catch (_) { }
                        }
                        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                            if (customSetting.metallic !== undefined) {
                                m.metalness = (customSetting.metallic ?? 0) / 100;
                            } else if (m.userData.originalMetalness !== undefined) {
                                m.metalness = m.userData.originalMetalness;
                            }
                            if (customSetting.roughness !== undefined) {
                                m.roughness = (customSetting.roughness ?? 50) / 100;
                            } else if (m.userData.originalRoughness !== undefined) {
                                m.roughness = m.userData.originalRoughness;
                            }
                            if (customSetting.ao !== undefined && m.aoMap) {
                                m.aoMapIntensity = (customSetting.ao ?? 100) / 100;
                            }
                        }
                        if (customSetting.alpha !== undefined) {
                            const a = (customSetting.alpha ?? 100) / 100;
                            m.opacity = a;
                            m.transparent = a < 0.999 || !!m.alphaMap;
                        } else if (m.userData.originalOpacity !== undefined) {
                            m.opacity = m.userData.originalOpacity;
                            m.transparent = m.userData.originalTransparent !== undefined ? m.userData.originalTransparent : (m.opacity < 0.999 || !!m.alphaMap);
                        }
                        if (customSetting.emissiveColor && m.emissive && typeof m.emissive.set === 'function') {
                            m.emissive.set(customSetting.emissiveColor);
                            m.emissiveIntensity = (customSetting.emissiveIntensity ?? 0) / 100;
                        }
                        if (customSetting.normal !== undefined && m.normalMap && m.normalScale) {
                            const ns = (customSetting.normal ?? 100) / 100;
                            m.normalScale.set(ns, ns);
                        }
                        if (customSetting.appliedTexture) {
                            m.userData.appliedTexture = customSetting.appliedTexture;
                            m.userData.appliedTextureId = customSetting.appliedTexture.id || null;
                        } else {
                            m.userData.appliedTexture = null;
                            m.userData.appliedTextureId = null;
                            m.userData.appliedMap = null;
                        }

                        const hasCustomUV = customSetting.scale !== undefined ||
                            customSetting.rotation !== undefined ||
                            customSetting.offset?.x !== undefined ||
                            customSetting.offset?.y !== undefined ||
                            customSetting.appliedTexture;

                        const cScale = customSetting.scale !== undefined ? Number(customSetting.scale) : 50;
                        const cSafeScale = Math.max(1, Math.min(1000, isNaN(cScale) ? 100 : cScale));
                        const cTexScaleX = 100 / cSafeScale;
                        const cTexScaleY = 100 / cSafeScale;
                        const cTexRotation = (customSetting.rotation ?? 0) * (Math.PI / 180);
                        const cTexOffsetX = (customSetting.offset?.x ?? 0) / 100;
                        const cTexOffsetY = (customSetting.offset?.y ?? 0) / 100;

                        if (hasCustomUV) {
                            const surfaceTextures = [
                                m.map, m.normalMap, m.roughnessMap, m.metalnessMap,
                                m.bumpMap, m.alphaMap, m.emissiveMap
                            ];
                            surfaceTextures.forEach(tex => {
                                if (tex && tex.isTexture && tex !== m.aoMap && tex !== m.lightMap) {
                                    if (tex.wrapS !== THREE.RepeatWrapping || tex.wrapT !== THREE.RepeatWrapping) {
                                        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                                    }
                                    if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(cTexScaleX, cTexScaleY);
                                    if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(cTexOffsetX, cTexOffsetY);
                                    if (tex.rotation !== undefined) tex.rotation = cTexRotation;
                                    if (tex.center && typeof tex.center.set === 'function') {
                                        tex.center.set(cTexRotation !== 0 ? 0.5 : 0, cTexRotation !== 0 ? 0.5 : 0);
                                    }
                                    tex.matrixAutoUpdate = true;
                                    if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                                }
                            });
                            m.userData.__textureScale = cSafeScale;
                        } else {
                            const texProps = [
                                ['map', m.map],
                                ['normalMap', m.normalMap],
                                ['roughnessMap', m.roughnessMap],
                                ['metalnessMap', m.metalnessMap],
                                ['displacementMap', m.displacementMap],
                                ['bumpMap', m.bumpMap],
                                ['alphaMap', m.alphaMap],
                                ['emissiveMap', m.emissiveMap]
                            ];
                            texProps.forEach(([propName, tex]) => {
                                if (tex && tex.isTexture && tex !== m.aoMap && tex !== m.lightMap) {
                                    const origTransform = m.userData.originalTexTransforms?.[propName];
                                    if (origTransform) {
                                        if (origTransform.repeat && tex.repeat) tex.repeat.copy(origTransform.repeat);
                                        if (origTransform.offset && tex.offset) tex.offset.copy(origTransform.offset);
                                        if (origTransform.rotation !== undefined) tex.rotation = origTransform.rotation;
                                        if (origTransform.center && tex.center) tex.center.copy(origTransform.center);
                                        if (origTransform.wrapS !== undefined) tex.wrapS = origTransform.wrapS;
                                        if (origTransform.wrapT !== undefined) tex.wrapT = origTransform.wrapT;
                                    }
                                    tex.matrixAutoUpdate = true;
                                    if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                                }
                            });
                        }

                        if (customSetting.maps && typeof customSetting.maps === 'object') {
                            const syncMapTex = (mapProp, stateUrl, isColor = false) => {
                                if (stateUrl && stateUrl !== "existing" && stateUrl !== "none" && typeof stateUrl === 'string') {
                                    const cacheKey = `${stateUrl}_${isColor}`;
                                    if (globalTextureCache.has(cacheKey)) {
                                        const cachedTex = globalTextureCache.get(cacheKey);
                                        m[mapProp] = cachedTex;
                                        if (mapProp === 'map') {
                                            m.transparent = true;
                                            m.alphaTest = 0.05;
                                        }
                                        if (m[mapProp]?.repeat && typeof m[mapProp].repeat.set === 'function' && hasCustomUV) {
                                            m[mapProp].repeat.set(cTexScaleX, cTexScaleY);
                                        }
                                        m.userData[`is_${mapProp}_removed`] = false;
                                        m.needsUpdate = true;
                                        return;
                                    }
                                    sharedTextureLoader.load(stateUrl, (tex) => {
                                        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                                        tex.flipY = false;
                                        tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                                        tex.userData.url = stateUrl;
                                        if (tex?.repeat && typeof tex.repeat.set === 'function' && hasCustomUV) {
                                            tex.repeat.set(cTexScaleX, cTexScaleY);
                                        }
                                        globalTextureCache.set(cacheKey, tex);
                                        m[mapProp] = tex;
                                        if (mapProp === 'map') {
                                            m.transparent = true;
                                            m.alphaTest = 0.05;
                                        }
                                        m.userData[`is_${mapProp}_removed`] = false;
                                        m.needsUpdate = true;
                                    });
                                } else {
                                    const origKey = 'original' + mapProp.charAt(0).toUpperCase() + mapProp.slice(1);
                                    const origTex = m.userData[origKey];
                                    m[mapProp] = (origTex && origTex.isTexture) ? origTex : null;
                                    if (mapProp === 'normalMap' && !m[mapProp] && m.normalScale) {
                                        if (m.userData.originalNormalScale) {
                                            m.normalScale.copy(m.userData.originalNormalScale);
                                        } else {
                                            m.normalScale.set(1, 1);
                                        }
                                    }
                                    restoreOriginalTexTransform(m, mapProp);
                                    m.userData[`is_${mapProp}_removed`] = !m[mapProp];
                                    m.needsUpdate = true;
                                }
                            };
                            syncMapTex('map', customSetting.maps.map, true);
                            syncMapTex('normalMap', customSetting.maps.normalMap);
                            syncMapTex('roughnessMap', customSetting.maps.roughnessMap);
                            syncMapTex('metalnessMap', customSetting.maps.metalnessMap);
                            syncMapTex('aoMap', customSetting.maps.aoMap);
                            syncMapTex('bumpMap', customSetting.maps.bumpMap);
                            syncMapTex('alphaMap', customSetting.maps.alphaMap);
                            syncMapTex('emissiveMap', customSetting.maps.emissiveMap, true);
                            m.displacementMap = null;
                            m.displacementScale = 0;
                        }

                        m.needsUpdate = true;
                    } else {
                        m.map = (m.userData.originalMap && m.userData.originalMap.isTexture) ? m.userData.originalMap : null;
                        m.normalMap = (m.userData.originalNormalMap && m.userData.originalNormalMap.isTexture) ? m.userData.originalNormalMap : null;
                        m.roughnessMap = (m.userData.originalRoughnessMap && m.userData.originalRoughnessMap.isTexture) ? m.userData.originalRoughnessMap : null;
                        m.metalnessMap = (m.userData.originalMetalnessMap && m.userData.originalMetalnessMap.isTexture) ? m.userData.originalMetalnessMap : null;
                        m.aoMap = (m.userData.originalAoMap && m.userData.originalAoMap.isTexture) ? m.userData.originalAoMap : null;
                        m.alphaMap = (m.userData.originalAlphaMap && m.userData.originalAlphaMap.isTexture) ? m.userData.originalAlphaMap : null;
                        m.emissiveMap = (m.userData.originalEmissiveMap && m.userData.originalEmissiveMap.isTexture) ? m.userData.originalEmissiveMap : null;
                        m.bumpMap = (m.userData.originalBumpMap && m.userData.originalBumpMap.isTexture) ? m.userData.originalBumpMap : null;
                        m.displacementMap = null;
                        m.displacementScale = 0;

                        if (m.normalScale) {
                            if (m.userData.originalNormalScale) {
                                m.normalScale.copy(m.userData.originalNormalScale);
                            } else {
                                m.normalScale.set(1, 1);
                            }
                        }

                        restoreOriginalTexTransform(m, 'map');
                        restoreOriginalTexTransform(m, 'normalMap');
                        restoreOriginalTexTransform(m, 'roughnessMap');
                        restoreOriginalTexTransform(m, 'metalnessMap');
                        restoreOriginalTexTransform(m, 'aoMap');
                        restoreOriginalTexTransform(m, 'displacementMap');
                        restoreOriginalTexTransform(m, 'bumpMap');
                        restoreOriginalTexTransform(m, 'alphaMap');
                        restoreOriginalTexTransform(m, 'emissiveMap');

                        m.userData.appliedTexture = null;
                        m.userData.appliedTextureId = null;
                        m.userData.appliedMap = null;
                        delete m.userData.__textureScale;

                        if (m.userData.originalColor) {
                            try {
                                if (m.userData.originalColor.isColor) {
                                    m.color.copy(m.userData.originalColor);
                                } else if (typeof m.userData.originalColor === 'string') {
                                    m.color.set(m.userData.originalColor);
                                } else if (typeof m.userData.originalColor === 'object' && typeof m.userData.originalColor.r === 'number') {
                                    m.color.setRGB(m.userData.originalColor.r, m.userData.originalColor.g, m.userData.originalColor.b);
                                }
                            } catch (_) { }
                        }
                        if (m.userData.originalRoughness !== undefined) m.roughness = m.userData.originalRoughness;
                        if (m.userData.originalMetalness !== undefined) m.metalness = m.userData.originalMetalness;
                        if (m.userData.originalOpacity !== undefined) m.opacity = m.userData.originalOpacity;
                        if (m.userData.originalTransparent !== undefined) m.transparent = m.userData.originalTransparent;
                        if (m.userData.originalAlphaTest !== undefined) m.alphaTest = m.userData.originalAlphaTest;

                        const texProps = [
                            ['map', m.map],
                            ['normalMap', m.normalMap],
                            ['roughnessMap', m.roughnessMap],
                            ['metalnessMap', m.metalnessMap],
                            ['displacementMap', m.displacementMap],
                            ['bumpMap', m.bumpMap],
                            ['alphaMap', m.alphaMap],
                            ['emissiveMap', m.emissiveMap]
                        ];
                        texProps.forEach(([propName, tex]) => {
                            if (tex && tex.isTexture && tex !== m.aoMap && tex !== m.lightMap) {
                                const origTransform = m.userData.originalTexTransforms?.[propName];
                                if (origTransform) {
                                    if (origTransform.repeat && tex.repeat) tex.repeat.copy(origTransform.repeat);
                                    if (origTransform.offset && tex.offset) tex.offset.copy(origTransform.offset);
                                    if (origTransform.rotation !== undefined) tex.rotation = origTransform.rotation;
                                    if (origTransform.center && tex.center) tex.center.copy(origTransform.center);
                                    if (origTransform.wrapS !== undefined) tex.wrapS = origTransform.wrapS;
                                    if (origTransform.wrapT !== undefined) tex.wrapT = origTransform.wrapT;
                                } else {
                                    if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(1, 1);
                                    if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(0, 0);
                                    if (tex.rotation !== undefined) tex.rotation = 0;
                                    if (tex.center && typeof tex.center.set === 'function') tex.center.set(0, 0);
                                }
                                tex.matrixAutoUpdate = true;
                                if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                            }
                        });
                        m.needsUpdate = true;
                    }
                });
            });
            return;
        }

        if (!materialSettings.useFactorColor) {
            return;
        }

        const changedProp = materialSettings.lastChangedProp;

        const alpha = (materialSettings.alpha ?? 100) / 100;
        const metallic = (materialSettings.metallic ?? 0) / 100;
        const roughness = (materialSettings.roughness ?? 50) / 100;
        const normalScaleVal = (materialSettings.normal ?? 100) / 100;
        const bumpScaleVal = (materialSettings.bump ?? 100) / 100;
        const color = materialSettings.color;
        const emissiveColor = materialSettings.emissiveColor || '#000000';
        const emissiveIntensity = (materialSettings.emissiveIntensity ?? 0) / 100;

        const targetedMeshes = resolveTargetMeshes(selMat);
        const targetMeshSet = new Set(targetedMeshes);

        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                const isLightingProp = changedProp === 'specular' || changedProp === 'reflection';
                let isTargetChild = false;
                if (isLightingProp) {
                    isTargetChild = true;
                } else if (selMat && !isExplicitFullModel && !isSceneOrNull) {
                    isTargetChild = targetMeshSet.has(child);
                } else if (isExplicitFullModel) {
                    isTargetChild = !!materialSettings.useFactorColor;
                }

                if (!isTargetChild) return;

                const childMatNames = Array.isArray(child.material)
                    ? child.material.map(cm => cm?.name).filter(Boolean)
                    : [child.material?.name].filter(Boolean);
                const isChildInXray = Boolean(
                    xrayMaterials && xrayMaterials.size > 0 && (
                        (child.uuid && xrayMaterials.has(child.uuid)) ||
                        (child.name && xrayMaterials.has(child.name)) ||
                        childMatNames.some(mName => xrayMaterials.has(mName))
                    )
                );

                if (!isFullModel && !isLightingProp) {
                    ensureMeshUniqueMaterial(child, targetMeshSet);
                }

                if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m);
                }
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(m => {
                    let isMatch = true;

                    if (isMatch) {
                        if (isChildInXray && m.userData?.__xrayBackup) {
                            const backup = m.userData.__xrayBackup;
                            const isColorProp = changedProp === 'color' || changedProp === 'colorIntensity';
                            if ((!changedProp || isColorProp) && color) {
                                const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                                const finalColor = new THREE.Color(color);
                                finalColor.multiplyScalar(intensity);
                                if (backup.color) backup.color.copy(finalColor);
                            }
                            if (!changedProp || changedProp === 'metallic') {
                                backup.metalness = metallic;
                            }
                            if (!changedProp || changedProp === 'roughness') {
                                backup.roughness = roughness;
                            }
                            if (!changedProp || changedProp === 'alpha') {
                                backup.opacity = alpha;
                            }
                            return;
                        }

                        const applyAll = isResetOrUndo || !changedProp;

                        const isColorProp = changedProp === 'color' || changedProp === 'colorIntensity';
                        const applyColor = applyAll || isColorProp;
                        if (applyColor && color && m.color && typeof m.color.set === 'function') {
                            const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                            const finalColor = new THREE.Color(color);
                            finalColor.multiplyScalar(intensity);
                            m.color.copy(finalColor);
                        }

                        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                            if (applyAll || changedProp === 'metallic') {
                                m.metalness = metallic;
                            }
                            if (applyAll || changedProp === 'roughness') {
                                m.roughness = roughness;
                            }

                            if (applyAll || isLightingProp || changedProp === 'reflection' || changedProp === 'specular') {
                                const reflVal = materialSettings.reflection !== undefined ? materialSettings.reflection : 50;
                                const specVal = materialSettings.specular !== undefined ? materialSettings.specular : 50;

                                const envMapIntensity = reflVal <= 50
                                    ? (reflVal / 50)
                                    : 1.0 + ((reflVal - 50) / 50) * 2.5;
                                m.envMapIntensity = envMapIntensity;

                                if (reflVal > 50) {
                                    const boost = (reflVal - 50) / 50;
                                    m.clearcoat = Math.max(m.userData?.originalClearcoat || 0, boost * 0.9);
                                    m.clearcoatRoughness = 0.05 + (1.0 - boost) * 0.15;
                                    m.reflectivity = 0.5 + boost * 0.5;
                                } else {
                                    m.clearcoat = ((m.userData?.originalClearcoat || 0) * (reflVal / 50));
                                    m.reflectivity = (reflVal / 50) * 0.5;
                                }

                                const baseSpec = (m.userData?.originalSpecularIntensity !== undefined) ? m.userData.originalSpecularIntensity : 1.0;
                                const specMultiplier = specVal <= 50
                                    ? (specVal / 50)
                                    : 1.0 + ((specVal - 50) / 50) * 2.0;

                                const reflectionFloor = reflVal > 0 ? Math.max(0.6, (reflVal / 50)) : 0;
                                m.specularIntensity = Math.max(reflectionFloor, specMultiplier) * baseSpec;

                                if (!m.specularColor) {
                                    m.specularColor = new THREE.Color(1, 1, 1);
                                } else {
                                    m.specularColor.setRGB(1, 1, 1);
                                }
                                m.ior = 1.5;
                                m.needsUpdate = true;
                            }
                            if ((applyAll || changedProp === 'ao') && m.aoMap) {
                                const aoIntensity = (materialSettings.ao ?? 100) / 100;
                                m.aoMapIntensity = aoIntensity;
                            }

                            if (applyAll) {
                                if (m.userData.originalClearcoat !== undefined) {
                                    m.clearcoat = m.userData.originalClearcoat;
                                }
                            }
                        }

                        const isCutoutMatActive = /fringe|tassel|cutout|thread|strand|leaf|foliage|hair|fur|trans|alpha/i.test(`${child.name || ''}_${m.name || ''}`);
                        if (changedProp === 'alpha') {
                            const isTransparent = alpha < 0.999 || !!m.alphaMap;
                            m.transparent = isTransparent;
                            m.opacity = alpha;
                            m.depthWrite = true;
                            m.alphaTest = (m.userData.originalAlphaTest !== undefined && m.userData.originalAlphaTest > 0)
                                ? m.userData.originalAlphaTest
                                : (m.alphaMap || isCutoutMatActive ? 0.5 : 0);
                            if (m.alphaTest > 0 && alpha >= 0.999 && !m.alphaMap) {
                                m.transparent = false;
                            }
                        } else if (applyAll) {
                            if (m.userData.originalAlphaTest !== undefined && m.userData.originalAlphaTest > 0) {
                                m.alphaTest = m.userData.originalAlphaTest;
                            } else if (m.alphaMap || isCutoutMatActive) {
                                m.alphaTest = 0.5;
                            } else if (m.userData.originalAlphaTest !== undefined) {
                                m.alphaTest = m.userData.originalAlphaTest;
                            }
                            if (m.userData.originalTransparent !== undefined) {
                                m.transparent = m.userData.originalTransparent;
                            } else {
                                m.transparent = (m.opacity < 0.999) || Boolean(m.alphaMap);
                            }
                            m.depthWrite = true;
                            if (m.userData.originalOpacity !== undefined) {
                                m.opacity = m.userData.originalOpacity;
                            }
                        }

                        if (applyAll || changedProp === 'emissiveColor' || changedProp === 'emissiveIntensity') {
                            if (m.emissive && typeof m.emissive.set === 'function') {
                                m.emissive.set(emissiveColor);
                                m.emissiveIntensity = emissiveIntensity;
                            }
                        }

                        if ((applyAll || changedProp === 'normal') && m.normalMap && m.normalScale) {
                            m.normalScale.set(normalScaleVal, normalScaleVal);
                        }

                        if (applyAll || changedProp === 'bump') {
                            if (m.displacementMap) {
                                m.displacementScale = Math.min(0.02, (bumpScaleVal || 0) * 0.005);
                            }
                            if (m.bumpMap) {
                                m.bumpScale = Math.min(0.1, (bumpScaleVal || 0) * 0.05);
                            }
                        }

                        const configTextureId = materialSettings.appliedTexture?.id || materialSettings.appliedTexture?._id || null;
                        const matTextureId = m.userData.appliedTextureId || null;
                        const isNone = configTextureId === 'none';

                        if (matTextureId && (isNone || (isResetOrUndo && !configTextureId && materialSettings.useFactorColor))) {
                            m.map = null;
                            m.normalMap = null;
                            m.roughnessMap = null;
                            m.metalnessMap = null;
                            m.aoMap = null;
                            m.displacementMap = null;
                            m.bumpMap = null;
                            m.alphaMap = null;

                            if (m.userData.originalMap) m.map = m.userData.originalMap;
                            if (m.userData.originalNormalMap) m.normalMap = m.userData.originalNormalMap;
                            if (m.userData.originalAlphaMap) m.alphaMap = m.userData.originalAlphaMap;

                            m.userData.appliedTexture = null;
                            m.userData.appliedTextureId = null;
                            m.needsUpdate = true;
                        }

                        const shouldTransformTextures = changedProp === 'scale' || changedProp === 'rotation' || changedProp === 'offset' || changedProp === 'appliedTexture' || (isResetOrUndo && (m.userData.__textureScale !== undefined || m.userData.appliedTextureId || materialSettings.lastChangedProp === 'scale'));
                        if (shouldTransformTextures) {
                            const surfaceTextures = [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.displacementMap, m.bumpMap, m.alphaMap, m.emissiveMap];
                            surfaceTextures.forEach(tex => {
                                if (tex) {
                                    if (tex === m.aoMap || tex === m.lightMap) return;

                                    if (tex.wrapS !== THREE.RepeatWrapping || tex.wrapT !== THREE.RepeatWrapping) {
                                        tex.wrapS = THREE.RepeatWrapping;
                                        tex.wrapT = THREE.RepeatWrapping;
                                        if (tex.image) {
                                            tex.needsUpdate = true;
                                        }
                                    }
                                    if (!tex.image && tex.needsUpdate) {
                                        tex.needsUpdate = false;
                                    }

                                    if (tex.repeat && typeof tex.repeat.set === 'function') tex.repeat.set(texScaleX, texScaleY);
                                    if (tex.offset && typeof tex.offset.set === 'function') tex.offset.set(texOffsetX, texOffsetY);
                                    if (tex.rotation !== undefined) tex.rotation = texRotation;
                                    if (tex.center && typeof tex.center.set === 'function') {
                                        if (texRotation !== 0) {
                                            tex.center.set(0.5, 0.5);
                                        } else {
                                            tex.center.set(0, 0);
                                        }
                                    }
                                    tex.matrixAutoUpdate = true;
                                    if (typeof tex.updateMatrix === 'function') tex.updateMatrix();
                                }
                            });
                            m.userData.__textureScale = safeScale;
                        }

                        const stateAppliedTextureId = materialSettings.appliedTexture?.id
                            || materialSettings.appliedTexture?._id
                            || null;
                        const stateWantsNoTexture =
                            stateAppliedTextureId === null ||
                            stateAppliedTextureId === 'none' ||
                            stateAppliedTextureId === undefined;

                        if (!stateWantsNoTexture) {
                            if (m.userData.appliedMap?.isTexture && !m.map && !m.userData.is_map_removed) {
                                m.map = m.userData.appliedMap;
                                m.needsUpdate = true;
                            } else if (!m.userData.appliedTextureId && !m.map && m.userData.originalMap?.isTexture && !m.userData.is_map_removed) {
                                m.map = m.userData.originalMap;
                                m.needsUpdate = true;
                            }
                            if (!m.userData.appliedTextureId && !m.alphaMap && m.userData.originalAlphaMap?.isTexture && !m.userData.is_alphaMap_removed) {
                                m.alphaMap = m.userData.originalAlphaMap;
                                m.needsUpdate = true;
                            }
                        } else {
                            if (!m.map && m.userData.originalMap?.isTexture) {
                                m.map = m.userData.originalMap;
                                m.needsUpdate = true;
                            }
                            if (!m.alphaMap && m.userData.originalAlphaMap?.isTexture) {
                                m.alphaMap = m.userData.originalAlphaMap;
                                m.needsUpdate = true;
                            }
                            m.userData.appliedMap = null;
                            m.userData.appliedTexture = null;
                            m.userData.appliedTextureId = null;
                        }

                        if (!m.userData.originalColor && !materialSettings.useFactorColor) {
                            m.userData.originalColor = m.color.clone();
                        }

                        if (applyAll || changedProp === 'color' || changedProp === 'alpha' || changedProp === 'normal' || changedProp === 'bump') {
                            m.needsUpdate = true;
                        }
                    }
                });
            }
        });
    }, [scene, materialSettings, customizedMaterials, modelName, selectedMaterial, resetKey, syncedSelectionSignature, resolveTargetMeshes, ensureMeshUniqueMaterial, xrayMaterials, xrayMode]);

    // C. Sync Map URLs from State
    useEffect(() => {
        if (!scene || !materialSettings?.maps) return;
        if (xrayMode) return;

        const isResetOrUndo = resetKey !== lastMapResetKeyRef.current;
        lastMapResetKeyRef.current = resetKey;

        const changedProp = materialSettings.lastChangedProp;
        const isLightingOnly = changedProp === 'specular' || changedProp === 'reflection';
        if (isLightingOnly) return;

        // Only touch mesh maps when the user explicitly changed maps/texture (or on undo/reset).
        // Selection changes populate `maps` with preview thumbnails / stale maps from the
        // previous selection — applying those corrupts untextured materials.
        if (!isResetOrUndo && changedProp !== 'maps' && changedProp !== 'appliedTexture') return;

        const selMat = selectedMaterial;
        const currentSigC = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
        if (!isResetOrUndo && syncedSelectionSignature && syncedSelectionSignature !== currentSigC) return;
        const targetMatName = selMat ? selMat.name : (modelName || "Scene");
        const isExplicitFullModel = Boolean(selMat?.isAll || selMat?.name === "All Meshes");
        const isSceneOrNull = !selMat || targetMatName === modelName || targetMatName === "Scene";
        const isFullModel = isExplicitFullModel || isSceneOrNull;

        const stateMaps = materialSettings.maps;
        const isNone = materialSettings.appliedTexture?.id === 'none';

        const rawScaleC = materialSettings.scale !== undefined ? Number(materialSettings.scale) : 50;
        const safeScaleC = Math.max(1, Math.min(1000, isNaN(rawScaleC) ? 100 : rawScaleC));
        const texScaleX = 100 / safeScaleC;
        const texScaleY = 100 / safeScaleC;

        const targetedMeshes = resolveTargetMeshes(selectedMaterial);
        const targetMeshSet = new Set(targetedMeshes);

        const applyToMeshes = (meshes) => {
            meshes.forEach(child => {
                if ((child.isMesh || child.isSkinnedMesh) && child.material) {
                    if (!isFullModel) {
                        ensureMeshUniqueMaterial(child, targetMeshSet);
                    }
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        const hasCustomScale = m.userData.__textureScale !== undefined || materialSettings.lastChangedProp === 'scale';

                        const syncMap = (mapProp, stateUrl, isColor = false) => {
                            if (isNone) {
                                m[mapProp] = null;
                                m.userData[`is_${mapProp}_removed`] = true;
                                m.needsUpdate = true;
                                return;
                            }
                            if (stateUrl && stateUrl !== "existing" && stateUrl !== "none" && typeof stateUrl === 'string') {
                                const curTex = m[mapProp];
                                if (curTex && (curTex.userData?.__thumbnailUrl === stateUrl || curTex.userData?.url === stateUrl)) {
                                    return; // already showing this texture (state holds its preview thumbnail)
                                }
                                const cacheKey = `${stateUrl}_${isColor}`;
                                if (globalTextureCache.has(cacheKey)) {
                                    const cachedTex = globalTextureCache.get(cacheKey);
                                    m[mapProp] = cachedTex;
                                    if (mapProp === 'map') {
                                        m.transparent = true;
                                        m.alphaTest = 0.05;
                                    }
                                    if (m[mapProp]?.repeat && typeof m[mapProp].repeat.set === 'function' && hasCustomScale) {
                                        m[mapProp].repeat.set(texScaleX, texScaleY);
                                    }
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                    return;
                                }

                                sharedTextureLoader.load(stateUrl, (tex) => {
                                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                                    tex.flipY = false;
                                    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
                                    tex.userData.url = stateUrl;
                                    if (tex?.repeat && typeof tex.repeat.set === 'function' && hasCustomScale) {
                                        tex.repeat.set(texScaleX, texScaleY);
                                    }
                                    globalTextureCache.set(cacheKey, tex);
                                    m[mapProp] = tex;
                                    if (mapProp === 'map') {
                                        m.transparent = true;
                                        m.alphaTest = 0.05;
                                    }
                                    m.userData[`is_${mapProp}_removed`] = false;
                                    m.needsUpdate = true;
                                });
                            } else if (stateUrl === null) {
                                m[mapProp] = null;
                                m.userData[`is_${mapProp}_removed`] = true;
                                m.needsUpdate = true;
                            } else if (isResetOrUndo && !stateUrl) {
                                const origKey = 'original' + mapProp.charAt(0).toUpperCase() + mapProp.slice(1);
                                const origTex = m.userData[origKey];
                                m[mapProp] = (origTex && origTex.isTexture) ? origTex : null;
                                m.userData[`is_${mapProp}_removed`] = !m[mapProp];
                                m.needsUpdate = true;
                            }
                        };

                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'map')) syncMap('map', stateMaps.map, true);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'normalMap')) syncMap('normalMap', stateMaps.normalMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'roughnessMap')) syncMap('roughnessMap', stateMaps.roughnessMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'metalnessMap')) syncMap('metalnessMap', stateMaps.metalnessMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'aoMap')) syncMap('aoMap', stateMaps.aoMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'bumpMap')) syncMap('bumpMap', stateMaps.bumpMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'alphaMap')) syncMap('alphaMap', stateMaps.alphaMap);
                        if (Object.prototype.hasOwnProperty.call(stateMaps, 'emissiveMap')) syncMap('emissiveMap', stateMaps.emissiveMap, true);

                        m.displacementMap = null;
                        m.displacementScale = 0;
                    });
                }
            });
        };

        if (isFullModel) {
            const allMeshes = [];
            scene.traverse((child) => {
                if ((child.isMesh || child.isSkinnedMesh) && child.material) {
                    allMeshes.push(child);
                }
            });
            applyToMeshes(allMeshes);
        } else {
            const targetMeshes = resolveTargetMeshes(selectedMaterial);
            applyToMeshes(targetMeshes);
        }
    }, [scene, materialSettings?.maps, materialSettings?.appliedTexture, materialSettings?.scale, materialSettings?.lastChangedProp, selectedMaterial, modelName, resetKey, resolveTargetMeshes, ensureMeshUniqueMaterial, xrayMode]);
}
