import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

// --- Authentic Blender-style Silhouette Outline with 100% Native Lighting Preservation ---
// Native WebGL forward render ensures lighting, shadows, and HDRI reflections are 100% constant,
// while OutlinePass draws the authentic 2D silhouette outline directly on top of the canvas.
export default function MeshSelectionHighlight({ target }) {
    const { gl, camera, size } = useThree();

    const targetSignature = useMemo(() => {
        if (!target) return '';
        const rawList = Array.isArray(target) ? target : [target];
        return rawList.map(m => m?.uuid || '').sort().join(',');
    }, [target]);

    // Collect all unique meshes belonging to the target
    const meshes = useMemo(() => {
        if (!target) return [];
        const rawList = Array.isArray(target) ? target : [target];
        const result = [];
        const seen = new Set();

        rawList.forEach((item) => {
            if (!item) return;
            if ((item.isMesh || item.isSkinnedMesh) && item.visible !== false) {
                if (!seen.has(item.uuid)) {
                    seen.add(item.uuid);
                    result.push(item);
                }
            } else if (item.traverse) {
                item.traverse((child) => {
                    if ((child.isMesh || child.isSkinnedMesh) && child.geometry && child.visible !== false) {
                        if (!seen.has(child.uuid)) {
                            seen.add(child.uuid);
                            result.push(child);
                        }
                    }
                });
            }
        });
        return result;
    }, [targetSignature]);

    // Dedicated lightweight proxy scene containing ONLY the selected mesh(es)
    const selectionData = useMemo(() => {
        if (meshes.length === 0) return null;
        const selScene = new THREE.Scene();
        const proxies = [];

        meshes.forEach((mesh) => {
            if (!mesh || !mesh.geometry) return;
            let proxy;
            if (mesh.isSkinnedMesh && mesh.skeleton) {
                proxy = new THREE.SkinnedMesh(mesh.geometry);
                proxy.skeleton = mesh.skeleton;
                proxy.bindMatrix = mesh.bindMatrix;
                proxy.bindMatrixInverse = mesh.bindMatrixInverse;
            } else {
                proxy = new THREE.Mesh(mesh.geometry);
            }
            proxy.matrixAutoUpdate = false;
            proxy.matrixWorldAutoUpdate = false;
            proxy.matrixWorld.copy(mesh.matrixWorld);
            proxy.frustumCulled = false;
            proxy.visible = true;

            selScene.add(proxy);
            proxies.push({ proxy, source: mesh });
        });

        return {
            selScene,
            proxies,
            proxyObjects: proxies.map((p) => p.proxy),
        };
    }, [meshes]);

    const outlinePassRef = useRef(null);

    useEffect(() => {
        if (!gl || !selectionData) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.floor(size.width * dpr);
        const height = Math.floor(size.height * dpr);

        const outlinePass = new OutlinePass(
            new THREE.Vector2(width, height),
            selectionData.selScene,
            camera
        );

        outlinePass.downSampleRatio = 1;
        const outlineColor = new THREE.Color("#ec5137");
        outlinePass.visibleEdgeColor.copy(outlineColor);
        outlinePass.hiddenEdgeColor.set(0, 0, 0); // No hidden edge ghosting through solid geometry
        outlinePass.edgeThickness = 1.8;
        outlinePass.edgeStrength = 5.0;
        outlinePass.edgeGlow = 0.0;
        outlinePass.selectedObjects = selectionData.proxyObjects;
        outlinePass.renderToScreen = false;

        // Use alpha blending to overlay outline directly onto native canvas
        if (outlinePass.overlayMaterial) {
            outlinePass.overlayMaterial.blending = THREE.CustomBlending;
            outlinePass.overlayMaterial.blendSrc = THREE.SrcAlphaFactor;
            outlinePass.overlayMaterial.blendDst = THREE.OneMinusSrcAlphaFactor;
            outlinePass.overlayMaterial.toneMapped = false;
            outlinePass.overlayMaterial.fragmentShader = `
        varying vec2 vUv;
        uniform sampler2D maskTexture;
        uniform sampler2D edgeTexture1;
        uniform sampler2D edgeTexture2;
        uniform float edgeStrength;
        uniform float edgeGlow;

        void main() {
          vec4 edgeValue1 = texture2D(edgeTexture1, vUv);
          vec4 edgeValue2 = texture2D(edgeTexture2, vUv);
          vec4 maskColor = texture2D(maskTexture, vUv);
          vec4 edgeValue = edgeValue1 + edgeValue2 * edgeGlow;
          vec4 finalColor = edgeStrength * maskColor.r * edgeValue;
          
          float maxChannel = max(finalColor.r, max(finalColor.g, finalColor.b));
          float alpha = clamp(maxChannel, 0.0, 1.0);
          vec3 rgb = maxChannel > 0.001 ? (finalColor.rgb / maxChannel) : vec3(0.925, 0.318, 0.216);
          
          gl_FragColor = vec4(rgb, alpha);
        }
      `;
            outlinePass.overlayMaterial.needsUpdate = true;
        }

        outlinePassRef.current = outlinePass;

        return () => {
            try {
                outlinePass.dispose();
            } catch (_) { }
            outlinePassRef.current = null;
        };
    }, [gl, camera, selectionData]);

    // Keep resolution updated on resize
    useEffect(() => {
        if (outlinePassRef.current) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.floor(size.width * dpr);
            const height = Math.floor(size.height * dpr);
            outlinePassRef.current.setSize(width, height);
            outlinePassRef.current.resolution.set(width, height);
        }
    }, [size.width, size.height]);

    // Render Loop: Native forward render + direct silhouette overlay
    useFrame((state, delta) => {
        // 1. Native Three.js scene render: 100% identical lighting, exposure, tone mapping & HDRI reflection!
        state.gl.render(state.scene, state.camera);

        // 2. Direct silhouette outline overlay on top of canvas (zero effect on scene lights)
        if (outlinePassRef.current && selectionData && selectionData.proxies.length > 0) {
            for (let i = 0; i < selectionData.proxies.length; i++) {
                const { proxy, source } = selectionData.proxies[i];
                if (source && proxy) {
                    proxy.matrixWorld.copy(source.matrixWorld);
                    proxy.visible = source.visible !== false;
                }
            }

            outlinePassRef.current.render(state.gl, null, null, delta, false);
        }
    }, 1);

    return null;
}
