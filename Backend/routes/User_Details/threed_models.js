import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import ThreedModel from "../../models/ThreedModel.js";

const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for 3D model uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { emailId } = req.body;
    if (!emailId) {
      return cb(new Error("Email ID is required"));
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userFolderPath = path.join(
      __dirname,
      "../../uploads",
      sanitizedEmail,
      "3D_Modals",
    );

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    cb(null, userFolderPath);
  },
  filename: (req, file, cb) => {
    // Keep original filename or generate a unique one? 
    // Usually better to keep name but ensure uniqueness if needed.
    // For now, let's keep it simple as requested.
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for 3D models (direct uploads)
  },
});

// Configure multer for CHUNKED uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error("uploadId is required"));
    
    const tempDir = path.join(__dirname, "../../uploads/temp", uploadId);
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

// @route   POST /api/3d-models/upload-model
// @desc    Upload a 3D model to the user's 3D_Modals folder
// @access  Public
router.post("/upload-model", (req, res) => {
  upload.single("model")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err);
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown Upload Error:", err);
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    try {
      const { emailId } = req.body;
      if (!emailId) {
        return res.status(400).json({ message: "Email ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${req.file.filename}`;
      const type = path.extname(req.file.filename).slice(1);
      const sizeStr = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

      // Save to Database
      const newModel = new ThreedModel({
        userEmail: emailId,
        name: req.file.filename,
        url: relativeUrl,
        type: type,
        size: sizeStr
      });
      await newModel.save();

      res.status(200).json({
        message: "Model uploaded successfully",
        url: relativeUrl,
        name: req.file.filename,
        type: type,
        size: sizeStr,
        modelId: newModel.modelId
      });
    } catch (error) {
      console.error("Error processing 3D model:", error);
      res.status(500).json({ message: "Server error during processing" });
    }
  });
});

// @route   POST /api/3d-models/upload-chunk
// @desc    Receive a file chunk and merge if last
// @access  Public
router.post("/upload-chunk", uploadChunk.single("chunk"), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, emailId } = req.body;

    if (!uploadId || !emailId || !fileName) {
      return res.status(400).json({ message: "Missing required chunk metadata" });
    }

    const curIndex = parseInt(chunkIndex);
    const total = parseInt(totalChunks);

    // If it's the last chunk, start merging
    if (curIndex === total - 1) {
      const tempDir = path.join(__dirname, "../../uploads/temp", uploadId);
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const userFolderPath = path.join(__dirname, "../../uploads", sanitizedEmail, "3D_Modals");

      if (!fs.existsSync(userFolderPath)) {
        fs.mkdirSync(userFolderPath, { recursive: true });
      }

      const finalPath = path.join(userFolderPath, fileName);
      const writeStream = fs.createWriteStream(finalPath);

      // Merge chunks sequentially
      for (let i = 0; i < total; i++) {
        const chunkPath = path.join(tempDir, `chunk_${i}`);
        
        // Wait for file to exist (small delay for fs sync if needed)
        let retry = 0;
        while(!fs.existsSync(chunkPath) && retry < 10) {
            await new Promise(r => setTimeout(r, 100));
            retry++;
        }

        if (fs.existsSync(chunkPath)) {
            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
            fs.unlinkSync(chunkPath); // Delete chunk after reading
        } else {
            console.error(`Missing chunk ${i} for upload ${uploadId}`);
        }
      }
      writeStream.end();

      writeStream.on("finish", () => {
        try {
          if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
          console.error("Error cleaning up temp dir:", e);
        }

        const stats = fs.statSync(finalPath);
        const type = path.extname(fileName).slice(1);
        const sizeStr = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

        // Save to Database
        const saveToDb = async () => {
             const existing = await ThreedModel.findOne({ userEmail: emailId, name: fileName });
             if (!existing) {
                 const newModel = new ThreedModel({
                     userEmail: emailId,
                     name: fileName,
                     url: `/uploads/${sanitizedEmail}/3D_Modals/${fileName}`,
                     type: type,
                     size: sizeStr
                 });
                 await newModel.save();
                 return newModel;
             }
             return existing;
        };

        saveToDb().then(model => {
            res.status(200).json({
                message: "Model uploaded and merged successfully",
                url: `/uploads/${sanitizedEmail}/3D_Modals/${fileName}`,
                name: fileName,
                modelId: model.modelId
            });
        }).catch(err => {
            console.error("DB Save Error:", err);
            res.status(200).json({
                message: "Model merged but DB save failed",
                url: `/uploads/${sanitizedEmail}/3D_Modals/${fileName}`,
                name: fileName
            });
        });
      });

      writeStream.on("error", (err) => {
        console.error("Stream Merge Error:", err);
        res.status(500).json({ message: "Error during file merging" });
      });
    } else {
      res.status(200).json({ message: `Chunk ${curIndex} accepted` });
    }
  } catch (error) {
    console.error("Chunk Upload Error:", error);
    res.status(500).json({ message: "Server error during chunk upload" });
  }
});

