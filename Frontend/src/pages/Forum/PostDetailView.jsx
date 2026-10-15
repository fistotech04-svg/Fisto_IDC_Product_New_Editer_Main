// Frontend/src/pages/Forum/PostDetailView.jsx
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ThumbsUp, 
  Send,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Share2,
  Trash2,
  Clock,
  MessageCircle,
  CornerDownRight,
  Reply
} from 'lucide-react';
import { POST_STATUS_CONFIG, formatForumDate } from './forumData';
import { useToast } from '../../components/CustomToast';

export default function PostDetailView({ 
  post, 
  onBack, 
  onAddAdminReply, 
  onAddAuthorFollowUp,
  onAddAdminFollowUpReply,
  onAddUserComment,
  onToggleSameQuestion,  onDeletePost,
  currentUserId, 
  currentUser,
  isAdmin: propIsAdmin
}) {
  const toast = useToast();
    const [authorFollowUpText, setAuthorFollowUpText] = useState('');
  const [showAuthorFollowUpBox, setShowAuthorFollowUpBox] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(post?.status || 'awaiting_admin');
  
  // Follow-up direct admin replies: map of followUpId -> text
  const [adminFollowUpReplies, setAdminFollowUpReplies] = useState({});
  const [activeReplyBoxId, setActiveReplyBoxId] = useState(null);

    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!post) return null;

  // Determine if user has admin privileges
  const isAdmin = Boolean(
    propIsAdmin ||
    currentUser?.isAdmin || 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'Staff' ||
    currentUser?.email?.includes('admin')
  );

  const isOwner = post.author?.email === currentUserId || 
                  post.author?.name === currentUser?.name;

  const isSuggestion = post.postType === 'suggestion';
  const authorInitials = post.author?.initials || (post.author?.name ? post.author.name.slice(0, 2).toUpperCase() : 'U');
  const avatarColor = post.author?.avatarColor || '#ec5137';
  const statusInfo = POST_STATUS_CONFIG[post.status] || POST_STATUS_CONFIG.awaiting_admin;

  const sameQuestionUsers = post.sameQuestionUsers || [];
  const hasSameQuestion = sameQuestionUsers.includes(currentUserId);
  const sameQuestionCount = sameQuestionUsers.length;

  const authorFollowUps = post.authorFollowUps || [];
  const comments = post.comments || [];

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/forum?post=${post.id}`;
      navigator.clipboard?.writeText(url);
      setCopiedLink(true);
      if (toast?.showToast) toast.showToast('Discussion link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      if (toast?.showToast) toast.showToast('Link copied!', 'success');
    }
  };

  
  const handleAuthorFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!authorFollowUpText.trim()) return;

    setIsSubmittingFollowUp(true);
    const newFollowUp = {
      id: `fu-${Date.now()}`,
      author: {
        name: post.author?.name || currentUser?.name || 'Author',
        initials: authorInitials,
        avatarColor: avatarColor,
        email: currentUserId
      },
      createdAt: 'Just now',
      question: authorFollowUpText.trim(),
      adminReply: null
    };

    setTimeout(() => {
      if (onAddAuthorFollowUp) {
        onAddAuthorFollowUp(post.id, newFollowUp);
      } else {
        onAddUserComment(post.id, {
          ...newFollowUp,
          content: authorFollowUpText.trim(),
          isAuthorFollowUp: true
        });
      }
      setAuthorFollowUpText('');
      setIsSubmittingFollowUp(false);
      setShowAuthorFollowUpBox(false);
      if (toast?.showToast) toast.showToast('Follow-up question sent to official team!', 'success');
    }, 150);
  };

  const handleAdminFollowUpReplySubmit = (followUpId) => {
    const replyText = adminFollowUpReplies[followUpId];
    if (!replyText || !replyText.trim()) return;

    const replyObj = {
      id: `admin-fu-rep-${Date.now()}`,
      author: {
        name: currentUser?.name || 'Flipibook Team',
        initials: 'AD',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#ec5137'
      },
      createdAt: 'Just now',
      content: replyText.trim()
    };

    if (onAddAdminFollowUpReply) {
      onAddAdminFollowUpReply(post.id, followUpId, replyObj);
    }

    setAdminFollowUpReplies(prev => ({ ...prev, [followUpId]: '' }));
    setActiveReplyBoxId(null);
    if (toast?.showToast) toast.showToast('Answered follow-up in official thread!', 'success');
  };

  const handleAdminReplySubmit = (e) => {
    e.preventDefault();
    if (!adminReplyText.trim()) return;

    setIsSubmittingAdmin(true);
    const newAdminReply = {
      id: `admin-${Date.now()}`,
      author: {
        name: currentUser?.name || 'Flipibook Team',
        initials: 'AD',
        role: 'Official Reply',
        isAdmin: true,
        avatarColor: '#ec5137'
      },
      createdAt: 'Just now',
      content: adminReplyText.trim()
    };

    setTimeout(() => {
      onAddAdminReply(post.id, newAdminReply, selectedStatus);
      setAdminReplyText('');
      setIsSubmittingAdmin(false);
      if (toast?.showToast) toast.showToast('Official response & status published!', 'success');
    }, 150);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#fdfcfa]">
      {/* Top Header Bar */}
      <div className="px-3.5 sm:px-6 py-3 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-orange-100/80 bg-white sticky top-0 z-10 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#ec5137] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Forum</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 hover:border-orange-200 hover:bg-orange-50/50 text-xs font-medium text-stone-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} className="text-stone-500" />
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Owner Deletion when no replies */}
          {isOwner && (!post.adminReply && comments.length === 0 && authorFollowUps.length === 0) && (
            <button
              onClick={() => onDeletePost(post.id)}
              className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
              title="Delete discussion"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Module Badge */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-orange-200 text-xs font-semibold text-[#c23d26] bg-orange-50/70">
            <BookOpen size={13} className="text-[#ec5137]" />
            <span className="truncate max-w-[120px] sm:max-w-none">{post.moduleName}</span>
          </div>
        </div>
      </div>

      {/* Main Discussion Container */}
      <div className="w-full px-3 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-8 space-y-5 sm:space-y-7">
        {/* 1. Original Post Card */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-8 shadow-xs space-y-4">
          {/* Top Meta Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-xs sm:text-sm">
            {/* Post Type Tag */}
            <span className={`px-2.5 py-1 rounded-md font-medium text-xs border flex items-center gap-1.5 ${
              isSuggestion 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-orange-50 text-[#c23d26] border-orange-200'
            }`}>
              {isSuggestion ? <Lightbulb size={13} className="text-amber-600" /> : <HelpCircle size={13} className="text-[#ec5137]" />}
              <span>{isSuggestion ? 'Suggestion' : 'Question'}</span>
            </span>

            {/* Status Badge */}
            {isAdmin && (
            <span className={`px-2.5 py-1 rounded-md font-medium text-xs border flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border || 'border-stone-200'}`}>
              <span>{statusInfo.label}</span>
            </span>)}

            <span className="text-stone-500 font-normal text-xs sm:text-sm">
              Posted by <strong className="text-stone-800 font-semibold">{post.author?.name}</strong> • {formatForumDate(post.createdAt)}
            </span>
          </div>

          <div className="flex items-start gap-3 sm:gap-4 pt-1">
            <div 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-xs ring-2 ring-orange-50"
              style={{ backgroundColor: avatarColor }}
            >
              {authorInitials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                {post.title}
              </h1>

              {/* Description directly follows Title */}
              <div className="pt-2 sm:pt-3 text-sm sm:text-base text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                {post.description}
              </div>
            </div>
          </div>

          {/* Action Row: "I have this question too" */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 flex-wrap gap-2">
            <button
              onClick={() => onToggleSameQuestion(post.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                hasSameQuestion 
                  ? 'bg-[#ec5137] text-white border-[#ec5137] shadow-xs' 
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-orange-50/50 hover:border-orange-200'
              }`}
              title="Click to indicate this is relevant to you as well"
            >
              <ThumbsUp size={15} className={hasSameQuestion ? 'fill-current' : 'text-[#ec5137]'} />
              <span>{isSuggestion ? 'I want this too' : 'I have this question too'}</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium ${
                hasSameQuestion ? 'bg-[#d9442b] text-white' : 'bg-stone-100 text-stone-800'
              }`}>
                {sameQuestionCount}
              </span>
            </button>

            <span className="text-xs text-stone-500 font-normal">
              Updated {formatForumDate(post.updatedAt || post.createdAt)}
            </span>
          </div>
        </div>

        {/* 2. Grouped Official Thread: Admin Answer + Author Follow-ups + Admin Answers */}
        <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-xs">
          <div className="bg-orange-50/70 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-orange-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#ec5137]" />
              <span className="text-sm font-semibold text-[#c23d26]">
                Official Support Thread
              </span>
            </div>

            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border || 'border-stone-200'}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="p-4 sm:p-7 space-y-6">
            {/* Primary Admin Answer */}
            {post.adminReply ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#ec5137] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                      {post.adminReply.author?.initials || 'AD'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-stone-900">{post.adminReply.author?.name}</strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#c23d26] border border-orange-300">
                          Official Reply
                        </span>
                      </div>
                      <span className="text-xs text-stone-500">{formatForumDate(post.adminReply.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-stone-800 leading-relaxed whitespace-pre-line pl-1 sm:pl-10.5 font-normal">
                  {post.adminReply.content}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-stone-500">
                <Clock size={24} className="mx-auto text-amber-500 mb-2" />
                <h4 className="text-sm font-semibold text-stone-800">Awaiting Admin Response</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto font-normal">
                  Our engineering and product team reviews all inquiries. An official response will be published here.
                </p>
              </div>
            )}

            {/* Grouped Follow-up Exchanges (Author questions & Admin replies) */}
            {authorFollowUps.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-orange-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#c23d26] uppercase tracking-wider">
                  <MessageCircle size={14} />
                  <span>Author Follow-ups & Admin Clarifications ({authorFollowUps.length})</span>
                </div>

                <div className="space-y-4">
                  {authorFollowUps.map((fu, idx) => (
                    <div 
                      key={fu.id || idx} 
                      className="rounded-xl border border-orange-200/90 bg-[#fffaf8] p-4 sm:p-5 space-y-3"
                    >
                      {/* Author's follow-up question */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                              style={{ backgroundColor: fu.author?.avatarColor || avatarColor }}
                            >
                              {fu.author?.initials || authorInitials}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-stone-900">{fu.author?.name || post.author?.name}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              Author Follow-up #{idx + 1}
                            </span>
                            <span className="text-xs text-stone-400 font-normal">• {formatForumDate(fu.createdAt)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line pl-9">
                          {fu.question}
                        </p>
                      </div>

                      {/* Admin's nested answer to this follow-up */}
                      {fu.adminReply ? (
                        <div className="ml-4 sm:ml-9 mt-3 p-3.5 bg-white rounded-xl border border-orange-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#ec5137] text-white flex items-center justify-center text-[10px] font-semibold">
                                {fu.adminReply.author?.initials || 'AD'}
                              </div>
                              <span className="text-xs font-semibold text-stone-900">{fu.adminReply.author?.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#c23d26] border border-orange-300">
                                Admin Response
                              </span>
                              <span className="text-xs text-stone-400 font-normal">• {formatForumDate(fu.adminReply.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal pl-8 whitespace-pre-line">
                            {fu.adminReply.content}
                          </p>
                        </div>
                      ) : (
                        /* Admin can answer this specific follow-up */
                        isAdmin && (
                          <div className="ml-4 sm:ml-9 mt-2">
                            {activeReplyBoxId === fu.id ? (
                              <div className="p-3 bg-white border border-orange-200 rounded-xl space-y-2">
                                <span className="text-xs font-semibold text-[#c23d26]">Reply to this follow-up:</span>
                                <textarea
                                  rows={2}
                                  value={adminFollowUpReplies[fu.id] || ''}
                                  onChange={(e) => setAdminFollowUpReplies({ ...adminFollowUpReplies, [fu.id]: e.target.value })}
                                  placeholder="Type official reply to the author's follow-up..."
                                  className="w-full p-2.5 text-xs sm:text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#ec5137]"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setActiveReplyBoxId(null)}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleAdminFollowUpReplySubmit(fu.id)}
                                    disabled={!adminFollowUpReplies[fu.id]?.trim()}
                                    className="px-4 py-1 rounded-lg text-xs font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                  >
                                    <Send size={12} />
                                    <span>Send Answer</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveReplyBoxId(fu.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 text-xs font-medium text-[#c23d26] transition-colors cursor-pointer"
                              >
                                <Reply size={12} />
                                <span>Answer this Follow-up</span>
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author's Action: Ask Follow-up after Admin has replied */}
            {post.adminReply && (
              <div className="pt-3 border-t border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs text-stone-500">
                  Need further clarification or have another question on this topic?
                </span>

                <button
                  onClick={() => setShowAuthorFollowUpBox(!showAuthorFollowUpBox)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-300 bg-orange-50/80 hover:bg-orange-100/90 text-xs font-semibold text-[#c23d26] transition-all cursor-pointer shadow-2xs"
                >
                  <CornerDownRight size={13} className="text-[#ec5137]" />
                  <span>{showAuthorFollowUpBox ? 'Cancel Follow-up' : 'Ask Follow-up to Admin'}</span>
                </button>
              </div>
            )}

            {/* Author's Direct Follow-up Form Box */}
            {showAuthorFollowUpBox && (
              <form onSubmit={handleAuthorFollowUpSubmit} className="p-3.5 bg-orange-50/40 border border-orange-200/90 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                  <MessageCircle size={14} className="text-[#ec5137]" />
                  <span>Follow-up question or clarification to Admin:</span>
                </div>

                <textarea
                  rows={3}
                  value={authorFollowUpText}
                  onChange={(e) => setAuthorFollowUpText(e.target.value)}
                  placeholder="Ask for clarification or provide more details for the admin team..."
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-[#ec5137] focus:ring-1 focus:ring-[#ec5137]/20 text-stone-800"
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-stone-500">
                    This will be grouped inside the Official Support Thread.
                  </span>

                  <button
                    type="submit"
                    disabled={!authorFollowUpText.trim() || isSubmittingFollowUp}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{isSubmittingFollowUp ? 'Sending...' : 'Send Follow-up'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Admin Response & Status Management Console (Visible for Admins to publish or update the initial answer) */}
            {isAdmin && (
              <form onSubmit={handleAdminReplySubmit} className="mt-6 pt-5 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#c23d26] uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#ec5137]" />
                    <span>{post.adminReply ? 'Update Official Response & Status' : 'Admin Reply Console'}</span>
                  </span>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-600 font-normal">Update Status:</span>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium bg-white text-stone-800 focus:outline-none focus:border-[#ec5137]"
                    >
                      <option value="answered">Answered</option>
                      <option value="under_review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="implemented">Implemented</option>
                      <option value="declined">Not Planned</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder={post.adminReply ? "Add a revised official response..." : "Type official verified response or roadmap update..."}
                  className="w-full p-3.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/20 focus:border-[#ec5137] text-stone-800"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim() || isSubmittingAdmin}
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>{isSubmittingAdmin ? 'Publishing...' : 'Publish Official Response'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
