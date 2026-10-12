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

  // Modals
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
    <div className="flex h-full w-full bg-[#f6f7f8] overflow-hidden">
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
                {activeModule.name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {filteredTickets.length} tickets
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Submit, track, and manage your technical support requests
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket # or subject..."
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded-xl w-48 sm:w-64 focus:outline-none focus:border-[#ec5137] transition-all"
              />
            </div>

            {/* Status Pills */}
            <div className="hidden sm:flex items-center p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'open' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'in_progress' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Resolved
              </button>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-medium bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:border-[#ec5137] cursor-pointer"
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
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <Plus size={16} />
              <span>Raise Ticket</span>
            </button>
          </div>
        </header>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onSelectTicket={setSelectedTicket}
                />
              ))
            ) : (
              <div className="py-16 text-center text-gray-500">
                <p className="text-base font-semibold text-gray-800">
                  No tickets found in this view.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Encountering a bug or need dedicated technical support?
                </p>
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer"
                >
                  Raise a new support ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onSubmit={handleRaiseTicket}
        defaultModuleId={selectedModuleId}
        currentUser={currentUser}
      />

      {/* Ticket Detail Modal */}
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
