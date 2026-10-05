import * as THREE from "three";
import { resolveUploadsPath } from "../../../utils/supabaseUtils";

// Global cache and shared loader to prevent redundant network requests and decoding
// We use a private LoadingManager to avoid triggering the global useProgress spinner
export const globalTextureCache = new Map();
export const privateTextureManager = new THREE.LoadingManager();
export const sharedTextureLoader = new THREE.TextureLoader(privateTextureManager);
sharedTextureLoader.setCrossOrigin('anonymous');

// Helper to extract a usable image URL/DataURL from a Three.js texture.
// NOTE: Three.js revokes blob: URLs after GPU texture upload — NEVER return blob: URLs directly!
export const getTextureSource = (tex) => {
    if (!tex) return null;

    // Fast-path: already cached a valid data URL thumbnail
    if (tex.userData?.__thumbnailUrl) {
        const cached = tex.userData.__thumbnailUrl;
        if (cached && cached.startsWith('data:')) return cached;
    }

    // userData.url: only use for non-blob URLs (blob may already be revoked by Three.js)
    if (tex.userData?.url) {
        const u = tex.userData.url;
        if (u && typeof u === 'string' && !u.startsWith('blob:')) return u;
    }

    if (!tex.image) return 'existing';
    const img = tex.image;

    // ── Inner helper ────────────────────────────────────────────────────────────
    // Draws `source` into a 128×128 canvas and returns a JPEG data URL.
    // Returns null on any failure (SecurityError, zero dimensions, etc.).
    const tryThumbnail = (source, origW, origH) => {
        if (!origW || !origH) return null;
        try {
            const maxDim = 128;
            const scale = Math.min(1, maxDim / Math.max(origW, origH));
            const tw = Math.max(1, Math.round(origW * scale));
            const th = Math.max(1, Math.round(origH * scale));
            const canvas = document.createElement('canvas');
            canvas.width = tw;
            canvas.height = th;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(source, 0, 0, tw, th);
            const thumb = canvas.toDataURL('image/jpeg', 0.7);
            // Verify it's a real data URL (not 'data:,' which is an empty canvas)
            if (!thumb || !thumb.startsWith('data:image')) return null;
            tex.userData = tex.userData || {};
            tex.userData.__thumbnailUrl = thumb;
            return thumb;
        } catch (_) {
            return null;
        }
    };

    // 1. DataTexture / raw Uint8 pixel data
    if (img.data && (img.data instanceof Uint8Array || img.data instanceof Uint8ClampedArray)) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            try {
                const maxDim = 128;
                const scale = Math.min(1, maxDim / Math.max(origW, origH));
                const tw = Math.max(1, Math.round(origW * scale));
                const th = Math.max(1, Math.round(origH * scale));
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = origW;
                tempCanvas.height = origH;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    const imgData = tempCtx.createImageData(origW, origH);
                    imgData.data.set(img.data);
                    tempCtx.putImageData(imgData, 0, 0);
                    const canvas = document.createElement('canvas');
                    canvas.width = tw;
                    canvas.height = th;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(tempCanvas, 0, 0, tw, th);
                        const thumb = canvas.toDataURL('image/jpeg', 0.7);
                        tex.userData = tex.userData || {};
                        tex.userData.__thumbnailUrl = thumb;
                        return thumb;
                    }
                }
            } catch (_) { }
        }
        return 'existing';
    }

    // 2. ImageBitmap — has width/height but NO .src
    if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
        return 'existing';
    }

    // 3. HTMLCanvasElement (some loaders set the image to a canvas directly)
    if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
        const origW = img.width || 0;
        const origH = img.height || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
        return 'existing';
    }

    // ── 4. HTMLImageElement / HTMLVideoElement — has .src or .currentSrc ─────────
    // IMPORTANT: blob: URLs from Three.js may already be revoked after GPU upload.
    // NEVER return a blob: URL directly — always generate a thumbnail instead.
    if ('src' in img || 'currentSrc' in img) {
        const srcUrl = img.src || img.currentSrc || '';
        // Use naturalWidth/naturalHeight: these remain valid after blob revocation
        // because the image data is decoded in-memory in the element.
        const origW = img.naturalWidth || img.width || img.videoWidth || 0;
        const origH = img.naturalHeight || img.height || img.videoHeight || 0;

        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }

        // Only return the URL directly if it's a safe non-revokable URL:
        // - data: URIs are embedded data, never revoked
        // - http: URLs are permanent network URLs
        // - blob: URLs are REVOKED by Three.js → never return them
        if (srcUrl.startsWith('data:') && srcUrl.length < 500000) return srcUrl;
        if (srcUrl.startsWith('http') || srcUrl.startsWith('//')) return srcUrl;

        // blob: URLs or unknown — signal existence without returning a broken URL
        return 'existing';
    }

    // 5. Generic fallback: try to draw whatever img is into a canvas
    try {
        const origW = img.width || img.naturalWidth || img.videoWidth || 0;
        const origH = img.height || img.naturalHeight || img.videoHeight || 0;
        if (origW && origH) {
            const thumb = tryThumbnail(img, origW, origH);
            if (thumb) return thumb;
        }
    } catch (_) { }

    return 'existing';
};

