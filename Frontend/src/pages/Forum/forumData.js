// Frontend/src/pages/Forum/forumData.js

export const FORUM_MODULES = [
  {
    id: 'my-flipbooks',
    name: 'My Flipbooks',
    shortName: 'Flipbooks',
    tagline: 'PDF conversion, page flip rendering, shelf management & exports',
    description: 'Discussions and issues related to uploading PDFs, generating SVG/Canvas previews, page flip animations, shelf organization, and public/private book sharing.',
    icon: 'BookOpen',
    color: '#ec5137',
    badgeText: 'Core'
  },
  {
    id: 'template-editor',
    name: 'Template Editor',
    shortName: 'Template Editor',
    tagline: 'Canvas layout, text elements, stickers, shapes & layers',
    description: 'Post issues or tips regarding the 2D template canvas, font rendering, graphic assets, multi-page layout templates, and vector exporting.',
    icon: 'PenTool',
    color: '#2563eb',
    badgeText: 'Design'
  },
  {
    id: 'customised-editor',
    name: 'Customised Editor',
    shortName: 'Custom Editor',
    tagline: 'Branding logos, background audio, themes & security',
    description: 'Topics regarding custom reader skins, navbar and toolbar visibility, background music autoplay, password protection, and branding assets.',
    icon: 'SlidersHorizontal',
    color: '#7c3aed',
    badgeText: 'Custom'
  },
  {
    id: '3d-editor',
    name: '3D Editor',
    shortName: '3D Editor',
    tagline: '3D glTF/GLB models, PBR textures, Rapier physics & AR View',
    description: 'Discussions on importing 3D models, Blender GLB exports, texture roughness/metallic channels, Rapier rigid bodies, camera views, and AR mobile streaming.',
    icon: 'Box',
    color: '#059669',
    badgeText: '3D / WebXR'
  },
  {
    id: 'general',
    name: 'Account & Workspace',
    shortName: 'Workspace',
    tagline: 'Profile settings, cloud storage, billing & integrations',
    description: 'Questions and support regarding user authentication, cloud storage quotas, API keys, webhook integrations, and subscription billing.',
    icon: 'Layers',
    color: '#d97706',
    badgeText: 'Account'
  }
];

