import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import shelfBg from '../../assets/Book Shelf/texture screen1.svg';
import shelfBar from '../../assets/Book Shelf/Book shelf1.svg';
import customize1 from '../../assets/Book shelf/customize shelf/customize1.svg';
import customize2 from '../../assets/Book shelf/customize shelf/customize2.svg';
import customize3 from '../../assets/Book shelf/customize shelf/customize3.svg';
import listFrame from '../../assets/Book shelf/list_frame.svg';

const shelfOptions = [
  { id: 'style1', name: 'Classic Wood', img: customize1 },
  { id: 'style2', name: 'Modern White', img: customize2 },
  { id: 'style3', name: 'Dark Oak', img: customize3 },
];

const MyShelf = () => {
  const [view, setView] = useState('shelf');
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // State for the currently applied shelf and the draft shelf in the modal
  const [activeShelfStyle, setActiveShelfStyle] = useState(shelfOptions[0].img);
  const [draftShelfStyle, setDraftShelfStyle] = useState(shelfOptions[0].img);

  const openShelfModal = () => {
    setDraftShelfStyle(activeShelfStyle);
    setShowShelfModal(true);
  };

  const applyShelfStyle = () => {
    setActiveShelfStyle(draftShelfStyle);
    setShowShelfModal(false);
    // Note: To fully apply the design, we would map the selected style (e.g. style2) 
    // to its corresponding background and shelf bar images in the future.
  };

  return (
    <div className="flex flex-col w-full h-full px-4 pb-0 pt-1 overflow-visible font-sans text-gray-800">

      {/* Header */}
      <div className="flex justify-between items-start mb-3 -mt-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Shelf</h1>
          <p className="text-sm text-gray-500">PNG format keeps your logo clean and background-free</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('shelf')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium ${view === 'shelf' ? 'bg-gray-100' : 'bg-white'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Shelf View
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium ${view === 'list' ? 'bg-gray-100' : 'bg-white'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            List View
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <select className="px-4 py-2 border rounded-md text-sm bg-white focus:outline-none focus:border-blue-500">
          <option>My Flipbooks</option>
        </select>
        <select className="px-4 py-2 border rounded-md text-sm bg-white focus:outline-none focus:border-blue-500">
          <option>All Status</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[calc(100vh-80px)] relative">
        {view === 'shelf' ? (
          /* Shelf Area */
          <div 
            className="flex-1 relative rounded-xl overflow-hidden shadow-inner bg-center bg-no-repeat bg-white" 
            style={{ 
              backgroundImage: `url(${activeShelfStyle === customize1 ? shelfBg : 'none'})`,
              backgroundSize: 'cover'
            }}
          >
            {activeShelfStyle !== customize1 && (
              <img src={activeShelfStyle} className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} alt="shelf" />
            )}
            <div className="absolute right-4 top-4 z-20">
              <div 
                className="bg-white/80 backdrop-blur p-2 rounded-full cursor-pointer hover:bg-white shadow-sm transition-all"
                onClick={openShelfModal}
                title="Change Shelf"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </div>
            </div>

            {activeShelfStyle === customize1 && (
              <div className="absolute inset-0 w-full h-full">
                {/* Shelf Row 1 */}
                <div className="absolute top-[6%] left-0 w-full px-12">
                  <img src={shelfBar} alt="Shelf" className="w-full h-auto drop-shadow-lg" />
                </div>

                {/* Shelf Row 2 */}
                <div className="absolute top-[38%] left-0 w-full px-12">
                  <img src={shelfBar} alt="Shelf" className="w-full h-auto drop-shadow-lg" />
                </div>

                {/* Shelf Row 3 */}
                <div className="absolute top-[70%] left-0 w-full px-12">
                  <img src={shelfBar} alt="Shelf" className="w-full h-auto drop-shadow-lg" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View Grid */
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            {openMenuId && (
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setOpenMenuId(null)} 
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="bg-[#FFFBF6] border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Image Area Wrapper */}
                  <div className="p-2 pb-0">
                    <div className="relative w-full aspect-square bg-[#e2b58d] rounded-xl overflow-hidden">
                      <img src={listFrame} alt="Flipbook" className="w-full h-full object-cover" />
                      
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === item ? null : item)}
                        className="absolute top-3 right-3 text-white hover:text-gray-200 bg-black/20 rounded-md p-0.5 transition-colors z-30"
                      >
                        <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
                      </button>

                      {openMenuId === item && (
                        <div className="absolute top-10 right-3 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 w-36 z-40">
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                            <Icon icon="mdi:book-open-outline" className="w-4 h-4 text-gray-400" />
                            Open Book
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                            <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-red-400" />
                            Delete
                          </button>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        28 Pages
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    {/* Stats */}
                    <div className="flex flex-col gap-1 text-[7px] 2xl:text-[8px] text-gray-800 w-full">
                      {/* Row 1 */}
                      <div className="flex items-center gap-1 w-full">
                        {/* Box 1: Rated */}
                        <div className="flex items-center gap-0.5 bg-[#EFE9E2] px-1 py-0.5 rounded-[4px] whitespace-nowrap">
                          <Icon icon="material-symbols-light:star-rounded" className="w-3 h-3 text-orange-500 shrink-0" />
                          <span><span className="font-semibold">4.5</span> <span className="text-gray-500">(1,255)</span> rated</span>
                        </div>
                        
                        {/* Box 2: Added to shelf */}
                        <div className="flex items-center gap-0.5 bg-[#EFE9E2] px-1 py-0.5 rounded-[4px] whitespace-nowrap">
                          <Icon icon="ri:book-shelf-line" className="w-2.5 h-2.5 text-[#8C4A20] shrink-0" />
                          <span><span className="font-semibold">2.56k</span> added to shelf</span>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="flex items-center gap-1 w-full">
                        {/* Box 3: Reader */}
                        <div className="flex items-center gap-0.5 bg-[#EFE9E2] px-1 py-0.5 rounded-[4px] whitespace-nowrap">
                          <Icon icon="si:eye-line" className="w-2.5 h-2.5 text-gray-800 shrink-0" />
                          <span><span className="font-semibold">12.5k</span> reader</span>
                        </div>
                        
                        {/* Box 4: Category */}
                        <div className="flex items-center bg-[#EFE9E2] px-1 py-0.5 rounded-[4px] whitespace-nowrap">
                          <span>Product Catalogue</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Title, Desc & Action Button */}
                    <div className="mt-2 pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
                      <div className="flex-1 pr-1">
                        <h3 className="font-bold text-gray-900 text-[14px] mb-1.5 leading-tight">Name of the Flipbook</h3>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          Bring your content to life with a real, interactive experience.
                        </p>
                      </div>
                      
                      <button className="bg-black text-white rounded-full p-2.5 hover:bg-gray-800 transition-colors shadow-sm shrink-0 mb-0.5">
                        <Icon icon="mdi:arrow-top-right" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="w-64 flex flex-col justify-end gap-6 h-full pb-4">

          {/* Shelf Usage */}
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm">Shelf Usage</h3>
            <div className="h-2 w-full bg-gray-200 rounded-full mb-3">
              <div className="h-2 bg-blue-600 rounded-full w-1/2"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>25 of 50 Flipbooks Used</span>
              <span>50%</span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#fef9f4] border border-[#faedd9] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="font-semibold text-sm">Tips</h3>
            </div>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Drag and Drop flipbooks to rearrange them on your shelf
            </p>
            <div className="flex justify-center items-end gap-3 relative px-2 mt-2">
              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />
              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />
              
              <div className="relative z-10 -translate-y-2">
                <Icon icon="duo-icons:book" className="w-14 h-14 text-yellow-500 drop-shadow-md" />
                <Icon icon="game-icons:click" className="absolute -bottom-3 -right-3 w-8 h-8 text-black" />
              </div>
              
              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />
            </div>
          </div>

        </div>
      </div>

      {/* Change Shelf Modal */}
      {showShelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowShelfModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-[700px] max-w-[90vw] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Change Shelf</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a shelf style for your My Shelf</p>
              </div>
              <button 
                onClick={() => setShowShelfModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50/50">
              {shelfOptions.map((option) => (
                <div 
                  key={option.id}
                  onClick={() => setDraftShelfStyle(option.img)}
                  className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 group relative bg-white shadow-sm ${
                    draftShelfStyle === option.img 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-transparent hover:border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="bg-[#f0ece6] aspect-[4/3] flex items-center justify-center p-4 relative">
                    <img src={option.img} alt={option.name} className="w-full h-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                    {draftShelfStyle === option.img && (
                      <div className="absolute inset-0 bg-blue-500/10"></div>
                    )}
                  </div>
                  <div className={`p-3 text-center border-t transition-colors ${draftShelfStyle === option.img ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
                    <p className={`text-sm font-semibold ${draftShelfStyle === option.img ? 'text-blue-700' : 'text-gray-700'}`}>
                      {option.name}
                    </p>
                  </div>
                  {draftShelfStyle === option.img && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-sm">
                      <Icon icon="mdi:check-bold" className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setShowShelfModal(false)}
                className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={applyShelfStyle}
                className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all"
              >
                Apply Shelf
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShelf;
