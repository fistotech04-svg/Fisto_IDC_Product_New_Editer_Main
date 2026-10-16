// Backend/tickets/ticketController.js
import Ticket from './ticketModel.js';
import User from '../models/auth.js';
import { uploadBufferToSupabase } from '../config/supabase.js';

/**
 * Helper to upload base64 or buffer attachments to Supabase Storage bucket.
 * Returns the public URL, ensuring MongoDB stores only lightweight URLs.
 */
async function processAttachmentsForSupabase(attachments = [], folderPrefix = 'ticket_attachments') {
  if (!Array.isArray(attachments) || attachments.length === 0) return [];

  const processed = [];
  for (const att of attachments) {
    if (!att || !att.url) {
      processed.push(att);
      continue;
    }

    // If it's already a hosted URL (http / https) and not base64, keep it
    if (att.url.startsWith('http://') || att.url.startsWith('https://')) {
      processed.push(att);
      continue;
    }

    // Check if it's a data URL: data:image/png;base64,...
    const matches = att.url.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      try {
        const mimeType = matches[1] || 'image/jpeg';
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const cleanName = (att.name || `image_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
        const destinationPath = `tickets/${folderPrefix}/${fileName}`;

        const publicUrl = await uploadBufferToSupabase(buffer, destinationPath, mimeType);
        if (publicUrl) {
          processed.push({
            name: att.name || cleanName,
            url: publicUrl,
            size: att.size || buffer.length,
            type: mimeType,
            width: att.width,
            height: att.height
          });
          continue;
        }
      } catch (err) {
        console.error('[Supabase Ticket Upload Error]:', err);
      }
    }

    // Fallback if upload fails or is not base64
    processed.push(att);
  }

  return processed;
}

/**
 * GET /api/tickets
 * Query params:
 *   - status: 'open' | 'closed' | 'all'
 *   - category: moduleId | 'all'
 *   - search: string
 *   - email: requester email (scopes to user's tickets)
 *   - page: number (default 1)
 *   - limit: number (default 8)
 */
export const getTickets = async (req, res) => {
  try {
    const {
      status = 'all',
      category = 'all',
      search = '',
      email,
      isAdmin,
      page = 1,
      limit = 8
    } = req.query;

    const query = { isDeleted: false };

    // Check if admin from header, query param, or user email/role
    const headerEmail = req.headers['x-user-email'];
    const effectiveEmail = (email || headerEmail || '').toLowerCase().trim();
    let isAdminUser = String(isAdmin) === 'true' || req.headers['x-is-admin'] === 'true';

    // Verify admin role against email pattern or database ONLY if not already flagged as admin
    if (!isAdminUser && effectiveEmail) {
      if (effectiveEmail.includes('admin') || effectiveEmail.includes('fisto') || effectiveEmail.includes('sham')) {
        isAdminUser = true;
      } else {
        const userDoc = await User.findOne({ emailId: effectiveEmail }).select('role').lean();
        if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'staff')) {
          isAdminUser = true;
        }
      }
    }

    // If NOT admin, scope only to this user's tickets
    if (!isAdminUser && effectiveEmail) {
      query['requester.email'] = effectiveEmail;
    }

    // Status filter (only 'open' or 'closed')
    if (status === 'open') {
      query.status = 'open';
    } else if (status === 'closed') {
      query.status = 'closed';
    }

    // Category / Module filter
    if (category && category !== 'all') {
      query.moduleId = category;
    }

    // Search query matches subject, id, description, or requester name/email
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { id: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'requester.name': { $regex: q, $options: 'i' } },
        { 'requester.email': { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 8));
    const skip = (pageNum - 1) * limitNum;

    // Build base filter for count scoping
    const countScope = { isDeleted: false };
    if (!isAdminUser && effectiveEmail) {
      countScope['requester.email'] = effectiveEmail.toLowerCase().trim();
    }

    // Fetch tickets and counts
    const [tickets, totalCount, openCount, closedCount] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(countScope),
      Ticket.countDocuments({ ...countScope, status: 'open' }),
      Ticket.countDocuments({ ...countScope, status: 'closed' })
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1
      },
      counts: {
        total: totalCount,
        open: openCount,
        closed: closedCount
      }
    });
  } catch (error) {
    console.error('[getTickets Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve tickets', error: error.message });
  }
};

/**
 * GET /api/tickets/:id
 */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      isDeleted: false
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('[getTicketById Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve ticket', error: error.message });
  }
};

/**
 * POST /api/tickets
 * Create a new support ticket
 */
export const createTicket = async (req, res) => {
  try {
    const {
      subject,
      moduleId,
      moduleName,
      department,
      description,
      priority = 'medium',
      requester,
      ccRecipients = [],
      attachments = []
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    // Process attachments to Supabase storage bucket so MongoDB only holds lightweight URLs
    const uploadedAttachments = await processAttachmentsForSupabase(attachments, 'initial');

    const newTicket = new Ticket({
      subject: subject.trim(),
      moduleId: moduleId || 'others',
      moduleName: moduleName || department || 'General',
      department: department || moduleName || 'Support',
      priority,
      status: 'open',
      requester: {
        name: requester?.name || 'Support User',
        email: requester?.email || 'user@example.com',
        role: requester?.role || 'User',
        avatarColor: requester?.avatarColor || '#ec5137'
      },
      ccRecipients: Array.isArray(ccRecipients) ? ccRecipients : [],
      description: description.trim(),
      attachments: uploadedAttachments,
      messages: [
        {
          sender: 'user',
          authorName: requester?.name || 'Support User',
          authorEmail: requester?.email || 'user@example.com',
          content: description.trim(),
          attachments: uploadedAttachments,
          createdAt: new Date()
        }
      ]
    });

    const savedTicket = await newTicket.save();
    res.status(201).json({ success: true, data: savedTicket, message: 'Ticket raised successfully' });
  } catch (error) {
    console.error('[createTicket Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to raise ticket', error: error.message });
  }
};

/**
 * PATCH /api/tickets/:id/status
 * Update status ('open' or 'closed')
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either "open" or "closed"' });
    }

    const ticket = await Ticket.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      isDeleted: false
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, data: ticket, message: `Ticket status updated to ${status}` });
  } catch (error) {
    console.error('[updateTicketStatus Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket status', error: error.message });
  }
};

/**
 * POST /api/tickets/:id/messages
 * Add a message/reply to conversation
 */
export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, sender = 'user', authorName, authorEmail, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const ticket = await Ticket.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      isDeleted: false
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Process reply attachments to Supabase storage bucket
    const uploadedAttachments = await processAttachmentsForSupabase(attachments, 'replies');

    const newMessage = {
      sender,
      authorName: authorName || (sender === 'user' ? ticket.requester?.name : 'Support Agent'),
      authorEmail: authorEmail || ticket.requester?.email,
      content: content.trim(),
      attachments: uploadedAttachments,
      createdAt: new Date()
    };

    ticket.messages.push(newMessage);
    await ticket.save();

    res.status(201).json({ success: true, data: ticket, message: 'Reply posted successfully' });
  } catch (error) {
    console.error('[addTicketMessage Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to post message', error: error.message });
  }
};

/**
 * DELETE /api/tickets/:id
 * Withdraw/Cancel ticket (only allowed before admin/staff has replied)
 */
export const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      isDeleted: false
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if staff has already replied
    const hasAdminReplied = ticket.messages.some(m => m.sender === 'agent' || m.sender === 'staff' || m.sender === 'admin');
    if (hasAdminReplied) {
      return res.status(403).json({
        success: false,
        message: 'Cannot withdraw ticket after support team has replied. You may close the ticket instead.'
      });
    }

    ticket.isDeleted = true;
    await ticket.save();

    res.json({ success: true, message: `Ticket #${ticket.id} withdrawn successfully` });
  } catch (error) {
    console.error('[cancelTicket Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel ticket', error: error.message });
  }
};
