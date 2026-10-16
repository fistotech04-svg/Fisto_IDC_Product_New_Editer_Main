import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  LifeBuoy,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  CircleDot,
  Layers,
  X,
  AlertTriangle,
  RotateCcw,
  Paperclip,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Trash2,
  ShieldCheck,
  User,
  Loader2
} from 'lucide-react';
import RaiseTicketModal from './RaiseTicketModal';
import { 
  TICKET_MODULES,
  getStoredTickets, 
  saveStoredTickets 
} from './ticketData';
import { 
  fetchTickets, 
  cancelTicketApi 
} from './ticketApi';
import { useToast } from '../../components/CustomToast';

export default function Tickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'closed'
  const [categoryFilter, setCategoryFilter] = useState('all'); // module ID
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const getResolvedUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
      return { ...u, ...p };
    } catch (e) {
      return null;
    }
  };

  const [currentUser, setCurrentUser] = useState(() => getResolvedUser());

  // Listen to profile updates (e.g. login/switch profile)
  useEffect(() => {
    const handleProfileUpdate = () => {
      setCurrentUser(getResolvedUser());
    };
    window.addEventListener('profileUpdate', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdate', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  // Admin detection matching Forum & Backend logic
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

  // Load tickets from backend with fallback to localStorage
  const loadTicketsFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const email = currentUser?.email || currentUser?.emailId || '';
      // If admin, do not scope query to single user email so all tickets are returned
      const res = await fetchTickets({
        isAdmin: isAdminUser,
        email: isAdminUser ? undefined : email,
        limit: 100
      });

      if (res && res.success && Array.isArray(res.data)) {
        setTickets(res.data);
        saveStoredTickets(res.data);
      }
    } catch (err) {
      console.warn('[Tickets] Backend unreachable or error, using local tickets:', err);
      setTickets(getStoredTickets());
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, [isAdminUser, currentUser]);

  useEffect(() => {
    loadTicketsFromBackend();
  }, [loadTicketsFromBackend]);

  // Check URL query parameters (e.g. /tickets?raise=1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('raise') === '1') {
        setIsRaiseModalOpen(true);
      }
    } catch (e) {}
  }, [location.search]);

  // Listen for background sync updates when ticket is created
  useEffect(() => {
    const handleSync = (e) => {
      const { tempId, ticket: backendTicket } = e.detail || {};
      if (tempId && backendTicket) {
        setTickets(prev => {
          const updated = prev.map(t => (t.id === tempId ? backendTicket : t));
          saveStoredTickets(updated);
          return updated;
        });
      }
    };
    window.addEventListener('ticketCreatedSync', handleSync);
    return () => window.removeEventListener('ticketCreatedSync', handleSync);
  }, []);

  // Sync to storage
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      saveStoredTickets(tickets);
    }
  }, [tickets]);

  // Compute counts (Total, Open, Closed)
  const counts = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
    return { total, open, closed };
  }, [tickets]);

  // Date parsing helper to evaluate date filters
  const matchesDateFilter = (ticket, filter) => {
    if (filter === 'all') return true;

    const dateStr = (ticket.createdAt || ticket.submittedAt || '').toLowerCase();
    const now = new Date();

    if (filter === 'today') {
      if (dateStr.includes('just now') || dateStr.includes('today') || dateStr.includes('hour') || dateStr.includes('min')) {
        return true;
      }
      const parsed = new Date(ticket.createdAt);
      if (!isNaN(parsed.getTime())) {
        return parsed.toDateString() === now.toDateString();
      }
      return false;
    }

    if (filter === 'week') {
      if (dateStr.includes('just now') || dateStr.includes('today') || dateStr.includes('yesterday') || dateStr.includes('hour') || dateStr.includes('min')) {
        return true;
      }
      const matchDays = dateStr.match(/(\d+)\s*days?\s*ago/);
      if (matchDays && parseInt(matchDays[1], 10) <= 7) return true;

      const parsed = new Date(ticket.createdAt);
      if (!isNaN(parsed.getTime())) {
        const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      return false;
    }

    if (filter === 'month') {
      if (dateStr.includes('just now') || dateStr.includes('today') || dateStr.includes('yesterday') || dateStr.includes('day') || dateStr.includes('hour')) {
        return true;
      }
      const matchDays = dateStr.match(/(\d+)\s*days?\s*ago/);
      if (matchDays && parseInt(matchDays[1], 10) <= 30) return true;

      const parsed = new Date(ticket.createdAt);
      if (!isNaN(parsed.getTime())) {
        const diffDays = (now.getTime() - parsed.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return false;
    }

    if (filter === 'custom') {
      if (!customDate) return true;
      const targetDate = new Date(customDate).toDateString();
      const parsed = new Date(ticket.createdAt || ticket.submittedAt);
      if (!isNaN(parsed.getTime())) {
        return parsed.toDateString() === targetDate;
      }
      return false;
    }

    return true;
  };

  // Filtered & sorted tickets (chronological, newest first)
  const filteredTickets = useMemo(() => {
    // If ticket has createdAt ISO, sort by real timestamp, else reverse order
    const list = [...tickets].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (dateA && dateB) return dateB - dateA;
      return 0;
    });

    return list.filter((ticket) => {
      // 1. Search query (matches ID, Subject, Description, Requester)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(ticket.id).toLowerCase().includes(q);
        const matchesSub = (ticket.subject || '').toLowerCase().includes(q);
        const matchesDesc = (ticket.description || '').toLowerCase().includes(q);
        const matchesRequester = (ticket.requester?.name || '').toLowerCase().includes(q) ||
                                 (ticket.requester?.email || '').toLowerCase().includes(q);
        if (!matchesId && !matchesSub && !matchesDesc && !matchesRequester) return false;
      }

      // 2. Status Tab filter: 'all' | 'open' | 'closed'
      if (statusFilter === 'open') {
        if (ticket.status === 'closed' || ticket.status === 'resolved') return false;
      } else if (statusFilter === 'closed') {
        if (ticket.status !== 'closed' && ticket.status !== 'resolved') return false;
      }

      // 3. Category/Module filter
      if (categoryFilter !== 'all') {
        const ticketMod = (ticket.moduleId || '').toLowerCase();
        const ticketDept = (ticket.department || ticket.moduleName || '').toLowerCase();
        const target = categoryFilter.toLowerCase();
        if (ticketMod !== target && !ticketDept.includes(target.replace('-', ' '))) {
          return false;
        }
      }

      // 4. Date Posted filter
      if (!matchesDateFilter(ticket, dateFilter)) {
        return false;
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, dateFilter, customDate]);

  // Create ticket
  const handleRaiseTicket = (newTicket) => {
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveStoredTickets(updated);
    if (toast?.showToast) {
      toast.showToast(`Ticket #${newTicket.id} raised successfully!`, 'success');
    }
    navigate(`/tickets/${newTicket.id}`);
  };

  // Delete / Cancel ticket handler
  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const ticketId = ticketToDelete.id;
    try {
      await cancelTicketApi(ticketId);
    } catch (e) {
      console.warn('Backend cancel failed, proceeding with local delete:', e);
    }
    const updated = tickets.filter(t => t.id !== ticketId);
    setTickets(updated);
    saveStoredTickets(updated);
    setTicketToDelete(null);
    if (toast?.showToast) {
      toast.showToast(`Ticket #${ticketId} cancelled and deleted`, 'info');
    }
  };

  const handleSelectTicket = (ticket) => {
    navigate(`/tickets/${ticket.id}`);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all' || customDate;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setCurrentPage(1);
  };

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, dateFilter, customDate]);

  // Paginated tickets calculation
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) || 1;
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fbfbfb]">
      {/* Top Header - Removed total count badge, shows Admin Status when in Admin Mode */}
      <header className="bg-[#fbfbfb] px-4 sm:px-6 lg:px-8 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Support Tickets
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal">
            Track and manage your support inquiries with Flipibook engineering
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {hasLoadedOnce && isLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
              <Loader2 size={13} className="animate-spin text-stone-600" />
              <span>Syncing...</span>
            </div>
          )}

          {/* Raise Ticket Primary Button */}
          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.99] shrink-0"
          >
            <Plus size={16} />
            <span>Raise Ticket</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Directly follows header without gap */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 pt-0 space-y-4">
        {/* Filter Area - White Card contained within the gray page, aligned with table width */}
        <div className="w-full bg-white rounded-2xl border border-stone-300 shadow-2xs p-3.5 sm:p-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
            
            {/* Status Segmented Tabs with Highlight Color #0f52bdcf */}
            <div className="flex items-center p-1 bg-stone-100/90 rounded-xl border border-stone-200/90 self-start sm:self-auto overflow-x-auto max-w-full shadow-2xs">
              <button
                onClick={() => setStatusFilter('all')}
                style={statusFilter === 'all' ? { backgroundColor: '#0f52bdcf', color: '#ffffff' } : {}}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'shadow-xs'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <Layers size={15} />
                <span>All Tickets</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                }`}>
                  {counts.total}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('open')}
                style={statusFilter === 'open' ? { backgroundColor: '#0f52bdcf', color: '#ffffff' } : {}}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === 'open'
                    ? 'shadow-xs'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <CircleDot size={15} className={statusFilter === 'open' ? 'text-white' : 'text-emerald-600'} />
                <span>Open</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  statusFilter === 'open' ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                }`}>
                  {counts.open}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('closed')}
                style={statusFilter === 'closed' ? { backgroundColor: '#0f52bdcf', color: '#ffffff' } : {}}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === 'closed'
                    ? 'shadow-xs'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <CheckCircle2 size={15} className={statusFilter === 'closed' ? 'text-white' : 'text-stone-600'} />
                <span>Closed</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  statusFilter === 'closed' ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-stone-600'
                }`}>
                  {counts.closed}
                </span>
              </button>
            </div>

            {/* Search Input & Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[220px] sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket # or subject..."
                  className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/30 focus:border-[#ec5137] text-stone-900 placeholder:text-stone-500 transition-all font-normal shadow-2xs h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category / Module Dropdown */}
              <div className="flex items-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 focus:outline-none focus:border-[#ec5137] cursor-pointer font-medium shadow-2xs h-10"
                  title="Filter by Category / Module"
                >
                  <option value="all">All Categories</option>
                  {TICKET_MODULES.filter(m => m.id !== 'all').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Posted Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-stone-900 focus:outline-none focus:border-[#ec5137] cursor-pointer font-medium shadow-2xs appearance-none h-10"
                    title="Filter by Date Posted"
                  >
                    <option value="all">Any time</option>
                    <option value="today">Today</option>
                    <option value="week">Past 7 days</option>
                    <option value="month">Past 30 days</option>
                    <option value="custom">Custom Date</option>
                  </select>
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                </div>

                {/* Custom Date Input */}
                {dateFilter === 'custom' && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-[#ec5137] cursor-pointer font-medium shadow-2xs h-10"
                      title="Choose a specific date"
                    />
                    {customDate && (
                      <button
                        type="button"
                        onClick={() => setCustomDate('')}
                        className="p-1 text-stone-500 hover:text-stone-800 rounded"
                        title="Clear custom date"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-stone-700 hover:text-[#ec5137] hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-1.5 font-medium cursor-pointer h-10 border border-transparent hover:border-orange-200"
                  title="Reset all filters"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Table View */}
        <div className="w-full">
          {!hasLoadedOnce && isLoading ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 size={32} className="animate-spin text-[#ec5137] mb-3" />
              <p className="text-sm font-semibold text-stone-700">Loading support tickets...</p>
              <p className="text-xs text-stone-400 mt-1">Retrieving latest tickets from server</p>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="bg-white rounded-2xl border border-stone-300 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-orange-200 bg-[#fff5f2] text-xs font-bold text-[#b83822] uppercase tracking-wider select-none divide-x divide-orange-100">
                      <th className="py-3.5 px-4 text-center whitespace-nowrap w-14">S.No</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Ticket ID</th>
                      {isAdminUser && (
                        <th className="py-3.5 px-4 whitespace-nowrap">Requester</th>
                      )}
                      <th className="py-3.5 px-4 whitespace-nowrap min-w-[280px]">Subject</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Date Raised</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Last Activity</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Messages</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Attachments</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {paginatedTickets.map((ticket, index) => {
                      const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
                      const messageCount = (ticket.messages && ticket.messages.length) || 1;
                      const attachmentCount = (ticket.attachments && ticket.attachments.length) || 0;
                      const hasAdminReplied = Boolean(
                        ticket.messages && 
                        ticket.messages.some(m => m.sender === 'agent' || m.sender === 'staff' || m.sender === 'admin')
                      );

                      const categoryName = ticket.department || ticket.moduleName || 'General';

                      // Helper to format date with time (e.g. "Oct 15, 2026, 6:15 PM" or "10/15/2026, 06:15 PM")
                      const formatDateTime = (rawVal) => {
                        if (!rawVal) return 'Recently';
                        if (typeof rawVal === 'string' && (rawVal.includes('ago') || rawVal.includes('Just now') || rawVal.includes('Today') || rawVal.includes('Yesterday'))) {
                          return rawVal;
                        }
                        const d = new Date(rawVal);
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
                        return String(rawVal);
                      };

                      const formatDateOnly = (rawVal) => {
                        if (!rawVal) return 'Recently';
                        if (typeof rawVal === 'string' && (rawVal.includes('ago') || rawVal.includes('Just now') || rawVal.includes('Today') || rawVal.includes('Yesterday'))) {
                          return rawVal;
                        }
                        const d = new Date(rawVal);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleDateString(undefined, { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          });
                        }
                        return String(rawVal);
                      };

                      const dateRaised = formatDateOnly(ticket.createdAt || ticket.submittedAt);
                      const lastActivity = formatDateTime(ticket.updatedAt || ticket.lastUpdated || ticket.createdAt || ticket.submittedAt);
                      const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                      const requesterName = ticket.requester?.name || 'User';
                      const requesterEmail = ticket.requester?.email || '';

                      return (
                        <tr 
                          key={ticket.id}
                          onClick={() => handleSelectTicket(ticket)}
                          className="hover:bg-orange-50/40 transition-colors cursor-pointer group divide-x divide-stone-200"
                        >
                          {/* S.No */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle text-sm font-medium text-stone-800">
                            {serialNumber}
                          </td>

                          {/* Ticket ID */}
                          <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                            <span className="font-mono text-sm font-medium text-stone-900 group-hover:text-[#ec5137] transition-colors">
                              #{ticket.id}
                            </span>
                          </td>

                          {/* Requester (Admin Mode only) */}
                          {isAdminUser && (
                            <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-stone-950">
                                  {requesterName}
                                </span>
                                {requesterEmail && (
                                  <span className="text-xs text-stone-700">
                                    {requesterEmail}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Subject & Description */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="max-w-md lg:max-w-xl">
                              <p className="text-sm sm:text-base font-semibold text-stone-950 group-hover:text-[#ec5137] transition-colors line-clamp-1">
                                {ticket.subject}
                              </p>
                              {ticket.description && (
                                <p className="text-xs sm:text-sm text-stone-700 line-clamp-1 mt-0.5 font-normal">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Category (Clean text without badge) */}
                          <td className="py-3.5 px-4 whitespace-nowrap align-middle text-sm text-stone-900 font-medium">
                            {categoryName}
                          </td>

                          {/* Date Ticket Raised */}
                          <td className="py-3.5 px-4 whitespace-nowrap align-middle text-sm text-stone-900 font-normal">
                            {dateRaised}
                          </td>

                          {/* Last Activity */}
                          <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                            <div className="flex flex-col text-sm text-stone-900">
                              <span className="font-medium text-stone-950">{lastActivity}</span>
                              <span className="text-xs text-stone-700">
                                {hasAdminReplied ? 'Staff reply' : (isAdminUser ? requesterName : 'by you')}
                              </span>
                            </div>
                          </td>

                          {/* Messages */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-stone-900">
                              <MessageSquare size={14} className="text-stone-700" />
                              <span>{messageCount}</span>
                            </span>
                          </td>

                          {/* Attachments */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-stone-900">
                              <Paperclip size={14} className="text-stone-700" />
                              <span>{attachmentCount}</span>
                            </span>
                          </td>

                          {/* Status (Icon + Dark Text, without badge pills) */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                            {isClosed ? (
                              <div className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-stone-800">
                                <CheckCircle2 size={16} className="text-stone-600" />
                                <span>Closed</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-800">
                                <CircleDot size={16} className="text-emerald-600 animate-pulse" />
                                <span>Open</span>
                              </div>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                            <div className="inline-flex items-center justify-center gap-2">
                              {!hasAdminReplied && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTicketToDelete(ticket);
                                  }}
                                  className="text-stone-700 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Withdraw / Cancel ticket"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                              <span className="text-stone-600 group-hover:text-[#ec5137] group-hover:translate-x-0.5 transition-all">
                                <ChevronRight size={17} />
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Count and Pagination */}
              <div className="py-3.5 px-6 bg-stone-100/70 border-t border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-stone-800 font-medium">
                <span>
                  Showing <strong className="font-semibold text-stone-950">
                    {filteredTickets.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                    -
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)}
                  </strong> of <strong className="font-semibold text-stone-950">{filteredTickets.length}</strong> tickets
                </span>
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:text-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#ec5137] text-white shadow-2xs'
                          : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:text-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ec5137] flex items-center justify-center mx-auto mb-3">
                <LifeBuoy size={24} />
              </div>
              <p className="text-base font-bold text-stone-900">
                {hasActiveFilters ? 'No matching tickets found' : (isAdminUser ? 'No support tickets in system' : 'No tickets found')}
              </p>
              <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto font-normal">
                {hasActiveFilters 
                  ? 'No support tickets match your current search, status, category, or date filters.' 
                  : (isAdminUser 
                      ? 'No user support tickets have been submitted yet. When users raise inquiries, they will appear here for review and reply.'
                      : "You haven't raised any support tickets yet. If you are experiencing an issue or need assistance, our engineering team is here to help.")}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="mt-5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  {isAdminUser ? 'Create Test Ticket' : 'Raise Ticket'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel / Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-[#ec5137]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Withdraw Ticket #{ticketToDelete.id}?
                </h3>
                <p className="text-xs text-stone-500">
                  Take back your inquiry before the support team replies.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              Are you sure you want to withdraw <strong className="text-stone-900">"{ticketToDelete.subject}"</strong>? Since the support team has not yet replied, this ticket will be cancelled and removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Keep Ticket
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Yes, Withdraw Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Ticket Form Modal */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onSubmit={handleRaiseTicket}
        currentUser={currentUser}
      />
    </div>
  );
}

