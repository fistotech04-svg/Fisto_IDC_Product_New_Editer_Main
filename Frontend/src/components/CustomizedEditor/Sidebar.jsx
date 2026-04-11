import React, { useState, useEffect, useRef } from 'react';
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
    className={`w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] rounded-[0.6vw] transition-all text-[0.75vw] font-semibold text-left ${
      isActive 
        ? 'bg-[#DBDBEA] text-[#3E4491] active-sub-nav' 
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

const Sidebar = ({ bookName, setBookName, activeSubView, setActiveSubView, isPanelCollapsed, setIsPanelCollapsed, pageCount, visibilitySettings, onUpdateVisibility, canUndo, canRedo, onUndo, onRedo, onPreview }) => {
  const [openSection, setOpenSection] = useState(null);

  const getParentSection = (subView) => {
    if (!subView) return null;
    if (subView === 'logo' || subView === 'profile') return 'branding';
    if (['background', 'layout', 'bookappearance'].includes(subView)) return 'appearance';
    if (subView === 'visibility') return 'visibility';
    // Standalone items that also have submenus or just toggle the panel
    if (['menubar', 'othersetup', 'leadform', 'statistic'].includes(subView)) return subView;
    return null;
  };

  const parentSection = getParentSection(activeSubView);

  const [tabTop, setTabTop] = useState(154);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);
  const hasMovedRef = useRef(false);
  const isManuallyPositioned = useRef(false); // true after user drags to a custom position

  // Synchronize openSection with activeSubView
  useEffect(() => {
    const parent = getParentSection(activeSubView);
    if (parent) {
      setOpenSection(parent);
    }
    // Reset manual positioning when switching to a new sub-view
    isManuallyPositioned.current = false;
  }, [activeSubView]);

  // Dynamic Tab Positioning — skipped if user has manually dragged the tab
  useEffect(() => {
    const updateTabPos = () => {
      if (isDragging || isManuallyPositioned.current || !sidebarRef.current) return;
      
      let anchor = null;
      
      // 1. Try to find the visible active sub-nav item
      const subNav = sidebarRef.current.querySelector('.active-sub-nav');
      if (subNav) {
        const subNavParent = subNav.closest('.overflow-hidden');
        // Check if the accordion container is expanded (max-h > 0)
        if (subNavParent && !subNavParent.classList.contains('max-h-0')) {
          anchor = subNav;
        }
      }
      
      // 2. Fallback: Find the parent section button (it now has a section-specific ID)
      if (!anchor && parentSection) {
        anchor = sidebarRef.current.querySelector(`#section-${parentSection}`);
      }
      
      // 3. Last fallback: any active sidebar item
      if (!anchor) {
        anchor = sidebarRef.current.querySelector('.active-sidebar-item');
      }
      
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const parentRect = sidebarRef.current.getBoundingClientRect();
        const relativeTop = rect.top - parentRect.top + (rect.height / 2) - 24;
        setTabTop(relativeTop);
      }
    };

    updateTabPos();
    const timer = setTimeout(updateTabPos, 300); // Wait for accordion transition
    
    window.addEventListener('resize', updateTabPos);
    return () => {
      window.removeEventListener('resize', updateTabPos);
      clearTimeout(timer);
    };
  }, [activeSubView, openSection, isDragging, parentSection]);



  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const tabConfigs = {
    'logo': { icon: 'lucide:gem', top: 154 },
    'profile': { icon: 'lucide:user', top: 206 },
    'background': { icon: 'iconify codex--add-background', top: 326 },
    'layout': { icon: 'lucide:layout-panel-left', top: 378 },
    'bookappearance': { icon: 'lucide:settings-2', top: 430 },
    'menubar': { icon: 'mingcute:menu-fill', top: 482 },
    'othersetup': { icon: 'qlementine-icons:page-setup-16', top: 534 },
    'leadform': { icon: 'fluent:form-48-regular', top: 586 },
    'visibility': { icon: 'mdi:visibility-outline', top: 638 },
    'statistic': { icon: 'material-symbols:leaderboard-rounded', top: 690 },
  };

  const activeTab = tabConfigs[activeSubView];

  // Removed this useEffect as dynamic positioning is now handled by the other useEffect
  // useEffect(() => {
  //   if (activeTab && !isDragging) {
  //     setTabTop(activeTab.top);
  //   }
  // }, [activeSubView]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !sidebarRef.current) return;
      hasMovedRef.current = true;
      isManuallyPositioned.current = true; // user is setting a custom position
      const rect = sidebarRef.current.getBoundingClientRect();
      const newTop = e.clientY - rect.top;
      setTabTop(Math.max(10, Math.min(newTop, rect.height - 60)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // If user just clicked (no drag movement), toggle the panel
      if (!hasMovedRef.current) {
        setIsPanelCollapsed(prev => !prev);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  return (
    <div 
      ref={sidebarRef}
      className="w-[16.25vw] h-full bg-white border-r border-gray-100 flex flex-col relative z-30 overflow-visible"
    >

      {/* Draggable Tab Handle and Full-height Line — only visible when sub-panel is collapsed */}
      {activeSubView && activeTab && isPanelCollapsed && (
          <div className="absolute left-full top-0 w-[3.5vw] h-full pointer-events-none z-50">
            {/* The full-height vertical black line (0.25vw wide) */}
            <div className="absolute left-[-1px] top-0 w-[0.25vw] h-full bg-black pointer-events-auto  shadow-[0.1vw_0_0.5vw_rgba(0,0,0,0.1)]" />
            
            {/* The Draggable icon itself - repositioned to overlap with the line */}
            <div
              onMouseDown={handleMouseDown}
              className={`absolute flex items-stretch rounded-r-[0.8vw] cursor-pointer shadow-[0.2vw_0_1vw_rgba(0,0,0,0.2)] pointer-events-auto group ${
                isDragging ? 'cursor-grabbing scale-100' : 'cursor-grab'
              }`}
              style={{ 
                top: `${tabTop}px`,
                transition: isDragging ? 'none' : 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.1s ease'
              }}
            >
              {/* Internal overflow-hidden container for icons/background */}
              <div className="flex items-stretch rounded-r-[0.8vw] overflow-hidden min-h-[3vw] ">
                {/* Connector strip to ensure no gap with the line */}
                <div className="w-[0.25vw] h-full bg-black flex-shrink-0 " />
                <div className="w-[3vw] h-[3vw] bg-black text-white flex items-center justify-center">
                  <Icon
                    icon={activeTab.icon}
                    className="w-[1.5vw] h-[1.5vw]"
                  />
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Book Title Section */}
      <div className="px-[1.5vw] py-[1vh] flex flex-col shrink-0 border-b border-gray-100">
        <div className="flex items-center justify-between border-b border-black pb-[0.2vw]">
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="text-[1vw] font-medium text-gray-800 bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0"
            placeholder="Name of the Book"
          />
          <Icon icon="mdi:rename" className="w-[1.25vw] h-[1.25vw] text-gray-800 cursor-pointer" />
        </div>
        
        <div className="flex justify-end mt-[1vh]">
           <div className="bg-[#F3F4F6] px-[0.65vw] py-[0.1vw] rounded-[0.4vw]">
             <span className="text-[0.8vw] font-medium text-gray-700">{pageCount || 0} Pages</span>
           </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto pt-[0.2vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <SidebarItem
          id="section-branding"
          icon="material-symbols:branding-watermark-outline"
          label="Branding"
          isOpen={openSection === 'branding'}
          onClick={() => toggleSection('branding')}
          isActive={openSection ? openSection === 'branding' : parentSection === 'branding'}
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
          id="section-appearance"
          icon="tabler:background"
          label="Appearance"
          isOpen={openSection === 'appearance'}
          onClick={() => toggleSection('appearance')}
          isActive={openSection ? openSection === 'appearance' : parentSection === 'appearance'}
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
              icon="lucide:layout-panel-left" 
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
          id="section-menubar"
          icon="mingcute:menu-fill"
          label="Menu Bar"
          isActive={openSection ? openSection === 'menubar' : activeSubView === 'menubar'}
          onClick={() => setActiveSubView(activeSubView === 'menubar' ? null : 'menubar')}
          hasDropdown={false}
        />

        <SidebarItem
          id="section-othersetup"
          icon="qlementine-icons:page-setup-16"
          label="Other Setup"
          isActive={openSection ? openSection === 'othersetup' : activeSubView === 'othersetup'}
          onClick={() => setActiveSubView(activeSubView === 'othersetup' ? null : 'othersetup')}
          hasDropdown={false}
        />

        <SidebarItem
          id="section-leadform"
          icon="fluent:form-48-regular"
          label="Lead Form"
          isActive={openSection ? openSection === 'leadform' : activeSubView === 'leadform'}
          onClick={() => setActiveSubView(activeSubView === 'leadform' ? null : 'leadform')}
          hasDropdown={false}
        />

        <SidebarItem
          id="section-visibility"
          icon="mdi:visibility-outline"
          label="Visibility"
          isOpen={openSection === 'visibility'}
          onClick={() => toggleSection('visibility')}
          isActive={openSection ? openSection === 'visibility' : parentSection === 'visibility'}
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
          id="section-statistic"
          icon="material-symbols:leaderboard-rounded"
          label="Statistic"
          isActive={openSection ? openSection === 'statistic' : activeSubView === 'statistic'}
          onClick={() => setActiveSubView(activeSubView === 'statistic' ? null : 'statistic')}
          hasDropdown={false}
        />
      </div>
    </div>
  );
};

export default Sidebar;
