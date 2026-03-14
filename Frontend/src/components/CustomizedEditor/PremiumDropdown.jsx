import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ChevronDown } from 'lucide-react';

const PremiumDropdown = ({ 
  options, 
  value, 
  onChange, 
  width = '9vw', 
  menuWidth = 'w-full',
  label = '',
  placeholder = 'Select option...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative dropdown-container ${className}`} ref={dropdownRef} style={{ width }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-[0.75vw] px-[1.1vw] py-[0.50vw] flex items-center justify-between shadow-[0.15vw_0.15vw_0.4vw_rgba(0,0,0,0.05),-0.1vw_-0.1vw_0.3vw_rgba(255,255,255,1)] hover:shadow-[0.2vw_0.2vw_0.5vw_rgba(0,0,0,0.08)] transition-all active:scale-95 border border-transparent"
      >
        <span className="text-[0.6875vw] font-semibold text-gray-700 truncate">{value || placeholder}</span>
        <ChevronDown className={`w-[1vw] h-[1vw] text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          className={`absolute top-full mt-[0.5vw] ${menuWidth === 'w-full' ? 'w-full' : ''} bg-white rounded-[1vw] shadow-[0_1.25vw_3.125vw_rgba(0,0,0,0.15)] border border-gray-50 z-[100] overflow-hidden py-[0.5vw] animate-in fade-in slide-in-from-top-2`}
          style={menuWidth !== 'w-full' ? { width: menuWidth } : {}}
        >
          <div className="max-h-[12vw] overflow-y-auto custom-scrollbar">
            {options.map((opt) => {
              const optionValue = typeof opt === 'string' ? opt : opt.value;
              const optionLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optionValue;
              
              return (
                <button
                  key={optionValue}
                  onClick={() => {
                    onChange(optionValue);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-[1.1vw] py-[0.5vw] text-[0.6875vw] font-semibold transition-colors ${
                    isSelected 
                      ? 'text-[#3E4491] bg-gray-50' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#3E4491]'
                  }`}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumDropdown;
