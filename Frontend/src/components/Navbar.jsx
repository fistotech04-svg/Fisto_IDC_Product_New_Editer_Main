// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo/Flipibook_logo.svg';
import { User, Share2, Save, Download, Loader2, Eye, ChevronDown, Monitor, Tablet, Smartphone, Settings } from 'lucide-react';
import { Icon } from '@iconify/react';
import ProfileModal from './ProfileModal';
import ShareModal from './ShareModal';
import EditorSettingsModal from './EditorSettingsModal';


const Navbar = ({ onExport, onSave, onSaveAs, onPreview, onPublish, onClearFlipbook, onDeleteFlipbook, hasUnsavedChanges, saveSuccessInfo, isAutoSaveEnabled, onToggleAutoSave, isSaving, activeDevice, setActiveDevice, currentBook }) => {
  const [secondsSinceSave, setSecondsSinceSave] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const deviceMenuRef = useRef(null);
  const saveDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(event.target)) {
        setIsDeviceMenuOpen(false);
      }
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target)) {
        setIsSaveDropdownOpen(false);
      }
    };
    if (isDeviceMenuOpen || isSaveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDeviceMenuOpen, isSaveDropdownOpen]);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname.startsWith('/editor') && !location.pathname.includes('threed_editor') && !location.pathname.includes('customized_editor')) {
      localStorage.setItem('lastEditorPath', location.pathname);
    }
    if (location.pathname.includes('customized_editor')) {
      localStorage.setItem('lastCustomizedPath', location.pathname);
    }
  }, [location]);

  // Helper to determine if a link is active
  const isActive = (path) => {
    if (path === '/editor') {
      return location.pathname.startsWith('/editor') && 
             !location.pathname.includes('threed_editor') && 
             !location.pathname.includes('customized_editor');
    }
    if (path === '/editor/threed_editor') return location.pathname.includes('threed_editor');
    if (path === '/editor/customized_editor') return location.pathname.includes('customized_editor');
    return location.pathname === path;
  };



  // Common styles
   const baseLinkStyle = "text-gray-500 hover:text-gray-900 font-medium text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-0 hover:after:w-full after:bg-black after:transition-all after:duration-300 after:rounded-full";
   const activeLinkStyle = "text-[#ec5137] font-semibold text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-full after:bg-[#ec5137] after:transition-all after:duration-300 after:rounded-full";

  // Timer: Run only when unsaved changes exist
  useEffect(() => {
    let interval;
    if (hasUnsavedChanges) {
        interval = setInterval(() => {
            setSecondsSinceSave(prev => prev + 1);
        }, 1000);
    } else {
        setSecondsSinceSave(0);
    }
    return () => clearInterval(interval);
  }, [hasUnsavedChanges]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Check if we are in 3D Editor or Customized Editor
  const isThreedEditor = location.pathname.includes('threed_editor');
  const isCustomizedEditor = location.pathname.includes('customized_editor');

  // Custom Leave Confirmation Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);

  const confirmNavigation = (actionOrPath) => {
    if (hasUnsavedChanges) {
      setPendingLeaveAction(() => () => {
        if (typeof actionOrPath === 'string') {
          navigate(actionOrPath);
        } else if (typeof actionOrPath === 'function') {
          actionOrPath();
        }
      });
      setShowLeaveModal(true);
    } else {
      if (typeof actionOrPath === 'string') {
        navigate(actionOrPath);
      } else if (typeof actionOrPath === 'function') {
        actionOrPath();
      }
    }
  };

  const handleLinkClick = (e, path) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      confirmNavigation(path);
    }
  };

  return (
    <>
      <nav 
        className="bg-white border-b border-gray-200 flex items-center justify-between px-[1.2vw] shadow-sm z-[9999] relative select-none gap-[1vw]" 
        style={{ height: '8vh' }}
      >
        {/* Left Section - Logo and Navigation */}
        <div className="flex items-center gap-[1.5vw] shrink-0">
          <Link to="/" className="flex-shrink-0" onClick={(e) => handleLinkClick(e, '/')}>
            <img 
              className="h-[2.5vw] w-auto object-contain" 
              src={logo} 
              alt="Flipibook" 
            />
          </Link>

          {isThreedEditor && (
            <>
            <button
              onClick={() => confirmNavigation('/my-flipbooks')}
              className="flex items-center gap-[0.45vw] px-[0.85vw] py-[0.4vw] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-[0.78vw] rounded-[0.5vw] border border-gray-200 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              title="Go to My Flipbook"
            >
              <Icon icon="solar:home-2-linear" className="w-[1vw] h-[1vw] text-[#ea543a]" />
              <span>Go to My Flipbook</span>
            </button>
            <button
              onClick={() => confirmNavigation('/3d-editor')}
              className="flex items-center gap-[0.45vw] px-[0.85vw] py-[0.4vw] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-[0.78vw] rounded-[0.5vw] border border-gray-200 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              title="Go to My Flipbook"
            >
              <Icon icon="lucide:arrow-left" className="w-[1vw] h-[1vw] text-[#ea543a]" />
              <span>3D Dashboard</span>
            </button>
            </>
          )}

          {/* Navigation Links - Hidden on 3D editor or small screens to prevent overlap */}
          {!isThreedEditor && (
            <div className="hidden lg:flex items-center gap-[1.8vw]">
              <Link 
                to="/my-flipbooks" 
                onClick={(e) => handleLinkClick(e, '/my-flipbooks')}
                className={isActive('/my-flipbooks') ? activeLinkStyle : baseLinkStyle}
              >
                My Flipbook
              </Link>
              <Link 
                to="/features" 
                onClick={(e) => handleLinkClick(e, '/features')}
                className={`hidden 2xl:block ${isActive('/features') ? activeLinkStyle : baseLinkStyle}`}
              >
                Features
              </Link>
              <Link 
                to="/support" 
                onClick={(e) => handleLinkClick(e, '/support')}
                className={`hidden 2xl:block ${isActive('/support') ? activeLinkStyle : baseLinkStyle}`}
              >
                Support
              </Link>
              <Link 
                to="/help" 
                onClick={(e) => handleLinkClick(e, '/help')}
                className={`hidden 2xl:block ${isActive('/help') ? activeLinkStyle : baseLinkStyle}`}
              >
                Help
              </Link>
            </div>
          )}
        </div>

        {/* Center Section - Saved Status & Device Switcher (Natural flex centering, no absolute collision) */}
        <div className="flex items-center justify-center flex-1 min-w-0 px-[0.5vw] gap-[0.75vw]">
          {isAutoSaveEnabled && !isCustomizedEditor && (
            <div className="flex items-center gap-[0.4vw] whitespace-nowrap bg-gray-50/80 px-[0.8vw] py-[0.35vw] rounded-full border border-gray-200/60 shadow-xs">
                <span className="text-gray-900 font-medium text-[0.8vw]">
                Saved :
                </span>
                <span className="text-[#373d8a] font-bold text-[0.8vw]">
                {formatTime(secondsSinceSave)} ago
                </span>
            </div>
          )}

          {/* Device Switcher (Customized Editor only) */}
          {location.pathname.includes('customized_editor') && (
            <div className="relative group/tooltip flex items-center" ref={deviceMenuRef}>
              <button
                onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                className="flex items-center gap-[0.4vw] p-[0.6vw] px-[0.8vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700"
              >
                {activeDevice === 'Desktop' && <Monitor size="1.2vw" />}
                {activeDevice === 'Tablet' && <Tablet size="1.2vw" />}
                {activeDevice === 'Mobile' && <Smartphone size="1.2vw" />}
                <span className="font-medium text-[0.85vw]">{activeDevice}</span>
                <ChevronDown size="1vw" className={`transition-transform duration-300 ${isDeviceMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {!isDeviceMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                  <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                  <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                    Switch Device Preview
                  </div>
                </div>
              )}

              {isDeviceMenuOpen && (
                <>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[1vw] bg-gray-50 border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[0.8vw] p-[0.5vw] w-[11vw] z-50 flex flex-col gap-[0.5vw]">
                    {/* Top Row: Mobile & Tablet */}
                    <div className="flex gap-[0.5vw] w-full">
                      <button
                        onClick={() => {
                          setActiveDevice('Mobile');
                          setIsDeviceMenuOpen(false);
                        }}
                        className={`flex-1 flex flex-col items-center justify-center py-[0.8vw] rounded-[0.5vw] bg-white transition-all border ${activeDevice === 'Mobile' ? 'border-indigo-500 text-indigo-600 shadow-sm' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'}`}
                      >
                        <Smartphone strokeWidth={1.5} className="w-[1.4vw] h-[1.4vw] mb-[0.3vw]" />
                        <span className="text-[0.75vw] font-medium">Mobile</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveDevice('Tablet');
                          setIsDeviceMenuOpen(false);
                        }}
                        className={`flex-1 flex flex-col items-center justify-center py-[0.8vw] rounded-[0.5vw] bg-white transition-all border ${activeDevice === 'Tablet' ? 'border-indigo-500 text-indigo-600 shadow-sm' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'}`}
                      >
                        <Tablet strokeWidth={1.5} className="w-[1.4vw] h-[1.4vw] mb-[0.3vw]" />
                        <span className="text-[0.75vw] font-medium">Tablet</span>
                      </button>
                    </div>
                    {/* Bottom Row: Desktop */}
                    <button
                      onClick={() => {
                        setActiveDevice('Desktop');
                        setIsDeviceMenuOpen(false);
                      }}
                      className={`w-full flex flex-col items-center justify-center py-[0.8vw] rounded-[0.5vw] bg-white transition-all border ${activeDevice === 'Desktop' ? 'border-indigo-500 text-indigo-600 shadow-sm' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'}`}
                    >
                      <Monitor strokeWidth={1.5} className="w-[1.4vw] h-[1.4vw] mb-[0.3vw]" />
                      <span className="text-[0.75vw] font-medium">Desktop</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-[0.8vw] min-w-[15vw] justify-end relative">
          {isThreedEditor ? (
            <>
              {/* Saved / Unsaved Status Badge */}
              <div className={`flex items-center gap-[0.45vw] font-semibold text-[0.82vw] bg-white px-[0.85vw] py-[0.4vw] rounded-full border shadow-2xs transition-colors ${
                hasUnsavedChanges ? "text-amber-700 border-amber-300/80 bg-amber-50/40" : "text-gray-700 border-gray-300"
              }`}>
                {hasUnsavedChanges ? (
                  <Icon icon="solar:danger-circle-bold" className="w-[1.25vw] h-[1.25vw] text-amber-500 shrink-0" />
                ) : (
                  <Icon icon="reicon:tick-circle-filled" className="w-[1.25vw] h-[1.25vw] text-[#10b981] shrink-0" />
                )}
                <span>{hasUnsavedChanges ? "Unsaved" : "Saved"}</span>
              </div>

              {/* Red/Orange Split Save Changes Button with Dropdown */}
              <div className="relative flex items-center" ref={saveDropdownRef}>
                <div className="flex items-center bg-[#ea543a] hover:bg-[#d9442a] text-white rounded-[0.65vw] shadow-sm transition-all">
                  {/* Left Action: Save Changes */}
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-[0.55vw] px-[1.1vw] py-[0.55vw] font-bold text-[0.85vw] cursor-pointer rounded-l-[0.65vw] transition-colors active:scale-98"
                  >
                    <Icon icon="codicon:save" className="w-[1.15vw] h-[1.15vw]" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>

                  {/* Divider */}
                  <div className="w-[1px] h-[1.3vw] bg-white/30"></div>

                  {/* Right Chevron: Toggle Dropdown */}
                  <button
                    type="button"
                    onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
                    className="px-[0.65vw] py-[0.55vw] cursor-pointer rounded-r-[0.65vw] transition-colors hover:bg-black/10 active:scale-98 flex items-center justify-center"
                    title="Save & Export Options"
                  >
                    <Icon
                      icon="heroicons:chevron-down-20-solid"
                      className={`w-[1.1vw] h-[1.1vw] transition-transform duration-200 ${
                        isSaveDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Save & Export Dropdown Menu */}
                {isSaveDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.6vw)] bg-white rounded-[0.8vw] shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-gray-100/90 py-[0.4vw] w-[15.5vw] min-w-[210px] z-[99999] animate-in fade-in zoom-in-95 duration-150">
                    {/* Item 1: Save as New Model */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSaveDropdownOpen(false);
                        if (onSaveAs) onSaveAs();
                      }}
                      className="w-full flex items-start gap-[0.75vw] px-[1vw] py-[0.65vw] hover:bg-gray-50/90 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-[1.8vw] h-[1.8vw] rounded-[0.35vw] flex items-center justify-center text-gray-800 group-hover:text-[#ea543a] transition-colors shrink-0 mt-[0.1vw]">
                        <Icon icon="codicon:save-all" className="w-[1.35vw] h-[1.35vw]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.82vw] font-bold text-gray-900 group-hover:text-[#ea543a] transition-colors leading-tight">
                          Save as New Model
                        </span>
                        <span className="text-[0.68vw] text-gray-400 font-medium leading-tight mt-[0.15vw]">
                          Keep original unchanged
                        </span>
                      </div>
                    </button>

                    {/* Item 2: Export 3D Model */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSaveDropdownOpen(false);
                        if (onExport) onExport();
                      }}
                      className="w-full flex items-start gap-[0.75vw] px-[1vw] py-[0.65vw] hover:bg-gray-50/90 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-[1.8vw] h-[1.8vw] rounded-[0.35vw] flex items-center justify-center text-gray-800 group-hover:text-[#ea543a] transition-colors shrink-0 mt-[0.1vw]">
                        <Icon icon="bitcoin-icons:export-outline" className="w-[1.45vw] h-[1.45vw]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.82vw] font-bold text-gray-900 group-hover:text-[#ea543a] transition-colors leading-tight">
                          Export 3D Model
                        </span>
                        <span className="text-[0.68vw] text-gray-400 font-medium leading-tight mt-[0.15vw]">
                          Download to your device
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar + Dropdown Indicator */}
              <div
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-[0.35vw] cursor-pointer p-[0.15vw] hover:opacity-90 transition-opacity ml-[0.3vw]"
              >
                <div className="w-[2.2vw] h-[2.2vw] rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                    alt="User"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <User size="1.2vw" className="text-gray-500" />
                </div>
                <Icon icon="heroicons:chevron-down-20-solid" className="w-[1.05vw] h-[1.05vw] text-gray-500" />
              </div>
            </>
          ) : (
            <>
              {/* Action Button (Add 3D Model / Go To Editor) */}
              <div className="relative group/tooltip flex items-center ml-[0.2vw]">
            <button 
              onClick={() => {
                confirmNavigation(isThreedEditor ? (localStorage.getItem('lastEditorPath') || '/editor') : '/editor/threed_editor');
              }}
              className={`flex items-center gap-[0.4vw] px-[1.2vw] cursor-pointer py-[0.6vw] text-white rounded-[0.5vw] transition-all duration-300 active:scale-95
                ${isThreedEditor 
                  ? 'bg-[#4A3AFF] shadow-[0_0_1.2vw_rgba(74,58,255,0.5)] hover:bg-[#3b2eff]' 
                  : 'bg-[#f3b105] shadow-[0_0_1.2vw_rgba(243,177,5,0.5)] hover:bg-[#e5a600]'
                }`}
            >
              <Icon icon={isThreedEditor ? "lucide:layout" : "ph:cube-bold"} className="w-[1.1vw] h-[1.1vw]" />
              <span className="font-medium text-[0.85vw] whitespace-nowrap">
                {isThreedEditor ? "Go To Editor" : "Add 3D Model"}
              </span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                {isThreedEditor ? "Back to Editor" : "Add 3D Model"}
              </div>
            </div>
          </div>

          {/* Save & Toast Container (Hidden in Customized Editor) */}
          {!location.pathname.includes('customized_editor') && (
            <div className="relative group/tooltip flex items-center ml-[0.2vw]">
                <button 
                  onClick={onSave}
                  disabled={isSaving}
                  className={`p-[0.6vw] rounded-[0.5vw] transition-all relative shadow-sm cursor-pointer active:scale-95
                    ${hasUnsavedChanges 
                        ? 'bg-[#FFFBEB] text-yellow-600 hover:bg-yellow-100 ring-[0.06vw] ring-yellow-300' 
                        : 'bg-[#F2FDF8] text-green-600 hover:bg-green-100 ring-[0.06vw] ring-green-300'
                    }`}
                >
                  {isSaving ? <Loader2 size="1.2vw" className="animate-spin" /> : <Save size="1.2vw" />}
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                  <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                  <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                    {hasUnsavedChanges ? "You have unsaved changes - Click to Save" : "Click to Save"}
                  </div>
                </div>
                
                {/* Success Toast Popup */}
                {saveSuccessInfo && (saveSuccessInfo.isManual || !isAutoSaveEnabled) && (
                  <div className="absolute top-full right-0 mt-[0.5vw] w-[12vw] z-[99999] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="bg-[#5CBC49] rounded-[0.5vw] shadow-2xl p-[0.6vw] text-white relative">
                      <div className="absolute -top-[0.2vw] right-[1vw] w-[0.6vw] h-[0.6vw] bg-[#5CBC49] rotate-45 transform"></div>
                      <div className="flex items-center gap-[0.4vw]">
                        <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <Icon icon="lucide:check" className="w-[0.8vw] h-[0.8vw] text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.75vw] font-semibold truncate">{saveSuccessInfo.name || 'Flipbook'}</p>
                          <p className="text-[0.65vw] text-white/90">Saved successfully</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Save As Button (Hidden in Customized Editor) */}
          {!location.pathname.includes('customized_editor') && onSaveAs && (
            <div className="relative group/tooltip flex items-center ml-[0.2vw]">
              <button 
                onClick={onSaveAs}
                disabled={isSaving}
                className="p-[0.6vw] bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 cursor-pointer rounded-[0.5vw] transition-all border border-gray-200/80 active:scale-95 shadow-xs flex items-center justify-center"
                title="Save As"
              >
                <Icon icon="material-symbols:save-as-outline-rounded" className="w-[1.2vw] h-[1.2vw]" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Save As
                </div>
              </div>
            </div>
          )}

          {/* Share */}
          <div className="relative group/tooltip flex items-center ml-[0.2vw]">
            <button 
              onClick={() => setIsShareOpen(true)}
              className={`p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700 ${isThreedEditor ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              disabled={isThreedEditor}
            >
              <Share2 size="1.2vw" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Share
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="relative group/tooltip flex items-center ml-[0.2vw]">
            <button 
              onClick={onExport}
              disabled={isThreedEditor}
              className={`p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700 ${
                isThreedEditor 
                  ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                  : ''
              }`}
            >
              <Download size="1.2vw" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Export
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="relative group/tooltip flex items-center ml-[0.2vw]">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700"
            >
              <User size="1.2vw" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
              <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
              <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                Profile
              </div>
            </div>
          </div>

          {/* Settings Button - In-between Profile and Preview (Hidden in Customized Editor) */}
          {!isCustomizedEditor && (
            <div className="relative group/tooltip flex items-center ml-[0.2vw]">
              <button 
                onClick={() => setIsEditorSettingsOpen(true)}
                className="p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700"
              >
                <Settings size="1.2vw" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Editor Settings
                </div>
              </div>
            </div>
          )}

          {/* Preview Button - Hidden on 3D Editor */}
          {!isThreedEditor && (
            <div className="relative group/tooltip flex items-center ml-[0.2vw]">
              <button 
                onClick={onPreview}
                className="w-[2.5vw] h-[2.5vw] flex items-center justify-center bg-[#4A3AFF] border border-indigo-600 rounded-[0.75vw] text-white shadow-sm hover:bg-indigo-400 transition-colors flex-shrink-0"
              >
                <Icon icon="ic:baseline-preview" className="w-[1.25vw] h-[1.25vw]" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                  Preview Book
                </div>
              </div>
            </div>
          )}

          {/* Publish Split Button */}
          <div className="relative flex items-center ml-[0.5vw]">
            <div className="flex items-center bg-[#00A58E] text-white rounded-[0.5vw] shadow-[0_0_1.2vw_rgba(0,165,142,0.5)]">
              <div className="relative group/publish-tooltip flex items-center">
                <button 
                  onClick={onPublish}
                  className="flex items-center gap-[0.4vw] px-[1.2vw] py-[0.6vw] hover:bg-[#008A76] transition-all duration-300 active:scale-95 cursor-pointer rounded-l-[0.5vw]"
                >
                  <Icon icon="lucide:upload" className="w-[1.1vw] h-[1.1vw]" />
                  <span className="font-medium text-[0.85vw] whitespace-nowrap">{(currentBook?.isPublished || currentBook?.published || currentBook?.is_published || currentBook?.status === 'publish' || currentBook?.meta?.isPublished) ? 'Unpublish' : 'Publish'}</span>
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[0.4vw] hidden group-hover/publish-tooltip:flex flex-col items-center pointer-events-none z-50 whitespace-nowrap">
                  <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90" />
                  <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                    {(currentBook?.isPublished || currentBook?.published || currentBook?.is_published || currentBook?.status === 'publish' || currentBook?.meta?.isPublished) ? 'Unpublish Project' : 'Publish Project'}
                  </div>
                </div>
              </div>
              
              <div className="w-[0.1vw] h-[1.5vw] bg-white/20"></div>

              <div className="relative group/chevron-tooltip flex items-center">
                <button 
                  onClick={() => setIsPublishMenuOpen(!isPublishMenuOpen)}
                  className="px-[0.6vw] py-[0.6vw] hover:bg-[#008A76] transition-all duration-300 active:scale-95 flex items-center justify-center border-l border-white/10 cursor-pointer rounded-r-[0.5vw]"
                >
                  <ChevronDown size="1.1vw" className={`transition-transform duration-300 ${isPublishMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {!isPublishMenuOpen && (
                  <div className="absolute right-0 top-full mt-[0.4vw] hidden group-hover/chevron-tooltip:flex flex-col items-end pointer-events-none z-50 whitespace-nowrap">
                    <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90 mr-[0.4vw]" />
                    <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                      Flipbook Options
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isPublishMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsPublishMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-[0.6vw] bg-white border-[0.12vw] border-[#00A58E] shadow-xl rounded-[0.8vw] w-[11vw] z-50 overflow-hidden py-[0.4vw] animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => {
                      setIsPublishMenuOpen(false);
                      if (onClearFlipbook) onClearFlipbook();
                    }}
                    className="w-full px-[1vw] py-[0.6vw] text-center text-gray-700 hover:bg-gray-50 transition-colors font-medium text-[0.8vw] cursor-pointer"
                  >
                    Clear Flipbook
                  </button>
                  <button 
                    onClick={() => {
                      setIsPublishMenuOpen(false);
                      if (onDeleteFlipbook) onDeleteFlipbook();
                    }}
                    className="w-full px-[1vw] py-[0.6vw] text-center text-red-500 hover:bg-red-50 transition-colors font-bold text-[0.8vw] cursor-pointer"
                  >
                    Delete Flipbook
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  </nav>

      {/* Render Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={onToggleAutoSave}
      />
      {/* Render Editor Settings Modal */}
      <EditorSettingsModal 
        isOpen={isEditorSettingsOpen}
        onClose={() => setIsEditorSettingsOpen(false)}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={onToggleAutoSave}
      />
      {/* Render Share Modal */}
      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        flipbookUrl={currentBook?.shareUrl}
        flipbookThumbnail={currentBook?.thumbnail}
        currentBook={currentBook}
        isMobileLayout={activeDevice === 'Mobile'}
      />

      {/* ── Custom Unsaved Changes Confirmation Modal ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100000] bg-black/55 backdrop-blur-xs flex items-center justify-center p-[1.5vw] animate-in fade-in duration-150">
          <div className="bg-white rounded-[1vw] shadow-2xl border border-gray-100 max-w-[420px] w-[26vw] p-[1.4vw] flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
            {/* Warning Icon Badge */}
            <div className="w-[3.2vw] h-[3.2vw] rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center mb-[0.8vw] shadow-xs">
              <Icon icon="solar:danger-triangle-bold" className="w-[1.8vw] h-[1.8vw] text-amber-500" />
            </div>

            {/* Title & Description */}
            <h3 className="text-[1.05vw] font-bold text-gray-900 mb-[0.3vw]">
              Unsaved Changes
            </h3>
            <p className="text-[0.74vw] text-gray-700 leading-relaxed mb-[1.2vw]">
              You have unsaved changes in the editor. If you leave now, your recent modifications may be lost.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-[0.6vw] w-full">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingLeaveAction(null);
                }}
                className="flex-1 py-[0.55vw] px-[0.8vw] rounded-[0.5vw] bg-gray-100 hover:bg-gray-200 text-gray-700 text-[0.76vw] font-semibold transition-colors cursor-pointer"
              >
                Stay on Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  if (pendingLeaveAction) {
                    pendingLeaveAction();
                    setPendingLeaveAction(null);
                  }
                }}
                className="flex-1 py-[0.55vw] px-[0.8vw] rounded-[0.5vw] bg-[#ea543a] hover:bg-[#d43d24] text-white text-[0.76vw] font-bold shadow-xs shadow-[#ea543a]/25 transition-all active:scale-95 cursor-pointer"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;