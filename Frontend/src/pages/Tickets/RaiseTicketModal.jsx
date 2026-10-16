// Frontend/src/pages/Tickets/RaiseTicketModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  LifeBuoy, 
  AlertCircle, 
  UploadCloud,
  Loader2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { TICKET_MODULES } from './ticketData';
import { createTicketApi } from './ticketApi';
import { 
  processImageAttachmentsSequentially, 
  formatFileSize 
} from './imageCompressor';

const modulesList = TICKET_MODULES.filter(m => m.id !== 'all');

export default function RaiseTicketModal({ isOpen, onClose, onSubmit, defaultModuleId = 'my-flipbooks', currentUser }) {
  const [moduleId, setModuleId] = useState(defaultModuleId === 'all' ? 'my-flipbooks' : defaultModuleId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]); // Array of compressed image objects
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setDescription('');
      setError('');
      setAttachments([]);
      setModuleId(defaultModuleId === 'all' ? 'my-flipbooks' : defaultModuleId);
    }
  }, [isOpen, defaultModuleId]);

  if (!isOpen) return null;

  const handleImageFilesChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setIsCompressing(true);

    try {
      const { attachments: newAttachments } = await processImageAttachmentsSequentially(files, attachments);
      setAttachments(newAttachments);
    } catch (err) {
      setError(err.message || 'Error processing image attachments');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a ticket subject');
      return;
    }
    if (subject.trim().length < 5) {
      setError('Subject must be at least 5 characters');
      return;
    }
    if (!description.trim()) {
      setError('Please explain your problem or inquiry in detail');
      return;
    }

    setIsSubmitting(true);
    const selectedMod = modulesList.find(m => m.id === moduleId) || modulesList[0];
    const contactEmail = currentUser?.email || currentUser?.emailId || 'user@flipibook.com';
    const userDisplayName = currentUser?.name || contactEmail.split('@')[0] || 'User';

    const ticketAttachments = attachments.map(att => ({
      name: att.name,
      size: att.size,
      originalSize: att.originalSize,
      url: att.dataUrl,
      width: att.width,
      height: att.height
    }));

    const ticketPayload = {
      subject: subject.trim(),
      moduleId: selectedMod.id,
      moduleName: selectedMod.name,
      department: selectedMod.name,
      status: 'open',
      priority: 'medium',
      requester: {
        name: userDisplayName,
        email: contactEmail,
        avatarColor: currentUser?.avatarBgColor || '#ec5137',
        badge: 'Authorized User',
        role: currentUser?.role || 'User'
      },
      ccRecipients: [
        contactEmail,
        'support@flipibook.com'
      ],
      description: description.trim(),
      attachments: ticketAttachments
    };

    (async () => {
      try {
        const createdFromBackend = await createTicketApi(ticketPayload);
        if (createdFromBackend && createdFromBackend.id) {
          onSubmit(createdFromBackend);
          setIsSubmitting(false);
          onClose();
          return;
        }
      } catch (err) {
        console.warn('Backend ticket creation failed, falling back to local object:', err);
      }

      // Fallback only if backend is completely offline
      const localTicket = {
        ...ticketPayload,
        id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        submittedAt: 'Just now',
        updatedAt: 'Just now',
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'user',
            authorName: userDisplayName,
            badge: 'Authorized User',
            email: contactEmail,
            timestamp: 'Just now',
            content: description.trim(),
            attachments: ticketAttachments
          }
        ]
      };

      onSubmit(localTicket);
      setIsSubmitting(false);
      onClose();
    })();
  };

  const totalBytes = attachments.reduce((sum, item) => sum + (item.size || 0), 0);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ec5137] flex items-center justify-center">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Raise Support Ticket
              </h2>
              <p className="text-xs text-stone-500 font-normal">
                Direct inquiry to our support and engineering team
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-[#ec5137] p-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Module (First field as requested) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
              Module <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#ec5137] focus:ring-1 focus:ring-[#ec5137]/20 cursor-pointer text-stone-800 font-normal shadow-2xs"
            >
              {modulesList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
              Subject <span className="text-[#ec5137]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue..."
              className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] text-stone-900 font-normal shadow-2xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
              Description <span className="text-[#ec5137]">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem in detail (what happened, steps taken, error message)..."
              className="w-full p-3.5 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] resize-y text-stone-900 font-normal leading-relaxed shadow-2xs"
            />
          </div>

          {/* Attachment (Images with compression) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide">
                Image Attachments <span className="text-stone-400 font-normal">(Optional, max 5)</span>
              </label>
              <span className="text-[11px] text-stone-500 font-normal">
                {attachments.length}/5 images • {formatFileSize(totalBytes)}/4 MB
              </span>
            </div>

            <div className="border border-dashed border-stone-300 hover:border-[#ec5137]/50 rounded-xl p-3.5 bg-stone-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-orange-100/70 text-[#ec5137] flex items-center justify-center shrink-0">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-800">
                      Upload JPG, PNG, JPEG, or WebP
                    </p>
                    <p className="text-[11px] text-stone-500 font-normal">
                      Max 10 MB per image • Auto-resized to 1920px & compressed
                    </p>
                  </div>
                </div>

                <label className={`px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors shadow-2xs shrink-0 flex items-center justify-center gap-1.5 ${
                  attachments.length >= 5 || isCompressing ? 'opacity-50 pointer-events-none' : ''
                }`}>
                  {isCompressing ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#ec5137]" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <span>Add Images</span>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/png,image/jpeg,image/jpg,image/webp" 
                    multiple
                    disabled={attachments.length >= 5 || isCompressing}
                    onChange={handleImageFilesChange} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Attached Images Previews */}
              {attachments.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-stone-200 shadow-2xs gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={att.dataUrl} 
                          alt={att.name} 
                          className="w-8 h-8 rounded object-cover border border-stone-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-800 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {formatFileSize(att.size)} <span className="text-stone-300">•</span> {att.width}×{att.height}px
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-stone-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                        title="Remove image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

