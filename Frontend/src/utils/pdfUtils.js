import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Gets the number of pages in a PDF file.
 * @param {File} file 
 * @returns {Promise<number>}
 */
export const getPdfPageCount = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
};

/**
 * Converts a PDF file into an array of images (Blobs).
 * @param {File} file - The PDF file to convert.
 * @param {number} scale - Rendering scale (default 2 for high quality).
 * @returns {Promise<Array<{blob: Blob, width: number, height: number}>>}
 */
export const convertPdfToImages = async (file, scale = 2, maxPages = Infinity) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];

  const numPages = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    images.push({
      blob,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return images;
};

/**
 * Generates the SVG HTML for a PDF page image.
 * @param {string} fullImageUrl - The absolute URL of the uploaded image.
 * @param {string} pageName - The name of the page.
 * @returns {string} SVG HTML string.
 */
export const generatePdfPageSvg = (fullImageUrl, pageName = "PDF Background") => {
  const rootId = `g-${Math.random().toString(36).substr(2, 9)}`;
  const overlayId = `rect-${Math.random().toString(36).substr(2, 9)}`;
  const imageId = `img-${Math.random().toString(36).substr(2, 9)}`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 210 297" width="100%" height="100%" style="overflow: visible">
  <g id="${rootId}" data-name="${pageName}" data-type="frame">
    <rect id="${overlayId}" x="0" y="0" width="210" height="297" fill="#ffffff" data-name="Overlay" data-type="background" data-locked="true" />
    <image id="${imageId}" x="0" y="0" width="210" height="297" href="${fullImageUrl}" preserveAspectRatio="none" data-name="PDF Background" />
  </g>
</svg>`;
};
