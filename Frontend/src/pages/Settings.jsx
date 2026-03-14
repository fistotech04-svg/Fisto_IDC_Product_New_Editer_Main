import React, { useState } from 'react';
import { User, Shield, Crown, Settings as SettingsIcon, Book, Lock, Headphones, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Profile from '../components/Profile';
import DashboardBg from '../assets/images/myflipbook.png';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('edit-profile');

  // Sidebar Menu Items
  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'subscription', label: 'Plan & Subscription', icon: Crown },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'defaults', label: 'Flipbook Defaults', icon: Book },
    { id: 'privacy', label: 'Privacy & Access', icon: Lock },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile activeSubTab={activeSubTab} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-[1vw]">
             <p>Content for {activeTab} coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen pt-[8vh] bg-[#EBEFF8] font-sans overflow-hidden">
        
      <div className="flex w-full h-full p-[2vw] gap-[2vw]">
        {/* Sidebar - Floating Card */}
        <aside className="w-[18vw] flex-shrink-0 bg-white rounded-[1.5vw] shadow-sm flex flex-col p-[1.5vw] overflow-y-auto custom-scrollbar">
            
            {/* Profile Summary */}
            <div className="flex flex-col items-center mb-[2vw]">
                <div className="relative mb-[0.8vw]">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80" 
                        alt="Profile" 
                        className="w-[5vw] h-[5vw] rounded-[1vw] object-cover shadow-md"
                    />
                </div>
                <h2 className="text-[1.1vw] font-bold text-gray-900">Praveen</h2>
                <p className="text-[0.7vw] text-gray-500">praveen1234@gmail.com</p>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 flex flex-col gap-[0.4vw]">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-[0.8vw] px-[1vw] py-[0.8vw] rounded-[0.8vw] text-[0.8vw] font-medium transition-all duration-200 text-left
                                ${isActive 
                                    ? 'bg-[#3b4190] text-white shadow-lg shadow-indigo-500/20' 
                                    : 'text-[#3b4190] hover:bg-gray-50'
                                }
                            `}
                        >
                            <Icon size="1vw" strokeWidth={isActive ? 2 : 1.5} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Logout Button */}
            <button className="mt-[1vw] flex items-center justify-center gap-[0.5vw] px-[1vw] py-[0.8vw] border border-red-100 text-[#FF4444] rounded-[0.8vw] text-[0.8vw] font-bold hover:bg-red-50 transition-colors">
                <LogOut size="1vw" />
                Log out
            </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
             
             {/* Header Area - Outside Card */}
             {activeTab === 'profile' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-[1vw] flex-shrink-0 mb-[1.5vw] font-poppins">
                     <div className="flex items-center gap-[1.5vw]">
                         <h1 className="text-[2vw] font-bold text-[#343868]">Profile :</h1>
                         
                         <div className="flex items-center gap-[0.8vw]">
                             <button 
                                onClick={() => setActiveSubTab('edit-profile')}
                                className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-[0.5vw] text-[0.8vw] font-medium transition-colors ${activeSubTab === 'edit-profile' ? 'bg-[#3b4190] text-white shadow-md' : 'bg-[#DCE4F9] text-[#3b4190] hover:bg-[#d0dbf5]'}`}
                             >
                                 <User size="0.8vw" />
                                 Edit Profile
                             </button>
                             <button 
                                onClick={() => setActiveSubTab('professional-details')}
                                className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-[0.5vw] text-[0.8vw] font-medium transition-colors ${activeSubTab === 'professional-details' ? 'bg-[#3b4190] text-white shadow-md' : 'bg-[#DCE4F9] text-[#3b4190] hover:bg-[#d0dbf5]'}`}
                             >
                                 <SettingsIcon size="0.8vw" />
                                 Professional Details
                             </button>
                             <button 
                                onClick={() => setActiveSubTab('account-info')}
                                className={`flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] rounded-[0.5vw] text-[0.8vw] font-medium transition-colors ${activeSubTab === 'account-info' ? 'bg-[#3b4190] text-white shadow-md' : 'bg-[#DCE4F9] text-[#3b4190] hover:bg-[#d0dbf5]'}`}
                             >
                                 <Shield size="0.8vw" />
                                 Account Info
                             </button>
                         </div>
                     </div>
                </div>
             )}

            {/* Blue Container Card for Settings Content */}
             <div className="flex-1 rounded-[2vw] bg-[#343b854d] p-[2vw] shadow-2xl relative flex flex-col backdrop-blur-sm border border-white/20 overflow-hidden">
                 {renderContent()}
             </div>
        </main>
      </div>

    </div>
  );
};

export default Settings;
