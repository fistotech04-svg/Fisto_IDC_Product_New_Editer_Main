import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import Flipbook from "../../models/Flipbook.js"; // Import Model
import { nanoid } from "nanoid";

const compareKeys = async (input, stored) => {
  if (!input || !stored) return false;
  const inStr = String(input).trim();
  const stStr = String(stored).trim();

  if (stStr.startsWith('$2a$') || stStr.startsWith('$2b$')) {
    return await bcrypt.compare(inStr, stStr);
  }
  return inStr === stStr;
};
import multer from "multer";
import FlipbookAsset from "../../models/FlipbookAsset.js";
import UserSettings from "../../models/UserSettings.js";
import ThreedModel from "../../models/ThreedModel.js";
import InteractionThreedModel from "../../models/InteractionThreedModel.js";
import { exec } from "child_process";
import { promisify } from "util";
import { uploadFileToSupabase, uploadBufferToSupabase, uploadFolderToSupabase, deleteFileFromSupabase, deleteFolderFromSupabase, ensureFlipbookFoldersInSupabase, renamePathInSupabase, copyPathInSupabase, downloadFileFromSupabase, rewriteUploadsToSupabase, listFoldersFromSupabase, listFilesInSupabaseFolder, getUserStorageSizeFromSupabase, getSupabasePublicUrl } from "../../config/supabase.js";

// Helper to get Gmail Transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};











const execAsync = promisify(exec);

import customizedSettingsRouter, {
  ensureBackgroundAssetInSupabase,
  ensureBrandingAssetInSupabase
} from "./customized_settings.js";

