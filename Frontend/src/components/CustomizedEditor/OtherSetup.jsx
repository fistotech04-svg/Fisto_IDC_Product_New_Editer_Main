import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';

const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`group relative inline-flex items-center h-[1.3vw] w-[2.7vw] shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none ${
      enabled ? 'bg-[#4A3AFF] border-transparent' : 'bg-gray-200 border-transparent'
    }`}
  >
    <div
      className={`pointer-events-none flex items-center justify-center h-[1.1vw] w-[1.1vw] rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out absolute ${
        enabled ? 'left-[1.4vw]' : 'left-[0.2vw]'
      }`}
    >
      {enabled && (
        <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-[#4A3AFF] stroke-[3px]" />
      )}
    </div>
  </button>
);

const RadioGroup = ({ options, value, onChange }) => (
  <div className="space-y-[0.75vw]">
    {options.map((opt) => (
      <label key={opt.id} className="flex items-center gap-[0.75vw] cursor-pointer group">
        <div className="relative flex items-center justify-center">
          <input 
            type="radio" 
            name="radio-group"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="peer appearance-none w-[1.2vw] h-[1.2vw] border-2 border-gray-300 rounded-full checked:border-[#4A3AFF] transition-all bg-white"
          />
          <div className="absolute w-[0.6vw] h-[0.6vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className={`text-[0.85vw] font-medium ${value === opt.id ? 'text-gray-900' : 'text-gray-500'}`}>{opt.label}</span>
      </label>
    ))}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] mb-[1vw] mt-[1.25vw]">
    <h4 className="text-[0.9vw] font-bold text-gray-900 whitespace-nowrap">{title}</h4>
    <div className="h-[1px] bg-gray-200 w-full" />
  </div>
);

const ColorPickerItem = ({ label, color, opacity = 100, onChange, onOpacityChange }) => (
  <div className="flex items-center justify-between mb-[0.75vw] gap-[1vw]">
    <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap shrink-0 w-[5.5vw]">{label} :</span>
    <div className="flex items-center gap-[0.4vw] flex-1">
      <div 
        className="w-[2.2vw] h-[1.8vw] rounded-[0.4vw] border border-gray-300 cursor-pointer overflow-hidden relative shadow-sm shrink-0"
        style={{ backgroundColor: color === '#' || !color || color === 'transparent' ? 'white' : color }}
      >
        {(color === '#' || !color || color === 'transparent') && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-red-400 rotate-45"></div>
        )}
        <input 
          type="color" 
          value={color && color.startsWith('#') && color.length === 7 ? color : '#ffffff'} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.2vw] h-[1.8vw] shadow-sm">
        <input 
          type="text"
          value={color && color.length > 1 ? color.toUpperCase() : '#'}
          onChange={(e) => onChange(e.target.value)}
          className="text-[0.75vw] font-medium text-gray-500 flex-1 bg-transparent outline-none uppercase w-full"
        />
        <div className="w-[1px] h-[70%] bg-gray-200 mx-[0.4vw] shrink-0"></div>
        <span className="text-[0.75vw] font-medium text-gray-400 w-[2.5vw] text-right shrink-0">{opacity}%</span>
      </div>
    </div>
  </div>
);

const AccordionItem = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-white rounded-[1vw] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-[1vw] overflow-hidden">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-[1.25vw] py-[1vw] text-[0.85vw] font-bold text-gray-800 transition-colors ${
        isOpen ? 'bg-gray-50/50' : 'bg-white'
      }`}
    >
      <span className="whitespace-nowrap">{title}</span>
      <Icon 
        icon="lucide:chevron-down" 
        className={`w-[1.2vw] h-[1.2vw] text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>
    <div 
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[100vw] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="px-[1.25vw] pb-[1.5vw] border-t border-gray-50 pt-[1vw]">
        {children}
      </div>
    </div>
  </div>
);

