import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FistoLogo from '../assets/logo/Fisto_logo.png';
import { Bell, User } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function DashboardNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'My Flipbooks', path: '/my-flipbooks' },
    { name: 'Help', path: '#' },
    { name: 'Contact Us', path: '#' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <>
    <nav className="w-full bg-white px-[1.5vw] flex items-center justify-between z-50 fixed top-0 left-0 border-b border-gray-200 shadow-sm" style={{ height: '8vh' }}>
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link to="/home">
           <img src={FistoLogo} alt="FIST-O" className="h-[2.5vw] w-auto object-contain transition-transform duration-300" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="hidden lg:flex items-center gap-[2.5vw]">
        {navLinks.map((link) => {
          const isActive = currentPath === link.path || (link.name === 'Home' && currentPath === '/');
          
          const baseLinkStyle = "text-gray-500 hover:text-gray-900 font-medium text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-0 hover:after:w-full after:bg-black after:transition-all after:duration-300 after:rounded-full";
          const activeLinkStyle = "text-[#373d8a] font-semibold text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-full after:bg-[#373d8a] after:transition-all after:duration-300 after:rounded-full";

          return (
            <Link 
                key={link.name} 
                to={link.path} 
                className={isActive ? activeLinkStyle : baseLinkStyle}
            >
                {link.name}
            </Link>
          );
        })}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-[1vw]">
         {/* Notification */}
         <button className="w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.75vw] bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group">
            <Bell size="1.2vw" className="text-gray-600 group-hover:text-gray-900 transition-colors" />
         </button>

         {/* Profile */}
         <button 
           onClick={() => setIsProfileModalOpen(true)}
           className="w-[2.5vw] h-[2.5vw] flex items-center justify-center rounded-[0.75vw] bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 group"
         >
             <User size="1.2vw" className="text-gray-800 group-hover:text-black transition-colors" strokeWidth={2.5} />
         </button>
      </div>
    </nav>
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
}
