import React, { useState, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { TransformControls } from "@react-three/drei";
import { GLTFExporter } from "three-stdlib";
import { OBJExporter } from "three-stdlib";
import { STLExporter } from "three-stdlib";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

const GenericModel = React.memo(React.forwardRef(({ scene, wireframe, setModelStats, setMaterialList, selectedMaterial, onSelectMaterial, modelName, transformMode, materialSettings, hiddenMaterials, onTransformChange, onTransformEnd, transformValues, selectedTexture, onTextureApplied, onTextureIdentified, onUpdateMaterialSetting, resetKey, sceneResetTrigger, uvUnwrapTrigger, isSelectionDisabled }, ref) => {
  const [position, setPosition] = useState([0, 0, 0]);
  const [scale, setScale] = useState(1);
  const groupRef = React.useRef(null);
  const [modelGroup, setModelGroup] = useState(null);
  const [syncedSelectionSignature, setSyncedSelectionSignature] = useState(null);


  // Expose Helper Functionality
  React.useImperativeHandle(ref, () => ({
      deleteMaterial: (matName) => {
          if (!scene) return;
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
      },
      renameMaterial: (oldName, newName) => {
          if (!scene || !oldName || !newName) return;
          scene.traverse((child) => {
              if (child.isMesh && child.material) {
                  const mats = Array.isArray(child.material) ? child.material : [child.material];
                  mats.forEach(m => {
                      if (m.name === oldName) {
                          m.name = newName;
                      }
                  });
              }
          });
      }
  }));
    
  // 0. Apply Texture to Selected Material
  useEffect(() => {
     if (!selectedTexture || !scene) return;
     
     // Use a separate LoadingManager to avoid triggering the global useProgress spinner
     const textureManager = new THREE.LoadingManager();
     const loader = new THREE.TextureLoader(textureManager);
     
     const loadMap = (url, isColor = false) => {
          if (!url) return null;
          return loader.load(url, (tex) => {
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              tex.flipY = false; 
              tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              tex.anisotropy = 16;
              tex.needsUpdate = true;
          });
     }

     const newMaps = {};
     if (selectedTexture.maps.map) newMaps.map = loadMap(selectedTexture.maps.map, true);
     if (selectedTexture.maps.normalMap) newMaps.normalMap = loadMap(selectedTexture.maps.normalMap, false);
     if (selectedTexture.maps.roughnessMap) newMaps.roughnessMap = loadMap(selectedTexture.maps.roughnessMap, false);
     if (selectedTexture.maps.metalnessMap) newMaps.metalnessMap = loadMap(selectedTexture.maps.metalnessMap, false);
     if (selectedTexture.maps.bumpMap) newMaps.bumpMap = loadMap(selectedTexture.maps.bumpMap, false);
     if (selectedTexture.maps.aoMap) newMaps.aoMap = loadMap(selectedTexture.maps.aoMap, false);
     
     // Note: If no material is selected, texture applies to logic below (all matching standard materials)
     // To support "Specific Material" vs "Full Model", we check `selectedMaterial`.
     // If null, it applies to all? Yes, lines 40-45 handle this.
     
     const selMat = selectedMaterial; 
     const targetMatName = selMat ? selMat.name : null;
     const targetParentGroup = selMat ? selMat.parentGroup : null;

     if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") return;
     if (selMat && selMat.isGroup && targetMatName !== modelName && targetMatName !== "Scene") return;

     const isFullModel = !targetMatName || (modelName && targetMatName === modelName) || targetMatName === "Scene";

     let appliedCount = 0;
     scene.traverse((child) => {
          if (child.isMesh && child.material) {
              const apply = (mat) => {
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial && !mat.isMeshPhongMaterial) return;
                   
                   let isMatch = false;
                   if (!isFullModel) {
                       isMatch = mat.name === targetMatName;
                   } else {
                       isMatch = true; 
                   }
                   
                   if (isMatch) {
                       // Forcefully replace maps (clearing old ones if new one doesn't exist)
                       mat.map = newMaps.map || null;
                       mat.normalMap = newMaps.normalMap || null;
                       mat.aoMap = newMaps.aoMap || null;
                       // Use normal map as bump map if no bump map is provided to allow bump scale adjustment
                       mat.bumpMap = newMaps.bumpMap || newMaps.normalMap || null;
                       if (mat.bumpMap && !mat.bumpScale) mat.bumpScale = 1;
                       
                       if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                           mat.roughnessMap = newMaps.roughnessMap || null;
                           mat.metalnessMap = newMaps.metalnessMap || null;

                           // Reset factors to 1.0 for full map influence if maps are present
                           if (newMaps.roughnessMap) mat.roughness = 1.0;
                           if (newMaps.metalnessMap) mat.metalness = 1.0;
                           
                           // Reset color to white so diffuse map is not tinted
                           if (newMaps.map && mat.color && typeof mat.color.set === 'function') {
                               // mat.color.set(0xffffff);
                           }
                        }
                        
                        
                        // Save the full texture object for later identification
                        if (selectedTexture.id) {
                            mat.userData.appliedTexture = selectedTexture;
                            mat.userData.appliedTextureId = selectedTexture.id;
                        } else {
                            delete mat.userData.appliedTexture;
                            delete mat.userData.appliedTextureId;
                        }
                        
                        mat.needsUpdate = true;
                        appliedCount++;
                   }
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(apply);
              } else {
                  apply(child.material);
              }
          }
     });
     
     // Update the UI immediately to reflect the new texture as "Active" for this material
     if (typeof onTextureIdentified === 'function') {
         onTextureIdentified(selectedTexture.id || null);
     }

     
     // Notify parent that texture has been processed so we can reset state
     if (typeof onTextureApplied === 'function') {
         onTextureApplied();
     }


     
  }, [selectedTexture, scene, selectedMaterial, onTextureApplied, onTextureIdentified]);

  // 0.2. Apply Manual Map Uploads
  useEffect(() => {
    if (!materialSettings?.maps || !scene) return;
    
    // We only apply to the selected material (scoping is handled by the component that updates maps)
    const selMat = selectedMaterial;
    const targetMatName = selMat ? selMat.name : null;
    
    // If "Scene" or model group is selected, we could potentially apply to all, 
    // but typically manual map uploads are for specific materials.
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    if (!targetMatName && !isFullModel) return;

    const textureManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(textureManager);
    
    const loadMap = (url, isColor = false) => {
         if (!url) return null;
         return loader.load(url, (tex) => {
             tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
             tex.flipY = false; 
             tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
             tex.anisotropy = 16;
             tex.needsUpdate = true;
         });
    }

    const newMapsList = materialSettings.maps;
    const loadedMaps = {};
    
    // Only load maps that are actually present (Blob URLs)
    if (newMapsList.map) loadedMaps.map = loadMap(newMapsList.map, true);
    if (newMapsList.normalMap) loadedMaps.normalMap = loadMap(newMapsList.normalMap, false);
    if (newMapsList.roughnessMap) loadedMaps.roughnessMap = loadMap(newMapsList.roughnessMap, false);
    if (newMapsList.metalnessMap) loadedMaps.metalnessMap = loadMap(newMapsList.metalnessMap, false);
    if (newMapsList.bumpMap) loadedMaps.bumpMap = loadMap(newMapsList.bumpMap, false);
    if (newMapsList.aoMap) loadedMaps.aoMap = loadMap(newMapsList.aoMap, false);
    if (newMapsList.alphaMap) loadedMaps.alphaMap = loadMap(newMapsList.alphaMap, false);
    if (newMapsList.emissiveMap) loadedMaps.emissiveMap = loadMap(newMapsList.emissiveMap, true);

    scene.traverse((child) => {
         if (child.isMesh && child.material) {
             const apply = (mat) => {
                  let isMatch = false;
                  if (!isFullModel) {
                      isMatch = mat.name === targetMatName;
                  } else {
                      isMatch = true; 
                  }
                  
                   if (isMatch) {
                      const hasMapUpdate = newMapsList.hasOwnProperty('map') && newMapsList.map !== "existing";
                      const hasNormalUpdate = newMapsList.hasOwnProperty('normalMap') && newMapsList.normalMap !== "existing";
                      const hasRoughnessUpdate = newMapsList.hasOwnProperty('roughnessMap') && newMapsList.roughnessMap !== "existing";
                      const hasMetalnessUpdate = newMapsList.hasOwnProperty('metalnessMap') && newMapsList.metalnessMap !== "existing";
                      const hasBumpUpdate = newMapsList.hasOwnProperty('bumpMap') && newMapsList.bumpMap !== "existing";
                      const hasAoUpdate = newMapsList.hasOwnProperty('aoMap') && newMapsList.aoMap !== "existing";

                      if (hasMapUpdate) {
                          const nextMap = loadedMaps.map || null;
                          if (mat.map !== nextMap) mat.map = nextMap;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.map = newMapsList.map;
                      }
                      
                      if (hasNormalUpdate) {
                          const nextNormal = loadedMaps.normalMap || null;
                          if (mat.normalMap !== nextNormal) mat.normalMap = nextNormal;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.normalMap = newMapsList.normalMap;
                          if (mat.normalMap && !mat.normalScale) mat.normalScale = new THREE.Vector2(1, 1);
                      }
                      
                      if (hasRoughnessUpdate) {
                          const nextRoughness = loadedMaps.roughnessMap || null;
                          if (mat.roughnessMap !== nextRoughness) mat.roughnessMap = nextRoughness;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.roughnessMap = newMapsList.roughnessMap;
                          if (mat.roughnessMap) mat.roughness = 1.0;
                      }
                      
                      if (hasMetalnessUpdate) {
                          const nextMetalness = loadedMaps.metalnessMap || null;
                          if (mat.metalnessMap !== nextMetalness) mat.metalnessMap = nextMetalness;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.metalnessMap = newMapsList.metalnessMap;
                          if (mat.metalnessMap) mat.metalness = 1.0;
                      }
                      
                      if (hasBumpUpdate) {
                          const nextBump = loadedMaps.bumpMap || null;
                          if (mat.bumpMap !== nextBump) mat.bumpMap = nextBump;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.bumpMap = newMapsList.bumpMap;
                          if (mat.bumpMap && mat.bumpScale === undefined) mat.bumpScale = 1;
                      }
                      
                      if (hasAoUpdate) {
                          const nextAo = loadedMaps.aoMap || null;
                          if (mat.aoMap !== nextAo) mat.aoMap = nextAo;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.aoMap = newMapsList.aoMap;
                          if (mat.aoMap && mat.aoMapIntensity === undefined) mat.aoMapIntensity = 1;
                      }

                      if (newMapsList.hasOwnProperty('alphaMap') && newMapsList.alphaMap !== "existing") {
                          const nextAlpha = loadedMaps.alphaMap || null;
                          if (mat.alphaMap !== nextAlpha) mat.alphaMap = nextAlpha;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.alphaMap = newMapsList.alphaMap;
                      }

                      if (newMapsList.hasOwnProperty('emissiveMap') && newMapsList.emissiveMap !== "existing") {
                          const nextEmissive = loadedMaps.emissiveMap || null;
                          if (mat.emissiveMap !== nextEmissive) mat.emissiveMap = nextEmissive;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.emissiveMap = newMapsList.emissiveMap;
                      }
                      
                      mat.needsUpdate = true;
                  }
             };

             if (Array.isArray(child.material)) {
                 child.material.forEach(apply);
             } else {
                 apply(child.material);
             }
         }
    });

  }, [materialSettings?.maps, scene, selectedMaterial, modelName]);

  // 0.6. Sync UI with Selected Material (Fetch existing values)


  // 0.5 Detect Current Texture on Selection Change
  useEffect(() => {
      if (!scene || !onTextureIdentified) return;

      if (!selectedMaterial || (modelName && selectedMaterial.name === modelName) || selectedMaterial.name === "Scene") {
          onTextureIdentified(null);
          return;
      }
      
      const targetParentGroup = selectedMaterial.parentGroup;
      if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") {
          onTextureIdentified(null);
          return;
      }
      if (selectedMaterial.isGroup && selectedMaterial.name !== modelName && selectedMaterial.name !== "Scene") {
          onTextureIdentified(null);
          return;
      }

      const targetMatName = selectedMaterial.name;
      
      let foundMat = null;

      // Find the material to check its userData
      scene.traverse((child) => {
          if (foundMat) return;
          if (child.isMesh && child.material) {
              const check = (m) => {
                  if (foundMat) return;
                  
                  let match = false;
                  match = m.name === targetMatName;
                  
                  if (match) {
                      foundMat = m;
                  }
              };

              if (Array.isArray(child.material)) {
                  child.material.forEach(check);
              } else {
                  check(child.material);
              }
          }
      });

      if (foundMat && foundMat.userData && foundMat.userData.appliedTextureId) {
          if (typeof onTextureIdentified === 'function') onTextureIdentified(foundMat.userData.appliedTextureId);
      } else {
          if (typeof onTextureIdentified === 'function') onTextureIdentified(null);
      }

      // Sync Manual Maps or Original Model Maps back to UI (Detected but not re-applied)
      if (foundMat) {
          if (foundMat.userData && foundMat.userData.manualMaps) {
              if (typeof onUpdateMaterialSetting === 'function') {
                  onUpdateMaterialSetting('maps', foundMat.userData.manualMaps);
              }
          } else {
              // Extract current visual state for the UI checkmarks
              const nativeMaps = {};
              if (foundMat.map) nativeMaps.map = "existing";
              if (foundMat.normalMap) nativeMaps.normalMap = "existing";
              if (foundMat.roughnessMap) nativeMaps.roughnessMap = "existing";
              if (foundMat.metalnessMap) nativeMaps.metalnessMap = "existing";
              if (foundMat.bumpMap) nativeMaps.bumpMap = "existing";
              if (foundMat.aoMap) nativeMaps.aoMap = "existing";

              if (typeof onUpdateMaterialSetting === 'function') {
                  onUpdateMaterialSetting('maps', nativeMaps);
              }
          }
      } else {
          if (typeof onUpdateMaterialSetting === 'function') {
              onUpdateMaterialSetting('maps', {});
          }
      }

  }, [selectedMaterial, scene, onTextureIdentified, onUpdateMaterialSetting, modelName]);
  
  // 1. Initial Setup: Centering, Scaling, Stats, Material Naming
  useLayoutEffect(() => {
    if (!scene) return;

    // Reset position and scale to calculate true bounding box
    scene.position.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    let targetScale = 1;

    if (maxDim > 0) {
        targetScale = 3 / maxDim;
    }

    setScale(targetScale);

    const centeredX = -center.x * targetScale;
    const centeredZ = -center.z * targetScale;
    const bottomY = -box.min.y * targetScale; // Align bottom of model to y=0
     
    setPosition([centeredX, bottomY, centeredZ]);

    // Stats & Material Naming
    let vertCount = 0;
    let polyCount = 0;
    const processedMaterials = new Map();
    const usedNames = new Set();
    let unnamedCount = 1;

    const groupMap = new Map(); // GroupName -> Set<MaterialName>
    const ungroupedMats = new Set();

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Geometry Stats
        const geom = child.geometry;
        if (geom) {
          const newGeom = child.geometry;
          // Recalculate normals for smooth shading on original geometry (preserving UV seams)
          newGeom.computeVertexNormals();
          // Compute tangents for smooth normal mapping if UVs exist and they don't already exist
          if (newGeom.attributes.uv && !newGeom.attributes.tangent) {
              try { newGeom.computeTangents(); } catch(e) {}
          }
          if (newGeom.attributes.normal) newGeom.attributes.normal.needsUpdate = true;

          // AUTO-UNWRAP: If model has no UVs, apply default Box Mapping immediately
          if (!newGeom.attributes.uv) {
              applyBoxUV(child);
          }

          vertCount += newGeom.attributes.position.count;
          if (newGeom.index) {
            polyCount += newGeom.index.count / 3;
          } else {
            polyCount += newGeom.attributes.position.count / 3;
          }
        }
        
        // Material Naming & Grouping logic
        if (child.material) {
            
            // Determine Group Name
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

                    // Force smooth shading and ensure both sides are visible
                    m.flatShading = false;
                    m.side = THREE.DoubleSide;
                    if (m.needsUpdate !== undefined) m.needsUpdate = true;

                    // Ensure original data is stored for visibility/UI logic
                    if (!m.userData.originalColor) m.userData.originalColor = m.color.clone();
                    if (m.userData.originalOpacity === undefined) m.userData.originalOpacity = m.opacity;
                    if (m.map) m.userData.originalMap = m.map;
                }

                // Add to Group or Ungrouped
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

    // Filter Ungrouped Materials
    const allGroupedMaterialNames = new Set();
    groupMap.forEach((matSet) => {
        matSet.forEach(name => allGroupedMaterialNames.add(name));
    });

    for (const name of ungroupedMats) {
        if (allGroupedMaterialNames.has(name)) {
            ungroupedMats.delete(name);
        }
    }

    // Construct Structured List
    const structuredList = [];
    
    // Add Groups
    const sortedGroups = Array.from(groupMap.keys()).sort();
    sortedGroups.forEach(grp => {
        structuredList.push({
            group: grp,
            materials: Array.from(groupMap.get(grp)).sort()
        });
    });

    if (ungroupedMats.size > 0) {
        if (structuredList.length > 0) {
             structuredList.push({
                 group: "Ungrouped",
                 materials: Array.from(ungroupedMats).sort()
             });
        }
    }
    
    if (structuredList.length === 0) {
         if (typeof setMaterialList === 'function') setMaterialList(Array.from(ungroupedMats).sort());
    } else {
         if (ungroupedMats.size > 0 && !structuredList.find(x => x.group === "Ungrouped")) {
             structuredList.push({
                 group: "Models", // Better name than Ungrouped
                 materials: Array.from(ungroupedMats).sort()
             });
         }
         if (typeof setMaterialList === 'function') setMaterialList(structuredList);
    }


    if (typeof setModelStats === 'function') {
        setModelStats({
            vertexCount: vertCount.toLocaleString(),
            polygonCount: Math.round(polyCount).toLocaleString(),
            materialCount: processedMaterials.size,
            dimensions: `${Math.round(size.x * 100) / 100} X ${Math.round(size.y * 100) / 100} X ${Math.round(size.z * 100) / 100} unit`
        });
    }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // 2. Wireframe Update Effect
  useLayoutEffect(() => {
      if (!scene) return;
      scene.traverse((child) => {
          if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.wireframe = wireframe);
              } else {
                  child.material.wireframe = wireframe;
              }
          }
      });
  }, [scene, wireframe]);

  // 3. Material Highlight Effect
  useEffect(() => {
    if (!scene) return;
    
    const timeouts = [];

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetParentGroup = selectedMaterial ? selectedMaterial.parentGroup : null;
    const isGroup = selectedMaterial ? selectedMaterial.isGroup : false;
    
    const isThisModelGroup = targetName === modelName;
    const isScene = targetName === "Scene";

    let modelIsActive = true;
    if (targetParentGroup && targetParentGroup !== modelName) modelIsActive = false;
    if (isGroup && !isThisModelGroup && !isScene) modelIsActive = false;
    
    const isFullModelSelect = isScene || isThisModelGroup;

    const FLASH_COLOR = new THREE.Color("#ff0000"); // Red
    const FLASH_INTENSITY = 1.5;
    const HIGHLIGHT_INTENSITY_LOW = 0.5;

    const groupMaterials = (isGroup && selectedMaterial.materials) ? selectedMaterial.materials : [];

    const processHighlight = (m) => {
        if (!m.emissive) return;

        let isTarget = false;
        if (modelIsActive) {
             if (isFullModelSelect) {
                  isTarget = true;
             } else if (isGroup) {
                  isTarget = groupMaterials.includes(m.name);
             } else {
                  isTarget = m.name === targetName;
             }
        }

        if (isTarget) {
            // Only capture original state if we aren't already in a flash cycle
            if (!m.userData.isFlashing) {
                if (m.emissive && typeof m.emissive.clone === 'function') {
                    m.userData.originalEmissive = m.emissive.clone();
                    m.userData.originalIntensity = m.emissiveIntensity;
                }
            }
            
            m.userData.isFlashing = true;
            m.emissive.copy(FLASH_COLOR);
            m.emissiveIntensity = FLASH_INTENSITY; 

            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = HIGHLIGHT_INTENSITY_LOW;
            }, 150));

            timeouts.push(setTimeout(() => {
                    if (selectedMaterial && selectedMaterial.name === targetName) m.emissiveIntensity = FLASH_INTENSITY;
            }, 300));

            const hasOriginal = m.userData.originalEmissive && typeof m.userData.originalEmissive.clone === 'function';
            
            timeouts.push(setTimeout(() => {
                    const hasOriginal = m.userData.originalEmissive && typeof m.userData.originalEmissive.clone === 'function';
                    if (hasOriginal) {
                        m.emissive.copy(m.userData.originalEmissive);
                        m.emissiveIntensity = m.userData.originalIntensity;
                    } else if (m.emissive) {
                        if (typeof m.emissive.set === 'function') m.emissive.set(0, 0, 0); 
                        else m.emissive.setRGB(0, 0, 0);
                        m.emissiveIntensity = 0; 
                    }
                    m.userData.isFlashing = false;
            }, 450));

        } else {
            // If another material is selected, instantly restore this one's original state if it was flashing
            if (m.userData.isFlashing && m.userData.originalEmissive) {
                m.emissive.copy(m.userData.originalEmissive);
                m.emissiveIntensity = m.userData.originalIntensity;
                m.userData.isFlashing = false;
            }
        }
    };

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(processHighlight);
            } else {
                 processHighlight(child.material);
            }
        }
    });

    return () => timeouts.forEach(clearTimeout);
  }, [scene, selectedMaterial, modelName]);

  // 3.5. Apply Material Settings (Factor Adjustment)
  // 4. Determine Transform Target
  const [transformTarget, setTransformTarget] = useState(null);
  
  // Use Ref to access latest selection inside effects without triggering them
  const selectedMaterialRef = React.useRef(selectedMaterial);
  selectedMaterialRef.current = selectedMaterial;

  // 3.5. Apply Material Settings (Factor Adjustment - Scope Aware)
  // 3.5. New Approach: Split Load (Selection -> UI) and Apply (UI -> Material)

  // Use a ref to access the sync function without triggering effects
  const onUpdateMaterialSettingRef = React.useRef(onUpdateMaterialSetting);
  useEffect(() => {
      onUpdateMaterialSettingRef.current = onUpdateMaterialSetting;
  });

  // A. Load Settings when Selection Changes
  useEffect(() => {
      if (!scene) return;

      const selMat = selectedMaterial;
      const targetMatName = selMat ? selMat.name : modelName;
      const targetParentGroup = selMat ? selMat.parentGroup : null;
      
      if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") return;
      if (selMat && selMat.isGroup && targetMatName !== modelName && targetMatName !== "Scene") return;

      const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

      // Helper via ref
      const safeUpdate = (key, val) => {
           if (onUpdateMaterialSettingRef.current) {
               onUpdateMaterialSettingRef.current(key, val, true); // true = sync from model
           }
      };

      let foundMat = null;
      if (isFullModel) {
          scene.traverse((child) => {
              if (foundMat) return;
              if (child.isMesh && child.material) {
                   foundMat = Array.isArray(child.material) ? child.material[0] : child.material;
              }
          });
      } else {
          scene.traverse((child) => {
              if (foundMat) return;
              if (child.isMesh && child.material) {
                  const m = Array.isArray(child.material) ? child.material[0] : child.material;
                  if (m.name === targetMatName) {
                      foundMat = m;
                  }
              }
          });
      }

      if (foundMat) {
           const m = foundMat;
           if (m.opacity !== undefined) safeUpdate('alpha', Math.round(m.opacity * 100));
           
            if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                 if (m.metalness !== undefined) safeUpdate('metallic', Math.round(m.metalness * 100));
                 if (m.roughness !== undefined) safeUpdate('roughness', Math.round(m.roughness * 100));
                 if (m.envMapIntensity !== undefined) safeUpdate('reflection', Math.round(m.envMapIntensity * 50));
                 if (m.aoMapIntensity !== undefined) safeUpdate('ao', Math.round(m.aoMapIntensity * 100));
                 
                 // Sync Intensity Values
                 safeUpdate('colorIntensity', 100); 
                 if (m.emissiveIntensity !== undefined) {
                     safeUpdate('emissiveIntensity', Math.round(m.emissiveIntensity * 100));
                 }
            }

           if (m.normalMap && m.normalScale) safeUpdate('normal', Math.round(m.normalScale.x * 100));
           if (m.bumpMap && m.bumpScale !== undefined) safeUpdate('bump', Math.round(m.bumpScale * 100));

           if (m.map) {
               safeUpdate('scale', Math.round(m.map.repeat.x * 100));
               safeUpdate('scaleY', Math.round(m.map.repeat.y * 100));
               safeUpdate('rotation', Math.round(m.map.rotation * (180/Math.PI)));
               safeUpdate('offset', { x: m.map.offset.x, y: m.map.offset.y });
           }

            if (m.color && typeof m.color.getHexString === 'function') {
                safeUpdate('color', '#' + m.color.getHexString());
            }

            // Sync applied texture info if available
            if (m.userData.appliedTexture) {
                safeUpdate('appliedTexture', m.userData.appliedTexture);
            } else {
                safeUpdate('appliedTexture', null);
            }
      }
      
      const sig = `${modelName || ''}_${selectedMaterial ? (selectedMaterial.uuid || selectedMaterial.name) : 'FULL'}`;
      setSyncedSelectionSignature(sig);

  }, [selectedMaterial, scene, modelName]); 
