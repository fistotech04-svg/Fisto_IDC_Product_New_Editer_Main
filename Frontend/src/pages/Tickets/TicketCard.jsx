import React from 'react';
import { 
  MessageSquare, 
  Paperclip, 
  Clock, 
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './ticketData';

export default function TicketCard({ ticket, onSelectTicket }) {
  const priorityObj = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || TICKET_PRIORITIES[1];
  const statusObj = TICKET_STATUSES.find(s => s.id === ticket.status) || TICKET_STATUSES[1];
  const messageCount = ticket.messages ? ticket.messages.length : 0;
  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;

  const requesterName = ticket.requester?.name || 'User';
  const authorInitials = ticket.requester?.initials || requesterName.slice(0, 2).toUpperCase();
  const avatarColor = ticket.requester?.avatarColor || '#ec5137';

  return (
    <article 
      onClick={() => onSelectTicket(ticket)}
      className="group bg-white hover:bg-[#fff9f8] p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-[#ec5137]/40 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Requester Avatar Circle */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-xs ring-2 ring-orange-100/80"
          style={{ backgroundColor: avatarColor }}
        >
          {authorInitials}
        </div>

        {/* Main Content Details */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Requester & ID on Left, Structured Tags on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 truncate min-w-0">
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs shrink-0 group-hover:bg-orange-100/70 group-hover:text-[#c23d26] transition-colors">
                #{ticket.id}
              </span>
              <span className="font-semibold text-stone-900 truncate">{requesterName}</span>
              {ticket.requester?.badge && (
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-white font-normal">
                  {ticket.requester.badge}
                </span>
              )}
              <span className="text-stone-300">•</span>
              <span className="text-stone-500 font-normal shrink-0 text-xs flex items-center gap-1">
                <Clock size={11} />
                {ticket.createdAt || ticket.submittedAt || 'Recently'}
              </span>
            </div>

            {/* Structured Tags on Right */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
              {/* Department / Module Tag */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-700 bg-stone-100/80 border border-stone-200/80">
                <LifeBuoy size={11} className="text-[#ec5137]" />
                <span>{ticket.department || ticket.moduleName}</span>
              </div>

              {/* Priority Tag */}
              <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${priorityObj.color}`}>
                <span>{priorityObj.label} Priority</span>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${statusObj.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
                <span>{statusObj.label}</span>
              </div>

              {/* Navigation Chevron */}
              <div className="hidden sm:block text-stone-300 group-hover:text-[#ec5137] transition-colors ml-0.5">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Ticket Subject */}
          <h3 className="text-base sm:text-[17px] font-semibold text-stone-900 group-hover:text-[#ec5137] transition-colors leading-snug">
            {ticket.subject}
          </h3>

          {/* Description Preview */}
          {ticket.description && (
            <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
              {ticket.description}
            </p>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-3 mt-3 text-xs text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-3 text-stone-500 font-normal text-xs">
              <span>Updated {ticket.updatedAt || ticket.lastUpdated || ticket.createdAt || 'Just now'}</span>
              {hasAttachments && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="flex items-center gap-1 text-stone-600">
                    <Paperclip size={12} />
                    {ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 group-hover:bg-white text-stone-700 border border-stone-200/80 text-xs font-medium">
                <MessageSquare size={12} className="text-[#ec5137]" />
                <span>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
