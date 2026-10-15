import { 
  Paperclip, 
  Clock, 
  ChevronRight,
  Trash2,
  CheckCircle2,
  CircleDot,
  MessageSquare
} from 'lucide-react';
import { TICKET_MODULES } from './ticketData';

export default function TicketCard({ ticket, onSelectTicket, onDeleteTicket }) {
  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
  const hasAttachments = ticket.attachments && ticket.attachments.length > 0;
  const messageCount = (ticket.messages && ticket.messages.length) || 1;

  // Find module details for visual indicator
  const moduleInfo = TICKET_MODULES.find(m => m.id === ticket.moduleId) || {
    name: ticket.department || ticket.moduleName || 'General',
    color: '#64748b'
  };

  // Check if admin/staff has already replied
  // A ticket can only be cancelled/withdrawn before an admin/staff reply has been made
  const hasAdminReplied = Boolean(
    ticket.messages && 
    ticket.messages.some(m => m.sender === 'agent' || m.sender === 'staff' || m.sender === 'admin')
  );

  return (
    <article 
      onClick={() => onSelectTicket(ticket)}
      className="group relative bg-white hover:bg-[#fffcfb] p-5 sm:p-6 rounded-2xl border border-stone-200/90 hover:border-[#ec5137]/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-2.5">
          
          {/* Top Row: Ticket ID, Module badge, Created timestamp */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-800 text-xs tracking-wide group-hover:bg-orange-100/80 group-hover:text-[#c23d26] transition-colors">
              #{ticket.id}
            </span>

            {/* Department / Module Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-stone-100/90 text-stone-700 border border-stone-200/70">
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: moduleInfo.color }}
              />
              <span className="truncate max-w-[140px]">{ticket.department || ticket.moduleName || moduleInfo.name}</span>
            </span>

            <span className="text-stone-300 hidden sm:inline">•</span>

            <span className="text-stone-400 font-normal text-xs flex items-center gap-1">
              <Clock size={12} className="text-stone-400 shrink-0" />
              <span>{ticket.createdAt || ticket.submittedAt || 'Recently'}</span>
            </span>
          </div>

          {/* Ticket Subject */}
          <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#ec5137] transition-colors leading-snug">
            {ticket.subject}
          </h3>

          {/* Description Preview */}
          {ticket.description && (
            <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed font-normal">
              {ticket.description}
            </p>
          )}

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="text-stone-400 font-normal">Last activity:</span>
              <strong className="font-semibold text-stone-700">
                {ticket.updatedAt || ticket.lastUpdated || ticket.createdAt || 'Just now'}
              </strong>
            </span>

            <span className="text-stone-300 hidden sm:inline">•</span>

            {/* Conversation Messages Count */}
            <span className="flex items-center gap-1.5 text-stone-600">
              <MessageSquare size={13} className="text-stone-400" />
              <span>{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
            </span>

            {/* Attachments indicator */}
            {hasAttachments && (
              <>
                <span className="text-stone-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5 text-stone-600 font-medium">
                  <Paperclip size={13} className="text-stone-400" />
                  <span>{ticket.attachments.length} attachment{ticket.attachments.length > 1 ? 's' : ''}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Action / Status Column */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-stone-100 sm:min-w-[130px]">
          
          {/* Status Indicator */}
          {isClosed ? (
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200/80 shadow-2xs"
              title="Status: Closed"
            >
              <CheckCircle2 size={15} className="text-stone-400" />
              <span>Closed</span>
            </div>
          ) : (
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
              title="Status: Open"
            >
              <CircleDot size={15} className="text-emerald-500 animate-pulse" />
              <span>Open</span>
            </div>
          )}

          {/* Bottom Actions: Cancel or View link */}
          <div className="flex items-center gap-2 sm:mt-auto">
            {/* Cancel Ticket Action: Only available before admin has replied */}
            {onDeleteTicket && !hasAdminReplied && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTicket(ticket);
                }}
                className="opacity-70 group-hover:opacity-100 text-stone-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                title="Cancel this ticket before support team replies"
              >
                <Trash2 size={13} />
                <span>Cancel</span>
              </button>
            )}

            {/* View Arrow Button */}
            <div className="w-8 h-8 rounded-xl bg-stone-50 group-hover:bg-[#ec5137] text-stone-400 group-hover:text-white flex items-center justify-center transition-all duration-150 shadow-2xs">
              <ChevronRight size={16} />
            </div>
          </div>

        </div>

      </div>
    </article>
  );
}
