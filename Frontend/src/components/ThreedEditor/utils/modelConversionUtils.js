import * as THREE from "three";
import { GLTFExporter, STLExporter, OBJLoader, FBXLoader, STLLoader } from "three-stdlib";
import { LWOLoader } from "three/examples/jsm/loaders/LWOLoader.js";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { MeshoptEncoder } from "meshoptimizer";
import initOCCT from "occt-import-js";
import axios from "axios";

// Patch GLTFExporter
if (GLTFExporter && GLTFExporter.prototype && !GLTFExporter.prototype._isSafeExporterPatched) {
  GLTFExporter.prototype._isSafeExporterPatched = true;
  const originalParse = GLTFExporter.prototype.parse;
  GLTFExporter.prototype.parse = function (input, onDone, onError, options = {}) {
    const safeOptions = { ...(options || {}) };
    if (!Array.isArray(safeOptions.animations)) {
      safeOptions.animations = [];
    }
    return originalParse.call(this, input, onDone, onError, safeOptions);
  };
}

export const convertCadToGlbBlob = async (file, ext = 'step', { setLoadingText, setSafeProgress }) => {
  const isIges = ext === 'iges' || ext === 'igs' || file.name.toLowerCase().endsWith('.iges') || file.name.toLowerCase().endsWith('.igs');
  const fileSizeMB = file.size ? (file.size / (1024 * 1024)) : 0;

  setLoadingText?.(`Reading ${isIges ? 'IGES' : 'STEP'} CAD file (${fileSizeMB > 0 ? fileSizeMB.toFixed(1) + ' MB' : ''})...`);
  setSafeProgress?.(15);
  await new Promise(r => setTimeout(r, 60));

  const buffer = await file.arrayBuffer();

  setLoadingText?.("Initializing OpenCASCADE WASM...");
  setSafeProgress?.(25);
  await new Promise(r => setTimeout(r, 60));

  const occt = await initOCCT({
    locateFile: () => '/occt-import-js.wasm'
  });

  const deflection = fileSizeMB > 10 ? 0.025 : (fileSizeMB > 3 ? 0.018 : 0.01);
  const params = {
    linearUnit: 'millimeter',
    linearDeflectionType: 'bounding_box_ratio',
    linearDeflection: deflection,
    angularDeflection: 0.65
  };

  setLoadingText?.(`Tessellating ${isIges ? 'IGES' : 'STEP'} geometry with OpenCASCADE...`);
  setSafeProgress?.(45);
  await new Promise(r => setTimeout(r, 60));

  const fileData = new Uint8Array(buffer);
  let result = null;
  try {
    result = isIges
      ? occt.ReadIgesFile(fileData, params)
      : occt.ReadStepFile(fileData, params);
  } catch (readErr) {
    console.warn("Fast CAD conversion failed:", readErr);
  }

  if (!result || !result.meshes || result.meshes.length === 0) {
    console.warn("Retrying CAD read with default parameters...");
    try {
      result = isIges
        ? occt.ReadIgesFile(fileData, null)
        : occt.ReadStepFile(fileData, null);
    } catch (fallbackErr) {
      console.error("CAD fallback read failed:", fallbackErr);
    }
  }

  if (!result || !result.meshes || result.meshes.length === 0) {
    throw new Error(`No meshes found in ${isIges ? 'IGES' : 'STEP'} file.`);
  }

  setLoadingText?.(`Processing ${result.meshes.length} geometry components...`);
  setSafeProgress?.(70);
  await new Promise(r => setTimeout(r, 60));

  const group = new THREE.Group();
  let matIndex = 1;
  const materialCache = new Map();

  for (const meshData of result.meshes) {
    const geometry = new THREE.BufferGeometry();
    if (meshData.attributes.position) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
    }
    if (meshData.attributes.normal) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
    }
    if (meshData.attributes.uv) {
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.attributes.uv.array, 2));
    }
    if (meshData.index) {
      const is32Bit = meshData.attributes.position && (meshData.attributes.position.array.length / 3) > 65535;
      geometry.setIndex(is32Bit
        ? new THREE.Uint32BufferAttribute(meshData.index.array, 1)
        : new THREE.Uint16BufferAttribute(meshData.index.array, 1));
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    if (!meshData.attributes.normal) {
      geometry.computeVertexNormals();
    }

    let colorKey = 'default';
    if (meshData.color) {
      const c = meshData.color;
      colorKey = `${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)}`;
    }

    let material = materialCache.get(colorKey);
    if (!material) {
      let color = '#a0a0a0';
      if (meshData.color) {
        const c = meshData.color;
        color = new THREE.Color(c[0], c[1], c[2]);
      }
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide,
        name: meshData.name ? `${meshData.name}_Mat` : `Material_${String(matIndex++).padStart(2, '0')}`
      });
      materialCache.set(colorKey, material);
    }

    const mesh = new THREE.Mesh(geometry, material);
    if (meshData.name) mesh.name = meshData.name;
    group.add(mesh);
  }
  group.updateMatrixWorld(true);

  setLoadingText?.("Compiling 3D model...");
  setSafeProgress?.(85);
  await new Promise(r => setTimeout(r, 60));

  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
      reject,
      { binary: true, forceIndices: true, embedImages: false, animations: [] }
    );
  });

  setSafeProgress?.(88);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const convertStepToGlbBlob = (file, helpers) => convertCadToGlbBlob(file, 'step', helpers);