const OtherSetup = ({ onBack, settings, onUpdate }) => {
  const [openAccordion, setOpenAccordion] = useState('toolbar');

  const updateNested = (section, field, value) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const updateSectionField = (section, subSection, field, value) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [subSection]: {
          ...settings[section][subSection],
          [field]: value
        }
      }
    });
  };

  // Safe access helper for nested settings
  const getNestedValue = (section, field, fallback = {}) => {
    return settings?.[section]?.[field] ?? fallback;
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] font-sans">
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="qlementine-icons:page-setup-16" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1.1vw] font-semibold text-gray-900">Other Setup</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[1.25vw] custom-scrollbar">
        {/* Toolbar Settings */}
        <AccordionItem 
          title="Toolbar Settings" 
          isOpen={openAccordion === 'toolbar'} 
          onToggle={() => setOpenAccordion(openAccordion === 'toolbar' ? null : 'toolbar')}
        >
          <div className="space-y-[0.5vw]">
            <div>
              <SectionHeader title="Toolbar Display Mode" />
              <RadioGroup 
                options={[
                  { id: 'icon', label: 'Only Icon' },
                  { id: 'icon-text', label: 'Icon with Text' }
                ]}
                value={settings.toolbar?.displayMode || 'icon'}
                onChange={(val) => updateNested('toolbar', 'displayMode', val)}
              />
            </div>

            <div>
              <SectionHeader title="Text Properties" />
              <div className="flex items-center justify-between mb-[1vw] gap-[1vw]">
                <span className="text-[0.85vw] font-medium text-gray-700 whitespace-nowrap shrink-0">Choose the Text style :</span>
                <PremiumDropdown 
                  options={['Poppins', 'Inter', 'Roboto', 'Montserrat']}
                  value={getNestedValue('toolbar', 'textProperties').font || 'Poppins'}
                  onChange={(val) => updateSectionField('toolbar', 'textProperties', 'font', val)}
                  width="7.5vw"
                  className="shrink-0"
                />
              </div>
              <ColorPickerItem 
                label="Fill" 
                color={getNestedValue('toolbar', 'textProperties').fill || '#295655'} 
                onChange={(val) => updateSectionField('toolbar', 'textProperties', 'fill', val)} 
              />
              <ColorPickerItem 
                label="Stoke" 
                color={getNestedValue('toolbar', 'textProperties').stroke || '#'} 
                onChange={(val) => updateSectionField('toolbar', 'textProperties', 'stroke', val)} 
              />
            </div>

            <div>
              <SectionHeader title="Toolbar Color" />
              <ColorPickerItem 
                label="Fill" 
                color={getNestedValue('toolbar', 'toolbarColor').fill || '#ffffff'} 
                onChange={(val) => updateSectionField('toolbar', 'toolbarColor', 'fill', val)} 
              />
              <ColorPickerItem 
                label="Stoke" 
                color={getNestedValue('toolbar', 'toolbarColor').stroke || '#'} 
                onChange={(val) => updateSectionField('toolbar', 'toolbarColor', 'stroke', val)} 
              />
            </div>

            <div>
              <SectionHeader title="Icons Color" />
              <ColorPickerItem 
                label="Fill" 
                color={getNestedValue('toolbar', 'iconsColor').fill || '#295655'} 
                onChange={(val) => updateSectionField('toolbar', 'iconsColor', 'fill', val)} 
              />
              <ColorPickerItem 
                label="Stoke" 
                color={getNestedValue('toolbar', 'iconsColor').stroke || '#'} 
                onChange={(val) => updateSectionField('toolbar', 'iconsColor', 'stroke', val)} 
              />
            </div>

            <div>
              <SectionHeader title="Process Bar" />
              <ColorPickerItem 
                label="Fill" 
                color={getNestedValue('toolbar', 'processBar').fill || '#4A3AFF'} 
                onChange={(val) => updateSectionField('toolbar', 'processBar', 'fill', val)} 
              />
              <ColorPickerItem 
                label="Stoke" 
                color={getNestedValue('toolbar', 'processBar').stroke || '#'} 
                onChange={(val) => updateSectionField('toolbar', 'processBar', 'stroke', val)} 
              />
            </div>
          </div>
        </AccordionItem>

        {/* Popup Settings */}
        <AccordionItem 
          title="Popup Settings" 
          isOpen={openAccordion === 'popup'} 
          onToggle={() => setOpenAccordion(openAccordion === 'popup' ? null : 'popup')}
        >
          <div className="space-y-[1vw]">
            <div>
              <SectionHeader title="Text Properties" />
              <div className="flex items-center justify-between mb-[1vw]">
                <span className="text-[0.85vw] font-medium text-gray-700">Choose the Text style :</span>
                <PremiumDropdown 
                  options={['Poppins', 'Inter', 'Roboto']}
                  value={getNestedValue('popup', 'textProperties').font || 'Poppins'}
                  onChange={(val) => updateSectionField('popup', 'textProperties', 'font', val)}
                  width="7.5vw"
                />
              </div>
              <ColorPickerItem label="Fill" color={getNestedValue('popup', 'textProperties').fill || '#295655'} onChange={(val) => updateSectionField('popup', 'textProperties', 'fill', val)} />
              <ColorPickerItem label="Stoke" color={getNestedValue('popup', 'textProperties').stroke || '#'} onChange={(val) => updateSectionField('popup', 'textProperties', 'stroke', val)} />
            </div>

            <div>
              <SectionHeader title="Background Color" />
              <ColorPickerItem label="Fill" color={getNestedValue('popup', 'backgroundColor').fill || '#ffffff'} onChange={(val) => updateSectionField('popup', 'backgroundColor', 'fill', val)} />
              <ColorPickerItem label="Stoke" color={getNestedValue('popup', 'backgroundColor').stroke || '#'} onChange={(val) => updateSectionField('popup', 'backgroundColor', 'stroke', val)} />
            </div>

            <div>
              <SectionHeader title="Icons Color" />
              <ColorPickerItem label="Fill" color={getNestedValue('popup', 'iconsColor').fill || '#295655'} onChange={(val) => updateSectionField('popup', 'iconsColor', 'fill', val)} />
              <ColorPickerItem label="Stoke" color={getNestedValue('popup', 'iconsColor').stroke || '#'} onChange={(val) => updateSectionField('popup', 'iconsColor', 'stroke', val)} />
            </div>

            <div>
              <SectionHeader title="Search Bar" />
              <ColorPickerItem label="Fill" color={getNestedValue('popup', 'searchBar').fill || '#ffffff'} onChange={(val) => updateSectionField('popup', 'searchBar', 'fill', val)} />
              <ColorPickerItem label="Stoke" color={getNestedValue('popup', 'searchBar').stroke || '#'} onChange={(val) => updateSectionField('popup', 'searchBar', 'stroke', val)} />
              <ColorPickerItem label="Text" color={getNestedValue('popup', 'searchBar').text || '#295655'} onChange={(val) => updateSectionField('popup', 'searchBar', 'text', val)} />
              <ColorPickerItem label="Icon" color={getNestedValue('popup', 'searchBar').icon || '#295655'} onChange={(val) => updateSectionField('popup', 'searchBar', 'icon', val)} />
            </div>
          </div>
        </AccordionItem>

        {/* Sound Settings */}
        <AccordionItem 
          title="Sound Settings" 
          isOpen={openAccordion === 'sound'} 
          onToggle={() => setOpenAccordion(openAccordion === 'sound' ? null : 'sound')}
        >
          <div className="space-y-[1.5vw]">
            <div>
              <SectionHeader title="Flip Sound" />
              <div className="space-y-[0.75vw]">
                {[
                  { id: 'Classic Book Flip', label: 'Classic Book Flip', icon: 'mingcute:equalizer-fill' },
                  { id: 'Soft Paper Flip', label: 'Soft Paper Flip', icon: 'lucide:music' },
                  { id: 'Hard Cover Flip', label: 'Hard Cover Flip', icon: 'lucide:music' }
                ].map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => updateNested('sound', 'flipSound', s.id)}
                    className={`w-full flex items-center gap-[1vw] px-[1vw] py-[0.75vw] rounded-[0.75vw] transition-all ${
                      settings.sound?.flipSound === s.id 
                      ? 'bg-blue-50/50' 
                      : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-[2vw] h-[2vw] flex items-center justify-center rounded-full shadow-sm transition-colors ${
                      settings.sound?.flipSound === s.id ? 'bg-[#4A3AFF] text-white' : 'bg-white border border-gray-200 text-gray-400'
                    }`}>
                      <Icon icon={s.icon} className="w-[1vw] h-[1vw]" />
                    </div>
                    <span className={`text-[0.85vw] font-bold ${
                      settings.sound?.flipSound === s.id ? 'text-gray-900' : 'text-gray-600'
                    }`}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-[1.25vw] bg-white border border-gray-100 rounded-[0.75vw] p-[1vw] shadow-sm">
                <span className="text-[0.85vw] font-bold text-gray-700">Add specific sound effect for pages :</span>
                <Switch 
                  enabled={settings.sound?.pageSpecificSound} 
                  onChange={(val) => updateNested('sound', 'pageSpecificSound', val)} 
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Background Sound" />
              <div className="border-[1px] border-dashed border-gray-300 rounded-[1vw] p-[1.5vw] flex flex-col items-center justify-center gap-[0.5vw] cursor-pointer hover:border-[#4A3AFF]/50 hover:bg-gray-50 transition-all mb-[1vw] bg-[#fafafa]">
                <Icon icon="lucide:upload" className="text-gray-400 w-[1.5vw] h-[1.5vw]" />
                <span className="text-[0.7vw] font-bold text-gray-400">Upload - MP3, WAV, M4A</span>
              </div>
              <div className="space-y-[0.75vw]">
                {[
                  { id: 'BG Sound 1', label: 'BG Sound 1', icon: 'mingcute:equalizer-fill' },
                  { id: 'BG Sound 2', label: 'BG Sound 2', icon: 'lucide:music' },
                  { id: 'BG Sound 3', label: 'BG Sound 3', icon: 'lucide:music' }
                ].map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => updateNested('sound', 'bgSound', s.id)}
                    className={`w-full flex items-center gap-[1vw] px-[1vw] py-[0.75vw] rounded-[0.75vw] transition-all ${
                      settings.sound?.bgSound === s.id 
                      ? 'bg-blue-50/50' 
                      : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-[2vw] h-[2vw] flex items-center justify-center rounded-full shadow-sm transition-colors ${
                      settings.sound?.bgSound === s.id ? 'bg-[#4A3AFF] text-white' : 'bg-white border border-gray-200 text-gray-400'
                    }`}>
                      <Icon icon={s.icon} className="w-[1vw] h-[1vw]" />
                    </div>
                    <span className={`text-[0.85vw] font-bold ${
                      settings.sound?.bgSound === s.id ? 'text-gray-900' : 'text-gray-600'
                    }`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AccordionItem>

        {/* Gallery Option */}
        <AccordionItem 
          title="Gallery Option" 
          isOpen={openAccordion === 'gallery'} 
          onToggle={() => setOpenAccordion(openAccordion === 'gallery' ? null : 'gallery')}
        >
          <div className="space-y-[1.25vw]">
             <div className="flex items-center justify-between">
                <span className="text-[0.85vw] font-bold text-gray-700">Gallery Style</span>
                <PremiumDropdown 
                  options={['Grid', 'Scrolled', 'Masonry']}
                  value={settings.gallery?.style || 'Grid'}
                  onChange={(val) => updateNested('gallery', 'style', val)}
                  width="8vw"
                />
             </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  );
};

export default OtherSetup;
