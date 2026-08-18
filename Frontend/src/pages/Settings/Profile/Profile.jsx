import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Info, Phone, User, Building, MapPin, BarChart2, MoreVertical } from 'lucide-react';
import { Icon } from '@iconify/react';
import ThumbnailPopup from './Thumbnail_Popup';
import AvatarPopup from './AvatarPopup';
import EditProfile from './EditProfile';
import Activity from './Activity';
import p1 from '../../../assets/settings/p1.png';
const Profile = () => {
  const context = useOutletContext();
  const [localUser, setLocalUser] = useState({ name: 'Luffy', email: 'luffyonepiece@gmail.com', picture: null });
  const user = context?.user || localUser;
  const setUser = context?.setUser || setLocalUser;

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [activeStatsBookId, setActiveStatsBookId] = useState(null);
  const [isAvatarPopupOpen, setIsAvatarPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Edit Profile');
  const [bannerBg, setBannerBg] = useState({
    type: 'gradient',
    value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
  });

  const mockFlipbooks = [
    { id: 1, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 2, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 3, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 4, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 5, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 6, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 7, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
    { id: 8, name: 'Name of the Flipbook', pages: 28, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-transparent relative pb-[1vw]">

      {/* Top Banner */}
      <div className="relative h-[14vw] w-full rounded-[1vw]">
        {/* Green Banner Background matching the image */}
        <div
          className="absolute inset-0 rounded-[1vw] overflow-hidden transition-all duration-300"
          style={{
            background: bannerBg.type === 'solid' ? bannerBg.value : undefined,
            backgroundImage: (bannerBg.type === 'gradient' || bannerBg.type === 'media') ? bannerBg.value : undefined,
            backgroundSize: bannerBg.type === 'media' ? 'cover' : undefined,
            backgroundPosition: bannerBg.type === 'image' ? 'center' : undefined
          }}
        >
          {/* Faint wavy overlay could go here, using a CSS radial gradient as a placeholder for the texture */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 150%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% -50%, rgba(255,255,255,0.4) 0%, transparent 50%)' }}></div>
        </div>
        {/* Top right menu icon */}
        <div className="absolute top-[1vw] right-[1vw]">
          <button
            onClick={() => {
              setIsColorPickerOpen(!isColorPickerOpen);
              if (!isColorPickerOpen) setIsAvatarPopupOpen(false);
            }}
            className="bg-white/60 text-gray-800 p-[0.2vw] rounded-[0.4vw] transition-colors relative z-50 hover:bg-white/80 shadow-sm"
          >
            <MoreVertical size="1.2vw" />
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

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row relative mt-[1vw] bg-white border-2 border-gray-200 rounded-[1vw] shadow-sm">

        {/* Left Column (Avatar + Info) */}
        <div className="w-[22vw] flex-shrink-0 flex flex-col items-center pb-[2vw] border-r-2 border-gray-200 relative">

          {/* Top border eraser for container */}
          <div className="absolute top-[-0.2vw] left-[calc(50%-7.5vw)] w-[15vw] h-[0.4vw] bg-white z-10 pointer-events-none"></div>

          {/* Avatar Wrapper */}
          <div className="relative flex justify-center items-center z-30 w-[12vw] h-[12vw] mt-[-6vw]">
            {/* Left Smooth Corner */}
            <svg className="absolute top-[2.95vw] -left-[1.35vw] w-[2vw] h-[2vw] z-10 pointer-events-none" viewBox="0 0 10 10">
              <path d="M0,10 L10,10 L10,0 A10,10 0 0,1 0,10 Z" fill="white" />
            </svg>
            {/* Right Smooth Corner */}
            <svg className="absolute top-[2.95vw] -right-[1.35vw] w-[2vw] h-[2vw] z-10 pointer-events-none" viewBox="0 0 10 10">
              <path d="M10,10 L0,10 L0,0 A10,10 0 0,0 10,10 Z" fill="white" />
            </svg>

            <div className="w-full h-full rounded-full bg-white p-[0.6vw] relative flex items-center justify-center">

              {/* Semi-circle black border for the bottom half */}
              <div className="absolute bottom-0 left-0 w-full h-[50%] border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-full pointer-events-none z-20"></div>
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
                  <span className="text-white text-[4.5vw] font-bold drop-shadow-md">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
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
            <div className="absolute top-[2vw] right-[0vw] w-[2vw] h-[2vw] bg-white rounded-[0.4vw] flex items-center justify-center z-20">
              <button
                onClick={() => {
                  setIsAvatarPopupOpen(!isAvatarPopupOpen);
                  if (!isAvatarPopupOpen) setIsColorPickerOpen(false);
                }}
                className="w-[2vw] h-[2vw] bg-white rounded-[0.4vw] shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-gray-100 hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"
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
          <h1 className="text-[1.8vw] font-bold text-gray-900 mt-[1vw] truncate max-w-[18vw]">{user.name}</h1>
          <div className="flex items-center gap-[0.4vw] text-[0.8vw] text-gray-500 mt-[0.2vw] truncate max-w-[18vw]">
            <span className="w-[0.9vw] h-[0.9vw] bg-[#22c55e] rounded-full inline-block flex items-center justify-center flex-shrink-0">
              <svg width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span className="truncate">{user.email}</span>
          </div>

          {/* Info Cards Container */}
          <div className="w-full mt-[2vw] flex flex-col">

            <div className="p-[1vw] border-b border-gray-100">
              <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.5vw]">
                <Info size="1vw" /> About
              </h3>
              <p className="text-[0.75vw] text-gray-500 leading-relaxed">
                I'm going to be the King of the Pirates — that's my dream, and I'm never giving up on it. I love adventure, freedom, and good food (especially meat). I may not be the smartest, but I always trust my instincts and fight for what I believe in.
              </p>
            </div>

            <div className="p-[1vw] border-b border-gray-100 bg-[#FAFAFA]">
              <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                <Phone size="1vw" /> Contact Number
              </h3>
              <p className="text-[0.75vw] text-gray-500">6383319976</p>
            </div>

            <div className="p-[1vw] border-b border-gray-100">
              <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                <User size="1vw" /> Gender
              </h3>
              <p className="text-[0.75vw] text-gray-500">Male</p>
            </div>

            <div className="p-[1vw] border-b border-gray-100 bg-[#FAFAFA]">
              <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                <Building size="1vw" /> Company Name
              </h3>
              <p className="text-[0.75vw] text-gray-500">Fist-o Tech Private lmt</p>
            </div>

            <div className="p-[1vw]">
              <h3 className="flex items-center gap-[0.5vw] text-[0.85vw] font-semibold text-gray-700 mb-[0.3vw]">
                <MapPin size="1vw" /> Address
              </h3>
              <p className="text-[0.75vw] text-gray-500">No. 45, Lake View Street, Near Central Bus Stand,<br />Gandhipuram , Coimbatore,<br />Tamil Nadu - 641012</p>
            </div>
          </div>
        </div>

        {/* Right Column (Buttons + Catalog) */}
        <div className="flex-1 flex flex-col p-[1.5vw]">

          {/* Buttons Row */}
          <div className="flex gap-[0.5vw] mb-[2vw]">
            <button
              onClick={() => setActiveTab('Your IDC')}
              className={`px-[1.5vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Your IDC' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
            >
              Your IDC
            </button>
            <button
              onClick={() => setActiveTab('Edit Profile')}
              className={`px-[1.5vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Edit Profile' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('Activity')}
              className={`px-[1.5vw] py-[0.59vw] text-[0.9vw] font-semibold rounded-[0.5vw] transition-all border border-transparent bg-white ${activeTab === 'Activity' ? 'text-gray-900 shadow-[inset_0.2vw_0.2vw_0.4vw_rgba(0,0,0,0.08),inset_-0.2vw_-0.2vw_0.4vw_rgba(255,255,255,0.9)]' : 'text-gray-400 shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.3vw_0.3vw_0.7vw_rgba(0,0,0,0.08)]'}`}
            >
              Activity
            </button>
          </div>

          {/* Content Area */}
          {activeTab === 'Edit Profile' && <EditProfile user={user} setUser={setUser} />}

          {activeTab === 'Your IDC' && (
            <div className="flex-1 flex flex-col relative mt-[1vw]">
              {/* Catalog Section */}
              <h2 className="text-[1.25vw] font-bold text-gray-900 mb-[1.5vw]">
                Your Interactive Digital catalog
              </h2>

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
                        <h4 className="text-[0.75vw] font-bold text-gray-900 truncate">
                          {book.name}
                        </h4>
                        <p className="text-[0.6vw] text-gray-500 mt-[0.1vw] truncate">
                          Bring your content to life with a real, interactive experience.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveStatsBookId(activeStatsBookId === book.id ? null : book.id)}
                        className="bg-black text-white p-[0.35vw] rounded-full hover:bg-gray-800 transition-colors flex-shrink-0 shadow-sm relative z-20"
                      >
                        <BarChart2 size="0.8vw" />
                      </button>

                      {/* Stats Tooltip */}
                      {activeStatsBookId === book.id && (
                        <div className="absolute bottom-[3vw] right-[0.5vw] w-[10vw] bg-[#424242]/95 backdrop-blur-md border border-gray-600/30 rounded-[0.6vw] p-[0.5vw] shadow-2xl z-30 text-white animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex flex-col gap-[0.4vw] text-[0.65vw] font-medium text-gray-300">
                            <div>Views : <span className="text-white font-bold">528k</span></div>
                            <div>No of Pages : <span className="text-white font-bold">{book.pages}</span></div>
                            <div>Added to Shelf : <span className="text-white font-bold">250k</span></div>
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
                            <div>No of Ratings : <span className="text-white font-bold">1528</span></div>
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
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Activity' && <Activity />}
        </div>
      </div>
    </div>
  );
};

export default Profile;
