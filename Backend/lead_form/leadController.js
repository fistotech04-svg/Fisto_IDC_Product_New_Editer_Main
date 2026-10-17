import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';
import Flipbook from '../models/Flipbook.js';
import Lead from './leadModel.js';

// Transporter helper using system Gmail credentials
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });
};

// Helper to escape HTML characters
const escapeHtml = (str) => {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Format lead data nicely into rows for emails, including rich product cards with images
const formatLeadDataRows = (leadData) => {
  if (!leadData || typeof leadData !== 'object') return '';
  return Object.entries(leadData).map(([key, val]) => {
    // Special rendering if value is an array of products
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      const productCardsHtml = val.map(item => {
        const name = escapeHtml(item.name || item.title || 'Product');
        const qty = item.quantity ? `Qty: ${item.quantity}` : 'Qty: 1';
        const category = item.category ? `<span style="display: block; font-size: 11px; color: #718096; margin-top: 2px;">Category: ${escapeHtml(item.category)}</span>` : '';
        const imgTag = item.image && typeof item.image === 'string' && !item.image.startsWith('data:')
          ? `<img src="${escapeHtml(item.image)}" alt="${name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block;" />`
          : `<div style="width: 48px; height: 48px; background-color: #edf2f7; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #a0aec0; font-size: 20px; line-height: 48px; text-align: center;">&#128230;</div>`;

        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; overflow: hidden;">
            <tr>
              <td width="60" style="padding: 10px; vertical-align: middle;">
                ${imgTag}
              </td>
              <td style="padding: 10px 10px 10px 0; vertical-align: middle;">
                <span style="font-size: 14px; font-weight: 600; color: #1a202c; display: block;">${name}</span>
                ${category}
              </td>
              <td align="right" style="padding: 10px 14px; vertical-align: middle; white-space: nowrap;">
                <span style="display: inline-block; padding: 4px 10px; background-color: #e0e7ff; color: #4338ca; border-radius: 12px; font-size: 12px; font-weight: 600;">
                  ${escapeHtml(qty)}
                </span>
              </td>
            </tr>
          </table>
        `;
      }).join('');

      return `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #edf2f7; font-size: 13px; font-weight: 600; color: #4a5568; background-color: #f8fafc; width: 35%; vertical-align: top;">
            ${escapeHtml(key)}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #edf2f7; background-color: #ffffff; vertical-align: top;">
            ${productCardsHtml}
          </td>
        </tr>
      `;
    }

    let displayVal = val;
    if (Array.isArray(val)) {
      displayVal = val.map(item => String(item)).join(', ');
    } else if (typeof val === 'object' && val !== null) {
      displayVal = JSON.stringify(val);
    }

    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 13px; font-weight: 600; color: #4a5568; background-color: #f8fafc; width: 35%; vertical-align: top;">
          ${escapeHtml(key)}
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #1a202c; background-color: #ffffff; vertical-align: top;">
          ${escapeHtml(displayVal || '—')}
        </td>
      </tr>
    `;
  }).join('');
};

// Build recipient email template (Admin / Sales / CC)
const generateAdminLeadEmailHtml = ({ flipbookName, leadId, leadData, viewerIp, submittedAt, customMessage }) => {
  const formattedDate = new Date(submittedAt || Date.now()).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const introParagraph = customMessage && customMessage.trim()
    ? `<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-line;">${escapeHtml(customMessage.trim())}</p>`
    : `<p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.5; color: #4a5568;">
        A viewer submitted their details on your flipbook <strong>"${escapeHtml(flipbookName)}"</strong>. Below are the details captured:
      </p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Captured</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4A3AFF 0%, #3026B9 100%); padding: 32px 30px; text-align: left;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="display: inline-block; padding: 4px 10px; background: rgba(255, 255, 255, 0.2); border-radius: 20px; font-size: 11px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                          New Lead Notification
                        </span>
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                          ${escapeHtml(flipbookName)}
                        </h1>
                        <p style="margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px;">
                          Lead ID: <strong>#${escapeHtml(leadId)}</strong> &bull; ${escapeHtml(formattedDate)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Lead Overview -->
              <tr>
                <td style="padding: 28px 30px 28px 30px;">
                  ${introParagraph}

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    ${formatLeadDataRows(leadData)}
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0 0 4px 0;">This email was sent automatically by Flipibook Lead Capture System.</p>
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} Flipibook. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Build confirmation email template for the Viewer
const generateViewerConfirmationEmailHtml = ({ flipbookName, leadData, contactPersonName, customMessage }) => {
  const customMessageBody = customMessage && customMessage.trim()
    ? `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4a5568; white-space: pre-line;">${escapeHtml(customMessage.trim())}</p>`
    : `<p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
        Thank you for your interest. Our team has received your inquiry details and will review and get in touch with you shortly.
      </p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for reaching out</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4A3AFF 0%, #3026B9 100%); padding: 36px 30px; text-align: center;">
                  <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; color: #ffffff; font-size: 24px; margin-bottom: 12px;">
                    &#10003;
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                    Thank You for Your Submission!
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                    We have successfully received your inquiry for <strong>${escapeHtml(flipbookName)}</strong>.
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4a5568;">
                    Hi${contactPersonName ? ` <strong>${escapeHtml(contactPersonName)}</strong>` : ''},
                  </p>
                  ${customMessageBody}

                  <div style="margin: 20px 0; padding: 18px 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #edf2f7;">
                    <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Summary of Your Request
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      ${formatLeadDataRows(leadData)}
                    </table>
                  </div>

                  <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #718096;">
                    If you have any urgent queries in the meantime, feel free to reply directly to this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0 0 4px 0;">This is an automated confirmation sent on behalf of <strong>${escapeHtml(flipbookName)}</strong>.</p>
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} Flipibook. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Helper to extract email address from arbitrary leadData fields
const extractViewerEmail = (leadData, rawLeadData) => {
  const combined = { ...(rawLeadData || {}), ...(leadData || {}) };
  for (const [key, value] of Object.entries(combined)) {
    if (typeof value === 'string') {
      const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && (/email/i.test(key) || /mail/i.test(key))) {
        return emailMatch[0].trim();
      }
    }
  }
  // Fallback: any field value that is a valid email
  for (const value of Object.values(combined)) {
    if (typeof value === 'string') {
      const emailMatch = value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
      if (emailMatch) return emailMatch[0].trim();
    }
  }
  return null;
};

// Helper to extract visitor name
const extractViewerName = (leadData, rawLeadData) => {
  const combined = { ...(rawLeadData || {}), ...(leadData || {}) };
  for (const [key, value] of Object.entries(combined)) {
    if (/name/i.test(key) && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

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

    // ─────────────────────────────────────────────────────────────────────────────
    // Send Email Notifications
    // ─────────────────────────────────────────────────────────────────────────────
    try {
      const { rawLeadData, leadNotification: incomingNotification } = req.body;
      const flipbookLeadSettings = flipbook?.Customized_Settings?.leadForm?.leadNotification || flipbook?.settings?.leadForm?.leadNotification;
      const leadNotification = incomingNotification || flipbookLeadSettings || {};

      const isNotificationEnabled = leadNotification.enabled !== false;

      if (isNotificationEnabled) {
        let primaryRecipient = (leadNotification.primaryRecipient || '').trim();
        const rawAdditional = Array.isArray(leadNotification.additionalRecipients)
          ? leadNotification.additionalRecipients
          : [];
        let additionalRecipients = rawAdditional
          .map(r => (typeof r === 'string' ? r.trim() : ''))
          .filter(Boolean);

        // If primary is empty but additional recipients are provided, promote the first additional recipient
        if (!primaryRecipient && additionalRecipients.length > 0) {
          primaryRecipient = additionalRecipients[0];
          additionalRecipients = additionalRecipients.slice(1);
        } else if (!primaryRecipient) {
          // Fallback to the flipbook creator's registered email
          primaryRecipient = (effectiveUserEmail || '').trim();
        }

        // Filter CC list so it does not contain the primary recipient
        additionalRecipients = additionalRecipients.filter(r => r !== primaryRecipient);

        const transporter = getTransporter();

        // Custom sender name requested: "Flipibook Lead Form"
        const senderDisplayName = (leadNotification.senderName || 'Flipibook Lead Form').trim();
        const fromHeader = `"${senderDisplayName}" <${process.env.EMAIL_USER || 'no-reply@fistotech.com'}>`;

        // 1. Send Alert Email to Primary Recipient + CC Additional Recipients
        if (primaryRecipient) {
          const rawAdminMsg = leadNotification.message || '';
          const adminCustomMessage = rawAdminMsg
            ? rawAdminMsg.replace(/\{flipbookName\}/g, effectiveBookName).replace(/\{leadId\}/g, newLead.leadId)
            : '';
          const adminHtml = generateAdminLeadEmailHtml({
            flipbookName: effectiveBookName,
            leadId: newLead.leadId,
            leadData: leadData,
            viewerIp: detectedViewerIp,
            submittedAt: newLead.submittedAt,
            customMessage: adminCustomMessage
          });

          const defaultAdminSubject = `[New Lead Captured] - ${effectiveBookName}`;
          const adminSubject = (leadNotification.subject && leadNotification.subject.trim())
            ? leadNotification.subject.replace(/\{flipbookName\}/g, effectiveBookName).replace(/\{leadId\}/g, newLead.leadId)
            : defaultAdminSubject;

          const mailOptions = {
            from: fromHeader,
            to: primaryRecipient,
            subject: adminSubject,
            html: adminHtml
          };

          if (additionalRecipients.length > 0) {
            mailOptions.cc = additionalRecipients;
          }

          transporter.sendMail(mailOptions).then(info => {
            console.log(`[Lead Email] Notification sent to ${primaryRecipient} (CC: ${additionalRecipients.join(', ') || 'none'}):`, info.messageId);
          }).catch(mailErr => {
            console.error('[Lead Email] Error sending lead notification:', mailErr.message);
          });
        }

        // 2. Send Confirmation Email to the Viewer if enabled
        const shouldSendToViewer = leadNotification.sendToViewer !== false;
        const viewerEmail = extractViewerEmail(leadData, rawLeadData);

        if (shouldSendToViewer && viewerEmail) {
          const viewerName = extractViewerName(leadData, rawLeadData);
          const rawViewerMsg = leadNotification.viewerMessage || '';
          const viewerCustomMessage = rawViewerMsg
            ? rawViewerMsg.replace(/\{flipbookName\}/g, effectiveBookName).replace(/\{name\}/g, viewerName || 'there')
            : '';
          const viewerHtml = generateViewerConfirmationEmailHtml({
            flipbookName: effectiveBookName,
            leadData: leadData,
            contactPersonName: viewerName,
            customMessage: viewerCustomMessage
          });

          const defaultViewerSubject = `Thank you for reaching out - ${effectiveBookName}`;
          const viewerSubject = (leadNotification.viewerSubject && leadNotification.viewerSubject.trim())
            ? leadNotification.viewerSubject.replace(/\{flipbookName\}/g, effectiveBookName).replace(/\{name\}/g, viewerName || 'there')
            : defaultViewerSubject;

          transporter.sendMail({
            from: fromHeader,
            to: viewerEmail,
            subject: viewerSubject,
            html: viewerHtml
          }).then(info => {
            console.log(`[Lead Email] Confirmation sent to viewer ${viewerEmail}:`, info.messageId);
          }).catch(mailErr => {
            console.error('[Lead Email] Error sending confirmation to viewer:', mailErr.message);
          });
        }
      }
    } catch (notifyErr) {
      console.warn('[Lead Email] Notification dispatch error (non-blocking):', notifyErr);
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
    if (effectiveVId && effectiveVId !== 'all') {
      filter.v_id = effectiveVId;
    } else if (emailId) {
      // Find all flipbooks belonging to this user
      const userBooks = await Flipbook.find({ userEmail: emailId }).select('v_id flipbookName');
      const vIds = userBooks.map(b => b.v_id).filter(Boolean);
      
      // Match by direct userEmail OR by flipbook v_id
      filter = {
        $or: [
          { userEmail: emailId },
          { v_id: { $in: vIds } }
        ]
      };
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();

    // Map flipbook names if missing or to ensure accurate book names
    if (emailId) {
      const userBooks = await Flipbook.find({ userEmail: emailId }).select('v_id flipbookName').lean();
      const bookMap = {};
      userBooks.forEach(b => {
        if (b.v_id) bookMap[b.v_id] = b.flipbookName;
      });

      leads.forEach(l => {
        if (!l.flipbookName && l.v_id && bookMap[l.v_id]) {
          l.flipbookName = bookMap[l.v_id];
        }
      });
    }

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
