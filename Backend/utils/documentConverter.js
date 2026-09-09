import fs from "fs";
import path from "path";
import os from "os";
import { execFile, exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { nanoid } from "nanoid";
import { uploadBufferToSupabase, downloadFileFromSupabase, deleteFolderFromSupabase } from "../config/supabase.js";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// The Supabase folder used for temporary conversion staging (uploaded, processed, then deleted)
const SUPABASE_TEMP_FOLDER = "Temp_data";

/**
 * Returns a real Windows temp directory path that:
 *  - Has NO 8.3 short names (e.g. PRAVEE~1) — LibreOffice fails to load files from 8.3 paths.
 *  - Has NO spaces — LibreOffice sometimes fails with paths containing spaces.
 *
 * Priority order:
 *  1. USERPROFILE/AppData/Local/Temp  (always full long name: C:\Users\Praveenkumar\...)
 *  2. LOCALAPPDATA/Temp               (same, via different env var)
 *  3. SystemDrive:\lo_temp            (absolute fallback with no user-name in path)
 *  4. os.tmpdir()                     (last resort)
 */
const getRealTempDir = () => {
  if (process.platform !== "win32") return os.tmpdir();

  const candidates = [
    process.env.USERPROFILE  ? path.join(process.env.USERPROFILE, "AppData", "Local", "Temp") : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Temp") : null,
    process.env.SystemDrive  ? path.join(process.env.SystemDrive + "\\", "lo_temp") : null,
    "C:\\lo_temp"
  ].filter(Boolean);

  for (const candidate of candidates) {
    // Reject if it still contains a tilde (8.3 short name indicator)
    if (candidate.includes("~")) continue;
    try {
      fs.mkdirSync(candidate, { recursive: true });
      return candidate;
    } catch (e) { /* try next */ }
  }

  return os.tmpdir(); // absolute last resort
};

/**
 * Build a file:/// URI from a local filesystem path WITHOUT URL-encoding
 * special characters like ~ which would break LibreOffice's profile loader.
 */
const toFileUri = (localPath) => {
  return "file:///" + localPath.replace(/\\/g, "/").replace(/^\//, "");
};

/**
 * Find the most-recently-modified PDF file in a directory.
 * Returns null if no PDF files exist.
 */
const findNewestPdf = (dir) => {
  try {
    const pdfs = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(".pdf"))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return pdfs.length > 0 ? path.join(dir, pdfs[0].name) : null;
  } catch (e) { return null; }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional dynamic import for @matbee/libreoffice-converter (WASM fallback)
let WasmLibreConverter = null;
try {
  WasmLibreConverter = require("@matbee/libreoffice-converter");
  console.log("[Document Converter] Loaded @matbee/libreoffice-converter WASM package.");
} catch (e) {
  // Not installed
}

let cachedLibreOfficePath = null;

const CANDIDATE_SOFFICE_PATHS = [
  process.env.LIBREOFFICE_PATH,
  "C:\\Program Files\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "/usr/bin/soffice",
  "/usr/local/bin/soffice",
  "/usr/bin/libreoffice",
  "soffice.com",
  "soffice",
  "libreoffice"
].filter(Boolean);

/**
 * On Windows, soffice.exe is a GUI application that allocates a console window
 * and prompts "Press Enter to continue..." when invoked for CLI operations.
 * soffice.com is the native console application that runs 100% silently and headlessly
 * without any popup window or interactive prompt.
 */
const resolveComWrapper = (rawPath) => {
  if (!rawPath) return rawPath;
  if (process.platform === "win32") {
    if (/soffice\.exe$/i.test(rawPath)) {
      const comPath = rawPath.replace(/soffice\.exe$/i, "soffice.com");
      if (fs.existsSync(comPath)) {
        return comPath;
      }
    }
  }
  return rawPath;
};

/**
 * Resolves the path to the LibreOffice / soffice binary using LIBREOFFICE_PATH configured in .env,
 * and ensures its directory is added to process.env.PATH.
 */
export const getLibreOfficePath = () => {
  if (cachedLibreOfficePath && fs.existsSync(cachedLibreOfficePath)) {
    return cachedLibreOfficePath;
  }

  const envPath = process.env.LIBREOFFICE_PATH;
  if (envPath) {
    const preferredEnv = resolveComWrapper(envPath);
    if (fs.existsSync(preferredEnv)) {
      cachedLibreOfficePath = preferredEnv;
      const binDir = path.dirname(preferredEnv);
      if (process.env.PATH && !process.env.PATH.includes(binDir)) {
        process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
      }
      return preferredEnv;
    }
  }

  for (const candidate of CANDIDATE_SOFFICE_PATHS) {
    try {
      const preferred = resolveComWrapper(candidate);
      if (fs.existsSync(preferred)) {
        cachedLibreOfficePath = preferred;
        const binDir = path.dirname(preferred);
        if (process.env.PATH && !process.env.PATH.includes(binDir)) {
          process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
        }
        return preferred;
      }
    } catch (e) {}
  }

  const fallback = process.platform === "win32" ? "soffice.com" : "soffice";
  cachedLibreOfficePath = fallback;
  return fallback;
};

/**
 * Checks if LibreOffice is available and returns version info headlessly and silently.
 */
export const checkLibreOfficeStatus = async () => {
  const binaryPath = getLibreOfficePath();

  try {
    const { stdout } = await execFileAsync(binaryPath, ["--headless", "--invisible", "--nologo", "--version"], {
      windowsHide: true,
      timeout: 10000
    });
    return {
      available: true,
      hasWasm: !!WasmLibreConverter,
      version: stdout.trim().split("\n")[0],
      path: binaryPath
    };
  } catch (err) {
    try {
      const fallbackCmd = process.platform === "win32"
        ? "soffice.com --headless --invisible --nologo --version"
        : "soffice --headless --invisible --nologo --version";
      const { stdout } = await execAsync(fallbackCmd, {
        windowsHide: true,
        timeout: 8000
      });
      return {
        available: true,
        hasWasm: !!WasmLibreConverter,
        version: stdout.trim().split("\n")[0],
        path: process.platform === "win32" ? "soffice.com" : "soffice"
      };
    } catch (e) {
      return {
        available: !!WasmLibreConverter,
        hasWasm: !!WasmLibreConverter,
        path: binaryPath,
        error: "LibreOffice executable (soffice) not found on system."
      };
    }
  }
};

/**
 * Supported office document extensions
 */
export const SUPPORTED_OFFICE_EXTENSIONS = [
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".odt",
  ".odp",
  ".rtf",
  ".txt"
];

export const isOfficeDocument = (filename) => {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_OFFICE_EXTENSIONS.includes(ext);
};

/**
 * Converts a Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file into a PDF.
 *
 * Flow:
/**
 * Converts a Word (.doc, .docx) or PowerPoint (.ppt, .pptx) file into a PDF.
 *
 * Flow:
 *  1. Upload input file → Supabase Temp_data/<jobId>/ and get the public URL.
 *  2. Strategy A (preferred): Pass the Supabase PUBLIC URL directly to LibreOffice.
 *     LibreOffice natively supports HTTP/HTTPS input URLs — this avoids ALL local
 *     file path issues (spaces, 8.3 short names, ~1 in Windows TEMP paths).
 *  3. Strategy B (fallback): Copy input to a clean local path via USERPROFILE dir,
 *     then run LibreOffice against that local file.
 *  4. WASM converter as last-resort fallback.
 *  5. Cleanup: remove local work dir + Supabase Temp_data/<jobId>/.
 *
 * @param {string} inputDocPath - Path to input document.
 * @param {string} outputPdfPath - Desired output path for the converted PDF.
 * @returns {Promise<string>} - Resolves with outputPdfPath on success.
 */
export const convertOfficeToPdf = async (inputDocPath, outputPdfPath) => {
  if (!fs.existsSync(inputDocPath)) {
    throw new Error(`Input document not found: ${inputDocPath}`);
  }

  const binaryPath = getLibreOfficePath();
  const inputFileName = path.basename(inputDocPath);
  const inputFileNameBase = path.parse(inputFileName).name;
  const jobId = nanoid(10);

  console.log(`[Document Converter] [${jobId}] Converting ${inputFileName} → PDF (binary: ${binaryPath})`);

  // ─── Local work dir: always use USERPROFILE-based path (no 8.3 short names) ──
  const realTempDir = getRealTempDir();
  const localWorkDir = path.join(realTempDir, "lo_work", jobId);
  fs.mkdirSync(localWorkDir, { recursive: true });

  // ─── Isolated LibreOffice profile (fresh per job, no locking conflicts) ──────
  const isolatedProfileDir = path.join(localWorkDir, "lo_profile");
  fs.mkdirSync(isolatedProfileDir, { recursive: true });
  const isolatedProfileUri = toFileUri(isolatedProfileDir);

  // ─── Supabase staging ────────────────────────────────────────────────────────
  const supabaseTempFolder = `${SUPABASE_TEMP_FOLDER}/${jobId}`;
  const supabaseInputPath  = `${supabaseTempFolder}/${inputFileName}`;

  const commonArgs = [
    "--headless", "--invisible", "--nologo", "--norestore", "--nofirststartwizard",
    `-env:UserInstallation=${isolatedProfileUri}`,
    "--convert-to", "pdf",
    "--outdir", localWorkDir
  ];

  /**
   * Moves the converted PDF from localWorkDir to the desired outputPdfPath.
   * LibreOffice names the output file based on the input file's base name.
   * When the input is a URL, LO uses the last path segment as the base name.
   */
  const finalizeOutput = () => {
    // Check expected name first
    const expectedPdf = path.join(localWorkDir, `${inputFileNameBase}.pdf`);
    const sourcePdf = (fs.existsSync(expectedPdf) && fs.statSync(expectedPdf).size > 0)
      ? expectedPdf
      : findNewestPdf(localWorkDir);

    if (!sourcePdf) return false;

    const finalOutputDir = path.dirname(outputPdfPath);
    if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true });
    fs.copyFileSync(sourcePdf, outputPdfPath);
    return fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 0;
  };

  let lastError = null;

  try {
    // ─── Fast Strategy A: Direct Local LibreOffice Conversion ──────────────────
    // Uses localWorkDir in USERPROFILE Temp (no spaces, no 8.3 short names).
    // Eliminates all internet latency from Supabase upload/download roundtrips.
    try {
      const ext = path.extname(inputFileName);
      const safeInputFileName = `doc_${jobId}${ext}`;
      const localInputPath = path.join(localWorkDir, safeInputFileName);
      fs.copyFileSync(inputDocPath, localInputPath);

      console.log(`[Document Converter] [${jobId}] Fast Path: LibreOffice local conversion (${safeInputFileName})`);
      await execFileAsync(binaryPath, [...commonArgs, localInputPath], {
        timeout: 45000,
        maxBuffer: 50 * 1024 * 1024,
        windowsHide: true
      });

      if (finalizeOutput()) {
        console.log(`[Document Converter] [${jobId}] Local conversion succeeded in high speed`);
        return outputPdfPath;
      }
    } catch (localErr) {
      lastError = localErr;
      if (localErr.stderr) console.warn(`[Document Converter] [${jobId}] Local stderr:`, localErr.stderr);
      console.warn(`[Document Converter] [${jobId}] Local conversion failed, trying fallback: ${localErr.message.split("\n")[0]}`);
    }

    // ─── Strategy B: WASM converter fallback ─────────────────────────────────────
    if (WasmLibreConverter && typeof WasmLibreConverter.createWorkerConverter === "function") {
      try {
        console.log(`[Document Converter] [${jobId}] Strategy B: WASM converter`);
        const inputBuffer = fs.readFileSync(inputDocPath);
        const converter = await WasmLibreConverter.createWorkerConverter();
        const pdfResult = await converter.convert(inputBuffer, { outputFormat: "pdf" });
        const finalOutputDir = path.dirname(outputPdfPath);
        if (!fs.existsSync(finalOutputDir)) fs.mkdirSync(finalOutputDir, { recursive: true });
        fs.writeFileSync(outputPdfPath, pdfResult.data);
        await converter.destroy();
        if (fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 0) {
          console.log(`[Document Converter] [${jobId}] Strategy B (WASM) succeeded`);
          return outputPdfPath;
        }
      } catch (wasmErr) {
        lastError = wasmErr;
        console.warn(`[Document Converter] [${jobId}] Strategy B (WASM) failed:`, wasmErr.message);
      }
    }

    // All strategies failed
    const errMsg = lastError ? lastError.message.split("\n")[0] : "Unknown error";
    console.error(`[Document Converter] [${jobId}] All strategies failed for ${inputFileName}: ${errMsg}`);
    throw new Error(
      `Failed to convert ${inputFileName} to PDF: ${errMsg}. ` +
      `Check that LibreOffice is fully installed (including the Impress component) and the file is not password-protected.`
    );

  } finally {
    // Cleanup local work dir
    try { fs.rmSync(localWorkDir, { recursive: true, force: true }); } catch (e) {}
  }
};