const router = express.Router();
router.use(customizedSettingsRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root folder name for all flipbook storage
const FLIPBOOK_ROOT = "My_Flipbooks";

// Helper to escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");




const processAndSaveBase64Assets = ({
  htmlContent,
  pageVId,
  sanitizedEmail,
  physicalFolderName,
  flipbookName,
  flipbookDir,
  flipbook_v_id,
  newFlipbookAssets = [],
  savedBase64Map = new Map(),
  skipBase64Extraction = false
}) => {
  if (!htmlContent) return "";
  if (skipBase64Extraction) return htmlContent;

  const base64Regex = /data:([^;]+);base64,([^"&<\s]+)/g;
  return htmlContent.replace(base64Regex, (match, mimeType, base64Data) => {
    if (savedBase64Map.has(base64Data)) {
      return savedBase64Map.get(base64Data);
    }

    let isDownload = false;
    let actualMimeType = mimeType;
    if (mimeType.startsWith('download-')) {
      isDownload = true;
      actualMimeType = mimeType.replace('download-', '');
    }

    const parts = actualMimeType ? actualMimeType.split('/') : ['unknown', 'bin'];
    const type = parts[0] || 'unknown';
    const ext = parts[1] || 'bin';
    let subfolder = type;
    let normalizedExt = ext;
    
    if (isDownload) {
      subfolder = 'download';
    } else {
      if (type === 'image') subfolder = 'Image';
      else if (type === 'audio') subfolder = 'audio';
      else if (type === 'video') subfolder = 'video';
      else if (type === 'model' || ['glb', 'gltf', 'obj', 'stl'].includes(ext)) subfolder = '3D_Model';
      else subfolder = 'download';
    }

    
    if (!isDownload && ext === 'gif') subfolder = 'gif';
    if (normalizedExt.includes('+')) normalizedExt = normalizedExt.split('+')[0];
    
    const contentHash = crypto.createHash('md5').update(base64Data).digest('hex').slice(0, 16);
    const assetFileName = `asset_${contentHash}.${normalizedExt}`;
    const relativePath = `./assets/${subfolder}/${assetFileName}`;
    
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const assetDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${subfolder}/${assetFileName}`;
      uploadBufferToSupabase(buffer, assetDestPath, actualMimeType).catch(err => console.warn("[Supabase] Asset upload warning:", err));

      const absoluteUrl = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${subfolder}/${assetFileName}`;
      
      newFlipbookAssets.push({
        flipbook_v_id: flipbook_v_id,
        file_v_id: nanoid(),
        assetType: subfolder,
        fileName: assetFileName,
        page_v_id: pageVId,
        flipbookName: flipbookName,
        folderName: physicalFolderName,
        url: absoluteUrl,
        size: buffer.length
      });

      savedBase64Map.set(base64Data, relativePath);
      return relativePath;
    } catch(err) {
      console.error("Error saving base64 asset:", err);
      return match;
    }
  });
};


// Configure multer for asset uploads in temp_uploads
const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/flipbook_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const assetUpload = multer({
  storage: assetStorage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit
  },
  fileFilter: (req, file, cb) => {
    const { assetType } = req.body;
    const allowedTypes = {
      Image: /jpeg|jpg|png|gif|webp|svg|bmp|avif|heic|heif|tiff|ico/i,
      video: /mp4|webm|ogg|mov/i,
      gif: /gif/i,
    };

    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const typePattern = allowedTypes[assetType];

    if (typePattern && typePattern.test(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type for ${assetType}. Allowed: ${typePattern}`,
        ),
      );
    }
  },
});

// Configure multer for 3D model uploads in temp_uploads
const model3DStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/flipbook_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const model3DUpload = multer({
  storage: model3DStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for 3D models
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".glb", ".gltf", ".obj", ".stl", ".fbx"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for 3D model. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// Configure multer for branding asset uploads (Logo, Watermark, Preloader images)
const brandingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../temp_uploads/branding_assets");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid()}${ext}`;
    cb(null, uniqueName);
  },
});

const brandingUpload = multer({
  storage: brandingStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for branding assets
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif", ".heic", ".heif", ".tiff", ".ico"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image file type for branding asset. Allowed: ${allowed.join(", ")}`));
    }
  },
});

// @route   POST /api/flipbook/upload-3d-model
// @desc    Upload a 3D model file into the flipbook's assets/3D_Model folder
// @access  Public
router.post("/upload-3d-model", (req, res) => {
  model3DUpload.single("model")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error (3D model):", err);
      return res.status(413).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error("Upload Error (3D model):", err);
      return res.status(500).json({ message: err.message || "Server error during upload" });
    }

    try {
      const { emailId, folderName, flipbookName } = req.body;
      if (!emailId || !folderName || !flipbookName) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Relative URL stored in the page HTML (flipbook-portable)
      const relativeUrl = `./assets/3D_Model/${req.file.filename}`;
      const type = path.extname(req.file.filename).slice(1);
      const sizeStr = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

      const sanitizedEmail = emailId.replace(/[@.]/g, "_");

      // ── Upload 3D model to Supabase Storage under flipbook assets/3D_Model ──
      const flipbookAssetSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${flipbookName}/assets/3D_Model/${req.file.filename}`;
      await uploadFileToSupabase(req.file.path, flipbookAssetSupabasePath).catch((err) =>
        console.warn("[Supabase] 3D Model flipbook asset upload warning:", err)
      );

      // ── Save to InteractionThreedModel for flipbook-specific record ────────
      const newInteractionModel = await InteractionThreedModel.create({
        userEmail: emailId,
        flipbookName,
        folderName,
        fileName: req.file.filename,
        url: relativeUrl,
        size: sizeStr,
        type: type,
      });

      // ── Also copy to user's global 3D_Modals in Supabase ──────────────────────
      let globalUrl = null;
      if (req.body.skipGlobalGallery !== 'true') {
        const globalSupabasePath = `${sanitizedEmail}/3D_Modals/${req.file.filename}`;
        await uploadFileToSupabase(req.file.path, globalSupabasePath).catch((err) =>
          console.warn("[Supabase] Global 3D Model upload warning:", err)
        );

        globalUrl = `/uploads/${sanitizedEmail}/3D_Modals/${req.file.filename}`;

        const existingModel = await ThreedModel.findOne({
          userEmail: emailId,
          name: req.file.filename,
        });

        if (!existingModel) {
          await ThreedModel.create({
            userEmail: emailId,
            name: req.file.filename,
            url: globalUrl,
            type,
            size: sizeStr,
          });
        }
      }

      // Cleanup local temp file
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }

      res.status(200).json({
        message: "3D model uploaded successfully",
        url: relativeUrl,       // relative path for page HTML
        globalUrl,              // absolute path in 3D_Modals gallery
        filename: req.file.filename,
        v_id: newInteractionModel.v_id,
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      console.error("Error processing 3D model upload:", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  });
});

// @route   POST /api/flipbook/save/chunk
// @desc    Upload a chunk of page content
router.post("/save/chunk", async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!uploadId || chunkIndex === undefined || !chunkData) {
      return res.status(400).json({ message: "Missing chunk metadata" });
    }

    const tempDir = path.join(__dirname, "../../temp_uploads", uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.writeFileSync(chunkPath, chunkData, "utf8");

    res.status(200).json({ message: "Chunk uploaded", chunkIndex });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    res.status(500).json({ message: "Chunk upload failed" });
  }
});

// @route   POST /api/flipbook/save
// @desc    Save user flipbook as HTML files
// @access  Public (should be protected in production)
router.post("/save", async (req, res) => {
  try {
    const { emailId, flipbookName, pages, overwrite, folderName } = req.body;

    if (!emailId || !flipbookName || !pages || !Array.isArray(pages)) {
      return res
        .status(400)
        .json({
          message:
            "Missing required fields: emailId, flipbookName, or pages array",
        });
    }

    // Sanitize email to match the formatting used in login.js
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Determine target folder (default to 'Recent Book' if not specified)
    const targetFolder = folderName
      ? folderName.replace(/[^a-zA-Z0-9 _-]/g, "")
      : "Recent Book";

    // Paths
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
    );

    // Fetch existing doc to detect renames and determine correct physical path
    let existingDoc = null;
    if (req.body.v_id) {
      existingDoc = await Flipbook.findOne({
        userEmail: emailId,
        v_id: req.body.v_id,
      });
    } else {
      existingDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: flipbookName,
        folderName: targetFolder,
      });
    }

    // PHYSICAL PATH RESOLUTION
    let physicalFolderName = (targetFolder && targetFolder !== "Recent Book" && targetFolder !== "Recent book")
      ? targetFolder
      : "My_Flipbooks";

    // If updating an existing book, use its existing physical folder (to handle 'Recent Book' cases)
    if (existingDoc && existingDoc.folderName) {
      const folders = Array.isArray(existingDoc.folderName)
        ? existingDoc.folderName
        : [existingDoc.folderName];
      // The "Real" folder is the one that isn't 'Recent Book'
      const realFolder = folders.find(
        (f) => f !== "Recent Book" && f !== "Recent book",
      );
      if (realFolder) physicalFolderName = realFolder;
    }

    let oldFlipbookName = null;

    // SUPABASE FOLDER RENAME DETECTION
    if (existingDoc && existingDoc.flipbookName !== flipbookName) {
      oldFlipbookName = existingDoc.flipbookName;
      const oldPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${oldFlipbookName}`;
      const newPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}`;
      await renamePathInSupabase(oldPath, newPath).catch(err =>
        console.warn("[Supabase] Rename flipbook folder warning:", err)
      );

      // PRE-PROCESS PAGES: Update URLs in the current request payload to reflect new name
      const escapedFolder = escapeRegex(physicalFolderName).replace(/ /g, "(?: |%20)");
      const escapedOldName = escapeRegex(oldFlipbookName).replace(/ /g, "(?: |%20)");
      const pathRegex = new RegExp(`/[^/]+/${escapedFolder}/${escapedOldName}/`, "g");
      const replacementPath = `/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/`;

      pages.forEach((p) => {
        if (p.content) {
          p.content = p.content.replace(pathRegex, replacementPath);
        }
      });
      console.log(`Updated URLs in ${pages.length} pages in memory before write.`);
    }

    const savedPages = [];
    const dbPages = [];
    const savedFileNames = new Set();
    const newPageIds = new Set();

    // Ensure Default Assets Folders exist in Supabase Storage
    ensureFlipbookFoldersInSupabase(sanitizedEmail, physicalFolderName, flipbookName).catch(err =>
      console.warn("[Supabase] Auto subfolder create warning:", err)
    );

    // Cache to prevent saving the same base64 string multiple times
    const savedBase64Map = new Map();
    const newFlipbookAssets = [];
    const flipbook_v_id = req.body.v_id || (existingDoc ? existingDoc.v_id : nanoid(20));

    const extractBase64AndSave = (htmlContent, pageVId) => {
      return processAndSaveBase64Assets({
        htmlContent,
        pageVId,
        sanitizedEmail,
        physicalFolderName,
        flipbookName,
        flipbookDir: "",
        flipbook_v_id,
        newFlipbookAssets,
        savedBase64Map
      });
    };

    const pageHtmlMap = new Map();
    const modifiedPageIds = new Set();
    let allHtmlContents = "";

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { pageName, content, v_id: incomingPageVId } = page;
      if (!pageName) continue;

      const fileName = pageName.endsWith(".html")
        ? pageName
        : `${pageName}.html`;

      // Resolve pageVId early so we can use it for DB assets
      let pageVId = incomingPageVId;
      if (!pageVId && existingDoc && existingDoc.pages) {
        const existingPage = existingDoc.pages.find((p) => p.name === pageName);
        if (existingPage && existingPage.v_id) {
          pageVId = existingPage.v_id;
        }
      }
      if (!pageVId) {
        pageVId = nanoid();
      }

      const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/${fileName}`;
      let processedContent = "";

      const isContentProvided = (content !== undefined && content !== null) || page.contentChunkId !== undefined;

      if (content !== undefined && content !== null) {
        processedContent = extractBase64AndSave(content, pageVId);
        const pageBuffer = Buffer.from(processedContent, "utf8");
        await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));
      } else if (page.contentChunkId) {
        // Reassemble from chunks in temp_uploads
        const tempDir = path.join(__dirname, "../../temp_uploads", page.contentChunkId);
        if (fs.existsSync(tempDir)) {
          const chunks = fs.readdirSync(tempDir).sort((a, b) => {
            return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
          });
          
          let assembledContent = "";
          for (const chunkFile of chunks) {
            assembledContent += fs.readFileSync(path.join(tempDir, chunkFile), "utf8");
          }
          
          processedContent = extractBase64AndSave(assembledContent, pageVId);
          const pageBuffer = Buffer.from(processedContent, "utf8");
          await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));
          
          // Cleanup chunks after save
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        }
      }

      if (isContentProvided && processedContent) {
        allHtmlContents += " " + processedContent;
        pageHtmlMap.set(pageVId, processedContent.toLowerCase());
        modifiedPageIds.add(pageVId);
      }

      savedPages.push(fileName);
      savedFileNames.add(fileName);

      newPageIds.add(pageVId);

      dbPages.push({
        pageNumber: i + 1,
        name: pageName,
        fileName: fileName,
        v_id: pageVId,
      });
    }

    // Upsert base64 assets into DB (prevents duplicate DB rows for identical asset filenames)
    if (newFlipbookAssets.length > 0) {
      try {
        for (const assetObj of newFlipbookAssets) {
          await FlipbookAsset.updateOne(
            { flipbook_v_id: assetObj.flipbook_v_id, fileName: assetObj.fileName },
            { $set: assetObj },
            { upsert: true }
          );
        }
        console.log(`Upserted ${newFlipbookAssets.length} extracted base64 assets in DB`);
      } catch (err) {
        console.error("Error upserting extracted assets:", err);
      }
    }

    // Handle Cascading Deletion & Deduplication of DB Asset Records
    try {
      let currentFlipbookVId = req.body.v_id || (existingDoc && existingDoc.v_id) || flipbook_v_id;
      const allHtmlLower = allHtmlContents ? allHtmlContents.toLowerCase() : "";
      const existingPageVIds = new Set(existingDoc && existingDoc.pages ? existingDoc.pages.map(p => p.v_id) : []);
      
      // 1. Clean up FlipbookAsset records: remove deleted page assets, unreferenced page assets, and duplicate DB rows
      const allFlipbookAssets = await FlipbookAsset.find({ flipbook_v_id: currentFlipbookVId });
      const seenAssets = new Set();
      
      for (const asset of allFlipbookAssets) {
        const isPageDeleted = asset.page_v_id && asset.page_v_id !== 'global' && existingPageVIds.has(asset.page_v_id) && !newPageIds.has(asset.page_v_id);
        const isPageModifiedInRequest = asset.page_v_id && modifiedPageIds.has(asset.page_v_id);
        const pageHtml = isPageModifiedInRequest ? pageHtmlMap.get(asset.page_v_id) || "" : null;
        const isRemovedFromPage = isPageModifiedInRequest && asset.fileName && asset.page_v_id !== 'global' && !pageHtml.includes(asset.fileName.toLowerCase());

        if (isPageDeleted || isRemovedFromPage) {
          console.log(`[Save Cleanup] Processing removed/page-deleted asset: ${asset.fileName}`);
          const isGalleryFile = asset.folderName === 'Gallery' || asset.isGallery || (asset.url && (
            asset.url.includes(`/${sanitizedEmail}/Images/`) ||
            asset.url.includes(`/${sanitizedEmail}/Videos/`) ||
            asset.url.includes(`/${sanitizedEmail}/gifs/`) ||
            asset.url.includes(`/${sanitizedEmail}/3D_Modals/`) ||
            asset.url.includes(`/${sanitizedEmail}/Image/`) ||
            asset.url.includes(`/${sanitizedEmail}/video/`) ||
            asset.url.includes(`/${sanitizedEmail}/gif/`) ||
            asset.url.includes(`/${sanitizedEmail}/3D_Model/`)
          ));

          if (!isGalleryFile) {
            const assetSubFolder = asset.assetType || "Image";
            const supabaseAssetPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/${assetSubFolder}/${asset.fileName}`;
            deleteFileFromSupabase(supabaseAssetPath).catch((e) =>
              console.warn("[Supabase] Delete orphaned asset warning:", e)
            );
            if (asset.url && !asset.url.includes(`/${sanitizedEmail}/Images/`) && !asset.url.includes(`/${sanitizedEmail}/Videos/`) && !asset.url.includes(`/${sanitizedEmail}/gifs/`) && !asset.url.includes(`/${sanitizedEmail}/3D_Modals/`)) {
              deleteFileFromSupabase(asset.url).catch((e) =>
                console.warn("[Supabase] Delete orphaned asset URL warning:", e)
              );
            }
          } else {
            console.log(`[Save Cleanup] Preserving global gallery asset file in Supabase: ${asset.fileName}`);
          }
          await FlipbookAsset.deleteOne({ _id: asset._id });
        } else if (seenAssets.has(asset.fileName)) {
          console.log(`[Save Cleanup] Purging duplicate DB asset document: ${asset.fileName}`);
          await FlipbookAsset.deleteOne({ _id: asset._id });
        } else {
          seenAssets.add(asset.fileName);
        }
      }

      // 2. Clean up unreferenced InteractionThreedModel records & files
      const all3DModels = await InteractionThreedModel.find({ userEmail: emailId, flipbookName: flipbookName });
      for (const model of all3DModels) {
        const isModelRemoved = model.fileName && !allHtmlLower.includes(model.fileName.toLowerCase());
        if (isModelRemoved) {
          console.log(`[Save Cleanup] Deleting unreferenced 3D model: ${model.fileName}`);
          const supabaseModelPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/3D_Model/${model.fileName}`;
          deleteFileFromSupabase(supabaseModelPath).catch((e) =>
            console.warn("[Supabase] Delete orphaned 3D model warning:", e)
          );
          deleteFileFromSupabase(`${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/assets/3D_Modals/${model.fileName}`).catch(() => {});
          if (model.url) {
            deleteFileFromSupabase(model.url).catch((e) =>
              console.warn("[Supabase] Delete orphaned 3D model URL warning:", e)
            );
          }
          await InteractionThreedModel.deleteOne({ _id: model._id });
        }
      }

      // 3. Clean up deleted HTML page files from Supabase Storage
      if (existingDoc && existingDoc.pages) {
        for (const oldPage of existingDoc.pages) {
          if (oldPage.fileName && !savedFileNames.has(oldPage.fileName)) {
            console.log(`[Save Cleanup] Deleting removed page file: ${oldPage.fileName}`);
            const supabasePagePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}/${oldPage.fileName}`;
            deleteFileFromSupabase(supabasePagePath).catch((e) =>
              console.warn("[Supabase] Delete removed page file warning:", e)
            );
          }
        }
      }
    } catch (err) {
      console.error("Error cleaning up orphaned assets and pages:", err);
    }

    // Prepare Folder List for DB (Current Physical Folder + 'Recent Book')
    const folderList = [physicalFolderName];
    if (!folderList.includes("Recent Book")) {
      folderList.push("Recent Book");
    }
    const uniqueFolders = [...new Set(folderList)];

    // Save Metadata to MongoDB
    const v_id = flipbook_v_id; // Use the one we generated at the top

    if (oldFlipbookName) {
      console.log(
        `Flipbook rename detected in DB initialization: "${oldFlipbookName}" → "${flipbookName}"`,
      );
    }

    const updateQuery =
      req.body.v_id || (existingDoc && existingDoc.v_id)
        ? { userEmail: emailId, v_id: req.body.v_id || existingDoc.v_id }
        : {
            userEmail: emailId,
            flipbookName: flipbookName,
            folderName: physicalFolderName,
          };

    const incomingFlipbookInfo = req.body.FlipbookInfo || req.body.Customized_Settings?.FlipbookInfo || req.body.meta || {};
    let templateIdVal = req.body.templateId || incomingFlipbookInfo.templateId || req.body.settings?.templateId;
    let orientationVal = req.body.orientation || incomingFlipbookInfo.orientation || req.body.settings?.orientation;
    const isSquare = (templateIdVal && templateIdVal.toLowerCase() === 'square') || (orientationVal && orientationVal.toLowerCase() === 'square');

    if (isSquare) {
      templateIdVal = 'square';
      orientationVal = 'square';
    }

    const widthVal = isSquare ? 210 : (req.body.width || incomingFlipbookInfo.width || req.body.settings?.width);
    const heightVal = isSquare ? 210 : (req.body.height || incomingFlipbookInfo.height || req.body.settings?.height);

    const existingShare = existingDoc?.share || existingDoc?.Customized_Settings?.Visibility || {};
    const effectiveShareId = existingShare.shareId || req.body.share?.shareId || req.body.Customized_Settings?.Visibility?.shareId || nanoid(12);

    const existingFlipbookInfo = existingDoc?.Customized_Settings?.FlipbookInfo || existingDoc?.meta || {};

    const mergedFlipbookInfo = {
      ...existingFlipbookInfo,
      ...incomingFlipbookInfo,
      flipbookName,
      folderName: uniqueFolders,
      ...(widthVal ? { width: Number(widthVal) } : {}),
      ...(heightVal ? { height: Number(heightVal) } : {}),
      ...(templateIdVal ? { templateId: templateIdVal } : {}),
      ...(orientationVal ? { orientation: orientationVal } : {})
    };

    const updateSet = {
      flipbookName: flipbookName, // Ensure name is updated if it changed
      pages: dbPages,
      lastUpdated: new Date(),
      folderName: uniqueFolders, // Update tags
      Customized_Settings: {
        ...(existingDoc?.Customized_Settings || {}),
        ...(req.body.Customized_Settings || {}),
        Visibility: {
          ...existingShare,
          ...(req.body.Customized_Settings?.Visibility || {}),
          shareId: effectiveShareId
        },
        FlipbookInfo: mergedFlipbookInfo
      }
    };

    const savedDoc = await Flipbook.findOneAndUpdate(
      updateQuery,
      {
        $set: updateSet,
        $setOnInsert: { v_id: v_id },
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // FIFO Logic for 'Recent Book' Tag
    // Ensure v_id exists (backfill for legacy docs)
    if (!savedDoc.v_id) {
      savedDoc.v_id = nanoid(10);
      await savedDoc.save();
    }

    // UPDATE ASSET URLs IF FLIPBOOK WAS RENAMED
    if (oldFlipbookName && oldFlipbookName !== flipbookName) {
      try {
        console.log(`Updating InteractionThreedModel for renamed flipbook...`);
        await InteractionThreedModel.updateMany(
          { userEmail: emailId, flipbookName: oldFlipbookName },
          { $set: { flipbookName: flipbookName } }
        );
      } catch (err) {
        console.error("Error updating InteractionThreedModel after rename:", err);
      }

      try {
        console.log(`Updating assets for renamed flipbook...`);

        // Find all assets for this flipbook using v_id
        const assets = await FlipbookAsset.find({
          flipbook_v_id: savedDoc.v_id,
        });

        if (assets.length > 0) {
          // Update flipbookName field and reconstruct URL
          for (const asset of assets) {
            // Update the flipbookName field
            asset.flipbookName = flipbookName;

            // Reconstruct URL with new flipbook name
            // URL format: /uploads/{email}/My_Flipbooks/{folder}/{flipbook}/assets/{type}/{filename}
            const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
            asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${asset.folderName}/${flipbookName}/assets/${asset.assetType}/${asset.fileName}`;

            await asset.save();
            console.log(`✓ Updated: ${asset.fileName}`);
          }

          console.log(
            `✅ Updated ${assets.length} asset(s) for renamed flipbook`,
          );
        } else {
          console.log(`No assets found for flipbook (v_id: ${savedDoc.v_id})`);
        }
      } catch (err) {
        console.error("❌ Error updating assets after rename:", err);
      }
    }

    // FIFO Logic for 'Recent Book' Tag
    try {
      const recentBooks = await Flipbook.find({
        userEmail: emailId,
        folderName: "Recent Book",
      }).sort({ lastUpdated: -1 }); // Newest first

      if (recentBooks.length > 10) {
        const toRemoveTag = recentBooks.slice(10); // The oldest ones

        for (const book of toRemoveTag) {
          // Remove 'Recent Book' from folderName array
          await Flipbook.updateOne(
            { _id: book._id },
            { $pull: { folderName: "Recent Book" } },
          );
        }
      }
    } catch (err) {
      console.error("Error enforcing Recent Book tag limit:", err);
    }

    const supabaseLocation = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${flipbookName}`;

    res.status(200).json({
      message: "Flipbook saved successfully",
      flipbookName,
      v_id: savedDoc.v_id,
      pages: savedDoc.pages,
      savedPagesCount: savedPages.length,
      location: supabaseLocation,
    });
  } catch (error) {
    console.error("Error saving flipbook:", error);
    res.status(500).json({ message: "Server error processing request", error: error.message, stack: error.stack });
  }
});

// @route  POST /api/flipbook/save-page
// @desc   Save / update a single page's HTML content for an existing flipbook.
//         Used when uploading large PDFs page-by-page to avoid oversized requests.
// @body   { emailId, v_id, pageName, content, pageNumber }
router.post("/save-page", async (req, res) => {
  try {
    const { emailId, v_id, pageName, content, pageNumber } = req.body;

    if (!emailId || !v_id || !pageName || content === undefined) {
      return res.status(400).json({ message: "Missing required fields: emailId, v_id, pageName, content" });
    }

    // Locate the flipbook document
    const doc = await Flipbook.findOne({ userEmail: emailId, v_id });
    if (!doc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    // Resolve the physical folder (skip the virtual 'Recent Book' tag)
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const fileName = pageName.endsWith(".html") ? pageName : `${pageName}.html`;

    const newFlipbookAssets = [];
    const processedContent = processAndSaveBase64Assets({
      htmlContent: content,
      pageVId: v_id,
      sanitizedEmail,
      physicalFolderName: realFolder,
      flipbookName: doc.flipbookName,
      flipbookDir: "",
      flipbook_v_id: doc.v_id,
      newFlipbookAssets
    });

    const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${fileName}`;
    const pageBuffer = Buffer.from(processedContent, "utf8");
    await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));

    if (newFlipbookAssets.length > 0) {
      try {
        await FlipbookAsset.insertMany(newFlipbookAssets);
      } catch (err) {
        console.error("Error inserting extracted page assets:", err);
      }
    }

    // Update or insert this page in the DB pages array
    const existingPageIdx = doc.pages ? doc.pages.findIndex((p) => p.name === pageName) : -1;
    if (existingPageIdx >= 0) {
      // Update existing page record
      doc.pages[existingPageIdx].fileName = fileName;
      if (pageNumber !== undefined) doc.pages[existingPageIdx].pageNumber = pageNumber;
    } else {
      // Append new page record
      const newPageVId = `page_${Math.random().toString(36).substr(2, 9)}`;
      doc.pages = doc.pages || [];
      doc.pages.push({
        pageNumber: pageNumber || doc.pages.length + 1,
        name: pageName,
        fileName,
        v_id: newPageVId,
      });
    }

    doc.lastUpdated = new Date();
    doc.markModified("pages");
    await doc.save();

    res.status(200).json({ message: "Page saved", pageName, fileName });
  } catch (error) {
    console.error("Error saving page:", error);
    res.status(500).json({ message: "Server error saving page", error: error.message });
  }
});

