import fs from "fs";
import path from "path";
import { execFile, exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load the 'inkscape' npm package (will be available once user runs npm i)
let InkscapePackage = null;
try {
  InkscapePackage = require("inkscape");
  console.log("[Inkscape] Successfully loaded 'inkscape' npm package.");
} catch (e) {
  // Not yet installed (user will run npm i later)
}

// Dynamically load 'pdf-lib' (for backend PDF page splitting)
let PDFLib = null;
try {
  PDFLib = require("pdf-lib");
  console.log("[PDF-Lib] Successfully loaded 'pdf-lib' npm package.");
} catch (e) {
  // Not yet installed (user will run npm i later)
}

let cachedInkscapePath = null;

/**
 * Locates the Inkscape binary using only INKSCAPE_PATH configured in .env,
 * and ensures its directory is added to process.env.PATH.
 */
export const getInkscapePath = () => {
  const envPath = process.env.INKSCAPE_PATH;
  if (!envPath) {
    return null;
  }

  if (cachedInkscapePath && fs.existsSync(cachedInkscapePath)) {
    return cachedInkscapePath;
  }

  if (fs.existsSync(envPath)) {
    cachedInkscapePath = envPath;
    const binDir = path.dirname(envPath);
    if (process.env.PATH && !process.env.PATH.includes(binDir)) {
      process.env.PATH = `${binDir};${process.env.PATH}`;
    }
    return envPath;
  }

  return envPath;
};

// Initialize PATH right away
getInkscapePath();

/**
 * Checks Inkscape version and returns availability status.
 */
export const checkInkscapeVersion = async () => {
  const binaryPath = getInkscapePath();
  const pkgAvailable = !!InkscapePackage;

  if (!binaryPath) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      error: "INKSCAPE_PATH is not configured in .env"
    };
  }

  if (!fs.existsSync(binaryPath)) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      path: binaryPath,
      error: `Inkscape executable not found at INKSCAPE_PATH: ${binaryPath}`
    };
  }

  try {
    const { stdout } = await execFileAsync(binaryPath, ["--version"]);
    const versionMatch = stdout.match(/Inkscape\s+([0-9.]+)/i);
    return {
      available: true,
      hasNodePackage: pkgAvailable,
      version: versionMatch ? versionMatch[1] : stdout.trim().split("\n")[0],
      path: binaryPath
    };
  } catch (err) {
    return {
      available: false,
      hasNodePackage: pkgAvailable,
      path: binaryPath,
      error: err.message || `Failed to execute Inkscape at ${binaryPath}`
    };
  }
};

/**
 * Parses SVG dimension strings (e.g., '210mm', '595.28pt', '800px', '210') into millimeters.
 */
export const parseDimensionToMm = (val, defaultVal = 210) => {
  if (!val) return defaultVal;
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return defaultVal;

  if (str.endsWith("mm")) return num;
  if (str.endsWith("cm")) return num * 10;
  if (str.endsWith("in")) return num * 25.4;
  if (str.endsWith("pt")) return num * (25.4 / 72);
  if (str.endsWith("px")) return num * (25.4 / 96);
  return num;
};

/**
 * Scopes IDs in SVG content (clip-path, masks, gradients, filters)
 * to avoid cross-page ID collisions in multi-page flipbooks.
 */
