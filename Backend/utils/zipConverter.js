import fs from "fs";
import path from "path";
import zlib from "zlib";
import { convertWithAssimp, SUPPORTED_3D_EXTENSIONS } from "./assimpConverter.js";
import { convertCadFileToGlb, isCadFormat } from "./openCascadeConverter.js";

/**
 * Pure Node.js ZIP decompressor using Central Directory & zlib (Zero external dependency requirement)
 * Extracts all files and folders while preserving relative directory hierarchy.
 * 
 * @param {string} zipPath - Path to the .zip archive on disk
 * @param {string} targetDir - Directory to unpack files into
 */
export const extractZipArchive = (zipPath, targetDir) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const buffer = fs.readFileSync(zipPath);
  const len = buffer.length;

  // Search for End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = len - 22; i >= Math.max(0, len - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid or corrupted ZIP archive (EOCD signature not found).");
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let currentCdOffset = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (currentCdOffset >= len || buffer.readUInt32LE(currentCdOffset) !== 0x02014b50) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(currentCdOffset + 10);
    const compressedSize = buffer.readUInt32LE(currentCdOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(currentCdOffset + 24);
    const fileNameLen = buffer.readUInt16LE(currentCdOffset + 28);
    const extraFieldLen = buffer.readUInt16LE(currentCdOffset + 30);
    const commentLen = buffer.readUInt16LE(currentCdOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(currentCdOffset + 42);

    const rawFileName = buffer.toString("utf8", currentCdOffset + 46, currentCdOffset + 46 + fileNameLen);
    currentCdOffset += 46 + fileNameLen + extraFieldLen + commentLen;

    // Normalize and sanitize path (prevent directory traversal vulnerabilities)
    const normalizedFileName = rawFileName.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalizedFileName.includes("..") || normalizedFileName.startsWith("/")) {
      continue;
    }

    // Skip MacOS resource fork metadata
    if (normalizedFileName.startsWith("__MACOSX/") || normalizedFileName.includes("/.DS_Store") || normalizedFileName === ".DS_Store") {
      continue;
    }

    const outPath = path.join(targetDir, normalizedFileName);

    // Is directory
    if (normalizedFileName.endsWith("/")) {
      if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, { recursive: true });
      }
      continue;
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(outPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Read local header to locate compressed data stream
    if (localHeaderOffset + 30 > len || buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      continue;
    }

    const localFileNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraFieldLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraFieldLen;
    const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

    let uncompressedData;
    if (compressionMethod === 0) {
      // Stored (no compression)
      uncompressedData = compressedData;
    } else if (compressionMethod === 8) {
      // Deflated
      try {
        uncompressedData = zlib.inflateRawSync(compressedData);
      } catch (inflateErr) {
        console.warn(`[zipConverter] zlib.inflateRawSync error for ${normalizedFileName}:`, inflateErr.message);
        continue;
      }
    } else {
      console.warn(`[zipConverter] Unsupported compression method (${compressionMethod}) for ${normalizedFileName}`);
      continue;
    }

    fs.writeFileSync(outPath, uncompressedData);
  }
};

/**
 * Recursively scans an unpacked folder for 3D model files
 * 
 * @param {string} dir - Root directory to scan
 * @returns {Array<{ filePath: string, ext: string, name: string }>}
 */
export const find3DModelFilesInDirectory = (dir) => {
  const results = [];

  const scan = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith("__MACOSX") && entry.name !== ".git") {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_3D_EXTENSIONS.includes(ext)) {
          results.push({
            filePath: fullPath,
            ext,
            name: entry.name
          });
        }
      }
    }
  };

  scan(dir);
  return results;
};

/**
 * Selects the primary 3D model file from a list of discovered files
 * Priority: .gltf > .obj > .fbx > .glb > .3ds > .lwo > .stl > .step > .stp > .iges > .igs
 */
export const pickPrimary3DModelFile = (modelFiles) => {
  if (!modelFiles || modelFiles.length === 0) return null;

  const priorityOrder = [
    ".gltf",
    ".obj",
    ".fbx",
    ".glb",
    ".3ds",
    ".lwo",
    ".low",
    ".stl",
    ".step",
    ".stp",
    ".iges",
    ".igs"
  ];

  for (const prioExt of priorityOrder) {
    const match = modelFiles.find((m) => m.ext === prioExt);
    if (match) return match;
  }

  return modelFiles[0];
};

/**
 * Recursively removes a directory
 */
const cleanDir = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn("[zipConverter] Cleanup warning:", e.message);
  }
};

/**
 * Extracts a ZIP archive, preserves directory structure & external texture links,
 * converts the primary 3D model to GLB with embedded textures, and returns conversion result.
 * 
 * @param {string} zipFilePath - Absolute path to input .zip file
 * @param {string} outputGlbPath - Absolute path to output .glb file
 * @param {Object} [options] - Additional conversion options
 * @returns {Promise<{ success: boolean, outputPath: string, modelName: string, primaryModelExt: string }>}
 */
export const convertZipToGlb = async (zipFilePath, outputGlbPath, options = {}) => {
  const tempUnpackDir = path.join(
    path.dirname(outputGlbPath),
    `unpacked_${Date.now()}_${Math.random().toString(36).substring(7)}`
  );

  try {
    console.log(`[zipConverter] Unpacking ZIP archive: ${path.basename(zipFilePath)} -> ${tempUnpackDir}`);
    extractZipArchive(zipFilePath, tempUnpackDir);

    const modelFiles = find3DModelFilesInDirectory(tempUnpackDir);
    if (modelFiles.length === 0) {
      throw new Error(
        "No supported 3D model file (.glb, .gltf, .obj, .fbx, .stl, .step, .stp, .3ds, .lwo, .iges, .igs) was found in the ZIP archive or folder."
      );
    }

    const primaryModel = pickPrimary3DModelFile(modelFiles);
    console.log(`[zipConverter] Identified primary 3D model: ${primaryModel.name} (${primaryModel.ext}) at ${primaryModel.filePath}`);

    // If primary model is already a GLB
    if (primaryModel.ext === ".glb") {
      fs.copyFileSync(primaryModel.filePath, outputGlbPath);
      cleanDir(tempUnpackDir);
      return {
        success: true,
        outputPath: outputGlbPath,
        modelName: path.basename(primaryModel.name, primaryModel.ext),
        primaryModelExt: primaryModel.ext
      };
    }

    // If primary model is a CAD format (STEP, IGES)
    if (isCadFormat(primaryModel.filePath)) {
      console.log(`[zipConverter] Converting CAD file from ZIP with OpenCASCADE: ${primaryModel.name}`);
      const cadRes = await convertCadFileToGlb(primaryModel.filePath, outputGlbPath, options);
      cleanDir(tempUnpackDir);
      return {
        success: true,
        outputPath: cadRes.outputPath || outputGlbPath,
        modelName: path.basename(primaryModel.name, primaryModel.ext),
        primaryModelExt: primaryModel.ext
      };
    }

    // Standard 3D formats (OBJ + MTL + textures, GLTF + BIN + textures, FBX + textures, 3DS, LWO, STL)
    console.log(`[zipConverter] Converting ${primaryModel.ext.toUpperCase()} with Assimp (embedding external textures)...`);
    const assimpRes = await convertWithAssimp(primaryModel.filePath, outputGlbPath, options);

    cleanDir(tempUnpackDir);

    return {
      success: true,
      outputPath: outputGlbPath,
      modelName: path.basename(primaryModel.name, primaryModel.ext),
      primaryModelExt: primaryModel.ext
    };
  } catch (err) {
    cleanDir(tempUnpackDir);
    throw err;
  }
};
