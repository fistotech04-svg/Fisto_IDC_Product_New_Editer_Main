// Backend/forum/forumModel.js
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

/**
 * Sub-schema for Author details
 */
const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, index: true },
  initials: { type: String, default: '' },
  avatarColor: { type: String, default: '#ec5137' },
  role: { type: String, default: 'User' },
  isAdmin: { type: Boolean, default: false }
}, { _id: false });

/**
 * Sub-schema for Official Admin Replies
 */
const AdminReplySchema = new mongoose.Schema({
  id: { type: String, default: () => `admin-rep-${nanoid(8)}` },
  author: { type: AuthorSchema, required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Sub-schema for Author Follow-ups
 */
const AuthorFollowUpSchema = new mongoose.Schema({
  id: { type: String, default: () => `fu-${nanoid(8)}` },
  author: { type: AuthorSchema, required: true },
  question: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  adminReply: {
    id: { type: String },
    author: { type: AuthorSchema },
    content: { type: String, trim: true },
    createdAt: { type: Date }
  }
}, { _id: false });

/**
 * Sub-schema for Community Comments
 */
const CommentSchema = new mongoose.Schema({
  id: { type: String, default: () => `c-${nanoid(8)}` },
  author: { type: AuthorSchema, required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  isAuthorFollowUp: { type: Boolean, default: false }
}, { _id: false });

/**
 * Primary Forum Post Schema
 */
const forumPostSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `post-${nanoid(10)}`,
    unique: true,
    index: true
  },
  moduleId: {
    type: String,
    required: true,
    index: true,
    enum: [
      'my-flipbooks',
      'page-editor',
      'customised-editor',
      '3d-editor',
      'converter',
      'account-workspace'
    ]
  },
  moduleName: {
    type: String,
    required: true
  },
  postType: {
    type: String,
    enum: ['question', 'suggestion'],
    default: 'question',
    index: true
  },
  status: {
    type: String,
    enum: [
      'awaiting_admin',
      'answered',
      'under_review',
      'planned',
      'implemented',
      'declined'
    ],
    default: function () {
      return this.postType === 'suggestion' ? 'under_review' : 'awaiting_admin';
    },
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: AuthorSchema,
    required: true
  },
  sameQuestionUsers: {
    type: [String], // Array of user emails or IDs
    default: []
  },
  followedBy: {
    type: [String], // Array of user emails or IDs
    default: []
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  adminReply: {
    type: AdminReplySchema,
    default: null
  },
  authorFollowUps: {
    type: [AuthorFollowUpSchema],
    default: []
  },
  comments: {
    type: [CommentSchema],
    default: []
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for high performance querying
forumPostSchema.index({ moduleId: 1, createdAt: -1 });
forumPostSchema.index({ 'author.email': 1, createdAt: -1 });
forumPostSchema.index({ status: 1, createdAt: -1 });
forumPostSchema.index({ postType: 1, createdAt: -1 });
forumPostSchema.index({ title: 'text', description: 'text' });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

export default ForumPost;
