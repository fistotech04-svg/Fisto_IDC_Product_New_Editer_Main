import express from "express";
import PresetHdri from "../../models/PresetHdri.js";
import PresetMaterial from "../../models/PresetMaterial.js";

const router = express.Router();

// Helper to ensure URLs are absolute with backend URL prefix if relative
const resolveUrl = (req, url) => {
  if (!url || typeof url !== 'string') return url;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  const backendBase = `${protocol}://${host}`;

  // If already absolute, check if it points to localhost or another domain and rewrite the origin
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      return `${backendBase}${parsed.pathname}${parsed.search}`;
    } catch (_) {
      return url;
    }
  }

  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanUrl}`;
};

// @route   GET /api/presets/hdri
// @desc    Get all preset HDRIs
// @access  Public
router.get("/hdri", async (req, res) => {
  try {
    const hdris = await PresetHdri.find().sort({ order: 1, createdAt: 1 }).lean();
    
    // Map URLs so they work dynamically across different host/backend environments
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

export default router;
