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
 * Reads page count, dimensions (mm), and checks dimension uniformity for a PDF file.
 * @param {File} file 
 * @returns {Promise<{count: number, width: number, height: number, isUniform: boolean, pages: Array<{pageNumber: number, width: number, height: number}>}>}
 */
export const getPdfDetails = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const doc = mupdf.Document.openDocument(uint8Array, 'application/pdf');
  const count = doc.countPages();
  const pages = [];
  const ptToMm = 25.4 / 96;

  for (let i = 0; i < count; i++) {
    const page = doc.loadPage(i);
    const bounds = page.getBounds(); // [x0, y0, x1, y1]
    const widthPt = bounds[2] - bounds[0];
    const heightPt = bounds[3] - bounds[1];
    pages.push({
      pageNumber: i + 1,
      width: widthPt * ptToMm,
      height: heightPt * ptToMm,
      widthPt,
      heightPt
    });
    page.destroy();
  }
  doc.destroy();

  if (count === 0) {
    return {
      count: 0,
      width: 0,
      height: 0,
      isUniform: false,
      pages: []
    };
  }

  const firstPage = pages[0];
  const isUniform = pages.every(
    (p) => Math.abs(p.width - firstPage.width) < 1 && Math.abs(p.height - firstPage.height) < 1
  );

  return {
    count,
    width: firstPage.width,
    height: firstPage.height,
    isUniform,
    pages
  };
};

/**
 * Fast helper to convert an SVG string to a data URL without FileReader overhead.
 * @param {string} svgString 
 * @returns {string}
 */
export const svgToDataUrl = (svgString) => {
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }
};

/**
 * Converts a PDF file into an array of SVGs (Blobs and strings) with high performance.
 * @param {File} file - The PDF file to convert.
 * @param {number} scale - Rendering scale if raster fallback is needed.
 * @param {number} maxPages - Max pages to convert.
 * @returns {Promise<Array<{blob: Blob, svgString: string, width: number, height: number}>>}
 */
export const convertPdfToImages = async (file, scale = 2, maxPages = Infinity) => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  const doc = mupdf.Document.openDocument(uint8Array, 'application/pdf');
  const totalPages = doc.countPages();
  const numPages = Math.min(totalPages, maxPages);

  const images = [];
  const ptToMm = 25.4 / 96;

  for (let i = 0; i < numPages; i++) {
    let page = null;
    let writer = null;
    let device = null;
    let buf = null;
    try {
      page = doc.loadPage(i);
      const bounds = page.getBounds(); // [x0, y0, x1, y1]
      
      const widthPt = bounds[2] - bounds[0];
      const heightPt = bounds[3] - bounds[1];
      const widthMm = widthPt * ptToMm;
      const heightMm = heightPt * ptToMm;

      // Render vector SVG directly using native C WASM DocumentWriter
      buf = new mupdf.Buffer();
      writer = new mupdf.DocumentWriter(buf, 'svg', 'image-format=png');
      device = writer.beginPage(bounds);
      page.run(device, mupdf.Matrix.identity);
      writer.endPage();
      writer.close();
      
      let svgString = buf.asString();

      // Fallback: If SVG output is somehow empty, rasterize cleanly
      if (!svgString || svgString.length < 50) {
        const pixmapMatrix = mupdf.Matrix.scale(scale, scale);
        const pixmap = page.toPixmap(pixmapMatrix, mupdf.ColorSpace.DeviceRGB, false, true);
        const pngBytes = pixmap.asPNG();
        let binary = '';
        const chunkSize = 16384;
        for (let j = 0; j < pngBytes.length; j += chunkSize) {
          binary += String.fromCharCode.apply(null, pngBytes.subarray(j, j + chunkSize));
        }
        const pngDataUrl = 'data:image/png;base64,' + btoa(binary);
        pixmap.destroy();
        svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPt}" height="${heightPt}" viewBox="0 0 ${widthPt} ${heightPt}"><image href="${pngDataUrl}" x="0" y="0" width="${widthPt}" height="${heightPt}" preserveAspectRatio="none" /></svg>`;
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' });

      images.push({
        blob,
        svgString,
        width: widthMm,
        height: heightMm,
      });
    } catch (err) {
      console.error(`Error converting page ${i}:`, err);
    } finally {
      if (buf) buf.destroy();
      if (writer) writer.destroy();
      if (device) device.destroy();
      if (page) page.destroy();
    }
  }

  doc.destroy();
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
