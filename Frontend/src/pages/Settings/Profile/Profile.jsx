import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Info, Phone, User, Building, MapPin, BarChart2, MoreVertical, Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import ThumbnailPopup from './Thumbnail_Popup';
import AvatarPopup from './AvatarPopup';
import EditProfile from './EditProfile';
import Activity from './Activity';
import p1 from '../../../assets/settings/p1.png';
const Profile = () => {
  const context = useOutletContext();
  const [localUser, setLocalUser] = useState({
    name: 'Luffy',
    email: 'luffyonepiece@gmail.com',
    picture: null,
    about: "I'm going to be the King of the Pirates — that's my dream, and I'm never giving up on it. I love adventure, freedom, and good food (especially meat). I may not be the smartest, but I always trust my instincts and fight for what I believe in.",
    mobile: '6383319976',
    companyName: 'Fist-o Tech Private lmt',
    industryType: 'Software Development',
    companyEmail: 'fistotech@gmail.com',
    website: 'Fist-o.com',
    services: ['Website Development', '3D Animations', 'IDC'],
    address1: 'No. 45, Lake View Street, Near Central Bus Stand',
    address2: 'Gandhipuram',
    city: 'Coimbatore',
    pincode: '641012',
    state: 'Tamil Nadu',
    country: 'INDIA',
    socials: {
      website: 'https://www.fistotech.com',
      instagram: 'https://www.instagram.com/fistotech',
      linkedin: 'https://www.linkedin.com/company/fistotech',
      facebook: 'https://www.facebook.com/fistotech',
      whatsapp: 'https://wa.me/918876543210'
    }
  });
  const user = context?.user || localUser;
  const setUser = context?.setUser || setLocalUser;

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [activeStatsBookId, setActiveStatsBookId] = useState(null);
  const [isAvatarPopupOpen, setIsAvatarPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Your IDC');
  const [bannerBg, setBannerBg] = useState({
    type: 'gradient',
    value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);
  const [isChildScrollable, setIsChildScrollable] = useState(false);

  useEffect(() => {
    if (scrollProgress >= 0.99) {
      setIsChildScrollable(true);
    } else if (!isScrolling) {
      setIsChildScrollable(false);
    }
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('profile-container');
      const scrollTop = container?.scrollTop || 0;
      const maxScroll = window.innerWidth * 0.15; // 15vw scroll distance for full effect
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      setScrollProgress(progress);

      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    let scrollAnimation = null;
    let targetScroll = null;

    const handleWheel = (e) => {
      if (e.deltaY < 0) {
        const profileContainer = document.getElementById('profile-container');
        if (!profileContainer || profileContainer.scrollTop <= 0) return;
        
        let target = e.target;
        let isChildScrolling = false;
        
        while (target && target !== profileContainer) {
          if (target.scrollHeight > target.clientHeight) {
            const overflowY = window.getComputedStyle(target).overflowY;
            if (overflowY === 'auto' || overflowY === 'scroll') {
              if (target.scrollTop > 0) {
                isChildScrolling = true;
                break;
              }
            }
          }
          target = target.parentElement;
        }
        
        if (!isChildScrolling) {
          e.preventDefault(); // Stop native aborts
          
          if (Math.abs(e.deltaY) < 40) {
            // Trackpad: apply tiny deltas instantly
            profileContainer.scrollTop += e.deltaY;
            targetScroll = profileContainer.scrollTop;
          } else {
            // Mouse wheel: smooth cubic ease-out animation
            if (targetScroll === null) targetScroll = profileContainer.scrollTop;
            targetScroll += (e.deltaY * 1.5); 
            targetScroll = Math.max(0, Math.min(targetScroll, profileContainer.scrollHeight - profileContainer.clientHeight));
            
            if (scrollAnimation) cancelAnimationFrame(scrollAnimation);
            
            const startScroll = profileContainer.scrollTop;
            const distance = targetScroll - startScroll;
            const startTime = performance.now();
            const duration = 250; 
            
            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              const easeOut = 1 - Math.pow(1 - progress, 3);
              profileContainer.scrollTop = startScroll + (distance * easeOut);
              
              if (progress < 1) {
                scrollAnimation = requestAnimationFrame(animate);
              } else {
                targetScroll = null;
              }
            };
            scrollAnimation = requestAnimationFrame(animate);
          }
        }
      }
    };

    const container = document.getElementById('profile-container');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollAnimation) cancelAnimationFrame(scrollAnimation);
    };
  }, []);

  const mockFlipbooks = [
    { id: 1, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 4, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 5, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 6, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 7, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 8, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 9, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 10, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 11, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 12, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 13, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 14, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 15, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 16, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <div id="profile-container" className="flex flex-col flex-1 h-full min-h-0 bg-transparent relative overflow-y-auto hide-scrollbar">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0.1 vw;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 1vw;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 1vw;
        }
      `}</style>

      {/* Dummy spacer to create 15vw scroll area */}
      <div style={{ height: `calc(100% + 15vw)` }} className="w-full absolute top-0 left-0 pointer-events-none z-[-1]"></div>

      {/* Sticky wrapper for actual content */}
      <div className="sticky top-0 h-full flex flex-col w-full min-h-0 pointer-events-auto">

        {/* Top right menu icon - Moved outside banner wrapper to avoid stacking context issues */}
        <div className="sticky top-0 z-[60] w-full pointer-events-none" style={{ height: 0 }}>
          <div className="absolute top-[1vw] right-[1vw] pointer-events-auto">
            <button
              onClick={() => {
                setIsColorPickerOpen(!isColorPickerOpen);
                if (!isColorPickerOpen) setIsAvatarPopupOpen(false);
              }}
              className="bg-white/60 text-gray-800 p-[0.4vw] rounded-[0.4vw] transition-colors relative z-50 hover:bg-white/80 shadow-sm"
            >
              <Icon icon="mdi:edit-outline" className="w-[1.2vw] h-[1.2vw]" />
            </button>

            {/* Pop-up Color Picker */}
            <ThumbnailPopup
              isOpen={isColorPickerOpen}
              onClose={() => setIsColorPickerOpen(false)}
              bannerBg={bannerBg}
              setBannerBg={setBannerBg}
            />
          </div>
        </div>

        {/* Top Banner Wrapper */}
        <div
          className="relative w-full rounded-[1vw] z-[05] flex-shrink-0"
          style={{ height: `${14 - (8 * scrollProgress)}vw` }}
        >

          {/* Actual Shrinking Banner */}
          <div
            className="absolute top-0 inset-x-0 rounded-[1vw] overflow-hidden"
            style={{
              height: `${14 - (8 * scrollProgress)}vw`,
              background: bannerBg.type === 'solid' ? bannerBg.value : undefined,
              backgroundImage: (bannerBg.type === 'gradient' || bannerBg.type === 'media') ? bannerBg.value : undefined,
              backgroundSize: bannerBg.type === 'media' ? 'cover' : undefined,
              backgroundPosition: bannerBg.type === 'image' ? 'center' : undefined
            }}
          >
            {/* Faint wavy overlay could go here, using a CSS radial gradient as a placeholder for the texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 150%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% -50%, rgba(255,255,255,0.4) 0%, transparent 50%)' }}></div>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          className="flex flex-col md:flex-row relative bg-white border-2 border-gray-200 rounded-[1vw] shadow-sm flex-1 min-h-0 min-w-0 w-full z-[40]"
          style={{ marginTop: `${1 - 0.35 * scrollProgress}vw` }}
        >

          {/* Left Column (Avatar + Info) */}
          <div className="w-[22vw] flex-shrink-0 border-r-2 border-gray-200 relative flex flex-col min-h-0">
            <div className="flex flex-col items-center flex-1 min-h-0 z-[70] w-full">


              {/* Top border eraser for container */}
              <div
                className="absolute top-[-0.2vw] left-[calc(50%-7.5vw)] w-[15vw] h-[0.4vw] bg-white z-10 pointer-events-none"
                style={{ transform: `scaleX(${1 - (0.30 * scrollProgress)})`, transformOrigin: 'center' }}
              ></div>

              {/* Avatar Wrapper */}
              <div
                className="relative flex justify-center items-center z-[70] w-[12vw] h-[12vw] mt-[-6vw]"
                style={{ transform: `scale(${1 - (0.30 * scrollProgress)})`, transformOrigin: 'center' }}
              >
                {/* Left Smooth Corner */}
                <svg className="absolute top-[3.19vw] -left-[1vw] w-[1.5vw] h-[2vw] z-10 pointer-events-none" viewBox="0 0 10 10">
                  <path d="M0,10 L10,10 L10,0 A10,10 0 0,1 0,10 Z" fill="white" />
                </svg>
                {/* Right Smooth Corner */}
                <svg className="absolute top-[3.19vw] -right-[1vw] w-[1.5vw] h-[2vw] z-10 pointer-events-none" viewBox="0 0 10 10">
                  <path d="M10,10 L0,10 L0,0 A10,10 0 0,0 10,10 Z" fill="white" />
                </svg>

                <div className="w-full h-full rounded-full bg-white p-[0.8vw] relative flex items-center justify-center">

                  {/* Semi-circle black border for the bottom half */}
                  <div
                    className="absolute bottom-0 left-0 w-full h-[50%] border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-full pointer-events-none z-20"
                    style={{ clipPath: 'polygon(0 16%, 100% 16%, 100% 100%, 0 100%)' }}
                  ></div>

                  <svg className="absolute bottom-[41.5%] -left-[1.1vw] w-[1.4vw] h-[1.1vw] z-10 pointer-events-none overflow-visible" viewBox="0 0 10 10">
                    <path d="M -7 0 L 0 0 A 10 10 0 0 1 10 10" fill="none" stroke="#e6e8ec" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  </svg>
                  {/* Right Smooth Corner */}
                  <svg className="absolute bottom-[41.5%] -right-[1.15vw] w-[1.4vw] h-[1.1vw] z-10 pointer-events-none overflow-visible" viewBox="0 0 10 10">
                    <path d="M 17 0 L 10 0 A 10 10 0 0 0 0 10" fill="none" stroke="#e6e8ec" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                  </svg>

                  <div
                    className="w-[10.7vw] h-[10.7vw] rounded-full overflow-hidden relative shadow-inner z-10 bg-white transition-colors duration-300 flex items-center justify-center"
                    style={{ backgroundColor: user.avatarBgColor === '#E8D4C8' && user.picture === 'color_only' ? '#E8D4C8' : (user.avatarBgColor === '#E8D4C8' ? '#ffffff' : user.avatarBgColor) }}
                  >
                    {user.picture && user.picture !== 'color_only' && !user.picture.includes('unsplash') ? (
                      <img
                        src={user.picture}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (user.picture === 'color_only' ? (
                      <span className="text-white text-[4.5vw] font-semibold drop-shadow-md">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    ) : (
                      <img
                        src={p1}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ))}
                  </div>
                </div>

                {/* Pencil Edit Icon with merged white ring */}
                <div className="absolute top-[1vw] right-[1.3vw] w-[2vw] h-[2vw] bg-white rounded-[0.4vw] flex items-center justify-center z-20">
                  <button
                    onClick={() => {
                      setIsAvatarPopupOpen(!isAvatarPopupOpen);
                      if (!isAvatarPopupOpen) setIsColorPickerOpen(false);
                    }}
                    className="w-[1.5vw] h-[1.5vw] bg-white rounded-[0.4vw] hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"
                  >
                    <Icon icon="mdi:edit-outline" className="w-[1.2vw] h-[1.2vw]" />
                  </button>
                  <AvatarPopup
                    isOpen={isAvatarPopupOpen}
                    onClose={() => setIsAvatarPopupOpen(false)}
                    onSelectAvatar={(avatar) => setUser({ ...user, picture: avatar })}
                    onSelectColor={(color) => {
                      setUser({ ...user, picture: 'color_only', avatarBgColor: color });
                    }}
                  />
                </div>
              </div>

              {/* Name and Email */}
              <h1 className="text-[1.5vw] font-semibold text-gray-900 mt-[1vw] truncate max-w-[18vw]">{user.name}</h1>
              <div className="flex items-center gap-[0.4vw] text-[1vw] text-gray-500 mt-[0.2vw] truncate max-w-[18vw]">
                <Icon icon="mdi:check-decagram" className="w-[1.2vw] h-[1.2vw] text-[#22c55e] flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {/* Info Cards Container */}
              <div id="left-scroll-container" className={`w-full mt-[2vw] pb-[2vw] flex flex-col flex-1 min-h-0 hide-scrollbar ${isChildScrollable ? 'overflow-y-scroll' : 'overflow-hidden'}`}>

                <div className="p-[1vw] border-b border-gray-100">
                  <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                    <Info size="1vw" /> About
                  </h3>
                  <p className="text-[0.75vw] text-gray-500 leading-relaxed whitespace-pre-wrap">
                    {user.about}
                  </p>
                </div>

                <div className="p-[1vw] border-b border-gray-100 bg-[#FAFAFA]">
                  <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                    <Phone size="1vw" /> Contact Number
                  </h3>
                  <p className="text-[0.75vw] text-gray-500">{user.mobile}</p>
                </div>

                <div className="p-[1vw] border-b border-gray-100">
                  <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                    <Building size="1vw" /> Company / Organization Details
                  </h3>
                  <div className="flex flex-col gap-[0.4vw] text-[0.75vw]">
                    {user.companyName && <p><span className="font-semibold text-gray-700">Name :</span> <span className="text-gray-500">{user.companyName}</span></p>}
                    {user.industryType && <p><span className="font-semibold text-gray-700">Industry Type :</span> <span className="text-gray-500">{user.industryType}</span></p>}
                    {user.companyEmail && <p><span className="font-semibold text-gray-700">Gmail :</span> <span className="text-gray-500">{user.companyEmail}</span></p>}
                    {user.website && <p><span className="font-semibold text-gray-700">Website :</span> <a href={user.website?.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{user.website}</a></p>}
                    {user.services?.length > 0 && <p><span className="font-semibold text-gray-700">Services :</span> <span className="text-gray-500">{Array.isArray(user.services) ? user.services.join(', ') : user.services}</span></p>}
                  </div>
                </div>

                <div className="p-[1vw] border-b border-gray-100 bg-[#FAFAFA]">
                  <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                    <MapPin size="1vw" /> Address
                  </h3>
                  <div className="text-[0.75vw] text-gray-500">
                    {user.address1 || user.address2 ? <div>{[user.address1, user.address2].filter(Boolean).join(', ')}</div> : null}
                    {user.city || user.state ? <div>{[user.city, user.state].filter(Boolean).join(', ')}</div> : null}
                    {user.country || user.pincode ? <div>{[user.country, user.pincode].filter(Boolean).join(' - ')}</div> : null}
                  </div>
                </div>

                <div className="p-[1vw] flex gap-[0.5vw] justify-center items-center">
                  {user.socials?.website && (
                    <div onClick={() => window.open(user.socials.website, '_blank')} className="w-[2vw] h-[2vw] bg-[#1a1a1a] rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                      <Globe className="w-[1.2vw] h-[1.2vw] text-white" />
                    </div>
                  )}
                  {user.socials?.linkedin && (
                    <div onClick={() => window.open(user.socials.linkedin, '_blank')} className="w-[2vw] h-[2vw] bg-[#0077b5] rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                      <Icon icon="mdi:linkedin" className="w-[1.4vw] h-[1.4vw] text-white" />
                    </div>
                  )}
                  {user.socials?.instagram && (
                    <div onClick={() => window.open(user.socials.instagram, '_blank')} className="w-[2vw] h-[2vw] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                      <Icon icon="mdi:instagram" className="w-[1.3vw] h-[1.3vw] text-white" />
                    </div>
                  )}
                  {user.socials?.facebook && (
                    <div onClick={() => window.open(user.socials.facebook, '_blank')} className="w-[2vw] h-[2vw] bg-[#1877f2] rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                      <Icon icon="mdi:facebook" className="w-[1.4vw] h-[1.4vw] text-white" />
                    </div>
                  )}
                  {user.socials?.whatsapp && (
                    <div onClick={() => window.open(user.socials.whatsapp, '_blank')} className="w-[2vw] h-[2vw] bg-[#25d366] rounded-[0.4vw] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                      <Icon icon="mdi:whatsapp" className="w-[1.4vw] h-[1.4vw] text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Buttons + Catalog) */}
          <div className="flex-1 relative h-full min-w-0">
            <div className="flex flex-col h-full w-full z-[45]">
              {/* Header Area */}
              <div className="pt-[1vw] pl-[1vw] pr-[1vw] pb-0 relative flex-shrink-0 z-[60]">


                {/* Buttons Row & Save Actions Portal */}
                <div className="flex justify-between items-center w-full relative z-[60]">
                  <div className="flex gap-[0.5vw]">
                    <button
                      onClick={() => setActiveTab('Your IDC')}
                      className={`px-[1vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Your IDC' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
                    >
                      Your IDC
                    </button>
                    <button
                      onClick={() => setActiveTab('Edit Profile')}
                      className={`px-[1vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Edit Profile' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('Activity')}
                      className={`px-[1vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Activity' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
                    >
                      Activity
                    </button>
                  </div>
                  <div id="save-buttons-portal-target"></div>
                </div>
              </div>

              {/* Content Area */}
              <div id="main-scroll-container" className={`flex-1 pl-[1.5vw] pb-[2vw] custom-scrollbar ${isChildScrollable ? 'overflow-y-scroll pr-[1.5vw]' : 'overflow-hidden pr-[1.8vw]'}`}>
                {activeTab === 'Edit Profile' && <EditProfile user={user} setUser={setUser} />}

                {activeTab === 'Your IDC' && (
                  <div className="flex-1 flex flex-col relative mt-[1.5vw]">
                    {/* Catalog Section */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1vw]">
                      {mockFlipbooks.map((book) => (
                        <div key={book.id} className="border border-gray-100 rounded-[0.6vw] overflow-visible group hover:shadow-md transition-shadow bg-white flex flex-col shadow-sm relative">

                          <div className="relative h-[12vw] bg-[#f0dcd0] overflow-hidden flex items-center justify-center p-[1vw] rounded-t-[0.6vw]">
                            <img
                              src={book.image}
                              alt={book.name}
                              className="w-[85%] h-[85%] object-cover transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md rounded-[0.2vw]"
                            />
                            <div className="absolute bottom-[0.5vw] right-[0.5vw] bg-black/60 backdrop-blur-sm text-white text-[0.55vw] font-medium px-[0.6vw] py-[0.2vw] rounded-full">
                              {book.pages} Pages
                            </div>
                          </div>

                          <div className="p-[0.8vw] flex items-center justify-between border-t border-gray-50 bg-white rounded-b-[0.6vw]">
                            <div className="flex-1 min-w-0 pr-[0.5vw]">
                              <h4 className="text-[0.75vw] font-semibold text-gray-900 truncate">
                                {book.name}
                              </h4>
                              <p className="text-[0.6vw] text-gray-500 mt-[0.1vw] truncate">
                                Bring your content to life with a real, interactive experience.
                              </p>
                            </div>
                            <div
                              onMouseEnter={() => setActiveStatsBookId(book.id)}
                              onMouseLeave={() => setActiveStatsBookId(null)}
                            >
                              <button
                                className="bg-black text-white p-[0.35vw] rounded-full hover:bg-gray-800 transition-colors flex-shrink-0 shadow-sm relative z-20"
                              >
                                <BarChart2 size="0.8vw" />
                              </button>

                              {/* Stats Tooltip */}
                              {activeStatsBookId === book.id && (
                                <div className="absolute bottom-[3vw] right-[0.5vw] w-[10vw] bg-[#424242]/95 backdrop-blur-md border border-gray-600/30 rounded-[0.6vw] p-[0.5vw] shadow-2xl z-30 text-white animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex flex-col gap-[0.4vw] text-[0.65vw] font-medium text-gray-300">
                                    <div>Views : <span className="text-white font-semibold">528k</span></div>
                                    <div>No of Pages : <span className="text-white font-semibold">{book.pages}</span></div>
                                    <div>Added to Shelf : <span className="text-white font-semibold">250k</span></div>
                                    <div className="flex items-center gap-[0.2vw]">
                                      Ratings :
                                      <div className="flex items-center text-yellow-400">
                                        <Icon icon="lucide:star" className="fill-current w-[0.65vw] h-[0.65vw]" />
                                        <Icon icon="lucide:star" className="fill-current w-[0.65vw] h-[0.65vw]" />
                                        <Icon icon="lucide:star" className="fill-current w-[0.65vw] h-[0.65vw]" />
                                        <Icon icon="lucide:star" className="fill-current w-[0.65vw] h-[0.65vw]" />
                                        <Icon icon="lucide:star" className="w-[0.65vw] h-[0.65vw]" />
                                      </div>
                                      <span className="text-gray-400">(4.5)</span>
                                    </div>
                                    <div>No of Ratings : <span className="text-white font-semibold">1528</span></div>
                                  </div>

                                  <div className="mt-[0.5vw] flex justify-start">
                                    <a href="#" className="flex items-center gap-[0.2vw] text-[0.75vw] text-white hover:text-gray-200 underline underline-offset-2 transition-colors">
                                      View More details
                                      <Icon icon="lucide:arrow-up-right" className="w-[1vw] h-[1vw]" />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'Activity' && <Activity />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