export const convertObjToGlbBlob = async (file, { setLoadingText, setSafeProgress }) => {
  setLoadingText?.("Parsing OBJ model in browser...");
  setSafeProgress?.(25);
  const text = await file.text();
  const loader = new OBJLoader();
  const obj = loader.parse(text);

  setLoadingText?.("Generating GLB from OBJ model...");
  setSafeProgress?.(65);
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      obj,
      (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
      reject,
      { binary: true, embedImages: true, animations: [] }
    );
  });
  setSafeProgress?.(85);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const checkFbxLegacyVersion = async (file) => {
  if (!file || !file.name || !file.name.toLowerCase().endsWith('.fbx')) return null;
  try {
    const slice = file.slice(0, 64);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder().decode(bytes.subarray(0, 18));
    if (text.startsWith('Kaydara FBX Binary')) {
      const view = new DataView(buffer);
      const version = view.getUint32(23, true);
      if (version < 7100) {
        return version;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const convertFbxToGlbBlob = async (file, { setLoadingText, setSafeProgress }) => {
  setLoadingText?.("Parsing FBX model in browser...");
  setSafeProgress?.(25);
  const buffer = await file.arrayBuffer();

  const isolatedManager = new THREE.LoadingManager();
  isolatedManager.onError = (url) => {
    console.warn("[FBX in-browser converter] Sub-resource notice:", url);
  };

  const loader = new FBXLoader(isolatedManager);
  let fbx;
  try {
    fbx = loader.parse(buffer, '');
  } catch (parseErr) {
    console.error("[FBXLoader] Browser parse error:", parseErr);
    throw new Error(`Browser FBX parsing failed: ${parseErr.message}. If this FBX was saved in an older format (FBX 6.x or ASCII), please export as modern binary FBX (2014-2020) or GLB.`);
  }

  setLoadingText?.("Optimizing FBX geometry and materials...");
  setSafeProgress?.(55);

  const isValidTexture = (tex) => {
    if (!tex) return false;
    const img = tex.image;
    if (!img) return false;
    if (img instanceof HTMLImageElement) {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    }
    if ((img.width && img.width > 0) || (img.videoWidth && img.videoWidth > 0)) {
      return true;
    }
    if (img.data && img.data.length > 0 && img.width > 0) {
      return true;
    }
    return false;
  };

  const textureMapKeys = [
    'map', 'normalMap', 'roughnessMap', 'metalnessMap',
    'bumpMap', 'aoMap', 'emissiveMap', 'specularMap',
    'alphaMap', 'displacementMap', 'lightMap', 'envMap'
  ];

  fbx.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry && !child.geometry.attributes.normal) {
        try { child.geometry.computeVertexNormals(); } catch (e) { }
      }

      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const sanitizedMats = mats.map((m) => {
          if (!m) return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.1 });

          textureMapKeys.forEach((key) => {
            if (m[key] && !isValidTexture(m[key])) {
              m[key] = null;
            }
          });

          if (!m.isMeshStandardMaterial && !m.isMeshPhysicalMaterial) {
            return new THREE.MeshStandardMaterial({
              name: m.name || 'FBX_Material',
              color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
              map: isValidTexture(m.map) ? m.map : null,
              normalMap: isValidTexture(m.normalMap) ? m.normalMap : null,
              roughness: m.shininess ? Math.max(0.1, Math.min(1.0, 1.0 - (m.shininess / 100))) : 0.6,
              metalness: 0.1,
              transparent: m.transparent || (m.opacity < 1),
              opacity: typeof m.opacity === 'number' ? m.opacity : 1,
              side: THREE.DoubleSide
            });
          } else {
            m.side = THREE.DoubleSide;
            return m;
          }
        });

        child.material = Array.isArray(child.material) ? sanitizedMats : sanitizedMats[0];
      }
    }
  });

  setLoadingText?.("Generating GLB from FBX model...");
  setSafeProgress?.(75);

  const fbxAnimations = (fbx.animations || []).filter(a => a && Array.isArray(a.tracks) && a.tracks.length > 0);
  const exporter = new GLTFExporter();

  const runGltfExport = (options) => {
    return new Promise((resolve, reject) => {
      exporter.parse(
        fbx,
        (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
        reject,
        { animations: [], ...(options || {}) }
      );
    });
  };

  let glbBuffer;
  try {
    glbBuffer = await runGltfExport({
      binary: true,
      embedImages: true,
      animations: fbxAnimations.length > 0 ? fbxAnimations : []
    });
  } catch (animErr) {
    console.warn("[FBX Exporter] Tier 1 export notice, trying without animations:", animErr.message);
    try {
      glbBuffer = await runGltfExport({
        binary: true,
        embedImages: true,
        animations: []
      });
    } catch (texErr) {
      console.warn("[FBX Exporter] Tier 2 export notice, trying without external texture embedding:", texErr.message);
      glbBuffer = await runGltfExport({
        binary: true,
        embedImages: false,
        animations: []
      });
    }
  }

  setLoadingText?.("FBX converted to GLB successfully!");
  setSafeProgress?.(88);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const convertStlToGlbBlob = async (file, { setLoadingText, setSafeProgress }) => {
  setLoadingText?.("Parsing STL model in browser...");
  setSafeProgress?.(25);
  const buffer = await file.arrayBuffer();
  const loader = new STLLoader();
  const geom = loader.parse(buffer);
  const mat = new THREE.MeshStandardMaterial({ color: '#a0a0a0', roughness: 0.5, metalness: 0.1, name: 'STL_Material' });
  const mesh = new THREE.Mesh(geom, mat);

  setLoadingText?.("Generating GLB from STL model...");
  setSafeProgress?.(65);
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      mesh,
      (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
      reject,
      { binary: true, animations: [] }
    );
  });
  setSafeProgress?.(85);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const convertLwoToGlbBlob = async (file, { setLoadingText, setSafeProgress }) => {
  setLoadingText?.("Parsing LWO model in browser...");
  setSafeProgress?.(25);
  const buffer = await file.arrayBuffer();
  const loader = new LWOLoader();
  const lwoData = loader.parse(buffer, '', file.name.split('.')[0]);
  const group = new THREE.Group();
  if (lwoData?.meshes && Array.isArray(lwoData.meshes)) {
    lwoData.meshes.forEach(m => group.add(m));
  }
  group.updateMatrixWorld(true);

  setLoadingText?.("Generating GLB from LWO model...");
  setSafeProgress?.(65);
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
      reject,
      { binary: true, animations: [] }
    );
  });
  setSafeProgress?.(85);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const convert3dsToGlbBlob = async (file, { setLoadingText, setSafeProgress }) => {
  setLoadingText?.("Parsing 3DS model in browser...");
  setSafeProgress?.(25);
  const buffer = await file.arrayBuffer();
  const loader = new TDSLoader();
  const group = loader.parse(buffer, '');
  group.updateMatrixWorld(true);

  setLoadingText?.("Generating GLB from 3DS model...");
  setSafeProgress?.(65);
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (res) => resolve(res instanceof ArrayBuffer ? res : new TextEncoder().encode(JSON.stringify(res)).buffer),
      reject,
      { binary: true, animations: [] }
    );
  });
  setSafeProgress?.(85);
  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
};