export const ISSUE_CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'bug', label: 'Bug' },
  { id: 'question', label: 'Question' },
  { id: 'feature', label: 'Feature Request' },
  { id: 'performance', label: 'Performance' }
];

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    moduleId: 'my-flipbooks',
    moduleName: 'My Flipbooks',
    category: 'bug',
    status: 'resolved',
    title: 'High-res PDF page takes more than 15 seconds to render first flip preview',
    description: 'When uploading a 60-page PDF containing high-resolution vector diagrams (around 45MB), the first-page rendering in the shelf preview takes prolonged time or sometimes shows the shimmer skeleton continuously. Is there an automatic downsampling preset for preview caching?',
    stepsToReproduce: '1. Navigate to My Flipbooks.\n2. Click "Upload New PDF" with a file > 40MB.\n3. Wait for processing. Initial flipbook card shows loading shimmer for ~20 seconds.',
    environment: 'Chrome 122 on Windows 11, PDF size: 45MB',
    tags: ['pdf-render', 'performance', 'caching', 'flip-animation'],
    author: {
      name: 'Elena Rostova',
      username: 'elena_r',
      email: 'elena.design@example.com',
      avatarColor: '#ec5137',
      role: 'Pro Publisher'
    },
    createdAt: '2 hours ago',
    votes: 18,
    upvotedBy: ['user1', 'user2'],
    downvotedBy: [],
    views: 142,
    hasAcceptedSolution: true,
    comments: [
      {
        id: 'c-1',
        author: {
          name: 'Alex Turner',
          username: 'alex_fisto',
          email: 'alex@fisto.io',
          avatarColor: '#2563eb',
          role: 'Flipibook Core Team'
        },
        createdAt: '1 hour ago',
        content: 'Great catch Elena! In the latest update, we added inkscape vector downsampling on upload. If your PDF has complex vector paths, enabling "Optimize for Web Preview" in the upload modal creates a lightweight SVG preview page instantly while keeping crisp print resolution in editor mode.',
        isAcceptedAnswer: true,
        votes: 9,
        upvotedBy: ['elena_r'],
        downvotedBy: []
      },
      {
        id: 'c-2',
        author: {
          name: 'Elena Rostova',
          username: 'elena_r',
          email: 'elena.design@example.com',
          avatarColor: '#ec5137',
          role: 'Pro Publisher'
        },
        createdAt: '35 mins ago',
        content: 'Verified that! Enabling that option brought the initial load time down to 1.8 seconds. Thank you!',
        isAcceptedAnswer: false,
        votes: 3,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  },
  {
    id: 'post-2',
    moduleId: 'my-flipbooks',
    moduleName: 'My Flipbooks',
    category: 'question',
    status: 'open',
    title: 'Can we configure password protected share links with an expiration timestamp?',
    description: 'In the Share modal, I see options for Public, Password, and Invite. Is it possible to configure an automatic expiration time (e.g. 7 days or 30 days) for client proofing flipbooks so the links self-terminate?',
    stepsToReproduce: '1. Open My Flipbooks.\n2. Click Share on any published book.\n3. Check Password Protect settings for expiry duration.',
    environment: 'All desktop browsers',
    tags: ['security', 'password-protect', 'share-links', 'shelf'],
    author: {
      name: 'Rachel Zane',
      username: 'rachel_z',
      email: 'rachel@lawfirm.co',
      avatarColor: '#2563eb',
      role: 'Business'
    },
    createdAt: '3 days ago',
    votes: 12,
    upvotedBy: [],
    downvotedBy: [],
    views: 130,
    hasAcceptedSolution: false,
    comments: []
  },
  {
    id: 'post-3',
    moduleId: 'template-editor',
    moduleName: 'Template Editor',
    category: 'feature',
    status: 'in_progress',
    title: 'Multi-object alignment guides and magnetic distribution horizontally/vertically',
    description: 'When arranging multiple images and text frames in the Template Editor canvas, smart magnetic snapping guides (similar to Figma/Canva) for equal spacing would drastically speed up page design workflows.',
    stepsToReproduce: '1. Add 3 rectangle shapes or images to canvas.\n2. Drag them side-by-side.\n3. Currently no distance measurement pill or equal spacing snap appears.',
    environment: 'All browsers, Canvas Konva / Fabric',
    tags: ['canvas', 'alignment', 'smart-guides', 'ux-enhancement'],
    author: {
      name: 'Sophia Martinez',
      username: 'sophia_m',
      email: 'sophia@creativehub.io',
      avatarColor: '#db2777',
      role: 'Designer'
    },
    createdAt: 'Yesterday',
    votes: 27,
    upvotedBy: ['user1'],
    downvotedBy: [],
    views: 210,
    hasAcceptedSolution: false,
    comments: [
      {
        id: 'c-3',
        author: {
          name: 'Sarah Connor',
          username: 'sarah_c',
          email: 'sarah@flipibook.com',
          avatarColor: '#d97706',
          role: 'Flipibook Designer'
        },
        createdAt: '18 hours ago',
        content: 'This is on our active sprint! We are currently fine-tuning Konva snap threshold distances so alignment indicators display smoothly without jitter.',
        isAcceptedAnswer: false,
        votes: 11,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  },
  {
    id: 'post-4',
    moduleId: 'customised-editor',
    moduleName: 'Customised Editor',
    category: 'question',
    status: 'resolved',
    title: 'How to configure background audio to play only upon user turning first page?',
    description: 'I added background ambiance audio in Customised Editor > Other Setup > Audio. However, mobile browsers block autoplay before user interaction. Can we set the trigger to initiate on first drag/flip instead of immediately when the book opens?',
    stepsToReproduce: '1. Set audio in Customised Editor.\n2. Open shared flipbook in Incognito or Mobile Safari.\n3. Audio is muted or blocked by browser media autoplay policy.',
    environment: 'Chrome / Safari Mobile iOS',
    tags: ['audio', 'autoplay-policy', 'branding', 'user-interaction'],
    author: {
      name: 'David Kim',
      username: 'david_k',
      email: 'david@storyforge.com',
      avatarColor: '#8b5cf6',
      role: 'Author'
    },
    createdAt: '2 days ago',
    votes: 9,
    upvotedBy: [],
    downvotedBy: [],
    views: 115,
    hasAcceptedSolution: true,
    comments: [
      {
        id: 'c-4',
        author: {
          name: 'Liam Vance',
          username: 'liam_v',
          email: 'liam@fisto.io',
          avatarColor: '#0891b2',
          role: 'Core Dev'
        },
        createdAt: '1 day ago',
        content: 'Hi David! Yes, in Customised Editor -> Other Setup -> Background Music, check the option "Play on First Interaction". This attaches the audio context resume to the first page click/touch event, complying 100% with browser autoplay policies.',
        isAcceptedAnswer: true,
        votes: 8,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  },
  {
    id: 'post-5',
    moduleId: '3d-editor',
    moduleName: '3D Editor',
    category: 'bug',
    status: 'in_progress',
    title: 'GLTF model material roughness texture appears fully metallic after import',
    description: 'Importing custom .glb models with PBR materials exported from Blender causes metallicness to lock at 1.0 in the Rapier viewport unless manually edited in the materials inspector tree. Does the importer invert the roughness/metalness channels in the ORM map?',
    stepsToReproduce: '1. Open 3D Editor > Add Model.\n2. Upload custom .glb with standard PBR textures.\n3. Notice the object reflects environment map at 100% gloss.',
    environment: 'Firefox 124, Three.js 0.182, Rapier3D',
    tags: ['gltf', 'pbr-materials', 'blender', 'roughness'],
    author: {
      name: 'Marcus Chen',
      username: 'marcus_3d',
      email: 'marcus.3d@studios.com',
      avatarColor: '#059669',
      role: '3D Artist'
    },
    createdAt: '4 hours ago',
    votes: 14,
    upvotedBy: [],
    downvotedBy: [],
    views: 89,
    hasAcceptedSolution: false,
    comments: [
      {
        id: 'c-5',
        author: {
          name: 'Dev_Naveen',
          username: 'naveen_d',
          email: 'naveen@fisto.io',
          avatarColor: '#7c3aed',
          role: '3D Engine Dev'
        },
        createdAt: '2 hours ago',
        content: 'We identified that Three.js glTF loader expects occlusion/roughness/metallic packed in G and B channels respectively. Blender 4.2 changed default channel packing in certain glTF export presets. We are pushing a patch today that auto-detects and unwraps separate roughness maps.',
        isAcceptedAnswer: false,
        votes: 7,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  },
  {
    id: 'post-6',
    moduleId: '3d-editor',
    moduleName: '3D Editor',
    category: 'performance',
    status: 'resolved',
    title: 'AR View camera button shows "WebXR not supported" on iOS Safari',
    description: 'When clicking AR View on iPhone Safari, I receive a notification that WebXR is unavailable. Is USDZ QuickLook export supported as fallback for iOS devices?',
    stepsToReproduce: '1. Open 3D Editor on iOS Safari or scan QR code on desktop.\n2. Click "View in AR".\n3. Notification pops up.',
    environment: 'iOS 17.4 Safari iPhone 15 Pro',
    tags: ['ar-view', 'webxr', 'quicklook', 'usdz', 'mobile'],
    author: {
      name: 'Aiden Brooks',
      username: 'aiden_b',
      email: 'aiden@spatial.design',
      avatarColor: '#059669',
      role: 'Creator'
    },
    createdAt: '4 days ago',
    votes: 21,
    upvotedBy: [],
    downvotedBy: [],
    views: 188,
    hasAcceptedSolution: true,
    comments: [
      {
        id: 'c-6',
        author: {
          name: 'Dev_Naveen',
          username: 'naveen_d',
          email: 'naveen@fisto.io',
          avatarColor: '#7c3aed',
          role: '3D Engine Dev'
        },
        createdAt: '3 days ago',
        content: 'For iOS devices, Apple does not support standard WebXR in Safari. We automatically convert GLTF models to USDZ behind the scenes when you use the "AR View" QR code. Ensure your model file size is under 25MB for iOS QuickLook seamless streaming.',
        isAcceptedAnswer: true,
        votes: 15,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  },
  {
    id: 'post-7',
    moduleId: 'general',
    moduleName: 'Account & Workspace',
    category: 'question',
    status: 'resolved',
    title: 'How to increase monthly book hosting quota and add custom domain CNAME?',
    description: 'We are publishing a catalog of 200 flipbooks for our spring launch and need custom CNAME mapping (e.g. read.ourbrand.com). Where can this be configured?',
    stepsToReproduce: '1. Go to Settings > Advanced.\n2. Look for Custom Domain input.\n3. Request verification records.',
    environment: 'All browsers',
    tags: ['cname', 'custom-domain', 'quota', 'workspace'],
    author: {
      name: 'Thomas Wright',
      username: 'thomas_w',
      email: 'thomas@retailcorp.com',
      avatarColor: '#d97706',
      role: 'Enterprise'
    },
    createdAt: '5 days ago',
    votes: 8,
    upvotedBy: [],
    downvotedBy: [],
    views: 94,
    hasAcceptedSolution: true,
    comments: [
      {
        id: 'c-7',
        author: {
          name: 'Sarah Connor',
          username: 'sarah_c',
          email: 'sarah@flipibook.com',
          avatarColor: '#d97706',
          role: 'Designer'
        },
        createdAt: '4 days ago',
        content: 'Custom domains are available on Pro and Enterprise tiers! In Settings > Integrations & Domains, enter your domain and add the provided CNAME record pointing to proxy.flipibook.com. SSL auto-provisions within 15 minutes.',
        isAcceptedAnswer: true,
        votes: 6,
        upvotedBy: [],
        downvotedBy: []
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'flipibook_forum_posts_v3';

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
