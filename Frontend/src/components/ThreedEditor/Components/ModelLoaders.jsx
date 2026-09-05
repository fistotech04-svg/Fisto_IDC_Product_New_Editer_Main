import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader as StdlibGLTFLoader } from 'three-stdlib';
import initOCCT from "occt-import-js";

import GenericModel from "./GenericModel";
import { LoadingSpinner } from "./GlobalLoader";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

// Safe GLTFLoader patch to prevent "Cannot set properties of undefined (setting 'isBone')" crashes on corrupted skin joints
function applySafeGLTFPatch(LoaderClass) {
  if (!LoaderClass || !LoaderClass.prototype || LoaderClass.prototype._isBonePatched) return;
  LoaderClass.prototype._isBonePatched = true;
  const originalParse = LoaderClass.prototype.parse;

  LoaderClass.prototype.parse = function (data, path, onLoad, onError) {
    this.register((parser) => {
      const proto = Object.getPrototypeOf(parser);
      if (proto && !proto._isBoneMarkDefsPatched) {
        proto._isBoneMarkDefsPatched = true;
        const originalMarkDefs = proto._markDefs;

        proto._markDefs = function () {
          // Pre-sanitize skins and nodeDefs so joints never point to undefined
          const nodeDefs = this.json.nodes || [];
          const skinDefs = this.json.skins || [];

          for (let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
            const skin = skinDefs[skinIndex];
            if (skin && skin.joints && Array.isArray(skin.joints)) {
              skin.joints = skin.joints.filter((nodeIdx) => {
                if (typeof nodeIdx === 'number' && nodeDefs[nodeIdx]) {
                  nodeDefs[nodeIdx].isBone = true;
                  return true;
                }
                return false;
              });
            }
          }

          // Call the original Three.js _markDefs safely
          if (typeof originalMarkDefs === 'function') {
            try {
              originalMarkDefs.call(this);
            } catch (err) {
              console.warn("[SafeGLTF] Handled non-fatal notice in _markDefs:", err.message || err);
            }
          }
        };
      }

      return {
        name: "SafeSkinLoaderPlugin",
        beforeRoot: () => {
          try {
            const json = parser.json;
            if (json && json.skins && Array.isArray(json.skins)) {
              const nodeDefs = json.nodes || [];
              json.skins.forEach((skin) => {
                if (skin && skin.joints && Array.isArray(skin.joints)) {
                  skin.joints = skin.joints.filter((j) => typeof j === 'number' && nodeDefs[j] !== undefined);
                }
              });
            }
          } catch (e) {}
        }
      };
    });

    return originalParse.call(this, data, path, onLoad, onError);
  };
}

applySafeGLTFPatch(GLTFLoader);
applySafeGLTFPatch(StdlibGLTFLoader);

// Safe TransformControls patch to prevent "Cannot read properties of undefined (reading 'updateMatrixWorld')" during cloning
import { TransformControls as StdlibTransformControls } from 'three-stdlib';
import { TransformControls as ThreeTransformControls } from 'three/examples/jsm/controls/TransformControls.js';

[StdlibTransformControls, ThreeTransformControls].forEach((TC) => {
  if (TC && TC.prototype && !TC.prototype._isSafeUpdateMatrixWorld) {
    TC.prototype._isSafeUpdateMatrixWorld = true;
    const orig = TC.prototype.updateMatrixWorld;
    TC.prototype.updateMatrixWorld = function (force) {
      if (!this.camera) return;
      return orig.call(this, force);
    };
  }
});

// Safe SkinnedMesh patch to prevent "Cannot read properties of undefined (reading 'matrixWorld')" in Box3 / applyBoneTransform
if (THREE.SkinnedMesh && THREE.SkinnedMesh.prototype && !THREE.SkinnedMesh.prototype._isMatrixWorldPatched) {
  THREE.SkinnedMesh.prototype._isMatrixWorldPatched = true;
  
  const origApplyBoneTransform = THREE.SkinnedMesh.prototype.applyBoneTransform;
  THREE.SkinnedMesh.prototype.applyBoneTransform = function (index, vector) {
    try {
      if (!this.skeleton || !this.skeleton.bones || this.skeleton.bones.length === 0) {
        return vector;
      }
      return origApplyBoneTransform.call(this, index, vector);
    } catch (err) {
      return vector;
    }
  };

  const origComputeBoundingBox = THREE.SkinnedMesh.prototype.computeBoundingBox;
  THREE.SkinnedMesh.prototype.computeBoundingBox = function () {
    try {
      if (this.skeleton && Array.isArray(this.skeleton.bones) && this.skeleton.bones.length > 0) {
        for (let i = 0; i < this.skeleton.bones.length; i++) {
          const b = this.skeleton.bones[i];
          if (b && !b.matrixWorld) b.updateMatrixWorld(true);
        }
        origComputeBoundingBox.call(this);
      } else {
        if (this.geometry) {
          this.geometry.computeBoundingBox();
          this.boundingBox = this.geometry.boundingBox ? this.geometry.boundingBox.clone() : new THREE.Box3();
        }
      }
    } catch (e) {
      if (this.geometry) {
        if (!this.geometry.boundingBox) this.geometry.computeBoundingBox();
        this.boundingBox = this.geometry.boundingBox ? this.geometry.boundingBox.clone() : new THREE.Box3();
      }
    }
  };
}

// URL Resolver Helper
const resolveUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    return resolveUploadsPath(url);
};

