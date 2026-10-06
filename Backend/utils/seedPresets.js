import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PresetHdri from "../models/PresetHdri.js";
import PresetMaterial from "../models/PresetMaterial.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

export const seedPresets = async () => {
  try {
    const hdriFilePath = path.join(__dirname, "../../Frontend/src/data/hdriData.js");
    const textureFilePath = path.join(__dirname, "../../Frontend/src/data/textureData.js");

    // 1. Seed HDRIs if needed
    if (fs.existsSync(hdriFilePath)) {
      const hdriContent = fs.readFileSync(hdriFilePath, "utf8");
      const arrayStr = hdriContent.substring(hdriContent.indexOf("["), hdriContent.lastIndexOf("]") + 1);
      const replaced = arrayStr.replace(/\$\{HDRI_BASE_URL\}/g, "/hdri");
      const hdriList = eval(replaced);

      const hdriCount = await PresetHdri.countDocuments();
      if (hdriCount === 0 || hdriCount < hdriList.length) {
        console.log(`[Seed Presets] Seeding ${hdriList.length} HDRIs into MongoDB...`);
        for (let i = 0; i < hdriList.length; i++) {
          const item = hdriList[i];
          await PresetHdri.findOneAndUpdate(
            { id: item.id },
            {
              id: item.id,
              aliases: item.aliases || [],
              name: item.name,
              category: item.category,
              preview: item.preview,
              file: item.file,
              order: i
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
        console.log(`[Seed Presets] Successfully seeded HDRIs.`);
      }
    }

    // 2. Seed Materials if needed
    if (fs.existsSync(textureFilePath)) {
      const textureContent = fs.readFileSync(textureFilePath, "utf8");
      const arrayStr = textureContent.substring(textureContent.indexOf("["), textureContent.lastIndexOf("]") + 1);
      const replaced = arrayStr.replace(/\$\{MATERIAL_BASE_URL\}/g, "/assets/materials");
      const textureList = eval(replaced);

      const materialCount = await PresetMaterial.countDocuments();
      if (materialCount === 0 || materialCount < textureList.length) {
        console.log(`[Seed Presets] Seeding ${textureList.length} Materials into MongoDB...`);
        for (let i = 0; i < textureList.length; i++) {
          const item = textureList[i];
          await PresetMaterial.findOneAndUpdate(
            { id: item.id },
            {
              id: item.id,
              name: item.name,
              category: item.category,
              preview: item.preview || null,
              maps: item.maps || {},
              color: item.color || null,
              metallic: item.metallic ?? null,
              roughness: item.roughness ?? null,
              alpha: item.alpha ?? null,
              order: i
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
        console.log(`[Seed Presets] Successfully seeded Materials.`);
      }
    }
  } catch (err) {
    console.error("[Seed Presets Error]:", err.message);
  }
};

// If run directly: node utils/seedPresets.js
if (process.argv[1] && process.argv[1].endsWith("seedPresets.js")) {
  mongoose
    .connect(mongoUri, { dbName: "Fisto_IDC" })
    .then(async () => {
      console.log("Connected to MongoDB for seeding.");
      await seedPresets();
      await mongoose.disconnect();
      console.log("Seeding completed.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding connection error:", err);
      process.exit(1);
    });
}
