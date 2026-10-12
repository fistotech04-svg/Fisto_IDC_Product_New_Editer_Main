// Frontend/src/pages/Tickets/TicketDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './ticketData';

export default function TicketDetailModal({ 
  ticket, 
  isOpen, 
  onClose, 
  onAddMessage, 
  onUpdateStatus, 
  currentUser 
}) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !ticket) return null;

  const priorityObj = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || TICKET_PRIORITIES[1];
  const statusObj = TICKET_STATUSES.find(s => s.id === ticket.status) || TICKET_STATUSES[1];

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      authorName: currentUser?.name || currentUser?.email?.split('@')[0] || 'You',
      timestamp: 'Just now',
      content: replyText.trim()
    };

    setTimeout(() => {
      onAddMessage(ticket.id, newMessage);
      setReplyText('');
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-800">
              #{ticket.id}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${priorityObj.color}`}>
              {priorityObj.label} Priority
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${statusObj.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
              {statusObj.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ticket.status !== 'resolved' && (
              <button
                onClick={() => onUpdateStatus(ticket.id, 'resolved')}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                <span>Mark Resolved</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Ticket Subject & Department */}
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 leading-snug">
              {ticket.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2.5">
              <span>Department: <strong className="text-gray-700">{ticket.moduleName}</strong></span>
              <span>•</span>
              <span>Opened by: <strong className="text-gray-700">{ticket.requester?.name}</strong> ({ticket.requester?.email})</span>
              <span>•</span>
              <span>Assigned to: <strong className="text-gray-700">{ticket.assignedTo?.name}</strong></span>
            </div>
          </div>

          {/* Attachments if any */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2 text-xs">
              <Paperclip size={14} className="text-gray-400" />
              <span className="font-semibold text-gray-700">Attachments:</span>
              {ticket.attachments.map((att, idx) => (
                <span key={idx} className="bg-white px-2.5 py-1 rounded border border-gray-200 font-mono text-gray-800">
                  {att}
                </span>
              ))}
            </div>
          )}

          {/* Conversation Timeline */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Activity & Response Thread
            </div>

            {ticket.messages && ticket.messages.map((msg) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div 
                  key={msg.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isAgent 
                      ? 'bg-blue-50/40 border-blue-200/70' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
                          isAgent ? 'bg-blue-600' : 'bg-[#ec5137]'
                        }`}
                      >
                        {isAgent ? 'S' : (msg.authorName ? msg.authorName.charAt(0).toUpperCase() : 'U')}
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {msg.authorName}
                      </span>
                      {isAgent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <ShieldCheck size={11} /> Support Staff
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-gray-400">
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line pl-8">
                    {msg.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">
              Send a Reply or Additional Details
            </h3>
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the support team..."
              className="w-full p-3.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmitting}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
