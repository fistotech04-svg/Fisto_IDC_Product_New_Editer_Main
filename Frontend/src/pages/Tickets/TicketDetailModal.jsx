// Frontend/src/pages/Tickets/TicketDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  ChevronUp, 
  ChevronDown, 
  Reply, 
  Plus, 
  Star, 
  User, 
  HelpCircle, 
  FileText, 
  Download, 
  Activity, 
  Radio, 
  Tag,
  CheckCircle2,
  Trash2,
  ArrowLeft
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
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CC Recipients input state
  const [ccList, setCcList] = useState(() => {
    return ticket?.ccRecipients || [
      'atchaya@fist-o.com',
      'project.manager@fist-o.com',
      'dev.team@flipibook.com'
    ];
  });
  const [newCcEmail, setNewCcEmail] = useState('');

  // Accordion collapsibles
  const [infoOpen, setInfoOpen] = useState(true);
  const [ccOpen, setCcOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(true);

  if (!isOpen || !ticket) return null;

  const priorityObj = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || { label: 'Medium' };
  const statusLabel = ticket.status === 'answered' ? 'Answered' : (ticket.status || 'Open');

  const handleAddCc = (e) => {
    e.preventDefault();
    if (newCcEmail.trim() && !ccList.includes(newCcEmail.trim())) {
      setCcList([...ccList, newCcEmail.trim()]);
      setNewCcEmail('');
    }
  };

  const handleRemoveCc = (emailToRemove) => {
    setCcList(ccList.filter(e => e !== emailToRemove));
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      authorName: currentUser?.name || ticket.requester?.name || 'Authorized User',
      badge: 'Authorized User',
      email: currentUser?.email || ticket.requester?.email || 'atchaya@fist-o.com',
      timestamp: 'Just now',
      content: replyText.trim()
    };

    setTimeout(() => {
      onAddMessage(ticket.id, newMessage);
      setReplyText('');
      setIsSubmitting(false);
      setShowReplyForm(false);
    }, 200);
  };

  const allMessages = ticket.messages && ticket.messages.length > 0
    ? ticket.messages
    : [
        {
          id: 'initial',
          sender: 'user',
          authorName: ticket.requester?.name || 'Requester',
          badge: 'Authorized User',
          email: ticket.requester?.email || '',
          timestamp: ticket.submittedAt || 'Earlier',
          content: ticket.description
        }
      ];

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white w-full h-full flex flex-col text-slate-800 overflow-hidden"
        role="dialog"
      >
        {/* Top Title & Close Bar */}
        <div className="bg-[#f8fafc] px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Back to Tickets"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl md:text-2xl font-normal text-[#2563eb] tracking-tight">
                Ticket #{ticket.id} - Sub : {ticket.subject}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-sans">
                <span className="hover:text-slate-600 cursor-pointer">Portal Home</span>
                <span>/</span>
                <span className="hover:text-slate-600 cursor-pointer">Client Area</span>
                <span>/</span>
                <span className="hover:text-slate-600 cursor-pointer">Support Tickets</span>
                <span>/</span>
                <span className="text-slate-600 font-medium">View Ticket</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Top Bar */}
        <div className="px-6 py-3 bg-[#e2f1fa]/40 border-b border-sky-100 flex items-center justify-between flex-shrink-0">
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-medium text-sm transition-all border border-sky-200 cursor-pointer shadow-xs"
          >
            <Reply size={15} />
            <span>Reply</span>
          </button>

          <button 
            onClick={() => setShowReplyForm(true)}
            className="text-sky-700 hover:text-sky-900 p-1 rounded transition-colors cursor-pointer"
            title="Add response"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Main Content 2-Column Full-Width Layout */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#fcfcfc] overflow-y-auto">
          {/* Left Column (Ticket Info Sidebar) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Box 1: Ticket Information */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
              <div 
                onClick={() => setInfoOpen(!infoOpen)}
                className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none text-slate-700 font-medium text-xs tracking-wide"
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-slate-500" />
                  <span>Ticket Information</span>
                </div>
                {infoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {infoOpen && (
                <div className="p-4 space-y-3.5 text-xs text-slate-600">
                  <div>
                    <div className="text-[11px] text-slate-400">Requestor</div>
                    <div className="mt-0.5 flex items-center gap-2 font-medium text-slate-900">
                      <span>{ticket.requester?.name || 'Atchaya Rajendran'}</span>
                      <span className="text-[10px] bg-slate-600 text-white px-1.5 py-0.5 rounded font-normal">
                        {ticket.requester?.badge || 'Authorized User'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Department</div>
                    <div className="mt-0.5 font-medium text-slate-800">
                      {ticket.department || ticket.moduleName || 'IDC Support'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Submitted</div>
                    <div className="mt-0.5 text-slate-700 font-sans">
                      {ticket.submittedAt || 'Monday, October 12th, 2026 (10:15)'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Last Updated</div>
                    <div className="mt-0.5 text-slate-700 font-sans">
                      {ticket.lastUpdated || '2 hours ago'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Status/Priority</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-0.5 rounded text-[11px] font-bold tracking-tight">
                        {statusLabel}
                      </span>
                      <span className="text-slate-700 font-medium">
                        {priorityObj.label || 'Medium'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button 
                      onClick={() => setShowReplyForm(true)}
                      className="flex-1 py-1.5 px-3 rounded bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Reply size={13} />
                      <span>Reply</span>
                    </button>

                    <button 
                      onClick={() => onUpdateStatus(ticket.id, 'closed')}
                      className="flex-1 py-1.5 px-3 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X size={13} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: CC Recipients */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
              <div 
                onClick={() => setCcOpen(!ccOpen)}
                className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none text-slate-700 font-medium text-xs tracking-wide"
              >
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-500" />
                  <span>CC Recipients</span>
                </div>
                {ccOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {ccOpen && (
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="space-y-1.5">
                    {ccList.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700 group hover:text-slate-900 py-0.5">
                        <span className="truncate pr-2 font-mono text-[11px]">{email}</span>
                        <button 
                          onClick={() => handleRemoveCc(email)}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove email"
                        >
                          <X size={12} className="border border-red-300 rounded-sm p-[1px]" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddCc} className="pt-2 flex items-center gap-1">
                    <input 
                      type="email"
                      value={newCcEmail}
                      onChange={(e) => setNewCcEmail(e.target.value)}
                      placeholder="Enter Email Address"
                      className="flex-1 border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <button 
                      type="submit"
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Box 3: Support Navigation */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
              <div 
                onClick={() => setSupportOpen(!supportOpen)}
                className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none text-slate-700 font-medium text-xs tracking-wide"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-slate-500" />
                  <span>Support</span>
                </div>
                {supportOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>

              {supportOpen && (
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <span>My Support Tickets</span>
                    <FileText size={13} className="text-slate-400" />
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <span>Announcements</span>
                    <Radio size={13} className="text-slate-400" />
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <span>Knowledgebase</span>
                    <HelpCircle size={13} className="text-slate-400" />
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between font-semibold text-slate-900 border-l-2 border-[#ef4444] bg-slate-50/50">
                    <span>Downloads</span>
                    <Download size={13} className="text-slate-500" />
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <span>Network Status</span>
                    <Activity size={13} className="text-slate-400" />
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <span>Open Ticket</span>
                    <Send size={13} className="text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Ticket Messages & Replies) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Conditional Inline Reply Box */}
            {showReplyForm && (
              <form onSubmit={handleReplySubmit} className="bg-white rounded-lg border border-sky-300 p-4 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                    Post Reply to Staff
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowReplyForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide your feedback or further issue details..."
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-sans leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    Replying as: <strong className="text-slate-700">{ticket.requester?.name || 'Authorized User'}</strong>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSubmitting}
                    className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            )}

            {/* Conversation Messages Thread */}
            <div className="space-y-6">
              {allMessages.map((msg) => {
                const isAgent = msg.sender === 'agent';

                return (
                  <div 
                    key={msg.id}
                    className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs"
                  >
                    {/* Header */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${
                          isAgent ? 'bg-slate-700' : 'bg-slate-800'
                        }`}>
                          <User size={16} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {msg.authorName}
                            </span>
                            {msg.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                                isAgent ? 'bg-sky-500 text-white' : 'bg-slate-600 text-white'
                              }`}>
                                {msg.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {msg.subRole || msg.email || ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-sans">
                        {msg.timestamp}
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-5 text-xs sm:text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </div>

                    {/* Rating stars placeholder on bottom right of staff reply */}
                    {isAgent && (
                      <div className="px-5 pb-3 flex justify-end items-center gap-1 text-slate-300">
                        <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                        <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                        <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                        <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                        <Star size={14} className="hover:text-amber-400 cursor-pointer" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
