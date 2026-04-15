import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Texture from "../../models/Texture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addTexture = async (req, res) => {
  try {
    const { materialName, materialCategory, userEmail, maps: existingMaps } = req.body;

    if (!materialName || !materialCategory || !userEmail) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let mappedUrls = {};

    // If maps are already uploaded via chunks, they will be in req.body.maps
    if (existingMaps) {
      try {
        mappedUrls = typeof existingMaps === 'string' ? JSON.parse(existingMaps) : existingMaps;
      } catch (e) {
        return res.status(400).json({ message: "Invalid maps data" });
      }
    } else {
      // Fallback to direct file upload if not using chunks
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No texture maps uploaded" });
      }

      // Required maps check for direct upload
      const requiredMaps = ["base", "metallic", "roughness", "normal"];
      for (const map of requiredMaps) {
        if (!req.files[map]) {
          return res.status(400).json({ message: `${map} map is required` });
        }
      }

      const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
      const sanitizedMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const relativeBaseDir = `/uploads/${sanitizedEmail}/Texture/${sanitizedMaterialName}`;
      
      const mapKeys = ["preview", "base", "metallic", "roughness", "normal", "ao", "displacement", "opacity", "emissive"];
      mapKeys.forEach(key => {
        if (req.files[key]) {
          const file = req.files[key][0];
          mappedUrls[key] = `${relativeBaseDir}/${file.filename}`;
        } else {
          mappedUrls[key] = null;
        }
      });
    }

    // Verify required maps exist in mappedUrls
    const requiredMapsList = ["base", "metallic", "roughness", "normal"];
    for (const m of requiredMapsList) {
        if (!mappedUrls[m]) return res.status(400).json({ message: `Required map '${m}' is missing` });
    }

    const newTexture = new Texture({
      userEmail,
      materialName,
      materialCategory,
      maps: mappedUrls
    });

    await newTexture.save();

    res.status(201).json({
      message: "Material added successfully",
      texture: newTexture
    });
  } catch (error) {
    console.error("Error adding texture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserTextures = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "User email required" });

    const textures = await Texture.find({ userEmail: email }).sort({ createdAt: -1 });
    res.status(200).json({ textures });
  } catch (error) {
    console.error("Error fetching textures:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
