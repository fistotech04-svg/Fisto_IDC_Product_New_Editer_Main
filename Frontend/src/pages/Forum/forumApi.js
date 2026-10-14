// Frontend/src/pages/Forum/forumApi.js

export const getBackendUrl = () => {
  const envUrl = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/+$/, '');
  // If running on same domain or through vite proxy, relative '' works best
  if (!envUrl || envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000')) {
    return '';
  }
  return envUrl;
};

const getAuthHeaders = () => {
  try {
    const raw = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      const email = user.email || user.emailId || '';
      return {
        'Content-Type': 'application/json',
        'x-user-email': email
      };
    }
  } catch (e) {}
  return { 'Content-Type': 'application/json' };
};

/**
 * Fetch all discussions with query filters
 */
export const fetchForumPosts = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.area) query.append('area', params.area);
  if (params.moduleId && params.moduleId !== 'all') query.append('moduleId', params.moduleId);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.postType && params.postType !== 'all') query.append('postType', params.postType);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.userEmail) query.append('userEmail', params.userEmail);

  const res = await fetch(`${getBackendUrl()}/api/forum?${query.toString()}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch discussions');
  return data;
};

/**
 * Fetch a single discussion by ID
 */
export const fetchPostById = async (id) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${id}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch discussion post');
  return data.post;
};

/**
 * Create a new discussion post
 */
export const createPostApi = async (postData) => {
  const res = await fetch(`${getBackendUrl()}/api/forum`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(postData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create discussion');
  return data.post;
};

/**
 * Toggle "I have this question too" vote
 */
export const toggleVoteApi = async (postId, user) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/vote`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle vote');
  return data;
};

/**
 * Add community user comment
 */
export const addCommentApi = async (postId, { content, author }) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, author })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to post comment');
  return data;
};

/**
 * Add author follow-up question
 */
export const addFollowUpApi = async (postId, { question, author }) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/follow-up`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question, author })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit follow-up');
  return data;
};

/**
 * Submit official admin reply & update status
 */
export const addAdminReplyApi = async (postId, { content, status, author }) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/admin-reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, status, author })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to publish official reply');
  return data;
};

/**
 * Reply directly to author follow-up (Admin)
 */
export const replyToFollowUpApi = async (postId, followUpId, { content, author }) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/follow-up/${followUpId}/admin-reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, author })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit reply to follow-up');
  return data;
};

/**
 * Update post lifecycle status (Admin)
 */
export const updateStatusApi = async (postId, status, userEmail) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, userEmail })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update status');
  return data;
};

/**
 * Delete a post (Admin or Author)
 */
export const deletePostApi = async (postId, userEmail) => {
  const res = await fetch(`${getBackendUrl()}/api/forum/${postId}?userEmail=${encodeURIComponent(userEmail || '')}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete post');
  return data;
};
