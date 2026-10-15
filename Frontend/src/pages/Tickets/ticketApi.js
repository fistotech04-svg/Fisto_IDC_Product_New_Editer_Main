// Frontend/src/pages/Tickets/ticketApi.js

export const getBackendUrl = () => {
  const envUrl = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (!envUrl || envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000')) {
    return '';
  }
  return envUrl;
};

const getAuthHeaders = () => {
  try {
    let authUser = {};
    let profileUser = {};
    try {
      const u = localStorage.getItem('user');
      if (u) authUser = JSON.parse(u);
    } catch (e) {}
    try {
      const p = localStorage.getItem('user_profile');
      if (p) profileUser = JSON.parse(p);
    } catch (e) {}

    const user = { ...authUser, ...profileUser };
    const email = (user.email || user.emailId || authUser.email || authUser.emailId || '').toLowerCase().trim();
    const role = (user.role || authUser.role || '').toLowerCase();
    const isAdmin = Boolean(
      user.isAdmin === true || 
      authUser.isAdmin === true ||
      role === 'admin' || 
      role === 'staff' ||
      email.includes('admin') ||
      email.includes('fisto') ||
      email.includes('sham') ||
      localStorage.getItem('admin_mode') === 'true'
    );
    return {
      'Content-Type': 'application/json',
      'x-user-email': email,
      'x-is-admin': isAdmin ? 'true' : 'false'
    };
  } catch (e) {}
  return { 'Content-Type': 'application/json' };
};

/**
 * Fetch tickets with search, filtering, and pagination
 */
export const fetchTickets = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.email) query.append('email', params.email);
  if (params.isAdmin) query.append('isAdmin', 'true');
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const res = await fetch(`${getBackendUrl()}/api/tickets?${query.toString()}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch tickets');
  return data;
};

/**
 * Get ticket details by ID
 */
export const fetchTicketById = async (id) => {
  const res = await fetch(`${getBackendUrl()}/api/tickets/${id}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch ticket');
  return data.data;
};

/**
 * Create/Raise a new ticket
 */
export const createTicketApi = async (ticketData) => {
  const res = await fetch(`${getBackendUrl()}/api/tickets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(ticketData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to raise ticket');
  return data.data;
};

/**
 * Update ticket status ('open' or 'closed')
 */
export const updateTicketStatusApi = async (ticketId, status) => {
  const res = await fetch(`${getBackendUrl()}/api/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update ticket status');
  return data.data;
};

/**
 * Post a reply message to ticket thread
 */
export const addTicketMessageApi = async (ticketId, messageData) => {
  const res = await fetch(`${getBackendUrl()}/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(messageData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to post reply');
  return data.data;
};

/**
 * Cancel/Withdraw a ticket
 */
export const cancelTicketApi = async (ticketId) => {
  const res = await fetch(`${getBackendUrl()}/api/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to cancel ticket');
  return data;
};
