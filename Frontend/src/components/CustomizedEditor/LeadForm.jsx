import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Plus, Trash2 } from 'lucide-react';
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
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
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

  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    if (!settings.fields || settings.fields.length === 0) {
      onUpdate({
        ...settings,
        fields: [
          { id: Date.now().toString(), type: 'name', placeholder: 'Enter your Name' },
          { id: (Date.now() + 1).toString(), type: 'empty' }
        ]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!activeDropdownId) return;
      const activeContainer = document.getElementById(`dropdown-container-${activeDropdownId}`);
      if (activeContainer && !activeContainer.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  const handleAddField = () => {
    const newFields = [...(settings.fields || []), { id: Date.now().toString(), type: 'empty' }];
    onUpdate({ ...settings, fields: newFields });
  };

  const handleTypeChange = (id, type) => {
    const defaultPlaceholders = {
      name: 'Enter your Name',
      email: 'Enter your Email',
      phone: 'Enter your Phone Number',
      services: 'Select Service',
      enquiry: 'Enter your Enquiry'
    };
    const newFields = (settings.fields || []).map(f =>
      f.id === id ? { ...f, type, placeholder: defaultPlaceholders[type] } : f
    );
    onUpdate({ ...settings, fields: newFields });
    setActiveDropdownId(null);
  };

  const handleRemoveField = (id) => {
    const newFields = (settings.fields || []).filter(f => f.id !== id);
    onUpdate({ ...settings, fields: newFields });
  };

  const handleFieldChange = (id, placeholder) => {
    const newFields = (settings.fields || []).map(f =>
      f.id === id ? { ...f, placeholder } : f
    );
    onUpdate({ ...settings, fields: newFields });
  };

  const fieldOptions = [
    { type: 'name', label: 'Name', icon: 'lucide:user' },
    { type: 'email', label: 'Email', icon: 'logos:google-gmail' },
    { type: 'phone', label: 'Phone Number', icon: 'lucide:phone' },
    { type: 'services', label: 'Services', icon: 'lucide:settings' },
    { type: 'enquiry', label: 'Enquiry', icon: 'lucide:message-square' }
  ];

  const allOptionsAdded = (settings.fields || []).length >= fieldOptions.length;

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

          {/* Add Leads */}
          <div className="space-y-[1vw] font-sans">
            <div className="flex items-center gap-[0.5vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Add Leads</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className="space-y-[1vw]">
              {settings.fields?.map((field) => (
                <div
                  key={field.id}
                  id={`dropdown-container-${field.id}`}
                  className="flex items-center gap-[0.75vw] group relative"
                >
                  {/* Icon Container */}
                  <div
                    className="w-[2.5vw] h-[2.5vw] bg-white border border-gray-400 rounded-[0.5vw] flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
                    onClick={() => setActiveDropdownId(activeDropdownId === field.id ? null : field.id)}
                  >
                    {field.type === 'email' ? (
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-[1.25vw] h-auto" />
                    ) : field.type === 'name' ? (
                      <Icon icon="lucide:user" width="1vw" className="text-gray-900" />
                    ) : field.type === 'phone' ? (
                      <Icon icon="lucide:phone" width="1vw" className="text-gray-400" />
                    ) : field.type === 'services' ? (
                      <Icon icon="lucide:settings" width="1vw" className="text-gray-900" />
                    ) : field.type === 'enquiry' || field.type === 'feedback' ? (
                      <Icon icon="lucide:message-square" width="1vw" className="text-gray-900" />
                    ) : (
                      <Icon icon="lucide:ban" width="1vw" className="text-gray-900" />
                    )}
                    <Icon icon="fluent:chevron-down-12-regular" className="ml-[0.1vw] text-gray-400" width="0.75vw" />
                  </div>

                  {/* Dropdown for this field */}
                  {activeDropdownId === field.id && (
                    <div className="absolute top-[3vw] left-0 z-50 bg-white rounded-[1vw] shadow-2xl p-[1vw] w-[12vw] border border-gray-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-[0.75vw]">
                        {fieldOptions
                          .filter(opt => !settings.fields.some(f => f.type === opt.type && f.id !== field.id))
                          .map((opt) => (
                            <div
                              key={opt.type}
                              className="flex items-center gap-[1vw] group/opt cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTypeChange(field.id, opt.type);
                              }}
                            >
                              {opt.type === 'email' ? (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-[1.25vw] h-auto" />
                              ) : (
                                <Icon icon={opt.icon} width="1.25vw" className="transition-transform group-hover/opt:scale-110" />
                              )}
                              <span className="text-[0.8125vw] font-medium text-gray-700 normal-case">{opt.label}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex-1 flex items-center justify-between bg-white border border-gray-400 rounded-[0.5vw] px-[0.5vw] py-[0.5vw] h-[2.5vw] shadow-sm overflow-hidden">
                    <div className="flex items-center gap-[0.25vw] flex-1 min-w-0">
                      <div className="grid min-w-0 max-w-full">
                        <span className="col-start-1 row-start-1 invisible whitespace-pre font-medium text-[0.7vw] px-[0.1vw] overflow-hidden text-ellipsis">
                          {field.placeholder || (field.type === 'empty' ? 'Select a type...' : `Enter your ${field.type === 'email' ? 'Email' : fieldOptions.find(o => o.type === field.type)?.label || field.type}`)}
                        </span>
                        <input
                          id={`input-${field.id}`}
                          type="text"
                          size={1}
                          value={field.placeholder || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.type === 'empty' ? 'Select a type...' : `Enter your ${field.type === 'email' ? 'Email' : fieldOptions.find(o => o.type === field.type)?.label || field.type}`}
                          className="col-start-1 row-start-1 w-full text-[0.7vw] focus:outline-none normal-case font-medium text-gray-900 bg-transparent min-w-0 px-[0.1vw]"
                          disabled={field.type === 'empty'}
                        />
                      </div>

                      <Icon
                        icon="mdi:rename-outline"
                        width="1vw"
                        className="text-gray-500 hover:text-gray-900 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none group-hover:pointer-events-auto"
                        onClick={() => {
                          const input = document.getElementById(`input-${field.id}`);
                          if (input) {
                            input.focus();
                            input.select();
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center ml-[0.5vw] shrink-0">
                      <Trash2
                        size="1vw"
                        className="text-red-400 cursor-pointer hover:text-red-500 transition-colors stroke-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                        onClick={() => handleRemoveField(field.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Button */}
              {!allOptionsAdded && (
                <div className="flex items-center justify-end pt-[0.25vw] relative">
                  <button
                    onClick={handleAddField}
                    className="flex items-center gap-[0.25vw] px-[0.7vw] py-[0.5vw] border border-gray-300 bg-white rounded-[0.5vw] text-gray-600 text-[0.75vw] font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Plus size="0.875vw" /> Add
                  </button>
                </div>
              )}
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
                  className={`transition-colors flex flex-col p-[0.75vw] ${settings.appearance.timing === opt.id ? 'bg-[#eeeffc]' : 'bg-transparent'
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
      const sidebarContainer = swatchRef.current.closest('.bg-white.relative.overflow-visible');
      const sidebarRightEdge = sidebarContainer ? sidebarContainer.getBoundingClientRect().right : rect.right;
      
      const pickerWidth = window.innerWidth * 0.15; // ColorPallet width is 15vw
      const pickerHeight = 350;
      const yPos = Math.min(rect.top, window.innerHeight - pickerHeight);
      // Position picker half inside and half outside on the right side of the sidebar
      setPickerPos({ x: sidebarRightEdge - (pickerWidth / 2), y: Math.max(0, yPos) });
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
      {isOpen && createPortal(
        <div ref={pickerRef}>
          <ColorPallet
            color={color && color.startsWith('#') && color.length >= 7 ? color.substring(0, 7) : '#ffffff'}
            onChange={onChange}
            opacity={100}
            onClose={() => setIsOpen(false)}
            style={{ position: 'fixed', top: pickerPos.y, left: pickerPos.x, zIndex: 9999, transform: 'none' }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadForm;