// @route  POST /api/flipbook/save-pages-batch
// @desc   Save multiple pages' HTML content for an existing flipbook in one request.
//         Optimizes large PDF uploads by processing batches (e.g. 5-10 pages at a time).
// @body   { emailId, v_id, pages: [{ pageName, content, pageNumber }] }
router.post("/save-pages-batch", async (req, res) => {
  try {
    const { emailId, v_id, pages, keepBase64 = true } = req.body;

    if (!emailId || !v_id || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ message: "Missing required fields or pages array is empty" });
    }

    // Locate the flipbook document
    const doc = await Flipbook.findOne({ userEmail: emailId, v_id });
    if (!doc) return res.status(404).json({ message: "Flipbook not found" });

    // Resolve the physical folder
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    doc.pages = doc.pages || [];
    const newFlipbookAssets = [];
    const savedBase64Map = new Map();

    for (const page of pages) {
      const { pageName, content, pageNumber, v_id: pageVId } = page;
      const fileName = pageName.endsWith(".html") ? pageName : `${pageName}.html`;

      const processedContent = processAndSaveBase64Assets({
        htmlContent: content,
        pageVId: pageVId || `page_${Math.random().toString(36).substr(2, 9)}`,
        sanitizedEmail,
        physicalFolderName: realFolder,
        flipbookName: doc.flipbookName,
        flipbookDir: "",
        flipbook_v_id: doc.v_id,
        newFlipbookAssets,
        savedBase64Map,
        skipBase64Extraction: keepBase64
      });

      const pageDestPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${fileName}`;
      const pageBuffer = Buffer.from(processedContent, "utf8");
      await uploadBufferToSupabase(pageBuffer, pageDestPath, "text/html").catch(err => console.warn("[Supabase] Page upload warning:", err));

      // Update or insert into DB pages array
      const existingPageIdx = doc.pages.findIndex((p) => p.name === pageName);
      if (existingPageIdx >= 0) {
        doc.pages[existingPageIdx].fileName = fileName;
        if (pageNumber !== undefined) doc.pages[existingPageIdx].pageNumber = pageNumber;
      } else {
        doc.pages.push({
          pageNumber: pageNumber || doc.pages.length + 1,
          name: pageName,
          fileName,
          v_id: pageVId || `page_${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    if (newFlipbookAssets.length > 0) {
      try {
        await FlipbookAsset.insertMany(newFlipbookAssets);
      } catch (err) {
        console.error("Error inserting extracted batch assets:", err);
      }
    }


    doc.lastUpdated = new Date();
    doc.markModified("pages");
    await doc.save();

    res.status(200).json({ message: "Batch saved successfully", pagesSaved: pages.length });
  } catch (error) {
    console.error("Error saving pages batch:", error);
    res.status(500).json({ message: "Server error saving pages batch", error: error.message });
  }
});

