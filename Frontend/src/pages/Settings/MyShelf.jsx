import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import textureScreen1 from '../../assets/Bookshelf/texture_screen1.svg';
import bookShelf1 from '../../assets/Bookshelf/Book_shelf1.svg';
import textureScreen2 from '../../assets/Bookshelf/texture_screen2.png';
import bookShelf2 from '../../assets/Bookshelf/Book_shelf2.svg';
import textureScreen3 from '../../assets/Bookshelf/texture_screen3.svg';
import bookShelf3 from '../../assets/Bookshelf/Book_shelf3.svg';
import book1 from '../../assets/Bookshelf/Bookcover/book1.svg';
import book2 from '../../assets/Bookshelf/Bookcover/book2.svg';
import book3 from '../../assets/Bookshelf/Bookcover/book3.svg';
import book4 from '../../assets/Bookshelf/Bookcover/book4.svg';
import book5 from '../../assets/Bookshelf/Bookcover/book5.svg';
import book6 from '../../assets/Bookshelf/Bookcover/book6.svg';

const books = [book1, book2, book3, book4, book5, book6];
import customize1 from '../../assets/Bookshelf/customize_shelf/customize1.svg';
import customize2 from '../../assets/Bookshelf/customize_shelf/customize2.svg';
import customize3 from '../../assets/Bookshelf/customize_shelf/customize3.svg';
import listFrame from '../../assets/Bookshelf/list_frame.svg';

import cover1 from '../../assets/Explore/c-bg1.png';
import cover2 from '../../assets/Explore/c-bg2.png';
import cover3 from '../../assets/Explore/c-bg3.png';
import cover4 from '../../assets/Explore/c-bg4.png';
import cover5 from '../../assets/Explore/c-bg5.png';

const covers = [cover1, cover2, cover3, cover4, cover5];

const shelfOptions = [
  { id: 'customize1', name: 'Modern White', img: customize1 },
  { id: 'customize2', name: 'Classic Wood', img: customize2 },
  { id: 'customize3', name: 'Dark Oak', img: customize3 },
];

