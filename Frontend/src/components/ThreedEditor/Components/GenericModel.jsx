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
  const activeTextureRef = React.useRef(selectedTexture);
  activeTextureRef.current = selectedTexture;


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
     if (selectedTexture.maps.displacementMap) newMaps.displacementMap = loadMap(selectedTexture.maps.displacementMap, false);
     if (selectedTexture.maps.aoMap) newMaps.aoMap = loadMap(selectedTexture.maps.aoMap, false);
     
     const selMat = selectedMaterial; 
     const targetMatName = selMat ? selMat.name : null;

     const isFullModelSelect = !targetMatName || (modelName && targetMatName === modelName) || targetMatName === "Scene";

     scene.traverse((child) => {
          if (child.isMesh && child.material) {
              const apply = (mat) => {
                   if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial && !mat.isMeshPhongMaterial) return;
                   
                   let isMatch = false;
                   if (!isFullModelSelect) {
                       isMatch = mat.name === targetMatName;
                   } else {
                       isMatch = true; 
                   }
                   
                    if (isMatch) {
                        // Forcefully replace maps (clearing old ones if new one doesn't exist)
                        mat.map = newMaps.map || null;
                        mat.normalMap = newMaps.normalMap || null;
                        mat.aoMap = newMaps.aoMap || null;
                        mat.displacementMap = newMaps.displacementMap || null;
                        if (mat.displacementMap && mat.displacementScale === undefined) mat.displacementScale = 0.01; 
                        
                        // Use normal map as bump map if no bump map is provided to allow bump scale adjustment
                        mat.bumpMap = newMaps.normalMap || null;
                        if (mat.bumpMap && !mat.bumpScale) mat.bumpScale = 1;
                       
                        // Clear any ongoing flash and reset emissive
                        mat.userData.isFlashing = false;
                        if (mat.emissive && typeof mat.emissive.set === 'function') {
                            mat.emissive.set(0, 0, 0);
                            mat.emissiveIntensity = 0;
                        }

                        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.isMeshPhongMaterial) {
                            mat.roughnessMap = newMaps.roughnessMap || null;
                            mat.metalnessMap = newMaps.metalnessMap || null;

                            // Reset factors to 1.0 for full map influence if maps are present
                            if (newMaps.roughnessMap) mat.roughness = 1.0;
                            if (newMaps.metalnessMap && mat.metalness !== undefined) mat.metalness = 1.0;
                            
                            // Reset color to white so diffuse map is not tinted
                            // We do this for all common materials that support diffuse maps
                            if (newMaps.map && mat.color && typeof mat.color.set === 'function') {
                                mat.color.set(0xffffff);
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
  }, [selectedTexture, scene, selectedMaterial, modelName, onTextureApplied, onTextureIdentified]);

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
    if (newMapsList.displacementMap) loadedMaps.displacementMap = loadMap(newMapsList.displacementMap, false);
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
                      const hasDispUpdate = newMapsList.hasOwnProperty('displacementMap') && newMapsList.displacementMap !== "existing";

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
                      
                      if (hasDispUpdate) {
                          const nextDisp = loadedMaps.displacementMap || null;
                          if (mat.displacementMap !== nextDisp) mat.displacementMap = nextDisp;
                          if (!mat.userData.manualMaps) mat.userData.manualMaps = {};
                          mat.userData.manualMaps.displacementMap = newMapsList.displacementMap;
                          if (mat.displacementMap && mat.displacementScale === undefined) mat.displacementScale = 0.01;
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

      // Helper to extract URL from a Three.js Texture
      const getTexUrl = (tex) => {
          if (!tex || !tex.image) return "existing";
          if (tex.image.src && (tex.image.src.startsWith('http') || tex.image.src.startsWith('blob:') || tex.image.src.startsWith('data:'))) {
              return tex.image.src;
          }
          if (tex.image instanceof HTMLCanvasElement) return tex.image.toDataURL();
          return "existing";
      };

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
              const applied = foundMat.userData.appliedTexture;
              const aMaps = applied?.maps || {};

              if (foundMat.map) nativeMaps.map = getTexUrl(foundMat.map);
              if (foundMat.normalMap) nativeMaps.normalMap = getTexUrl(foundMat.normalMap);
              if (foundMat.roughnessMap) nativeMaps.roughnessMap = getTexUrl(foundMat.roughnessMap);
              if (foundMat.metalnessMap) nativeMaps.metalnessMap = getTexUrl(foundMat.metalnessMap);
              if (foundMat.displacementMap) nativeMaps.displacementMap = getTexUrl(foundMat.displacementMap);
              if (foundMat.aoMap) nativeMaps.aoMap = getTexUrl(foundMat.aoMap);

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
          // Recalculate normals ONLY if they are missing
          if (!newGeom.attributes.normal) {
              newGeom.computeVertexNormals();
          }
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

                    // Ensure both sides are visible
                    m.side = THREE.DoubleSide;

                    // Ensure original data is stored for visibility/UI logic
                    if (!m.userData.originalColor) m.userData.originalColor = m.color?.clone();
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

    const FLASH_COLOR = new THREE.Color("#ff0000"); // Red blink
    const FLASH_INTENSITY = 2.5; // High intensity for "opacity" (glow)
    const HIGHLIGHT_INTENSITY_LOW = 0; 

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

            // Triple Blink Sequence
            // 1st Blink: On (0ms)
            m.emissive.copy(FLASH_COLOR);
            m.emissiveIntensity = FLASH_INTENSITY; 

            // 1st Blink: Off (100ms)
            timeouts.push(setTimeout(() => {
                if (m.userData.isFlashing) m.emissiveIntensity = 0;
            }, 100));

            // 2nd Blink: On (200ms)
            timeouts.push(setTimeout(() => {
                if (m.userData.isFlashing) {
                    if (m.emissive) m.emissive.copy(FLASH_COLOR);
                    m.emissiveIntensity = FLASH_INTENSITY;
                }
            }, 200));

            // 2nd Blink: Off (300ms)
            timeouts.push(setTimeout(() => {
                if (m.userData.isFlashing) m.emissiveIntensity = 0;
            }, 300));

            // 3rd Blink: On (400ms)
            timeouts.push(setTimeout(() => {
                if (m.userData.isFlashing) {
                    if (m.emissive) m.emissive.copy(FLASH_COLOR);
                    m.emissiveIntensity = FLASH_INTENSITY;
                }
            }, 400));

            // 3rd Blink: Off & Final Reset (500ms)
            timeouts.push(setTimeout(() => {
                    if (m.emissive) {
                        if (typeof m.emissive.set === 'function') m.emissive.set(1, 1, 1); 
                        else m.emissive.setRGB(1, 1, 1);
                    }
                    m.emissiveIntensity = 0; 
                    
                    // Sync back to UI
                    if (onUpdateMaterialSettingRef.current) {
                        onUpdateMaterialSettingRef.current('emissiveColor', '#ffffff', true);
                        onUpdateMaterialSettingRef.current('emissiveIntensity', 0, true);
                    }
                    
                    m.userData.isFlashing = false;
            }, 500)); 

        } else {
            // If another material is selected, instantly restore this one's original state if it was flashing
            if (m.userData.isFlashing) {
                if (m.emissive) {
                    if (typeof m.emissive.set === 'function') m.emissive.set(1, 1, 1);
                    else m.emissive.setRGB(1, 1, 1);
                }
                m.emissiveIntensity = 0;
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
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";

    let foundMat = null;
    if (!isFullModel) {
        scene.traverse((child) => {
            if (foundMat) return;
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                for (const m of materials) {
                    if (m.name === targetMatName) {
                        foundMat = m;
                        break;
                    }
                }
            }
        });
    } else {
        // For Full Model, we take properties from the first material found as a baseline
        scene.traverse((child) => {
            if (foundMat) return;
            if (child.isMesh && child.material) {
                 foundMat = Array.isArray(child.material) ? child.material[0] : child.material;
            }
        });
    }

    if (foundMat) {
        const m = foundMat;

        const safeUpdate = (key, val) => {
            // Do not sync emissive properties to UI while the material is flashing red/white
            // to avoid overwriting user settings with temporary highlight colors.
            if (m.userData.isFlashing && (key === 'emissiveColor' || key === 'emissiveIntensity')) return;
            
            if (onUpdateMaterialSettingRef.current) {
                onUpdateMaterialSettingRef.current(key, val, true); // true = sync from model
            }
        };

        // Sync basic properties
        if (m.color && typeof m.color.getHexString === 'function') {
            safeUpdate('color', '#' + m.color.getHexString());
        }
        
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            safeUpdate('metallic', Math.round((m.metalness || 0) * 100));
            safeUpdate('roughness', Math.round((m.roughness || 0) * 100));
        } else if (m.isMeshPhongMaterial) {
            safeUpdate('metallic', Math.round((m.shininess || 0) / 100 * 100));
            safeUpdate('roughness', 0);
        }

        if (m.opacity !== undefined) {
            safeUpdate('alpha', Math.round(m.opacity * 100));
        }

        // Sync intensity and emissive
        safeUpdate('colorIntensity', 100); 
        if (m.emissiveIntensity !== undefined) {
            safeUpdate('emissiveIntensity', Math.round(m.emissiveIntensity * 100));
        }
        if (m.emissive && typeof m.emissive.getHexString === 'function') {
            safeUpdate('emissiveColor', '#' + m.emissive.getHexString());
        }

        // Sync scales - ensure symmetry with Apply effect
        if (m.normalMap && m.normalScale) {
            safeUpdate('normal', Math.round(m.normalScale.x * 100));
        }
        
        // Bump/Disp scale sync
        if (m.displacementMap && m.displacementScale !== undefined) {
            safeUpdate('bump', Math.round(m.displacementScale * 100));
        } else if (m.bumpMap && m.bumpScale !== undefined) {
            safeUpdate('bump', Math.round(m.bumpScale / 10 * 100));
        }

        // Texture transformations
        const tex = m.map || m.normalMap || m.roughnessMap;
        if (tex) {
            safeUpdate('scale', Math.round(tex.repeat.x * 100));
            safeUpdate('rotation', Math.round(tex.rotation * (180 / Math.PI)));
            safeUpdate('offset', { x: tex.offset.x * 100, y: tex.offset.y * 100 });
        }

        // Sync applied texture info if available
        if (m.userData.appliedTexture) {
            safeUpdate('appliedTexture', m.userData.appliedTexture);
        } else {
            safeUpdate('appliedTexture', null);
        }
    }

    // Capture signature to allow B effect to run safely
    const sig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    setSyncedSelectionSignature(sig);

  }, [selectedMaterial, scene, modelName]); 

  // B. Apply Settings when UI changes
  useEffect(() => {
    if (!scene || !materialSettings) return;

    const selMat = selectedMaterial; 
    const targetMatName = selMat ? selMat.name : (modelName || "Scene");
    
    // Guard: Prevent applying stale material settings if the selection has changed 
    // but the UI hasn't synced with the model's current state yet.
    const currentSig = `${modelName || ''}_${selMat ? (selMat.uuid || selMat.name) : 'FULL'}`;
    if (syncedSelectionSignature && syncedSelectionSignature !== currentSig) {
        return;
    }

    const isFullModel = !selMat || targetMatName === modelName || targetMatName === "Scene";
    
    const alpha = (materialSettings.alpha ?? 100) / 100;
    const metallic = (materialSettings.metallic ?? 0) / 100;
    const roughness = (materialSettings.roughness ?? 50) / 100;
    const normalScaleVal = (materialSettings.normal ?? 100) / 100;
    const bumpScaleVal = (materialSettings.bump ?? 100) / 100;
    const color = materialSettings.color;
    const emissiveColor = materialSettings.emissiveColor || '#000000';
    const emissiveIntensity = (materialSettings.emissiveIntensity ?? 0) / 100;
    
    const texScaleX = (materialSettings.scale ?? 100) / 100;
    const texScaleY = (materialSettings.scaleY ?? materialSettings.scale ?? 100) / 100;
    const texRotation = (materialSettings.rotation ?? 0) * (Math.PI / 180);
    const texOffsetX = (materialSettings.offset?.x ?? 0) / 100;
    const texOffsetY = (materialSettings.offset?.y ?? 0) / 100;

    const galleryTexture = materialSettings.appliedTexture;
    const isGalleryTexture = !!galleryTexture;

    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            materials.forEach(m => {
                let isMatch = false;
                if (selMat && !isFullModel) {
                     if (selMat.isGroup && Array.isArray(selMat.materials)) {
                         isMatch = selMat.materials.includes(m.name);
                     } else {
                         isMatch = m.name === targetMatName;
                     }
                } else if (isFullModel) {
                     // In Full Model mode, we only apply overrides if they are explicitly enabled 
                     // or if we are applying a gallery texture. 
                     // This prevents broad clobbering of different materials on load.
                     isMatch = materialSettings.useFactorColor || isGalleryTexture;
                }

                if (isMatch) {
                    // 1. Basic Material Factors
                    if (color && m.color && typeof m.color.set === 'function') {
                        // Only apply color override if it's NOT the default black or if useFactorColor is ON,
                        // or if we are applying a gallery texture (which forces #ffffff)
                        const isDefaultBlack = color === '#000000';
                        if (!isDefaultBlack || materialSettings.useFactorColor || isGalleryTexture) {
                            const intensity = (materialSettings.colorIntensity ?? 100) / 100;
                            const finalColor = new THREE.Color(color);
                            finalColor.multiplyScalar(intensity);
                            m.color.copy(finalColor);
                        }
                    }

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
                            if (m.specularIntensity !== undefined) m.specularIntensity = spec;
                            if (m.clearcoat !== undefined) m.clearcoat = (materialSettings.softness ?? 50) / 100;
                        }
                    }

                    m.transparent = alpha < 0.999 || (m.userData.originalOpacity !== undefined && m.userData.originalOpacity < 1);
                    m.opacity = alpha;
                    
                    if (m.emissive && typeof m.emissive.set === 'function') {
                        m.emissive.set(emissiveColor);
                        m.emissiveIntensity = emissiveIntensity;
                    }

                    // 2. Map Scales
                    if (m.normalMap && m.normalScale) {
                        m.normalScale.set(normalScaleVal, normalScaleVal);
                    }
                    if (m.displacementMap) {
                        m.displacementScale = bumpScaleVal;
                    }
                    if (m.bumpMap) {
                        m.bumpScale = bumpScaleVal * 10;
                    }

                    // 3. Texture Removal Check
                    const configTextureId = materialSettings.appliedTexture?.id || null;
                    const matTextureId = m.userData.appliedTextureId || null;

                    if (matTextureId && !configTextureId) {
                         // Texture was stripped from state (e.g. Undo), so strip from material
                         m.map = null;
                         m.normalMap = null;
                         m.roughnessMap = null;
                         m.metalnessMap = null;
                         m.aoMap = null;
                         m.displacementMap = null;
                         m.bumpMap = null;
                         delete m.userData.appliedTexture;
                         delete m.userData.appliedTextureId;

                         if (m.userData.originalMap) {
                             m.map = m.userData.originalMap;
                         }
                         m.needsUpdate = true;
                    }

                    // 4. Texture Transformations
                    // Only apply to gallery textures OR specific selection (manual uploads)
                    if (!isFullModel || isGalleryTexture) {
                        [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.displacementMap, m.bumpMap, m.alphaMap, m.emissiveMap].forEach(tex => {
                            if (tex) {
                                if (tex.repeat) tex.repeat.set(texScaleX, texScaleY);
                                if (tex.offset) tex.offset.set(texOffsetX, texOffsetY);
                                if (tex.rotation !== undefined) tex.rotation = texRotation;
                                tex.center.set(0.5, 0.5); 
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
                                onSelectMaterial({ 
                                    name: mat.name, 
                                    uuid: e.object.uuid, 
                                    parentGroup: modelName,
                                    isShift: e.shiftKey 
                                });
                            }
                        }
                }}

            />
        </group>
    </>
  );
}));

export default GenericModel;
