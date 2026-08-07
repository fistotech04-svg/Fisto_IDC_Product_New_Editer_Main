import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Info, Check, Plus } from 'lucide-react';
import axios from 'axios';
import { useToast } from './CustomToast';

const FlipbookInfoModal = ({ isOpen, onClose, currentBook, onSaveSuccess }) => {
  const toast = useToast();

  const [bookName, setBookName] = useState('');
  const [quotes, setQuotes] = useState('');
  const [about, setAbout] = useState('');
  const [category, setCategory] = useState('Product Based');
  const [language, setLanguage] = useState('English');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when currentBook changes or modal opens
  useEffect(() => {
    if (isOpen && currentBook) {
      setBookName(currentBook.flipbookName || currentBook.realName || currentBook.title || '');
      setQuotes(currentBook.quotes || currentBook.quote || currentBook.tagline || currentBook.meta?.quotes || currentBook.meta?.quote || currentBook.meta?.tagline || '');
      setAbout(currentBook.about || currentBook.meta?.about || '');
      setCategory(currentBook.category || currentBook.meta?.category || 'Product Based');
      setLanguage(currentBook.language || currentBook.meta?.language || 'English');
      
      if (currentBook.tags && Array.isArray(currentBook.tags)) {
        setTags(currentBook.tags);
      } else if (currentBook.meta?.tags && Array.isArray(currentBook.meta.tags)) {
        setTags(currentBook.meta.tags);
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

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const v_id = currentBook?.v_id || currentBook?.realName;
      const userEmail = user?.emailId || currentBook?.userEmail;

      if (userEmail && v_id) {
        await axios.post(`${backendUrl}/api/flipbook/update-settings`, {
          emailId: userEmail,
          v_id: v_id,
          newName: bookName,
          category: category,
          language: language,
          tags: tags,
          quotes: quotes,
          about: about,
          meta: {
            ...(currentBook?.meta || {}),
            quotes: quotes,
            about: about,
            category: category,
            language: language,
            tags: tags
          }
        });
      }

      toast?.success?.("Flipbook information updated successfully!");
      if (onSaveSuccess) {
        onSaveSuccess({ bookName, quotes, about, category, language, tags });
      }
      onClose();
    } catch (err) {
      console.error("Save info failed:", err);
      toast?.error?.("Failed to update flipbook information.");
    } finally {
      setIsSaving(false);
    }
  };

  const modalJsx = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-[1vw]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative bg-white w-[54vw] max-h-[94vh] rounded-[1.2vw] shadow-2xl animate-in fade-in zoom-in-95 duration-300 font-sans p-[1.6vw] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-[1vw] mb-[0.2vw]">
          <h2 className="text-[1.2vw] font-bold text-gray-900 whitespace-nowrap tracking-tight">Flipbook Information</h2>
          <div className="flex-1 h-[1px] bg-gray-200" />
          <button
            onClick={onClose}
            className="p-[0.35vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer flex-shrink-0"
          >
            <X size="1vw" />
          </button>
        </div>

        <p className="text-[0.78vw] text-gray-400 font-medium mb-[1.2vw]">
          Add basic details about your flipbook
        </p>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-2 gap-[1.5vw]">
          {/* Left Column */}
          <div className="flex flex-col justify-between gap-[0.9vw]">
            {/* Book Preview Image Card */}
            <div className="relative rounded-[0.9vw] bg-[#edd8cd] h-[17.5vw] flex items-center justify-center shadow-inner overflow-hidden border border-amber-100/40">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="Flipbook Cover" 
                  className="max-h-full max-w-full object-contain rounded-[0.5vw] shadow-md"
                />
              ) : (
                <div className="relative w-[14vw] h-[15vw] flex items-center justify-center">
                  <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-orange-500 to-amber-600 rounded-[0.6vw] shadow-xl transform -rotate-6 border border-orange-400 p-[0.7vw] flex flex-col justify-between text-white">
                    <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                    <div>
                      <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                      <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                    </div>
                  </div>
                  <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-amber-600 to-orange-500 rounded-[0.6vw] shadow-2xl transform rotate-6 border border-amber-400 p-[0.7vw] flex flex-col justify-between text-white">
                    <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                    <div>
                      <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                      <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Input Group */}
            <div className="flex flex-col gap-[0.8vw]">
              {/* Flipbook Name */}
              <div>
                <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                  Flipbook Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={20}
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="Name of the book"
                    className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pr-[3.2vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 shadow-xs"
                  />
                  <span className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-[0.7vw] text-gray-300 font-normal select-none">
                    {bookName.length}/20
                  </span>
                </div>
              </div>

              {/* Quote / Tagline */}
              <div>
                <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                  Quote / Tagline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={20}
                    value={quotes}
                    onChange={(e) => setQuotes(e.target.value)}
                    placeholder="Quotes About Book"
                    className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pr-[3.2vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 shadow-xs"
                  />
                  <span className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-[0.7vw] text-gray-300 font-normal select-none">
                    {quotes.length}/20
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-[0.8vw]">
            {/* About */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                About <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={100}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="About Book"
                  className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pb-[1.5vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 shadow-xs resize-none h-[5.5vw]"
                />
                <span className="absolute right-[0.8vw] bottom-[0.5vw] text-[0.7vw] text-gray-300 font-normal select-none">
                  {about.length}/100
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-800 bg-white focus:outline-none focus:border-gray-400 appearance-none cursor-pointer shadow-xs"
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
                <ChevronDown size="1vw" className="text-gray-500 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                Language <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-800 bg-white focus:outline-none focus:border-gray-400 appearance-none cursor-pointer shadow-xs"
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
                <ChevronDown size="1vw" className="text-gray-500 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>



            {/* Total Pages */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">Total Pages</label>
              <input
                type="text"
                disabled
                value={`${pageCount} Pages`}
                className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-600 bg-gray-50/70 cursor-not-allowed shadow-xs"
              />
            </div>

            {/* Visibility Info Box */}
            <div className="bg-[#f0f4fe] border border-blue-100/60 rounded-[0.8vw] p-[0.7vw] space-y-[0.2vw]">
              <div className="flex items-center gap-[0.4vw]">
                <Info size="0.9vw" className="text-[#4338ca] flex-shrink-0" />
                <span className="text-[0.78vw] font-semibold text-gray-800">
                  Visibility : <span className="text-[#4338ca] font-bold">{visibilityMode}</span>
                </span>
              </div>
              <p className="text-[0.68vw] text-gray-500 leading-snug pl-[1.3vw]">
                This flipbook will be published as {visibilityMode}.<br />
                Change later from: <strong className="text-gray-700 font-semibold">Customize &gt; Visibility</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-gray-200 mt-[1.4vw] mb-[1.2vw]" />

        {/* Footer Action Buttons */}
        <div className="grid grid-cols-2 gap-[1.2vw]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-[0.65vw] rounded-[0.5vw] border border-gray-300 bg-white text-gray-800 text-[0.85vw] font-semibold flex items-center justify-center gap-[0.4vw] hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
          >
            <X size="0.95vw" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="w-full py-[0.65vw] rounded-[0.5vw] bg-black hover:bg-gray-900 text-white text-[0.85vw] font-semibold flex items-center justify-center gap-[0.4vw] transition-all shadow-md cursor-pointer disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-[0.95vw] h-[0.95vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check size="0.95vw" />
                <span>Save Info Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, document.body);
};

export default FlipbookInfoModal;
