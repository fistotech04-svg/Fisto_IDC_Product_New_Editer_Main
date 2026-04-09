import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import usersettingRoutes from "./routes/User_Details/usersetting.js";

import authRoutes from "./routes/User_Details/login.js";
import flipbookRoutes from "./routes/Flipbook/flipbook.js";
import threedModelRoutes from "./routes/User_Details/threed_models.js";

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins dynamically
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

// Serve Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flipbook", flipbookRoutes);
app.use("/api/usersetting", usersettingRoutes);
app.use("/api/3d-models", threedModelRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