// Helper to get folder size
const getDirSize = (dirPath) => {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (e) {
    return 0;
  }
  return size;
};

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// @route   GET /api/flipbook/list
// @desc    Get all flipbooks with metadata
router.get("/list", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
    );

    // 0. Fetch all DB records for this user
    const userDbBooks = await Flipbook.find({ userEmail: emailId }).sort({ lastUpdated: -1 });

    // Fetch all assets for this user to use as thumbnails AND calculate sizes
    const bookVIds = userDbBooks.map((b) => b.v_id).filter(Boolean);
    const allAssets = await FlipbookAsset.find({
      $or: [
        { flipbook_v_id: { $in: bookVIds } },
        { userEmail: emailId }
      ]
    });

    const firstImageAssetMap = new Map();
    const bookSizeMap = new Map();

    allAssets.sort((a, b) =>
      (a.fileName || '').localeCompare(b.fileName || '', undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
    allAssets.forEach((asset) => {
      if (asset.assetType === "image" && asset.flipbook_v_id && !firstImageAssetMap.has(asset.flipbook_v_id)) {
        firstImageAssetMap.set(asset.flipbook_v_id, asset.url);
      }

      if (asset.size && asset.flipbook_v_id) {
        const currentSize = bookSizeMap.get(asset.flipbook_v_id) || 0;
        bookSizeMap.set(asset.flipbook_v_id, currentSize + asset.size);
      }
    });

    let books = [];
    const processedVIds = new Set();

    // 1. Process all MongoDB DB books first (primary source of truth)
    for (const doc of userDbBooks) {
      if (doc.folderName === "Recent Book" || (Array.isArray(doc.folderName) && doc.folderName.length === 1 && doc.folderName[0] === "Recent Book")) {
        continue; // Handled in recentBooks section
      }

      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : [doc.folderName];
      const folder = realFolders[0] || "My_Flipbooks";

      const createdDate = doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") + " " + new Date(doc.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
        : "";

      const totalSize = bookSizeMap.get(doc.v_id) || 0;

      processedVIds.add(doc.v_id);

      books.push({
        id: `${folder}_${doc.flipbookName}`,
        v_id: doc.v_id,
        realName: doc.flipbookName,
        title: doc.flipbookName,
        folder: folder,
        pages: doc.pages ? doc.pages.length : 0,
        created: createdDate,
        views: 0,
        size: formatSize(totalSize),
        image: firstImageAssetMap.get(doc.v_id) || null,
        mtime: doc.lastUpdated || doc.createdAt,
        share: doc.Customized_Settings?.Visibility || doc.share || null,
        Visibility: doc.Customized_Settings?.Visibility || doc.share || null,
        isPublished: Boolean(doc.isPublished),
      });
    }

    // 2. Generate 'Recent Book' view for all user flipbooks sorted by lastUpdated
    const sortedUserBooks = [...userDbBooks].sort((a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));

    const recentBooks = sortedUserBooks.map((doc) => {
      const realFolders = Array.isArray(doc.folderName)
        ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
        : doc.folderName === "Recent Book"
          ? []
          : [doc.folderName];
      const realFolder = realFolders.length > 0 ? realFolders[0] : "My_Flipbooks";

      const createdDate = doc.createdAt
        ? new Date(doc.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") + " " + new Date(doc.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
        : "";

      return {
        id: `Recent_${doc.v_id || doc.flipbookName}`,
        realName: doc.flipbookName,
        v_id: doc.v_id,
        title: doc.flipbookName,
        folder: "Recent Book",
        actualFolder: realFolder,
        pages: doc.pages ? doc.pages.length : 0,
        created: createdDate,
        views: 0,
        size: formatSize(bookSizeMap.get(doc.v_id) || 0),
        image: firstImageAssetMap.get(doc.v_id) || null,
        mtime: doc.lastUpdated || doc.createdAt,
        share: doc.Customized_Settings?.Visibility || doc.share || null,
        Visibility: doc.Customized_Settings?.Visibility || doc.share || null,
        isPublished: Boolean(doc.isPublished),
      };
    });

    const allBooks = [...books, ...recentBooks];
    res.json({ books: allBooks });
  } catch (err) {
    console.error("Error in /list:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/flipbook/preview/:v_id
// @desc    Return first-page HTML for a single flipbook (lazy preview)
// @access  Public
router.get("/preview/:v_id", async (req, res) => {
  try {
    const { v_id } = req.params;
    const { emailId: reqEmailId } = req.query;
    if (!v_id) {
      return res.status(400).json({ message: "Missing v_id" });
    }

    const doc = await Flipbook.findOne({ v_id });
    if (!doc) return res.status(404).json({ message: "Flipbook not found" });

    const emailId = reqEmailId || doc.userEmail;

    // Resolve physical folder (skip 'Recent Book' virtual tag)
    const realFolders = Array.isArray(doc.folderName)
      ? doc.folderName.filter((f) => f !== "Recent Book" && f !== "Recent book")
      : [doc.folderName];
    const realFolder = realFolders[0] || "My_Flipbooks";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const bookPath = path.join(
      __dirname,
      "../../uploads",
      sanitizedEmail,
      FLIPBOOK_ROOT,
      realFolder,
      doc.flipbookName,
    );

    const firstPage = doc.pages?.find((p) => p.pageNumber === 1) || doc.pages?.[0];
    if (!firstPage) return res.json({ html: null });

    let html = null;
    const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${realFolder}/${doc.flipbookName}/${firstPage.fileName}`;
    const buf = await downloadFileFromSupabase(supabasePath);
    if (buf) {
      html = buf.toString("utf8");
    } else {
      const firstPagePath = path.join(bookPath, firstPage.fileName);
      if (fs.existsSync(firstPagePath)) {
        html = fs.readFileSync(firstPagePath, "utf8");
      }
    }


    res.json({ html });
  } catch (err) {
    console.error("Error fetching preview:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route   GET /api/flipbook/folders
// @desc    Get list of folders in My_Flipbooks
// @access  Public
router.get("/folders", async (req, res) => {
  try {
    const { emailId } = req.query;
    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const folderSet = new Set();
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Fetch all folders from MongoDB DB documents
    const dbBooks = await Flipbook.find({ userEmail: emailId });
    dbBooks.forEach((doc) => {
      if (Array.isArray(doc.folderName)) {
        doc.folderName.forEach((f) => {
          if (f && f !== "Recent Book" && f !== "Recent book") folderSet.add(f);
        });
      } else if (doc.folderName && doc.folderName !== "Recent Book" && doc.folderName !== "Recent book") {
        folderSet.add(doc.folderName);
      }
    });

    // Fetch all folders from Supabase Storage
    const supabaseFolders = await listFoldersFromSupabase(sanitizedEmail);
    supabaseFolders.forEach((f) => folderSet.add(f));

    // Also check disk directory if present
    const uploadsDir = path.join(__dirname, "../../uploads");
    const myFlipbooksDir = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT);

    if (fs.existsSync(myFlipbooksDir)) {
      try {
        const items = fs.readdirSync(myFlipbooksDir, { withFileTypes: true });
        items
          .filter((item) => item.isDirectory())
          .forEach((item) => folderSet.add(item.name));
      } catch (e) {}
    }

    const folders = Array.from(folderSet).sort((a, b) => a.localeCompare(b));
    res.status(200).json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/folder/create
router.post("/folder/create", (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const safeFolderName = folderName.replace(/[^a-zA-Z0-9 _-]/g, "");

    // Sync folder creation to Supabase Storage by uploading placeholder .keep file
    const supabaseFolderKeep = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeFolderName}/.keep`;
    uploadBufferToSupabase(Buffer.from(""), supabaseFolderKeep, "text/plain").catch((err) =>
      console.warn("[Supabase] Folder create warning:", err)
    );

    res.json({ message: "Folder created", folder: safeFolderName });
  } catch (err) {
    console.error("Error creating folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/folder/rename
router.post("/folder/rename", async (req, res) => {
  try {
    const { emailId, oldName, newName } = req.body;
    if (!emailId || !oldName || !newName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, "");

    // 1. Fetch all books belonging to this folder in MongoDB
    const booksToUpdate = await Flipbook.find({
      userEmail: emailId,
      $or: [{ folderName: oldName }, { folderName: { $in: [oldName] } }]
    });

    // 2. Rename folder in Supabase Storage
    const oldSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${oldName}`;
    const newSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeNewName}`;
    await renamePathInSupabase(oldSupabasePrefix, newSupabasePrefix).catch((err) =>
      console.warn("[Supabase] Folder rename warning:", err)
    );

    // 3. Update MongoDB for all books in this folder
    for (const book of booksToUpdate) {
      if (Array.isArray(book.folderName)) {
        book.folderName = book.folderName.map((f) =>
          f === oldName ? safeNewName : f,
        );
      } else {
        book.folderName = [safeNewName];
      }
      book.lastUpdated = new Date();
      await book.save();
    }

    // 4. Update assets
    try {
      const assets = await FlipbookAsset.find({
        userEmail: emailId,
        $or: [{ folderName: oldName }, { url: { $regex: new RegExp(`/${FLIPBOOK_ROOT}/${oldName}/`) } }]
      });

      for (const asset of assets) {
        asset.folderName = safeNewName;
        if (asset.url) {
          asset.url = asset.url.replace(
            `/${FLIPBOOK_ROOT}/${oldName}/`,
            `/${FLIPBOOK_ROOT}/${safeNewName}/`
          );
        }
        await asset.save();
      }
    } catch (assetErr) {
      console.error("Error updating assets after folder rename:", assetErr);
    }

    res.json({ message: "Renamed successfully", newName: safeNewName });
  } catch (err) {
    console.error("Error renaming folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/folder/duplicate
router.post("/folder/duplicate", async (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Fetch MongoDB Documents for this folder
    const sourceDocs = await Flipbook.find({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });

    if (sourceDocs.length === 0) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Determine unique copy name
    const existingDbBooks = await Flipbook.find({ userEmail: emailId });
    const existingFolders = new Set();
    existingDbBooks.forEach(b => {
      if (Array.isArray(b.folderName)) b.folderName.forEach(f => existingFolders.add(f));
      else if (b.folderName) existingFolders.add(b.folderName);
    });

    let copyName = `${folderName}_Copy`;
    let counter = 1;
    while (existingFolders.has(copyName)) {
      copyName = `${folderName}_Copy_${counter}`;
      counter++;
    }

    // Initialize .keep in Supabase Storage for the duplicated folder
    const supabaseFolderKeep = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${copyName}/.keep`;
    await uploadBufferToSupabase(Buffer.from(""), supabaseFolderKeep, "text/plain").catch(() => {});

    // Copy MongoDB Documents & Rename each book to <bookName>_copy
    for (const doc of sourceDocs) {
      const newBookName = `${doc.flipbookName}_copy`;
      const newVId = nanoid(20);
      const pageIdMap = new Map();

      const newPages = (doc.pages || []).map((page) => {
        const newPageVId = nanoid(20);
        if (page.v_id) pageIdMap.set(page.v_id, newPageVId);

        return {
          pageNumber: page.pageNumber,
          name: page.name,
          fileName: page.fileName,
          v_id: newPageVId,
        };
      });

      await Flipbook.create({
        userEmail: doc.userEmail,
        folderName: [copyName],
        flipbookName: newBookName,
        pages: newPages,
        v_id: newVId,
        Customized_Settings: {
          ...(doc.Customized_Settings || doc.settings || {}),
          Visibility: {
            shareId: nanoid(12),
            access: doc.Customized_Settings?.Visibility?.access || doc.share?.access || 'public'
          },
          FlipbookInfo: {
            ...(doc.Customized_Settings?.FlipbookInfo || doc.meta || {}),
            flipbookName: newBookName,
            folderName: [copyName]
          }
        },
        lastUpdated: new Date(),
      });

      // Duplicate asset records
      const sourceAssets = await FlipbookAsset.find({ flipbook_v_id: doc.v_id });
      if (sourceAssets.length > 0) {
        const newAssets = sourceAssets.map(asset => {
          const assetObj = asset.toObject();
          delete assetObj._id;
          assetObj.flipbook_v_id = newVId;
          assetObj.folderName = copyName;
          assetObj.flipbookName = newBookName;
          assetObj.file_v_id = nanoid(20);
          if (assetObj.page_v_id && pageIdMap.has(assetObj.page_v_id)) {
            assetObj.page_v_id = pageIdMap.get(assetObj.page_v_id);
          }
          if (assetObj.url) {
            assetObj.url = assetObj.url
              .replace(`/${FLIPBOOK_ROOT}/${folderName}/`, `/${FLIPBOOK_ROOT}/${copyName}/`)
              .replace(`/${doc.flipbookName}/`, `/${newBookName}/`);
          }
          return assetObj;
        });
        await FlipbookAsset.insertMany(newAssets);
      }

      // Duplicate 3D model interaction records
      const sourceModels = await InteractionThreedModel.find({ userEmail: doc.userEmail, flipbookName: doc.flipbookName });
      if (sourceModels.length > 0) {
        const newModels = sourceModels.map(model => {
          const modelObj = model.toObject();
          delete modelObj._id;
          modelObj.flipbookName = newBookName;
          modelObj.folderName = copyName;
          if (modelObj.page_v_id && pageIdMap.has(modelObj.page_v_id)) {
            modelObj.page_v_id = pageIdMap.get(modelObj.page_v_id);
          }
          return modelObj;
        });
        await InteractionThreedModel.insertMany(newModels);
      }

      // Copy book files in Supabase Storage directly from old book prefix to new book prefix
      const sourceBookSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${doc.flipbookName}`;
      const targetBookSupabasePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${copyName}/${newBookName}`;
      await copyPathInSupabase(sourceBookSupabasePrefix, targetBookSupabasePrefix).catch((err) =>
        console.warn("[Supabase] Book copy error:", err)
      );

      ensureFlipbookFoldersInSupabase(sanitizedEmail, copyName, newBookName).catch(() => {});
    }

    res.json({ message: "Duplicated successfully", newFolderName: copyName });
  } catch (err) {
    console.error("Error duplicating folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route POST /api/flipbook/duplicate (Duplicate Book)
router.post("/duplicate", async (req, res) => {
  try {
    const { emailId, folderName, bookName } = req.body;
    if (!emailId || !folderName || !bookName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Fetch MongoDB Document for source book
    const sourceDoc = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: bookName,
    });

    if (!sourceDoc) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Determine unique copy name
    const existingDbBooks = await Flipbook.find({ userEmail: emailId });
    const existingNames = new Set(existingDbBooks.map(b => b.flipbookName));

    let copyName = `${bookName}_Copy`;
    let counter = 1;
    while (existingNames.has(copyName)) {
      copyName = `${bookName}_Copy ${counter}`;
      counter++;
    }

    // Duplicate MongoDB Document
    if (sourceDoc) {
      const newFlipbookVId = nanoid(20);
      const pageIdMap = new Map();

      const newPages = (sourceDoc.pages || []).map((page) => {
        const newPageVId = nanoid(20);
        if (page.v_id) pageIdMap.set(page.v_id, newPageVId);

        return {
          pageNumber: page.pageNumber,
          name: page.name,
          fileName: page.fileName,
          v_id: newPageVId,
        };
      });

      await Flipbook.create({
        userEmail: emailId,
        folderName: Array.isArray(sourceDoc.folderName) ? sourceDoc.folderName : [folderName],
        flipbookName: copyName,
        pages: newPages,
        v_id: newFlipbookVId,
        Customized_Settings: {
          ...(sourceDoc.Customized_Settings || sourceDoc.settings || {}),
          Visibility: {
            shareId: nanoid(12),
            access: sourceDoc.Customized_Settings?.Visibility?.access || sourceDoc.share?.access || 'public'
          },
          FlipbookInfo: {
            ...(sourceDoc.Customized_Settings?.FlipbookInfo || sourceDoc.meta || {}),
            flipbookName: copyName,
            folderName: Array.isArray(sourceDoc.folderName) ? sourceDoc.folderName : [folderName]
          }
        },
        lastUpdated: new Date(),
      });

      // Duplicate asset records
      if (sourceDoc.v_id) {
        try {
          const assets = await FlipbookAsset.find({
            flipbook_v_id: sourceDoc.v_id,
          });

          if (assets.length > 0) {
            const newAssets = assets.map(asset => {
              const newFileVId = nanoid(20);
              return {
                flipbook_v_id: newFlipbookVId,
                file_v_id: newFileVId,
                page_v_id: asset.page_v_id && pageIdMap.has(asset.page_v_id) ? pageIdMap.get(asset.page_v_id) : "global",
                assetType: asset.assetType,
                fileName: asset.fileName,
                flipbookName: copyName,
                folderName: folderName,
                url: asset.url ? asset.url.replace(`/${bookName}/`, `/${copyName}/`) : "",
                size: asset.size,
                userEmail: emailId
              };
            });
            await FlipbookAsset.insertMany(newAssets);
          }
        } catch (assetErr) {
          console.error("Error duplicating assets:", assetErr);
        }
      }

      // Duplicate 3D model interaction records
      try {
        const sourceModels = await InteractionThreedModel.find({ userEmail: emailId, flipbookName: bookName });
        if (sourceModels.length > 0) {
          const newModels = sourceModels.map(model => {
            const modelObj = model.toObject();
            delete modelObj._id;
            modelObj.flipbookName = copyName;
            modelObj.folderName = folderName;
            if (modelObj.page_v_id && pageIdMap.has(modelObj.page_v_id)) {
              modelObj.page_v_id = pageIdMap.get(modelObj.page_v_id);
            }
            return modelObj;
          });
          await InteractionThreedModel.insertMany(newModels);
        }
      } catch (modelErr) {
        console.error("Error duplicating 3D models:", modelErr);
      }

      // Initialize Supabase Storage structure for duplicated book
      ensureFlipbookFoldersInSupabase(sanitizedEmail, folderName, copyName).catch(() => {});
    }

    // Duplicate book in Supabase Storage
    const oldSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${bookName}`;
    const newSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${copyName}`;
    await copyPathInSupabase(oldSupabaseBookPrefix, newSupabaseBookPrefix).catch((err) =>
      console.warn("[Supabase] Duplicate book warning:", err)
    );

    res.json({ message: "Duplicated successfully", newBookName: copyName });
  } catch (err) {
    console.error("Error duplicating book:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// @route   GET /api/flipbook/get
// @desc    Get specific flipbook content (pages)
router.get("/get", async (req, res) => {
  try {
    const { emailId: reqEmailId, folderName, bookName, v_id, metadataOnly } = req.query;

    // V_ID Lookup Logic
    let dbDoc = null;
    if (v_id) {
      dbDoc = await Flipbook.findOne({ v_id: v_id });
    }

    const emailId = reqEmailId || (dbDoc ? dbDoc.userEmail : null);

    if (!emailId || (!v_id && (!folderName || !bookName)))
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    let effectiveFolderName = folderName;
    let effectiveBookName = bookName;

    if (dbDoc) {
      if (reqEmailId && dbDoc.userEmail !== reqEmailId && !dbDoc.isPublished)
        return res.status(403).json({ message: "Unauthorized" });

      effectiveBookName = dbDoc.flipbookName;


      // Resolve folder logic
      if (Array.isArray(dbDoc.folderName)) {
        const realFolders = dbDoc.folderName.filter((f) => f !== "Recent Book");
        if (realFolders.length > 0) effectiveFolderName = realFolders[0];
        else effectiveFolderName = "My_Flipbooks"; // Fallback
      } else {
        effectiveFolderName = dbDoc.folderName;
      }
    } else {
      // Fallback if v_id wasn't found (could be a book name) or wasn't provided
      if (!folderName || !bookName) {
        return res.status(404).json({ message: "Flipbook not found" });
      }

      effectiveFolderName = folderName;
      effectiveBookName = bookName;

      // Logic for folderName/bookName driven request
      if (effectiveFolderName === "Recent Book") {
        // If requested from Recent Book, find the specific doc tagged with 'Recent Book'
        const recentDbDoc = await Flipbook.findOne({
          userEmail: emailId,
          flipbookName: effectiveBookName,
          folderName: "Recent Book",
        });

        if (recentDbDoc && recentDbDoc.folderName) {
          if (Array.isArray(recentDbDoc.folderName)) {
            // Get the first non-Recent folder (the physical one)
            const realFolders = recentDbDoc.folderName.filter(
              (f) => f !== "Recent Book",
            );
            if (realFolders.length > 0) effectiveFolderName = realFolders[0];
          } else if (recentDbDoc.folderName !== "Recent Book") {
            effectiveFolderName = recentDbDoc.folderName;
          }
        }
      }
    }

    const bookPath = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      effectiveFolderName,
      effectiveBookName,
    );

    let pages = [];

    // 1. Try fetching from MongoDB first
    let dbBook = dbDoc;
    if (!dbBook) {
      dbBook = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: effectiveBookName,
      });
    }

    if (!dbBook && !fs.existsSync(bookPath)) {
      return res.status(404).json({ message: "Book not found" });
    }


    if (dbBook) {
      dbBook.lastUpdated = new Date();
      dbBook.save().catch(() => {});
    }

    if (dbBook && dbBook.pages && dbBook.pages.length > 0) {
      // Sort by pageNumber to ensure correct order
      dbBook.pages.sort((a, b) => a.pageNumber - b.pageNumber);

      // Auto-heal check: test if first page exists under effectiveBookName in Supabase
      if (metadataOnly !== 'true') {
        const firstPageFileName = dbBook.pages[0].fileName;
        const testPath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/${firstPageFileName}`;
        let testBuf = await downloadFileFromSupabase(testPath);
        if (!testBuf || testBuf.length === 0) {
          const testLocalPath = path.join(bookPath, firstPageFileName);
          if (!fs.existsSync(testLocalPath)) {
            console.log(`[Auto-Heal] Page not found at ${testPath}. Checking legacy folders...`);
            try {
              const allFolders = await listFoldersFromSupabase(sanitizedEmail);
              for (const folderCandidate of allFolders) {
                if (folderCandidate === effectiveBookName) continue;
                const candidatePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${folderCandidate}/${firstPageFileName}`;
                const candidateBuf = await downloadFileFromSupabase(candidatePath);
                if (candidateBuf && candidateBuf.length > 0) {
                  console.log(`[Auto-Heal] Found page in legacy folder "${folderCandidate}". Renaming to "${effectiveBookName}" in Supabase...`);
                  const oldSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${folderCandidate}`;
                  const newSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;
                  await renamePathInSupabase(oldSupabasePath, newSupabasePath).catch(err =>
                    console.warn("[Auto-Heal] Supabase rename error:", err)
                  );
                  break;
                }
              }
            } catch (healErr) {
              console.warn("[Auto-Heal] Legacy check error:", healErr);
            }
          }
        }
      }

      const pagePromises = dbBook.pages.map(async (p) => {
        try {
          if (metadataOnly === 'true') {
             return {
                name: p.name,
                fileName: p.fileName,
                html: "",
                v_id: p.v_id,
             };
          }
          // Fetch from Supabase Storage with local disk fallback
          const supabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/${p.fileName}`;
          let buf = await downloadFileFromSupabase(supabasePath);

          if (!buf || buf.length === 0) {
            const localFilePath = path.join(bookPath, p.fileName);
            if (fs.existsSync(localFilePath)) {
              buf = fs.readFileSync(localFilePath);
              // Trigger background upload to Supabase if missing
              uploadFileToSupabase(localFilePath, supabasePath).catch(() => {});
            }
          }

          // Rewrite /uploads/ and relative ./assets/ references to Supabase CDN
          const flipbookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;
          const content = buf ? rewriteUploadsToSupabase(buf.toString("utf8"), flipbookPrefix) : "";

          return {
            name: p.name,
            fileName: p.fileName,
            html: content,
            v_id: p.v_id,
          };


        } catch (e) {
          return null;
        }
      });
      pages = (await Promise.all(pagePromises)).filter(Boolean);
    }

    // 2. Fallback: If DB has pages but Supabase returned no content, list files from Supabase via DB metadata
    if (pages.length === 0 && dbBook && dbBook.pages && dbBook.pages.length > 0) {
      pages = dbBook.pages.map(p => ({
        name: p.name,
        fileName: p.fileName,
        html: "",
        v_id: p.v_id,
      }));
    }

    // Ensure shareId / Visibility exists (Auto-heal for legacy data)
    let finalVisibility = dbBook ? (dbBook.Customized_Settings?.Visibility || dbBook.share) : {};
    if (dbBook) {
      if (!finalVisibility || !finalVisibility.shareId) {
        finalVisibility = {
          shareId: finalVisibility?.shareId || nanoid(12),
          access: finalVisibility?.access || 'public'
        };
        dbBook.set('Customized_Settings.Visibility', finalVisibility);
        try {
          await dbBook.save();
        } catch (saveErr) {
          console.error("Error auto-healing shareId:", saveErr);
        }
      }
    }

    const docFlipbookInfo = dbBook?.Customized_Settings?.FlipbookInfo || dbBook?.meta || {};
    const rawSettings = dbBook ? (dbBook.Customized_Settings || dbBook.settings || {}) : {};
    const docSettings = { ...rawSettings };
    delete docSettings.visibility;
    delete docSettings.FlipbookInfo;
    const docWidth = docFlipbookInfo?.width || dbBook?.width || docSettings?.width;
    const docHeight = docFlipbookInfo?.height || dbBook?.height || docSettings?.height;
    const docTemplateId = docFlipbookInfo?.templateId || dbBook?.templateId || docSettings?.templateId;
    const docOrientation = docFlipbookInfo?.orientation || dbBook?.orientation || docSettings?.orientation;

    const flipbookInfoObj = {
      ...docFlipbookInfo,
      flipbookName: effectiveBookName,
      folderName: effectiveFolderName,
      v_id: dbBook ? dbBook.v_id : null,
      width: docWidth,
      height: docHeight,
      templateId: docTemplateId,
      orientation: docOrientation,
      isPublished: dbBook ? Boolean(dbBook.isPublished) : false,
      quotes: docFlipbookInfo.quotes || dbBook?.quotes || "",
      about: docFlipbookInfo.about || dbBook?.about || "",
      category: docFlipbookInfo.category || dbBook?.category || "Product Based",
      language: docFlipbookInfo.language || dbBook?.language || "English",
      tags: docFlipbookInfo.tags || dbBook?.tags || [],
      baseUrl: `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/`
    };

    res.json({
      _id: dbBook ? dbBook._id : null,
      v_id: dbBook ? dbBook.v_id : (v_id || null),
      flipbookName: effectiveBookName,
      folderName: dbBook ? dbBook.folderName : effectiveFolderName,
      userEmail: emailId,
      createdAt: dbBook ? dbBook.createdAt : null,
      lastUpdated: dbBook ? dbBook.lastUpdated : null,
      isPublished: dbBook ? Boolean(dbBook.isPublished) : false,
      pages,
      Customized_Settings: docSettings,
      settings: docSettings,
      Visibility: finalVisibility,
      share: finalVisibility,
      quotes: flipbookInfoObj.quotes,
      about: flipbookInfoObj.about,
      category: flipbookInfoObj.category,
      language: flipbookInfoObj.language,
      tags: flipbookInfoObj.tags,
      FlipbookInfo: flipbookInfoObj,
      meta: flipbookInfoObj,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// @route   POST /api/flipbook/publish
// @desc    Publish a flipbook with category, language, tags & quotes
router.post('/publish', async (req, res) => {
  try {
    const { emailId, v_id, bookName, category, language, tags, quotes, about } = req.body;
    if (!emailId || !v_id) {
      return res.status(400).json({ message: "Missing emailId or v_id" });
    }

    const updateData = {
      isPublished: true,
      lastUpdated: new Date(),
      'Customized_Settings.FlipbookInfo.publishedAt': new Date()
    };

    const existingDoc = await Flipbook.findOne({ userEmail: emailId, v_id: v_id });

    if (bookName && existingDoc && existingDoc.flipbookName !== bookName.trim()) {
      const oldName = existingDoc.flipbookName;
      const safeNewName = bookName.trim();

      if (safeNewName && safeNewName !== oldName) {
        const sanitizedEmail = emailId.replace(/[@.]/g, "_");
        const uploadsDir = path.join(__dirname, "../../uploads");

        let physicalFolderName = req.body.folderName || "My_Flipbooks";
        if (existingDoc.folderName) {
          const folders = Array.isArray(existingDoc.folderName) ? existingDoc.folderName : [existingDoc.folderName];
          const realFolder = folders.find(f => f !== "Recent Book" && f !== "Recent book");
          if (realFolder) physicalFolderName = realFolder;
        }

        const oldSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${oldName}`;
        const newSupabasePath = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${physicalFolderName}/${safeNewName}`;
        await renamePathInSupabase(oldSupabasePath, newSupabasePath).catch(err =>
          console.warn("[Supabase] Rename flipbook folder warning in publish:", err)
        );

        const oldLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, oldName);
        const newLocalPath = path.join(uploadsDir, sanitizedEmail, FLIPBOOK_ROOT, physicalFolderName, safeNewName);
        if (fs.existsSync(oldLocalPath) && !fs.existsSync(newLocalPath)) {
          try {
            fs.renameSync(oldLocalPath, newLocalPath);
          } catch (e) {
            console.warn("[Local Disk] Rename flipbook folder warning in publish:", e);
          }
        }

        updateData.flipbookName = safeNewName;
        updateData['Customized_Settings.FlipbookInfo.flipbookName'] = safeNewName;
      }
    } else if (bookName) {
      updateData.flipbookName = bookName;
      updateData['Customized_Settings.FlipbookInfo.flipbookName'] = bookName;
    }
    if (category) {
      updateData['Customized_Settings.FlipbookInfo.category'] = category;
    }
    if (language) {
      updateData['Customized_Settings.FlipbookInfo.language'] = language;
    }
    if (tags) {
      updateData['Customized_Settings.FlipbookInfo.tags'] = tags;
    }
    if (quotes !== undefined) {
      updateData['Customized_Settings.FlipbookInfo.quotes'] = quotes;
    }
    if (about !== undefined) {
      updateData['Customized_Settings.FlipbookInfo.about'] = about;
    }

    const updatedDoc = await Flipbook.findOneAndUpdate(
      { userEmail: emailId, v_id: v_id },
      {
        $set: updateData,
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    res.json({ message: "Flipbook published successfully", flipbook: updatedDoc });
  } catch (err) {
    console.error("Error publishing flipbook:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/unpublish
// @desc    Unpublish a flipbook
router.post('/unpublish', async (req, res) => {
  try {
    const { emailId, v_id } = req.body;
    if (!emailId || !v_id) {
      return res.status(400).json({ message: "Missing emailId or v_id" });
    }

    const updatedDoc = await Flipbook.findOneAndUpdate(
      { userEmail: emailId, v_id: v_id },
      {
        $set: { isPublished: false, 'Customized_Settings.FlipbookInfo.tags': [], lastUpdated: new Date() },
        $unset: { share: 1, settings: 1, meta: 1, category: 1, language: 1, tags: 1, quotes: 1, about: 1, width: 1, height: 1, templateId: 1, orientation: 1 }
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ message: "Flipbook not found" });
    }

    res.json({ message: "Flipbook unpublished successfully", flipbook: updatedDoc });
  } catch (err) {
    console.error("Error unpublishing flipbook:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to check if Invite Only auto expire timer has passed
const checkInviteAutoExpired = (autoExpire, fallbackDate) => {
  if (!autoExpire || !autoExpire.enabled) return false;

  const rawGranted = autoExpire.grantedAt || autoExpire.createdAt || fallbackDate;
  if (!rawGranted) return false;
  const grantedAt = new Date(rawGranted).getTime();

  // Parse days: e.g. "0 Days", "1 Days", "5 Days"
  const daysStr = String(autoExpire.days || '0');
  const daysMatch = daysStr.match(/(\d+)/);
  const daysNum = daysMatch ? parseInt(daysMatch[1], 10) : 0;

  // Parse time: e.g. "5 Mins", "15 Mins", "30 Mins", "1 Hour"
  const timeStr = String(autoExpire.time || '0');
  const timeMatch = timeStr.match(/(\d+)/);
  const timeNum = timeMatch ? parseInt(timeMatch[1], 10) : 0;

  let timeInMs = 0;
  if (timeStr.toLowerCase().includes('hour')) {
    timeInMs = timeNum * 60 * 60 * 1000;
  } else {
    timeInMs = timeNum * 60 * 1000;
  }

  const daysInMs = daysNum * 24 * 60 * 60 * 1000;
  const totalAllowedMs = daysInMs + timeInMs;

  if (totalAllowedMs <= 0) return false;

  const now = Date.now();
  const elapsed = now - grantedAt;

  return elapsed > totalAllowedMs;
};

// @route   GET /api/flipbook/public/get/:shareId
// @desc    Get specific flipbook content publicly for sharing
router.get("/public/get/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    // Find strictly by shareId inside Customized_Settings.Visibility or share
    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};

    const reqEmail = (req.query.emailId || '').trim().toLowerCase();
    const ownerEmail = (dbDoc.userEmail || '').trim().toLowerCase();
    const isOwner = Boolean(reqEmail && ownerEmail && reqEmail === ownerEmail);
    const accessMode = String(vis.access || vis.type || 'public').toLowerCase();

    // Publication check (Owner can view unpublished flipbook, public readers cannot view ANY unpublished flipbook)
    if (!isOwner && (dbDoc.isPublished === false || !dbDoc.isPublished)) {
      return res.status(403).json({
        message: "This Flipbook not Yet Published",
        isUnpublished: true
      });
    }

    // Check visibility access controls
    const reqPassword = req.query.password;
    const reqAccessKey = req.query.accessKey;

    // Pre-build preview page structures for background blur preview
    const previewPages = (dbDoc.pages || []).map(p => ({
      id: p.pageNumber,
      name: p.name,
      fileName: p.fileName,
      html: "",
      v_id: p.v_id
    }));

    // 1. Private access check (Private flipbooks cannot be viewed via public share links)
    if (accessMode.includes('private')) {
      return res.status(403).json({ message: "This flipbook is private. It cannot be viewed via public link.", isPrivate: true, accessMode: 'private' });
    }

    // 2. Password Protect access check (Strictly require matching Access Key ONLY)
    if (accessMode.includes('password')) {
      const isOwner = reqEmail && reqEmail === dbDoc.userEmail;
      if (!isOwner) {
        const inputKey = (reqAccessKey || reqPassword || '').trim();
        const keyMatches = await compareKeys(inputKey, vis.accessKey);
        if (!keyMatches) {
          return res.status(401).json({
            message: "Invalid Access Key",
            isPasswordProtected: true,
            bookName: dbDoc.flipbookName,
            accessMode: 'password',
            pages: previewPages,
            FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
          });
        }
      }
    }

    // 3. Invite Only Access check
    if (accessMode.includes('invite')) {
      const isOwner = reqEmail && reqEmail === dbDoc.userEmail;
      if (!isOwner) {
        const allowedEmails = (vis.inviteOnly?.emails || []).map(e => (e.email || e).toLowerCase());
        const allowedDomains = (vis.inviteOnly?.domains || []).map(d => (d.domain || d).toLowerCase());
        
        const userEmailLower = (reqEmail || '').toLowerCase();
        const userDomainLower = userEmailLower.includes('@') ? userEmailLower.split('@')[1] : '';

        const isEmailAllowed = allowedEmails.includes(userEmailLower);
        const isDomainAllowed = allowedDomains.some(dom => userDomainLower === dom || userDomainLower.endsWith('.' + dom));

        if (!userEmailLower || (!isEmailAllowed && !isDomainAllowed)) {
          return res.status(403).json({
            message: "Invite only access required",
            isInviteOnly: true,
            accessMode: 'invite',
            pages: previewPages,
            FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
            Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
          });
        }

        // Check Auto Expire timer for invited readers
        const autoExpire = vis.inviteOnly?.autoExpire;
        if (autoExpire && autoExpire.enabled) {
          const isExpired = checkInviteAutoExpired(autoExpire, dbDoc.updatedAt || dbDoc.createdAt);
          if (isExpired) {
            return res.status(403).json({
              message: "Time Expired! The access time granted for this flipbook has expired.",
              isExpired: true,
              isInviteOnly: true,
              accessMode: 'invite',
              pages: previewPages,
              FlipbookInfo: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
              meta: dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {},
              Customized_Settings: dbDoc.Customized_Settings || dbDoc.settings || {}
            });
          }
        }
      }
    }

    // Fetch pages
    const sanitizedEmail = dbDoc.userEmail.replace(/[@.]/g, "_");
    const realFolders = Array.isArray(dbDoc.folderName)
      ? dbDoc.folderName.filter(f => f !== "Recent Book" && f !== "Recent book")
      : [dbDoc.folderName];
    const effectiveFolderName = realFolders.length > 0 ? realFolders[0] : "My_Flipbooks";
    const effectiveBookName = dbDoc.flipbookName;

    const uploadsDir = path.join(__dirname, "../../uploads");
    const bookPath = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      effectiveFolderName,
      effectiveBookName,
    );

    // AUTO-HEAL: If DB has no pages but files exist on disk, populate it
    if (!dbDoc.pages || dbDoc.pages.length === 0) {
      if (fs.existsSync(bookPath)) {
        try {
          const files = await fs.promises.readdir(bookPath);
          const svgFiles = files.filter(f => f.endsWith('.svg') || f.endsWith('.html')).sort((a, b) => {
            const aNum = parseInt(a.match(/\d+/)?.[0] || 0);
            const bNum = parseInt(b.match(/\d+/)?.[0] || 0);
            return aNum - bNum;
          });

          if (svgFiles.length > 0) {
            const autoHealedPages = svgFiles.map((fileName, idx) => ({
              pageNumber: idx + 1,
              name: `Page ${idx + 1}`,
              fileName: fileName,
              v_id: `page_${nanoid(8)}`
            }));

            dbDoc.pages = autoHealedPages;
            await dbDoc.save();
          }
        } catch (e) {
          console.error(`[PublicGet] Auto-heal failed for v_id: ${dbDoc.v_id}`, e);
        }
      }
    }

    if (dbDoc.pages) {
      dbDoc.pages.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    const flipbookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}`;

    const pagePromises = (dbDoc.pages || []).map(async (p) => {
      try {
        const supabasePath = `${flipbookPrefix}/${p.fileName}`;
        let buf = await downloadFileFromSupabase(supabasePath);

        if (!buf || buf.length === 0) {
          const localFilePath = path.join(bookPath, p.fileName);
          if (fs.existsSync(localFilePath)) {
            buf = await fs.promises.readFile(localFilePath);
          }
        }

        const content = buf ? rewriteUploadsToSupabase(buf.toString("utf8"), flipbookPrefix) : "";
        return {
          id: p.pageNumber,
          name: p.name,
          fileName: p.fileName,
          html: content || "",
          v_id: p.v_id,
        };
      } catch (e) {
        return {
          id: p.pageNumber,
          name: p.name,
          fileName: p.fileName,
          html: "",
          v_id: p.v_id,
        };
      }
    });

    let pages = (await Promise.all(pagePromises)).filter(Boolean);

    // Fallback: If pages returned no content, map DB metadata pages
    if (pages.length === 0 && dbDoc.pages && dbDoc.pages.length > 0) {
      pages = dbDoc.pages.map(p => ({
        id: p.pageNumber,
        name: p.name,
        fileName: p.fileName,
        html: "",
        v_id: p.v_id,
      }));
    }

    const docFlipbookInfo = dbDoc.Customized_Settings?.FlipbookInfo || dbDoc.meta || {};
    const docSettings = { ...(dbDoc.Customized_Settings || dbDoc.settings || {}) };
    delete docSettings.FlipbookInfo;
    delete docSettings.visibility;

    const flipbookInfoObj = {
      ...docFlipbookInfo,
      flipbookName: effectiveBookName,
      folderName: effectiveFolderName,
      v_id: dbDoc.v_id,
      baseUrl: `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${effectiveBookName}/`
    };

    res.json({
      v_id: dbDoc.v_id,
      flipbookName: dbDoc.flipbookName,
      folderName: effectiveFolderName,
      userEmail: dbDoc.userEmail,
      pages,
      Customized_Settings: docSettings,
      settings: docSettings,
      Visibility: vis,
      share: vis,
      isPublished: Boolean(dbDoc.isPublished),
      FlipbookInfo: flipbookInfoObj,
      meta: flipbookInfoObj,
    });
  } catch (err) {
    console.error("Error in /public/get:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/flipbook/check-owner/:shareId
// @desc    Check if a flipbook belongs to a specific user email via shareId
router.get("/check-owner/:shareId", async (req, res) => {
  try {
    const { shareId } = req.params;
    const { emailId } = req.query;
    
    if (!shareId || !emailId) return res.status(400).json({ message: "Missing shareId or emailId" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    if (dbDoc.userEmail !== emailId) {
      return res.status(403).json({ message: "Unauthorized", isOwner: false });
    }

    res.json({ message: "Authorized", isOwner: true });
  } catch (err) {
    console.error("Error in check-owner:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/public/verify-password
// @desc    Verify password or accessKey for a password-protected flipbook
router.post("/public/verify-password", async (req, res) => {
  try {
    const { shareId, password, accessKey } = req.body;
    if (!shareId) return res.status(400).json({ message: "Missing shareId" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};
    const inputKey = accessKey || password;

    if (inputKey) {
      const isKeyMatch = await compareKeys(inputKey, vis.accessKey);
      if (isKeyMatch) {
        return res.json({ success: true, message: "Verification successful" });
      }
    }

    return res.status(401).json({ success: false, message: "Invalid Access Key" });
  } catch (err) {
    console.error("Error verifying password:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/flipbook/verify-credential
// @desc    Verify current password or access key for editing visibility settings
router.post('/verify-credential', async (req, res) => {
  try {
    const { v_id, input, mode } = req.body;
    if (!input) return res.status(400).json({ message: "Missing input" });

    if (v_id) {
      const dbDoc = await Flipbook.findOne({
        $or: [{ v_id: v_id }, { flipbookName: v_id }]
      });

      if (dbDoc) {
        const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};

        if (mode === 'password') {
          const isPassMatch = await compareKeys(input, vis.password);
          if (isPassMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
          return res.status(400).json({ message: "Current password is incorrect." });
        } else if (mode === 'accessKey') {
          const isKeyMatch = await compareKeys(input, vis.accessKey);
          if (isKeyMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
          return res.status(400).json({ message: "Current access key is incorrect." });
        } else {
          const isPassMatch = await compareKeys(input, vis.password);
          const isKeyMatch = await compareKeys(input, vis.accessKey);
          if (isPassMatch || isKeyMatch) {
            return res.json({ success: true, message: "Verification successful" });
          }
        }
      }
    }

    return res.status(400).json({ message: mode === 'accessKey' ? "Current access key is incorrect." : "Current password is incorrect." });
  } catch (err) {
    console.error("Error verifying credential:", err);
    res.status(500).json({ message: "Server error verifying credential" });
  }
});

// @route   POST /api/flipbook/send-visibility-otp
// @desc    Send OTP to user email for visibility settings & store OTP in Flipbook model
router.post('/send-visibility-otp', async (req, res) => {
  try {
    const { emailId, v_id } = req.body;
    if (!emailId) return res.status(400).json({ message: "Missing emailId" });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store hashed OTP in Flipbook document if v_id is provided
    if (v_id) {
      await Flipbook.findOneAndUpdate(
        { v_id: v_id },
        { 
          $set: { 
            'Customized_Settings.Visibility.otp': hashedOtp,
            'share.otp': hashedOtp 
          } 
        }
      );
    }

    // Try sending email via Nodemailer
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `Fisto <${process.env.EMAIL_USER || 'no-reply@fistotech.com'}>`,
        to: emailId,
        subject: 'Your Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
              <div style="background: linear-gradient(135deg, #4c5add, #3f4bc0); padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 2px;">FIST-O</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; font-size: 22px; font-weight: 600; margin-top: 0; text-align: center;">Verification Code</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">Please use the verification code below to update your flipbook security settings.</p>
                
                <div style="background-color: #f8f9fe; border: 2px dashed #4c5add; border-radius: 8px; padding: 24px; text-align: center; margin: 30px 0;">
                  <span style="display: block; font-size: 36px; font-weight: 700; color: #4c5add; letter-spacing: 8px; margin-left: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                  This code is valid for a limited time. If you did not request this code, you can safely ignore this email.
                </p>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fisto Tech. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailErr) {
      console.error("Nodemailer error sending visibility OTP:", emailErr);
      console.log(`[DEV OTP FALLBACK] Visibility OTP for ${emailId} (${v_id}): ${otp}`);
    }

    return res.json({ success: true, message: "OTP sent successfully", devOtp: otp });
  } catch (err) {
    console.error("Error sending visibility OTP:", err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
});

// @route   POST /api/flipbook/verify-visibility-otp
// @desc    Verify OTP stored in Flipbook Visibility settings
router.post('/verify-visibility-otp', async (req, res) => {
  try {
    const { emailId, v_id, otp } = req.body;
    if (!otp) return res.status(400).json({ message: "Missing OTP code" });

    const inputOtp = String(otp).trim();

    if (v_id) {
      const dbDoc = await Flipbook.findOne({
        $or: [{ v_id: v_id }, { flipbookName: v_id }]
      });

      if (dbDoc) {
        const storedOtp = dbDoc.Customized_Settings?.Visibility?.otp || dbDoc.share?.otp;
        if (storedOtp) {
          const isOtpMatch = (await bcrypt.compare(inputOtp, String(storedOtp).trim())) || String(storedOtp).trim() === inputOtp;
          if (isOtpMatch) {
            // Clear OTP after successful verification
            await Flipbook.updateOne({ _id: dbDoc._id }, { $unset: { 'Customized_Settings.Visibility.otp': 1, 'share.otp': 1 } });
            return res.json({ success: true, message: "OTP verified successfully" });
          }
        }
      }
    }

    // Fallback user OTP verify check if User model has OTP
    const userDoc = await User.findOne({ 
      $or: [{ emailId: emailId }, { emailId: { $regex: new RegExp(`^${(emailId || '').trim()}$`, 'i') } }]
    });

    if (userDoc && userDoc.otp) {
      const isMatch = await bcrypt.compare(inputOtp, userDoc.otp);
      if (isMatch) {
        userDoc.otp = null;
        await userDoc.save();
        return res.json({ success: true, message: "OTP verified successfully" });
      }
    }

    return res.status(400).json({ message: "Invalid OTP code" });
  } catch (err) {
    console.error("Error verifying visibility OTP:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
});

// @route   POST /api/flipbook/public/verify-invite
// @desc    Verify if user email or domain is allowed for an invite-only flipbook
router.post("/public/verify-invite", async (req, res) => {
  try {
    const { shareId, email } = req.body;
    if (!shareId || !email) return res.status(400).json({ message: "Missing shareId or email" });

    const dbDoc = await Flipbook.findOne({
      $or: [
        { "Customized_Settings.Visibility.shareId": shareId },
        { "share.shareId": shareId }
      ]
    });
    if (!dbDoc) return res.status(404).json({ message: "Flipbook not found" });

    const vis = dbDoc.Customized_Settings?.Visibility || dbDoc.share || {};
    const userEmailLower = email.trim().toLowerCase();
    const userDomainLower = userEmailLower.includes('@') ? userEmailLower.split('@')[1] : '';

    const allowedEmails = (vis.inviteOnly?.emails || []).map(e => (e.email || e).toLowerCase());
    const allowedDomains = (vis.inviteOnly?.domains || []).map(d => (d.domain || d).toLowerCase());

    const isEmailAllowed = allowedEmails.includes(userEmailLower);
    const isDomainAllowed = allowedDomains.some(dom => userDomainLower === dom || userDomainLower.endsWith('.' + dom));

    if (isEmailAllowed || isDomainAllowed) {
      // Check Auto Expire timer
      const autoExpire = vis.inviteOnly?.autoExpire;
      if (autoExpire && autoExpire.enabled) {
        const isExpired = checkInviteAutoExpired(autoExpire, dbDoc.updatedAt || dbDoc.createdAt);
        if (isExpired) {
          return res.status(403).json({
            success: false,
            isExpired: true,
            message: "Time Expired! The access time granted for this flipbook has expired."
          });
        }
      }

      return res.json({ success: true, message: "Invite access verified" });
    }

    return res.status(403).json({ success: false, message: "Your email or domain is not authorized to view this flipbook" });
  } catch (err) {
    console.error("Error verifying invite:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/flipbook/folder
router.delete("/folder", async (req, res) => {
  try {
    const { emailId, folderName } = req.body;
    if (!emailId || !folderName)
      return res.status(400).json({ message: "Missing fields" });

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const targetDir = path.join(
      uploadsDir,
      sanitizedEmail,
      "My_Flipbooks",
      folderName,
    );

    // Delete local directory if it exists
    if (fs.existsSync(targetDir)) {
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn("Local folder rmSync warning:", rmErr);
      }
    }

    // Delete folder from Supabase Storage
    const supabaseFolderPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}`;
    await deleteFolderFromSupabase(supabaseFolderPrefix).catch((e) =>
      console.warn("[Supabase] Delete folder warning:", e)
    );



    // Find all books to be deleted to get their v_ids
    const booksToDelete = await Flipbook.find({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });
    const bookVIds = booksToDelete.map((b) => b.v_id).filter(Boolean);

    if (bookVIds.length > 0) {
      console.log(
        `Deleting assets for ${bookVIds.length} flipbooks in folder: ${folderName}`,
      );
      try {
        const folderAssets = await FlipbookAsset.find({ flipbook_v_id: { $in: bookVIds } });
        for (const asset of folderAssets) {
          if (asset.url) {
            deleteFileFromSupabase(asset.url).catch(e => console.warn("[Supabase] Delete asset warning:", e));
          }
        }
        // Remove asset records
        const result = await FlipbookAsset.deleteMany({
          flipbook_v_id: { $in: bookVIds },
        });
        console.log(`Deleted ${result.deletedCount} asset records.`);
      } catch (assetErr) {
        console.error("Error cleaning up folder assets:", assetErr);
      }
    }

    // Delete from MongoDB
    await Flipbook.deleteMany({
      userEmail: emailId,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/rename
router.post("/rename", async (req, res) => {
  try {
    const { emailId, folderName, oldName, newName } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Resolve Real Folder
    let effectiveFolderName = folderName;
    if (folderName === "Recent Book") {
      const dbDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: oldName,
        folderName: "Recent Book",
      });
      if (dbDoc && dbDoc.folderName) {
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          if (realFolders.length > 0) effectiveFolderName = realFolders[0];
        } else if (dbDoc.folderName !== "Recent Book") {
          effectiveFolderName = dbDoc.folderName;
        }
      }
    }

    const safeNewName = newName.replace(/[^a-zA-Z0-9 _-]/g, "");

    // Check MongoDB for source book and target conflict
    const docToUpdate = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: oldName,
    });

    const targetDoc = await Flipbook.findOne({
      userEmail: emailId,
      flipbookName: safeNewName,
    });

    if (targetDoc && targetDoc.v_id !== docToUpdate?.v_id) {
      return res.status(409).json({ message: "Name exists" });
    }

    if (!docToUpdate) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Sync book folder rename to Supabase Storage
    const oldSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${oldName}`;
    const newSupabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveFolderName}/${safeNewName}`;
    await renamePathInSupabase(oldSupabaseBookPrefix, newSupabaseBookPrefix).catch((err) =>
      console.warn("[Supabase] Book rename warning:", err)
    );

    // Update MongoDB
    if (docToUpdate) {
      docToUpdate.flipbookName = safeNewName;
      docToUpdate.lastUpdated = new Date();
      await docToUpdate.save();
    }

    // UPDATE ASSETS: Update flipbookName and reconstruct URLs
    if (docToUpdate && docToUpdate.v_id) {
      try {
        console.log(
          `Updating assets for renamed flipbook: "${oldName}" → "${safeNewName}"`,
        );

        const assets = await FlipbookAsset.find({
          flipbook_v_id: docToUpdate.v_id,
        });

        if (assets.length > 0) {
          for (const asset of assets) {
            asset.flipbookName = safeNewName;
            const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
            asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${asset.folderName}/${safeNewName}/assets/${asset.assetType}/${asset.fileName}`;
            await asset.save();
          }
          console.log(
            `✅ Updated ${assets.length} asset(s) for renamed flipbook`,
          );
        }
      } catch (err) {
        console.error("❌ Error updating assets after rename:", err);
      }
    }

    res.json({ message: "Renamed", newName: safeNewName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/move
router.post("/move", async (req, res) => {
  try {
    const { emailId, bookName, currentFolder, targetFolder } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Resolve Real Source Folder
    let effectiveCurrentFolder = currentFolder;
    if (currentFolder === "Recent Book") {
      const dbDoc = await Flipbook.findOne({
        userEmail: emailId,
        flipbookName: bookName,
        folderName: "Recent Book",
      });
      if (dbDoc && dbDoc.folderName) {
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          if (realFolders.length > 0) effectiveCurrentFolder = realFolders[0];
        } else if (dbDoc.folderName !== "Recent Book") {
          effectiveCurrentFolder = dbDoc.folderName;
        }
      }
    }

    // Move flipbook directory in Supabase Storage
    const oldSupabaseMovePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${effectiveCurrentFolder}/${bookName}`;
    const newSupabaseMovePrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${bookName}`;
    await renamePathInSupabase(oldSupabaseMovePrefix, newSupabaseMovePrefix).catch((err) =>
      console.warn("[Supabase] Book move warning:", err)
    );

    // Update MongoDB
    const bookToMove = await Flipbook.findOne({
      userEmail: emailId,
      folderName: { $in: [effectiveCurrentFolder] },
      flipbookName: bookName,
    });

    if (bookToMove) {
      if (Array.isArray(bookToMove.folderName)) {
        let tags = bookToMove.folderName.filter(
          (f) => f !== effectiveCurrentFolder,
        );
        tags.push(targetFolder);
        bookToMove.folderName = [...new Set(tags)];
      } else {
        bookToMove.folderName = [targetFolder];
      }
      bookToMove.lastUpdated = new Date();
      await bookToMove.save();

      // UPDATE ASSETS: Update folderName and reconstruct URLs
      if (bookToMove.v_id) {
        try {
          const assets = await FlipbookAsset.find({
            flipbook_v_id: bookToMove.v_id,
          });

          if (assets.length > 0) {
            for (const asset of assets) {
              asset.folderName = targetFolder;
              const emailPart = asset.url.split(`/${FLIPBOOK_ROOT}/`)[0];
              asset.url = `${emailPart}/${FLIPBOOK_ROOT}/${targetFolder}/${asset.flipbookName}/assets/${asset.assetType}/${asset.fileName}`;
              await asset.save();
            }
            console.log(
              `✅ Updated ${assets.length} asset(s) for moved flipbook`,
            );
          }
        } catch (err) {
          console.error("❌ Error updating assets after move:", err);
        }
      }
    }

    res.json({ message: "Moved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/flipbook/remove-recent
router.post("/remove-recent", async (req, res) => {
  try {
    const { emailId, bookName } = req.body;
    if (!emailId || !bookName)
      return res.status(400).json({ message: "Missing fields" });

    await Flipbook.updateOne(
      { userEmail: emailId, flipbookName: bookName, folderName: "Recent Book" },
      { $pull: { folderName: "Recent Book" } },
    );
    res.json({ message: "Removed from Recent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route DELETE /api/flipbook/delete
router.delete("/delete", async (req, res) => {
  try {
    const { emailId, folderName, bookName } = req.body;
    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Delete flipbook folder and all files from Supabase Storage
    const supabaseBookPrefix = `${sanitizedEmail}/${FLIPBOOK_ROOT}/${folderName}/${bookName}`;
    deleteFolderFromSupabase(supabaseBookPrefix).catch(e => console.warn("[Supabase] Delete book folder warning:", e));

    // Delete from MongoDB
    let deletedBook = await Flipbook.findOneAndDelete({
      userEmail: emailId,
      flipbookName: bookName,
      $or: [{ folderName: folderName }, { folderName: { $in: [folderName] } }]
    });

    if (!deletedBook) {
      deletedBook = await Flipbook.findOneAndDelete({
        userEmail: emailId,
        flipbookName: bookName,
      });
    }

    if (deletedBook && deletedBook.v_id) {
      console.log(
        `Deleting assets for flipbook: ${bookName} (${deletedBook.v_id})`,
      );
      try {
        const assets = await FlipbookAsset.find({
          flipbook_v_id: deletedBook.v_id,
        });
        for (const asset of assets) {
          if (asset.url) {
            deleteFileFromSupabase(asset.url).catch(e => console.warn("[Supabase] Delete asset warning:", e));
          }
        }
        await FlipbookAsset.deleteMany({ flipbook_v_id: deletedBook.v_id });
        console.log(`Deleted ${assets.length} asset records.`);
      } catch (assetErr) {
        console.error("Error cleaning up assets:", assetErr);
      }

      try {
        const deleted3DModels = await InteractionThreedModel.deleteMany({
          userEmail: emailId,
          flipbookName: bookName,
          folderName: folderName,
        });
        console.log(`Deleted ${deleted3DModels.deletedCount} 3D model records.`);
      } catch (modelErr) {
        console.error("Error cleaning up 3D model records:", modelErr);
      }
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const tempUploadsDir = path.join(__dirname, "../../temp_uploads");
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post("/convert-pdf-to-svg", upload.single("pdf"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Temporary output directory for SVG files in temp_uploads
    const outDir = path.join(__dirname, "../../temp_uploads/temp_svg_" + Date.now());
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Output pattern for pdf2svg
    const outPattern = path.join(outDir, "page-%d.svg");

    try {
      let commandFailed = false;
      try {
        // Attempt 1: Execute pdf2svg command if it exists in system PATH
        await execAsync(`pdf2svg "${file.path}" "${outPattern}" all`);
      } catch (err1) {
        console.warn("pdf2svg failed or not found, attempting local pdftocairo fallback...", err1.message);
        commandFailed = true;
      }

      if (commandFailed) {
        // Attempt 2: Fallback to local pdftocairo (Poppler Windows binary)
        const pdftocairoPath = path.join(__dirname, "../../poppler/poppler-24.08.0/Library/bin/pdftocairo.exe");
        const outPrefix = path.join(outDir, "page");
        
        // pdftocairo syntax: pdftocairo -svg input.pdf output_prefix
        // Generates: output_prefix-1.svg, output_prefix-2.svg, etc.
        await execAsync(`"${pdftocairoPath}" -svg "${file.path}" "${outPrefix}"`);
      }

      // Read all generated SVG files
      const files = fs.readdirSync(outDir).filter(f => f.endsWith(".svg"));
      
      // Sort files by page number: page-1.svg, page-2.svg, etc.
      files.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
      });

      const svgs = [];
      for (const svgFile of files) {
        const svgPath = path.join(outDir, svgFile);
        const svgContent = fs.readFileSync(svgPath, "utf-8");
        svgs.push({ content: svgContent });
      }

      // Cleanup temp directory and original uploaded PDF
      fs.rmSync(outDir, { recursive: true, force: true });
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      res.status(200).json({ svgs });

    } catch (err) {
      console.error("Error running pdf2svg / pdftocairo:", err);
      // Cleanup on error
      if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      
      res.status(500).json({ 
        message: "Failed to convert PDF using native tools. Please ensure pdf2svg is installed in PATH, or the local pdftocairo binary has finished downloading.", 
        error: err.message 
      });
    }

  } catch (error) {
    console.error("PDF to SVG conversion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/upload-asset", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload Asset Request Body:", req.body);
    const { emailId, type, v_id, replacing_file_v_id, replacing_file_url, page_v_id } = req.body;
    let { folderName, flipbookName } = req.body;
    const file = req.file;

    if (!file) {
      console.error("Upload Asset: No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!emailId) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Missing fields: emailId" });
    }

    // --- Storage Limit Check ---
    try {
      const userSettings = await UserSettings.findOne({ emailId });
      const maxStorage = userSettings?.maxStorage || 300 * 1024 * 1024;
      
      const sanitizedEmailForStorage = emailId.replace(/[@.]/g, "_");
      const currentUsedStorage = await getUserStorageSizeFromSupabase(sanitizedEmailForStorage);

      if (currentUsedStorage + file.size > maxStorage) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(413).json({ 
          message: `Storage limit reached (${Math.round(maxStorage / (1024 * 1024))}MB). Please upgrade your plan to upload more assets.`,
          code: "STORAGE_LIMIT_EXCEEDED"
        });
      }
    } catch (storageErr) {
      console.error("Error during storage limit check:", storageErr);
    }

    // 1. Resolve Project Metadata (V_ID, Folder, Name)
    if (v_id) {
      const dbDoc = await Flipbook.findOne({ v_id });
      if (dbDoc) {
        flipbookName = dbDoc.flipbookName;
        // Resolve folder
        if (Array.isArray(dbDoc.folderName)) {
          const realFolders = dbDoc.folderName.filter(
            (f) => f !== "Recent Book",
          );
          folderName =
            realFolders.length > 0
              ? realFolders[0]
              : dbDoc.folderName[0] || "My_Flipbooks";
        } else {
          folderName = dbDoc.folderName;
        }
        // Verify ownership
        if (dbDoc.userEmail !== emailId) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
    }

    // Sanitize identifiers to avoid illegal path characters & Ensure non-empty fallback
    let safeFolderName = (folderName || "My_Flipbooks")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();
    if (!safeFolderName) safeFolderName = FLIPBOOK_ROOT;

    let safeFlipbookName = (flipbookName || "Untitled Document")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim();
    if (!safeFlipbookName) safeFlipbookName = "Untitled_Document";

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // Define Paths
    let relativeUrlBase; // Base for URL

    const assetType = (type || "video").toLowerCase();

    if (req.body.isGallery === "true" || req.body.isGallery === true) {
      const typeMap = {
        image: "Images",
        video: "Videos",
        gif: "gifs",
        svg: "Images",
      };
      const targetFolder = typeMap[assetType] || "Images";
      relativeUrlBase = `/uploads/${sanitizedEmail}/${targetFolder}`;

      safeFolderName = "Gallery";
      safeFlipbookName = targetFolder;
    } else {
      relativeUrlBase = `/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${safeFolderName}/${safeFlipbookName}/assets/${assetType}`;
    }

    // --- Handle Replacement / Old File Deletion ---
    let oldFilename = null;
    let oldUrl = null;

    if (replacing_file_v_id || replacing_file_url) {
      console.log(`Replacing asset. replacing_file_v_id: ${replacing_file_v_id}, replacing_file_url: ${replacing_file_url}`);
      try {
        let oldAsset = null;
        if (replacing_file_v_id) {
          oldAsset = await FlipbookAsset.findOne({ file_v_id: replacing_file_v_id });
        } else if (replacing_file_url) {
          let urlQuery = replacing_file_url.startsWith('http') 
              ? new URL(replacing_file_url).pathname 
              : replacing_file_url;
          urlQuery = decodeURIComponent(urlQuery);
          const escapedUrlQuery = urlQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          oldAsset = await FlipbookAsset.findOne({ url: { $regex: escapedUrlQuery + '$' } });
        }

        if (oldAsset) {
          console.log(`Found old asset in DB: ${oldAsset._id} with URL ${oldAsset.url}`);
          oldFilename = oldAsset.fileName;
          oldUrl = oldAsset.url;

          // Delete Supabase asset
          if (oldAsset.url) {
            deleteFileFromSupabase(oldAsset.url).catch(e => console.warn("[Supabase] Delete old asset warning:", e));
          }
          // Delete DB record
          await FlipbookAsset.deleteOne({ _id: oldAsset._id });
        }
      } catch (delErr) {
        console.warn("Failed to delete old asset:", delErr.message);
      }
    }

    // Generate Unique Filename
    const fileExt = path.extname(file.originalname);
    const file_v_id = nanoid();
    const uniqueFilename = `${file_v_id}${fileExt}`;
    const finalPageVId = page_v_id || "global";

    // Generate relative URL
    const relativeUrl = `${relativeUrlBase}/${uniqueFilename}`;

    // Upload new asset to Supabase Storage directly from temp file
    const supabaseDestPath = relativeUrl.replace(/^\/uploads\//, "");
    await uploadFileToSupabase(file.path, supabaseDestPath).catch(err => console.warn("[Supabase] Asset upload warning:", err));

    // Cleanup temp file
    if (file && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch(e) {}
    }

    // Save to Database
    const newAsset = new FlipbookAsset({
      flipbook_v_id: v_id || "temp_" + Date.now(),
      file_v_id: file_v_id,
      page_v_id: finalPageVId,
      assetType: assetType,
      fileName: uniqueFilename,
      flipbookName: safeFlipbookName,
      folderName: safeFolderName,
      url: relativeUrl,
      size: file.size,
    });

    await newAsset.save();

    console.log(`Asset saved successfully to Supabase: ${uniqueFilename}`);
    res.json({
      url: relativeUrl,
      file_v_id: file_v_id,
      filename: uniqueFilename,
    });
  } catch (err) {
    console.error("CRITICAL UPLOAD ERROR:", err);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({
      message: `Server Error: ${err.message}`,
      details: err.toString(),
    });
  }
});

// @route GET /api/flipbook/get-gallery-assets
// @desc Get global gallery assets (images, videos, gifs, 3d models) from Supabase Storage & MongoDB
router.get("/get-gallery-assets", async (req, res) => {
  try {
    const { emailId, type, currentUrl, currentFileName } = req.query;

    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const requestedType = type ? type.toLowerCase() : null;
    const assetsMap = new Map();
    const validMediaExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|mkv|glb|gltf|fbx|obj)$/i;

    // 1. Query MongoDB FlipbookAsset collection ONLY for global gallery assets (excluding page assets under My_Flipbooks)
    const escapedEmail = escapeRegex(sanitizedEmail);
    const dbAssets = await FlipbookAsset.find({
      $and: [
        { userEmail: emailId },
        {
          $or: [
            { folderName: "Gallery" },
            { isGallery: true },
            { url: { $regex: `\/uploads\/${escapedEmail}\/(?:Images|Videos|gifs|3D_Modals|Image|video|gif)\/` } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    for (const asset of dbAssets) {
      if (asset.url && asset.fileName && validMediaExtensions.test(asset.fileName)) {
        // Exclude currently selected asset if specified
        if (currentFileName && (asset.fileName === currentFileName || asset.file_v_id === currentFileName)) continue;
        if (currentUrl && asset.url && asset.url.toLowerCase().includes(currentUrl.toLowerCase())) continue;

        let detectedType = (asset.assetType || "").toLowerCase();
        if (!detectedType) {
          if (asset.url.includes('/Videos/') || asset.url.includes('/video/')) detectedType = 'video';
          else if (asset.url.includes('/gifs/') || asset.url.includes('/gif/')) detectedType = 'gif';
          else if (asset.url.includes('/3D_Model/') || asset.url.includes('/3D_Modals/')) detectedType = '3d';
          else detectedType = 'image';
        } else if (detectedType === 'images') detectedType = 'image';
        else if (detectedType === 'videos') detectedType = 'video';
        else if (detectedType === '3d_model' || detectedType === '3d_modals') detectedType = '3d';

        if (!requestedType || detectedType === requestedType || (requestedType === 'image' && detectedType === 'image') || (requestedType === '3d' && detectedType === '3d')) {
          assetsMap.set(asset.fileName, {
            id: asset.fileName,
            name: asset.fileName,
            url: asset.url,
            type: detectedType,
            size: asset.size || 0,
            uploadedAt: asset.createdAt || new Date()
          });
        }
      }
    }

    // 2. Fetch files directly from global user Supabase Storage gallery subfolders
    const supabaseFolderMap = {
      image: [`${sanitizedEmail}/Images`, `${sanitizedEmail}/Image`],
      video: [`${sanitizedEmail}/Videos`, `${sanitizedEmail}/video`],
      gif: [`${sanitizedEmail}/gifs`, `${sanitizedEmail}/gif`],
      '3d': [`${sanitizedEmail}/3D_Modals`, `${sanitizedEmail}/3D_Model`]
    };

    const targetTypes = requestedType ? [requestedType] : ['image', 'video', 'gif', '3d'];

    for (const t of targetTypes) {
      const folders = supabaseFolderMap[t] || [];
      for (const folder of folders) {
        const supabaseFiles = await listFilesInSupabaseFolder(folder);
        for (const fileObj of supabaseFiles) {
          if (fileObj.name && validMediaExtensions.test(fileObj.name) && !assetsMap.has(fileObj.name)) {
            // Exclude currently selected asset if specified
            if (currentFileName && fileObj.name === currentFileName) continue;
            const folderBaseName = path.basename(folder);
            const publicUrl = `/uploads/${sanitizedEmail}/${folderBaseName}/${fileObj.name}`;
            if (currentUrl && publicUrl.toLowerCase().includes(currentUrl.toLowerCase())) continue;

            assetsMap.set(fileObj.name, {
              id: fileObj.name,
              name: fileObj.name,
              url: publicUrl,
              type: t,
              size: fileObj.metadata?.size || 0,
              uploadedAt: fileObj.created_at || fileObj.updated_at || new Date()
            });
          }
        }
      }
    }

    let assets = Array.from(assetsMap.values());
    if (requestedType) {
      assets = assets.filter(a => a.type === requestedType || (requestedType === 'image' && a.type === 'image') || (requestedType === '3d' && (a.type === '3d' || a.type === '3d_model')));
    }
    assets.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ assets });
  } catch (err) {
    console.error("Error fetching gallery assets:", err);
    res.status(500).json({
      message: "Server error",
      details: err.toString(),
    });
  }
});

// @route POST /api/flipbook/delete-gallery-asset
// @desc Delete global gallery asset from Supabase Storage & MongoDB
router.post("/delete-gallery-asset", async (req, res) => {
  try {
    const { emailId, url, fileName, file_v_id } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: "Missing emailId" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");

    // 1. Delete from MongoDB FlipbookAsset collection
    if (file_v_id) {
      await FlipbookAsset.deleteMany({ file_v_id });
    }
    if (fileName) {
      await FlipbookAsset.deleteMany({ fileName, userEmail: emailId });
    }

    // 2. Delete file from Supabase Storage
    let targetUrl = url;
    if (!targetUrl && fileName) {
      targetUrl = `/uploads/${sanitizedEmail}/${fileName}`;
    }

    if (targetUrl) {
      deleteFileFromSupabase(targetUrl).catch(err => console.warn("[Supabase] Delete asset warning:", err));
    }

    return res.json({ success: true, message: "Asset deleted successfully" });
  } catch (err) {
    console.error("Error deleting gallery asset:", err);
    return res.status(500).json({ message: err.message });
  }
});



// @route   POST & DELETE /api/flipbook/delete-asset
// @desc    Delete an asset from flipbook & Supabase Storage
// @access  Public
const deleteAssetHandler = async (req, res) => {
  try {
    const fileVId = req.body?.file_v_id || req.body?.fileVId || req.query?.file_v_id || req.query?.fileVId;
    const emailId = req.body?.emailId || req.query?.emailId;
    const assetUrl = req.body?.url || req.query?.url;
    let fileName = req.body?.fileName || req.body?.filename || req.query?.fileName || req.query?.filename;
    if (!fileName && assetUrl) fileName = path.basename(assetUrl);
    if (!fileName && req.body?.src) fileName = path.basename(req.body.src);
    if (!fileName && req.body?.name) fileName = path.basename(req.body.name);
    const folderName = req.body?.folderName || req.query?.folderName;
    const bookName = req.body?.bookName || req.body?.flipbookName || req.query?.bookName || req.query?.flipbookName;
    const assetType = req.body?.assetType || req.query?.assetType || "Image";



    let asset = null;
    if (fileVId) {
      asset = await FlipbookAsset.findOne({ file_v_id: fileVId });
    }
    if (!asset && assetUrl) {
      let urlQuery = assetUrl.startsWith('http') ? new URL(assetUrl).pathname : assetUrl;
      urlQuery = decodeURIComponent(urlQuery);
      const escaped = urlQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      asset = await FlipbookAsset.findOne({ url: { $regex: escaped + '$' } });
    }
    if (!asset && fileName && emailId) {
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      asset = await FlipbookAsset.findOne({ fileName: fileName, url: { $regex: sanitizedEmail } });
    }

    if (asset) {
      fileName = asset.fileName;
    }

    const candidateUrls = new Set();
    if (asset && asset.url) candidateUrls.add(asset.url);
    if (assetUrl) candidateUrls.add(assetUrl);

    if (emailId) {
      const sanitizedEmail = emailId.replace(/[@.]/g, "_");
      const targetFolder = (folderName || "My_Flipbooks").replace(/[^a-zA-Z0-9 _-]/g, "").trim();
      const targetBook = (bookName || "Untitled Document").replace(/[^a-zA-Z0-9 _-]/g, "").trim();

      if (fileName) {
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/${assetType}/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3D_Model/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3D_Modals/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/3d_model/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/Image/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/gif/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/video/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/audio/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/assets/download/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Logo/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Watermark/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/${FLIPBOOK_ROOT}/${targetFolder}/${targetBook}/customized_assets/Image/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/3D_Modals/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/3D_Model/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/Images/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/Videos/${fileName}`);
        candidateUrls.add(`/uploads/${sanitizedEmail}/gifs/${fileName}`);
      }
    }

    for (const urlPath of candidateUrls) {
      await deleteFileFromSupabase(urlPath).catch((e) =>
        console.warn("[Supabase] Delete asset candidate warning:", e)
      );
    }

    if (asset) {
      await FlipbookAsset.deleteOne({ _id: asset._id });
    } else if (fileVId) {
      await FlipbookAsset.deleteOne({ file_v_id: fileVId });
    }

    if (fileName && emailId) {
      await InteractionThreedModel.deleteOne({ userEmail: emailId, fileName: fileName }).catch(() => {});
    }

    res.status(200).json({ message: "Asset deleted successfully from Supabase" });

  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      message: "Server error deleting asset",
      error: error.message,
    });
  }
};

router.post("/delete-asset", deleteAssetHandler);
router.delete("/delete-asset", deleteAssetHandler);



// @route  POST /api/flipbook/inline-svgs
// @desc   Migration: read HTML pages that reference external SVG asset files and
//         replace href="./assets/image/xxx.svg" with an inline base64 data URI.
//         Run once per flipbook to make pages self-contained (no separate SVG fetch).
// @body   { emailId, folderName, flipbookName }
router.post("/inline-svgs", async (req, res) => {
  try {
    const { emailId, folderName, flipbookName } = req.body;
    if (!emailId || !folderName || !flipbookName) {
      return res.status(400).json({ message: "Missing emailId, folderName, or flipbookName" });
    }

    const sanitizedEmail = emailId.replace(/[@.]/g, "_");
    const uploadsDir = path.join(__dirname, "../../uploads");
    const flipbookDir = path.join(
      uploadsDir,
      sanitizedEmail,
      FLIPBOOK_ROOT,
      folderName,
      flipbookName
    );

    if (!fs.existsSync(flipbookDir)) {
      return res.status(404).json({ message: "Flipbook directory not found" });
    }

    const htmlFiles = fs.readdirSync(flipbookDir).filter((f) => f.endsWith(".html"));
    let pagesUpdated = 0;
    let pagesSkipped = 0;

    // Regex to find: href="./assets/image/FILENAME.svg"  (or assets/Image/ any case)
    const svgHrefRegex = /href="(\.\/assets\/[Ii]mage\/([^"]+\.svg))"/gi;

    for (const htmlFile of htmlFiles) {
      const filePath = path.join(flipbookDir, htmlFile);
      let content = fs.readFileSync(filePath, "utf8");

      // Check if this page references an external SVG asset
      if (!svgHrefRegex.test(content)) {
        pagesSkipped++;
        svgHrefRegex.lastIndex = 0; // reset regex state
        continue;
      }
      svgHrefRegex.lastIndex = 0;

      let updated = false;
      content = content.replace(svgHrefRegex, (match, relPath, filename) => {
        // Resolve the SVG file relative to the flipbook directory
        // relPath is like "./assets/image/xxx.svg" or "./assets/Image/xxx.svg"
        const svgPath = path.join(flipbookDir, relPath.replace(/^\.\//, ""));

        if (!fs.existsSync(svgPath)) {
          console.warn(`SVG file not found, skipping: ${svgPath}`);
          return match; // leave unchanged if file missing
        }

        try {
          const svgBuffer = fs.readFileSync(svgPath);
          const base64 = svgBuffer.toString("base64");
          const dataUri = `data:image/svg+xml;base64,${base64}`;
          updated = true;
          return `href="${dataUri}"`;
        } catch (e) {
          console.warn(`Failed to read/encode SVG: ${svgPath}`, e.message);
          return match;
        }
      });

      if (updated) {
        fs.writeFileSync(filePath, content, "utf8");
        pagesUpdated++;
        console.log(`✓ Inlined SVG in: ${htmlFile}`);
      } else {
        pagesSkipped++;
      }
    }

    res.json({
      message: "SVG inline migration complete",
      flipbook: flipbookName,
      folder: folderName,
      pagesUpdated,
      pagesSkipped,
      totalPages: htmlFiles.length,
    });
  } catch (error) {
    console.error("Error inlining SVGs:", error);
    res.status(500).json({ message: "Server error during SVG inline migration", error: error.message });
  }
});

export default router;

