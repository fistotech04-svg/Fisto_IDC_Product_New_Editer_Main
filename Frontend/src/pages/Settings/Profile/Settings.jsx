import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import CrownImg from '../../../assets/settings/Crown img.svg';
import p1 from '../../../assets/settings/p1.png';

const defaultColors = [
  '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626', 
  '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
];

export const getAvatarColor = (identifier, customColor) => {
  if (customColor && customColor !== '#E8D4C8' && customColor !== '#ffffff' && customColor !== 'transparent') {
    return customColor;
  }
  if (!identifier) return defaultColors[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
};

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

const getInitialProfile = () => {
  try {
    const cached = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (cached) {
      const parsed = JSON.parse(cached);
      const email = parsed.emailId || parsed.email || '';
      return {
        ...defaultProfile,
        ...parsed,
        email,
        emailId: email,
        name: parsed.name || (email ? email.split('@')[0] : 'User')
      };
    }
  } catch (e) {}
  return defaultProfile;
};

const SettingsLayout = () => {
  const [user, setUser] = useState(getInitialProfile);

  useEffect(() => {
    let targetEmail = '';
    const storedUser = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        targetEmail = parsedUser.emailId || parsedUser.email || '';
        setUser(prev => ({
          ...defaultProfile,
          ...prev,
          ...parsedUser,
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
            setUser(prev => {
              const updated = {
                ...defaultProfile,
                ...prev,
                ...p,
                email: p.emailId || prev.email || targetEmail,
                emailId: p.emailId || prev.emailId || targetEmail,
                name: p.name || prev.name,
                picture: p.picture || prev.picture || null,
                avatarBgColor: p.avatarBgColor || prev.avatarBgColor || '#E8D4C8',
                services: p.services || prev.services || [],
                socials: {
                  ...defaultProfile.socials,
                  ...(prev.socials || {}),
                  ...(p.socials || {})
                }
              };
              try {
                localStorage.setItem('user_profile', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        })
        .catch(err => console.error("Error loading profile in settings:", err));
    }
  }, []);

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
      <aside className="w-[16vw] mt-[1.5vw] flex-shrink-0 border-r border-gray-100 flex flex-col">
        
        {/* Navigation Links */}
        <div className="flex-1 px-[1vw] pb-[2vw] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sidebarGroups.map((group, index) => (
            <div key={index} className="mb-[1vw]">
              
              {/* Group Title with Line */}
              <div className="flex items-center gap-[1vw] mb-[0.8vw] px-[0.5vw]">
                <h4 className="text-[0.95vw] font-semibold text-gray-700 whitespace-nowrap">
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
