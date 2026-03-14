import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default router;