export const scopeSvgIds = (svgString, pageNumber) => {
  const prefix = `p${pageNumber}_`;
  const idMap = new Map();

  // Find all id="..." declarations
  const idDeclRegex = /\bid=(["'])([^"']+)\1/g;
  let match;
  while ((match = idDeclRegex.exec(svgString)) !== null) {
    const origId = match[2];
    if (!idMap.has(origId) && !origId.startsWith("p")) {
      idMap.set(origId, `${prefix}${origId}`);
    }
  }

  if (idMap.size === 0) return svgString;

  let scopedSvg = svgString;
  for (const [origId, newId] of idMap.entries()) {
    const escapedOrig = origId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Replace id="..."
    scopedSvg = scopedSvg.replace(new RegExp(`\\bid=(["'])${escapedOrig}\\1`, "g"), `id=$1${newId}$1`);
    // Replace url(#...)
    scopedSvg = scopedSvg.replace(new RegExp(`url\\((['"]?)#${escapedOrig}\\1\\)`, "g"), `url($1#${newId}$1)`);
    // Replace xlink:href="#..." and href="#..."
    scopedSvg = scopedSvg.replace(new RegExp(`href=(["'])#${escapedOrig}\\1`, "g"), `href=$1#${newId}$1`);
  }

  return scopedSvg;
};

/**
 * Converts a raw Inkscape SVG output into a standard Flipbook page SVG string.
 * Flattens structure into <g data-name="Page N" data-type="frame"> and
 * <g data-name="PDF Background" data-type="pdf-vector-layer" data-locked="true">.
 */
export const formatInkscapeSvgForFlipbook = (rawSvg, pageNumber = 1, pageName = null) => {
  const resolvedPageName = pageName || `Page ${pageNumber}`;

  // Extract viewBox and dimensions
  const viewBoxMatch = rawSvg.match(/viewBox=["']([^"']+)["']/i);
  const widthMatch = rawSvg.match(/width=["']([^"']+)["']/i);
  const heightMatch = rawSvg.match(/height=["']([^"']+)["']/i);

  let widthMm = 210;
  let heightMm = 297;
  let vbMinX = 0;
  let vbMinY = 0;
  let vbWidth = null;
  let vbHeight = null;

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      vbMinX = parts[0];
      vbMinY = parts[1];
      vbWidth = parts[2];
      vbHeight = parts[3];
    }
  }

  if (widthMatch && heightMatch) {
    widthMm = parseDimensionToMm(widthMatch[1], 210);
    heightMm = parseDimensionToMm(heightMatch[1], 297);
  } else if (vbWidth && vbHeight) {
    // If width/height attributes missing, treat viewBox units as pt (standard PDF user units)
    widthMm = vbWidth * (25.4 / 72);
    heightMm = vbHeight * (25.4 / 72);
  }

  widthMm = Math.round(widthMm * 100) / 100;
  heightMm = Math.round(heightMm * 100) / 100;

  // Extract inner SVG content (strip outer <svg ...> and </svg>)
  let innerContent = rawSvg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<svg\b[^>]*>/i, "")
    .replace(/<\/svg\s*>/i, "")
    .trim();

  // Scope IDs to prevent interference across pages
  innerContent = scopeSvgIds(innerContent, pageNumber);

  // Compute transform if viewBox differs from mm dimensions
  let contentWrapper = innerContent;
  if (vbWidth && vbHeight && (Math.abs(vbWidth - widthMm) > 0.5 || Math.abs(vbHeight - heightMm) > 0.5 || vbMinX !== 0 || vbMinY !== 0)) {
    const scaleX = widthMm / vbWidth;
    const scaleY = heightMm / vbHeight;
    const transX = -vbMinX * scaleX;
    const transY = -vbMinY * scaleY;
    contentWrapper = `<g transform="translate(${transX.toFixed(4)}, ${transY.toFixed(4)}) scale(${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})">${innerContent}</g>`;
  }

  const rootId = `g-frame-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;
  const bgLayerId = `g-bg-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;
  const rectId = `rect-bg-p${pageNumber}-${Math.random().toString(36).substr(2, 7)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${widthMm} ${heightMm}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${resolvedPageName}" data-type="frame">
    <rect id="${rectId}" x="0" y="0" width="${widthMm}" height="${heightMm}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
    <g id="${bgLayerId}" data-name="PDF Background" data-type="pdf-vector-layer" data-locked="true" style="vector-effect: none">
      ${contentWrapper}
    </g>
  </g>
</svg>`;
};

/**
 * Converts a single-page PDF file into a pure vector SVG using the 'inkscape' node package
 * (or direct binary invocation if the package is not yet installed).
 * Uses --export-text-to-path to convert all text glyphs into vector bezier outlines (<path d="..." />).
 */
export const convertSinglePdfPageWithInkscape = async (pdfPath, outSvgPath) => {
  const binaryPath = getInkscapePath();
  if (!binaryPath || !fs.existsSync(binaryPath)) {
    throw new Error(`Inkscape executable not found at INKSCAPE_PATH: "${binaryPath || ''}". Please verify INKSCAPE_PATH in .env`);
  }

  // Export arguments:
  // --export-type=svg: SVG output
  // --export-text-to-path: flattens text into bezier paths (like Adobe Illustrator Create Outlines)
  // --export-plain-svg: standard W3C SVG without Inkscape custom namespaces
  // --export-area-page: exports the complete page bounding box
  const exportArgs = [
    `--export-filename=${outSvgPath}`,
    "--export-type=svg",
    "--export-text-to-path",
    "--export-plain-svg",
    "--export-area-page"
  ];

  if (fs.existsSync(outSvgPath)) {
    try { fs.unlinkSync(outSvgPath); } catch (e) {}
  }

  // 1. If 'inkscape' npm package is installed and user passed buffers / files
  if (InkscapePackage) {
    try {
      console.log(`[Inkscape Package] Converting single page using 'inkscape' node package...`);
      const streamArgs = [
        "--export-type=svg",
        "--export-text-to-path",
        "--export-plain-svg",
        "--export-area-page"
      ];

      await new Promise((resolve, reject) => {
        const converter = new InkscapePackage(streamArgs);
        const inputStream = fs.createReadStream(pdfPath);
        const outputStream = fs.createWriteStream(outSvgPath);

        converter.on("error", (err) => reject(err));
        inputStream.on("error", (err) => reject(err));
        outputStream.on("error", (err) => reject(err));
        outputStream.on("finish", () => resolve());

        inputStream.pipe(converter).pipe(outputStream);
      });

      if (fs.existsSync(outSvgPath) && fs.statSync(outSvgPath).size > 100) {
        return outSvgPath;
      }
    } catch (pkgErr) {
      console.warn("[Inkscape Package] Stream conversion error, falling back to CLI execution:", pkgErr.message);
    }
  }

  // 2. Direct binary invocation (Inkscape CLI)
  const cmdArgs = [pdfPath, ...exportArgs];
  console.log(`[Inkscape CLI] Converting: ${path.basename(pdfPath)} -> ${path.basename(outSvgPath)}`);
  
  await execFileAsync(binaryPath, cmdArgs, {
    windowsHide: true,
    timeout: 90000,
    maxBuffer: 50 * 1024 * 1024
  });

  if (!fs.existsSync(outSvgPath) || fs.statSync(outSvgPath).size === 0) {
    throw new Error(`Inkscape completed but output file is empty: ${outSvgPath}`);
  }

  return outSvgPath;
};

