// Backend/forum/forumRoutes.js
import express from 'express';
import {
  getForumPosts,
  getPostById,
  createForumPost,
  toggleSameQuestion,
  addUserComment,
  addAuthorFollowUp,
  addAdminReply,
  addAdminFollowUpReply,
  updatePostStatus,
  deleteForumPost,
  seedInitialForumPosts
} from './forumController.js';

const router = express.Router();

/**
 * Public & Community Discussion Endpoints
 */
// GET /api/forum - List all discussions with filtering, search & sorting
router.get('/', getForumPosts);

// POST /api/forum/seed - Seed sample discussions if collection empty
router.post('/seed', seedInitialForumPosts);

// GET /api/forum/:id - Get full discussion details by ID & increment view count
router.get('/:id', getPostById);

// POST /api/forum - Create a new question or suggestion
router.post('/', createForumPost);

// POST /api/forum/:id/vote - Toggle "I have this question too"
router.post('/:id/vote', toggleSameQuestion);

// POST /api/forum/:id/comments - Add community user comment
router.post('/:id/comments', addUserComment);

// POST /api/forum/:id/follow-up - Add author follow-up question
router.post('/:id/follow-up', addAuthorFollowUp);

/**
 * Admin & Official Reply Endpoints
 */
// POST /api/forum/:id/admin-reply - Post official admin reply and update status
router.post('/:id/admin-reply', addAdminReply);

// POST /api/forum/:id/follow-up/:followUpId/admin-reply - Reply directly to author follow-up
router.post('/:id/follow-up/:followUpId/admin-reply', addAdminFollowUpReply);

// PATCH /api/forum/:id/status - Update post status (e.g. under_review, planned, implemented)
router.patch('/:id/status', updatePostStatus);

// DELETE /api/forum/:id - Delete a discussion post
router.delete('/:id', deleteForumPost);

export default router;
