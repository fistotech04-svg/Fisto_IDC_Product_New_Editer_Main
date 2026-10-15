// Frontend/src/pages/Tickets/TicketDetailsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Reply, 
  Plus, 
  Star, 
  User, 
  HelpCircle, 
  FileText, 
  Download, 
  Activity, 
  Radio, 
  Send,
  X,
  ChevronUp,
  ChevronDown,
  Paperclip,
  UploadCloud,
  Loader2,
  Trash2,
  ImageIcon,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { 
  TICKET_PRIORITIES, 
  TICKET_STATUSES, 
  getStoredTickets, 
  saveStoredTickets 
} from './ticketData';
import { 
  fetchTicketById, 
  updateTicketStatusApi, 
  addTicketMessageApi 
} from './ticketApi';
import { useToast } from '../../components/CustomToast';
import { 
  processImageAttachmentsSequentially, 
  formatFileSize 
} from './imageCompressor';

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tickets, setTickets] = useState(() => getStoredTickets());
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(true);

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [isCompressingReply, setIsCompressingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const replyFileInputRef = React.useRef(null);

  // CC Recipients input state
  const [ccList, setCcList] = useState([]);
  const [newCcEmail, setNewCcEmail] = useState('');

  // Accordion collapsibles
  const [infoOpen, setInfoOpen] = useState(true);
  const [ccOpen, setCcOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(true);

  const getResolvedUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
      return { ...u, ...p };
    } catch (e) {
      return null;
    }
  };

  const [currentUser] = useState(() => getResolvedUser());

  // Admin detection matching Forum & Tickets logic
  const isAdminUser = useMemo(() => {
    let authUser = {};
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) authUser = JSON.parse(rawUser);
    } catch (e) {}

    const email = (currentUser?.email || currentUser?.emailId || authUser?.email || authUser?.emailId || '').toLowerCase().trim();
    const role = (currentUser?.role || authUser?.role || '').toLowerCase();
    const isAdminProp = currentUser?.isAdmin === true || authUser?.isAdmin === true;

    return Boolean(
      isAdminProp || 
      role === 'admin' || 
      role === 'staff' ||
      email.includes('admin') ||
      email.includes('fisto') ||
      email.includes('sham') ||
      localStorage.getItem('admin_mode') === 'true'
    );
  }, [currentUser]);

  // Load ticket from Backend, fallback to local stored tickets
  const loadTicketData = useCallback(async () => {
    setIsLoadingTicket(true);
    try {
      const backendData = await fetchTicketById(ticketId);
      if (backendData && backendData.id) {
        setCurrentTicket(backendData);
        // Also update local list so it stays synchronized
        setTickets(prev => {
          const exists = prev.some(t => t.id === backendData.id);
          const updated = exists 
            ? prev.map(t => t.id === backendData.id ? backendData : t)
            : [backendData, ...prev];
          saveStoredTickets(updated);
          return updated;
        });
        setIsLoadingTicket(false);
        return;
      }
    } catch (err) {
      console.warn('[TicketDetails] Backend fetch failed, using local stored ticket:', err);
    }

    const localFound = tickets.find(t => String(t.id).toLowerCase() === String(ticketId).toLowerCase());
    setCurrentTicket(localFound || null);
    setIsLoadingTicket(false);
  }, [ticketId]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  const ticket = currentTicket;

  useEffect(() => {
    if (ticket && ticket.ccRecipients) {
      setCcList(ticket.ccRecipients);
    } else {
      setCcList([
        'atchaya@fist-o.com',
        'project.manager@fist-o.com',
        'dev.team@flipibook.com'
      ]);
    }
  }, [ticket]);

  if (isLoadingTicket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Loader2 size={32} className="animate-spin text-[#ec5137] mb-3" />
        <h2 className="text-base font-semibold text-stone-800">Loading ticket #{ticketId}...</h2>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ec5137] flex items-center justify-center mb-3">
          <FileText size={24} />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Ticket not found</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-sm">
          Ticket #{ticketId} doesn't exist or may have been deleted.
        </p>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl cursor-pointer shadow-xs transition-all"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  const priorityObj = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || { label: 'Medium' };
  const statusObj = TICKET_STATUSES.find(s => s.id === ticket.status);
  const statusLabel = statusObj?.label || (ticket.status === 'in_progress' ? 'In Progress' : ticket.status || 'Open');

  const handleAddCc = (e) => {
    e.preventDefault();
    if (newCcEmail.trim() && !ccList.includes(newCcEmail.trim())) {
      const updatedCc = [...ccList, newCcEmail.trim()];
      setCcList(updatedCc);
      setNewCcEmail('');
      const updatedTicket = { ...ticket, ccRecipients: updatedCc };
      setCurrentTicket(updatedTicket);
      const updatedTickets = tickets.map(t => t.id === ticket.id ? updatedTicket : t);
      setTickets(updatedTickets);
      saveStoredTickets(updatedTickets);
    }
  };

  const handleRemoveCc = (emailToRemove) => {
    const updatedCc = ccList.filter(e => e !== emailToRemove);
    setCcList(updatedCc);
    const updatedTicket = { ...ticket, ccRecipients: updatedCc };
    setCurrentTicket(updatedTicket);
    const updatedTickets = tickets.map(t => t.id === ticket.id ? updatedTicket : t);
    setTickets(updatedTickets);
    saveStoredTickets(updatedTickets);
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTicketStatusApi(ticket.id, newStatus);
    } catch (err) {
      console.warn('Backend status update error, continuing with local update:', err);
    }

    const updatedTicket = {
      ...ticket,
      status: newStatus,
      updatedAt: 'Just now'
    };
    setCurrentTicket(updatedTicket);
    const updatedTickets = tickets.map(t => t.id === ticket.id ? updatedTicket : t);
    setTickets(updatedTickets);
    saveStoredTickets(updatedTickets);

    if (toast?.showToast) {
      toast.showToast(`Ticket status updated to ${newStatus}`, 'success');
    }
  };

  const handleReplyImagesChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setReplyError('');
    setIsCompressingReply(true);

    try {
      const { attachments: newAttachments } = await processImageAttachmentsSequentially(files, replyAttachments);
      setReplyAttachments(newAttachments);
    } catch (err) {
      setReplyError(err.message || 'Error processing images');
    } finally {
      setIsCompressingReply(false);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }
    }
  };

  const removeReplyAttachment = (indexToRemove) => {
    setReplyAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setIsSubmitting(true);
    const compressedFormatted = replyAttachments.map(att => ({
      name: att.name,
      size: att.size,
      originalSize: att.originalSize,
      url: att.dataUrl,
      width: att.width,
      height: att.height
    }));

    // If Admin/Staff, sender is 'agent' or 'admin', otherwise 'user'
    const senderRole = isAdminUser ? 'agent' : 'user';
    const authorDisplayName = isAdminUser
      ? (currentUser?.name || 'Support Staff')
      : (currentUser?.name || ticket.requester?.name || 'Authorized User');
    const authorBadge = isAdminUser ? 'Support Engineer' : 'Authorized User';

    const messagePayload = {
      id: `msg-${Date.now()}`,
      sender: senderRole,
      authorName: authorDisplayName,
      badge: authorBadge,
      email: currentUser?.email || (isAdminUser ? 'support@flipibook.com' : (ticket.requester?.email || 'user@flipibook.com')),
      content: replyText.trim(),
      attachments: compressedFormatted
    };

    try {
      const updatedTicketFromBackend = await addTicketMessageApi(ticket.id, messagePayload);
      if (updatedTicketFromBackend && updatedTicketFromBackend.id) {
        setCurrentTicket(updatedTicketFromBackend);
        setTickets(prev => prev.map(t => t.id === ticket.id ? updatedTicketFromBackend : t));
        saveStoredTickets(tickets.map(t => t.id === ticket.id ? updatedTicketFromBackend : t));
        setReplyText('');
        setReplyAttachments([]);
        setIsSubmitting(false);
        setShowReplyForm(false);
        if (toast?.showToast) {
          toast.showToast(isAdminUser ? 'Admin reply sent to user' : 'Message sent to support', 'success');
        }
        return;
      }
    } catch (err) {
      console.warn('Backend reply post failed, saving locally:', err);
    }

    // Local fallback update
    const localNewMessage = {
      ...messagePayload,
      timestamp: 'Just now'
    };

    const updatedTicket = {
      ...ticket,
      updatedAt: 'Just now',
      messages: [...(ticket.messages || []), localNewMessage]
    };
    setCurrentTicket(updatedTicket);
    const updatedTickets = tickets.map(t => t.id === ticket.id ? updatedTicket : t);
    setTickets(updatedTickets);
    saveStoredTickets(updatedTickets);
    setReplyText('');
    setReplyAttachments([]);
    setIsSubmitting(false);
    setShowReplyForm(false);
    if (toast?.showToast) {
      toast.showToast(isAdminUser ? 'Admin reply posted' : 'Message sent to support', 'success');
    }
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
          timestamp: ticket.submittedAt || ticket.createdAt || 'Earlier',
          content: ticket.description
        }
      ];

  return (
    <div className="flex-1 flex flex-col w-full h-full text-slate-800 bg-[#fcfcfc] overflow-y-auto">
      {/* Top Title Bar - Adapted to full page with Back navigation */}
      <div className="bg-[#f8fafc] px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 sticky top-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold"
            title="Back to Tickets"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Tickets</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#2563eb] tracking-tight leading-snug">
              Ticket #{ticket.id} - Sub : {ticket.subject}
            </h1>
          </div>
        </div>

        {/* Compact, modern Reply action button in header */}
        <button 
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ec5137] hover:bg-[#d9442b] text-white font-semibold text-sm transition-all shadow-xs hover:shadow cursor-pointer shrink-0"
        >
          <Reply size={16} />
          <span>{showReplyForm ? 'Close Reply' : 'Reply to Ticket'}</span>
        </button>
      </div>

      {/* Main Content 2-Column Layout (Reduced left side, expanded right side) */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#fbfbfb]">
        {/* Left Column (Ticket Info Sidebar - reduced width) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Box 1: Ticket Information */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div 
              onClick={() => setInfoOpen(!infoOpen)}
              className="bg-stone-50/90 px-5 py-3.5 border-b border-stone-200 flex items-center justify-between cursor-pointer select-none text-stone-800 font-semibold text-sm tracking-wide"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-stone-500" />
                <span>Ticket Information</span>
              </div>
              {infoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {infoOpen && (
              <div className="p-5 space-y-4 text-sm text-stone-700">
                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Requestor</div>
                  <div className="mt-1 font-medium text-stone-900 text-sm sm:text-base">
                    {ticket.requester?.name || 'Atchaya Rajendran'}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Department / Module</div>
                  <div className="mt-1 font-semibold text-stone-800 text-sm">
                    {ticket.department || ticket.moduleName || 'IDC Support'}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Submitted</div>
                  <div className="mt-1 text-stone-700 font-sans text-sm">
                    {(() => {
                      const raw = ticket.createdAt || ticket.submittedAt;
                      if (!raw) return 'Recently';
                      if (typeof raw === 'string' && (raw.includes('ago') || raw.includes('Just now') || raw.includes('Today') || raw.includes('Yesterday'))) {
                        return raw;
                      }
                      const d = new Date(raw);
                      if (!isNaN(d.getTime())) {
                        const datePart = d.toLocaleDateString(undefined, {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        });
                        const timePart = d.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        return `${datePart}, ${timePart}`;
                      }
                      return String(raw);
                    })()}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Last Updated</div>
                  <div className="mt-1 text-stone-700 font-sans text-sm">
                    {(() => {
                      const raw = ticket.updatedAt || ticket.lastUpdated || ticket.createdAt || ticket.submittedAt;
                      if (!raw) return 'Just now';
                      if (typeof raw === 'string' && (raw.includes('ago') || raw.includes('Just now') || raw.includes('Today') || raw.includes('Yesterday'))) {
                        return raw;
                      }
                      const d = new Date(raw);
                      if (!isNaN(d.getTime())) {
                        const datePart = d.toLocaleDateString(undefined, {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        });
                        const timePart = d.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        return `${datePart}, ${timePart}`;
                      }
                      return String(raw);
                    })()}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {ticket.status === 'closed' ? (
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600">
                        <CheckCircle2 size={17} className="text-stone-400" />
                        <span>Closed</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                        <CircleDot size={17} className="text-emerald-500 animate-pulse" />
                        <span>Open</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2.5">
                  <button 
                    onClick={() => setShowReplyForm(true)}
                    className="flex-1 py-2 px-3.5 rounded-xl bg-[#ec5137] hover:bg-[#d9442b] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow"
                  >
                    <Reply size={15} />
                    <span>Reply</span>
                  </button>

                  {ticket.status === 'closed' ? (
                    <div className="flex-1 py-2 px-3.5 rounded-xl bg-stone-100 text-stone-400 border border-stone-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-not-allowed select-none">
                      <X size={15} />
                      <span>Ticket Closed</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowCloseConfirm(true)}
                      className="flex-1 py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <X size={15} />
                      <span>Close Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Ticket Messages & Replies - expanded width) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Conditional Inline Reply Box */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="bg-white rounded-2xl border border-sky-300 p-5 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-sky-900 uppercase tracking-wider">
                    {isAdminUser ? 'Post Staff / Admin Reply' : 'Post Reply to Staff'}
                  </span>
                  {isAdminUser && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <ShieldCheck size={12} className="text-amber-700" />
                      Staff Mode
                    </span>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowReplyForm(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAdminUser ? "Write official engineering or support response to the user..." : "Provide your feedback or further issue details..."}
                className="w-full p-3.5 text-sm sm:text-base border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-sans leading-relaxed text-stone-900"
              />

              {/* Reply Image Upload Area (up to 5 images, compressed) */}
              <div className="p-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700 font-medium">
                    <ImageIcon size={17} className="text-sky-600" />
                    <span>Attach images (max 5, JPG, PNG, WebP)</span>
                  </div>
                  <label className={`px-3 py-1.5 rounded-lg border border-sky-300 bg-white text-xs sm:text-sm font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                    replyAttachments.length >= 5 || isCompressingReply ? 'opacity-50 pointer-events-none' : ''
                  }`}>
                    {isCompressingReply ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-sky-600" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <span>Add Images ({replyAttachments.length}/5)</span>
                    )}
                    <input 
                      ref={replyFileInputRef}
                      type="file" 
                      accept="image/png,image/jpeg,image/jpg,image/webp" 
                      multiple
                      disabled={replyAttachments.length >= 5 || isCompressingReply}
                      onChange={handleReplyImagesChange} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {replyError && (
                  <p className="mt-2 text-xs sm:text-sm text-red-600 font-medium">
                    {replyError}
                  </p>
                )}

                {replyAttachments.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {replyAttachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0" />
                          <div className="min-w-0">
                            <span className="truncate block font-semibold text-stone-800 text-xs sm:text-sm">{att.name}</span>
                            <span className="text-xs text-stone-400">{formatFileSize(att.size)}</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeReplyAttachment(idx)}
                          className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs sm:text-sm text-stone-500">
                  Replying as: <strong className="text-stone-800 font-semibold">{isAdminUser ? (currentUser?.name || 'Support Engineer') : (ticket.requester?.name || 'Authorized User')}</strong>
                </div>
                <button
                  type="submit"
                  disabled={(!replyText.trim() && replyAttachments.length === 0) || isSubmitting || isCompressingReply}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
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
              const messageAttachments = msg.attachments || (msg.id === 'initial' || msg.id === allMessages[0]?.id ? ticket.attachments : null);

              return (
                <div 
                  key={msg.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-stone-50/80 px-5 py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar Circle with Initials (matching outside style) */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0 shadow-2xs ring-2 ring-stone-200/80"
                        style={{ 
                          backgroundColor: isAgent 
                            ? '#2563eb' 
                            : (ticket.requester?.avatarColor || '#ec5137') 
                        }}
                      >
                        {(msg.authorName || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm sm:text-base font-bold text-stone-900">
                            {msg.authorName}
                          </span>
                          {msg.badge && (
                            <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              isAgent 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}>
                              {msg.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {msg.subRole || msg.email || ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-stone-400 font-sans">
                      {(() => {
                        const raw = msg.createdAt || msg.timestamp;
                        if (!raw) return 'Recently';
                        if (typeof raw === 'string' && (raw.includes('ago') || raw.includes('Just now') || raw.includes('Today') || raw.includes('Yesterday'))) {
                          return raw;
                        }
                        const d = new Date(raw);
                        if (!isNaN(d.getTime())) {
                          const datePart = d.toLocaleDateString(undefined, {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                          });
                          const timePart = d.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                          return `${datePart}, ${timePart}`;
                        }
                        return String(raw);
                      })()}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-6 text-sm sm:text-[15px] text-stone-800 font-normal leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </div>

                  {/* Message Attachments (Image Gallery) */}
                  {messageAttachments && messageAttachments.length > 0 && (
                    <div className="px-5 pb-5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Paperclip size={12} />
                        <span>Attached Images ({messageAttachments.length})</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {messageAttachments.map((att, attIdx) => {
                          const isObj = typeof att === 'object';
                          const name = isObj ? att.name : att;
                          const url = isObj ? att.url : null;
                          const size = isObj ? formatFileSize(att.size) : null;

                          return (
                            <div 
                              key={attIdx} 
                              className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 hover:shadow-xs transition-shadow"
                            >
                              {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden bg-slate-100">
                                  <img 
                                    src={url} 
                                    alt={name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                  />
                                </a>
                              ) : (
                                <div className="aspect-video flex items-center justify-center bg-slate-100 text-slate-400">
                                  <ImageIcon size={24} />
                                </div>
                              )}
                              <div className="p-1.5 bg-white border-t border-slate-100">
                                <p className="text-[11px] font-medium text-slate-800 truncate" title={name}>
                                  {name}
                                </p>
                                {size && (
                                  <p className="text-[10px] text-slate-400">{size}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Close Ticket Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-stone-800">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-[#ec5137]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Close Ticket #{ticket.id}?
                </h3>
                <p className="text-xs text-stone-500">
                  Mark this support ticket as resolved/closed.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              Are you sure you want to mark <strong className="text-stone-900">"{ticket.subject}"</strong> as closed? You will still be able to view the full discussion history at any time.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus('closed');
                  setShowCloseConfirm(false);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-stone-800 hover:bg-stone-900 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Yes, Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
