// Frontend/src/pages/Forum/CreatePostModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Send, Tag, AlertCircle } from 'lucide-react';
import { FORUM_MODULES, ISSUE_CATEGORIES } from './forumData';

export default function CreatePostModal({ isOpen, onClose, onSubmit, targetModuleId }) {
  const activeModule = FORUM_MODULES.find(m => m.id === targetModuleId) || FORUM_MODULES[0];

  const [category, setCategory] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setTagsInput(activeModule.id.replace('-', ''));
      setError('');
      setCategory('bug');
    }
  }, [isOpen, targetModuleId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a specific question or issue title');
      return;
    }
    if (title.trim().length < 8) {
      setError('Title must be at least 8 characters long');
      return;
    }
    if (!description.trim()) {
      setError('Please provide details for your question or issue');
      return;
    }

    setIsSubmitting(true);
    const parsedTags = tagsInput
      .split(/[\s,]+/)
      .map(t => t.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase())
      .filter(Boolean);

    const newPostData = {
      moduleId: activeModule.id,
      moduleName: activeModule.name,
      category,
      title: title.trim(),
      description: description.trim(),
      tags: parsedTags.length > 0 ? parsedTags : [activeModule.id.replace('-', '')],
    };

    setTimeout(() => {
      onSubmit(newPostData);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-950">
              Ask a Question / Report Issue
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-orange-100 text-[#ec5137]">
              {activeModule.name}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Category Toggle Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Topic Category
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ISSUE_CATEGORIES.filter(c => c.id !== 'all').map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    category === c.id
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Title <span className="text-[#ec5137]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. How to resolve texture rendering delay in ${activeModule.shortName}?`}
              className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Details / What did you try? <span className="text-[#ec5137]">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the technical problem, steps to reproduce, or what outcome you expect..."
              className="w-full p-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ec5137]/30 focus:border-[#ec5137] transition-all resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. pdf, rendering, export"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-[#ec5137]"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Posting strictly to <strong>{activeModule.name}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : `Post to ${activeModule.shortName}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