// GLB Loader Component
export const GLBModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const { scene, animations } = useGLTF(resolvedUrl);
  const displayScene = useMemo(() => {
    if (!scene) return null;
    const cloned = SkeletonUtils.clone(scene);
    // Prefer useGLTF animations, fall back to scene.animations
    const srcAnimations = (animations && animations.length > 0) ? animations : (scene.animations || []);
    // Deep-clone each AnimationClip so this instance owns its tracks
    cloned.animations = srcAnimations.map(a => a.clone());
    cloned.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = false;
      }
    });
    console.log(`[GLBModel] Loaded ${cloned.animations.length} animation clip(s) from`, resolvedUrl);
    return cloned;
  }, [scene, animations, resolvedUrl]);

  return <GenericModel ref={ref} scene={displayScene} animations={displayScene?.animations} {...props} />;
});

// OBJ Loader Component
export const OBJModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const scene = useLoader(OBJLoader, resolvedUrl);
  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);
  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// FBX Loader Component
export const FBXModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const fbx = useLoader(FBXLoader, resolvedUrl);
  const displayScene = useMemo(() => {
    if (!fbx) return null;
    const cloned = SkeletonUtils.clone(fbx);
    const clonedAnimations = (fbx.animations && fbx.animations.length > 0)
      ? fbx.animations.map(a => a.clone())
      : [];
    cloned.animations = clonedAnimations;
    cloned.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.frustumCulled = false;
      }
    });
    return cloned;
  }, [fbx]);
  return <GenericModel ref={ref} scene={displayScene} animations={displayScene?.animations || fbx?.animations} {...props} />;
});

// STL Loader Component
export const STLModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const geom = useLoader(STLLoader, resolvedUrl);
  
  const scene = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ 
          color: 'gray',
          name: 'STL Material'
      });
      const mesh = new THREE.Mesh(geom, mat);
      const group = new THREE.Group();
      group.add(mesh);
      return group;
  }, [geom]);

  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);

  return <GenericModel ref={ref} scene={displayScene} {...props} />;
});

// STEP Loader Component
// STEP Loader Component
export const StepModel = React.forwardRef(({ url, ...props }, ref) => {
    const [scene, setScene] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadStep() {
            THREE.DefaultLoadingManager.itemStart(url);
            try {
                setLoading(true);
                
                // 1. Fetch file buffer
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                
                if (!isMounted) {
                    THREE.DefaultLoadingManager.itemEnd(url);
                    return;
                }

                // 2. Initialize OCCT
                const occt = await initOCCT({
                    locateFile: (name) => {
                        return '/occt-import-js.wasm'; 
                    }
                });

                // 3. Read STEP file
                const fileData = new Uint8Array(buffer);
                const result = occt.ReadStepFile(fileData, null);

                if (!result || !result.meshes || result.meshes.length === 0) {
                     throw new Error("No meshes found in STEP file.");
                }

                // 4. Convert to Three.js
                const group = new THREE.Group();
                
                // Track material counts for naming
                let matIndex = 1;

                for (const meshData of result.meshes) {
                    const geometry = new THREE.BufferGeometry();
                    
                    // Attributes
                    if (meshData.attributes.position) {
                        geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
                    }
                    if (meshData.attributes.normal) {
                        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
                    }
                    if (meshData.attributes.uv) {
                        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.attributes.uv.array, 2));
                    }
                    
                    // Index
                    if (meshData.index) {
                        geometry.setIndex(new THREE.Uint16BufferAttribute(meshData.index.array, 1));
                    }

                    // Compute vital geometry data
                    geometry.computeBoundingBox();
                    geometry.computeBoundingSphere();
                    
                    if (!meshData.attributes.normal) {
                         geometry.computeVertexNormals();
                    }

                    // Bake rotation removed to fix orientation issue

                    // Material
                    let color = '#a0a0a0';
                    const suffix = String(matIndex++).padStart(2, '0');
                    let matName = `Material_${suffix}`; 
                    
                    if (meshData.name) {
                        matName = `${meshData.name}_Mat`;
                    }
                    
                    if (!matName) matName = `Material_${suffix}`;

                    if (meshData.color) {
                         const c = meshData.color;
                         color = new THREE.Color(c[0], c[1], c[2]);
                    }
                    
                    const material = new THREE.MeshStandardMaterial({ 
                        color: color,
                        roughness: 0.5,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                        name: matName 
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    if (meshData.name) mesh.name = meshData.name;
                    
                    group.add(mesh);
                }

                group.updateMatrixWorld(true);

                if (isMounted) {
                    setScene(group);
                }

            } catch (err) {
                console.error("STEP Load Error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    THREE.DefaultLoadingManager.itemEnd(url);
                }
            }
        }

        loadStep();
        return () => { isMounted = false; };
    }, [url]);

    if (loading || !scene) return null; // Or return loading indicator inside canvas?

    return <GenericModel ref={ref} scene={scene} {...props} />;
});

// Helper component to choose the right model component
const RenderModel = React.forwardRef(({ type, url, ...props }, ref) => {
    if (!url) return null;
    
    switch(type) {
        case 'obj': return <OBJModel ref={ref} url={url} {...props} />;
        case 'fbx': return <FBXModel ref={ref} url={url} {...props} />;
        case 'stl': return <STLModel ref={ref} url={url} {...props} />;
        case 'step': return <StepModel ref={ref} url={url} {...props} />;
        default: return <GLBModel ref={ref} url={url} {...props} />;
    }
});

export default RenderModel;
