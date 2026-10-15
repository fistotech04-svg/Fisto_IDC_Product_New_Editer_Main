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
  },
  {
    id: 'others',
    name: 'Others',
    shortName: 'Others',
    icon: 'HelpCircle',
    color: '#64748b'
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
  { id: 'open', label: 'Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { id: 'closed', label: 'Closed', color: 'bg-stone-100 text-stone-600 border-stone-200', dot: 'bg-stone-400' }
];

export const INITIAL_TICKETS = [];

const LOCAL_STORAGE_KEY = 'flipibook_support_tickets_v4';

export const getStoredTickets = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(t => ({
          ...t,
          status: (t.status === 'closed' || t.status === 'resolved') ? 'closed' : 'open'
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load tickets from storage:', e);
  }
  return [];
};

export const saveStoredTickets = (tickets) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets || []));
  } catch (e) {
    console.warn('Failed to save tickets:', e);
  }
};

