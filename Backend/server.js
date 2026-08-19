import dotenv from "dotenv";
dotenv.config();

import express from "express";

import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import usersettingRoutes from "./routes/User_Details/usersetting.js";
import authRoutes from "./routes/User_Details/login.js";
import flipbookRoutes from "./routes/Flipbook/flipbook.js";
import threedModelRoutes from "./routes/User_Details/threed_models.js";
import textureRoutes from "./routes/Texture/texture.js";
import exploreRoutes from "./routes/Explore/explore.js";
import compression from "compression";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


// Connect to database
connectDB();

import { SUPABASE_BUCKET, downloadFileFromSupabase } from "./config/supabase.js";

console.log(`[Supabase] Storage integration initialized for bucket '${SUPABASE_BUCKET}'.`);

const mimeTypes = {
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".obj": "text/plain",
  ".stl": "model/stl",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".hdr": "image/vnd.radiance"
};


const app = express();
app.use(compression());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  }),
);

app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

// Serve /uploads EXCLUSIVELY from Supabase Storage (no local disk)
app.use("/uploads", async (req, res, next) => {
  const relPath = req.path;

  try {
    const fileBuffer = await downloadFileFromSupabase(relPath);
    if (fileBuffer) {
      const ext = path.extname(relPath).toLowerCase();
      const mimeType = mimeTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(fileBuffer);
    }
  } catch (err) {
    console.warn("[Supabase /uploads Error]:", err);
  }

  console.warn(`[/uploads] File not found in Supabase: ${relPath}`);
  return res.status(404).json({ message: "File not found in storage" });
});

app.use("/textures", express.static(path.join(__dirname, "Texture")));
app.use("/assets/bgimg", express.static(path.join(__dirname, "assets/bgimg"), { maxAge: '1d', immutable: true }));
app.use("/assets/Videos", express.static(path.join(__dirname, "assets/Videos"), { maxAge: '1d', immutable: true }));




// Basic Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flipbook", flipbookRoutes);
app.use("/api/usersetting", usersettingRoutes);
app.use("/api/3d-models", threedModelRoutes);
app.use("/api/textures", textureRoutes);
app.use("/api/explore", exploreRoutes);

const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: "File too large. Max limit is 500MB." });
  }
  res.status(err.status || 500).json({ 
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