// Safe helper to compute tangents without throwing or logging errors on non-indexed or attribute-deficient geometries
export const safeComputeTangents = (geometry) => {
    if (!geometry || !geometry.isBufferGeometry || !geometry.attributes) return;
    if (geometry.attributes.tangent) return;

    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    if (!pos || !uv || pos.count === 0 || uv.count === 0) return;

    if (!geometry.attributes.normal) {
        try { geometry.computeVertexNormals(); } catch (_) { return; }
    }
    if (!geometry.attributes.normal) return;

    // Synthesize sequential indices for non-indexed triangle meshes so computeTangents can calculate per-triangle tangents
    if (!geometry.index) {
        const count = pos.count;
        if (count && count >= 3 && count % 3 === 0) {
            try {
                const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
                for (let i = 0; i < count; i++) indices[i] = i;
                geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            } catch (_) {
                return;
            }
        } else {
            return;
        }
    }

    if (geometry.index && geometry.attributes.position && geometry.attributes.normal && geometry.attributes.uv) {
        try {
            geometry.computeTangents();
        } catch (_) { }
    }
};

// Safe Matrix3 and Matrix4 copy patches to prevent "Cannot read properties of undefined (reading 'elements')" in Three.js WebGLMaterials refreshTransformUniform
if (THREE.Matrix3 && THREE.Matrix3.prototype && !THREE.Matrix3.prototype._isSafeCopyPatched) {
    THREE.Matrix3.prototype._isSafeCopyPatched = true;
    const originalMatrix3Copy = THREE.Matrix3.prototype.copy;
    THREE.Matrix3.prototype.copy = function (m) {
        if (!m || !m.elements) {
            return this.identity();
        }
        return originalMatrix3Copy.call(this, m);
    };
}

if (THREE.Matrix4 && THREE.Matrix4.prototype && !THREE.Matrix4.prototype._isSafeCopyPatched) {
    THREE.Matrix4.prototype._isSafeCopyPatched = true;
    const originalMatrix4Copy = THREE.Matrix4.prototype.copy;
    THREE.Matrix4.prototype.copy = function (m) {
        if (!m || !m.elements) {
            return this.identity();
        }
        return originalMatrix4Copy.call(this, m);
    };
}

// Upgrades MeshStandardMaterial to MeshPhysicalMaterial so specularIntensity and dynamic specular highlights work
export const ensurePhysicalMaterial = (mat) => {
    if (!mat) return mat;
    if (mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
        const phys = new THREE.MeshPhysicalMaterial();

        // Use MeshStandardMaterial.prototype.copy to safely copy standard properties
        // without triggering Three.js MeshPhysicalMaterial bug where it tries to copy undefined clearcoatNormalScale
        THREE.MeshStandardMaterial.prototype.copy.call(phys, mat);

        // Safely copy physical properties only if they exist on the source
        if (mat.clearcoat !== undefined) phys.clearcoat = mat.clearcoat;
        if (mat.clearcoatRoughness !== undefined) phys.clearcoatRoughness = mat.clearcoatRoughness;
        if (mat.clearcoatNormalMap) phys.clearcoatNormalMap = mat.clearcoatNormalMap;
        if (mat.clearcoatNormalScale && mat.clearcoatNormalScale.isVector2 && phys.clearcoatNormalScale) {
            phys.clearcoatNormalScale.copy(mat.clearcoatNormalScale);
        }
        if (mat.ior !== undefined) phys.ior = mat.ior;
        if (mat.reflectivity !== undefined) phys.reflectivity = mat.reflectivity;
        if (mat.transmission !== undefined) phys.transmission = mat.transmission;

        phys.uuid = mat.uuid; // Preserve UUID for selection and indexing
        phys.name = mat.name;
        phys.userData = { ...mat.userData };
        phys.specularIntensity = (mat.userData?.originalSpecularIntensity !== undefined) ? mat.userData.originalSpecularIntensity : 1.0;
        if (phys.specularColor) phys.specularColor.setRGB(1, 1, 1);
        phys.ior = 1.5;
        phys.needsUpdate = true;
        return phys;
    }
    return mat;
};

// Applies automatic box UV unwrap to a mesh
export const applyBoxUV = (mesh) => {
    if (!mesh || !mesh.geometry) return;

    const geometry = mesh.geometry;
    geometry.computeBoundingBox();

    const { min, max } = geometry.boundingBox || { min: new THREE.Vector3(-1, -1, -1), max: new THREE.Vector3(1, 1, 1) };
    const range = new THREE.Vector3().subVectors(max, min);
    if (range.x === 0) range.x = 1;
    if (range.y === 0) range.y = 1;
    if (range.z === 0) range.z = 1;

    const posAttribute = geometry.attributes.position;
    if (!posAttribute) return;
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const normalAttribute = geometry.attributes.normal;

    const uvAttribute = geometry.attributes.uv || new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);

    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        const z = posAttribute.getZ(i);

        const nx = normalAttribute ? Math.abs(normalAttribute.getX(i)) : 0;
        const ny = normalAttribute ? Math.abs(normalAttribute.getY(i)) : 1;
        const nz = normalAttribute ? Math.abs(normalAttribute.getZ(i)) : 0;

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

    // Re-compute tangents safely if normal mapping is expected
    safeComputeTangents(geometry);
};
