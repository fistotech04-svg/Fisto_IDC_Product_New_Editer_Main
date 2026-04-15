import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import initOCCT from "occt-import-js";

import GenericModel from "./GenericModel";
import { LoadingSpinner } from "./GlobalLoader";

// URL Resolver Helper
const resolveUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;
    if (url.startsWith('/uploads')) {
        return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${url}`;
    }
    return url;
};

// GLB Loader Component
export const GLBModel = React.forwardRef(({ url, shouldClone, ...props }, ref) => {
  const resolvedUrl = resolveUrl(url);
  const { scene } = useGLTF(resolvedUrl);
  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);
  return <GenericModel ref={ref} scene={displayScene} {...props} />;
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
  const scene = useLoader(FBXLoader, resolvedUrl);
  const displayScene = useMemo(() => shouldClone ? scene.clone() : scene, [scene, shouldClone]);
  return <GenericModel ref={ref} scene={displayScene} {...props} />;
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
