// Frontend/src/pages/Forum/PostDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  ArrowBigUp, 
  ArrowBigDown, 
  Check, 
  CheckCircle2, 
  Share2, 
  MessageSquare, 
  Eye, 
  Clock, 
  Tag
} from 'lucide-react';

export default function PostDetailModal({ 
  post, 
  isOpen, 
  onClose, 
  onVotePost, 
  onVoteComment,
  onAddComment, 
  onToggleSolved,
  currentUserId,
  currentUser 
}) {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !post) return null;

  const isUpvoted = post.upvotedBy && post.upvotedBy.includes(currentUserId);
  const isDownvoted = post.downvotedBy && post.downvotedBy.includes(currentUserId);
  const isSolved = post.status === 'resolved' || post.hasAcceptedSolution;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
        username: currentUser?.email?.split('@')[0] || 'user',
        email: currentUser?.email || currentUser?.emailId || 'user@example.com',
        avatarColor: currentUser?.avatarBgColor || '#2563eb',
        role: 'Community Member'
      },
      createdAt: 'Just now',
      content: replyText.trim(),
      isAcceptedAnswer: false,
      votes: 0,
      upvotedBy: [],
      downvotedBy: []
    };

    setTimeout(() => {
      onAddComment(post.id, newComment);
      setReplyText('');
      setIsSubmitting(false);
    }, 200);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        role="dialog"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-700">
              {post.moduleName}
            </span>
            {isSolved && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Check size={14} className="text-emerald-600 stroke-[3]" />
                Accepted Solution
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={13} />
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => onToggleSolved(post.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSolved 
                  ? 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70' 
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 size={14} className={isSolved ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{isSolved ? 'Marked Solved' : 'Mark as Solved'}</span>
            </button>

            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Thread Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Question Title & Meta Header */}
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 leading-snug">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2.5">
              <span>Asked <strong className="text-gray-700">{post.createdAt}</strong></span>
              <span>•</span>
              <span>Viewed <strong className="text-gray-700">{post.views || 0} times</strong></span>
              <span>•</span>
              <span>Module <strong className="text-gray-700">{post.moduleName}</strong></span>
            </div>
          </div>

          {/* Question Body (Reddit / StackOverflow Layout) */}
          <div className="flex gap-5 items-start">
            {/* Left Voting Column */}
            <div className="flex flex-col items-center bg-gray-50/80 p-2 rounded-xl border border-gray-200/80 flex-shrink-0">
              <button
                onClick={() => onVotePost(post.id, 1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isUpvoted ? 'text-[#ec5137] bg-orange-100' : 'text-gray-400 hover:text-[#ec5137] hover:bg-gray-200/50'
                }`}
                title="This question shows research effort"
              >
                <ArrowBigUp size={28} className={isUpvoted ? 'fill-current' : ''} />
              </button>

              <span className={`text-base font-bold my-1 select-none ${
                isUpvoted ? 'text-[#ec5137]' : isDownvoted ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {post.votes ?? (post.upvotes || 0)}
              </span>

              <button
                onClick={() => onVotePost(post.id, -1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDownvoted ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-200/50'
                }`}
                title="This question does not show research effort"
              >
                <ArrowBigDown size={28} className={isDownvoted ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Main Question Body */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                {post.description}
              </div>

              {/* Code / Steps box */}
              {post.stepsToReproduce && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Steps to reproduce / logs:
                  </h4>
                  <pre className="text-xs sm:text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {post.stepsToReproduce}
                  </pre>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {post.tags.map((t, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Author signature box (StackOverflow signature style) */}
              <div className="flex justify-end pt-3">
                <div className="bg-orange-50/50 border border-orange-200/50 rounded-xl p-3 w-56 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs flex-shrink-0"
                    style={{ backgroundColor: post.author.avatarColor || '#ec5137' }}
                  >
                    {post.author.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 block">asked {post.createdAt}</span>
                    <span className="text-sm font-bold text-gray-900 truncate block">
                      {post.author.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">
                      {post.author.role || 'Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#ec5137]" />
                <span>{post.comments ? post.comments.length : 0} Answers</span>
              </h2>
            </div>

            {/* Answers List */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-5">
                {post.comments.map((comment) => (
                  <div 
                    key={comment.id}
                    className={`p-5 rounded-xl border flex gap-4 items-start ${
                      comment.isAcceptedAnswer 
                        ? 'bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Answer Votes */}
                    <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                      <button 
                        onClick={() => onVoteComment && onVoteComment(post.id, comment.id, 1)}
                        className="text-gray-400 hover:text-[#ec5137] p-1 transition-colors cursor-pointer"
                      >
                        <ArrowBigUp size={22} />
                      </button>
                      <span className="text-sm font-bold text-gray-800 my-0.5">
                        {comment.votes || 0}
                      </span>
                      <button 
                        onClick={() => onVoteComment && onVoteComment(post.id, comment.id, -1)}
                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                      >
                        <ArrowBigDown size={22} />
                      </button>

                      {comment.isAcceptedAnswer && (
                        <div className="mt-1 text-emerald-600" title="Accepted solution">
                          <Check size={20} className="stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Answer Body */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {comment.isAcceptedAnswer && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pb-1 border-b border-emerald-200">
                          <CheckCircle2 size={14} />
                          <span>Accepted Solution</span>
                        </div>
                      )}

                      <div className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </div>

                      {/* Comment author info */}
                      <div className="flex justify-end pt-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ backgroundColor: comment.author?.avatarColor || '#2563eb' }}
                          >
                            {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="font-semibold text-gray-800">{comment.author?.name}</span>
                          <span>•</span>
                          <span>{comment.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
                Know the answer or have a troubleshooting step? Be the first to help below!
              </div>
            )}

            {/* StackOverflow Style "Your Answer" Box */}
            <form onSubmit={handleReplySubmit} className="mt-8 pt-4 border-t border-gray-200 space-y-3">
              <h3 className="text-base font-bold text-gray-900">
                Your Answer
              </h3>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your explanation or step-by-step solution here..."
                className="w-full p-4 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Your Answer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
