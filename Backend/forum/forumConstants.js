// Backend/forum/forumConstants.js

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

export const POST_STATUS_CONFIG = {
  awaiting_admin: {
    id: 'awaiting_admin',
    label: 'Awaiting Admin'
  },
  answered: {
    id: 'answered',
    label: 'Answered'
  },
  under_review: {
    id: 'under_review',
    label: 'Under Review'
  },
  planned: {
    id: 'planned',
    label: 'Planned'
  },
  implemented: {
    id: 'implemented',
    label: 'Implemented'
  },
  declined: {
    id: 'declined',
    label: 'Not Planned'
  }
};
