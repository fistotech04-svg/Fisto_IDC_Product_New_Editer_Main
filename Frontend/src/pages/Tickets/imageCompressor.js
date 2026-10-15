// Frontend/src/pages/Tickets/imageCompressor.js

/**
 * Validates and sequentially compresses up to 5 images for ticket messages.
 * 
 * Rules:
 * - Allowed formats: JPG, PNG, JPEG, WebP
 * - Max raw file size: 10 MB per image
 * - Max 5 images per message
 * - Resize sequentially to max dimension 1920px (preserving aspect ratio)
 * - Target compressed size: 300 KB – 800 KB per image (quality auto-tuning)
 * - Combined upload limit: 4 MB across all attached images
 * - Temporary memory release after compression
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_RAW_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_COMBINED_BYTES = 4 * 1024 * 1024;  // 4 MB total
const MAX_DIMENSION = 1920;                  // 1920 px
const MAX_COUNT = 5;

/**
 * Format bytes into human readable string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Compresses a single Image object or File onto a Canvas sequentially.
 * @param {File} file 
 * @returns {Promise<{ file: File, dataUrl: string, name: string, size: number, originalSize: number, width: number, height: number }>}
 */
export async function compressSingleImage(file) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return reject(new Error(`"${file.name}" has an unsupported format. Please use JPG, JPEG, PNG, or WebP.`));
    }

    // Validate raw size
    if (file.size > MAX_RAW_SIZE_BYTES) {
      return reject(new Error(`"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum original limit of 10 MB.`));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions preserving aspect ratio
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: file.type === 'image/png' || file.type === 'image/webp' });
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error('Canvas context could not be created'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Clean up source image object URL to release RAM immediately
      URL.revokeObjectURL(objectUrl);

      // Target format: WebP or JPEG for optimal compression ratio
      const outputMime = file.type === 'image/png' ? 'image/png' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');

      // Iterative quality search to target ~300KB - 800KB
      let quality = 0.85;

      const attemptCompression = (q) => {
        return new Promise((resBlob) => {
          canvas.toBlob((blob) => resBlob(blob), outputMime, q);
        });
      };

      (async () => {
        try {
          let blob = await attemptCompression(quality);

          // If blob is still > 800KB, reduce quality progressively
          if (blob && blob.size > 800 * 1024 && quality > 0.4) {
            quality = 0.70;
            blob = await attemptCompression(quality);
          }
          if (blob && blob.size > 800 * 1024 && quality > 0.4) {
            quality = 0.55;
            blob = await attemptCompression(quality);
          }

          if (!blob) {
            throw new Error('Image compression output was empty');
          }

          // Build a readable base64 dataUrl for client-side previews & immediate display
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;

            // Explicitly clear canvas RAM
            canvas.width = 1;
            canvas.height = 1;

            resolve({
              file: new File([blob], file.name, { type: blob.type }),
              name: file.name,
              dataUrl,
              size: blob.size,
              originalSize: file.size,
              width,
              height,
              mimeType: blob.type
            });
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          canvas.width = 1;
          canvas.height = 1;
          reject(err);
        }
      })();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load and process image "${file.name}".`));
    };

    img.src = objectUrl;
  });
}

/**
 * Processes a list of raw user files sequentially in browser RAM.
 * Enforces:
 * - Max 5 files total
 * - JPG, PNG, JPEG, WebP
 * - 10MB raw limit per image
 * - Combined upload limit of 4MB after compression
 * 
 * @param {FileList|File[]} files
 * @param {Array} existingAttachments
 * @returns {Promise<{ attachments: Array, combinedSize: number }>}
 */
export async function processImageAttachmentsSequentially(files, existingAttachments = []) {
  const fileArray = Array.from(files || []);
  if (fileArray.length === 0) {
    return { attachments: existingAttachments, combinedSize: existingAttachments.reduce((acc, a) => acc + (a.size || 0), 0) };
  }

  const totalCount = existingAttachments.length + fileArray.length;
  if (totalCount > MAX_COUNT) {
    throw new Error(`You can upload a maximum of ${MAX_COUNT} images per message. You currently have ${existingAttachments.length} and attempted to add ${fileArray.length}.`);
  }

  const results = [...existingAttachments];

  // Process sequentially to keep device memory footprint strictly bounded
  for (const file of fileArray) {
    const compressed = await compressSingleImage(file);
    results.push(compressed);
  }

  // Check combined upload limit (4 MB)
  const totalCombinedBytes = results.reduce((sum, item) => sum + (item.size || 0), 0);
  if (totalCombinedBytes > MAX_COMBINED_BYTES) {
    throw new Error(`Combined upload size is ${formatFileSize(totalCombinedBytes)}, which exceeds the maximum limit of 4 MB. Please remove or use smaller images.`);
  }

  return {
    attachments: results,
    combinedSize: totalCombinedBytes
  };
}
