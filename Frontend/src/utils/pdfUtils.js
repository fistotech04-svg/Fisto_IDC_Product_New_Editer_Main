import * as mupdf from 'mupdf';

/**
 * Gets the number of pages in a PDF file.
 * @param {File} file 
 * @returns {Promise<number>}
 */
export const getPdfPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const doc = mupdf.Document.openDocument(uint8Array, 'application/pdf');
  const count = doc.countPages();
  doc.destroy();
  return count;
};

/**
 * Converts a PDF file into an array of SVGs (Blobs).
 * @param {File} file - The PDF file to convert.
 * @param {number} scale - Rendering scale for the raster background (default 2 for high quality zoom).
 * @returns {Promise<Array<{blob: Blob, width: number, height: number}>>}
 */
export const convertPdfToImages = async (file, scale = 2, maxPages = Infinity) => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Get numPages first, then destroy doc to free initial memory
  let initialDoc = mupdf.Document.openDocument(uint8Array, 'application/pdf');
  const numPages = Math.min(initialDoc.countPages(), maxPages);
  initialDoc.destroy();

  const images = [];

  for (let i = 0; i < numPages; i++) {
    let doc = null;
    try {
      // Re-open document per page with a fresh slice of the buffer to prevent WASM stream consumption/corruption
      doc = mupdf.Document.openDocument(uint8Array.slice(), 'application/pdf');
      const page = doc.loadPage(i);
      const bounds = page.getBounds(); // [x0, y0, x1, y1]
      
      // Bounds are in points (72 points = 1 inch). We convert to mm.
      const widthPt = bounds[2] - bounds[0];
      const heightPt = bounds[3] - bounds[1];
      
      // Calculate size in mm (25.4 mm = 1 inch, so 25.4 / 72 mm per pt)
      const ptToMm = 25.4 / 96;
      const widthMm = widthPt * ptToMm;
      const heightMm = heightPt * ptToMm;

      // 1. Render perfectly colored background image using Pixmap (handles Decode arrays and ICC correctly)
      const pixmapMatrix = mupdf.Matrix.scale(scale, scale);
      const pixmap = page.toPixmap(pixmapMatrix, mupdf.ColorSpace.DeviceRGB, false, true);
      const pngBytes = pixmap.asPNG();
      
      // Convert Uint8Array to base64 safely and fast without crashing the stack
      let binary = '';
      const chunkSize = 8192; // Process in 8KB chunks
      for (let j = 0; j < pngBytes.length; j += chunkSize) {
        binary += String.fromCharCode.apply(null, pngBytes.subarray(j, j + chunkSize));
      }
      const pngDataUrl = 'data:image/png;base64,' + btoa(binary);
      
      pixmap.destroy();

      // 2. Render vector SVG paths using DocumentWriter
      const buf = new mupdf.Buffer();
      const writer = new mupdf.DocumentWriter(buf, 'svg', '');
      const device = writer.beginPage(bounds);
      
      page.run(device, mupdf.Matrix.identity);
      writer.endPage();
      writer.close();
      
      // 3. Strip the natively embedded SVG images (because they are often negative/broken in mupdf)
      let svgString = buf.asString().replace(/<image[\s\S]*?(?:\/>|<\/image>)/gi, '');
      
      // 4. Combine them! Inject our perfect Pixmap PNG as the very first element inside the SVG
      // Wrap the mupdf vector layers in a darken blend mode so any solid white backgrounds become transparent,
      // perfectly revealing the colored images underneath while keeping the black text razor sharp!
      svgString = svgString.replace(
        /(<svg[^>]*>)/i,
        `$1\n<image href="${pngDataUrl}" x="${bounds[0]}" y="${bounds[1]}" width="${widthPt}" height="${heightPt}" preserveAspectRatio="none" />\n<g style="mix-blend-mode: darken;">`
      );
      svgString = svgString.replace(/<\/svg>\s*$/i, '</g></svg>');
      
      buf.destroy();
      writer.destroy();
      device.destroy();
      page.destroy();

      const blob = new Blob([svgString], { type: 'image/svg+xml' });

      images.push({
        blob,
        width: widthMm,
        height: heightMm,
      });
    } catch (err) {
      console.error(`Error converting page ${i}:`, err);
    } finally {
      if (doc) {
        doc.destroy();
      }
    }
  }

  return images;
};

/**
 * Generates the SVG HTML for a PDF page image.
 * @param {string} fullImageUrl - The absolute URL of the uploaded image.
 * @param {string} pageName - The name of the page.
 * @param {number} baseWidth - The base width of the canvas (default 210).
 * @param {number} baseHeight - The base height of the canvas (default 297).
 * @returns {string} SVG HTML string.
 */
export const generatePdfPageSvg = (fullImageUrl, pageName = "PDF Background", baseWidth, baseHeight) => {
  if (!baseWidth || !baseHeight) {
    console.warn("generatePdfPageSvg called without dimensions, falling back to A4");
    baseWidth = 210;
    baseHeight = 297;
  }
  const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
  const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
  const imageId = `img-${Math.random().toString(36).substr(2, 9)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${baseWidth} ${baseHeight}" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${pageName}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" shape-rendering="crispEdges" />
    <image id="${imageId}" x="0" y="0" width="${baseWidth}" height="${baseHeight}" href="${fullImageUrl}" preserveAspectRatio="none" data-name="PDF Background" data-locked="true" />
  </g>
</svg>`;
};
