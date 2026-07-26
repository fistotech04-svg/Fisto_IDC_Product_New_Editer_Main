import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import ThreedModel from "../../models/ThreedModel.js";
import InteractionThreedModel from "../../models/InteractionThreedModel.js";
import { uploadFileToSupabase, uploadBufferToSupabase, downloadFileFromSupabase, deleteFileFromSupabase, renamePathInSupabase } from "../../config/supabase.js";


const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for 3D model uploads (temporary local storage before Supabase)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/3d_models");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for 3D models (direct uploads)
  },
});

// Configure multer for CHUNKED uploads in temp_uploads
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { uploadId } = req.body;
    if (!uploadId) return cb(new Error("uploadId is required"));
    
    const tempDir = path.join(__dirname, "../../temp_uploads/3d_models/temp", uploadId);
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
      const { emailId, modelId } = req.body;
      if (!emailId) {
        return res.status(400).json({ message: "Email ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      let relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${req.file.filename}`;

      // Upload file to Supabase Storage
      const destinationPath = `${sanitizedEmail}/3D_Modals/${req.file.filename}`;
      const supabaseUrl = await uploadFileToSupabase(req.file.path, destinationPath);
      if (supabaseUrl) {
        relativeUrl = supabaseUrl;
      }

      const type = path.extname(req.file.filename).slice(1);
      const sizeStr = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

      let model;
      let interactionModel = null;
      let finalRelativeUrl = relativeUrl;


      if (modelId) {
          model = await ThreedModel.findOne({ modelId, userEmail: emailId });
          if (!model) {
              interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
          }
      }

      if (model) {
          // Update ThreedModel
          model.name = req.file.filename;
          model.url = finalRelativeUrl;
          model.type = type;
          model.size = sizeStr;
          await model.save();
      } else if (interactionModel) {
          // Update InteractionThreedModel
          interactionModel.fileName = req.file.filename;
          interactionModel.url = `./assets/3D_Model/${req.file.filename}`;
          interactionModel.type = type;
          interactionModel.size = sizeStr;
          await interactionModel.save();

          finalRelativeUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;

          // Upload 3D model to Supabase Storage in flipbook assets/3D_Model
          const interactionSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;
          uploadFileToSupabase(req.file.path, interactionSupabasePath).catch(err => console.warn("[Supabase] 3D Model asset upload warning:", err));
      } else {
          // Save as new ThreedModel (Global)
          model = new ThreedModel({
            userEmail: emailId,
            name: req.file.filename,
            url: finalRelativeUrl,
            type: type,
            size: sizeStr
          });
          await model.save();
      }

      // Cleanup local temp file after uploading to Supabase
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }

      res.status(200).json({
        message: modelId ? "Model updated successfully" : "Model uploaded successfully",
        url: finalRelativeUrl,
        name: req.file.filename,
        type: type,
        size: sizeStr,
        modelId: model ? model.modelId : (interactionModel ? interactionModel.v_id : null)
      });
    } catch (error) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
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

    // If it's the last chunk, start merging in tempDir
    if (curIndex === total - 1) {
      const tempDir = path.join(__dirname, "../../temp_uploads/3d_models/temp", uploadId);
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const finalPath = path.join(tempDir, fileName);
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
        const stats = fs.statSync(finalPath);
        const type = path.extname(fileName).slice(1);
        const sizeStr = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

        // Save to Database & Supabase
        const saveToDb = async () => {
             const destinationPath = `${sanitizedEmail}/3D_Modals/${fileName}`;
             const supabaseUrl = await uploadFileToSupabase(finalPath, destinationPath);
             const modelUrl = supabaseUrl || `/uploads/${sanitizedEmail}/3D_Modals/${fileName}`;

             const existing = await ThreedModel.findOne({ userEmail: emailId, name: fileName });
             if (!existing) {
                 const newModel = new ThreedModel({
                     userEmail: emailId,
                     name: fileName,
                     url: modelUrl,
                     type: type,
                     size: sizeStr
                 });
                 await newModel.save();
                 return newModel;
             } else {
                 existing.url = modelUrl;
                 await existing.save();
             }
             return existing;
        };

        saveToDb().then(model => {
            // Clean up merged file and temp directory
            try {
              if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {
              console.error("Error cleaning up temp dir:", e);
            }

            res.status(200).json({
                message: "Model uploaded and merged successfully",
                url: model.url,
                name: fileName,
                modelId: model.modelId
            });
        }).catch(err => {
            try {
              if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {}
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
// @desc    Get all 3D models for the user
// @access  Public
router.get("/get-models", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Email ID is required" });
    }

    // Get models from Database
    const dbModels = await ThreedModel.find({ userEmail: emailId }).sort({ createdAt: -1 });

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
// @desc    Save the current 3D editor state (JSON) to Supabase Storage
// @access  Public
router.post("/save-session", async (req, res) => {
  try {
    const { emailId, state } = req.body;
    if (!emailId || !state) {
      return res.status(400).json({ message: "Email and state are required" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const sessionBuffer = Buffer.from(JSON.stringify(state, null, 2), "utf-8");
    const destinationPath = `${sanitizedEmail}/3D_Modals/session.json`;
    await uploadBufferToSupabase(sessionBuffer, destinationPath, "application/json");

    res.status(200).json({ message: "3D Session saved successfully" });
  } catch (error) {
    console.error("Error saving 3D session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/3d-models/rename-model
// @desc    Rename a model file in Supabase Storage and DB
// @access  Public
router.post("/rename-model", async (req, res) => {
  try {
    const { emailId, oldName, newName, modelId } = req.body;
    if (!emailId || !oldName || !newName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    
    let interactionModel = null;
    let finalUrl = null;

    if (modelId) {
       interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
    }
    
    const ext = path.extname(oldName);
    let cleanNewName = newName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    if (!cleanNewName.endsWith(ext.toLowerCase())) {
        cleanNewName += ext;
    }
    
    if (interactionModel) {
        const oldSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;
        const newSupabasePath = `${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${cleanNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath);

        interactionModel.fileName = cleanNewName;
        interactionModel.url = `./assets/3D_Model/${cleanNewName}`;
        await interactionModel.save();
        
        finalUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${cleanNewName}`;
    }

    const dbModel = await ThreedModel.findOne({ userEmail: emailId, name: oldName });
    if (dbModel) {
        const oldSupabasePath = `${sanitizedEmail}/3D_Modals/${oldName}`;
        const newSupabasePath = `${sanitizedEmail}/3D_Modals/${cleanNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath);

        const relativeUrl = `/uploads/${sanitizedEmail}/3D_Modals/${cleanNewName}`;
        if (!finalUrl) finalUrl = relativeUrl;

        let newThumbUrl = dbModel.thumbnailUrl;
        if (dbModel.thumbnailUrl) {
          const oldBase = path.basename(oldName, ext);
          const newBase = path.basename(cleanNewName, ext);
          const thumbExt = path.extname(dbModel.thumbnailUrl);
          const oldThumbPath = `${sanitizedEmail}/3D_Modals/${oldBase}${thumbExt}`;
          const newThumbPath = `${sanitizedEmail}/3D_Modals/${newBase}${thumbExt}`;
          await renamePathInSupabase(oldThumbPath, newThumbPath);
          newThumbUrl = `/uploads/${sanitizedEmail}/3D_Modals/${newBase}${thumbExt}`;
        }

        dbModel.name = cleanNewName;
        dbModel.url = relativeUrl;
        dbModel.thumbnailUrl = newThumbUrl;
        await dbModel.save();
    } else if (!interactionModel) {
        return res.status(404).json({ message: "Model not found" });
    }

    res.status(200).json({
      message: "Model renamed successfully",
      newName: cleanNewName,
      url: finalUrl
    });
  } catch (error) {
    console.error("Rename Error:", error);
    res.status(500).json({ message: "Server error during rename" });
  }
});

// @route   POST /api/3d-models/rename-label
// @desc    Update only the display name (fileName) in the DB without renaming any files.
// @access  Public
router.post("/rename-label", async (req, res) => {
  try {
    const { emailId, modelId, newName } = req.body;
    if (!emailId || !modelId || !newName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const interactionModel = await InteractionThreedModel.findOne({ v_id: modelId, userEmail: emailId });
    if (!interactionModel) {
      return res.status(404).json({ message: "Model record not found" });
    }

    interactionModel.displayName = newName.trim();
    await interactionModel.save();

    res.status(200).json({
      message: "Model label updated in DB",
      displayName: interactionModel.displayName
    });
  } catch (error) {
    console.error("Rename Label Error:", error);
    res.status(500).json({ message: "Server error during label rename" });
  }
});

// @route   GET /api/3d-models/get-session
// @desc    Get the saved 3D editor state from Supabase Storage
// @access  Public
router.get("/get-session", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: "Email is required" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const sessionPath = `${sanitizedEmail}/3D_Modals/session.json`;
    const buffer = await downloadFileFromSupabase(sessionPath);

    if (buffer) {
      const state = JSON.parse(buffer.toString("utf-8"));
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
// @desc    Delete a model record and its files from Supabase Storage
// @access  Public
router.delete("/delete-model/:emailId/:modelId", async (req, res) => {
  try {
    const { emailId, modelId } = req.params;

    const model = await ThreedModel.findOne({ modelId, userEmail: emailId });
    if (!model) {
      return res.status(404).json({ message: "Model record not found" });
    }

    const { userEmail, name: fileName } = model;
    const sanitizedEmail = userEmail.replace(/[@.]/g, "_");

    // Delete model file from Supabase Storage
    const destinationPath = `${sanitizedEmail}/3D_Modals/${fileName}`;
    await deleteFileFromSupabase(destinationPath);
    if (model.url) {
      await deleteFileFromSupabase(model.url);
    }
    if (model.thumbnailUrl) {
      await deleteFileFromSupabase(model.thumbnailUrl);
    }

    // Delete Database Record
    await ThreedModel.deleteOne({ modelId });

    res.status(200).json({ message: "Model deleted successfully from DB and Supabase" });
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
    let model = await ThreedModel.findOne({ modelId });
    
    if (!model) {
      const interactionModel = await InteractionThreedModel.findOne({ v_id: modelId });
      if (interactionModel) {
        const sanitizedEmail = interactionModel.userEmail.replace(/[@.]/g, "_");
        const absoluteUrl = `/uploads/${sanitizedEmail}/My_Flipbooks/${interactionModel.folderName}/${interactionModel.flipbookName}/assets/3D_Model/${interactionModel.fileName}`;

        model = {
          modelId: interactionModel.v_id,
          name: interactionModel.displayName || interactionModel.fileName,
          displayName: interactionModel.displayName || null,
          fileName: interactionModel.fileName,
          url: absoluteUrl,
          size: interactionModel.size,
          type: interactionModel.type
        };
      }
    }

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