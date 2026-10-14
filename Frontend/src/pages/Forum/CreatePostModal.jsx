// Frontend/src/pages/Forum/CreatePostModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  HelpCircle, 
  Lightbulb, 
  AlertCircle, 
  ShieldAlert, 
  LifeBuoy, 
  Sparkles 
} from 'lucide-react';
import { FORUM_MODULES } from './forumData';

export default function CreatePostModal({ isOpen, onClose, onSubmit, targetModuleId, existingPosts = [] }) {
  const [moduleId, setModuleId] = useState(targetModuleId || 'my-flipbooks');
  const [postType, setPostType] = useState('question'); // 'question' | 'suggestion'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setError('');
      setPostType('question');
      setModuleId(targetModuleId || 'my-flipbooks');
    }
  }, [isOpen, targetModuleId]);

  // Similar post suggestion detection to avoid duplicates
  const similarPosts = useMemo(() => {
    if (!title.trim() || title.trim().length < 4) return [];
    const queryWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return [];

    return existingPosts.filter(p => {
      const pTitle = p.title.toLowerCase();
      return queryWords.some(w => pTitle.includes(w));
    }).slice(0, 3);
  }, [title, existingPosts]);

  // Detect technical failure or bug keywords to recommend Support Tickets
  const hasBugKeywords = useMemo(() => {
    const text = (title + ' ' + description).toLowerCase();
    const bugWords = ['crash', 'failed', '500 error', '504', 'corrupt', 'freeze', 'broken', 'bug', 'cannot upload'];
    return bugWords.some(w => text.includes(w));
  }, [title, description]);

  if (!isOpen) return null;

  const activeModule = FORUM_MODULES.find(m => m.id === moduleId) || FORUM_MODULES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a descriptive title for your post');
      return;
    }
    if (title.trim().length < 8) {
      setError('Title must be at least 8 characters long');
      return;
    }
    if (!description.trim()) {
      setError('Please provide details for your question or suggestion');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPostData = {
        moduleId: activeModule.id,
        moduleName: activeModule.name,
        postType,
        title: title.trim(),
        description: description.trim(),
        status: postType === 'suggestion' ? 'under_review' : 'awaiting_admin'
      };

      if (onSubmit) {
        await onSubmit(newPostData);
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit post');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between bg-orange-50/40">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              New Discussion
            </h2>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-orange-100 text-[#c23d26] border border-orange-200">
              Product Knowledge & Feedback
            </span>
          </div>

          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-[#ec5137] p-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
          {/* Module Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
              Module <span className="text-[#ec5137]">*</span>
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#ec5137] focus:ring-1 focus:ring-[#ec5137]/20 cursor-pointer text-stone-800"
            >
              {FORUM_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Post Type Selector (Question vs Suggestion) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
              Post Type <span className="text-[#ec5137]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPostType('question')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  postType === 'question'
                    ? 'bg-orange-50 border-[#ec5137] text-[#c23d26] ring-1 ring-[#ec5137]/30 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <HelpCircle size={16} className="text-[#ec5137]" />
                <span>Ask a Question</span>
              </button>

              <button
                type="button"
                onClick={() => setPostType('suggestion')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  postType === 'suggestion'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-300 shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Lightbulb size={16} className="text-amber-600" />
                <span>Suggest Improvement</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
              Title <span className="text-[#ec5137]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === 'suggestion' 
                ? 'e.g. Add option to distribute elements evenly on canvas' 
                : 'e.g. How to optimize PDF vector pages for faster mobile flip?'}
              className="w-full px-4 py-2.5 text-sm sm:text-base border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] transition-all text-stone-900 font-normal"
            />
          </div>

          {/* Similar Posts Suggestion Box */}
          {similarPosts.length > 0 && (
            <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#c23d26]">
                <Sparkles size={14} className="text-[#ec5137]" />
                <span>Existing discussions that might answer your query:</span>
              </div>
              <div className="space-y-1">
                {similarPosts.map(sp => (
                  <div key={sp.id} className="text-stone-700 hover:text-[#ec5137] font-normal truncate">
                    • {sp.title} <span className="text-stone-500">({sp.moduleName})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Input (Plain Text) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-2">
              Description <span className="text-[#ec5137]">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={postType === 'suggestion'
                ? 'Explain your suggestion and how it improves your Flipibook workflow...'
                : 'Explain what you want to achieve or what question you need official guidance on...'}
              className="w-full p-4 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ec5137]/20 focus:border-[#ec5137] transition-all resize-y text-stone-900 font-normal"
            />
          </div>

          {/* Bug / Technical failure suggestion to use Raise Ticket */}
          {hasBugKeywords && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <LifeBuoy size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Facing a private technical failure or urgent bug?</strong>
                <p className="mt-0.5 text-amber-800 font-normal">
                  For account issues, crashes, or confidential files, consider opening a dedicated request under <strong>Raise Ticket</strong> for private engineering assistance.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Warning */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2 text-xs text-stone-600">
            <ShieldAlert size={14} className="text-stone-400 flex-shrink-0" />
            <span>Please do not include passwords, API keys, or private client details in public forum posts.</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-500 font-normal">
              Posting to: <strong className="text-stone-800 font-medium">{activeModule.name}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Post'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

