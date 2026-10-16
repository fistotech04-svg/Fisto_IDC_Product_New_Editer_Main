import { nanoid } from 'nanoid';
import Flipbook from '../models/Flipbook.js';
import Lead from './leadModel.js';

export const getClientIp = (req) => {
  let rawIp = req.body?.viewerIp ||
              req.headers['cf-connecting-ip'] ||
              req.headers['x-client-ip'] ||
              req.headers['x-real-ip'] ||
              req.headers['x-forwarded-for'] ||
              req.ip ||
              req.socket?.remoteAddress ||
              req.connection?.remoteAddress ||
              '';

  if (typeof rawIp === 'string' && rawIp) {
    if (rawIp.includes(',')) {
      rawIp = rawIp.split(',')[0].trim();
    }
    if (rawIp.startsWith('::ffff:')) {
      rawIp = rawIp.replace('::ffff:', '');
    }
    if (rawIp === '::1') {
      rawIp = '127.0.0.1';
    }
  }
  return rawIp || '';
};

// @route   POST /api/flipbook/submit-lead or /api/lead-form/submit-lead
// @desc    Collect a lead submitted by a viewer
export const submitLead = async (req, res) => {
  try {
    const { v_id, shareId, flipbookName, userEmail, leadData } = req.body;
    if (!leadData || typeof leadData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid leadData' });
    }

    let flipbook = null;
    if (v_id && v_id !== 'preview') {
      flipbook = await Flipbook.findOne({ v_id });
    }

    if (!flipbook && shareId) {
      flipbook = await Flipbook.findOne({
        $or: [
          { 'Customized_Settings.Visibility.shareId': shareId },
          { 'share.shareId': shareId }
        ]
      });
    }

    if (!flipbook && flipbookName && userEmail) {
      flipbook = await Flipbook.findOne({ userEmail, flipbookName });
    }

    const effectiveVId = (flipbook ? flipbook.v_id : null) || (v_id && v_id !== 'preview' ? v_id : null) || 'preview';
    const effectiveShareId = shareId || flipbook?.Customized_Settings?.Visibility?.shareId || flipbook?.share?.shareId || '';
    const effectiveBookName = flipbook?.flipbookName || flipbookName || 'Flipbook';
    const effectiveUserEmail = flipbook?.userEmail || userEmail || '';
    const detectedViewerIp = getClientIp(req);

    const newLead = new Lead({
      leadId: nanoid(12),
      v_id: effectiveVId,
      shareId: effectiveShareId,
      flipbookName: effectiveBookName,
      userEmail: effectiveUserEmail,
      leadData: leadData,
      viewerIp: detectedViewerIp
    });

    await newLead.save();

    if (flipbook) {
      flipbook.collectedLeads = flipbook.collectedLeads || [];
      flipbook.collectedLeads.push({
        leadId: newLead.leadId,
        submittedAt: newLead.submittedAt,
        data: leadData,
        viewerIp: newLead.viewerIp
      });
      await flipbook.save().catch(err => console.warn("Flipbook lead push warning:", err));
    }

    return res.json({ success: true, message: 'Lead submitted successfully', leadId: newLead.leadId });
  } catch (err) {
    console.error('Error submitting lead:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

// @route   GET /api/flipbook/get-leads or /api/lead-form/get-leads
// @desc    Get all collected leads for a flipbook
export const getLeads = async (req, res) => {
  try {
    const { v_id, emailId, bookName } = req.query;
    let effectiveVId = v_id;
    if (!effectiveVId && emailId && bookName) {
      const doc = await Flipbook.findOne({ userEmail: emailId, flipbookName: bookName }).select('v_id');
      if (doc) effectiveVId = doc.v_id;
    }

    if (!effectiveVId && !emailId) {
      return res.status(400).json({ success: false, message: 'Missing v_id or emailId' });
    }

    let filter = {};
    if (effectiveVId) filter.v_id = effectiveVId;
    else if (emailId) filter.userEmail = emailId;

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      v_id: effectiveVId || null,
      leads: leads
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
