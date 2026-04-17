import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { addTexture, getUserTextures, updateTexture, deleteTexture } from "../../controllers/Texture/textureController.js";
import { getCategories, addCategory, deleteCategory, renameCategory, clearTexturesInCategory } from "../../controllers/Texture/textureCategoryController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dynamic storage for textures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { userEmail, materialName } = req.body;
    
    if (!userEmail || !materialName) {
      return cb(new Error("Email and Material Name are required for upload"));
    }

    const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
    const sanitizedMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Standardize to same root path as controller/chunks
    const uploadPath = path.join(__dirname, "../../uploads", sanitizedEmail, "Texture", sanitizedMaterialName);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { materialName } = req.body;
    const sanitizedMaterialName = materialName ? materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'texture';
    const ext = path.extname(file.originalname);
    const uniqueName = `${sanitizedMaterialName}_${file.fieldname}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per map for direct upload (if used)
});

// Configure multer for CHUNKED uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error("uploadId is required"));
    
    const tempDir = path.join(__dirname, "../../temp_uploads/textures", uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const { chunkIndex } = req.body;
    cb(null, `chunk_${chunkIndex || 0}`);
  },
});
const uploadChunk = multer({ storage: chunkStorage });

const textureUploadFields = [
  { name: 'preview', maxCount: 1 },
  { name: 'base', maxCount: 1 },
  { name: 'metallic', maxCount: 1 },
  { name: 'roughness', maxCount: 1 },
  { name: 'normal', maxCount: 1 },
  { name: 'ao', maxCount: 1 },
  { name: 'displacement', maxCount: 1 },
  { name: 'opacity', maxCount: 1 },
  { name: 'emissive', maxCount: 1 }
];

// @route   POST /api/textures/add
// Keep this for metadata and small/direct uploads if needed, or update to handle paths
router.post("/add", upload.fields(textureUploadFields), addTexture);

// @route   POST /api/textures/upload-chunk
router.post("/upload-chunk", uploadChunk.single("chunk"), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, userEmail, materialName, fieldName } = req.body;

    if (!uploadId || !userEmail || !fileName || !materialName) {
      return res.status(400).json({ message: "Missing required chunk metadata" });
    }

    const curIndex = parseInt(chunkIndex);
    const total = parseInt(totalChunks);

    // If it's the last chunk, start merging
    if (curIndex === total - 1) {
      const tempDir = path.join(__dirname, "../../temp_uploads/textures", uploadId);
      const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
      const sanitizedMaterialName = materialName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // New path: uploads/{user}/Texture/{materialName}
      const targetDir = path.join(__dirname, "../../uploads", sanitizedEmail, "Texture", sanitizedMaterialName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Ensure filename follows materialname_mapname.extension format
      const ext = path.extname(fileName);
      const uniqueFileName = `${sanitizedMaterialName}_${fieldName}${ext}`;
      const finalPath = path.join(targetDir, uniqueFileName);
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < total; i++) {
        const chunkPath = path.join(tempDir, `chunk_${i}`);
        let retry = 0;
        while(!fs.existsSync(chunkPath) && retry < 10) {
            await new Promise(r => setTimeout(r, 100));
            retry++;
        }

        if (fs.existsSync(chunkPath)) {
            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
            fs.unlinkSync(chunkPath);
        }
      }
      writeStream.end();

      writeStream.on("finish", () => {
        try {
          if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
        
        res.status(200).json({
          message: "Chunk merged successfully",
          url: `/uploads/${sanitizedEmail}/Texture/${sanitizedMaterialName}/${uniqueFileName}`,
          fieldName
        });
      });
    } else {
      res.status(200).json({ message: `Chunk ${curIndex} accepted` });
    }
  } catch (error) {
    console.error("Texture Chunk Upload Error:", error);
    res.status(500).json({ message: "Server error during chunk upload" });
  }
});

// @route   GET /api/textures/get
router.get("/get", getUserTextures);

// @route   PUT /api/textures/update/:id
router.put("/update/:id", updateTexture);

// @route   DELETE /api/textures/delete/:id
router.delete("/delete/:id", deleteTexture);

// --- Category Routes ---
// @route   GET /api/textures/categories/get
router.get("/categories/get", getCategories);

// @route   POST /api/textures/categories/add
router.post("/categories/add", addCategory);

// @route   PUT /api/textures/categories/rename/:id
router.put("/categories/rename/:id", renameCategory);

// @route   POST /api/textures/categories/clear/:id
router.post("/categories/clear/:id", clearTexturesInCategory);

// @route   DELETE /api/textures/categories/delete/:id
router.delete("/categories/delete/:id", deleteCategory);

export default router;
