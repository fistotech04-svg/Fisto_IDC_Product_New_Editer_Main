// Frontend/src/pages/Forum/PostCard.jsx
import React from 'react';
import { 
  MessageSquare, 
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ThumbsUp,
  Clock,
  BookOpen
} from 'lucide-react';
import { POST_STATUS_CONFIG, formatForumDate } from './forumData';

export default function PostCard({ post, onSelectPost, isAdmin = false }) {
  const authorInitials = post.author?.initials || (post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U');
  const avatarColor = post.author?.avatarColor || '#ec5137';
  const isSuggestion = post.postType === 'suggestion';
  const statusInfo = POST_STATUS_CONFIG[post.status] || POST_STATUS_CONFIG.awaiting_admin;

  const typeClass = isSuggestion
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-orange-50 text-[#c23d26] border-orange-200';

  const statusBorderClass = statusInfo.border || 'border-stone-200';
  const statusClass = `${statusInfo.bg} ${statusInfo.text} ${statusBorderClass}`;

  // Assemble full conversation items:
  // 1. Initial admin reply (if present)
  // 2. Each follow-up: author follow-up + admin reply to that follow-up
  const conversationItems = [];
  if (post.adminReply) {
    conversationItems.push({
      id: post.adminReply.id || 'admin-initial',
      role: 'admin',
      author: post.adminReply.author?.name || 'Flipibook Team',
      initials: post.adminReply.author?.initials || 'AD',
      avatarColor: post.adminReply.author?.avatarColor || '#ec5137',
      content: post.adminReply.content,
      createdAt: post.adminReply.createdAt
    });
  }

  if (Array.isArray(post.authorFollowUps)) {
    post.authorFollowUps.forEach((fu, idx) => {
      // Author follow-up
      conversationItems.push({
        id: fu.id || `fu-${idx}`,
        role: 'user',
        author: fu.author?.name || post.author?.name || 'Author',
        initials: fu.author?.initials || authorInitials,
        avatarColor: fu.author?.avatarColor || avatarColor,
        content: fu.question,
        createdAt: fu.createdAt
      });

      // Admin reply to that follow-up
      if (fu.adminReply) {
        conversationItems.push({
          id: fu.adminReply.id || `admin-fu-${idx}`,
          role: 'admin',
          author: fu.adminReply.author?.name || 'Flipibook Team',
          initials: fu.adminReply.author?.initials || 'AD',
          avatarColor: fu.adminReply.author?.avatarColor || '#ec5137',
          content: fu.adminReply.content,
          createdAt: fu.adminReply.createdAt
        });
      }
    });
  }

  const totalConversations = conversationItems.length;
  const visibleConversations = conversationItems.slice(0, 2);
  const hasMoreConversations = totalConversations > 2;

  return (
    <article
      onClick={() => onSelectPost(post)}
      className="group bg-white hover:bg-[#fffdfd] p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-[#ec5137]/40 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* 1. Fully Circle Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-xs ring-2 ring-orange-100/80"
          style={{ backgroundColor: avatarColor }}
        >
          {authorInitials}
        </div>

        {/* 2. Main Post Content */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Author & Time on Left, Clean Structured Tags on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            {/* Author Attribution */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 truncate min-w-0">
              <span className="font-semibold text-stone-900 truncate">{post.author?.name}</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500 font-normal shrink-0 text-xs">{formatForumDate(post.createdAt)}</span>
            </div>

            {/* Structured Metadata Tags */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
              {/* Type Tag */}
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${typeClass}`}>
                {isSuggestion ? (
                  <Lightbulb size={12} className="text-amber-600" />
                ) : (
                  <HelpCircle size={12} className="text-[#ec5137]" />
                )}
                <span>{isSuggestion ? 'Suggestion' : 'Question'}</span>
              </div>

              {/* Status Badge: only for Admin */}
              {isAdmin && (
                <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusClass}`}>
                  <span>{statusInfo.label}</span>
                </div>
              )}

              {/* Subtle navigation cue */}
              <div className="hidden sm:block text-stone-300 group-hover:text-[#ec5137] transition-colors ml-0.5">
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-[17px] font-semibold text-stone-900 group-hover:text-[#ec5137] transition-colors leading-snug">
            {post.title}
          </h3>

          {/* Description directly follows Title */}
          <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {post.description}
          </p>

          {/* Conversation Thread in the Card: Upto 2 replies shown */}
          {visibleConversations.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-stone-100 space-y-2">
              <div className="text-[11px] font-semibold tracking-wide uppercase text-stone-400 flex items-center gap-1">
                <MessageSquare size={12} className="text-[#ec5137]" />
                <span>Replies & Discussion</span>
              </div>

              <div className="space-y-2">
                {visibleConversations.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-2.5 rounded-xl border text-xs ${
                      item.role === 'admin' 
                        ? 'bg-orange-50/50 border-orange-100 text-stone-800' 
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                          style={{ backgroundColor: item.avatarColor }}
                        >
                          {item.initials}
                        </span>
                        <span className="font-semibold text-stone-800">{item.author}</span>
                        {item.role === 'admin' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-orange-100 text-[#c23d26]">
                            Admin
                          </span>
                        )}
                      </div>
                      {item.createdAt && (
                        <span className="text-[10px] text-stone-400 font-normal">
                          {formatForumDate(item.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-stone-700 pl-5.5 leading-relaxed font-normal">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* View More Link if more than 2 replies */}
              {hasMoreConversations && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPost(post);
                    }}
                    className="text-xs font-semibold text-[#ec5137] hover:text-[#c23d26] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View full history ({totalConversations} replies)</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clean Footer Metadata */}
          <div className="flex items-center justify-between pt-3 mt-3 text-xs sm:text-sm text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500 font-normal text-xs">
              <Clock size={12} />
              <span>Updated {formatForumDate(post.updatedAt || post.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Conversation reply count */}
              {totalConversations > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 group-hover:bg-white text-stone-700 border border-stone-200/80 text-xs font-medium">
                  <MessageSquare size={12} className="text-[#ec5137]" />
                  <span>{totalConversations} {totalConversations === 1 ? 'reply' : 'replies'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
