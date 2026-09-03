import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { convertCadFileToGlb, isCadFormat, CAD_EXTENSIONS } from "./openCascadeConverter.js";
import { convertZipToGlb } from "./zipConverter.js";

/**
 * Supported 3D formats for Assimp and OpenCASCADE conversion
 */
export const SUPPORTED_3D_EXTENSIONS = [
  ".glb",
  ".gltf",
  ".obj",
  ".fbx",
  ".stl",
  ".step",
  ".stp",
  ".3ds",
  ".lwo",
  ".low",
  ".iges",
  ".igs"
];

/**
 * Get the path to the Assimp executable from environment or default locations
 */
export const getAssimpPath = () => {
  const envPath = process.env.ASSIMP_PATH;

  // If ASSIMP_PATH is explicitly provided and exists
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  // Linux / Docker
  if (process.platform === "linux") {
    const linuxLocations = [
      "/usr/bin/assimp",
      "/usr/local/bin/assimp",
      "assimp"
    ];

    for (const loc of linuxLocations) {
      if (loc === "assimp" || fs.existsSync(loc)) {
        return loc;
      }
    }
  }

  // Windows local development
  const windowsLocations = [
    "C:\\Program Files\\Assimp\\bin\\x64\\assimp.exe",
    "C:\\Program Files (x86)\\Assimp\\bin\\x64\\assimp.exe",
    "C:\\Program Files\\Assimp\\bin\\assimp.exe",
    "assimp.exe"
  ];

  for (const loc of windowsLocations) {
    if (fs.existsSync(loc)) {
      return loc;
    }
  }

  throw new Error("Assimp executable not found.");
};

/**
 * Checks if a file extension is a supported 3D format or ZIP folder package
 * @param {string} filename 
 * @returns {boolean}
 */
export const is3DFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_3D_EXTENSIONS.includes(ext) || ext === ".zip";
};

/**
 * Checks if a file is a ZIP archive
 * @param {string} filename 
 * @returns {boolean}
 */
export const isZipFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return ext === ".zip";
};

/**
 * Checks if a file is already a GLB file
 * @param {string} filename 
 * @returns {boolean}
 */
export const isGlbFormat = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return ext === ".glb";
};

/**
 * Convert input 3D model file (or ZIP folder package) to GLB
 * 
 * @param {string} inputPath - Absolute path to input 3D file or .zip archive
 * @param {string} outputPath - Absolute path to output .glb file
 * @param {Object} [options] - Additional options
 * @returns {Promise<{ success: boolean, outputPath: string, message?: string }>}
 */
export const convertWithAssimp = (inputPath, outputPath, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(inputPath)) {
        return reject(new Error(`Input file does not exist: ${inputPath}`));
      }

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // If output is already .glb and input is the same, no conversion needed
      if (inputPath.toLowerCase() === outputPath.toLowerCase()) {
        return resolve({ success: true, outputPath });
      }

      // 0. If the input is a ZIP archive containing a model folder / textures
      if (isZipFormat(inputPath)) {
        console.log(`[ZIP Converter] Processing ZIP archive with external textures: ${path.basename(inputPath)}`);
        const zipRes = await convertZipToGlb(inputPath, outputPath, options);
        return resolve(zipRes);
      }

      // 1. If the input is a CAD file (STEP, IGES), try OpenCASCADE conversion first
      if (isCadFormat(inputPath)) {
        try {
          console.log(`[OpenCASCADE] Attempting CAD conversion for ${path.basename(inputPath)}...`);
          const cadRes = await convertCadFileToGlb(inputPath, outputPath, options);
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            return resolve(cadRes);
          }
        } catch (cadErr) {
          console.warn(`[OpenCASCADE] Primary CAD conversion failed (${cadErr.message}), trying Assimp fallback...`);
        }
      }

      const assimpBin = getAssimpPath();
      
      // Explicitly specify 'glb2' and '-embtex' to embed textures and force glTF 2.0 Binary export
      const flagStrategies = [
        ["export", inputPath, outputPath, "glb2", "-embtex", "-tri"],
        ["export", inputPath, outputPath, "glb2", "-embtex"],
        ["export", inputPath, outputPath, "glb", "-embtex", "-tri"],
        ["export", inputPath, outputPath, "glb2", "-tri"],
        ["export", inputPath, outputPath, "glb2"],
        ["export", inputPath, outputPath, "-tri"],
        ["export", inputPath, outputPath]
      ];

      const runAttempt = (args) => {
        return new Promise((resolveAttempt, rejectAttempt) => {
          console.log(`[Assimp] Executing conversion: "${assimpBin}" ${args.join(" ")}`);
          execFile(
            assimpBin,
            args,
            {
              cwd: path.dirname(inputPath), // Essential for Assimp to find and embed textures
              timeout: options.timeout || 600000, // 10 minutes timeout for heavy models
              maxBuffer: 100 * 1024 * 1024 // 100MB buffer for large polygon models
            },
            (error, stdout, stderr) => {
              if (stdout && stdout.trim()) {
                console.log(`[Assimp stdout]: ${stdout.trim().slice(-500)}`);
              }
              if (stderr && stderr.trim()) {
                console.warn(`[Assimp stderr]: ${stderr.trim().slice(-500)}`);
              }

              if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                console.log(`[Assimp] Successfully converted to GLB (glTF 2.0): ${outputPath} (${(fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2)} MB)`);
                return resolveAttempt({ success: true, outputPath });
              }

              if (error) {
                return rejectAttempt(new Error(`Assimp conversion failed: ${error.message}${stderr ? `\nStderr: ${stderr}` : ""}`));
              }

              rejectAttempt(new Error(`Assimp completed but output GLB was not created or empty.`));
            }
          );
        });
      };

      // Try strategies sequentially until one creates a valid GLB
      (async () => {
        let lastErr = null;
        for (const args of flagStrategies) {
          try {
            const res = await runAttempt(args);
            return resolve(res);
          } catch (err) {
            lastErr = err;
            console.warn(`[Assimp] Strategy [${args.slice(3).join(" ")}] failed, trying fallback...`);
          }
        }
        reject(lastErr || new Error("Assimp conversion failed on all format attempts."));
      })();
    } catch (err) {
      console.error(`[Assimp Exception]:`, err);
      reject(err);
    }
  });
};

export {
  convertCadFileToGlb,
  isCadFormat,
  CAD_EXTENSIONS
};

export default {
  SUPPORTED_3D_EXTENSIONS,
  CAD_EXTENSIONS,
  getAssimpPath,
  is3DFormat,
  isCadFormat,
  isGlbFormat,
  convertWithAssimp,
  convertCadFileToGlb
};


