import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';

const VISIBILITY_OPTIONS = [
  {
    id: 'Public',
    label: 'Public',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Everyone can view your flipbook.</strong> Your flipbook will be visible to all users. People can <strong className="text-gray-700 font-semibold">view, share, rate, review, follow your profile, and save your flipbook to their library.</strong> This option helps you reach more people and get more exposure.
      </>
    )
  },
  {
    id: 'Private',
    label: 'Private',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only you can view your flipbook.</strong> No one else can <strong className="text-gray-700 font-semibold">find or open it.</strong> It will not appear in search or public pages. Best for drafts and personal work.
      </>
    )
  },
  {
    id: 'Password Protect',
    label: 'Password Protect',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only people with the password can view your flipbook.</strong> It won't appear in public search or receive public ratings and reviews.
      </>
    )
  },
  {
    id: 'Invite Only Access',
    label: 'Invite Only Access',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only invited users can view your flipbook.</strong> It won't appear in public search or receive public ratings and reviews.
      </>
    )
  }
];

const ToggleItem = ({ label, checked, onChange, children }) => (
  <div className="flex items-center justify-between py-[0.2vw]">
    <div className="flex items-center gap-[0.5vw] shrink-0">
      <span className="text-[0.85vw] font-medium text-gray-800 whitespace-nowrap shrink-0">{label}</span>
      {children}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-[1.2vw] w-[2.4vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.5px] ${
        checked ? 'bg-[#5551FF] border-[#5551FF]' : 'bg-gray-200 border-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[0.9vw] w-[0.9vw] rounded-full bg-white shadow-md transform transition duration-300 ease-in-out ${
          checked ? 'translate-x-[1.2vw]' : 'translate-x-[0.15vw]'
        }`}
      />
    </button>
  </div>
);

const TimePickerPopover = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: 0, minute: 5 };
    const hrMatch = String(timeStr).match(/(\d+)\s*(?:Hr|Hour|h)/i);
    const minMatch = String(timeStr).match(/(\d+)\s*(?:Min|Minute|m)/i);
    let h = hrMatch ? parseInt(hrMatch[1], 10) : 0;
    let m = minMatch ? parseInt(minMatch[1], 10) : 0;
    if (!hrMatch && !minMatch) {
      const digits = String(timeStr).match(/\d+/);
      if (digits) m = parseInt(digits[0], 10);
    }
    return { hour: Math.min(23, Math.max(0, h)), minute: Math.min(59, Math.max(0, m)) };
  };

  const initial = parseTime(value || '0 Hr 5 Min');
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    const parsed = parseTime(value || '0 Hr 5 Min');
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');
  const displayTime = hour > 0 ? `${hour} Hr ${minute} Min` : `${minute} Mins`;

  const handleApply = () => {
    onChange(displayTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    const parsed = parseTime(value || '0 Hr 5 Min');
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-[0.35vw] bg-white border border-gray-200 rounded-[0.55vw] px-[0.6vw] py-[0.4vw] text-[0.78vw] font-semibold text-gray-800 hover:border-[#5551ff] focus:outline-none shadow-sm cursor-pointer whitespace-nowrap"
      >
        <div className="flex items-center gap-[0.3vw] whitespace-nowrap">
          <Icon icon="lucide:clock" className="w-[0.85vw] h-[0.85vw] text-[#5551ff] shrink-0" />
          <span className="whitespace-nowrap font-semibold text-gray-800 text-[0.75vw]">{displayTime}</span>
        </div>
        <Icon icon="ph:caret-down-bold" className={`w-[0.7vw] h-[0.7vw] text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5551ff]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-[115%] z-[9999] w-[15.5vw] min-w-[220px] bg-white rounded-[0.75rem] border-[1.5px] border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-[0.9vw] space-y-[0.65vw] animate-in fade-in zoom-in-95">
          <style>{`
            .custom-range-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              outline: none;
              border: none !important;
            }
            .custom-range-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              margin-top: -5px;
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .custom-range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            .custom-range-slider::-moz-range-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-moz-range-thumb {
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              cursor: pointer;
            }
          `}</style>

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <span className="text-[1.2vw] font-bold text-[#1e293b] tracking-tight">
              {displayTime}
            </span>
            <span className="text-[0.7vw] font-bold text-[#5551ff] bg-[#eaebf7] px-[0.5vw] py-[0.18vw] rounded-[0.4vw]">
              Time
            </span>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Hour Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Hour</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {formattedHour} Hr
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              className="custom-range-slider"
            />
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>12</span>
              <span>23</span>
            </div>
          </div>

          {/* Minutes Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Minutes</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {formattedMinute} Min
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value, 10))}
              className="custom-range-slider"
            />
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>30</span>
              <span>59</span>
            </div>
          </div>

          {/* Quick Minute Presets */}
          <div className="space-y-[0.25vw] pt-[0.1vw]">
            <span className="text-[0.65vw] font-semibold text-[#94a3b8] block">Quick Presets</span>
            <div className="grid grid-cols-5 gap-[0.25vw]">
              {[5, 15, 30, 45, 60].map((mVal) => (
                <button
                  key={mVal}
                  type="button"
                  onClick={() => {
                    if (mVal === 60) {
                      setHour(1);
                      setMinute(0);
                    } else {
                      setHour(0);
                      setMinute(mVal);
                    }
                  }}
                  className={`py-[0.25vw] rounded-[0.35vw] text-[0.68vw] font-bold border cursor-pointer transition-all ${
                    (mVal === 60 ? (hour === 1 && minute === 0) : (hour === 0 && minute === mVal))
                      ? 'bg-[#5551ff] text-white border-[#5551ff]'
                      : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                >
                  {mVal === 60 ? '1 Hr' : `${mVal}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-[0.6vw] pt-[0.1vw]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#5551ff] hover:opacity-80 text-[0.75vw] font-semibold transition-colors cursor-pointer px-[0.3vw] py-[0.15vw]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#5551ff] hover:bg-[#4338ca] text-white px-[1.1vw] py-[0.38vw] rounded-full text-[0.75vw] font-semibold transition-all shadow-md cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DayPickerPopover = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const parseDay = (dayStr) => {
    if (dayStr === undefined || dayStr === null) return 0;
    const match = String(dayStr).match(/^(\d+)/);
    return match ? Math.max(0, parseInt(match[1], 10)) : 0;
  };

  const initialDay = parseDay(value ?? '0 Days');
  const [days, setDays] = useState(initialDay);

  useEffect(() => {
    setDays(parseDay(value ?? '0 Days'));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayDays = `${days} ${days === 1 ? 'Day' : 'Days'}`;

  const handleApply = () => {
    onChange(displayDays);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDays(parseDay(value ?? '0 Days'));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-[0.35vw] bg-white border border-gray-200 rounded-[0.55vw] px-[0.6vw] py-[0.4vw] text-[0.78vw] font-semibold text-gray-800 hover:border-[#5551ff] focus:outline-none shadow-sm cursor-pointer whitespace-nowrap"
      >
        <div className="flex items-center gap-[0.3vw] whitespace-nowrap">
          <Icon icon="lucide:calendar" className="w-[0.85vw] h-[0.85vw] text-[#5551ff] shrink-0" />
          <span className="whitespace-nowrap font-semibold text-gray-800 text-[0.75vw]">{displayDays}</span>
        </div>
        <Icon icon="ph:caret-down-bold" className={`w-[0.7vw] h-[0.7vw] text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5551ff]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-[115%] z-[9999] w-[15.5vw] min-w-[220px] bg-white rounded-[0.75rem] border-[1.5px] border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-[0.9vw] space-y-[0.65vw] animate-in fade-in zoom-in-95">
          <style>{`
            .custom-range-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              outline: none;
              border: none !important;
              margin: 0;
              padding: 0;
            }
            .custom-range-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              margin-top: -5px;
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .custom-range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            .custom-range-slider::-moz-range-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-moz-range-thumb {
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              cursor: pointer;
            }
          `}</style>

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <span className="text-[1.2vw] font-bold text-[#1e293b] tracking-tight">
              {displayDays}
            </span>
            <span className="text-[0.7vw] font-bold text-[#5551ff] bg-[#eaebf7] px-[0.5vw] py-[0.18vw] rounded-[0.4vw]">
              Days
            </span>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Days Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Days Count</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="w-full py-1">
              <input
                type="range"
                min="0"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="custom-range-slider"
              />
            </div>
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-[0.25vw] pt-[0.1vw]">
            <span className="text-[0.65vw] font-semibold text-[#94a3b8] block">Quick Presets</span>
            <div className="grid grid-cols-6 gap-[0.2vw]">
              {[0, 1, 3, 5, 7, 30].map((pVal) => (
                <button
                  key={pVal}
                  type="button"
                  onClick={() => setDays(pVal)}
                  className={`py-[0.25vw] rounded-[0.35vw] text-[0.68vw] font-bold border cursor-pointer transition-all ${
                    days === pVal
                      ? 'bg-[#5551ff] text-white border-[#5551ff]'
                      : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                >
                  {pVal}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-[0.6vw] pt-[0.1vw]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#5551ff] hover:opacity-80 text-[0.75vw] font-semibold transition-colors cursor-pointer px-[0.3vw] py-[0.15vw]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#5551ff] hover:bg-[#4338ca] text-white px-[1.1vw] py-[0.38vw] rounded-full text-[0.75vw] font-semibold transition-all shadow-md cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Visibility = ({ onBack, settings, onUpdate, bookName }) => {
  const [activeAccordion, setActiveAccordion] = useState('email'); // 'email' or 'domain'
  const [createPassword, setCreatePassword] = useState(settings?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(settings?.password || '');
  const [accessKey, setAccessKey] = useState(settings?.accessKey || '');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [isPasswordSaved, setIsPasswordSaved] = useState(() => {
    return Boolean(settings?.isPasswordSaved || (settings?.password && settings?.accessKey));
  });
  const [verificationModal, setVerificationModal] = useState({ isOpen: false, mode: 'password', step: 'verifyPassword' });
  const [verificationPassword, setVerificationPassword] = useState('');
  const [showVerificationPassword, setShowVerificationPassword] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(23);
  const otpRefs = useRef([]);

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [newAccessKeyInput, setNewAccessKeyInput] = useState('');
  const [showNewAccessKeyInput, setShowNewAccessKeyInput] = useState(false);
  const [newFormError, setNewFormError] = useState('');

  const resetVerificationModal = () => {
    setVerificationModal({ isOpen: false, mode: 'password', step: 'verifyPassword' });
    setVerificationPassword('');
    setVerificationError('');
    setOtpValues(['', '', '', '']);
    setNewPasswordInput('');
    setNewPasswordConfirm('');
    setNewAccessKeyInput('');
    setNewFormError('');
  };

  useEffect(() => {
    let timer;
    if (verificationModal.isOpen && verificationModal.step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationModal.isOpen, verificationModal.step, resendTimer]);

  const handleOtpChange = (val, idx) => {
    const char = val.slice(-1);
    const newOtp = [...otpValues];
    newOtp[idx] = char;
    setOtpValues(newOtp);
    if (char && idx < 3) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpValues(digits);
      otpRefs.current[3]?.focus();
    }
  };

  const handleResendOtp = () => {
    setResendTimer(23);
    setOtpValues(['', '', '', '']);
  };
  const [emailInput, setEmailInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');

  const csvInputRef = useRef(null);

  const currentType = settings?.type || 'Public';

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result || '';
      const parsedEmails = content
        .split(/[\r\n,;]+/)
        .map(str => str.trim().replace(/^["']|["']$/g, ''))
        .filter(str => str.length > 0 && str.includes('@'));

      if (parsedEmails.length === 0) return;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const existing = settings?.inviteOnly?.emails || [];
      const existingSet = new Set(existing.map(item => item.email.toLowerCase()));

      const newItems = [];
      parsedEmails.forEach(email => {
        if (!existingSet.has(email.toLowerCase())) {
          existingSet.add(email.toLowerCase());
          newItems.push({
            email,
            status: emailRegex.test(email) ? 'valid' : 'invalid'
          });
        }
      });

      if (newItems.length > 0) {
        updateInvite('emails', [...existing, ...newItems]);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvFile(file);
    }
    e.target.value = '';
  };

  const handleSavePassword = () => {
    const finalAccessKey = accessKey.trim() || 'Book123';
    onUpdate({
      ...settings,
      password: createPassword,
      accessKey: finalAccessKey,
      isPasswordSaved: true
    });
    setIsPasswordSaved(true);
  };

  const handleTypeChange = (typeId) => {
    onUpdate({
      ...settings,
      type: typeId
    });
  };

  const updateInvite = (field, value) => {
    onUpdate({
      ...settings,
      inviteOnly: {
        ...(settings?.inviteOnly || {}),
        [field]: value
      }
    });
  };

  const addEmail = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    const existingEmails = settings?.inviteOnly?.emails || [];
    const newEmails = [...existingEmails, { email: emailInput.trim(), status: 'valid' }];
    updateInvite('emails', newEmails);
    setEmailInput('');
  };

  const removeEmail = (index) => {
    const existingEmails = settings?.inviteOnly?.emails || [];
    const newEmails = existingEmails.filter((_, i) => i !== index);
    updateInvite('emails', newEmails);
  };

  const addDomain = () => {
    if (!domainInput.trim() || !domainInput.includes('.')) return;
    const existingDomains = settings?.inviteOnly?.domains || [];
    const newDomains = [...existingDomains, { domain: domainInput.trim(), status: 'valid' }];
    updateInvite('domains', newDomains);
    setDomainInput('');
  };

  const removeDomain = (index) => {
    const existingDomains = settings?.inviteOnly?.domains || [];
    const newDomains = existingDomains.filter((_, i) => i !== index);
    updateInvite('domains', newDomains);
  };

  const updateAutoExpire = (field, value) => {
    const autoExpire = settings?.inviteOnly?.autoExpire || { enabled: true, duration: '5 Days' };
    onUpdate({
      ...settings,
      inviteOnly: {
        ...(settings?.inviteOnly || {}),
        autoExpire: {
          ...autoExpire,
          [field]: value
        }
      }
    });
  };

  const isTypeSelected = (optionId) => {
    if (!currentType) return false;
    const cur = currentType.toLowerCase().trim();
    const opt = optionId.toLowerCase().trim();
    if (cur === opt) return true;
    if (opt.startsWith('invite') && cur.startsWith('invite')) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[0.8vw]">
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1.25vw] bg-white border-b border-gray-100">
        <div className="flex items-center gap-[0.75vw]">
          <Icon
            icon="lucide:eye"
            className="w-[1.25vw] h-[1.25vw] text-gray-800"
          />
          <span className="text-[1.1vw] font-bold text-gray-900">Visibility</span>
        </div>
        <button
          onClick={onBack}
          className="p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <Icon icon="ic:round-arrow-back" className="w-[1.1vw] h-[1.1vw] text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[1.25vw] space-y-[1.5vw]">
        {/* Section Header */}
        <div className="flex items-center gap-[1vw]">
          <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Select the Visibility Type</h3>
          <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
        </div>

        {/* Radio Options List */}
        <div className="space-y-[1.25vw] pl-[0.2vw]">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = isTypeSelected(option.id);

            return (
              <label
                key={option.id}
                onClick={() => handleTypeChange(option.id)}
                className="flex items-center gap-[0.75vw] cursor-pointer group select-none"
              >
                <div className={`w-[1.15vw] h-[1.15vw] rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? 'border-[#5551FF] bg-white' : 'border-gray-400 group-hover:border-gray-500 bg-white'
                }`}>
                  {selected && <div className="w-[0.55vw] h-[0.55vw] rounded-full bg-[#5551FF]" />}
                </div>
                <span className={`text-[0.85vw] transition-colors ${
                  selected ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Note Box below all options */}
        {(() => {
          const selectedOpt = VISIBILITY_OPTIONS.find(opt => isTypeSelected(opt.id)) || VISIBILITY_OPTIONS[0];
          return (
            <div className="p-[1.2vw] bg-[#eaebf7] rounded-[0.75vw] border border-[#e0e3f5] mt-[0.5vw]">
              <p className="text-[0.78vw] text-gray-500 leading-snug font-normal text-justify">
                {selectedOpt.renderDescription()}
              </p>
            </div>
          );
        })()}

        {/* Password Protect Config */}
        {isTypeSelected('Password Protect') && (
          isPasswordSaved ? (
            <div className="space-y-[1.25vw] pt-[0.5vw]">
              {/* Password Section Header */}
              <div className="flex items-center gap-[1vw]">
                <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Password</h3>
                <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
              </div>

              {/* Access Key info line */}
              <div className="text-[0.85vw]">
                <span className="font-medium text-gray-600">Access Key : </span>
                <span className="text-gray-400 font-normal">{settings?.accessKey || accessKey || 'Book123'}</span>
              </div>

              {/* Center Lock Badge */}
              <div className="py-[1.25vw]">
                <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm mx-auto mb-[1vw]">
                  <Icon icon="lucide:lock" className="w-[2.2vw] h-[2.2vw] text-gray-800" />
                </div>
                <p className="text-center text-[0.82vw] text-gray-500 font-normal leading-snug">
                  Your Book <strong className="font-semibold text-gray-800">{bookName || settings?.bookName || 'Book Name'}</strong> is Protected<br />
                  by Password
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-[0.75vw] pt-[0.5vw]">
                <button
                  onClick={() => {
                    resetVerificationModal();
                    setVerificationModal({ isOpen: true, mode: 'password', step: 'verifyPassword' });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-[0.75vw] py-[0.75vw] text-[0.82vw] font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-[0.5vw]"
                >
                  <Icon icon="lucide:refresh-cw" className="w-[0.9vw] h-[0.9vw] text-gray-600" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    resetVerificationModal();
                    setVerificationModal({ isOpen: true, mode: 'accessKey', step: 'verifyPassword' });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-[0.75vw] py-[0.75vw] text-[0.82vw] font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-[0.5vw]"
                >
                  <Icon icon="lucide:refresh-cw" className="w-[0.9vw] h-[0.9vw] text-gray-600" />
                  <span>Change Access Key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-[1.25vw] pt-[0.5vw]">
              {/* Set Password Section Header */}
              <div className="space-y-[0.3vw]">
                <div className="flex items-center gap-[1vw]">
                  <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Set Password</h3>
                  <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
                </div>
                <p className="text-[0.75vw] text-gray-500 font-normal">
                  Protect your flipbook with a secure password.
                </p>
              </div>

              {/* Create Password */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Create Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm pr-[2.5vw]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showCreatePassword ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1.1vw] h-[1.1vw]"
                    />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm pr-[2.5vw]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showConfirmPassword ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1.1vw] h-[1.1vw]"
                    />
                  </button>
                </div>
              </div>

              {/* Password Validation Checklist */}
              <div className="space-y-[0.5vw] pt-[0.2vw]">
                <h4 className="text-[0.85vw] font-semibold text-gray-800">Your password must include:</h4>
                <div className="space-y-[0.35vw] pl-[0.2vw]">
                  {[
                    { label: '8–16 characters', valid: createPassword.length >= 8 && createPassword.length <= 16 },
                    { label: 'One uppercase letter (A–Z)', valid: /[A-Z]/.test(createPassword) },
                    { label: 'One lowercase letter (a–z)', valid: /[a-z]/.test(createPassword) },
                    { label: 'One number (0–9)', valid: /[0-9]/.test(createPassword) },
                    { label: 'One special character (! @ # & *)', valid: /[!@#&*]/.test(createPassword) },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-[0.5vw]">
                      <Icon
                        icon="lucide:check"
                        className={`w-[0.9vw] h-[0.9vw] ${item.valid ? 'text-green-500' : 'text-gray-300'}`}
                      />
                      <span className={`text-[0.78vw] ${item.valid ? 'text-gray-700' : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enter Access Key */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Enter Access Key</label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Book123"
                  className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm"
                />
                <p className="text-gray-500 text-[0.72vw]">User will Enter this key to open this book</p>
              </div>

              {/* Save Password Button */}
              <div className="pt-[0.5vw]">
                <button
                  onClick={handleSavePassword}
                  className="w-full bg-[#5551FF] text-white py-[0.75vw] rounded-[0.6vw] text-[0.85vw] font-semibold hover:bg-[#4338ca] transition-colors shadow-md cursor-pointer flex items-center justify-center"
                >
                  Save Password
                </button>
              </div>
            </div>
          )
        )}

        {/* Invite Only Access Config */}
        {isTypeSelected('Invite Only Access') && (
          <div className="space-y-[1.5vw] pt-[0.5vw]">
            {/* Access Settings Block */}
            <div className="space-y-[0.75vw]">
              <div className="flex items-center gap-[1vw]">
                <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Access Settings Block</h3>
                <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
              </div>

              {/* Auto-Expire Container Card */}
              <div className="bg-white border border-gray-200 rounded-[0.75vw] p-[0.9vw] space-y-[0.75vw] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[0.85vw] font-semibold text-gray-800">Auto-expire in</span>
                  <button
                    type="button"
                    onClick={() => updateAutoExpire('enabled', !settings?.inviteOnly?.autoExpire?.enabled)}
                    className={`relative inline-flex items-center h-[1.2vw] w-[2.4vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.5px] ${
                      settings?.inviteOnly?.autoExpire?.enabled ? 'bg-[#5551FF] border-[#5551FF]' : 'bg-gray-200 border-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-[0.9vw] w-[0.9vw] rounded-full bg-white shadow-md transform transition duration-300 ease-in-out ${
                        settings?.inviteOnly?.autoExpire?.enabled ? 'translate-x-[1.2vw]' : 'translate-x-[0.15vw]'
                      }`}
                    />
                  </button>
                </div>

                {settings?.inviteOnly?.autoExpire?.enabled && (
                  <div className="grid grid-cols-2 gap-[0.6vw] pt-[0.2vw] animate-in fade-in slide-in-from-top-1 duration-200">
                    <DayPickerPopover
                      value={settings?.inviteOnly?.autoExpire?.days ?? '0 Days'}
                      onChange={(newDays) => updateAutoExpire('days', newDays)}
                    />
                    <TimePickerPopover
                      value={settings?.inviteOnly?.autoExpire?.time || '5 Mins'}
                      onChange={(newTime) => updateAutoExpire('time', newTime)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Invite by Specific Email */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden transition-all">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'email' ? null : 'email')}
                className="w-full flex items-center justify-between p-[1vw] font-bold text-[0.9vw] text-gray-900 cursor-pointer"
              >
                <span>Invite by Specific Email</span>
                <Icon
                  icon={activeAccordion === 'email' ? "lucide:chevron-up" : "lucide:chevron-down"}
                  className="w-[1.1vw] h-[1.1vw] text-gray-600"
                />
              </button>

              {activeAccordion === 'email' && (
                <div className="p-[1.1vw] pt-0 space-y-[0.6vw]">
                  {/* Add Emails Section */}
                  <div className="space-y-[0.4vw]">
                    <div className="flex items-center gap-[1vw]">
                      <h4 className="text-[0.85vw] font-semibold text-gray-800 whitespace-nowrap">Add Emails</h4>
                      <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
                    </div>

                    <div className="space-y-[0.4vw]">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="naveen1234@gmail.com"
                        className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={addEmail}
                          className="bg-[#5551FF] text-white px-[1.1vw] py-[0.35vw] rounded-[0.5vw] font-semibold text-[0.72vw] hover:bg-[#4338ca] transition-all shadow-sm cursor-pointer"
                        >
                          Add Email
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* "or" text */}
                  <div className="text-center my-[0.05vw]">
                    <span className="text-gray-400 text-[0.72vw] font-normal">or</span>
                  </div>

                  {/* Drag & Drop Upload CSV Box */}
                  <input
                    type="file"
                    ref={csvInputRef}
                    accept=".csv,.txt"
                    onChange={handleCsvInputChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => csvInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleCsvFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border border-dashed border-gray-300 rounded-[0.65vw] py-[0.8vw] px-[0.8vw] flex flex-col items-center justify-center gap-[0.3vw] bg-white cursor-pointer hover:bg-gray-50/80 transition-all"
                  >
                    <Icon icon="lucide:upload" className="w-[1.4vw] h-[1.4vw] text-gray-400" />
                    <p className="text-[0.75vw] text-gray-400 font-normal">
                      Drag & Drop or <span className="text-[#5551FF] font-semibold">Upload</span> CSV file
                    </p>
                  </div>

                  {/* Added Email List Section */}
                  <div className="space-y-[0.75vw] pt-[0.4vw]">
                    <div className="flex items-center gap-[1vw]">
                      <h4 className="text-[0.85vw] font-semibold text-gray-800 whitespace-nowrap">Added Email List</h4>
                      <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
                    </div>

                    {/* Table Container Card */}
                    <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden p-[0.8vw] space-y-[0.75vw]">
                      {/* Search & Sort Header */}
                      <div className="flex items-center gap-[0.5vw]">
                        <div className="flex-1 relative">
                          <Icon icon="lucide:search" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.85vw] h-[0.85vw]" />
                          <input
                            type="text"
                            value={emailSearch}
                            onChange={(e) => setEmailSearch(e.target.value)}
                            placeholder="Search"
                            className="w-full bg-white border border-gray-300 rounded-full pl-[2.2vw] pr-[0.8vw] py-[0.4vw] text-[0.75vw] focus:outline-none focus:border-[#5551FF]"
                          />
                        </div>
                        <button className="flex items-center gap-[0.4vw] bg-black text-white px-[1.2vw] py-[0.4vw] rounded-full text-[0.75vw] font-bold cursor-pointer shrink-0">
                          <Icon icon="lucide:arrow-up-down" className="w-[0.75vw] h-[0.75vw]" />
                          <span>Sort</span>
                        </button>
                      </div>

                      {/* Table */}
                      <div className="border border-gray-200 rounded-[0.6vw] overflow-hidden max-h-[14vw] overflow-y-auto bg-white">
                        <table className="w-full text-left text-[0.75vw] table-fixed">
                          <thead className="sticky top-0 bg-[#f4f4fc] border-b border-gray-200">
                            <tr>
                              <th className="w-[50%] p-[0.6vw] px-[0.8vw] font-bold text-gray-900">Emails</th>
                              <th className="w-[25%] p-[0.6vw] font-bold text-gray-900 text-center">Status</th>
                              <th className="w-[25%] p-[0.6vw] px-[0.8vw] font-bold text-gray-900 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(settings?.inviteOnly?.emails || [])
                              .filter(item => item.email.toLowerCase().includes(emailSearch.toLowerCase()))
                              .map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td title={item.email} className="p-[0.6vw] px-[0.8vw] text-gray-500 truncate font-normal cursor-pointer">{item.email}</td>
                                  <td className="p-[0.6vw] text-center font-medium">
                                    <span className={item.status === 'valid' ? 'text-green-500' : 'text-red-500'}>
                                      {item.status === 'valid' ? 'Valid' : 'Invalid'}
                                    </span>
                                  </td>
                                  <td className="p-[0.6vw] px-[0.8vw] text-right">
                                    <button
                                      onClick={() => removeEmail(idx)}
                                      className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                      <Icon icon="lucide:trash-2" className="w-[0.95vw] h-[0.95vw]" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal (Center of Full Screen Window via React Portal) */}
      {verificationModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-[1vw]">
          <div className="bg-white rounded-[1vw] p-[1.25vw] shadow-2xl w-[25vw] min-w-[300px] max-w-[420px] relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 pr-[0.5vw]">
                <h2 className="text-[1vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">
                  {verificationModal.mode === 'password' ? 'Change Password' : 'Change Access Key'}
                </h2>
                <div className="h-[1px] bg-gray-200 flex-1 ml-[0.6vw] mt-[0.1vw]"></div>
              </div>
              <button
                type="button"
                onClick={resetVerificationModal}
                className="w-[1.8vw] h-[1.8vw] min-w-[24px] min-h-[24px] rounded-[0.5vw] border border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px] text-red-500" />
              </button>
            </div>

            {verificationModal.step === 'otp' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  Enter the verification code sent to your email.
                </p>

                <div className="mt-[1vw] text-center space-y-[0.6vw]">
                  <p className="text-[0.72vw] text-gray-500 leading-relaxed font-normal">
                    We have sent One Time Password (OTP) via email<br />
                    to this Account <strong className="font-semibold text-gray-800">youremailid@gmail.com</strong>
                  </p>

                  <p className="text-[0.72vw] text-gray-600 font-normal pt-[0.2vw]">
                    Enter the code below to continue.
                  </p>

                  {/* 4 Digit OTP Inputs */}
                  <div className="flex items-center justify-center gap-[0.7vw] py-[0.5vw]">
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className={`w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] text-center text-[1vw] font-bold rounded-[0.6vw] border transition-all focus:outline-none shadow-xs ${
                          digit
                            ? 'border-[#5551FF] bg-white text-gray-900 shadow-sm'
                            : 'border-gray-300 bg-white text-gray-800 focus:border-[#5551FF]'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Resend Timer line */}
                  <p className="text-[0.7vw] text-gray-500 pt-[0.1vw]">
                    Didn't receive the code? : {' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-500 font-normal">Resent in 00.{String(resendTimer).padStart(2, '0')}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-[#5551FF] underline font-semibold hover:text-[#4338ca] cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </p>
                </div>
              </>
            )}

            {verificationModal.step === 'verifyPassword' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  {verificationModal.mode === 'password'
                    ? 'Verify your current password to continue.'
                    : 'Verify your password before changing the book key.'}
                </p>

                {/* Form Inputs */}
                <div className="mt-[1vw] space-y-[0.35vw]">
                  <label className="text-[0.78vw] font-semibold text-gray-900 block">
                    Enter your current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showVerificationPassword ? "text" : "password"}
                      value={verificationPassword}
                      onChange={(e) => {
                        setVerificationPassword(e.target.value);
                        if (verificationError) setVerificationError('');
                      }}
                      placeholder="@My current pass123"
                      className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                      className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <Icon
                        icon={showVerificationPassword ? "lucide:eye" : "lucide:eye-off"}
                        className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                      />
                    </button>
                  </div>

                  {verificationError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{verificationError}</p>
                  )}

                  <div className="flex justify-end pt-[0.1vw]">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationModal(prev => ({ ...prev, step: 'otp' }));
                        setResendTimer(23);
                        setOtpValues(['', '', '', '']);
                      }}
                      className="text-[0.7vw] font-medium text-[#4f46e5] underline hover:text-[#4338ca] cursor-pointer"
                    >
                      Forget Password ?
                    </button>
                  </div>
                </div>
              </>
            )}

            {verificationModal.step === 'newPassword' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  Enter a new password to secure your flipbook settings.
                </p>

                <div className="mt-[1vw] space-y-[0.7vw]">
                  {/* New Password */}
                  <div className="space-y-[0.3vw]">
                    <label className="text-[0.78vw] font-semibold text-gray-900 block">
                      Enter your New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPasswordInput ? "text" : "password"}
                        value={newPasswordInput}
                        onChange={(e) => {
                          setNewPasswordInput(e.target.value);
                          if (newFormError) setNewFormError('');
                        }}
                        placeholder="@My New pass123"
                        className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordInput(!showNewPasswordInput)}
                        className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Icon
                          icon={showNewPasswordInput ? "lucide:eye" : "lucide:eye-off"}
                          className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-[0.3vw]">
                    <label className="text-[0.78vw] font-semibold text-gray-900 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPasswordConfirm ? "text" : "password"}
                        value={newPasswordConfirm}
                        onChange={(e) => {
                          setNewPasswordConfirm(e.target.value);
                          if (newFormError) setNewFormError('');
                        }}
                        placeholder="@My New pass123"
                        className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                        className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Icon
                          icon={showNewPasswordConfirm ? "lucide:eye" : "lucide:eye-off"}
                          className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                        />
                      </button>
                    </div>
                  </div>

                  {newFormError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{newFormError}</p>
                  )}
                </div>
              </>
            )}

            {verificationModal.step === 'newAccessKey' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  Create a new book key to share secure access with your readers.
                </p>

                <div className="mt-[1vw] space-y-[0.7vw]">
                  {/* Your Current Access Key */}
                  <div className="space-y-[0.15vw]">
                    <label className="text-[0.78vw] font-normal text-gray-600 block">
                      Your Current Access Key
                    </label>
                    <p className="text-[0.85vw] font-semibold text-gray-400">
                      {accessKey || settings?.accessKey || 'Book123'}
                    </p>
                  </div>

                  {/* Enter your New Access Key */}
                  <div className="space-y-[0.3vw]">
                    <label className="text-[0.78vw] font-semibold text-gray-900 block">
                      Enter your New Access Key
                    </label>
                    <div className="relative">
                      <input
                        type={showNewAccessKeyInput ? "text" : "password"}
                        value={newAccessKeyInput}
                        onChange={(e) => {
                          setNewAccessKeyInput(e.target.value);
                          if (newFormError) setNewFormError('');
                        }}
                        placeholder="New.Bookkey"
                        className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAccessKeyInput(!showNewAccessKeyInput)}
                        className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Icon
                          icon={showNewAccessKeyInput ? "lucide:eye" : "lucide:eye-off"}
                          className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Note Banner */}
                  <div className="bg-[#f0f2f8] rounded-[0.5vw] p-[0.6vw] px-[0.8vw]">
                    <p className="text-[0.68vw] text-gray-500 leading-snug">
                      <strong className="font-semibold text-gray-800">Note:</strong> Changing your Access Key will disable the current key. Anyone using the old key will no longer be able to access this flipbook.
                    </p>
                  </div>

                  {newFormError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{newFormError}</p>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-[0.6vw] mt-[1.2vw]">
              <button
                type="button"
                onClick={resetVerificationModal}
                className="bg-white border border-gray-300 rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (verificationModal.step === 'verifyPassword') {
                    if (!verificationPassword.trim()) {
                      setVerificationError('Please enter your current password.');
                      return;
                    }
                    setVerificationError('');
                    setVerificationModal(prev => ({
                      ...prev,
                      step: prev.mode === 'password' ? 'newPassword' : 'newAccessKey'
                    }));
                  } else if (verificationModal.step === 'otp') {
                    if (otpValues.join('').length < 4) {
                      alert('Please enter the 4-digit code.');
                      return;
                    }
                    setVerificationModal(prev => ({
                      ...prev,
                      step: prev.mode === 'password' ? 'newPassword' : 'newAccessKey'
                    }));
                  } else if (verificationModal.step === 'newPassword') {
                    if (!newPasswordInput.trim()) {
                      setNewFormError('Please enter your new password.');
                      return;
                    }
                    if (newPasswordInput !== newPasswordConfirm) {
                      setNewFormError('Passwords do not match.');
                      return;
                    }
                    setCreatePassword(newPasswordInput);
                    setConfirmPassword(newPasswordConfirm);
                    setIsPasswordSaved(true);
                    if (onUpdate) {
                      onUpdate({
                        ...settings,
                        password: newPasswordInput,
                        isPasswordSaved: true
                      });
                    }
                    resetVerificationModal();
                  } else if (verificationModal.step === 'newAccessKey') {
                    if (!newAccessKeyInput.trim()) {
                      setNewFormError('Please enter a new access key.');
                      return;
                    }
                    setAccessKey(newAccessKeyInput);
                    setIsPasswordSaved(true);
                    if (onUpdate) {
                      onUpdate({
                        ...settings,
                        accessKey: newAccessKeyInput,
                        isPasswordSaved: true
                      });
                    }
                    resetVerificationModal();
                  }
                }}
                className="bg-black text-white rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold hover:bg-gray-900 transition-all cursor-pointer shadow-md"
              >
                {verificationModal.step === 'newPassword'
                  ? 'Change Password'
                  : verificationModal.step === 'newAccessKey'
                  ? 'Change Access Key'
                  : 'Verify'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Visibility;
