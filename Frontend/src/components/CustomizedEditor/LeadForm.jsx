import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';
import ColorPallet from './ColorPallet';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`group relative inline-flex items-center h-[1vw] w-[2vw] shrink-0 cursor-pointer rounded-[1vw] transition-all duration-200 ease-in-out border outline-none ${
              enabled ? 'bg-[#4A3AFF] border-[#4A3AFF]' : 'bg-transparent border-[#4A3AFF]'
            }`}
          >
            <div
              className={`pointer-events-none flex items-center justify-center h-[1.1vw] w-[1.1vw] rounded-full bg-[#4A3AFF] shadow-sm transition-all duration-200 ease-in-out absolute  ${
                enabled ? 'left-[1.1vw]' : 'right-[1.1vw]'
              }`}
            >
              {enabled && (
                <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-white " />
              )}
    </div>
  </button>
);

const LeadForm = ({ onBack, settings, onUpdate, pages = [] }) => {
  const [isColorOpen, setIsColorOpen] = useState(true);

  const updateNested = (category, field, value) => {
    onUpdate({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };

  const updateAppearance = (field, value) => {
    onUpdate({
      ...settings,
      appearance: {
        ...settings.appearance,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-visible">
       <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Sub-header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="fluent:form-48-regular" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1vw] font-semibold text-gray-900">Lead Form</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>
        
        <div className="flex items-center justify-between pt-[1vw] pr-[1vw] pl-[1vw]">
          <div className="flex flex-col">
            <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">Turn ON/OFF the Lead Form</span>
            <p className="text-[0.6vw] text-gray-400 font-sm mt-[0.2vw]  max-w-[15vw]">
              Turning this OFF will disable all lead form settings below, and turning it ON will enable them again<span className="text-red-500">*</span>
            </p>
          </div>
          <Switch 
            enabled={settings.enabled} 
            onChange={(val) => onUpdate({ ...settings, enabled: val })} 
          />
      </div>

      <div 
        className={`flex-1 ${settings.enabled ? 'overflow-y-auto' : 'overflow-hidden'} p-[1vw] space-y-[1vw] hide-scrollbar`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`space-y-[1vw] transition-all duration-300 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Customize your Form */}
        <div className="space-y-[1vw]">
          <div className="flex items-center gap-[0.5vw]">
            <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Customize your Form</h3>
            <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
          </div>
          
          <div className="space-y-[0.5vw]">
            <div className="flex items-start gap-[1vw]">
                <label className="text-[0.7vw] font-semibold text-gray-700">Lead Text :</label>
                <textarea 
                    value={settings.leadText}
                    onChange={(e) => onUpdate({ ...settings, leadText: e.target.value })}
                    className="flex-1 h-[5vw] border border-gray-300 rounded-[0.75vw] p-[0.75vw] text-[0.7vw] text-gray-500 focus:outline-none focus:border-indigo-500 resize-none bg-white shadow-sm"
                    placeholder='"Share your information to get personalized updates."'
                />
            </div>
          </div>
        </div>

        {/* Select Fields to Collect Leads */}
        <div className="space-y-[1vw]">
          <div className="flex items-center gap-[0.5vw]">
            <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Select Fields to Collect Leads</h3>
            <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
          </div>
          
          <div className="space-y-[0.3vw] ">
            {[
              { id: 'name', label: 'Name' },
              { id: 'phone', label: 'Phone Number' },
              { id: 'email', label: 'Email Id' },
              { id: 'feedback', label: 'Feedback' }
            ].map(field => (
              <div key={field.id} className="bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] transition-all duration-300 relative z-0">
                <div className="flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] shadow-sm rounded-[0.7vw] transition-all duration-300">
                  <span className="text-[0.75vw] font-medium text-gray-800 whitespace-nowrap">{field.label}</span>
                  <div className="flex items-center gap-[0.75vw]">
                    <Switch
                      enabled={settings.fields[field.id]}
                      onChange={() => updateNested('fields', field.id, !settings.fields[field.id])}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead form Timing */}
        <div className="space-y-[1vw]">
          <div className="flex items-center gap-[0.5vw]">
            <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Lead form should Appears at</h3>
            <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
          </div>

          <div className="rounded-[0.75vw]">
            {[
              { id: 'before', label: 'Before opening the flipbook' },
              { id: 'after-pages', label: 'After few pages' },
              { id: 'end', label: 'At the end of the flipbook' }
            ].map((opt, idx, arr) => (
              <div 
                key={opt.id} 
                className={`transition-colors flex flex-col p-[0.75vw] ${
                  settings.appearance.timing === opt.id ? 'bg-[#eeeffc]' : 'bg-transparent'
                } ${idx === 0 ? 'rounded-t-[0.75vw]' : ''} ${idx === arr.length - 1 ? 'rounded-b-[0.75vw]' : ''}`}
              >
                <label className="text-[0.7vw] font-semibold text-gray-700 flex items-center gap-[0.75vw] cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="timing"
                      checked={settings.appearance.timing === opt.id}
                      onChange={() => updateAppearance('timing', opt.id)}
                      className="peer appearance-none w-[1.1vw] h-[1.1vw] border-2 border-gray-400 rounded-full checked:border-indigo-600 transition-all bg-white"
                    />
                    <div className="absolute w-[0.55vw] h-[0.55vw] bg-indigo-600 rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                  <span className={`text-[0.75vw] font-medium ${settings.appearance.timing === opt.id ? 'text-indigo-900' : 'text-gray-600'}`}>{opt.label}</span>
                </label>
                
                {opt.id === 'after-pages' && settings.appearance.timing === 'after-pages' && (
                  <div className="ml-[1.85vw] mt-[1vw] flex items-center gap-[0.75vw]">
                    <span className="text-[0.75vw] font-semibold text-gray-700">Select Page :</span>
                    <PremiumDropdown 
                      options={Array.from({ length: pages.length || 10 }, (_, i) => ({ 
                        value: i + 1, 
                        label: `Page ${i + 1}`,
                        disabled: i === 0 || i === (pages.length || 10) - 1
                      }))}
                      value={settings.appearance.afterPages}
                      placeholder={`${settings.appearance.afterPages || 1}`}
                      onChange={(val) => updateAppearance('afterPages', parseInt(val))}
                      width="6vw"
                      buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                      align="right"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Other Customization Options */}
        <div className="space-y-[0.5vw]">
            <div className="flex items-center gap-[0.3vw]">
                <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Other Customization options</h3>
                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className={`bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] transition-all duration-300 relative z-0 ${isColorOpen ? 'ring-1 ring-gray-200' : ''}`}>
                <button 
                    onClick={() => setIsColorOpen(!isColorOpen)}
                    className={`w-full flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] shadow-sm transition-all duration-300 ${isColorOpen ? 'rounded-t-[0.8vw] border-b-transparent bg-gray-50/50' : 'rounded-[0.8vw] bg-white'}`}
                >
                    <span className="text-[0.8vw] font-semibold text-gray-900">Color Customization</span>
                    <Icon icon="lucide:chevron-down" className={`w-[1.2vw] h-[1.2vw] text-gray-400 transition-transform duration-300 ${isColorOpen ? 'rotate-180' : ''}`} />
                </button>

                {isColorOpen && (
                    <div className="p-[1vw] border-t border-gray-200 bg-gray-50/50 rounded-b-[0.8vw] space-y-[0.8vw] animate-in fade-in slide-in-from-top-2">
                        {/* Text Properties */}
                        <div className="space-y-[0.75vw] ">
                            <div className="flex items-center gap-[0.5vw]">
                                <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Text Properties</h4>
                                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.1vw' }}> </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-[0.7vw] font-semibold text-gray-900">Choose the Text Style:</span>
                                <PremiumDropdown 
                                    options={fontFamilies}
                                    value={settings.appearance.fontStyle}
                                    onChange={(val) => updateAppearance('fontStyle', val)}
                                    width="8.5vw"
                                    isFont={true}
                                    buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                                    align="right"
                                />
                            </div>
                            <ColorPickerItem label="Fill :" color={settings.appearance.textFill} onChange={(val) => updateAppearance('textFill', val)} />
                            <ColorPickerItem label="Stoke :" color={settings.appearance.textStroke} onChange={(val) => updateAppearance('textStroke', val)} />
                        </div>

                        {/* Background Color */}
                        <div className="space-y-[0.75vw]">
                            <div className="flex items-center gap-[0.5vw]">
                                <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Background Color</h4>
                                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                            </div>
                            <ColorPickerItem label="Fill :" color={settings.appearance.bgFill} onChange={(val) => updateAppearance('bgFill', val)} />
                            <ColorPickerItem label="Stoke :" color={settings.appearance.bgStroke} onChange={(val) => updateAppearance('bgStroke', val)} />
                        </div>

                        {/* Button */}
                        <div className="space-y-[0.75vw]">
                            <div className="flex items-center gap-[0.5vw]">
                                <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Button</h4>
                                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                            </div>
                            <ColorPickerItem label="Fill :" color={settings.appearance.btnFill} onChange={(val) => updateAppearance('btnFill', val)} />
                            <ColorPickerItem label="Stoke :" color={settings.appearance.btnStroke} onChange={(val) => updateAppearance('btnStroke', val)} />
                            <ColorPickerItem label="Text :" color={settings.appearance.btnText} onChange={(val) => updateAppearance('btnText', val)} />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] transition-all duration-300 relative z-0">
                <div className="flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] shadow-sm rounded-[0.7vw] transition-all duration-300">
                    <span className="text-[0.75vw] font-medium text-gray-800 whitespace-nowrap">Allow Skip</span>
                    <div className="flex items-center gap-[0.75vw]">
                        <Switch
                            enabled={settings.appearance.allowSkip}
                            onChange={() => updateAppearance('allowSkip', !settings.appearance.allowSkip)}
                        />
                    </div>
                </div>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const ColorPickerItem = ({ label, color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
    const pickerRef = useRef(null);
    const swatchRef = useRef(null);

    // The click-outside logic is now handled internally by ColorPallet via onClose


    const handleOpen = () => {
        if (!isOpen && swatchRef.current) {
            const rect = swatchRef.current.getBoundingClientRect();
            // Position picker to the left of the button to avoid getting cut off
            setPickerPos({ x: rect.left - 270, y: rect.top });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="flex items-center gap-[0.4vw] relative">
            <span className="w-[3vw] text-[0.7vw] pl-[0.5vw] font-semibold text-gray-700 shrink-0">{label}</span>
            <div className="flex-1 flex items-center gap-[0.5vw]">
                <div 
                    ref={swatchRef}
                    className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-900 cursor-pointer overflow-hidden relative shadow-sm color-picker-trigger"
                    style={{ backgroundColor: color === '#' || !color || color === 'transparent' ? 'white' : color }}
                    onClick={handleOpen}
                >
                    {(color === '#' || !color || color === 'transparent') && (
                         <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.1vw] bg-red-500 rotate-45"></div>
                    )}
                </div>
                <div className="flex-1 flex items-center bg-white border border-gray-900 rounded-[0.4vw] px-[0.6vw] py-[0.2vw] h-[1.8vw] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <span className="text-[0.7vw] font-medium text-gray-600 flex-1">{color && color.length > 1 ? color.toUpperCase() : '#'}</span>
                    <div className="w-[1px] h-[70%] bg-gray-100 mx-[0.4vw]"></div>
                    <div className="text-[0.7vw] font-semibold text-gray-800 w-[2.5vw] text-right">100%</div>
                </div>
            </div>
            {isOpen && (
                <div 
                    ref={pickerRef}
                    className="fixed z-[9999]"
                    style={{ top: pickerPos.y, left: pickerPos.x }}
                >
                    <ColorPallet 
                        color={color && color.startsWith('#') && color.length >= 7 ? color.substring(0, 7) : '#ffffff'} 
                        onChange={onChange}
                        opacity={100}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default LeadForm;