// @route   GET /api/3d-models/get-models
// @desc    Get all 3D models from the user's 3D_Modals folder
// @access  Public
router.get("/get-models", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Email ID is required" });
    }

    // Sanitize email for folder name (matches auth.js logic)
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userFolderPath = path.resolve(
      process.cwd(),
      "uploads",
      sanitizedEmail,
      "3D_Modals",
    );

    // 1. Get models from Database
    let dbModels = await ThreedModel.find({ userEmail: emailId }).sort({ createdAt: -1 });

    // 2. Sync logic: If DB is empty or missing files that exist on disk, import them
    const files = fs.readdirSync(userFolderPath);
    const validFiles = files.filter(f => [".glb", ".gltf", ".obj", ".stl"].includes(path.extname(f).toLowerCase()));

    if (dbModels.length < validFiles.length) {
        console.log("Syncing disk files to database for:", emailId);
        for (const file of validFiles) {
            const alreadyInDb = dbModels.find(m => m.name === file);
            if (!alreadyInDb) {
                const stats = fs.statSync(path.join(userFolderPath, file));
                const baseName = path.basename(file, path.extname(file));
                const thumbnail = files.find(f => {
                    const fExt = path.extname(f).toLowerCase();
                    return path.basename(f, fExt) === baseName && [".png", ".jpg", ".jpeg", ".webp"].includes(fExt);
                });

                const newModel = new ThreedModel({
                    userEmail: emailId,
                    name: file,
                    url: `/uploads/${sanitizedEmail}/3D_Modals/${file}`,
                    thumbnailUrl: thumbnail ? `/uploads/${sanitizedEmail}/3D_Modals/${thumbnail}` : null,
                    size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
                    type: path.extname(file).slice(1)
                });
                await newModel.save();
            }
        }
        // Re-query after sync
        dbModels = await ThreedModel.find({ userEmail: emailId }).sort({ createdAt: -1 });
    }

    // 3. Map to consistent UI format
    const models = dbModels.map(m => ({
        modelId: m.modelId,
        name: m.name,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        size: m.size,
        type: m.type,
        uploadedAt: m.createdAt
    }));

    res.json({ models });
  } catch (error) {
    console.error("Error fetching 3D models:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/3d-models/save-session
// @desc    Save the current 3D editor state (JSON)
// @access  Public
router.post("/save-session", async (req, res) => {
  try {
    const { emailId, state } = req.body;
    if (!emailId || !state) {
      return res.status(400).json({ message: "Email and state are required" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userFolderPath = path.join(__dirname, "../../uploads", sanitizedEmail, "3D_Modals");
    if (!fs.existsSync(userFolderPath)) fs.mkdirSync(userFolderPath, { recursive: true });

    const sessionPath = path.join(userFolderPath, "session.json");
    fs.writeFileSync(sessionPath, JSON.stringify(state, null, 2));

    res.status(200).json({ message: "3D Session saved successfully" });
  } catch (error) {
    console.error("Error saving 3D session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/3d-models/rename-model
// @desc    Rename a model file and its thumbnail in the user's gallery
// @access  Public
router.post("/rename-model", async (req, res) => {
  try {
    const { emailId, oldName, newName } = req.body;
    if (!emailId || !oldName || !newName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userFolderPath = path.join(__dirname, "../../uploads", sanitizedEmail, "3D_Modals");

    // oldName might be "Cube.glb"
    const oldPath = path.join(userFolderPath, oldName);
    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    const ext = path.extname(oldName);
    // Sanitize new name and ensure it has correct extension
    let cleanNewName = newName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (!cleanNewName.endsWith(ext.toLowerCase())) {
        cleanNewName += ext;
    }
    
    const newPath = path.join(userFolderPath, cleanNewName);

    // Rename the main file
    fs.renameSync(oldPath, newPath);

    // Rename associated thumbnail
    const files = fs.readdirSync(userFolderPath);
    const oldBase = path.basename(oldName, ext);
    const newBase = path.basename(cleanNewName, ext);
    
    let newThumbUrl = null;
    const thumbnail = files.find(f => {
      const fExt = path.extname(f).toLowerCase();
      return path.basename(f, fExt) === oldBase && [".png", ".jpg", ".jpeg", ".webp"].includes(fExt);
    });

    if (thumbnail) {
      const thumbExt = path.extname(thumbnail);
      const newThumbPath = path.join(userFolderPath, newBase + thumbExt);
      fs.renameSync(path.join(userFolderPath, thumbnail), newThumbPath);
      newThumbUrl = `/uploads/${sanitizedEmail}/3D_Modals/${newBase + thumbExt}`;
    }

    // Update Database
    const relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${cleanNewName}`;
    await ThreedModel.findOneAndUpdate(
        { userEmail: emailId, name: oldName },
        { name: cleanNewName, url: relativeUrl, thumbnailUrl: newThumbUrl }
    );

    res.status(200).json({
      message: "Model renamed successfully",
      newName: cleanNewName,
      url: relativeUrl
    });
  } catch (error) {
    console.error("Rename Error:", error);
    res.status(500).json({ message: "Server error during rename" });
  }
});

// @route   GET /api/3d-models/get-session
// @desc    Get the saved 3D editor state
// @access  Public
router.get("/get-session", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: "Email is required" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const sessionPath = path.join(__dirname, "../../uploads", sanitizedEmail, "3D_Modals", "session.json");

    if (fs.existsSync(sessionPath)) {
      const state = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
      res.status(200).json({ state });
    } else {
      res.status(404).json({ message: "No saved session found" });
    }
  } catch (error) {
    console.error("Error fetching 3D session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/3d-models/delete-model/:emailId/:modelId
// @desc    Delete a model record and its physical files
// @access  Public
router.delete("/delete-model/:emailId/:modelId", async (req, res) => {
  try {
    const { emailId, modelId } = req.params;
    console.log("-----------------------------------------");
    console.log(`Delete request for email: ${emailId}, modelId: ${modelId}`);

    // 1. Find the model in DB first (added security: must match email)
    const model = await ThreedModel.findOne({ modelId, userEmail: emailId });
    if (!model) {
      console.log("Model record not found in DB:", modelId);
      return res.status(404).json({ message: "Model record not found" });
    }

    const { userEmail, name: fileName } = model;
    const sanitizedEmail = userEmail.replace(/[@.]/g, "_");
    
    // 2. Resolve folder path
    const pathsToTry = [
        path.resolve(process.cwd(), "uploads", sanitizedEmail, "3D_Modals"),
        path.resolve(__dirname, "../../uploads", sanitizedEmail, "3D_Modals")
    ];

    let userFolderPath = null;
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            userFolderPath = p;
            break;
        }
    }

    if (!userFolderPath) {
        console.error("User folder not found. Checked:", pathsToTry);
        return res.status(404).json({ message: "Storage folder not found on server" });
    }

    // 3. Delete Physical Files
    const filePath = path.join(userFolderPath, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Deleted model file:", filePath);
    }

    // Try to delete thumbnail
    const files = fs.readdirSync(userFolderPath);
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const thumbnail = files.find(f => {
      const fExt = path.extname(f).toLowerCase();
      return path.basename(f, fExt) === baseName && [".png", ".jpg", ".jpeg", ".webp"].includes(fExt);
    });

    if (thumbnail) {
      const thumbPath = path.join(userFolderPath, thumbnail);
      fs.unlinkSync(thumbPath);
      console.log("Deleted associated thumbnail:", thumbPath);
    }

    // 4. Delete Database Record
    await ThreedModel.deleteOne({ modelId });
    console.log("Deleted DB record for modelId:", modelId);

    res.status(200).json({ message: "Model deleted successfully from DB and Disk" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// @route   GET /api/3d-models/get-model/:modelId
// @desc    Get a single 3D model's metadata by ID
// @access  Public
router.get("/get-model/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    const model = await ThreedModel.findOne({ modelId });
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }
    res.json(model);
  } catch (error) {
    console.error("Error fetching model by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;