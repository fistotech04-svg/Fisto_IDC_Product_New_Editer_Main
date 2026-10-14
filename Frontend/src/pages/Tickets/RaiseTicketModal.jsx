// Frontend/src/pages/Tickets/RaiseTicketModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  LifeBuoy, 
  Paperclip, 
  AlertCircle, 
  Check, 
  UploadCloud,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  ArrowLeft
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
    const userDisplayName = currentUser?.name || contactEmail.split('@')[0] || 'User';

    const newTicket = {
      id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: subject.trim(),
      moduleId: selectedMod.id,
      moduleName: selectedMod.name,
      department: selectedMod.name,
      priority,
      status: 'open',
      requester: {
        name: userDisplayName,
        email: contactEmail.trim(),
        avatarColor: currentUser?.avatarBgColor || '#ec5137',
        badge: 'Authorized User',
        initials: userDisplayName.slice(0, 2).toUpperCase()
      },
      ccRecipients: [
        contactEmail.trim(),
        'support@flipibook.com'
      ],
      assignedTo: {
        name: 'Technical Support',
        role: 'Tier 1 Support',
        avatarColor: '#2563eb'
      },
      createdAt: 'Just now',
      submittedAt: 'Just now',
      updatedAt: 'Just now',
      description: description.trim(),
      attachments: attachmentName ? [attachmentName] : [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          authorName: userDisplayName,
          badge: 'Authorized User',
          email: contactEmail.trim(),
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

  const activeModule = modulesList.find(m => m.id === moduleId) || modulesList[0];

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white w-full h-full flex flex-col overflow-hidden"
        role="dialog"
      >
        {/* Header - Full Width with Back button & Clear info */}
        <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Back to Tickets"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ec5137] flex items-center justify-center">
              <LifeBuoy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Raise Support Ticket
                </h2>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-[#c23d26] border border-orange-200">
                  Direct Engineering Support
                </span>
              </div>
              <p className="text-xs text-stone-500 font-normal">
                Private inquiry to our engineering and customer success team
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-[#ec5137] p-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body - Full Width */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="w-full space-y-6">
            {/* 2-Column Responsive Form Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                  Affected Module / Service <span className="text-[#ec5137]">*</span>
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#ec5137] focus:ring-1 focus:ring-[#ec5137]/20 cursor-pointer text-stone-800"
                >
                  {modulesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Severity / Priority */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                  Issue Severity / Priority <span className="text-[#ec5137]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TICKET_PRIORITIES.map((p) => {
                    const isSelected = p.id === priority;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected 
                            ? `${p.color} ring-1 ring-orange-300 shadow-xs font-bold` 
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span>{p.label} Priority</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subject / Title */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                Subject <span className="text-[#ec5137]">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Export timeout when processing high-resolution flipbook (75MB)"
                className="w-full px-4 py-2.5 text-sm sm:text-base border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] transition-all text-stone-900 font-normal"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                Problem Description & Expected Outcome <span className="text-[#ec5137]">*</span>
              </label>
              <textarea
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide exact details of what happened, error message, steps to reproduce, or catalogue URL..."
                className="w-full p-4 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] transition-all resize-y text-stone-900 font-normal leading-relaxed"
              />
            </div>

            {/* Attachments Upload */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
                Attach Screenshot or Log File (Optional)
              </label>
              <div className="border border-dashed border-stone-300 hover:border-[#ec5137]/50 rounded-xl p-5 flex items-center justify-between bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <UploadCloud size={22} className="text-stone-400" />
                  <div className="text-xs">
                    {attachmentName ? (
                      <span className="font-semibold text-stone-900 text-sm">{attachmentName}</span>
                    ) : (
                      <span className="text-stone-500 text-sm">Attach screenshot or error log (PNG, JPG, PDF, TXT)</span>
                    )}
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors shadow-xs">
                  <span>Browse</span>
                  <input type="file" onChange={handleSimulatedFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2 text-xs text-stone-600">
              <ShieldAlert size={16} className="text-stone-400 flex-shrink-0" />
              <span>Support tickets are private to your organization and Flipibook technical engineers.</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <span className="text-xs text-stone-500 font-normal">
              Department: <strong className="text-stone-800 font-medium">{activeModule.name}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-[0.99]"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Raising Ticket...' : 'Submit Ticket'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
