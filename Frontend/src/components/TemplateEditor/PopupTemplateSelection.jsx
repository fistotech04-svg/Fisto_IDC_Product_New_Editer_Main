import React, { useState } from 'react';
import Template1 from '../../assets/Pop-Up Templates/PopupTemplete1.svg';
import Template2 from '../../assets/Pop-Up Templates/PopupTemplete2.svg';
import Template3 from '../../assets/Pop-Up Templates/PopupTemplete3.svg';
import Template4 from '../../assets/Pop-Up Templates/PopupTemplete4.svg';
import Template5 from '../../assets/Pop-Up Templates/PopupTemplete5.svg';
import Template6 from '../../assets/Pop-Up Templates/PopupTemplete6.svg';
import Template7 from '../../assets/Pop-Up Templates/PopupTemplete7.svg';
import Template8 from '../../assets/Pop-Up Templates/PopupTemplete8.svg';
import Template9 from '../../assets/Pop-Up Templates/PopupTemplete9.svg';

export const TEMPLATES = [
  { id: 'template1', image: Template1, category: 'Image Based' },
  { id: 'template2', image: Template2, category: 'Image Based' },
  { id: 'template3', image: Template3, category: 'Image Based' },
  { id: 'template4', image: Template4, category: 'Image Based' },
  { id: 'template5', image: Template5, category: 'Image Based' },
  { id: 'template6', image: Template6, category: 'Image Based' },
  { id: 'template7', image: Template7, category: 'Image Based' },
  { id: 'template8', image: Template8, category: 'Image Based' },
  { id: 'template9', image: Template9, category: 'Image Based' }
];

const CATEGORIES = [
  "Image Based",
  "Video Focused",
  "Image & Text",
  "Tables",
  "Animated Popups",
  "Image & Text "
];

const PopupTemplateSelection = ({ isOpen, onClose, onSelect, onCustomize, selectedTemplateId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Image Based');
  const [localSelectedId, setLocalSelectedId] = useState(selectedTemplateId || null);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSelectedId(selectedTemplateId || null);
    }
  }, [isOpen, selectedTemplateId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center p-[2vw] backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[0.8vw] w-[70vw] h-[70vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between pt-[3vh] px-[3vw] pb-[1.5vh]">
          <div className="flex flex-col gap-[0.5vh]">
            <h2 className="text-[1.2vw] font-semibold text-[#111827]">Popup Templets</h2>
            <p className="text-[0.75vw] text-[#6B7280]">Select a professional popup design to get start</p>
          </div>

          <div className="flex items-center gap-[1vw]">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-[1.2vw] top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[17vw] h-[4vh] pl-[3vw] pr-[1.5vw] rounded-full border border-[#E5E7EB] outline-none text-[0.9vw] text-[#4B5563] placeholder-gray-400 focus:border-[#D1D5DB] transition-colors"
              />
            </div>

            {/* Filter Button */}
            <button className="flex items-center justify-center gap-[0.5vw] h-[4vh] px-[1.5vw] rounded-full border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-gray-100 text-[#4B5563] text-[0.9vw] font-medium transition-colors">
              <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filter
            </button>
          </div>
        </div>

        {/* Categories Row */}
        <div className="flex items-center gap-[1vw] px-[1vw] pl-[3vw] pb-[1.5vh] pt-[0.5vh]">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(cat.trim())}
              className={`px-[1vw] py-[0.5vh] rounded-[0.5vw] text-[0.80vw] transition-all active:scale-95 whitespace-nowrap ${activeCategory === cat.trim()
                  ? 'text-black bg-white shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)] border-gray-500/20 border font-semibold'
                  : 'text-gray-400 bg-white shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)] border border-transparent font-medium'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto px-[3vw] pb-[1vh] pt-[1vh] popup-template-scrollbar">
          <div className="grid grid-cols-3 gap-[1vw] pb-[8vh]">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setLocalSelectedId(tpl.id);
                }}
                className={`relative cursor-pointer group transition-all duration-300 ${localSelectedId === tpl.id
                    ? 'bg-white p-[0.4vw] rounded-[0.8vw] shadow-[0_12px_40px_rgba(0,0,0,0.2)] scale-[1.02]'
                    : 'bg-transparent p-0 rounded-[0.5vw] border-[2px] border-transparent hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                  }`}
              >
                <div className="relative w-full h-full bg-[#F9FAFB] rounded-[0.4vw] overflow-hidden flex items-center justify-center">
                  <img
                    src={tpl.image}
                    alt={`Template ${tpl.id}`}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  />
                  {/* Inner Shadow Overlay for Selected State */}
                  {localSelectedId === tpl.id && (
                    <div className="absolute inset-0 shadow-[inset_0_4px_20px_rgba(0,0,0,0.15)] pointer-events-none rounded-[0.4vw]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Overlay / Footer */}
        {localSelectedId && (
          <div className="absolute bottom-0 left-0 w-full bg-white pt-[1vh] pb-[1vh] px-[3vw] flex justify-end gap-[0.8vw] z-10 ">
            <div className="absolute inset-x-0 top-[-2vh] h-[2vh] pointer-events-none"></div>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-white border border-[#EF4444] text-[#EF4444] font-semibold text-[0.85vw] hover:bg-red-50 transition-all"
              onClick={() => {
                setLocalSelectedId(null);
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancel
            </button>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-white border border-[#111827] text-[#111827] font-semibold text-[0.85vw] hover:bg-gray-50 transition-all"
              onClick={() => {
                if (onCustomize) onCustomize(localSelectedId);
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Customize the Popup
            </button>
            <button
              className="flex items-center gap-[0.4vw] px-[1.2vw] py-[1vh] rounded-[0.6vw] bg-[#111827] text-white font-semibold text-[0.85vw] hover:bg-[#1F2937] transition-all"
              onClick={() => {
                if (onSelect) onSelect(localSelectedId);
                if (onClose) onClose();
              }}
            >
              <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Apply Popup
            </button>
          </div>
        )}

        {/* Animations Styles */}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.25s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PopupTemplateSelection;