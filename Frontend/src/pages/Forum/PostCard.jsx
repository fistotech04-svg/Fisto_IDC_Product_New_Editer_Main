// Frontend/src/pages/Forum/PostCard.jsx
import React from 'react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Check, 
  Eye,
  Tag
} from 'lucide-react';

const categoryPills = {
  bug: 'bg-red-50 text-red-600 border-red-200',
  question: 'bg-blue-50 text-blue-600 border-blue-200',
  feature: 'bg-purple-50 text-purple-600 border-purple-200',
  performance: 'bg-amber-50 text-amber-600 border-amber-200'
};

const categoryNames = {
  bug: 'Bug',
  question: 'Question',
  feature: 'Feature Request',
  performance: 'Performance'
};

export default function PostCard({ post, onSelectPost, onVote, currentUserId }) {
  const isUpvoted = post.upvotedBy && post.upvotedBy.includes(currentUserId);
  const isDownvoted = post.downvotedBy && post.downvotedBy.includes(currentUserId);
  const isSolved = post.hasAcceptedSolution || post.status === 'resolved';
  const commentsCount = post.comments ? post.comments.length : 0;

  const handleUpvote = (e) => {
    e.stopPropagation();
    onVote(post.id, 1);
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    onVote(post.id, -1);
  };

  return (
    <article 
      onClick={() => onSelectPost(post)}
      className="group bg-white hover:bg-[#fafafc] border-b border-gray-200/80 p-5 transition-colors cursor-pointer flex items-start gap-4"
    >
      {/* 1. Reddit / StackOverflow Left Voting Bar */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="flex flex-col items-center bg-gray-50/80 rounded-xl p-1.5 border border-gray-200/60 flex-shrink-0"
      >
        <button
          onClick={handleUpvote}
          className={`p-1 rounded-md transition-colors cursor-pointer ${
            isUpvoted 
              ? 'text-[#ec5137] bg-orange-100/70' 
              : 'text-gray-400 hover:text-[#ec5137] hover:bg-gray-100'
          }`}
          title="Upvote"
        >
          <ArrowBigUp size={22} className={isUpvoted ? 'fill-current' : ''} />
        </button>

        <span className={`text-sm font-bold my-0.5 select-none ${
          isUpvoted 
            ? 'text-[#ec5137]' 
            : isDownvoted 
              ? 'text-blue-600' 
              : 'text-gray-700'
        }`}>
          {post.votes ?? (post.upvotes || 0)}
        </span>

        <button
          onClick={handleDownvote}
          className={`p-1 rounded-md transition-colors cursor-pointer ${
            isDownvoted 
              ? 'text-blue-600 bg-blue-100/70' 
              : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
          }`}
          title="Downvote"
        >
          <ArrowBigDown size={22} className={isDownvoted ? 'fill-current' : ''} />
        </button>
      </div>

      {/* 2. StackOverflow Answers Count Box */}
      <div className="flex-shrink-0 hidden sm:flex flex-col items-center justify-center">
        <div 
          className={`w-16 py-2 rounded-xl flex flex-col items-center justify-center text-center border transition-all ${
            isSolved 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold' 
              : commentsCount > 0 
                ? 'bg-white border-gray-300 text-gray-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400'
          }`}
          title={isSolved ? 'Has accepted answer' : `${commentsCount} answers`}
        >
          <div className="flex items-center gap-1 text-sm font-bold">
            {isSolved && <Check size={14} className="text-emerald-600" />}
            <span>{commentsCount}</span>
          </div>
          <span className="text-[11px] font-medium leading-none mt-0.5">
            {commentsCount === 1 ? 'answer' : 'answers'}
          </span>
        </div>
      </div>

      {/* 3. Main Question / Content Area */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-gray-950 group-hover:text-[#ec5137] transition-colors leading-snug">
          {post.title}
        </h2>

        {/* Snippet (Reddit / StackOverflow body excerpt) */}
        <p className="text-sm text-gray-600 line-clamp-2 mt-1.5 leading-relaxed">
          {post.description}
        </p>

        {/* Bottom Metadata & Tags (StackOverflow / Reddit style) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-1">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category tag */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
              categoryPills[post.category] || 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {categoryNames[post.category] || post.category}
            </span>

            {/* Custom tags */}
            {post.tags && post.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200/80 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author info & engagement (Reddit/SO author box) */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {/* Mobile comments count fallback */}
            <div className="sm:hidden flex items-center gap-1 font-semibold text-gray-700">
              <MessageSquare size={14} />
              <span>{commentsCount}</span>
            </div>

            {/* Views */}
            <div className="hidden md:flex items-center gap-1 text-gray-400">
              <Eye size={14} />
              <span>{post.views || 0} views</span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs"
                style={{ backgroundColor: post.author.avatarColor || '#ec5137' }}
              >
                {post.author.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-medium text-gray-800">
                {post.author.username ? `u/${post.author.username}` : post.author.name}
              </span>
              <span className="text-gray-400">• {post.createdAt}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
