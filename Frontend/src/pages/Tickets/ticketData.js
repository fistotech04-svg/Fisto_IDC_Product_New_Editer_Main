// Frontend/src/pages/Tickets/ticketData.js

export const TICKET_MODULES = [
  {
    id: 'all',
    name: 'All Tickets',
    shortName: 'All',
    icon: 'Layers',
    color: '#6366f1'
  },
  {
    id: 'my-flipbooks',
    name: 'My Flipbooks',
    shortName: 'Flipbooks',
    icon: 'BookOpen',
    color: '#ec5137'
  },
  {
    id: 'template-editor',
    name: 'Template Editor',
    shortName: 'Template Editor',
    icon: 'PenTool',
    color: '#2563eb'
  },
  {
    id: 'customised-editor',
    name: 'Customised Editor',
    shortName: 'Custom Editor',
    icon: 'SlidersHorizontal',
    color: '#7c3aed'
  },
  {
    id: '3d-editor',
    name: '3D Editor',
    shortName: '3D Editor',
    icon: 'Box',
    color: '#059669'
  },
  {
    id: 'billing-account',
    name: 'Billing & Account',
    shortName: 'Billing',
    icon: 'CreditCard',
    color: '#d97706'
  }
];

export const TICKET_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'high', label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' }
];

export const TICKET_STATUSES = [
  { id: 'all', label: 'All Status' },
  { id: 'open', label: 'Open', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { id: 'resolved', label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { id: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
];

export const INITIAL_TICKETS = [
  {
    id: 'TICK-1082',
    subject: 'PDF conversion timeout error on large catalog file (75MB)',
    moduleId: 'my-flipbooks',
    moduleName: 'My Flipbooks',
    priority: 'high',
    status: 'in_progress',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.design@example.com',
      avatarColor: '#ec5137'
    },
    assignedTo: {
      name: 'Alex Turner',
      role: 'Senior Support Engineer',
      avatarColor: '#2563eb'
    },
    createdAt: 'Today at 09:15 AM',
    updatedAt: '20 mins ago',
    description: 'When uploading our spring catalog PDF (75MB, 120 pages), the server returns "504 Gateway Timeout" after ~90 seconds. We need this live before the product launch tomorrow.',
    attachments: ['catalog_spring_2026_preview.pdf'],
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        authorName: 'Elena Rostova',
        timestamp: 'Today at 09:15 AM',
        content: 'When uploading our spring catalog PDF (75MB, 120 pages), the server returns "504 Gateway Timeout" after ~90 seconds. We need this live before the product launch tomorrow.'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        authorName: 'Alex Turner (Support Engineer)',
        timestamp: 'Today at 09:40 AM',
        content: 'Hi Elena, thanks for reaching out. We have temporarily increased the Nginx server timeout limit for your account and enabled asynchronous background vector extraction. Please re-try the upload and let us know if it completes.'
      }
    ]
  },
  {
    id: 'TICK-1075',
    subject: 'GLTF model material texture appearing black in 3D Editor viewport',
    moduleId: '3d-editor',
    moduleName: '3D Editor',
    priority: 'urgent',
    status: 'open',
    requester: {
      name: 'Marcus Chen',
      email: 'marcus.3d@studios.com',
      avatarColor: '#059669'
    },
    assignedTo: {
      name: 'Dev Naveen',
      role: '3D Graphics Support',
      avatarColor: '#7c3aed'
    },
    createdAt: 'Yesterday at 04:30 PM',
    updatedAt: 'Yesterday at 04:30 PM',
    description: 'Importing our custom model exported from Blender 4.2 causes all PBR base color textures to appear pitch black in the Rapier viewport. Embedded textures exist in the file.',
    attachments: ['mech_arm_textured.glb'],
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        authorName: 'Marcus Chen',
        timestamp: 'Yesterday at 04:30 PM',
        content: 'Importing our custom model exported from Blender 4.2 causes all PBR base color textures to appear pitch black in the Rapier viewport. Embedded textures exist in the file.'
      }
    ]
  },
  {
    id: 'TICK-1064',
    subject: 'Request invoice copy with Tax ID for Annual Pro Subscription',
    moduleId: 'billing-account',
    moduleName: 'Billing & Account',
    priority: 'low',
    status: 'resolved',
    requester: {
      name: 'Rachel Zane',
      email: 'rachel@lawfirm.co',
      avatarColor: '#2563eb'
    },
    assignedTo: {
      name: 'Finance Team',
      role: 'Billing Operations',
      avatarColor: '#d97706'
    },
    createdAt: '3 days ago',
    updatedAt: '2 days ago',
    description: 'We renewed our annual Pro subscription yesterday. Please send an updated invoice PDF with our European VAT ID included for accounting reconciliation.',
    attachments: ['receipt_oct2026.pdf'],
    messages: [
      {
        id: 'msg-4',
        sender: 'user',
        authorName: 'Rachel Zane',
        timestamp: '3 days ago',
        content: 'We renewed our annual Pro subscription yesterday. Please send an updated invoice PDF with our European VAT ID included for accounting reconciliation.'
      },
      {
        id: 'msg-5',
        sender: 'agent',
        authorName: 'Finance Support',
        timestamp: '2 days ago',
        content: 'Hello Rachel, we have updated your billing profile with your VAT number and generated the revised invoice. You can download the PDF directly from Settings > Billing or find it attached in your inbox.'
      }
    ]
  },
  {
    id: 'TICK-1051',
    subject: 'Audio autoplay toggle is not saving in Customised Editor',
    moduleId: 'customised-editor',
    moduleName: 'Customised Editor',
    priority: 'medium',
    status: 'resolved',
    requester: {
      name: 'David Kim',
      email: 'david@storyforge.com',
      avatarColor: '#8b5cf6'
    },
    assignedTo: {
      name: 'Liam Vance',
      role: 'Support Engineer',
      avatarColor: '#0891b2'
    },
    createdAt: '5 days ago',
    updatedAt: '4 days ago',
    description: 'When checking "Play background music on first interaction" and hitting Save, upon reloading the page the switch reverts to off.',
    attachments: [],
    messages: [
      {
        id: 'msg-6',
        sender: 'user',
        authorName: 'David Kim',
        timestamp: '5 days ago',
        content: 'When checking "Play background music on first interaction" and hitting Save, upon reloading the page the switch reverts to off.'
      },
      {
        id: 'msg-7',
        sender: 'agent',
        authorName: 'Liam Vance',
        timestamp: '4 days ago',
        content: 'Hi David! This was a state sync issue in the appearance settings cache. We deployed a fix in patch v1.4.2. Please refresh your browser cache (Ctrl+Shift+R) and test saving once more.'
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'flipibook_support_tickets_v1';

export const getStoredTickets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load tickets from storage:', e);
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
  } catch (e) {}
  return INITIAL_TICKETS;
};

export const saveStoredTickets = (tickets) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Failed to save tickets:', e);
  }
};
