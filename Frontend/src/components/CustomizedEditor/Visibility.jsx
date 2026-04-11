import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';

const Visibility = ({ onBack, settings, onUpdate }) => {
  const [activeAccordion, setActiveAccordion] = useState('email'); // 'email' or 'domain'
  const [emailInput, setEmailInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');

  const updateInvite = (field, value) => {
    onUpdate({
      ...settings,
      inviteOnly: {
        ...settings.inviteOnly,
        [field]: value
      }
    });
  };

  const addEmail = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    const newEmails = [...settings.inviteOnly.emails, { email: emailInput.trim(), status: 'valid' }];
    updateInvite('emails', newEmails);
    setEmailInput('');
  };

  const removeEmail = (index) => {
    const newEmails = settings.inviteOnly.emails.filter((_, i) => i !== index);
    updateInvite('emails', newEmails);
  };

  const addDomain = () => {
    if (!domainInput.trim() || !domainInput.includes('.')) return;
    const newDomains = [...settings.inviteOnly.domains, { domain: domainInput.trim(), status: 'valid' }];
    updateInvite('domains', newDomains);
    setDomainInput('');
  };

  const removeDomain = (index) => {
    const newDomains = settings.inviteOnly.domains.filter((_, i) => i !== index);
    updateInvite('domains', newDomains);
  };

  const updateAutoExpire = (field, value) => {
    onUpdate({
      ...settings,
      inviteOnly: {
        ...settings.inviteOnly,
        autoExpire: {
          ...settings.inviteOnly.autoExpire,
          [field]: value
        }
      }
    });
  };

  const renderContent = () => {
    switch (settings.type) {
      case 'Public':
        return (
          <div className="p-[1.5vw] bg-white rounded-[0.75vw] border border-gray-100 shadow-sm space-y-[1vw]">
            <div className="flex items-center gap-[0.75vw] ">
              <Icon icon="lucide:globe" className="w-[1vw] h-[1vw]" />
              <span className="text-[1vw] font-semibold text-gray-900">Public Access</span>
            </div>
            <p className="text-gray-500 text-[0.8vw] leading-relaxed">
              Anyone with the link can view this flipbook. Search engines might index this flipbook.
            </p>
          </div>
        );
      case 'Private':
        return (
          <div className="p-[1.5vw] bg-white rounded-[0.75vw] border border-gray-100 shadow-sm space-y-[1vw]">
            <div className="flex items-center gap-[0.75vw] ">
              <Icon icon="lucide:lock" className="w-[1vw] h-[1vw]" />
              <span className="text-[1vw] font-semibold text-gray-900">Private Access</span>
            </div>
            <p className="text-gray-500 text-[0.8vw] leading-relaxed">
              Only you can see this flipbook. It will not be accessible to anyone else, even with the link.
            </p>
          </div>
        );
      case 'Password Protect':
        return (
          <div className="p-[1.5vw] bg-white rounded-[0.75vw] border border-gray-100 shadow-sm space-y-[1.25vw]">
            <div className="flex items-center gap-[0.75vw] ">
              <Icon icon="lucide:key-round" className="w-[1vw] h-[1vw]" />
              <span className="text-[1vw] font-semibold text-gray-900">Password Protected</span>
            </div>
            <div className="space-y-[0.75vw]">
              <label className="text-[0.85vw] font-semibold text-gray-700 block">Set Access Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={settings.password || ''}
                  onChange={(e) => onUpdate({ ...settings, password: e.target.value })}
                  placeholder="Enter secure password"
                  className="w-full bg-[#f8f9fc] border border-gray-200 rounded-[0.5vw] px-[1vw] py-[0.75vw] text-[0.8vw] focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <Icon icon="lucide:eye-off" className="absolute right-[1vw] top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer w-[1vw] h-[1vw]" />
              </div>
              <p className="text-gray-400 text-[0.7vw]">Users will be prompted to enter this password to view the flipbook.</p>
            </div>
          </div>
        );
      case 'Invite only Access':
      default:
        return (
          <>
            {/* Access Settings Block */}
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-[1vw]">
                <h3 className="text-[1.1vw] font-bold text-gray-800 whitespace-nowrap">Access Settings Block</h3>
                <div className="h-[1px] bg-gray-200 w-full mt-[0.2vw]"></div>
              </div>
              
              <div className="space-y-[0.8vw] bg-white p-[1vw] rounded-[0.75vw] border border-gray-100 shadow-sm">
                <ToggleItem 
                  label="Allow re-access anytime" 
                  checked={settings.inviteOnly.allowReAccess} 
                  onChange={(val) => updateInvite('allowReAccess', val)} 
                />
                <ToggleItem 
                  label="Notify me when users view flipbook" 
                  checked={settings.inviteOnly.notifyOnView} 
                  onChange={(val) => updateInvite('notifyOnView', val)} 
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[1vw]">
                      <span className="text-[0.85vw] font-semibold text-gray-700 whitespace-nowrap">Auto-expire in</span>
                      <PremiumDropdown 
                        options={['5 Days', '10 Days', '30 Days']}
                        value={settings.inviteOnly.autoExpire.duration}
                        onChange={(val) => updateAutoExpire('duration', val)}
                        width="7vw"
                        align="right"
                      />
                  </div>
                  <button
                    onClick={() => updateAutoExpire('enabled', !settings.inviteOnly.autoExpire.enabled)}
                    className={`group relative inline-flex items-center h-[1.1vw] w-[2.2vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.2px] outline-none ${
                      settings.inviteOnly.autoExpire.enabled ? 'bg-white border-[#5551FF]' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div
                      className={`pointer-events-none h-[0.7vw] w-[0.7vw] rounded-full shadow-sm transition-all duration-300 ease-in-out absolute ${
                        settings.inviteOnly.autoExpire.enabled ? 'left-[1.2vw] bg-[#5551FF]' : 'left-[0.15vw] bg-gray-300'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Invite by Specific Email */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
                <button 
                    onClick={() => setActiveAccordion(activeAccordion === 'email' ? null : 'email')}
                    className="w-full flex items-center justify-between p-[1vw] font-semibold text-gray-800"
                >
                    <span>Invite by Specific Email</span>
                    <Icon icon={activeAccordion === 'email' ? "lucide:chevron-up" : "lucide:chevron-down"} className="w-[1.2vw] h-[1.2vw] text-gray-400" />
                </button>

                {activeAccordion === 'email' && (
                    <div className="p-[1vw] pt-0 space-y-[1.25vw] animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-[0.75vw]">
                            <div className="flex items-center gap-[1vw]">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 whitespace-nowrap">Add Emails</h4>
                                <div className="h-[1px] bg-gray-200 w-full mt-[0.2vw]"></div>
                            </div>
                            <div className="flex gap-[0.75vw]">
                                <input 
                                    type="email" 
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="naveen1234@gmail.com"
                                    className="flex-1 bg-white border border-gray-300 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.8vw] focus:outline-none focus:border-indigo-500 shadow-sm"
                                />
                                <button 
                                    onClick={addEmail}
                                    className="bg-indigo-600 text-white px-[1vw] py-[0.5vw] rounded-[0.5vw] font-semibold text-[0.75vw] hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    Add Email
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <span className="text-gray-400 font-semibold text-[0.7vw] italic">or</span>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-[0.75vw] p-[1.5vw] flex flex-col items-center justify-center gap-[0.5vw] bg-[#fcfcfc] cursor-pointer hover:bg-gray-50 transition-colors">
                            <Icon icon="lucide:upload" className="w-[1.5vw] h-[1.5vw] text-gray-400" />
                            <p className="text-[0.7vw] text-gray-400 font-medium">
                                Drag & Drop or <span className="text-indigo-600 font-semibold underline">Upload</span> CSV file
                            </p>
                        </div>

                        <div className="space-y-[1vw] pt-[0.5vw]">
                            <div className="flex items-center gap-[1vw]">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 whitespace-nowrap">Added Email List</h4>
                                <div className="h-[1px] bg-gray-200 w-full mt-[0.2vw]"></div>
                            </div>
                            
                            <div className="flex items-center gap-[0.75vw]">
                                 <div className="flex-1 relative">
                                    <Icon icon="lucide:search" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.8vw] h-[0.8vw]" />
                                    <input 
                                        type="text" 
                                        value={emailSearch}
                                        onChange={(e) => setEmailSearch(e.target.value)}
                                        placeholder="Search"
                                        className="w-full bg-white border border-gray-200 rounded-[0.4vw] pl-[2vw] pr-[0.75vw] py-[0.35vw] text-[0.75vw] focus:outline-none focus:border-indigo-500 shadow-sm"
                                    />
                                 </div>
                                 <button className="flex items-center gap-[0.4vw] bg-black text-white px-[0.75vw] py-[0.35vw] rounded-[0.4vw] text-[0.7vw] font-semibold">
                                    <Icon icon="lucide:filter" className="w-[0.8vw] h-[0.8vw]" />
                                    Sort
                                 </button>
                            </div>

                            <div className="border border-gray-100 rounded-[0.5vw] bg-[#f8f9fc] overflow-hidden">
                                <table className="w-full text-left text-[0.7vw]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-white">
                                            <th className="p-[0.75vw] font-semibold text-gray-700">Emails</th>
                                            <th className="p-[0.75vw] font-semibold text-gray-700 text-center">Status</th>
                                            <th className="p-[0.75vw] font-semibold text-gray-700 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settings.inviteOnly.emails
                                            .filter(item => item.email.toLowerCase().includes(emailSearch.toLowerCase()))
                                            .map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                                <td className="p-[0.75vw] text-gray-500 truncate max-w-[10vw]">{item.email}</td>
                                                <td className="p-[0.75vw] text-center">
                                                    <span className={`${item.status === 'valid' ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-[0.75vw] text-right">
                                                    <button 
                                                        onClick={() => removeEmail(idx)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-[0.8vw] h-[0.8vw]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Allow Access by Domain */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden">
                <button 
                    onClick={() => setActiveAccordion(activeAccordion === 'domain' ? null : 'domain')}
                    className="w-full flex items-center justify-between p-[1vw] font-semibold text-gray-800"
                >
                    <span>Allow Access by Domain</span>
                    <Icon icon={activeAccordion === 'domain' ? "lucide:chevron-up" : "lucide:chevron-down"} className="w-[1.2vw] h-[1.2vw] text-gray-400" />
                </button>

                {activeAccordion === 'domain' && (
                    <div className="p-[1vw] pt-0 space-y-[1.25vw] animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-[0.75vw]">
                            <div className="flex items-center gap-[1vw]">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 whitespace-nowrap">Add Domine</h4>
                                <div className="h-[1px] bg-gray-200 w-full mt-[0.2vw]"></div>
                            </div>
                            <div className="space-y-[0.75vw]">
                                <label className="text-[0.85vw] font-semibold text-gray-700 block">Enter Domine Name</label>
                                <input 
                                    type="text" 
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    placeholder="fist-o.com"
                                    className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] text-[0.8vw] focus:outline-none focus:border-indigo-500 shadow-sm"
                                />
                                <div className="flex justify-end">
                                    <button 
                                        onClick={addDomain}
                                        className="bg-indigo-600 text-white px-[1.5vw] py-[0.5vw] rounded-[0.5vw] font-semibold text-[0.75vw] hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Add Domine
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-[1vw] pt-[0.5vw]">
                            <div className="flex items-center gap-[1vw]">
                                <h4 className="text-[1.1vw] font-bold text-gray-800 whitespace-nowrap">Added Domine List</h4>
                                <div className="h-[1px] bg-gray-200 w-full mt-[0.2vw]"></div>
                            </div>
                            
                            <div className="flex items-center gap-[0.75vw]">
                                 <div className="flex-1 relative">
                                    <Icon icon="lucide:search" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.8vw] h-[0.8vw]" />
                                    <input 
                                        type="text" 
                                        value={domainSearch}
                                        onChange={(e) => setDomainSearch(e.target.value)}
                                        placeholder="Search"
                                        className="w-full bg-white border border-gray-200 rounded-[0.4vw] pl-[2vw] pr-[0.75vw] py-[0.35vw] text-[0.75vw] focus:outline-none focus:border-indigo-500 shadow-sm"
                                    />
                                 </div>
                                 <button className="flex items-center gap-[0.4vw] bg-black text-white px-[0.75vw] py-[0.35vw] rounded-[0.4vw] text-[0.7vw] font-semibold">
                                    <Icon icon="lucide:filter" className="w-[0.8vw] h-[0.8vw]" />
                                    Sort
                                 </button>
                            </div>

                            <div className="border border-gray-100 rounded-[0.5vw] bg-[#f8f9fc] overflow-hidden">
                                <table className="w-full text-left text-[0.7vw]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-white">
                                            <th className="p-[0.75vw] font-semibold text-gray-700">Domines</th>
                                            <th className="p-[0.75vw] font-semibold text-gray-700 text-center">Status</th>
                                            <th className="p-[0.75vw] font-semibold text-gray-700 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settings.inviteOnly.domains
                                            .filter(item => item.domain.toLowerCase().includes(domainSearch.toLowerCase()))
                                            .map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                                <td className="p-[0.75vw] text-gray-500 truncate max-w-[10vw]">{item.domain}</td>
                                                <td className="p-[0.75vw] text-center">
                                                    <span className={`${item.status === 'valid' ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-[0.75vw] text-right">
                                                    <button 
                                                        onClick={() => removeDomain(idx)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-[0.8vw] h-[0.8vw]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[0.8vw]">
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] bg-white border-b border-gray-100">
        <div className="flex items-center gap-[0.75vw]">
          <Icon 
            icon={settings.type === 'Invite only Access' ? "lucide:id-card" : settings.type === 'Password Protect' ? "lucide:lock" : "lucide:eye"} 
            className="w-[1.2vw] h-[1.2vw] text-gray-700" 
          />
          <span className="text-[1.1vw] font-semibold text-gray-900">{settings.type}</span>
        </div>
        <button 
          onClick={onBack}
          className="p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors"
        >
          <Icon icon="ic:round-arrow-back" className="w-[1.1vw] h-[1.1vw] text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[1.25vw] space-y-[1.5vw]">
        {renderContent()}
      </div>
    </div>
  );
};

const ToggleItem = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-[0.85vw] font-semibold text-gray-700">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`group relative inline-flex items-center h-[1.3vw] w-[2.6vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.5px] outline-none ${
        checked ? 'bg-white border-[#5551FF]' : 'bg-white border-gray-300'
      }`}
    >
      <div
        className={`pointer-events-none h-[0.85vw] w-[0.85vw] rounded-full shadow-sm transition-all duration-300 ease-in-out absolute ${
          checked ? 'left-[1.4vw] bg-[#5551FF]' : 'left-[0.2vw] bg-gray-300'
        }`}
      />
    </button>
  </div>
);

export default Visibility;