export const convertModelViaBackend = async (file, ext, baseName, { setLoadingText, setSafeProgress, startConversionTicker, stopConversionTicker }) => {
  const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const backendUrl = rawBackendUrl.trim().replace(/\/+$/, '');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { emailId: 'guest_user' };
  const emailId = user.emailId || 'guest_user';

  const isCad = ['step', 'stp', 'iges', 'igs', 'stl'].includes(ext);
  const engineName = isCad ? "OpenCASCADE" : "Assimp";

  const CHUNK_SIZE = 5 * 1024 * 1024;
  if (file.size > 15 * 1024 * 1024) {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const uploadId = Date.now().toString() + Math.random().toString(36).substring(7);
    let lastRes = null;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);

      const uploadPct = Math.round(12 + ((chunkIndex + 1) / totalChunks) * 33);
      setLoadingText?.(`Uploading heavy ${ext.toUpperCase()} (chunk ${chunkIndex + 1}/${totalChunks})...`);
      setSafeProgress?.(uploadPct);

      const chunkFormData = new FormData();
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', chunkIndex);
      chunkFormData.append('totalChunks', totalChunks);
      chunkFormData.append('fileName', file.name);
      chunkFormData.append('emailId', emailId);
      chunkFormData.append('isConverter', 'true');
      chunkFormData.append('chunk', chunk);

      try {
        lastRes = await axios.post(`${backendUrl}/api/3d-models/upload-chunk`, chunkFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 1200000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
      } catch (chunkErr) {
        stopConversionTicker?.();
        const errMsg = chunkErr.response?.data?.message || chunkErr.message;
        const customErr = new Error(errMsg);
        customErr.response = chunkErr.response;
        throw customErr;
      }
    }

    startConversionTicker?.(ext, engineName);

    if (lastRes && lastRes.data && lastRes.data.url) {
      stopConversionTicker?.();
      setLoadingText?.(`Importing converted ${ext.toUpperCase()} model...`);
      setSafeProgress?.(78);

      const rawUrl = lastRes.data.url;
      const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
        ? rawUrl
        : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

      return {
        file: null,
        url: finalUrl,
        type: 'glb',
        name: baseName,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      };
    }
  }

  setLoadingText?.(`Uploading ${ext.toUpperCase()} model...`);
  setSafeProgress?.(12);
  const formData = new FormData();
  formData.append('model', file);
  formData.append('emailId', emailId);

  try {
    let uploadDone = false;
    const response = await axios.post(`${backendUrl}/api/3d-models/convert-model`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 1200000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const ratio = Math.min(1, progressEvent.loaded / progressEvent.total);
          const uploadProgress = Math.round(12 + ratio * 33);
          setSafeProgress?.(uploadProgress);

          if (ratio < 1) {
            setLoadingText?.(`Uploading ${ext.toUpperCase()} model...`);
          } else if (!uploadDone) {
            uploadDone = true;
            startConversionTicker?.(ext, engineName);
          }
        }
      }
    });

    stopConversionTicker?.();
    setLoadingText?.(`Importing converted ${ext.toUpperCase()} model...`);
    setSafeProgress?.(78);

    if (response.data && response.data.url) {
      const rawUrl = response.data.url;
      const finalUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
        ? rawUrl
        : `${backendUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

      return {
        file: null,
        url: finalUrl,
        type: 'glb',
        name: baseName,
        sizeInMB: response.data.sizeInMB || (file.size / (1024 * 1024)).toFixed(2)
      };
    }

    throw new Error("Conversion succeeded but no model URL was returned.");
  } catch (err) {
    stopConversionTicker?.();
    let message = err.message;
    if (err.response?.data?.message) {
      message = err.response.data.message;
    }
    throw new Error(message);
  }
};

export const convertModelFileIfNeeded = async (file, helpers) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

  const directFormats = {
    'glb': 'glb',
    'gltf': 'glb'
  };

  if (directFormats[ext]) {
    return {
      file,
      url: URL.createObjectURL(file),
      type: directFormats[ext],
      name: baseName,
      sizeInMB
    };
  }

  helpers?.setManualLoading?.(true);

  if (ext === 'step' || ext === 'stp' || ext === 'iges' || ext === 'igs') {
    try {
      const glbBlob = await convertCadToGlbBlob(file, ext, helpers);
      const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
      const glbUrl = URL.createObjectURL(glbBlob);
      return {
        file: glbFile,
        url: glbUrl,
        type: 'glb',
        name: baseName,
        sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
      };
    } catch (err) {
      console.warn(`In-browser ${ext.toUpperCase()} conversion notice, using backend OpenCASCADE:`, err.message);
      return await convertModelViaBackend(file, ext, baseName, helpers);
    }
  }

  if (ext === 'stl') {
    try {
      const glbBlob = await convertStlToGlbBlob(file, helpers);
      const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
      const glbUrl = URL.createObjectURL(glbBlob);
      return {
        file: glbFile,
        url: glbUrl,
        type: 'glb',
        name: baseName,
        sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
      };
    } catch (err) {
      console.warn("In-browser STL conversion notice, using backend OpenCASCADE:", err.message);
      return await convertModelViaBackend(file, ext, baseName, helpers);
    }
  }

  if (ext === 'fbx') {
    try {
      helpers?.setLoadingText?.("Converting FBX model to GLB with Assimp...");
      helpers?.setSafeProgress?.(20);
      return await convertModelViaBackend(file, ext, baseName, helpers);
    } catch (backendErr) {
      console.warn("Backend Assimp FBX conversion notice, inspecting fallback:", backendErr.message);

      if (backendErr.message.includes("6100") || backendErr.message.includes("legacy FBX") || backendErr.message.includes("FileVersion")) {
        throw backendErr;
      }

      try {
        const glbBlob = await convertFbxToGlbBlob(file, helpers);
        const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
        const glbUrl = URL.createObjectURL(glbBlob);
        return {
          file: glbFile,
          url: glbUrl,
          type: 'glb',
          name: baseName,
          sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2)
        };
      } catch (clientErr) {
        console.error("All FBX conversion attempts failed:", clientErr);
        const finalMsg = (backendErr.message && !backendErr.message.includes("status code"))
          ? backendErr.message
          : clientErr.message;
        throw new Error(finalMsg);
      }
    }
  }

  try {
    return await convertModelViaBackend(file, ext, baseName, helpers);
  } catch (backendErr) {
    if (ext === 'obj') {
      const glbBlob = await convertObjToGlbBlob(file, helpers);
      const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
      return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
    }
    if (ext === '3ds') {
      const glbBlob = await convert3dsToGlbBlob(file, helpers);
      const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
      return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
    }
    if (ext === 'lwo' || ext === 'low') {
      const glbBlob = await convertLwoToGlbBlob(file, helpers);
      const glbFile = new File([glbBlob], `${baseName}.glb`, { type: 'model/gltf-binary' });
      return { file: glbFile, url: URL.createObjectURL(glbBlob), type: 'glb', name: baseName, sizeInMB: (glbBlob.size / (1024 * 1024)).toFixed(2) };
    }
    throw backendErr;
  }
};
