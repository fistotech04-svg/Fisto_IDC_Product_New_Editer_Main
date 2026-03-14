// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo/Fisto_logo.png';
import { User, Share2, Save, Download } from 'lucide-react';
import ProfileModal from './ProfileModal';


const Navbar = ({ onExport, onSave, hasUnsavedChanges, saveSuccessInfo, isAutoSaveEnabled, onToggleAutoSave }) => {
  const [secondsSinceSave, setSecondsSinceSave] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
            to={lastCustomizedPath}
            className={isActive('/editor/customized_editor') ? activeLinkStyle : baseLinkStyle}
          >
            Customize
          </Link>
          <Link
            to={lastEditorPath}
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
          {/* Profile */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-[0.6vw] bg-gray-100 hover:bg-gray-200 rounded-[0.5vw] transition-colors text-gray-700"
            title="Profile"
          >
            <User size="1.2vw" />
          </button>

          {/* Share */}
          <button 
            className={`p-[0.6vw] bg-gray-100 hover:bg-gray-200 rounded-[0.5vw] transition-colors text-gray-700 ${isThreedEditor ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
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
                <Save size="1.2vw" />
              </button>
              
              {/* Success Toast Popup */}
              {saveSuccessInfo && (
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