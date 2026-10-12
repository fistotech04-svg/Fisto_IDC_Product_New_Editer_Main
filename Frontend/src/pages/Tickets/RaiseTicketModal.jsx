// Frontend/src/pages/Tickets/RaiseTicketModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  LifeBuoy, 
  Paperclip, 
  AlertCircle, 
  Check, 
  UploadCloud 
} from 'lucide-react';
import { TICKET_MODULES, TICKET_PRIORITIES } from './ticketData';

const modulesList = TICKET_MODULES.filter(m => m.id !== 'all');

export default function RaiseTicketModal({ isOpen, onClose, onSubmit, defaultModuleId = 'my-flipbooks', currentUser }) {
  const [moduleId, setModuleId] = useState(defaultModuleId === 'all' ? 'my-flipbooks' : defaultModuleId);
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setDescription('');
      setError('');
      setAttachmentName('');
      setPriority('medium');
      setModuleId(defaultModuleId === 'all' ? 'my-flipbooks' : defaultModuleId);
      setContactEmail(currentUser?.email || currentUser?.emailId || 'user@example.com');
    }
  }, [isOpen, defaultModuleId, currentUser]);

  if (!isOpen) return null;

  const handleSimulatedFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a ticket subject');
      return;
    }
    if (subject.trim().length < 8) {
      setError('Subject must be at least 8 characters');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your inquiry or problem in detail');
      return;
    }

    setIsSubmitting(true);
    const selectedMod = modulesList.find(m => m.id === moduleId) || modulesList[0];

    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: subject.trim(),
      moduleId: selectedMod.id,
      moduleName: selectedMod.name,
      priority,
      status: 'open',
      requester: {
        name: currentUser?.name || contactEmail.split('@')[0] || 'User',
        email: contactEmail.trim(),
        avatarColor: currentUser?.avatarBgColor || '#ec5137'
      },
      assignedTo: {
        name: 'Support Operations',
        role: 'Tier 1 Support',
        avatarColor: '#2563eb'
      },
      createdAt: 'Just now',
      updatedAt: 'Just now',
      description: description.trim(),
      attachments: attachmentName ? [attachmentName] : [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          authorName: currentUser?.name || contactEmail.split('@')[0] || 'User',
          timestamp: 'Just now',
          content: description.trim()
        }
      ]
    };

    setTimeout(() => {
      onSubmit(newTicket);
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ec5137] flex items-center justify-center">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-950">
                Raise Support Ticket
              </h2>
              <p className="text-xs text-gray-500">
                Direct inquiry to our engineering and customer success team
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
          {/* Module / Department */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Affected Module / Service <span className="text-[#ec5137]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {modulesList.map((m) => {
                const isSelected = m.id === moduleId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModuleId(m.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'border-[#ec5137] bg-orange-50/60 text-gray-900 ring-1 ring-[#ec5137]' 
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{m.name}</span>
                    {isSelected && <Check size={14} className="text-[#ec5137]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Issue Severity / Priority
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {TICKET_PRIORITIES.map((p) => {
                const isSelected = p.id === priority;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected 
                        ? `${p.color} ring-2 ring-gray-900/10 shadow-xs` 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p.label} Priority
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Subject <span className="text-[#ec5137]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Export timeout when processing high-resolution flipbook"
              className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Problem Description & Expected Outcome <span className="text-[#ec5137]">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of what happened, error message, or steps to reproduce..."
              className="w-full p-4 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all resize-y"
            />
          </div>

          {/* Attachments (Simulated) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Attach Screenshot or Log File (Optional)
            </label>
            <div className="border border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-4 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <UploadCloud size={20} className="text-gray-400" />
                <div className="text-xs">
                  {attachmentName ? (
                    <span className="font-bold text-gray-900">{attachmentName}</span>
                  ) : (
                    <span className="text-gray-500">Attach screenshot or error log (PNG, JPG, PDF, TXT)</span>
                  )}
                </div>
              </div>

              <label className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                <span>Browse</span>
                <input type="file" onChange={handleSimulatedFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Updates will be sent to <strong>{contactEmail}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Raising Ticket...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
