import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import PresetHdri from "../../models/PresetHdri.js";
import PresetMaterial from "../../models/PresetMaterial.js";
import DefaultModel from "../../models/DefaultModel.js";
import { uploadFileToSupabase } from "../../config/supabase.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dynamic storage for uploads in temp_uploads/presets
const tempDir = path.join(__dirname, "../../temp_uploads/presets");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadTempDir = path.join(__dirname, "../../temp_uploads/presets");
    if (!fs.existsSync(uploadTempDir)) {
      fs.mkdirSync(uploadTempDir, { recursive: true });
    }
    cb(null, uploadTempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.fieldname.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${safeName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit to accommodate 2K HDR/EXR and large 3D models
});

// Helper to ensure URLs are absolute with backend URL prefix if relative
const resolveUrl = (req, url) => {
  if (!url || typeof url !== 'string') return url;
  
  // If it's already a full Supabase CDN or Cloud storage URL, never rewrite it to the backend host
  if (url.includes('supabase.co') || url.includes('/storage/v1/object/public/')) {
    return url;
  }

  const rawProtocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  // Never force https on localhost or 127.0.0.1 as local express server runs plain HTTP
  const protocol = (/localhost|127\.0\.0\.1/i.test(host)) ? 'http' : rawProtocol;
  const backendBase = `${protocol}://${host}`;

  // If already absolute, check if it points to localhost or another domain and rewrite the origin
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('supabase.co')) return url;
      return `${backendBase}${parsed.pathname}${parsed.search}`;
    } catch (_) {
      return url;
    }
  }

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanUrl}`;
};

// Helper to upload file to Supabase or fallback to local uploads directory
// Helper to upload file to Supabase exclusively and clean up temp file
const storeUploadedFile = async (file, destFolder) => {
  const ext = path.extname(file.originalname);
  const rand = Math.random().toString(36).substring(2, 8);
  const fileName = Date.now().toString() + '_' + rand + ext;
  const relativeDest = 'presets/' + destFolder + '/' + fileName;
  try {
    const supabaseUrl = await uploadFileToSupabase(file.path, relativeDest);
    if (!supabaseUrl) {
      throw new Error('Failed to upload ' + file.originalname + ' to Supabase storage bucket');
    }
    return supabaseUrl;
  } finally {
    if (file && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
  }
};

// ==========================================
// HDRI PRESET ROUTES
// ==========================================

// @route   GET /api/presets/hdri
// @desc    Get all preset HDRIs
// @access  Public
router.get("/hdri", async (req, res) => {
  try {
    const hdris = await PresetHdri.find().sort({ order: 1, createdAt: 1 }).lean();

    const mapped = hdris.map(item => ({
      ...item,
      preview: resolveUrl(req, item.preview),
      file: resolveUrl(req, item.file)
    }));

    res.json({
      success: true,
      count: mapped.length,
      hdris: mapped
    });
  } catch (error) {
    console.error("Error fetching preset HDRIs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch preset HDRIs" });
  }
});

// @route   POST /api/presets/hdri
// @desc    Create a new preset HDRI
// @access  Admin
router.post("/hdri", upload.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, category, previewUrl, fileUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "HDRI name is required" });
    }

    let finalPreview = previewUrl || "";
    let finalFile = fileUrl || "";

    if (req.files?.preview?.[0]) {
      finalPreview = await storeUploadedFile(req.files.preview[0], "hdri_previews");
    }
    if (req.files?.file?.[0]) {
      finalFile = await storeUploadedFile(req.files.file[0], "hdri_files");
    }

    if (!finalPreview || !finalFile) {
      return res.status(400).json({
        success: false,
        message: "Both a preview image and an HDR/EXR file are required"
      });
    }

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    const count = await PresetHdri.countDocuments();

    const newHdri = new PresetHdri({
      id,
      name: name.trim(),
      category: (category && category.trim()) || "Day",
      preview: finalPreview,
      file: finalFile,
      order: count
    });

    await newHdri.save();

    res.status(201).json({
      success: true,
      message: "HDRI preset created successfully",
      hdri: {
        ...newHdri.toObject(),
        preview: resolveUrl(req, newHdri.preview),
        file: resolveUrl(req, newHdri.file)
      }
    });
  } catch (error) {
    console.error("Error creating preset HDRI:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create preset HDRI" });
  }
});

// @route   PUT /api/presets/hdri/:id
// @desc    Update a preset HDRI
// @access  Admin
router.put("/hdri/:id", upload.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, previewUrl, fileUrl, order } = req.body;

    const existing = await PresetHdri.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: "HDRI preset not found" });
    }

    if (name) existing.name = name.trim();
    if (category) existing.category = category.trim();
    if (order !== undefined) existing.order = Number(order);

    if (req.files?.preview?.[0]) {
      existing.preview = await storeUploadedFile(req.files.preview[0], "hdri_previews");
    } else if (previewUrl) {
      existing.preview = previewUrl;
    }

    if (req.files?.file?.[0]) {
      existing.file = await storeUploadedFile(req.files.file[0], "hdri_files");
    } else if (fileUrl) {
      existing.file = fileUrl;
    }

    await existing.save();

    res.json({
      success: true,
      message: "HDRI preset updated successfully",
      hdri: {
        ...existing.toObject(),
        preview: resolveUrl(req, existing.preview),
        file: resolveUrl(req, existing.file)
      }
    });
  } catch (error) {
    console.error("Error updating preset HDRI:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update preset HDRI" });
  }
});

// @route   DELETE /api/presets/hdri/:id
// @desc    Delete a preset HDRI
// @access  Admin
router.delete("/hdri/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PresetHdri.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "HDRI preset not found" });
    }
    res.json({ success: true, message: "HDRI preset deleted successfully", id });
  } catch (error) {
    console.error("Error deleting preset HDRI:", error);
    res.status(500).json({ success: false, message: "Failed to delete preset HDRI" });
  }
});

// ==========================================
// MATERIAL PRESET ROUTES
// ==========================================

// @route   GET /api/presets/materials
// @desc    Get all preset materials
// @access  Public
router.get("/materials", async (req, res) => {
  try {
    const materials = await PresetMaterial.find().sort({ order: 1, createdAt: 1 }).lean();

    const mapped = materials.map(item => {
      const maps = item.maps ? { ...item.maps } : {};
      for (const key in maps) {
        if (maps[key]) {
          maps[key] = resolveUrl(req, maps[key]);
        }
      }

      return {
        ...item,
        preview: item.preview ? resolveUrl(req, item.preview) : null,
        maps
      };
    });

    res.json({
      success: true,
      count: mapped.length,
      materials: mapped
    });
  } catch (error) {
    console.error("Error fetching preset materials:", error);
    res.status(500).json({ success: false, message: "Failed to fetch preset materials" });
  }
});

const materialUploadFields = [
  { name: 'preview', maxCount: 1 },
  { name: 'map', maxCount: 1 },
  { name: 'normalMap', maxCount: 1 },
  { name: 'roughnessMap', maxCount: 1 },
  { name: 'displacementMap', maxCount: 1 },
  { name: 'metalnessMap', maxCount: 1 },
  { name: 'aoMap', maxCount: 1 },
  { name: 'alphaMap', maxCount: 1 },
  { name: 'emissiveMap', maxCount: 1 },
  { name: 'bumpMap', maxCount: 1 },
];

// @route   POST /api/presets/materials
// @desc    Create a new preset material
// @access  Admin
router.post("/materials", upload.fields(materialUploadFields), async (req, res) => {
  try {
    const { name, category, color, metallic, roughness, alpha, maps: jsonMaps } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Material name is required" });
    }

    let parsedMaps = {};
    if (jsonMaps) {
      try {
        parsedMaps = typeof jsonMaps === 'string' ? JSON.parse(jsonMaps) : jsonMaps;
      } catch (_) {}
    }

    // Process uploaded map files
    const finalMaps = { ...parsedMaps };
    if (req.files) {
      for (const field of materialUploadFields) {
        if (field.name !== 'preview' && req.files[field.name]?.[0]) {
          finalMaps[field.name] = await storeUploadedFile(req.files[field.name][0], "material_maps");
        }
      }
    }

    let finalPreview = req.body.previewUrl || finalMaps.map || null;
    if (req.files?.preview?.[0]) {
      finalPreview = await storeUploadedFile(req.files.preview[0], "material_previews");
    }

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    const count = await PresetMaterial.countDocuments();

    const newMaterial = new PresetMaterial({
      id,
      name: name.trim(),
      category: (category && category.trim()) || "General",
      preview: finalPreview,
      maps: finalMaps,
      color: color || null,
      metallic: metallic !== undefined && metallic !== "" ? Number(metallic) : null,
      roughness: roughness !== undefined && roughness !== "" ? Number(roughness) : null,
      alpha: alpha !== undefined && alpha !== "" ? Number(alpha) : null,
      order: count
    });

    await newMaterial.save();

    const mapsWithUrls = { ...newMaterial.maps };
    for (const k in mapsWithUrls) {
      if (mapsWithUrls[k]) mapsWithUrls[k] = resolveUrl(req, mapsWithUrls[k]);
    }

    res.status(201).json({
      success: true,
      message: "Material preset created successfully",
      material: {
        ...newMaterial.toObject(),
        preview: newMaterial.preview ? resolveUrl(req, newMaterial.preview) : null,
        maps: mapsWithUrls
      }
    });
  } catch (error) {
    console.error("Error creating preset material:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create preset material" });
  }
});

// @route   PUT /api/presets/materials/:id
// @desc    Update a preset material
// @access  Admin
router.put("/materials/:id", upload.fields(materialUploadFields), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, color, metallic, roughness, alpha, maps: jsonMaps, previewUrl, order } = req.body;

    const existing = await PresetMaterial.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Material preset not found" });
    }

    if (name) existing.name = name.trim();
    if (category) existing.category = category.trim();
    if (color !== undefined) existing.color = color || null;
    if (metallic !== undefined && metallic !== "") existing.metallic = Number(metallic);
    if (roughness !== undefined && roughness !== "") existing.roughness = Number(roughness);
    if (alpha !== undefined && alpha !== "") existing.alpha = Number(alpha);
    if (order !== undefined) existing.order = Number(order);

    let parsedMaps = null;
    if (jsonMaps) {
      try {
        parsedMaps = typeof jsonMaps === 'string' ? JSON.parse(jsonMaps) : jsonMaps;
      } catch (_) {}
    }

    const currentMaps = existing.maps ? existing.maps.toObject() : {};
    const updatedMaps = { ...currentMaps, ...(parsedMaps || {}) };

    if (req.files) {
      for (const field of materialUploadFields) {
        if (field.name !== 'preview' && req.files[field.name]?.[0]) {
          updatedMaps[field.name] = await storeUploadedFile(req.files[field.name][0], "material_maps");
        }
      }
    }
    existing.maps = updatedMaps;

    if (req.files?.preview?.[0]) {
      existing.preview = await storeUploadedFile(req.files.preview[0], "material_previews");
    } else if (previewUrl !== undefined) {
      existing.preview = previewUrl;
    }

    await existing.save();

    const mapsWithUrls = { ...existing.maps };
    for (const k in mapsWithUrls) {
      if (mapsWithUrls[k]) mapsWithUrls[k] = resolveUrl(req, mapsWithUrls[k]);
    }

    res.json({
      success: true,
      message: "Material preset updated successfully",
      material: {
        ...existing.toObject(),
        preview: existing.preview ? resolveUrl(req, existing.preview) : null,
        maps: mapsWithUrls
      }
    });
  } catch (error) {
    console.error("Error updating preset material:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update preset material" });
  }
});

// @route   DELETE /api/presets/materials/:id
// @desc    Delete a preset material
// @access  Admin
router.delete("/materials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PresetMaterial.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Material preset not found" });
    }
    res.json({ success: true, message: "Material preset deleted successfully", id });
  } catch (error) {
    console.error("Error deleting preset material:", error);
    res.status(500).json({ success: false, message: "Failed to delete preset material" });
  }
});

// ==========================================
// DEFAULT 3D MODELS PRESET ROUTES
// ==========================================

// @route   GET /api/presets/models
// @desc    Get all default 3D models
// @access  Public
router.get("/models", async (req, res) => {
  try {
    const models = await DefaultModel.find().sort({ order: 1, createdAt: 1 }).lean();

    const mapped = models.map(item => ({
      ...item,
      url: resolveUrl(req, item.url),
      thumbnailUrl: item.thumbnailUrl ? resolveUrl(req, item.thumbnailUrl) : null
    }));

    res.json({
      success: true,
      count: mapped.length,
      models: mapped
    });
  } catch (error) {
    console.error("Error fetching default models:", error);
    res.status(500).json({ success: false, message: "Failed to fetch default models" });
  }
});

// @route   POST /api/presets/models
// @desc    Create a new default 3D model
// @access  Admin
router.post("/models", upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, category, description, modelUrl, thumbnailUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Model name is required" });
    }

    let finalModelUrl = modelUrl || "";
    let finalThumbnailUrl = thumbnailUrl || null;
    let fileSizeStr = "0 MB";
    let fileType = "glb";

    if (req.files?.model?.[0]) {
      const file = req.files.model[0];
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      fileSizeStr = `${mb} MB`;
      fileType = path.extname(file.originalname).replace('.', '').toLowerCase() || 'glb';
      finalModelUrl = await storeUploadedFile(file, "default_models");
    }

    if (req.files?.thumbnail?.[0]) {
      finalThumbnailUrl = await storeUploadedFile(req.files.thumbnail[0], "default_model_thumbs");
    }

    if (!finalModelUrl) {
      return res.status(400).json({
        success: false,
        message: "Either a 3D model file or a model URL is required"
      });
    }

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    const count = await DefaultModel.countDocuments();

    const newModel = new DefaultModel({
      id,
      name: name.trim(),
      category: (category && category.trim()) || "General",
      description: description || "",
      url: finalModelUrl,
      thumbnailUrl: finalThumbnailUrl,
      size: fileSizeStr,
      type: fileType,
      order: count
    });

    await newModel.save();

    res.status(201).json({
      success: true,
      message: "Default model added successfully",
      model: {
        ...newModel.toObject(),
        url: resolveUrl(req, newModel.url),
        thumbnailUrl: newModel.thumbnailUrl ? resolveUrl(req, newModel.thumbnailUrl) : null
      }
    });
  } catch (error) {
    console.error("Error creating default model:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create default model" });
  }
});

// @route   PUT /api/presets/models/:id
// @desc    Update a default 3D model
// @access  Admin
router.put("/models/:id", upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, modelUrl, thumbnailUrl, order } = req.body;

    const existing = await DefaultModel.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Default model not found" });
    }

    if (name) existing.name = name.trim();
    if (category) existing.category = category.trim();
    if (description !== undefined) existing.description = description;
    if (order !== undefined) existing.order = Number(order);

    if (req.files?.model?.[0]) {
      const file = req.files.model[0];
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      existing.size = `${mb} MB`;
      existing.type = path.extname(file.originalname).replace('.', '').toLowerCase() || existing.type;
      existing.url = await storeUploadedFile(file, "default_models");
    } else if (modelUrl) {
      existing.url = modelUrl;
    }

    if (req.files?.thumbnail?.[0]) {
      existing.thumbnailUrl = await storeUploadedFile(req.files.thumbnail[0], "default_model_thumbs");
    } else if (thumbnailUrl !== undefined) {
      existing.thumbnailUrl = thumbnailUrl;
    }

    await existing.save();

    res.json({
      success: true,
      message: "Default model updated successfully",
      model: {
        ...existing.toObject(),
        url: resolveUrl(req, existing.url),
        thumbnailUrl: existing.thumbnailUrl ? resolveUrl(req, existing.thumbnailUrl) : null
      }
    });
  } catch (error) {
    console.error("Error updating default model:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update default model" });
  }
});

// @route   DELETE /api/presets/models/:id
// @desc    Delete a default 3D model
// @access  Admin
router.delete("/models/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DefaultModel.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Default model not found" });
    }
    res.json({ success: true, message: "Default model deleted successfully", id });
  } catch (error) {
    console.error("Error deleting default model:", error);
    res.status(500).json({ success: false, message: "Failed to delete default model" });
  }
});

export default router;
