// Backend/tickets/ticketModel.js
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

/**
 * Sub-schema for Requester / User information
 */
const RequesterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, index: true },
  role: { type: String, default: 'User' },
  avatarColor: { type: String, default: '#ec5137' }
}, { _id: false });

/**
 * Sub-schema for image/file attachments
 */
const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, default: 0 },
  type: { type: String, default: 'image/jpeg' }
}, { _id: false });

/**
 * Sub-schema for ticket conversation messages
 */
const MessageSchema = new mongoose.Schema({
  id: { type: String, default: () => `msg-${nanoid(8)}` },
  sender: { 
    type: String, 
    enum: ['user', 'agent', 'staff', 'admin'], 
    default: 'user' 
  },
  authorName: { type: String, required: true, trim: true },
  authorEmail: { type: String, trim: true },
  content: { type: String, required: true, trim: true },
  attachments: [AttachmentSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Primary Support Ticket Schema
 */
const ticketSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    index: true,
    default: () => `TICK-${Math.floor(1000 + Math.random() * 9000)}`
  },
  subject: {
    type: String,
    required: [true, 'Ticket subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  moduleId: {
    type: String,
    required: [true, 'Module/Department selection is required'],
    index: true,
    default: 'others'
  },
  moduleName: {
    type: String,
    default: 'General'
  },
  department: {
    type: String,
    default: 'Support'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  requester: {
    type: RequesterSchema,
    required: true
  },
  ccRecipients: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    trim: true
  },
  attachments: [AttachmentSchema],
  messages: [MessageSchema],
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for high-speed ticket queries, counts, and sorting
ticketSchema.index({ isDeleted: 1, createdAt: -1 });
ticketSchema.index({ isDeleted: 1, 'requester.email': 1, createdAt: -1 });
ticketSchema.index({ isDeleted: 1, status: 1 });
ticketSchema.index({ isDeleted: 1, 'requester.email': 1, status: 1 });
ticketSchema.index({ isDeleted: 1, moduleId: 1 });

// Helper virtual for whether admin/staff has replied
ticketSchema.virtual('hasAdminReplied').get(function () {
  if (!this.messages || this.messages.length === 0) return false;
  return this.messages.some(m => m.sender === 'agent' || m.sender === 'staff' || m.sender === 'admin');
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket = mongoose.model('SupportTicket', ticketSchema);
export default Ticket;
