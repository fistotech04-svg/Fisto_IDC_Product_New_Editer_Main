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
import { POST_STATUS_CONFIG } from './forumData';

export default function PostCard({ post, onSelectPost }) {
  const commentsCount = post.comments ? post.comments.length : 0;
  const sameQuestionCount = post.sameQuestionUsers ? post.sameQuestionUsers.length : 0;
  const authorInitials = post.author?.initials || (post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U');
  const avatarColor = post.author?.avatarColor || '#ec5137';
  const isSuggestion = post.postType === 'suggestion';
  const statusInfo = POST_STATUS_CONFIG[post.status] || POST_STATUS_CONFIG.awaiting_admin;

  const typeClass = isSuggestion
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-orange-50 text-[#c23d26] border-orange-200';

  const statusBorderClass = statusInfo.border || 'border-stone-200';
  const statusClass = `${statusInfo.bg} ${statusInfo.text} ${statusBorderClass}`;

  return (
    <article
      onClick={() => onSelectPost(post)}
      className="group bg-white hover:bg-[#fff9f8] p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-[#ec5137]/40 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm"
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
              <span className="text-stone-500 font-normal shrink-0 text-xs">{post.createdAt}</span>
            </div>

            {/* Structured Metadata Tags: Stays clean and uncrowded */}
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

              {/* Module Tag */}
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 bg-stone-100/80 border border-stone-200/80">
                <BookOpen size={11} className="text-stone-500" />
                <span>{post.moduleName}</span>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusClass}`}>
                <span>{statusInfo.label}</span>
              </div>

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

          {/* Clean Footer Metadata */}
          <div className="flex items-center justify-between pt-3 mt-3 text-xs sm:text-sm text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-500 font-normal text-xs">
              <Clock size={12} />
              <span>Updated {post.updatedAt || post.createdAt}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* "Same Question" Relevance Count */}
              <span 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 group-hover:bg-white text-stone-700 border border-stone-200/80 text-xs font-medium"
                title="Users who have this question too"
              >
                <ThumbsUp size={12} className="text-[#ec5137]" />
                <span>{sameQuestionCount}</span>
              </span>

              {/* Comments Count */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 group-hover:bg-white text-stone-700 border border-stone-200/80 text-xs font-medium">
                <MessageSquare size={12} className="text-[#ec5137]" />
                <span>{commentsCount}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
