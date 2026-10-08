/**
 * Supabase CDN URL Utilities
 * Centralizes all Supabase storage URL construction so every component
 * uses VITE_SUPABASE_URL + VITE_SUPABASE_BUCKET instead of the backend /uploads/ proxy.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';
const rawBackend = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
const BACKEND_URL = rawBackend.replace(/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, 'http://$1$2');

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


export function resolveUploadsPath(path) {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('blob:') || path.startsWith('data:')) return path;

  let cleanPath = path;

  // Auto-heal double URL concatenation (e.g. https://devtunnel.mshttps://supabase.co... or https://...https//...)
  const doubleUrlMatch = cleanPath.match(/^https?:\/\/[^/]+(https?:?\/?\/?.+)$/i);
  if (doubleUrlMatch) {
    let nested = doubleUrlMatch[1];
    if (!nested.startsWith('http://') && !nested.startsWith('https://')) {
      nested = nested.replace(/^https?:?\/?\/?/i, 'https://');
    }
    return nested;
  }

  // If path contains backend origin with /uploads/, strip backend origin
  if (/^https?:\/\/[^/]+\/uploads\//i.test(cleanPath)) {
    cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\/uploads\//i, '/uploads/');
  }

  // If URL points to localhost:5000 or any backend port with /hdri/, /textures/, /assets/, /temp_uploads/, or /uploads/, rewrite origin to current BACKEND_URL
  const backendAssetMatch = cleanPath.match(/^https?:\/\/[^/]+(\/(?:hdri|textures|assets|temp_uploads)\/.+)$/i);
  if (backendAssetMatch) {
    return `${BACKEND_URL}${backendAssetMatch[1]}`;
  }

  // Route relative static backend paths to BACKEND_URL
  if (
    cleanPath.startsWith('/hdri') || cleanPath.startsWith('hdri/') ||
    cleanPath.startsWith('/textures') || cleanPath.startsWith('textures/') ||
    cleanPath.startsWith('/assets') || cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('/temp_uploads') || cleanPath.startsWith('temp_uploads/')
  ) {
    const slash = cleanPath.startsWith('/') ? '' : '/';
    return `${BACKEND_URL}${slash}${cleanPath}`;
  }

  // Enforce http (not https) for localhost or 127.0.0.1 to avoid ERR_SSL_PROTOCOL_ERROR
  cleanPath = cleanPath.replace(/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, 'http://$1$2');

  // If it's already a full external URL (like direct supabase or http/https URL), return it directly
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }

  // Check if this is an upload path
  const isUpload = cleanPath.startsWith('/uploads') || cleanPath.startsWith('uploads/');
  if (!isUpload) return cleanPath;

  if (SUPABASE_URL) {
    const key = cleanPath.replace(/^\/?uploads\/?/, '');
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
  }

  const slash = cleanPath.startsWith('/') ? '' : '/';
  return `${BACKEND_URL}${slash}${cleanPath}`;
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

  // Split on data: URI boundaries so we NEVER touch base64 content.
  // Only the segments between data: URIs are rewritten.
  const DATA_URI_RE = /(data:[^;]+;base64,[A-Za-z0-9+/=\s]+)/g;
  const parts = html.split(DATA_URI_RE);

  for (let i = 0; i < parts.length; i++) {
    // Even-indexed parts are normal HTML; odd-indexed parts are data: URIs — skip those.
    if (i % 2 !== 0) continue;

    parts[i] = parts[i]
      .replace(/(src|href|xlink:href)=(['"])(\/uploads\/|uploads\/)/g, `$1=$2${cdnBase}`)
      .replace(/(['"\s(])(\/uploads\/|uploads\/)/g, `$1${cdnBase}`)
      .replace(/(src|href|xlink:href)=(['"])https?:\/\/[^/]+\/uploads\//g, `$1=$2${cdnBase}`)
      .replace(/(url\(\s*['"]?)https?:\/\/[^/]+\/uploads\//g, `$1${cdnBase}`);
  }

  return parts.join('');
}

export { SUPABASE_URL, SUPABASE_BUCKET, BACKEND_URL };
