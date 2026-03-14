import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDropdown from './PremiumDropdown';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';

// Reusable Switch Component
const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`group relative inline-flex items-center h-[1.2vw] w-[2.5vw] shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none ${
      enabled ? 'bg-[#4A3AFF] border-transparent' : 'bg-white border-2 border-[#4A3AFF]'
    }`}
  >
    <div
      className={`pointer-events-none flex items-center justify-center h-[1.3vw] w-[1.3vw] rounded-full bg-[#4A3AFF] shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out absolute ${
        enabled ? 'left-[1.5vw]' : 'left-[-0.2vw]'
      }`}
    >
      {enabled && (
        <Icon icon="lucide:check" className="w-[0.9vw] h-[0.9vw] text-white stroke-[3px]" />
      )}
    </div>
  </button>
);

// Reusable Section Header
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.75vw] my-[1vw] pt-[0.5vw]">
    <h4 className="text-[0.85vw] font-bold text-gray-800 whitespace-nowrap">{title}</h4>
    <div className="h-[0.0925vw] bg-gray-200 w-full"></div>
  </div>
);

// Menu Item Component (Card Style)
const MenuItem = ({ label, enabled, onChange, hasSettings, isExpanded, onToggleSettings, children }) => (
  <div className={`bg-white border border-gray-200 rounded-[0.6vw] shadow-sm transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-1 ring-gray-300' : ''}`}>
    <div className="flex items-center justify-between px-[1vw] py-[0.8vw]">
      <span className="text-[0.85vw] font-semibold text-gray-700">{label}</span>
      <div className="flex items-center gap-[0.75vw]">
        {hasSettings && (
          <button 
            onClick={onToggleSettings}
            className={`p-[0.25vw] rounded-[0.4vw] transition-colors ${
              isExpanded ? 'bg-gray-100 text-[#4A3AFF]' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <Icon icon="lucide:sliders-horizontal" className="w-[1vw] h-[1vw]" />
          </button>
        )}
        <Switch enabled={enabled} onChange={onChange} />
      </div>
    </div>
    {children}
  </div>
);

// TOC Item Component for Editor
const TocItem = ({ item, level = 0, onUpdate, onDelete, onAddSub }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [page, setPage] = useState(item.page);

  const handleSave = () => {
    onUpdate({ ...item, title, page });
    setIsEditing(false);
  };

  return (
    <div className="mb-[0.5vw]">
      <div className={`flex items-center gap-[0.5vw] mb-[0.25vw] ${level > 0 ? 'ml-[1.5vw] border-l border-dashed border-gray-300 pl-[0.5vw]' : ''}`}>
        <div className="flex-1 flex items-center gap-[0.5vw]">
           <span className={`flex justify-center items-center w-[1.25vw] h-[1.25vw] rounded-full text-[0.7vw] font-bold text-white ${level === 0 ? 'bg-[#4B5EAA]' : 'bg-gray-400'}`}>
             {item.id}
           </span>
           {isEditing ? (
             <input 
               autoFocus
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               onBlur={handleSave}
               onKeyDown={(e) => e.key === 'Enter' && handleSave()}
               className="flex-1 text-[0.75vw] border border-gray-300 rounded px-[0.25vw] py-[0.1vw] outline-none focus:border-indigo-500"
             />
           ) : (
             <span className="flex-1 text-[0.75vw] text-gray-600 truncate">{item.title}</span>
           )}
        </div>
        
        <div className="flex items-center gap-[0.25vw]">
          <div className="w-[2vw] h-[1.5vw] border border-gray-300 rounded flex items-center justify-center text-[0.7vw] text-gray-500">
             {item.page}
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-gray-600 p-[0.1vw]">
            <Edit2 size="0.8vw" />
          </button>
          
          {level < 2 && ( // Limit depth to 2 levels (Heading -> Subheading)
            <button onClick={onAddSub} className="text-gray-400 hover:text-indigo-600 p-[0.1vw]">
              <Plus size="0.8vw" />
            </button>
          )}
          
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-[0.1vw]">
             <Trash2 size="0.8vw" />
          </button>
        </div>
      </div>
      
      {item.subheadings && item.subheadings.map((sub, idx) => (
        <TocItem 
          key={sub.uid || idx} 
          item={sub} 
          level={level + 1} 
          onUpdate={(updatedSub) => {
            const newSubs = [...item.subheadings];
            newSubs[idx] = updatedSub;
            onUpdate({ ...item, subheadings: newSubs });
          }}
          onDelete={() => {
            const newSubs = item.subheadings.filter((_, i) => i !== idx);
            onUpdate({ ...item, subheadings: newSubs });
          }}
          onAddSub={() => {}}
        />
      ))}
    </div>
  );
};


const MenuBar = ({ onBack, settings, onUpdate }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const updateSection = (section, field, value) => {
    onUpdate({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const updateNestedSetting = (section, nestedObject, field, value) => {
    const sectionState = settings[section] || {};
    const nestedState = sectionState[nestedObject] || {};

    onUpdate({
      ...settings,
      [section]: {
        ...sectionState,
        [nestedObject]: {
          ...nestedState,
          [field]: value
        }
      }
    });
  };

  // Helper for direct property updates in settings root (like tocSettings which is separate)
  const updateRootSetting = (rootKey, field, value) => {
    onUpdate({
      ...settings,
      [rootKey]: {
        ...settings[rootKey],
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans relative">
       <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="lucide:menu" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1.1vw] font-semibold text-gray-900">Menu Bar</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-[1.25vw] pb-[2.5vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* Navigation Section */}
        <SectionHeader title="Navigation" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Next / Preview Buttons" 
            enabled={settings.navigation?.nextPrevButtons} 
            onChange={(val) => updateSection('navigation', 'nextPrevButtons', val)} 
          />
          <MenuItem 
            label="Mouse Wheel Navigation" 
            enabled={settings.navigation?.mouseWheel} 
            onChange={(val) => updateSection('navigation', 'mouseWheel', val)} 
          />
          <MenuItem 
            label="Drag to Turn Pages" 
            enabled={settings.navigation?.dragToTurn} 
            onChange={(val) => updateSection('navigation', 'dragToTurn', val)} 
          />
          <MenuItem 
            label="Page Quick Access" 
            enabled={settings.navigation?.pageQuickAccess} 
            onChange={(val) => updateSection('navigation', 'pageQuickAccess', val)} 
          />
          
          {/* Table of Contents with Settings */}
          <MenuItem 
            label="Table of Contents" 
            enabled={settings.navigation?.tableOfContents} 
            hasSettings={true}
            isExpanded={expandedSection === 'toc'}
            onToggleSettings={() => toggleSection('toc')}
            onChange={(val) => updateSection('navigation', 'tableOfContents', val)} 
          >
            <AnimatePresence>
              {expandedSection === 'toc' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="p-[1vw]">
                    <div className="space-y-[0.35vw] mb-[1.25vw]">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Add Search to the TOC</span>
                        <Switch 
                          enabled={settings.tocSettings?.addSearch} 
                          onChange={(val) => updateRootSetting('tocSettings', 'addSearch', val)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Add Page Number to the TOC</span>
                        <Switch 
                          enabled={settings.tocSettings?.addPageNumber} 
                          onChange={(val) => updateRootSetting('tocSettings', 'addPageNumber', val)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Add Serial Number to the Heading</span>
                        <Switch 
                          enabled={settings.tocSettings?.addSerialNumberHeading} 
                          onChange={(val) => updateRootSetting('tocSettings', 'addSerialNumberHeading', val)} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Add Serial Number to the Subheading</span>
                        <Switch 
                          enabled={settings.tocSettings?.addSerialNumberSubheading} 
                          onChange={(val) => updateRootSetting('tocSettings', 'addSerialNumberSubheading', val)} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[0.5vw] mb-[0.75vw]">
                      <h5 className="text-[0.8vw] font-bold text-gray-700">TOC Content</h5>
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                    </div>

                    <div className="space-y-[0.5vw]">
                      {settings.tocSettings?.content?.map((item, idx) => (
                        <TocItem 
                          key={item.id} 
                          item={item} 
                          level={0}
                          onUpdate={(updatedItem) => {
                            const newContent = [...settings.tocSettings.content];
                            newContent[idx] = updatedItem;
                            updateRootSetting('tocSettings', 'content', newContent);
                          }}
                          onDelete={() => {
                            const newContent = settings.tocSettings.content.filter((_, i) => i !== idx);
                            updateRootSetting('tocSettings', 'content', newContent);
                          }}
                          onAddSub={() => {
                            const newContent = [...settings.tocSettings.content];
                            if (!newContent[idx].subheadings) newContent[idx].subheadings = [];
                            newContent[idx].subheadings.push({ 
                              id: newContent[idx].subheadings.length + 1, 
                              title: 'New Subheading', 
                              page: item.page 
                            });
                            updateRootSetting('tocSettings', 'content', newContent);
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-[0.5vw] mt-[1.25vw]">
                      <button 
                          onClick={() => {
                            const newContent = [...(settings.tocSettings.content || [])];
                            newContent.push({ id: newContent.length + 1, title: 'New Heading', page: 1, subheadings: [] });
                            updateRootSetting('tocSettings', 'content', newContent);
                          }}
                          className="flex-1 bg-black text-white py-[0.5vw] rounded-[0.4vw] text-[0.75vw] font-medium flex items-center justify-center gap-[0.25vw] hover:bg-gray-800 transition-colors"
                      >
                        <Plus size="0.8vw" /> Head
                      </button>
                      <button 
                          onClick={() => {
                            const newContent = [...(settings.tocSettings.content || [])];
                            if (newContent.length > 0) {
                                const lastItem = newContent[newContent.length - 1];
                                if (!lastItem.subheadings) lastItem.subheadings = [];
                                lastItem.subheadings.push({
                                    id: lastItem.subheadings.length + 1,
                                    title: 'New Subheading', 
                                    page: lastItem.page
                                });
                                updateRootSetting('tocSettings', 'content', newContent);
                            }
                          }}
                          className="flex-1 bg-black text-white py-[0.5vw] rounded-[0.4vw] text-[0.75vw] font-medium flex items-center justify-center gap-[0.25vw] hover:bg-gray-800 transition-colors"
                      >
                        <Plus size="0.8vw" /> Sub
                      </button>
                    </div>
                    
                    <button className="w-full bg-[#4A3AFF] text-white py-[0.5vw] rounded-[0.4vw] text-[0.75vw] font-medium mt-[0.75vw] hover:bg-[#3428d4] transition-colors">
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>

          <MenuItem 
            label="Page Thumbnails" 
            enabled={settings.navigation?.pageThumbnails} 
            onChange={(val) => updateSection('navigation', 'pageThumbnails', val)} 
          />

          {/* Bookmark with Settings */}
          <MenuItem 
            label="Bookmark" 
            enabled={settings.navigation?.bookmark} 
            hasSettings={true}
            isExpanded={expandedSection === 'bookmark'}
            onToggleSettings={() => toggleSection('bookmark')}
            onChange={(val) => updateSection('navigation', 'bookmark', val)} 
          >
            <AnimatePresence>
              {expandedSection === 'bookmark' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="p-[1vw]">
                    <div className="flex items-center gap-[0.5vw] mb-[0.75vw]">
                      <h5 className="text-[0.8vw] font-bold text-gray-700">Bookmark Symbol</h5>
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                    </div>
                    
                    <div className="flex items-center gap-[1vw]">
                      <div className="w-[3.5vw] h-[3.5vw] flex items-center justify-center bg-white shadow-sm border border-gray-200 rounded-[0.5vw] relative">
                        {/* Placeholder for bookmark icon preview */}
                        <div className="w-[2vw] h-[1.5vw] bg-orange-500 rounded relative overflow-hidden shadow-sm">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[0.5vw] font-bold">Page 1-2</div>
                        </div>
                        <Icon icon="lucide:arrow-left-right" className="absolute top-[0.25vw] right-[0.25vw] w-[0.75vw] h-[0.75vw] text-gray-400" />
                      </div>
                      
                      <div className="flex-1 space-y-[0.5vw]">
                        <span className="text-[0.75vw] font-medium text-gray-500">Select Text :</span>
                        <PremiumDropdown 
                          options={['Poppins', 'Arial', 'Times New Roman']} 
                          value={settings.navigation?.bookmarkSettings?.font || 'Poppins'}
                          onChange={(val) => updateNestedSetting('navigation', 'bookmarkSettings', 'font', val)}
                          width="100%"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>

          <MenuItem 
            label="Start / End Navigation" 
            enabled={settings.navigation?.startEndNav} 
            onChange={(val) => updateSection('navigation', 'startEndNav', val)} 
          />
        </div>

        {/* Viewing Section */}
        <SectionHeader title="Viewing" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Zoom In / Out Button" 
            enabled={settings.viewing?.zoom} 
            onChange={(val) => updateSection('viewing', 'zoom', val)} 
          />
          <MenuItem 
            label="Full Screen View" 
            enabled={settings.viewing?.fullScreen} 
            onChange={(val) => updateSection('viewing', 'fullScreen', val)} 
          />
        </div>

        {/* Interaction Tools Section */}
        <SectionHeader title="Interaction Tools" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Search Inside Book" 
            enabled={settings.interaction?.search} 
            onChange={(val) => updateSection('interaction', 'search', val)} 
          />
          <MenuItem 
            label="Add Notes" 
            enabled={settings.interaction?.notes} 
            onChange={(val) => updateSection('interaction', 'notes', val)} 
          />
          <MenuItem 
            label="Gallery" 
            enabled={settings.interaction?.gallery} 
            onChange={(val) => updateSection('interaction', 'gallery', val)} 
          />
        </div>

        {/* Media Controls Section */}
        <SectionHeader title="Media Controls" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Auto Flip Features" 
            enabled={settings.media?.autoFlip} 
            hasSettings={true}
            isExpanded={expandedSection === 'autoflip'}
            onToggleSettings={() => toggleSection('autoflip')}
            onChange={(val) => updateSection('media', 'autoFlip', val)} 
          >
            <AnimatePresence>
              {expandedSection === 'autoflip' && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="p-[1vw]">
                    <div className="flex items-center justify-between mb-[0.75vw]">
                      <span className="text-[0.75vw] font-medium text-gray-600">Auto Flip Duration :</span>
                      <div className="flex items-center gap-[0.5vw] border border-gray-200 rounded-[0.25vw] px-[0.25vw] py-[0.1vw] bg-white">
                          <button 
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => updateNestedSetting('media', 'autoFlipSettings', 'duration', Math.max(1, (settings.media?.autoFlipSettings?.duration || 2) - 1))}
                          >
                            <ChevronDown size="0.8vw" className="rotate-90" />
                          </button>
                          <span className="text-[0.75vw] font-medium w-[1.5vw] text-center">{settings.media?.autoFlipSettings?.duration || 2 }s</span>
                          <button 
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => updateNestedSetting('media', 'autoFlipSettings', 'duration', (settings.media?.autoFlipSettings?.duration || 2) + 1)}
                          >
                            <ChevronRight size="0.8vw"/>
                          </button>
                      </div>
                    </div>
                    
                    <div className="space-y-[0.5vw]">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Add Forward / Backward Button :</span>
                        <Switch 
                          enabled={settings.media?.autoFlipSettings?.forwardBackwardButtons}
                          onChange={(val) => updateNestedSetting('media', 'autoFlipSettings', 'forwardBackwardButtons', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-medium text-gray-600">Next Flip Countdown :</span>
                        <Switch 
                          enabled={settings.media?.autoFlipSettings?.countdown}
                          onChange={(val) => updateNestedSetting('media', 'autoFlipSettings', 'countdown', val)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>

          <MenuItem 
            label="Background Audio" 
            enabled={settings.media?.backgroundAudio} 
            onChange={(val) => updateSection('media', 'backgroundAudio', val)} 
          />
        </div>

        {/* Share & Export Section */}
        <SectionHeader title="Share & Export" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Share" 
            enabled={settings.shareExport?.share} 
            onChange={(val) => updateSection('shareExport', 'share', val)} 
          />
          <MenuItem 
            label="Download" 
            enabled={settings.shareExport?.download} 
            onChange={(val) => updateSection('shareExport', 'download', val)} 
          />
          <MenuItem 
            label="Contact" 
            enabled={settings.shareExport?.contact} 
            onChange={(val) => updateSection('shareExport', 'contact', val)} 
          />
        </div>

        {/* Branding & Profile Section */}
        <SectionHeader title="Branding & Profile" />
        <div className="space-y-[0.625vw]">
          <MenuItem 
            label="Logo" 
            enabled={settings.brandingProfile?.logo} 
            onChange={(val) => updateSection('brandingProfile', 'logo', val)} 
          />
          <MenuItem 
            label="Profile" 
            enabled={settings.brandingProfile?.profile} 
            onChange={(val) => updateSection('brandingProfile', 'profile', val)} 
          />
        </div>
      </div>
    </div>
  );
};

export default MenuBar;
