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
import path from "path";
import { fileURLToPath } from "url";

// Connect to database
connectDB();

const app = express();

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

// Serve Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/textures", express.static(path.join(__dirname, "Texture")));

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
