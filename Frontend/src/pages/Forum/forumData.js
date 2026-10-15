// Frontend/src/pages/Forum/forumData.js

export const FORUM_MODULES = [
  {
    id: 'my-flipbooks',
    name: 'My Flipbooks',
    shortName: 'Flipbooks',
    tagline: 'PDF conversion, page flip rendering, shelf management & exports',
    description: 'Discussions and feedback related to uploading PDFs, generating SVG/Canvas previews, flip animations, shelf organization, and public/private book sharing.',
    icon: 'BookOpen',
    color: '#ec5137'
  },
  {
    id: 'page-editor',
    name: 'Page Editor',
    shortName: 'Page Editor',
    tagline: 'Canvas layout, text elements, stickers, shapes & layers',
    description: 'Inquiries and suggestions regarding 2D template canvas, font rendering, graphic assets, multi-page layout templates, and vector exporting.',
    icon: 'FileText',
    color: '#f97316'
  },
  {
    id: 'customised-editor',
    name: 'Customised Editor',
    shortName: 'Custom Editor',
    tagline: 'Branding logos, background audio, themes & security',
    description: 'Topics regarding custom reader skins, navbar and toolbar visibility, background music autoplay, password protection, and branding assets.',
    icon: 'Settings',
    color: '#ea580c'
  },
  {
    id: '3d-editor',
    name: '3D Editor',
    shortName: '3D Editor',
    tagline: '3D glTF/GLB models, PBR textures, Rapier physics & AR View',
    description: 'Discussions on importing 3D models, Blender GLB exports, texture roughness/metallic channels, Rapier rigid bodies, camera views, and AR mobile streaming.',
    icon: 'Box',
    color: '#0d9488'
  },
  {
    id: 'converter',
    name: 'Converter',
    shortName: 'Converter',
    tagline: 'PDF, Word, EPUB & PowerPoint conversion pipeline',
    description: 'Questions and troubleshooting for converting documents into interactive flipbook pages.',
    icon: 'Repeat',
    color: '#0284c7'
  },
  {
    id: 'account-workspace',
    name: 'Account & Workspace',
    shortName: 'Workspace',
    tagline: 'Profile settings, cloud storage, billing & integrations',
    description: 'Questions and suggestions regarding user authentication, cloud storage quotas, API keys, webhook integrations, and subscription billing.',
    icon: 'User',
    color: '#d97706'
  }
];

// Status definitions tailored to Product Knowledge & Feedback
export const POST_STATUS_CONFIG = {
  awaiting_admin: {
    id: 'awaiting_admin',
    label: 'Awaiting Admin',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300/80',
    dot: 'bg-amber-500'
  },
  answered: {
    id: 'answered',
    label: 'Answered',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300/80',
    dot: 'bg-emerald-500'
  },
  under_review: {
    id: 'under_review',
    label: 'Under Review',
    bg: 'bg-orange-50',
    text: 'text-[#c23d26]',
    border: 'border-orange-300/80',
    dot: 'bg-[#ec5137]'
  },
  planned: {
    id: 'planned',
    label: 'Planned',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300/80',
    dot: 'bg-blue-500'
  },
  implemented: {
    id: 'implemented',
    label: 'Implemented',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300/80',
    dot: 'bg-teal-500'
  },
  declined: {
    id: 'declined',
    label: 'Not Planned',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    dot: 'bg-stone-400'
  }
};

export const formatForumDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    // If it's already a friendly string like 'Just now', '2 hours ago'
    return String(dateVal);
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // Standard readable date: "Oct 14, 2026, 9:43 AM"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