/**
 * Splits a multi-page PDF into an array of single-page PDF file paths.
 * Uses pdf-lib if available, or returns [pdfPath] if it's already a single-page PDF.
 */
export const splitPdfFileOnBackend = async (pdfPath, tempDir, maxPages = Infinity) => {
  if (!PDFLib) {
    return [pdfPath];
  }

  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages <= 1) {
      return [pdfPath];
    }

    const pagesToExtract = Math.min(totalPages, maxPages);
    const singlePdfPaths = [];

    for (let i = 0; i < pagesToExtract; i++) {
      const singleDoc = await PDFLib.PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
      singleDoc.addPage(copiedPage);

      const singlePdfBytes = await singleDoc.save();
      const singlePagePath = path.join(tempDir, `split_page_${i + 1}_${Date.now()}.pdf`);
      fs.writeFileSync(singlePagePath, singlePdfBytes);
      singlePdfPaths.push(singlePagePath);
    }

    return singlePdfPaths;
  } catch (err) {
    console.warn("[PDF Split Backend] Could not split PDF using pdf-lib:", err.message);
    return [pdfPath];
  }
};

/**
 * Main conversion entry point:
 * Converts single or multi-page PDF(s) to Flipbook vector SVG pages.
 *
 * @param {string|Array<string>} pdfPaths - Path or array of paths to PDF file(s).
 * @param {object} options - Options { maxPages, concurrency }.
 * @returns {Promise<{ pages: Array, width: number, height: number, isUniform: boolean, totalPages: number }>}
 */
export const convertPdfWithInkscape = async (pdfPaths, options = {}) => {
  const rawPaths = Array.isArray(pdfPaths) ? pdfPaths : [pdfPaths];
  const maxPages = options.maxPages || Infinity;

  const tempDir = path.join(__dirname, "../temp_uploads/pdf_uploads", `inkscape_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const generatedTempFiles = [];

  try {
    // 1. Expand multi-page PDFs into single-page PDF paths
    let singlePagePdfPaths = [];
    for (const p of rawPaths) {
      const splitPaths = await splitPdfFileOnBackend(p, tempDir, maxPages);
      if (splitPaths.length > 1 || splitPaths[0] !== p) {
        generatedTempFiles.push(...splitPaths);
      }
      singlePagePdfPaths.push(...splitPaths);
      if (singlePagePdfPaths.length >= maxPages) break;
    }

    singlePagePdfPaths = singlePagePdfPaths.slice(0, maxPages);

    // 2. Convert each single-page PDF into vector SVG with outlined text
    const pages = [];
    for (let i = 0; i < singlePagePdfPaths.length; i++) {
      const singlePdf = singlePagePdfPaths[i];
      const pageNumber = i + 1;
      const pageName = `Page ${pageNumber}`;
      const outSvgPath = path.join(tempDir, `page_${pageNumber}.svg`);
      generatedTempFiles.push(outSvgPath);

      await convertSinglePdfPageWithInkscape(singlePdf, outSvgPath);

      const rawSvg = fs.readFileSync(outSvgPath, "utf8");
      const formattedSvg = formatInkscapeSvgForFlipbook(rawSvg, pageNumber, pageName);

      // Extract width and height from formatted SVG
      const vbMatch = formattedSvg.match(/viewBox=["']0 0 ([0-9.]+) ([0-9.]+)["']/i);
      const width = vbMatch ? parseFloat(vbMatch[1]) : 210;
      const height = vbMatch ? parseFloat(vbMatch[2]) : 297;

      pages.push({
        pageNumber,
        pageName,
        content: formattedSvg,
        width,
        height,
        isVector: true
      });
    }

    if (pages.length === 0) {
      throw new Error("No pages could be converted by Inkscape.");
    }

    const firstW = pages[0].width;
    const firstH = pages[0].height;
    const isUniform = pages.every(
      (p) => Math.abs(p.width - firstW) < 1 && Math.abs(p.height - firstH) < 1
    );

    return {
      pages,
      width: firstW,
      height: firstH,
      isUniform,
      totalPages: pages.length
    };
  } finally {
    // Cleanup temporary files and directory
    for (const f of generatedTempFiles) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (e) {}
      }
    }
    if (fs.existsSync(tempDir)) {
      try { fs.rmdirSync(tempDir); } catch (e) {}
    }
  }
};
