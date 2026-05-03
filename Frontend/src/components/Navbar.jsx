// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo/Fisto_logo.png';
import { User, Share2, Save, Download, Loader2, Eye, ChevronDown, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Icon } from '@iconify/react';
import ProfileModal from './ProfileModal';


const Navbar = ({ onExport, onSave, onPreview, hasUnsavedChanges, saveSuccessInfo, isAutoSaveEnabled, onToggleAutoSave, isSaving, activeDevice, setActiveDevice, currentBook }) => {
  const [secondsSinceSave, setSecondsSinceSave] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const location = useLocation();
  // Determine active editor path with persistence
  const [lastEditorPath, setLastEditorPath] = useState(() => {
    return localStorage.getItem('lastEditorPath') || '/editor';
  });
  const [lastCustomizedPath, setLastCustomizedPath] = useState(() => {
    return localStorage.getItem('lastCustomizedPath') || '/editor/customized_editor';
  });

  useEffect(() => {
    if (location.pathname.startsWith('/editor') && !location.pathname.includes('threed_editor') && !location.pathname.includes('customized_editor')) {
      setLastEditorPath(location.pathname);
      localStorage.setItem('lastEditorPath', location.pathname);
    }
    if (location.pathname.includes('customized_editor')) {
      setLastCustomizedPath(location.pathname);
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

  // Construct dynamic paths based on current book context
  const getCustomizePath = () => {
    // If already in customize, keep current path (includes page)
    if (location.pathname.includes('customized_editor')) return location.pathname;
    
    const folder = currentBook?.folder || currentBook?.folderName;
    const v_id = currentBook?.v_id;
    
    if (folder && v_id) {
      return `/editor/customized_editor/${encodeURIComponent(Array.isArray(folder) ? folder[0] : folder)}/${v_id}`;
    }
    return lastCustomizedPath;
  };

  const getEditorPath = () => {
    // If already in editor, keep current path
    if (location.pathname.startsWith('/editor') && !location.pathname.includes('customized_editor') && !location.pathname.includes('threed_editor')) {
      return location.pathname;
    }

    const folder = currentBook?.folder || currentBook?.folderName;
    const v_id = currentBook?.v_id;
    
    if (folder && v_id) {
      return `/editor/${encodeURIComponent(Array.isArray(folder) ? folder[0] : folder)}/${v_id}`;
    }
    return lastEditorPath;
  };

  // Common styles
   const baseLinkStyle = "text-gray-500 hover:text-gray-900 font-medium text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-0 hover:after:w-full after:bg-black after:transition-all after:duration-300 after:rounded-full";
   const activeLinkStyle = "text-[#373d8a] font-semibold text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-full after:bg-[#373d8a] after:transition-all after:duration-300 after:rounded-full";

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

  // Check if we are in 3D Editor
  const isThreedEditor = location.pathname.includes('threed_editor');

  return (
    <>
      <nav 
        className="bg-white border-b border-gray-200 flex items-center justify-between px-[1.5vw] shadow-lg z-50 relative" 
        style={{ height: '8vh' }}
      >
        {/* Left Section - Logo and Saved Status */}
        <div className="flex items-center gap-[2vw] min-w-[15vw]">
          <Link to="/" className="flex-shrink-0">
            <img 
              className="h-[2.5vw] w-auto object-contain" 
              src={logo} 
              alt="FIST-O" 
            />
          </Link>

          {isAutoSaveEnabled && (
            <div className="flex items-center gap-[0.4vw] whitespace-nowrap">
                <span className="text-gray-900 font-medium text-[0.85vw]">
                Saved :
                </span>
                <span className="text-blue-600 font-medium text-[0.85vw]">
                {formatTime(secondsSinceSave)} ago
                </span>
            </div>
          )}
        </div>

        {/* Center Section - Navigation Links */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-[2.5vw]">
          <Link
            to="/my-flipbooks"
            className={isActive('/my-flipbooks') ? activeLinkStyle : baseLinkStyle}
          >
            My Flipbook
          </Link>
          <Link
            to={getCustomizePath()}
            className={isActive('/editor/customized_editor') ? activeLinkStyle : baseLinkStyle}
          >
            Customize
          </Link>
          <Link
            to={getEditorPath()}
            className={isActive('/editor') ? activeLinkStyle : baseLinkStyle}
          >
            Editor
          </Link>
          <Link
            to="/editor/threed_editor"
            className={isActive('/editor/threed_editor') ? activeLinkStyle : baseLinkStyle}
          >
            3D Editor
          </Link>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-[0.8vw] min-w-[15vw] justify-end relative">
          {/* Device Switcher (Customized Editor only) */}
          {location.pathname.includes('customized_editor') && activeDevice && setActiveDevice && (
            <div className="relative">
              <button
                onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                className="flex items-center gap-[0.4vw] p-[0.6vw] px-[0.8vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700"
                title="Switch Device Preview"
              >
                {activeDevice === 'Desktop' && <Monitor size="1.2vw" />}
                {activeDevice === 'Tablet' && <Tablet size="1.2vw" />}
                {activeDevice === 'Mobile' && <Smartphone size="1.2vw" />}
                <span className="font-medium text-[0.85vw]">{activeDevice}</span>
                <ChevronDown size="1vw" />
              </button>
              
              {isDeviceMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDeviceMenuOpen(false)} />
                  <div className="absolute right-[-1.5vw] top-full mt-[1vw] bg-gray-50 border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[0.8vw] p-[0.5vw] w-[11vw] z-50 flex flex-col gap-[0.5vw]">
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

          {/* Profile */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700"
            title="Profile"
          >
            <User size="1.2vw" />
          </button>

          {/* Share */}
          <button 
            className={`p-[0.6vw] bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-[0.5vw] transition-colors text-gray-700 ${isThreedEditor ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            title="Share"
            disabled={isThreedEditor}
          >
            <Share2 size="1.2vw" />
          </button>
          
          {/* Save & Toast Container */}
          <div className="relative">
              <button 
                onClick={onSave}
                disabled={!hasUnsavedChanges}
                className={`p-[0.6vw] rounded-[0.5vw] transition-all relative shadow-sm
                  ${hasUnsavedChanges 
                      ? 'bg-[#FFFBEB] text-yellow-600 cursor-pointer hover:bg-yellow-100 ring-[0.06vw] ring-yellow-300' 
                      : 'bg-[#F2FDF8] text-green-600 cursor-default opacity-80 ring-[0.06vw] ring-green-300'
                  }`}
                title={hasUnsavedChanges ? "You have unsaved changes - Click to Save" : "All changes saved"}
              >
                {isSaving ? <Loader2 size="1.2vw" className="animate-spin" /> : <Save size="1.2vw" />}
              </button>
              
              {/* Success Toast Popup */}
              {saveSuccessInfo && (saveSuccessInfo.isManual || !isAutoSaveEnabled) && (
                <div className="absolute top-full right-0 mt-[0.5vw] w-[12vw] z-[60] animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-[#5CBC49] rounded-[0.5vw] shadow-lg p-[0.6vw] text-white relative">
                    {/* Arrow pointing up */}
                    <div className="absolute -top-[0.2vw] right-[1vw] w-[0.6vw] h-[0.6vw] bg-[#5CBC49] rotate-45 transform"></div>
                    
                    <div className="flex flex-col gap-[0.2vw] relative z-10">
                      <div className="flex items-center gap-[0.4vw]">
                        <div className="bg-white rounded-full p-[0.1vw] flex items-center justify-center">
                          <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#5CBC49" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="font-bold text-[0.8vw] leading-tight text-white">Saved Successfully</span>
                      </div>
                      
                      <div className="h-[0.1vw] bg-white/20 w-full my-[0.1vw]"></div>
                      
                      <div className="text-[0.6vw] font-medium text-white/90 truncate">
                        {saveSuccessInfo.name} - {saveSuccessInfo.folder}
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Preview Button - Hidden on main Editor page */}
          {!(location.pathname.startsWith('/editor') && !location.pathname.includes('threed_editor') && !location.pathname.includes('customized_editor')) && (
            <button 
              onClick={onPreview}
              className="w-[2.5vw] h-[2.5vw] flex items-center justify-center bg-[#4A3AFF] border border-indigo-600 rounded-[0.75vw] text-white shadow-sm hover:bg-indigo-400 transition-colors flex-shrink-0"
              title="Preview Book"
            >
              <Icon icon="ic:baseline-preview" className="w-[1.25vw] h-[1.25vw]" />
            </button>
          )}

          {/* Export */}
          <button 
            onClick={onExport}
            disabled={isThreedEditor}
            className={`bg-black text-white rounded-[0.5vw] flex items-center justify-center transition-colors px-[1.2vw] py-[0.6vw] ml-[0.2vw] ${
              isThreedEditor 
                ? 'opacity-50 cursor-not-allowed pointer-events-none' 
                : 'hover:bg-gray-800'
            }`}
            style={{ gap: '0.4vw' }}
          >
            <Download size="1.1vw" />
            <span className="font-medium text-[0.85vw]">Export</span>
          </button>
        </div>
      </nav>

      {/* Render Profile Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={onToggleAutoSave}
      />
    </>
  );
};

export default Navbar;