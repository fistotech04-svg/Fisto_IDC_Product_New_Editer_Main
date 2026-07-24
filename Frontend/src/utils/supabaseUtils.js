/**
 * Supabase CDN URL Utilities
 * Centralizes all Supabase storage URL construction so every component
 * uses VITE_SUPABASE_URL + VITE_SUPABASE_BUCKET instead of the backend /uploads/ proxy.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Build the CDN base URL for a flipbook's folder.
 * Always prefers Supabase CDN; falls back to backend /uploads/ proxy if VITE_SUPABASE_URL is missing.
 *
 * @param {string} sanitizedEmail  - email with @/. replaced by _
 * @param {string} folderName      - actual physical folder name
 * @param {string} flipbookName    - flipbook folder name on storage
 * @returns {string}               - base URL ending with /
 */
export function getSupabaseBaseUrl(sanitizedEmail, folderName, flipbookName) {
  const cleanSeg = (s) => {
    if (!s || s === 'undefined' || s === 'null') return '';
    let decoded = s;
    try { decoded = decodeURIComponent(s); } catch (e) {}
    return decoded.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  };

  const email = cleanSeg(sanitizedEmail);
  const folder = cleanSeg(folderName);
  const book = cleanSeg(flipbookName);

  const segments = [email, 'My_Flipbooks', folder, book].filter(Boolean);
  const fullPath = segments.join('/');

  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${fullPath}/`;
  }
  return `${BACKEND_URL}/uploads/${fullPath}/`;
}


/**
 * Resolve a bare /uploads/... relative path to the Supabase CDN public URL.
 * @param {string} path - path starting with /uploads/
 * @returns {string}
 */
export function resolveUploadsPath(path) {
  if (!path || !path.startsWith('/uploads/')) return path;
  if (SUPABASE_URL) {
    const key = path.replace(/^\/uploads\//, '');
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
  }
  return `${BACKEND_URL}${path}`;
}

/**
 * Rewrite all /uploads/... references in raw HTML to Supabase CDN URLs.
 * Used in view/preview pages so every asset loads directly from Supabase.
 * @param {string} html
 * @returns {string}
 */
export function rewriteHtmlUploadsToSupabase(html) {
  if (!html || !SUPABASE_URL) return html;
  const cdnBase = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  // Replace all /uploads/ references (both attribute values and URL() calls)
  let rewritten = html
    .replace(/(src|href|xlink:href)=(['"])(\/uploads\/)/g, `$1=$2${cdnBase}`)
    .replace(/(['"\s(])(\/uploads\/)/g, `$1${cdnBase}`)
    // Replace any stale backend host + /uploads/ patterns
    .replace(/(src|href|xlink:href)=(['"])https?:\/\/[^/]+\/uploads\//g, `$1=$2${cdnBase}`);

  // Fix any accidental double/triple slashes in asset/image paths like My_Flipbooks///assets/
  rewritten = rewritten.replace(/([^:])\/{2,}/g, '$1/');
  return rewritten;
}

export { SUPABASE_URL, SUPABASE_BUCKET, BACKEND_URL };
