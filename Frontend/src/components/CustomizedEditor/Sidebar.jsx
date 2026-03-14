import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import SidebarItem from './SidebarItem';
import Appearance from './Appearance';
import MenuBar from './MenuBar';
import OtherSetup from './OtherSetup';
import LeadForm from './LeadForm';
import Visibility from './Visibility';
import Statistic from './Statistic';

const SubNavItem = ({ label, icon, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-[0.75vw] px-[1.75vw] py-[0.75vw] rounded-[1vw] transition-all text-[0.75vw] font-semibold text-left ${
      isActive 
        ? 'bg-[#DBDBEA] text-[#3E4491]' 
        : 'hover:bg-[#DBDBEA] text-[#3E4491]'
    }`}
  >
    <Icon 
      icon={icon} 
      className={`w-[1vw] h-[1vw] ${isActive ? 'text-[#3E4491]' : 'text-gray-700'}`} 
    />
    <span className={`flex-1 ${isActive ? 'text-[#3E4491]' : 'text-gray-600'}`}>{label}</span>
  </button>
);

const Sidebar = ({ bookName, setBookName, activeSubView, setActiveSubView, pageCount, visibilitySettings, onUpdateVisibility }) => {
  const [openSection, setOpenSection] = useState(null);

  // Synchronize openSection with activeSubView
  useEffect(() => {
    if (activeSubView === 'logo' || activeSubView === 'profile') {
      setOpenSection('branding');
    } else if (['background', 'layout', 'bookappearance'].includes(activeSubView)) {
      setOpenSection('appearance');
    } else if (activeSubView) {
      setOpenSection(activeSubView);
    }
  }, [activeSubView]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const tabConfigs = {
    'logo': { icon: 'lucide:gem', top: 154 },
    'profile': { icon: 'lucide:user', top: 206 },
    'background': { icon: 'mdi:texture', top: 326 },
    'theme': { icon: 'lucide:palette', top: 378 },
  };

  const activeTab = tabConfigs[activeSubView];

  return (
    <div className="w-[16.25vw] h-full bg-white border-r border-gray-100 flex flex-col relative z-30">

      {/* Book Title Section */}
      <div className="h-[8vh] px-[1.5vw] flex flex-col justify-center shrink-0 border-b border-gray-100">
        <div className="flex items-center justify-between pb-[0.25vw]">
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="text-[1.0625vw] font-medium text-gray-800 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0"
            placeholder="Name of the Book"
          />
          <Icon icon="mdi:rename" className="w-[1.25vw] h-[1.25vw] text-gray-800 cursor-pointer" />
        </div>
        <div className="flex justify-start">
          <span className="text-[0.6875vw] font-bold text-gray-400">{pageCount || 0} Pages</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto pt-[0.5vw] custom-scrollbar">
        <SidebarItem
          icon="material-symbols:branding-watermark-outline"
          label="Branding"
          isOpen={openSection === 'branding'}
          onClick={() => toggleSection('branding')}
          isActive={openSection === 'branding'}
        >
          <div className=" mb-[0.5vw] p-[0.25vw] rounded-[1vw] border-[0.125vw] border-[#DBDBEA] bg-white space-y-[0.25vw] shadow-sm">
             <SubNavItem 
              label="Logo" 
              icon="lucide:gem" 
              isActive={activeSubView === 'logo'} 
              onClick={() => setActiveSubView('logo')} 
             />
             <SubNavItem 
              label="Profile" 
              icon="lucide:user" 
              isActive={activeSubView === 'profile'} 
              onClick={() => setActiveSubView('profile')} 
             />
          </div>
        </SidebarItem>

        <SidebarItem
          icon="tabler:background"
          label="Appearance"
          isOpen={openSection === 'appearance'}
          onClick={() => toggleSection('appearance')}
          isActive={openSection === 'appearance'}
        >
          <div className="mb-[0.5vw] p-[0.25vw] rounded-[1vw] border-[0.125vw] border-[#DBDBEA] bg-white space-y-[0.25vw] shadow-sm">
             <SubNavItem 
              label="Background" 
              icon="mdi:texture" 
              isActive={activeSubView === 'background'} 
              onClick={() => setActiveSubView('background')} 
             />
             <SubNavItem 
              label="Layout" 
              icon="lucide:layout-dashboard" 
              isActive={activeSubView === 'layout'} 
              onClick={() => setActiveSubView('layout')} 
             />
             <SubNavItem 
              label="Book Appearance" 
              icon="lucide:settings-2" 
              isActive={activeSubView === 'bookappearance'} 
              onClick={() => setActiveSubView('bookappearance')} 
             />
          </div>
        </SidebarItem>

        <SidebarItem
          icon="mingcute:menu-fill"
          label="Menu Bar"
          isActive={activeSubView === 'menubar'}
          onClick={() => setActiveSubView(activeSubView === 'menubar' ? null : 'menubar')}
          hasDropdown={false}
        />

        <SidebarItem
          icon="qlementine-icons:page-setup-16"
          label="Other Setup"
          isActive={activeSubView === 'othersetup'}
          onClick={() => setActiveSubView(activeSubView === 'othersetup' ? null : 'othersetup')}
          hasDropdown={false}
        />

        <SidebarItem
          icon="fluent:form-48-regular"
          label="Lead Form"
          isActive={activeSubView === 'leadform'}
          onClick={() => setActiveSubView(activeSubView === 'leadform' ? null : 'leadform')}
          hasDropdown={false}
        />

        <SidebarItem
          icon="mdi:visibility-outline"
          label="Visibility"
          isOpen={openSection === 'visibility'}
          onClick={() => toggleSection('visibility')}
          isActive={openSection === 'visibility'}
        >
          <div className="mb-[0.5vw] p-[0.5vw] rounded-[1vw] border border-[#DBDBEA] bg-white space-y-[0.25vw] shadow-sm">
            {[
              { id: 'Public', label: 'Public' },
              { id: 'Private', label: 'Private' },
              { id: 'Password Protect', label: 'Password Protect' },
              { id: 'Invite only Access', label: 'Invite only Access' }
            ].map((option) => (
              <label 
                key={option.id}
                className={`flex items-center gap-[0.75vw] px-[1.25vw] py-[0.75vw] rounded-[0.75vw] cursor-pointer transition-all ${
                  visibilitySettings.type === option.id ? 'bg-[#eeeffc]' : 'hover:bg-gray-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onUpdateVisibility({ ...visibilitySettings, type: option.id });
                  setActiveSubView('visibility');
                }}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="visibility-type"
                    checked={visibilitySettings.type === option.id}
                    onChange={() => {}} // Handled by label click
                    className="peer appearance-none w-[1.1vw] h-[1.1vw] border-2 border-gray-400 rounded-full checked:border-indigo-600 transition-all bg-white"
                  />
                  <div className="absolute w-[0.55vw] h-[0.55vw] bg-indigo-600 rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className={`text-[0.75vw] font-medium ${visibilitySettings.type === option.id ? 'text-indigo-900' : 'text-gray-600'}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </SidebarItem>

        <SidebarItem
          icon="material-symbols:leaderboard-rounded"
          label="Statistic"
          isActive={activeSubView === 'statistic'}
          onClick={() => setActiveSubView(activeSubView === 'statistic' ? null : 'statistic')}
          hasDropdown={false}
        />
      </div>
    </div>
  );
};

export default Sidebar;
