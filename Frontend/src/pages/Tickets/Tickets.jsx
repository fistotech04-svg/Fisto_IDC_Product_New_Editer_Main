// Frontend/src/pages/Tickets/Tickets.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  LifeBuoy, 
  CheckCircle2, 
  Clock, 
  Inbox,
  Filter
} from 'lucide-react';
import TicketSidebar from './TicketSidebar';
import TicketCard from './TicketCard';
import RaiseTicketModal from './RaiseTicketModal';
import TicketDetailModal from './TicketDetailModal';
import { 
  TICKET_MODULES, 
  TICKET_STATUSES, 
  TICKET_PRIORITIES, 
  getStoredTickets, 
  saveStoredTickets 
} from './ticketData';
import { useToast } from '../../components/CustomToast';

export default function Tickets() {
  const [tickets, setTickets] = useState(() => getStoredTickets());
  const [selectedModuleId, setSelectedModuleId] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active ticket
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const toast = useToast();

  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  // Sync to storage
  useEffect(() => {
    saveStoredTickets(tickets);
  }, [tickets]);

  // Counts by module
  const ticketCounts = useMemo(() => {
    const counts = { all: tickets.length };
    TICKET_MODULES.forEach(m => {
      if (m.id !== 'all') {
        counts[m.id] = tickets.filter(t => t.moduleId === m.id).length;
      }
    });
    return counts;
  }, [tickets]);

  const activeModule = useMemo(() => {
    return TICKET_MODULES.find(m => m.id === selectedModuleId) || TICKET_MODULES[0];
  }, [selectedModuleId]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Module filter
      if (selectedModuleId !== 'all' && t.moduleId !== selectedModuleId) return false;

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inId = t.id?.toLowerCase().includes(q);
        const inSubj = t.subject?.toLowerCase().includes(q);
        const inReq = t.requester?.name?.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q);
        if (!inId && !inSubj && !inReq && !inDesc) return false;
      }
      return true;
    });
  }, [tickets, selectedModuleId, statusFilter, priorityFilter, searchQuery]);

  // Create ticket
  const handleRaiseTicket = (newTicket) => {
    setTickets([newTicket, ...tickets]);
    if (toast?.showToast) {
      toast.showToast(`Ticket #${newTicket.id} raised successfully!`, 'success');
    }
  };

  // Add message to ticket
  const handleAddMessage = (ticketId, message) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            updatedAt: 'Just now',
            messages: [...(t.messages || []), message]
          };
          if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(updated);
          }
          return updated;
        }
        return t;
      })
    );
    if (toast?.showToast) {
      toast.showToast('Message sent to support', 'success');
    }
  };

  // Update status
  const handleUpdateStatus = (ticketId, newStatus) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            status: newStatus,
            updatedAt: 'Just now'
          };
          if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(updated);
          }
          return updated;
        }
        return t;
      })
    );
    if (toast?.showToast) {
      toast.showToast(`Ticket status changed to ${newStatus}`, 'success');
    }
  };

  return (
    <div className="flex h-full w-full bg-[#fbfbfb] overflow-hidden">
      {/* 1. Left Sidebar with Minimise Option */}
      <TicketSidebar
        selectedModuleId={selectedModuleId}
        onSelectModule={(modId) => {
          setSelectedModuleId(modId);
          setSearchQuery('');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        ticketCounts={ticketCounts}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {activeModule.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5 font-normal">
              Direct technical inquiry, escalation and incident resolution
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket # or subject..."
                className="pl-9 pr-3 py-2 text-sm bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all text-stone-800 placeholder:text-stone-400"
              />
            </div>

            {/* Status Pills */}
            <div className="hidden sm:flex items-center p-1 bg-stone-100/80 rounded-xl text-xs font-medium border border-stone-200/60">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-stone-900 font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'open' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('answered')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'answered' ? 'bg-white text-emerald-700 font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Answered
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'in_progress' ? 'bg-white text-purple-700 font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-white text-stone-900 font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Resolved
              </button>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-medium bg-white border border-stone-300 rounded-xl text-stone-700 focus:outline-none focus:border-[#ec5137] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Raise Ticket Primary Button */}
            <button
              onClick={() => setIsRaiseModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
            >
              <Plus size={16} />
              <span>Raise Ticket</span>
            </button>
          </div>
        </header>

        {/* Ticket List - Full Width Container (No max-w restriction) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full space-y-3.5">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onSelectTicket={setSelectedTicket}
                />
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ec5137] flex items-center justify-center mx-auto mb-3">
                  <LifeBuoy size={24} />
                </div>
                <p className="text-base font-bold text-stone-900">
                  No tickets found in this view.
                </p>
                <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto font-normal">
                  No matching support tickets under this filter. If you're experiencing a problem, our engineering support team is here to assist.
                </p>
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  Raise a new support ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raise Ticket Full-Width View / Modal */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onSubmit={handleRaiseTicket}
        defaultModuleId={selectedModuleId}
        currentUser={currentUser}
      />

      {/* Ticket Detail Full-Width View / Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onAddMessage={handleAddMessage}
        onUpdateStatus={handleUpdateStatus}
        currentUser={currentUser}
      />
    </div>
  );
}
