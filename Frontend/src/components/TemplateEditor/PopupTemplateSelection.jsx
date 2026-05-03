import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { popupTemplates } from '../../data/popupTemplates';

const PopupTemplateSelection = ({ onClose, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('Image & Video');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'Image',
    'Video',
    'Image & Video',
    'Image/Video/Text',
    'Image/Video/Text/Gif',
    'Image/Text',
    'Video Focused',
    'Full Image',
    'Comparison'
  ];

  const templates = popupTemplates;

  const handleSelect = (template) => {
    if (onSelect) {
      onSelect(template);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100001] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[#f9fafb] rounded-[16px] w-full max-w-[1000px] h-[750px] max-h-[90vh] shadow-2xl border border-white/20 flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#1e1e1e] mb-1">Popup Templates</h1>
              <p className="text-[#888888] text-[13px] font-medium">Select a professional popup design to get start</p>
            </div>

            <div className="flex items-center gap-2">

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] h-9 bg-[#f0f2f5] border-none rounded-full pl-9 pr-4 text-[13px] placeholder-[#a0a0a0] outline-none"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
              </div>

              {/* Filter Button */}
              <button className="flex items-center gap-1.5 h-9 px-4 bg-[#f0f2f5] rounded-full text-[13px] font-medium text-[#444444] hover:bg-[#e6e8eb] transition-colors">
                <SlidersHorizontal size={14} className="text-[#444444]" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 h-8 px-4 rounded-full text-[12px] font-medium transition-all ${selectedCategory === cat
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f0f2f5] text-[#777777] hover:bg-[#e6e8eb]'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar relative">
          <div className="grid grid-cols-3 gap-5">
            {templates.map((template, index) => (
              <div
                key={template.id}
                onClick={() => index === 0 && handleSelect(template)}
                className={`group relative bg-white border border-[#dfdfdf] rounded-[10px] overflow-hidden transition-all duration-300 ${index === 0
                  ? 'hover:shadow-lg hover:border-indigo-400 cursor-pointer'
                  : 'cursor-default opacity-80'
                  }`}
              >
                {template.id === 'restaurant-menu' ? (
                  /* Restaurant Menu Visual Mockup */
                  <div className="p-2 flex gap-2 h-[140px]" style={{ backgroundColor: '#faf7f2' }}>
                    <div className="w-[30%] flex flex-col gap-1">
                      <div className="h-12 bg-gray-200 rounded-[2px] overflow-hidden">
                        <img src={template.image} className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="flex-1 bg-white/50 rounded-[2px] border border-[#c9a962]/20 flex flex-col p-1 gap-1">
                        <div className="h-0.5 w-full bg-[#722f37]/20"></div>
                        <div className="h-0.5 w-[80%] bg-[#722f37]/20"></div>
                        <div className="h-0.5 w-[90%] bg-[#722f37]/20"></div>
                      </div>
                    </div>
                    <div className="w-[70%] flex flex-col items-center pt-2">
                      <div className="w-4 h-4 border border-[#c9a962] rounded-full mb-1"></div>
                      <div className="h-1.5 w-24 bg-[#2d2d2d]/80 mb-1"></div>
                      <div className="h-0.5 w-20 bg-[#c9a962]/40 mb-3"></div>

                      <div className="grid grid-cols-2 gap-2 w-full px-2">
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-[#722f37]/20"></div>
                          <div className="h-1 w-[80%] bg-[#722f37]/10"></div>
                          <div className="h-1 w-full bg-[#722f37]/20"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-[#722f37]/20"></div>
                          <div className="h-1 w-[80%] bg-[#722f37]/10"></div>
                          <div className="h-1 w-full bg-[#722f37]/20"></div>
                        </div>
                      </div>
                    </div>
                    {/* Left Side Decoration */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c9a962]/60 rounded-l-[10px]" />
                    <div className="absolute right-2 bottom-2 w-3.5 h-3.5 rounded-[2px] bg-white shadow-sm flex items-center justify-center p-0.5 border border-[#c9a962]/20">
                      <span className="text-[6px] font-bold text-[#c9a962]">M</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Automotive Layout Mockup */
                  <div className="p-2 flex gap-2 h-[140px]">
                    {/* Left portion with images */}
                    <div className="w-[35%] flex flex-col gap-1.5">
                      <div className="flex-1 rounded-[3px] bg-red-900/10 overflow-hidden relative border border-gray-100">
                        <img src={template.image} alt="car" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 h-10">
                        <div className="flex-1 rounded-[3px] bg-gray-100 overflow-hidden border border-gray-100">
                          <img src={template.image} alt="wheel" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 rounded-[3px] bg-gray-100 overflow-hidden border border-gray-100">
                          <img src={template.image} alt="parts" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                    {/* Right portion with text */}
                    <div className="w-[65%] pl-1 py-0.5 flex flex-col">
                      <h3 className="text-[11px] font-bold text-gray-900 mb-0.5 leading-tight">{template.name || "About Our Company"}</h3>
                      <p className="text-[6.5px] text-gray-500 leading-[1.2] mb-1.5 line-clamp-4">
                        Welcome to our premium automotive services. We provide high-quality parts and performance modifications for your dream vehicle.
                      </p>
                      <h4 className="text-[8px] font-bold text-[#eb5e28] mb-0.5 mt-auto">Our Strengths</h4>
                      <ul className="text-[6px] text-gray-600 space-y-0.5">
                        <li className="flex items-start gap-1">
                          <span className="text-[#eb5e28]">•</span> Correct manufacturing elements
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-[#eb5e28]">•</span> Multiple wheel designs
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-[#eb5e28]">•</span> Versatile steering & wheel support
                        </li>
                      </ul>
                    </div>

                    {/* Icon at bottom right */}
                    <div className="absolute right-2 bottom-2 w-3.5 h-3.5 rounded-[2px] bg-white shadow-sm flex items-center justify-center p-0.5 border border-gray-100">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[1px]"></div>
                    </div>
                    {/* Left Side Decoration (The red bar on some templates) */}
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#a81c1c]/90 rounded-l-[10px]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default PopupTemplateSelection;