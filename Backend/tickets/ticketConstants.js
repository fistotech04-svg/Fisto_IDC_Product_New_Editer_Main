// Backend/tickets/ticketConstants.js

export const TICKET_MODULES = [
  { id: 'all', name: 'All Tickets' },
  { id: 'my-flipbooks', name: 'My Flipbooks' },
  { id: 'template-editor', name: 'Template Editor' },
  { id: 'customised-editor', name: 'Customised Editor' },
  { id: '3d-editor', name: '3D Editor' },
  { id: 'billing-account', name: 'Billing & Account' },
  { id: 'others', name: 'Others' }
];

export const TICKET_STATUSES = ['open', 'closed'];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