const MyShelf = () => {
  const [view, setView] = useState('shelf');
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [shelfRowCount, setShelfRowCount] = useState(3);
  const [flipbookSelect, setFlipbookSelect] = useState('my_flipbooks');

  // State for the currently applied shelf and the draft shelf in the modal
  const [activeShelfStyle, setActiveShelfStyle] = useState(shelfOptions[0].id);
  const [draftShelfStyle, setDraftShelfStyle] = useState(shelfOptions[0].id);

  const [booksData, setBooksData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const currentUserEmail = (() => {
      try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
              const u = JSON.parse(storedUser);
              if (u?.emailId || u?.email) return (u.emailId || u.email).toLowerCase();
          }
          const storedProfile = localStorage.getItem('user_profile');
          if (storedProfile) {
              const p = JSON.parse(storedProfile);
              if (p?.emailId || p?.email) return (p.emailId || p.email).toLowerCase();
          }
      } catch (e) {}
      return '';
  })();

  useEffect(() => {
    const fetchMyBooks = async () => {
        setIsLoading(true);
        try {
            if (!currentUserEmail) {
                setIsLoading(false);
                return;
            }
            const res = await axios.get(`${backendUrl}/api/explore/creator`, {
                params: { emailId: currentUserEmail }
            });
            if (res.data?.success) {
                if (res.data.profile) {
                    setProfileData(res.data.profile);
                }
                const rawBooks = res.data.books || [];
                const formatted = rawBooks.map((b, idx) => ({
                    rawBook: b,
                    v_id: b.v_id,
                    shareId: b.Customized_Settings?.Visibility?.shareId || b.Visibility?.shareId || b.v_id,
                    access: b.Customized_Settings?.Visibility?.access || b.Visibility?.access || 'public',
                    title: b.flipbookName || `Flipbook ${idx + 1}`,
                    cover: covers[idx % covers.length],
                    pages: b.pages?.length || 0,
                    views: b.views || '1.2k',
                    rating: b.rating || 4.5,
                    description: b.Customized_Settings?.FlipbookInfo?.quotes || '“Bring your content to life with a real, interactive experience”',
                    category: b.Customized_Settings?.FlipbookInfo?.category || 'Product Catalogue'
                }));
                setBooksData(formatted);
            }
        } catch (err) {
            console.error("Error fetching my shelf books:", err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMyBooks();
  }, [backendUrl, currentUserEmail]);

  const handleFlipbookSelect = (e) => {
    if (e.target.value === 'add_shelf') {
      setShelfRowCount(prev => prev + 1);
      setFlipbookSelect('my_flipbooks');
    } else {
      setFlipbookSelect(e.target.value);
    }
  };

  const openShelfModal = () => {
    setDraftShelfStyle(activeShelfStyle);
    setShowShelfModal(true);
  };

  const applyShelfStyle = () => {
    setActiveShelfStyle(draftShelfStyle);
    setShowShelfModal(false);
  };

  const getShelfAssets = (style) => {
    switch (style) {
      case 'customize1':
        return {
          type: 'rows',
          bg: textureScreen1,
          rowAsset: bookShelf1,
          rowCount: shelfRowCount,
          bgStretch: true,
          noZone: true,
          padding: 'px-6',
          topOffset: 6,
          spacing: 32,
          bookWidth: '15%',
          bookStyle: { bottom: '42%', padding: '0 14%' }
        };
      case 'customize2':
        return {
          type: 'rows',
          bg: textureScreen2,
          rowAsset: bookShelf2,
          rowCount: shelfRowCount,
          bgStretch: true,
          noZone: true,
          padding: 'px-0',
          topOffset: 29.7,
          spacing: 32.15,
          bookWidth: '14%',
          bookStyle: { bottom: '84.4%', padding: '0 10%' }
        };
      case 'customize3':
        return {
          type: 'rows',
          bg: textureScreen3,
          rowAsset: bookShelf3,
          rowCount: shelfRowCount,
          bgStretch: true,
          noZone: true,
          padding: 'px-0',
          rowPadding: '0 4%',
          topOffset: 5,
          spacing: 33,
          bookWidth: '12%',
          bookStyle: { bottom: '15%', padding: '0 7%' }
        };
      default:
        return {
          type: 'rows',
          bg: textureScreen1,
          rowAsset: bookShelf1,
          rowCount: shelfRowCount,
          bgStretch: true,
          noZone: true,
          padding: 'px-6',
          topOffset: 6,
          spacing: 32,
          bookWidth: '15%',
          bookStyle: { bottom: '42%', padding: '0 14%' }
        };
    }
  };

  const activeAssets = getShelfAssets(activeShelfStyle);

  // Calculate dynamic shelf positioning to perfectly preserve physical pixels
  const spacing = activeAssets.spacing ?? 32;
  const topOffset = activeAssets.topOffset ?? 6;
  const originalLast = topOffset + 2 * spacing;
  
  // Container grows such that the last shelf always lands exactly on the original visual bottom (originalLast)
  const heightRatio = shelfRowCount <= 3 ? 1 : (topOffset + (shelfRowCount - 1) * spacing) / originalLast;
  
  // Scale percentages inversely so physical positions remain identical
  const newTopOffset = topOffset / heightRatio;
  const newSpacing = spacing / heightRatio;

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
        <select 
          className="px-4 py-2 border rounded-md text-sm bg-white focus:outline-none focus:border-blue-500"
          value={flipbookSelect}
          onChange={handleFlipbookSelect}
        >
          <option value="my_flipbooks">My Flipbooks</option>
          <option value="add_shelf">Add Shelf</option>
        </select>
        <select className="px-4 py-2 border rounded-md text-sm bg-white focus:outline-none focus:border-blue-500">
          <option>All Status</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[calc(100vh-40px)] relative">
        {view === 'shelf' ? (
          /* Shelf Area */
          <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-inner h-full">
            <div
              className={`relative w-full bg-center bg-no-repeat ${activeAssets.noZone ? '' : 'rounded-xl'}`}
              style={{
                minHeight: '100%',
                height: `${heightRatio * 100}%`,
                backgroundImage: activeAssets.bg ? `url('${activeAssets.bg}')` : 'none',
                backgroundSize: activeAssets.bgStretch ? '100% 100%' : 'cover'
              }}
            >
              {openMenuId && (
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setOpenMenuId(null)}
                />
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

              {activeAssets.type === 'rows' && activeAssets.rowAsset && (
                <div className="absolute inset-0 w-full h-full">
                  {Array.from({ length: activeAssets.rowCount }, (_, i) => (
                    <div
                      key={i}
                      className={`absolute left-0 w-full ${activeAssets.rowPadding ? '' : (activeAssets.padding || 'px-12')}`}
                      style={{
                        top: `${newTopOffset + (i * newSpacing)}%`,
                        padding: activeAssets.rowPadding || undefined
                      }}
                    >
                    <img src={activeAssets.rowAsset} alt="Shelf" className="w-full h-auto drop-shadow-lg" />
                    {/* Books Container */}
                    <div
                      className="absolute inset-0 flex justify-between items-end"
                      style={activeAssets.bookStyle || { bottom: '15%', padding: '0 5%' }}
                    >
                      {i < 3 && books.map((book, bIdx) => (
                        <div key={bIdx} className={`relative group cursor-pointer flex items-end ${openMenuId === `${i}-${bIdx}` ? 'z-40' : 'hover:z-30'} ${bIdx === 0 ? 'translate-x-3' : bIdx === 1 ? 'translate-x-3' : bIdx === 2 ? 'translate-x-4' : ''}`} style={{ width: activeAssets.bookWidth || '12%' }}>
                          <img src={book} alt={`Book ${bIdx}`} className={`w-full h-auto drop-shadow-md transition-transform origin-bottom ${bIdx === 2 ? 'scale-[1.16] group-hover:scale-[1.22]' : 'group-hover:scale-105'}`} />

                          {/* Hover Menu Pill */}
                          <div className={`absolute ${bIdx === 2 ? '-top-2 right-5' : 'top-[2%] right-1'} w-5 h-[46px] bg-[#E8E6E1] rounded-full flex flex-col items-center justify-between py-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 pointer-events-none group-hover:pointer-events-auto`}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === `${i}-${bIdx}` ? null : `${i}-${bIdx}`)}
                              className="text-black hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 transition-colors"
                            >
                              <Icon icon="mdi:dots-vertical" className="text-[14px]" />
                            </button>
                            <button className="bg-[#3C3C3C] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center mb-0.5 hover:bg-black transition-colors">
                              <Icon icon="mdi:information-variant" className="text-[8px] font-bold" />
                            </button>
                          </div>

                          {/* Dropdown Menu */}
                          {openMenuId === `${i}-${bIdx}` && (
                            <div className={`absolute ${bIdx === 2 ? '-top-2 right-10' : 'top-[2%] -right-2'} bg-white rounded-md shadow-xl border border-gray-100 py-1 w-28 z-50`}>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                                <Icon icon="mdi:book-open-outline" className="w-3.5 h-3.5 text-gray-400" />
                                Open Book
                              </button>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors">
                                <Icon icon="mdi:trash-can-outline" className="w-3.5 h-3.5 text-red-400" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              {isLoading ? (
                  <div className="col-span-full py-10 flex justify-center text-gray-500">Loading...</div>
              ) : booksData.length === 0 ? (
                  <div className="col-span-full py-10 flex justify-center text-gray-500">No flipbooks found.</div>
              ) : (
                booksData.map((book, idx) => (
                <div key={book.v_id || idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 relative group">
                  {/* Thumbnail Container */}
                  <div className="relative w-full aspect-[4/4] flex items-center justify-center bg-gray-50">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                      
                      {/* Menu Button (Three Dots) */}
                      <div 
                          className={`absolute top-2 right-2 transition-opacity duration-200 ${openMenuId === book.v_id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
                      >
                          <button
                            onClick={() => setOpenMenuId(openMenuId === book.v_id ? null : book.v_id)}
                            className="bg-white/80 backdrop-blur-sm p-1 rounded-md hover:bg-white text-gray-800 focus:outline-none transition-colors shadow-sm cursor-pointer"
                          >
                             <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
                          </button>

                          {openMenuId === book.v_id && (
                            <div className="absolute top-[110%] right-0 w-36 bg-white rounded-lg shadow-xl py-1.5 z-20 border border-gray-100">
                                <button 
                                  onClick={() => {
                                      const targetShareId = book.shareId || book.v_id;
                                      const rawAcc = String(book.access || 'public').toLowerCase();
                                      if (targetShareId) {
                                          window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                                      }
                                      setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                >
                                  <Icon icon="mdi:book-open-outline" className="w-4 h-4 text-gray-400" />
                                  Open Book
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                  <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-red-400" />
                                  Delete
                                </button>
                            </div>
                          )}
                      </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-4 flex flex-col flex-1 bg-white">
                      {/* Author Info */}
                      <div className="flex items-center gap-3">
                          {profileData?.picture && profileData.picture !== 'color_only' ? (
                              <img
                                  src={profileData.picture}
                                  alt={profileData.name}
                                  className="w-9 h-9 rounded-full border border-gray-200 object-cover shrink-0"
                              />
                          ) : (
                              <div 
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner"
                                  style={{ backgroundColor: profileData?.avatarBgColor || '#4c5add' }}
                              >
                                  {(profileData?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                          )}
                          <div className="flex flex-col min-w-0 pr-1">
                              <span className="text-sm font-semibold text-gray-900 leading-tight truncate">{profileData?.name || 'Creator'}</span>
                              <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 truncate">
                                  <Icon icon="lucide:map-pin" className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{(profileData?.city || profileData?.state || 'Coimbatore').replace(/📍/g, '').trim()}</span>
                              </span>
                          </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 justify-start text-xs text-gray-700 font-medium mt-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                              <span className="text-black font-semibold">{book.pages || 0}</span>
                              <span className="font-normal text-gray-500">Pages</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                              <Icon icon="lucide:eye" className="w-3.5 h-3.5 text-gray-400" />
                              {book.views || '1.2k'}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                              <Icon icon="material-symbols:star" className="w-4 h-4 text-yellow-400" />
                              {book.rating || 4.5}
                          </span>
                      </div>

                      {/* Title & Desc & Button */}
                      <div className="relative flex-1 mt-3">
                          <h4 className="text-[15px] font-semibold text-black truncate tracking-tight mb-1">{book.title}</h4>
                          <p className="text-[12px] text-gray-500 leading-relaxed pr-10 line-clamp-2">{book.description}</p>

                          {/* Action Button */}
                          <button
                              onClick={() => {
                                  const targetShareId = book.shareId || book.v_id;
                                  const rawAcc = String(book.access || 'public').toLowerCase();
                                  if (targetShareId) {
                                      window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                                  }
                              }}
                              className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                          >
                              <Icon icon="mdi:arrow-top-right" className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                </div>
              )))}
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
                  onClick={() => setDraftShelfStyle(option.id)}
                  className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 group relative bg-white shadow-sm ${draftShelfStyle === option.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-transparent hover:border-gray-200 hover:shadow-md'
                    }`}
                >
                  <div className="bg-[#f0ece6] aspect-[4/3] flex items-center justify-center p-4 relative">
                    <img src={option.img} alt={option.name} className="w-full h-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                    {draftShelfStyle === option.id && (
                      <div className="absolute inset-0 bg-blue-500/10"></div>
                    )}
                  </div>
                  <div className={`p-3 text-center border-t transition-colors ${draftShelfStyle === option.id ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
                    <p className={`text-sm font-semibold ${draftShelfStyle === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {option.name}
                    </p>
                  </div>
                  {draftShelfStyle === option.id && (
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
