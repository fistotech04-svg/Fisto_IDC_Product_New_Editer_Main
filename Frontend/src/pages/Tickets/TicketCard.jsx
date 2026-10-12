// Frontend/src/pages/Tickets/TicketCard.jsx
import React from 'react';
import { 
  MessageSquare, 
  Paperclip, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './ticketData';

export default function TicketCard({ ticket, onSelectTicket }) {
  const priorityObj = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || TICKET_PRIORITIES[1];
  const statusObj = TICKET_STATUSES.find(s => s.id === ticket.status) || TICKET_STATUSES[1];
  const messageCount = ticket.messages ? ticket.messages.length : 0;
  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;

  return (
    <div 
      onClick={() => onSelectTicket(ticket)}
      className="group bg-white hover:bg-[#fafafc] border-b border-gray-200/80 p-4 sm:p-5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      {/* Left Details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Ticket ID Tag */}
        <span className="text-xs font-mono font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-700 flex-shrink-0 group-hover:bg-gray-200 transition-colors">
          #{ticket.id}
        </span>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-gray-950 group-hover:text-[#ec5137] transition-colors truncate">
              {ticket.subject}
            </h3>

            {/* Department / Module Pill */}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 flex-shrink-0">
              {ticket.moduleName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            <span className="text-gray-600 font-medium">Raised by {ticket.requester?.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {ticket.createdAt}
            </span>
            {hasAttachments && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Paperclip size={12} />
                  {ticket.attachments.length} file
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Badges: Priority, Status, Messages */}
      <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
        {/* Priority Badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${priorityObj.color}`}>
          {priorityObj.label}
        </span>

        {/* Status Badge */}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${statusObj.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
          {statusObj.label}
        </span>

        {/* Message replies count */}
        <div className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
          <MessageSquare size={13} className="text-gray-400" />
          <span className="font-bold">{messageCount}</span>
        </div>
      </div>
    </div>
  );
}
