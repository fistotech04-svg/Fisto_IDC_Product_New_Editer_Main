import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import CrownImg from '../../../assets/settings/Crown img.svg';
import p1 from '../../../assets/settings/p1.png';

const defaultProfile = {
  name: 'User',
  email: '',
  emailId: '',
  picture: null,
  avatarBgColor: '#E8D4C8',
  about: '',
  mobile: '',
  companyName: '',
  industryType: '',
  companyEmail: '',
  website: '',
  services: [],
  address1: '',
  address2: '',
  city: '',
  pincode: '',
  state: '',
  country: 'INDIA',
  socials: {
    website: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    whatsapp: ''
  },
  bannerBg: {
    type: 'gradient',
    value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
  }
};

const SettingsLayout = () => {
  const [user, setUser] = useState(defaultProfile);

  useEffect(() => {
    let targetEmail = '';
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        targetEmail = parsedUser.emailId || parsedUser.email || '';
        setUser(prev => ({
          ...prev,
          name: parsedUser.name || (targetEmail ? targetEmail.split('@')[0] : 'User'),
          email: targetEmail || '',
          emailId: targetEmail || '',
          picture: parsedUser.picture || null,
          avatarBgColor: parsedUser.avatarBgColor || '#E8D4C8'
        }));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    if (targetEmail) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      fetch(`${backendUrl}/api/profile?emailId=${encodeURIComponent(targetEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.success && data?.profile) {
            const p = data.profile;
            setUser(prev => ({
              ...defaultProfile,
              ...prev,
              ...p,
              email: p.emailId || prev.email || targetEmail,
              emailId: p.emailId || prev.emailId || targetEmail,
              name: p.name || prev.name,
              services: p.services || prev.services || [],
              socials: {
                ...defaultProfile.socials,
                ...(prev.socials || {}),
                ...(p.socials || {})
              }
            }));
          }
        })
        .catch(err => console.error("Error loading profile in settings:", err));
    }
  }, []);

  const [isEditingSidebar, setIsEditingSidebar] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);

  useEffect(() => {
    setEditName(user.name);
    setEditEmail(user.email);
  }, [user]);

  const handleSidebarSave = () => {
    setUser({ ...user, name: editName, email: editEmail });
    setIsEditingSidebar(false);
  };

  const sidebarGroups = [
    {
      title: 'General',
      items: [
        { path: 'profile', label: 'Profile', icon: 'mingcute:profile-line' },
        { path: 'account', label: 'Account', icon: 'iconamoon:profile' },
        { path: 'notifications', label: 'Notifications', icon: 'basil:notification-on-outline' },
        { path: 'my-shelf', label: 'My Shelf', icon: 'clarity:library-line' },
      ]
    },
    {
      title: 'Workspace',
      items: [
        { path: 'editor-defaults', label: 'Editor Defaults', icon: 'vaadin:edit' },
        { path: 'library', label: 'Library', icon: 'clarity:library-line' },
        { path: 'integrations', label: 'Integrations', icon: 'oui:integration-general' },
      ]
    },
    {
      title: 'System & Billing',
      items: [
        { path: 'privacy-access', label: 'Privacy & Access', icon: 'line-md:security' },
        { path: 'analytics', label: 'Analytics', icon: 'carbon:analytics' },
        { path: 'billing', label: 'Billing', icon: 'tdesign:bill' },
        { path: 'advanced', label: 'Advanced', icon: 'gcp:advanced-solutions-lab' },
        { path: 'account-management', label: 'Account Management', icon: 'material-symbols:manage-accounts-outline-rounded' },
      ]
    }
  ];

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[16vw] flex-shrink-0 border-r border-gray-100 flex flex-col">
        
        {/* User Info (Top Left of Sidebar) */}
        <div className="p-[1.5vw] flex items-center justify-between border-b border-gray-100 mb-[0.5vw] relative group hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-[1vw] flex-1 min-w-0">
            <div 
              className="w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden relative shadow-sm flex items-center justify-center bg-white transition-colors duration-300 flex-shrink-0"
              style={{ backgroundColor: user.avatarBgColor === '#E8D4C8' && user.picture === 'color_only' ? '#E8D4C8' : (user.avatarBgColor === '#E8D4C8' ? '#ffffff' : user.avatarBgColor) }}
            >
              {user.picture && user.picture !== 'color_only' && !user.picture.includes('unsplash') ? (
                 <img 
                    src={user.picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                 />
              ) : (user.picture === 'color_only' ? (
                 <span className="text-white text-[1.2vw] font-semibold drop-shadow-md">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              ) : (
                 <img 
                    src={p1} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                 />
              ))}
            </div>
            <div className="flex-1 min-w-0 pr-[0.5vw]">
              {isEditingSidebar ? (
                <div className="flex flex-col gap-[0.2vw]">
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSidebarSave()}
                    autoFocus
                    className="text-[1.1vw] font-semibold text-gray-900 border-b border-gray-300 focus:border-gray-500 focus:outline-none bg-transparent w-full"
                  />
                  <input 
                    type="text" 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSidebarSave()}
                    className="text-[0.75vw] text-gray-500 border-b border-gray-300 focus:border-gray-500 focus:outline-none bg-transparent w-full mt-[0.2vw]"
                  />
                </div>
              ) : (
                <div onClick={() => setIsEditingSidebar(true)} className="cursor-pointer">
                  <h3 className="text-[1.1vw] font-semibold text-gray-900 truncate max-w-[9vw]" title={user.name}>{user.name}</h3>
                  <p className="text-[0.75vw] text-gray-500 truncate max-w-[9vw]" title={user.email}>{user.email}</p>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              if (isEditingSidebar) handleSidebarSave();
              else setIsEditingSidebar(true);
            }}
            className="text-gray-800 hover:text-gray-900 mt-[-3vw] flex-shrink-0"
          >
            <Icon icon={isEditingSidebar ? "mdi:check" : "fa7-regular:edit"} className="w-[1.2vw] h-[1.2vw]" />
          </button>
        </div>

        <div className="flex-1 px-[1vw] pb-[2vw] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sidebarGroups.map((group, index) => (
            <div key={index} className="mb-[1vw]">
              
              {/* Group Title with Line */}
              <div className="flex items-center gap-[1vw] mb-[0.4vw] px-[0.5vw]">
                <h4 className="text-[0.9vw] font-semibold text-gray-700 whitespace-nowrap">
                  {group.title}
                </h4>
                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
              </div>

              <div className="flex flex-col gap-[0.2vw]">
                {group.items.map((item) => {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `
                        flex items-center gap-[1vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] text-[0.8125vw] font-semibold transition-colors
                        ${isActive 
                          ? 'bg-[#F2F2F2] text-gray-800' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon 
                            icon={item.icon} 
                            className={`w-[1vw] h-[1vw] flex-shrink-0 text-gray-700 ${item.icon.startsWith('gcp:') ? 'grayscale brightness-0 opacity-90' : ''}`} 
                            style={{ strokeWidth: '1.2px' }}
                          />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Profile Button */}
        <div className="p-[0.5vw] mb-[0.5vw]">
          <button className="w-full relative overflow-visible bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white rounded-[0.8vw] py-[0.6vw] flex items-center justify-center gap-[0.5vw] transition-all group">
            {/* Adding a subtle noise/stars pattern could be done with a background image here */}
            <div className="absolute inset-0 bg-black opacity-30 rounded-[0.8vw]"></div>
            
            <span className="font-semibold text-[0.9vw] relative z-10 flex items-center gap-[0.5vw]">
              Upgrade Profile 
              <span className="group-hover:translate-x-1 inline-block transition-transform font-semibold text-[1.2vw]">→</span>
            </span>
            
            <img 
              src={CrownImg} 
              alt="Crown" 
              className="absolute -top-[2vw] -right-[1vw] w-[4vw] h-[4vw] z-20 drop-shadow-xl transform rotate-12"
            />
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white p-[1vw] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Outlet context={{ user, setUser }} />
      </main>
    </div>
  );
};

export default SettingsLayout;
