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

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    moduleId: 'my-flipbooks',
    moduleName: 'My Flipbooks',
    postType: 'question', // 'question' | 'suggestion'
    status: 'answered',
    title: 'High-res PDF page takes more than 15 seconds to render first flip preview',
    description: 'When uploading a 60-page PDF containing high-resolution vector diagrams (around 45MB), the first-page rendering in the shelf preview takes prolonged time or sometimes shows the shimmer skeleton continuously. Is there an automatic downsampling preset for this case?',
    author: {
      name: 'Elena Rostova',
      initials: 'ER',
      email: 'elena@example.com',
      avatarColor: '#7c3aed',
      role: 'User'
    },
    createdAt: '2 hours ago',
    updatedAt: '2 hours ago',
    sameQuestionUsers: ['user1', 'user2', 'user3'],
    followedBy: ['user1', 'elena@example.com'],
    adminReply: {
      id: 'admin-rep-1',
      author: {
        name: 'Flipibook Engineering',
        initials: 'FE',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#2563eb'
      },
      createdAt: '2 hours ago',
      content: `Currently, there isn't an automatic downsampling preset for preview rendering. You can try uploading the PDF in smaller resolution or we are working on adding this feature in the next release. We'll keep you posted once it's available.`
    },
    comments: [
      {
        id: 'c-user-1',
        author: {
          name: 'John Smith',
          initials: 'JS',
          email: 'john@example.com',
          avatarColor: '#2563eb'
        },
        createdAt: '1 hour ago',
        content: 'Facing the same issue with a 42MB file. Looking forward to the update!'
      },
      {
        id: 'c-user-2',
        author: {
          name: 'Sneha Kapoor',
          initials: 'SK',
          email: 'sneha@example.com',
          avatarColor: '#f43f5e'
        },
        createdAt: '45 minutes ago',
        content: 'Yes, I also noticed this with a similar file size. Thanks for the update!'
      }
    ]
  },
  {
    id: 'post-2',
    moduleId: 'my-flipbooks',
    moduleName: 'My Flipbooks',
    postType: 'suggestion',
    status: 'under_review',
    title: 'Can we configure password protected share links with an expiration timestamp?',
    description: 'In the Share modal, I see options for Public, Password, and Invite. Is it possible to configure an automatic expiration time (e.g. 7 days or 30 days) for client proofing flipbooks so the links self-terminate?',
    author: {
      name: 'John Smith',
      initials: 'JS',
      email: 'john@example.com',
      avatarColor: '#2563eb',
      role: 'User'
    },
    createdAt: '3 days ago',
    updatedAt: '1 day ago',
    sameQuestionUsers: ['user1', 'user4'],
    followedBy: ['john@example.com'],
    adminReply: {
      id: 'admin-rep-2',
      author: {
        name: 'Product Success',
        initials: 'PS',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#2563eb'
      },
      createdAt: '1 day ago',
      content: `Thanks for the suggestion John! We are reviewing password expiry for shared links with our security pipeline. This is currently marked Under Review.`
    },
    comments: []
  },
  {
    id: 'post-3',
    moduleId: 'page-editor',
    moduleName: 'Page Editor',
    postType: 'question',
    status: 'awaiting_admin',
    title: 'How to add custom fonts to the flipbook template?',
    description: 'I want to use a custom font in my flipbook. Where should I upload the font files (.woff2 or .ttf) and how do I apply them in the editor? Any step-by-step guidance would be helpful.',
    author: {
      name: 'Sneha Kapoor',
      initials: 'SK',
      email: 'sneha@example.com',
      avatarColor: '#f43f5e',
      role: 'User'
    },
    createdAt: '5 days ago',
    updatedAt: '5 days ago',
    sameQuestionUsers: ['user2'],
    followedBy: ['sneha@example.com'],
    adminReply: null,
    comments: []
  },
  {
    id: 'post-4',
    moduleId: '3d-editor',
    moduleName: '3D Editor',
    postType: 'question',
    status: 'answered',
    title: '3D models not loading properly on mobile WebGL browsers',
    description: 'On some Android devices, 3D models load but become blank after a few seconds. This doesn\'t happen on desktop. Is there a polygon count or texture memory limit recommendation for mobile WebGL?',
    author: {
      name: 'Anand Nair',
      initials: 'AN',
      email: 'anand@example.com',
      avatarColor: '#0891b2',
      role: 'User'
    },
    createdAt: '1 week ago',
    updatedAt: '5 days ago',
    sameQuestionUsers: ['user1', 'user5'],
    followedBy: [],
    adminReply: {
      id: 'admin-rep-4',
      author: {
        name: '3D Tech Lead',
        initials: 'TL',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#2563eb'
      },
      createdAt: '5 days ago',
      content: `Mobile GPU memory limits often restrict textures to 2048x2048 or lower. We recommend keeping total model size under 15MB with compressed GLB textures (KTX2/Basis) to prevent context loss on mobile browsers.`
    },
    comments: []
  },
  {
    id: 'post-5',
    moduleId: 'converter',
    moduleName: 'Converter',
    postType: 'suggestion',
    status: 'planned',
    title: 'Support batch PDF conversion with preset folder assignment',
    description: 'Currently we convert PDFs one by one. Having a batch queue where we can drag in 5 PDFs and have them convert sequentially directly into a chosen Shelf folder would save significant time.',
    author: {
      name: 'Elena Rostova',
      initials: 'ER',
      email: 'elena@example.com',
      avatarColor: '#7c3aed',
      role: 'User'
    },
    createdAt: '2 weeks ago',
    updatedAt: '3 days ago',
    sameQuestionUsers: ['user1', 'user2', 'user3', 'user6'],
    followedBy: ['elena@example.com'],
    adminReply: {
      id: 'admin-rep-5',
      author: {
        name: 'Flipibook Product',
        initials: 'FP',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#2563eb'
      },
      createdAt: '3 days ago',
      content: `Great suggestion! Batch background conversion is actively on our roadmap and planned for the Q4 product release.`
    },
    comments: []
  }
];

const LOCAL_STORAGE_KEY = 'flipibook_forum_posts_v5';

export const getStoredPosts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load forum posts from storage:', e);
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
  } catch (e) {}
  return INITIAL_POSTS;
};

export const saveStoredPosts = (posts) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save forum posts:', e);
  }
};
