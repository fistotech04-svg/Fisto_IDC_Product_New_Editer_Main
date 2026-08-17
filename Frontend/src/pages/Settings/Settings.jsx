import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@iconify/react';
import CrownImg from '../../assets/settings/Crown img.svg';

const SettingsLayout = () => {
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
      <aside className="w-[16.25vw] flex-shrink-0 border-r border-gray-100 flex flex-col">
        
        {/* User Info (Top Left of Sidebar) */}
        <div className="p-[1.5vw] flex items-center justify-between border-b border-gray-100 mb-[0.5vw] relative group cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-[1vw]">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" 
              alt="Profile" 
              className="w-[2.5vw] h-[2.5vw] rounded-full object-cover shadow-sm"
            />
            <div>
              <h3 className="text-[1.1vw] font-semibold text-gray-900">Luffy</h3>
              <p className="text-[0.75vw] text-gray-500">luffyonepiece@gmail.com</p>
            </div>
          </div>
          <button className="text-gray-800 hover:text-gray-900 mt-[-3vw] ">
            <Icon icon="fa7-regular:edit" className="w-[1.2vw] h-[1.2vw]" />
          </button>
        </div>

        <div className="flex-1 px-[1vw] pb-[2vw] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sidebarGroups.map((group, index) => (
            <div key={index} className="mb-[1vw]">
              
              {/* Group Title with Line */}
              <div className="flex items-center gap-[1vw] mb-[0.4vw] px-[0.5vw]">
                <h4 className="text-[0.85vw] font-semibold text-gray-600 whitespace-nowrap">
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
          <button className="w-full relative overflow-visible bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white rounded-[0.8vw] py-[0.6vw] flex items-center justify-center gap-[0.5vw] transition-all hover:shadow-lg hover:-translate-y-0.5 group">
            {/* Adding a subtle noise/stars pattern could be done with a background image here */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 rounded-[0.8vw]"></div>
            
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
      <main className="flex-1 overflow-y-auto bg-white p-[2vw]">
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
