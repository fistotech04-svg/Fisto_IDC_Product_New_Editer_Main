import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const Account = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[1.2vw] p-[1.8vw] shadow-xs flex flex-col font-sans max-w-[50vw]">
      <div className="flex items-center gap-[0.8vw] pb-[1.2vw] border-b border-gray-100">
        <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] bg-indigo-50 text-[#4c5add] flex items-center justify-center">
          <Icon icon="iconamoon:profile" className="w-[1.4vw] h-[1.4vw]" />
        </div>
        <div>
          <h1 className="text-[1.3vw] font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-[0.75vw] text-gray-500">Manage your account preferences, credentials, and lead submissions.</p>
        </div>
      </div>

      <div className="mt-[1.5vw] space-y-[1vw]">
        {/* Quick shortcut to Lead form Data */}
        <div 
          onClick={() => navigate('/settings/lead-form-data')}
          className="p-[1.2vw] border border-gray-200 hover:border-[#4c5add] rounded-[0.8vw] bg-gray-50/50 hover:bg-white transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-[1vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-[0.5vw] bg-indigo-100 text-[#4c5add] flex items-center justify-center">
              <Icon icon="solar:clipboard-list-bold-duotone" className="w-[1.3vw] h-[1.3vw]" />
            </div>
            <div>
              <h3 className="text-[0.9vw] font-bold text-gray-900 group-hover:text-[#4c5add] transition-colors">
                Lead form Data
              </h3>
              <p className="text-[0.72vw] text-gray-500">
                View, filter, and export visitor leads captured across all your flipbooks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-[0.4vw] text-[#4c5add] font-semibold text-[0.8vw]">
            <span>Open</span>
            <Icon icon="lucide:arrow-right" className="w-[0.9vw] h-[0.9vw] transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div className="p-[1.2vw] border border-gray-100 rounded-[0.8vw] bg-white">
          <h4 className="text-[0.85vw] font-semibold text-gray-800 mb-[0.4vw]">Account Security & Details</h4>
          <p className="text-[0.75vw] text-gray-500 leading-relaxed">
            Personal profile information, passwords, and security options can also be managed via the Profile and Privacy tabs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Account;
