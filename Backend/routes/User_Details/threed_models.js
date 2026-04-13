import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

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
  upload.single("model")(req, res, (err) => {
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

      res.status(200).json({
        message: "Model uploaded successfully",
        url: relativeUrl,
        name: req.file.filename,
        type: path.extname(req.file.filename).slice(1),
        size: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
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
        res.status(200).json({
          message: "Model uploaded and merged successfully",
          url: `/uploads/${sanitizedEmail}/3D_Modals/${fileName}`,
          name: fileName,
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
router.get("/get-models", (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Email ID is required" });
    }

    // Sanitize email for folder name (matches auth.js logic)
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const userFolderPath = path.join(
      __dirname,
      "../../uploads",
      sanitizedEmail,
      "3D_Modals",
    );

    if (!fs.existsSync(userFolderPath)) {
      // Create the folder if it doesn't exist to avoid future errors, though it should be created on signup
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    const files = fs.readdirSync(userFolderPath);
    const models = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".glb", ".gltf", ".obj", ".stl"].includes(ext);
      })
      .map((file) => {
        const stats = fs.statSync(path.join(userFolderPath, file));
        const baseName = path.basename(file, path.extname(file));

        // Find potential thumbnails
        const thumbnail = files.find((f) => {
          const fExt = path.extname(f).toLowerCase();
          const fBaseName = path.basename(f, fExt);
          return (
            fBaseName === baseName &&
            [".png", ".jpg", ".jpeg", ".webp"].includes(fExt)
          );
        });

        return {
          name: file,
          url: `/uploads/${sanitizedEmail}/3D_Modals/${file}`,
          thumbnailUrl: thumbnail
            ? `/uploads/${sanitizedEmail}/3D_Modals/${thumbnail}`
            : null,
          size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
          type: path.extname(file).slice(1),
          uploadedAt: stats.mtime,
        };
      });

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

export default router;