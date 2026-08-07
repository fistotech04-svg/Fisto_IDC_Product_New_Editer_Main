import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Plus, Info, Upload, Pencil } from 'lucide-react';
import axios from 'axios';
import { useToast } from './CustomToast';

const PublishModal = ({ isOpen, onClose, currentBook, onPublishSuccess }) => {
  const toast = useToast();

  const [bookName, setBookName] = useState('');
  const [quotes, setQuotes] = useState('');
  const [category, setCategory] = useState('Product Based');
  const [language, setLanguage] = useState('English');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4']);
  const [isPublishing, setIsPublishing] = useState(false);

  // Sync state when currentBook changes or modal opens
  useEffect(() => {
    if (isOpen && currentBook) {
      setBookName(currentBook.flipbookName || currentBook.realName || currentBook.title || 'Name of the book');
      setQuotes(currentBook.quotes || '');
      setCategory(currentBook.category || 'Product Based');
      setLanguage(currentBook.language || 'English');
      if (currentBook.tags && Array.isArray(currentBook.tags)) {
        setTags(currentBook.tags);
      } else {
        setTags([]);
      }
    }
  }, [isOpen, currentBook]);

  if (!isOpen) return null;

  const visibilityMode = currentBook?.share?.access || currentBook?.settings?.visibility?.type || 'Public';
  const pageCount = currentBook?.pages?.length || currentBook?.pageCount || 12;
  const thumbnailUrl = currentBook?.thumbnail || currentBook?.coverImage || null;

  const handleAddTag = () => {
    if (tags.length >= 5) {
      toast?.error?.("Maximum 5 search tags allowed.");
      return;
    }
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishClick = async () => {
    setIsPublishing(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const v_id = currentBook?.v_id || currentBook?.realName;
      const userEmail = user?.emailId || currentBook?.userEmail;

      if (userEmail && v_id) {
        await axios.post(`${backendUrl}/api/flipbook/publish`, {
          emailId: userEmail,
          v_id: v_id,
          bookName: bookName,
          category: category,
          language: language,
          tags: tags,
          quotes: quotes
        });
      }

      toast?.success?.("Flipbook published successfully!");
      if (onPublishSuccess) onPublishSuccess({ bookName, category, language, tags, quotes });
      onClose();
    } catch (err) {
      console.error("Publish failed:", err);
      toast?.error?.("Failed to publish flipbook.");
    } finally {
      setIsPublishing(false);
    }
  };

  const modalJsx = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center">
      {/* Backdrop matching ShareModal */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
        onClick={onClose}
      />

      {/* Modal Container matching ShareModal w-[52vw] */}
      <div 
        className="relative bg-white w-[52vw] max-h-[90vh] rounded-[1vw] shadow-2xl animate-in fade-in zoom-in-95 duration-300 font-sans overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching ShareModal */}
        <div className="px-[1.2vw] py-[0.8vw] flex items-center gap-[0.8vw] border-b border-gray-50">
          <h2 className="text-[1.1vw] font-bold text-gray-900 whitespace-nowrap">Publish Flipbook</h2>
          <div className="flex-1 h-[1px] bg-gray-200" />
          <button
            onClick={onClose}
            className="p-[0.3vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer"
          >
            <X size="1vw" />
          </button>
        </div>

        <p className="text-[0.75vw] text-gray-400 font-medium px-[1.2vw] pt-[0.4vw]">
          Make your flipbook live and share it with your audience
        </p>

        {/* Modal Body matching ShareModal 2-Column layout */}
        <div className="p-[1.2vw] pt-[0.6vw] flex flex-col gap-[1vw]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.2vw]">
            {/* Left Column */}
            <div className="space-y-[0.8vw]">
              {/* Book Preview Image Card */}
              <div className="relative rounded-[0.8vw] bg-[#edd8cd] p-[0.8vw] h-[14vw] flex items-center justify-center shadow-inner overflow-hidden border border-amber-100/50">
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt="Flipbook Cover" 
                    className="max-h-full max-w-full object-contain rounded-[0.5vw] shadow-md"
                  />
                ) : (
                  <div className="relative w-[11vw] h-[12vw] flex items-center justify-center">
                    {/* Styled Mockup Cover matching screenshot */}
                    <div className="absolute w-[8vw] h-[11vw] bg-gradient-to-br from-orange-500 to-amber-600 rounded-[0.5vw] shadow-xl transform -rotate-6 border border-orange-400 p-[0.6vw] flex flex-col justify-between text-white">
                      <span className="text-[0.6vw] font-bold tracking-widest uppercase opacity-80">Hard.Cover</span>
                      <div>
                        <h3 className="text-[0.75vw] font-black leading-tight">Hard.Cover Book</h3>
                        <p className="text-[0.55vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                      </div>
                    </div>
                    <div className="absolute w-[8vw] h-[11vw] bg-gradient-to-br from-amber-600 to-orange-500 rounded-[0.5vw] shadow-2xl transform rotate-6 border border-amber-400 p-[0.6vw] flex flex-col justify-between text-white">
                      <span className="text-[0.6vw] font-bold tracking-widest uppercase opacity-80">Hard.Cover</span>
                      <div>
                        <h3 className="text-[0.75vw] font-black leading-tight">Hard.Cover Book</h3>
                        <p className="text-[0.55vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pages Badge */}
                <div className="absolute bottom-[0.6vw] right-[0.6vw] bg-white/90 backdrop-blur-md px-[0.6vw] py-[0.25vw] rounded-[0.4vw] text-[0.7vw] font-bold text-gray-800 shadow-xs border border-white/50">
                  {pageCount} Pages
                </div>
              </div>

              {/* Flipbook Name */}
              <div>
                <label className="text-[0.8vw] font-bold text-gray-900 mb-[0.3vw] block">Flipbook Name</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="Name of the book"
                    className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-500 bg-gray-50 cursor-not-allowed shadow-xs"
                  />
                </div>
              </div>

              {/* Quotes */}
              <div>
                <label className="text-[0.8vw] font-bold text-gray-900 mb-[0.3vw] block">Quotes</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    disabled
                    value={quotes}
                    onChange={(e) => setQuotes(e.target.value)}
                    placeholder="Quotes About Book"
                    className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-500 bg-gray-50 cursor-not-allowed shadow-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col justify-between space-y-[0.8vw]">
              <div className="space-y-[0.8vw]">
                {/* Select Category */}
                <div>
                  <label className="text-[0.8vw] font-bold text-gray-900 mb-[0.3vw] block">Select Category</label>
                  <div className="relative">
                    <select
                      disabled
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-500 bg-gray-50 cursor-not-allowed appearance-none shadow-xs"
                    >
                      <option value="Product Based">Product Based</option>
                      <option value="Business">Business</option>
                      <option value="Catalog">Catalog</option>
                      <option value="Brochure">Brochure</option>
                      <option value="Magazine">Magazine</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown size="0.9vw" className="text-gray-400 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="text-[0.8vw] font-bold text-gray-900 mb-[0.3vw] block">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-500 bg-gray-50 cursor-not-allowed appearance-none shadow-xs"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                    <ChevronDown size="0.9vw" className="text-gray-400 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Add 5 Search Tags */}
                <div>
                  <label className="text-[0.8vw] font-bold text-gray-900 mb-[0.3vw] block">Add 5 Search Tags</label>
                  <div className="relative border border-gray-300 rounded-[0.5vw] p-[0.3vw] pr-[2.4vw] bg-white flex items-center shadow-xs min-h-[2.2vw]">
                    <div className="flex items-center gap-[0.4vw] overflow-x-auto flex-1 py-[0.1vw]">
                      {tags.map((tag, idx) => (
                        <div key={idx} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-[0.35vw] px-[0.5vw] py-[0.2vw] flex items-center gap-[0.3vw] text-[0.72vw] font-semibold text-gray-700 whitespace-nowrap transition-colors flex-shrink-0">
                          <span>{tag}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveTag(idx)}
                            className="text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            <X size="0.7vw" />
                          </button>
                        </div>
                      ))}

                      {tags.length < 5 && (
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="Add tag..."
                          className="text-[0.72vw] font-medium px-[0.4vw] py-[0.2vw] outline-none text-gray-800 flex-1 min-w-[5vw]"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={tags.length >= 5}
                      className="absolute right-[0.3vw] top-1/2 -translate-y-1/2 w-[1.6vw] h-[1.6vw] bg-[#2b308b] hover:bg-[#20246a] text-white rounded-[0.35vw] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size="0.9vw" />
                    </button>
                  </div>
                </div>

                {/* Visibility Info Box */}
                <div className="bg-[#edf2fe] border border-blue-100 rounded-[0.8vw] p-[0.7vw] space-y-[0.2vw]">
                  <div className="flex items-center gap-[0.4vw]">
                    <Info size="0.9vw" className="text-[#4338ca] flex-shrink-0" />
                    <span className="text-[0.75vw] font-semibold text-gray-800">
                      Visibility : <span className="text-[#4338ca] font-bold">{visibilityMode}</span>
                    </span>
                  </div>
                  <p className="text-[0.68vw] text-gray-500 leading-normal pl-[1.3vw]">
                    This flipbook will be published as {visibilityMode}.<br />
                    Change later from: <strong className="text-gray-700 font-semibold">Customize &gt; Visibility</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-[0.6vw] pt-[0.4vw]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-[1.2vw] py-[0.5vw] rounded-[0.4vw] border border-gray-900 bg-white text-gray-900 text-[0.78vw] font-semibold flex items-center gap-[0.4vw] hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
                >
                  <X size="0.9vw" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishClick}
                  disabled={isPublishing}
                  className="px-[1.2vw] py-[0.5vw] rounded-[0.4vw] bg-[#00a58e] hover:bg-[#008a76] text-white text-[0.78vw] font-semibold flex items-center gap-[0.4vw] transition-all shadow-md cursor-pointer disabled:opacity-70"
                >
                  {isPublishing ? (
                    <div className="w-[0.9vw] h-[0.9vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size="0.9vw" />
                      <span>Publish Book</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, document.body);
};

export default PublishModal;