// Removed onUpdateMaterialSetting from dependencies


  // B. Apply Settings when UI changes (or initially applied)
  useEffect(() => {
    if (!scene || !materialSettings) return;

    // Use a simpler guard to ensure we don't apply settings 
    // to the "General" scene before a specific material is actually chosen.
    const selMat = selectedMaterial; 
    const targetMatName = selMat ? selMat.name : null;
    
    // Only apply global settings if "Scene" or the model itself is explicitly selected.
    // This prevents wiping out the model's original material look immediately upon loading.
    const isFullModel = (targetMatName === modelName || targetMatName === "Scene");
    
    // Still don't apply anything if there's no selection at all.
    if (!targetMatName) return; 

    // Safety: ensure materialSettings properties exist before use
    const alphaVal = (materialSettings && typeof materialSettings.alpha === 'number') ? materialSettings.alpha : 100;
    const alpha = alphaVal / 100;
    const metallic = (materialSettings.metallic ?? 0) / 100;
    const roughness = (materialSettings.roughness ?? 50) / 100;
    const normalScale = (materialSettings.normal ?? 100) / 100;
    const bumpScale = (materialSettings.bump ?? 100) / 100;
    const color = materialSettings.color;

    const targetParentGroup = selMat ? selMat.parentGroup : null;

    if (targetParentGroup && targetParentGroup !== modelName && targetParentGroup !== "Scene") return;
    if (selMat && selMat.isGroup && targetMatName && targetMatName !== modelName && targetMatName !== "Scene") return;

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            
            mats.forEach(m => {
                let isMatch = false;
                if (!isFullModel) {
                     isMatch = m.name === targetMatName;
                } else {
                     isMatch = true; 
                }

                if (isMatch && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshPhongMaterial)) {
                    // 1. Color & Intensity
                    if (color && m.color && typeof m.color.set === 'function') {
                        const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                        const finalColor = new THREE.Color(color);
                        finalColor.multiplyScalar(intensity);
                        m.color.copy(finalColor);
                    }

                    // 2. Emissive
                    if (m.emissive && typeof m.emissive.set === 'function' && !m.userData.isFlashing) {
                        const emissiveCol = materialSettings.emissiveColor || '#ffffff';
                        const emissiveInt = (materialSettings.emissiveIntensity ?? 0) / 100;
                        m.emissive.set(emissiveCol);
                        m.emissiveIntensity = emissiveInt;
                    }

                    // 3. Transparency
                    m.transparent = alpha < 0.999 || (m.userData.originalOpacity !== undefined && m.userData.originalOpacity < 1);
                    m.opacity = alpha;
                    m.depthWrite = alpha > 0.999;
                    
                    // 4. Factors (Standard / Physical)
                    if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
                        m.metalness = metallic;
                        m.roughness = roughness;
                        
                        // Reflection & AO
                        const reflection = (materialSettings.reflection ?? 50) / 50; 
                        const aoIntensity = (materialSettings.ao ?? 100) / 100;
                        m.envMapIntensity = reflection;
                        if (m.aoMap) m.aoMapIntensity = aoIntensity;

                        // Physical Material specific refinements
                        if (m.isMeshPhysicalMaterial) {
                            const spec = (materialSettings.specular ?? 50) / 100;
                            // Specular Intensity
                            if (m.specularIntensity !== undefined) m.specularIntensity = spec;
                            // Clearcoat for extra gloss (Softness)
                            if (m.clearcoat !== undefined) m.clearcoat = (materialSettings.softness ?? 50) / 100;
                        }
                    }

                    // 5. Phong Specific (if used)
                    if (m.isMeshPhongMaterial) {
                        m.shininess = (1 - roughness) * 100;
                        if (m.specular && typeof m.specular.setScalar === 'function') {
                             m.specular.setScalar((materialSettings.specular ?? 50) / 100);
                        }
                    }
                    
                    // General properties
                    m.flatShading = false;
                    m.side = THREE.DoubleSide;
                    
                    // Detail Maps (Normal / Bump)
                    if (m.normalMap) {
                        m.normalScale.set(normalScale, normalScale);
                        // Ensure geometry has tangents for normal mapping to work correctly
                        const geom = child.geometry;
                        if (geom && !geom.attributes.tangent && geom.computeTangents) {
                            try { geom.computeTangents(); } catch(e) { console.warn("Tangent compute failed", e); }
                        }
                    }
                    if (m.bumpMap) {
                        m.bumpScale = bumpScale;
                    }
                    
                    m.needsUpdate = true;

                    // Handle Texture Removal (Undo/Redo support)
                    // If the material has an applied texture from gallery but settings say it shouldn't
                    const configTextureId = materialSettings.appliedTexture?.id || null;
                    const matTextureId = m.userData.appliedTextureId || null;

                    if (matTextureId && !configTextureId && (isMatch || isFullModel)) {
                         // Configuration says no texture, but material has one. Strip it!
                         m.map = null;
                         m.normalMap = null;
                         m.roughnessMap = null;
                         m.metalnessMap = null;
                         m.aoMap = null;
                         m.bumpMap = null;
                         delete m.userData.appliedTexture;
                         delete m.userData.appliedTextureId;
                         
                         // Re-restore original if it exists
                         if (m.userData.originalMap) {
                             m.map = m.userData.originalMap;
                         }
                         m.needsUpdate = true;
                    }

                    // Apply texture transformations (scale, offset, rotation).
                    // We allow this for specific materials, OR for the full model IF a texture was applied via the gallery.
                    const isGalleryTexture = !!m.userData.appliedTextureId;
                    
                    if (!isFullModel || isGalleryTexture) {
                        const texScaleX = materialSettings.scale !== undefined ? materialSettings.scale / 100 : 1;
                        const texScaleY = materialSettings.scaleY !== undefined ? materialSettings.scaleY / 100 : texScaleX;
                        const texRotation = materialSettings.rotation !== undefined ? (materialSettings.rotation * (Math.PI / 180)) : 0;
                        const texOffset = materialSettings.offset || { x: 0, y: 0 };
                        
                        [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.bumpMap, m.alphaMap, m.emissiveMap].forEach(tex => {
                            if (tex) {
                                tex.wrapS = THREE.RepeatWrapping;
                                tex.wrapT = THREE.RepeatWrapping;

                                tex.repeat.set(texScaleX, texScaleY);
                                tex.center.set(0.5, 0.5);
                                tex.rotation = texRotation;
                                
                                if (texOffset) {
                                    tex.offset.set(texOffset.x, texOffset.y);
                                }
                                tex.needsUpdate = true;
                            }
                        });
                    }

                    // Restore original map if it exists and no custom texture is applied
                    if (!m.userData.appliedTextureId && m.userData.originalMap && !m.map) {
                        m.map = m.userData.originalMap;
                        m.needsUpdate = true;
                    }
                    
                    if (!m.userData.originalColor) {
                        m.userData.originalColor = m.color.clone();
                    }

                    m.needsUpdate = true;
                }
            });
        }
    });
  }, [scene, materialSettings, modelName, selectedMaterial, resetKey, syncedSelectionSignature]);

  // C. Handle overall visibility
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            let isHidden = false;
            if (hiddenMaterials) {
                if (Array.isArray(child.material)) {
                    isHidden = child.material.some(m => hiddenMaterials.has(m.name));
                } else {
                    isHidden = hiddenMaterials.has(child.material.name);
                }
            }
            child.visible = !isHidden;
        }
    });
  }, [scene, hiddenMaterials]);

  // Sync transformValues (from UI) to Object
  useEffect(() => {
      if (!transformTarget || !transformValues || !transformValues.position || !transformValues.rotation || !transformValues.scale) return;
      
      // Apply position
      transformTarget.position.set(
          transformValues.position.x, 
          transformValues.position.y, 
          transformValues.position.z
      );
      
      // Apply rotation
      transformTarget.rotation.set(
          transformValues.rotation.x, 
          transformValues.rotation.y, 
          transformValues.rotation.z
      );
      
      // Apply scale
      transformTarget.scale.set(
          transformValues.scale.x, 
          transformValues.scale.y, 
          transformValues.scale.z
      );
      
  }, [transformTarget, 
      transformValues?.position?.x, transformValues?.position?.y, transformValues?.position?.z, 
      transformValues?.rotation?.x, transformValues?.rotation?.y, transformValues?.rotation?.z,
      transformValues?.scale?.x, transformValues?.scale?.y, transformValues?.scale?.z]);

  useEffect(() => {
    if (!scene) return;

    const targetName = selectedMaterial ? selectedMaterial.name : null;
    const targetUuid = selectedMaterial ? selectedMaterial.uuid : null;
    const targetParentGroup = selectedMaterial ? selectedMaterial.parentGroup : null;
    const isGroup = selectedMaterial ? selectedMaterial.isGroup : false;
    
    if (targetParentGroup && targetParentGroup !== modelName) {
        setTransformTarget(null);
        return;
    }
    if (isGroup && targetName !== modelName && targetName !== "Scene") {
        setTransformTarget(null);
        return;
    }

    if (!targetName || targetName === "Scene") {
        setTransformTarget(null);
        return;
    }

    // Default to Full Model (modelGroup) if Model Name selected
    if (targetName === modelName) {
        if (modelGroup) {
            setTransformTarget(modelGroup);
            
            // Ensure UI stays in sync with Full Model transform
            if (typeof onTransformChange === 'function') {
                 if (!modelGroup.userData.originalTransform) {
                       modelGroup.userData.originalTransform = {
                            position: modelGroup.position.clone(),
                            rotation: modelGroup.rotation.clone(),
                            scale: modelGroup.scale.clone()
                       };
                 }
                 onTransformChange({
                    position: modelGroup.position,
                    rotation: modelGroup.rotation,
                    scale: modelGroup.scale,
                    original: modelGroup.userData.originalTransform
                });
            }
        }
        return;
    }

    // Priority 0: Group Selection
    if (selectedMaterial?.isGroup) {
        let groupObj = null;
        scene.traverse((child) => {
            if (groupObj) return;
            if (child.isGroup && child.name === targetName) {
                groupObj = child;
            }
        });
        
        if (groupObj) {
            setTransformTarget(groupObj);
            return; 
        }
    }

    // Otherwise, try to find the mesh with the selected material
    let foundMesh = null;

    // Priority 1: UUID Match
    if (targetUuid) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.uuid === targetUuid) {
                foundMesh = child;
            }
        });
    }

    // Priority 2: Name Match
    if (!foundMesh) {
        scene.traverse((child) => {
            if (foundMesh) return;
            if (child.isMesh && child.material) {
                 const m = child.material;
                 if (Array.isArray(m)) {
                     if (m.some(mat => mat.name === targetName)) foundMesh = child;
                 } else {
                     if (m.name === targetName) foundMesh = child;
                 }
            }
        });
    }

    // We use the mesh as-is for the target without shifting its geometry to avoid jumping issues.

    setTransformTarget(foundMesh || modelGroup);
    
    // Update transform values initially
    if (typeof onTransformChange === 'function') {
        const target = foundMesh || modelGroup;
        if (target) {
             // Store original transform if not present (for both ModelGroup and Meshes)
             if (!target.userData.originalTransform) {
                   target.userData.originalTransform = {
                        position: target.position.clone(),
                        rotation: target.rotation.clone(),
                        scale: target.scale.clone()
                   };
             }
             
             onTransformChange({
                position: target.position,
                rotation: target.rotation,
                scale: target.scale,
                original: target.userData.originalTransform
            });
        }
    }
  }, [scene, selectedMaterial, modelName, onTransformChange, modelGroup]);

  // 5. Scene-Wide Reset Effect
  useEffect(() => {
    if (sceneResetTrigger > 0 && scene) {
        // Reset all individual meshes that have been moved
        scene.traverse((child) => {
             if (child.userData && child.userData.originalTransform) {
                 const original = child.userData.originalTransform;
                 child.position.copy(original.position);
                 child.rotation.copy(original.rotation);
                 child.scale.copy(original.scale);
             }
        });

        // Reset the main model group wrapper if it was moved
        if (modelGroup && modelGroup.userData && modelGroup.userData.originalTransform) {
             const original = modelGroup.userData.originalTransform;
             modelGroup.position.copy(original.position);
             modelGroup.rotation.copy(original.rotation);
             modelGroup.scale.copy(original.scale);
        }
        
        // Force update of TransformControls if active
        // Logic handled by parent re-render mostly, but if using internal ref, useful
    }
  }, [sceneResetTrigger, scene, modelGroup]);

  // 6. UV Unwrap Logic (Auto Default)
  const applyBoxUV = (mesh) => {
      if (!mesh.geometry) return;
      
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();
      
      const { min, max } = geometry.boundingBox;
      const range = new THREE.Vector3().subVectors(max, min);
      if(range.x === 0) range.x = 1;
      if(range.y === 0) range.y = 1;
      if(range.z === 0) range.z = 1;

      const posAttribute = geometry.attributes.position;
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const normalAttribute = geometry.attributes.normal;

      const uvAttribute = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);
      
      for (let i = 0; i < posAttribute.count; i++) {
          const x = posAttribute.getX(i);
          const y = posAttribute.getY(i);
          const z = posAttribute.getZ(i);
          
          const nx = Math.abs(normalAttribute.getX(i));
          const ny = Math.abs(normalAttribute.getY(i));
          const nz = Math.abs(normalAttribute.getZ(i));
          
          let u = 0, v = 0;

          if (nx >= ny && nx >= nz) {
              u = (z - min.z) / range.z;
              v = (y - min.y) / range.y;
          } else if (ny >= nx && ny >= nz) {
              u = (x - min.x) / range.x;
              v = (z - min.z) / range.z;
          } else {
              u = (x - min.x) / range.x;
              v = (y - min.y) / range.y;
          }
          
          uvAttribute.setXY(i, u, v);
      }
      
      geometry.setAttribute('uv', uvAttribute);
      geometry.attributes.uv.needsUpdate = true;
      
      if (geometry.hasAttribute('tangent') && geometry.computeTangents) {
           geometry.computeTangents();
      }
  };

  useEffect(() => {
    if (scene && uvUnwrapTrigger > 0) {
        const targetMatName = selectedMaterial ? selectedMaterial.name : null;
        const isFullModel = !targetMatName || (modelName && targetMatName === modelName);
        const isGroup = selectedMaterial?.isGroup;
        const groupMats = selectedMaterial?.materials || [];


        let modifiedAny = false;
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                let shouldApply = false;
                
                if (isFullModel) {
                    shouldApply = true;
                } else {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    
                    if (isGroup) {
                         shouldApply = mats.some(m => groupMats.includes(m.name));
                    } else {
                         shouldApply = mats.some(m => m.name === targetMatName);
                    }
                }
                
                if (shouldApply) {
                    applyBoxUV(child);
                    modifiedAny = true;
                }
            }
        });

        if (modifiedAny) {
            // Since UV unwrapping changes geometry attributes (permanent till reload), 
            // we treat it as a state change for the history.
            // We'll push a snapshot of current settings.
            if (typeof onUpdateMaterialSetting === 'function') {
                // Trigger a dummy update to force a history push if needed, 
                // but since this is geometry, we just want a checkpoint.
                onUpdateMaterialSetting('uvUnwrap', Date.now(), false);
            }
        }
    }
  }, [uvUnwrapTrigger, scene, selectedMaterial, modelName, onUpdateMaterialSetting]);


  return (
    <>
         {transformMode && transformTarget && (
              <TransformControls 
                 key={transformTarget.uuid}
                 object={transformTarget} 
                 mode={transformMode} 
                 size={0.8} 
                 space="local" 
                 onChange={() => {
                     if (typeof onTransformChange === 'function' && transformTarget) {
                         onTransformChange({
                             position: transformTarget.position,
                             rotation: transformTarget.rotation,
                             scale: transformTarget.scale
                         });
                     }
                 }}
                 onMouseUp={typeof onTransformEnd === 'function' ? onTransformEnd : undefined}
              />
         )}
        <group ref={setModelGroup}>
            <primitive 
                object={scene} 
                scale={scale} 
                position={position} 
                onClick={(e) => {
                    e.stopPropagation();
                        if (!isSelectionDisabled && typeof onSelectMaterial === 'function' && e.object.material) {
                            let mat = e.object.material;
                            if (Array.isArray(mat)) {
                                if (e.face && e.face.materialIndex !== undefined) {
                                     mat = mat[e.face.materialIndex];
                                } else {
                                     mat = mat[0];
                                }
                            }
                            if (mat && mat.name) {
                                onSelectMaterial({ name: mat.name, uuid: e.object.uuid, parentGroup: modelName });
                            }
                        }
                }}

            />
        </group>
    </>
  );
}));

export default GenericModel;
