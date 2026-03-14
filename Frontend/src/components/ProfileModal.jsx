import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Crown, LogOut } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, isAutoSaveEnabled, onToggleAutoSave }) {
  const [user, setUser] = useState({ name: 'Guest', email: 'guest@example.com' });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('last_active_folder');
    navigate('/');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name || parsedUser.emailId?.split('@')[0] || 'User',
            email: parsedUser.emailId || 'No Email'
          });
        } catch (e) {
            console.error("Failed to parse user data", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible Backdrop to handle click-outside */}
      <div className="fixed inset-0 z-[55] cursor-default" onClick={onClose}></div>

      {/* Popup Card */}
      <div className="fixed top-[4.5vw] right-[2vw] z-[60] w-[20vw] bg-white rounded-[1vw] shadow-2xl border border-gray-100 overflow-hidden p-[1.5vw] animate-in hover:animate-none fade-in slide-in-from-top-2 duration-200">
      
        {/* Header */}
        <div className="flex items-center justify-between mb-[1.25vw]">
            <h2 className="text-[1.1vw] font-bold text-gray-900 flex items-center gap-[0.75vw] w-full">
                Profile
                <span className="flex-1 h-[0.1vw] bg-gray-100 rounded-full mt-[0.15vw]"></span>
            </h2>
            <button 
                onClick={onClose}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors ml-[0.75vw]"
            >
                <X size="1.1vw" />
            </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-[1vw] mb-[1.5vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.75vw] overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1760&auto=format&fit=crop" 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex flex-col min-w-0">
                <h3 className="text-[0.9vw] font-bold text-gray-900 truncate">{user.name}</h3>
                <p className="text-[0.75vw] text-gray-500 truncate">{user.email}</p>
            </div>
        </div>

        <div className="h-[0.1vw] w-full bg-gray-50 mb-[1.25vw]"></div>

        {/* Plan Info */}
        <div className="flex items-center justify-between gap-[0.5vw] mb-[1.5vw] px-[0.25vw]">
            <div className="flex items-center gap-[0.5vw]">
                <Crown size="1.25vw" className="text-yellow-400 fill-yellow-400" />
                <span className="text-[0.75vw] font-semibold text-gray-700">Your Current Plan</span>
            </div>
            <div className="px-[0.75vw] py-[0.25vw] rounded-[0.25vw] bg-gradient-to-r from-green-500 to-green-600 text-white text-[0.65vw] font-semibold uppercase tracking-wider shadow-sm">
                Free
            </div>
        </div>

        {/* Auto Save Toggle */}
        <div className="flex items-center justify-between mb-[1.5vw] px-[0.25vw]">
            <span className="text-[0.85vw] font-semibold text-gray-700">Auto Save</span>
            <button 
                onClick={() => onToggleAutoSave(!isAutoSaveEnabled)}
                className={`w-[2.75vw] h-[1.5vw] flex items-center rounded-full p-[0.25vw] transition-colors duration-200 ease-in-out ${isAutoSaveEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                title={isAutoSaveEnabled ? "Disable Auto Save" : "Enable Auto Save"}
            >
                <div className={`bg-white w-[1vw] h-[1vw] rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isAutoSaveEnabled ? 'translate-x-[1.25vw]' : 'translate-x-0'}`}></div>
            </button>
        </div>

        {/* Subscribe Button */}
        <button className="w-full bg-black text-white text-[0.85vw] font-semibold py-[0.85vw] rounded-[0.75vw] hover:bg-zinc-800 transition-colors shadow-lg mb-[0.75vw]">
            399/- Subscribe Now
        </button>

        {/* Logout Button */}
        <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-[0.5vw] text-red-500 hover:text-white border border-red-100 hover:bg-red-500 hover:border-red-500 transition-all duration-200 rounded-[0.75vw] py-[0.6vw] text-[0.85vw] font-semibold group"
        >
            <LogOut size="1vw" className="group-hover:text-white transition-colors" />
            Logout
        </button>

      </div>
    </>
  );
}
