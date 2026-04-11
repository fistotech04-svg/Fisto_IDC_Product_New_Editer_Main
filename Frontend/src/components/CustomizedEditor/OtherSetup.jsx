import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import PremiumDropdown from './PremiumDropdown';
import ColorPicker from './ColorPallet';
import axios from 'axios';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  ArrowRightLeft,
  MoreVertical,
  Replace,
  Upload,
  Trash2,
  X,
  Check,
  LayoutGrid,
  ArrowLeftRight,
  Edit2
} from 'lucide-react';
import NavIconStylesPopup, { NavIconRenderer } from './NavIconStylesPopup';
import { EffectControlRow, ImageCropOverlay } from './AppearanceShared';
import CoverPicturePopup from './CoverPicturePopup';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const DraggableSpan = ({ label, value, onChange, min = 0, max = 100, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);

  React.useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const dx = e.clientX - startXRef.current;
      const newVal = Math.max(min, Math.min(max, startValRef.current + Math.round(dx)));
      onChange(newVal);
    };
    const handleUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ew-resize';
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); document.body.style.cursor = ''; };
  }, [isDragging, onChange, min, max]);

  const onMouseDown = (e) => {
    e.preventDefault(); setIsDragging(true);
    startXRef.current = e.clientX; startValRef.current = Number(value);
  };

  return (
    <span className={`${className} cursor-ew-resize select-none`} onMouseDown={onMouseDown}>{label}</span>
  );
};

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


const RadioGroup = ({ options, value, onChange }) => (
  <div className="space-y-[0.75vw]">
    {options.map((opt) => (
      <label key={opt.id} className="text-[0.75vw] font-semibold text-gray-700">
        <div className="relative flex items-center justify-center">
          <input 
            type="radio" 
            name="radio-group"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="peer appearance-none w-[1vw] h-[1vw] border-2 border-gray-300 rounded-full checked:border-[#4A3AFF] transition-all bg-white"
          />
          <div className="absolute w-[0.3vw] h-[0.3vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
        </div>
        <span className={`text-[0.85vw] font-medium ${value === opt.id ? 'text-gray-900' : 'text-gray-500'}`}>{opt.label}</span>
      </label>
    ))}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] mb-[1vw] mt-[0.8vw]">
    <h4 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">{title}</h4>
    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.3vw' }}> </div>
  </div>
);

const ColorPickerItem = ({ label, color, opacity = 100, onChange, onOpacityChange }) => (
  <div className="flex items-center justify-between mb-[0.75vw] gap-[1vw]">
    <span className="text-[0.75vw] font-semibold text-gray-700">{label} :</span>
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
      <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-[0.4vw] px-[0.6vw] py-[0.2vw] h-[1.8vw] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <input 
          type="text"
          value={color && color.length > 1 ? color.toUpperCase() : '#'}
          onChange={(e) => onChange(e.target.value)}
          className="text-[0.75vw] font-medium text-gray-600 flex-1 bg-transparent outline-none uppercase w-full"
        />
        <div className="w-[1px] h-[70%] bg-gray-100 mx-[0.4vw] shrink-0"></div>
        <div className="text-[0.8vw] font-semibold text-gray-800 w-[2.5vw] text-right shrink-0">{opacity}%</div>
      </div>
    </div>
  </div>
);


const SettingRow = ({ label, children, className = "" }) => (
  <div className={`flex items-center justify-between mb-[0.8vw] gap-[0.5vw] ${className}`}>
    <span className="text-[0.75vw] pl-[0.5vw] font-medium text-gray-700 whitespace-nowrap">{label} :</span>
        {children}
      </div>
);

const AccordionItem = ({ title, isOpen, onToggle, children }) => (
  <div className={`bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] mb-[0.75vw] transition-all duration-300 relative ${isOpen ? 'z-50 ring-1 ring-gray-200' : 'z-0'}`}>
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] shadow-sm transition-all duration-300 ${
        isOpen ? 'bg-gray-50/50 rounded-t-[0.8vw] border-b-transparent' : 'bg-white rounded-[0.8vw]'
      }`}
    >
      <span className="text-[0.85vw] font-medium text-gray-800 whitespace-nowrap">{title}</span>
      <Icon 
        icon="lucide:chevron-down" 
        className={`w-[1.2vw] h-[1.2vw] text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
      />
    </button>
    <div 
      className={`transition-all duration-500 ${isOpen ? 'ease-out' : 'ease-in'} ${
        isOpen ? 'max-h-[150vw] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
      }`}
    >
      <div className="px-[1.25vw] pb-[1vw] pt-0 border-t border-gray-50 bg-gray-50/50 rounded-b-[0.8vw]">
        {children}
      </div>
    </div>
  </div>
);

const MAX_GALLERY_IMAGES = 12;

const OtherSetup = ({ onBack, settings, onUpdate, folderName, bookName, pages = [] }) => {
  const [openAccordion, setOpenAccordion] = useState('layout');
  const [bookAppearance, setBookAppearance] = useState({});

  React.useEffect(() => {
    const saved = localStorage.getItem('customized_editor_appearance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.appearance) setBookAppearance(parsed.appearance);
      } catch (e) {}
    }
  }, []);

  const isHardCoverEnabled = bookAppearance.hardCover || bookAppearance.makeFirstLastPageHard || bookAppearance.selectCustomHardPages;

  
  // Gallery Logic State
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [openContextMenu, setOpenContextMenu] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  // showGalleryPreview: triggers the inline gallery popup in preview (passed up via gallery.previewOpen)
  
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const bgSoundInputRef = useRef(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [localLibrarySelected, setLocalLibrarySelected] = useState(null);
  const galleryInputRef = useRef(null);
  const [libraryTargetIndex, setLibraryTargetIndex] = useState(null);
  const [showDotColorPicker, setShowDotColorPicker] = useState(false);
  const [dotPickerPos, setDotPickerPos] = useState({ x: 0, y: 0 });
  const [showNavColorPicker, setShowNavColorPicker] = useState(false);
  const [navPickerPos, setNavPickerPos] = useState({ x: 0, y: 0 });
  const [showNavStylesPopup, setShowNavStylesPopup] = useState(false);
  const [showCoverPopup, setShowCoverPopup] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropTargetIndex, setCropTargetIndex] = useState(null);
  const originalCoverRef = useRef(null);
  
  const updateNested = (section, field, value) => {
    onUpdate(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: typeof value === 'function' ? value(prev[section]?.[field]) : value
      }
    }));
  };

  const updateSectionField = (section, subSection, field, value) => {
    onUpdate(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: typeof value === 'function' ? value(prev[section][subSection]?.[field]) : value
        }
      }
    }));
  };

  // Safe access helper for nested settings
  const getNestedValue = (section, field, fallback = {}) => {
    return settings?.[section]?.[field] ?? fallback;
  };

  // Gallery Helpers
  const gallery = settings.gallery || {};
  const slideshowImages = gallery.images || [];

  // Visible count: show uploaded images + 1 next empty slot (max 12)
  const visibleSlotCount = Math.min(MAX_GALLERY_IMAGES, slideshowImages.length + 1);

  const updateGallery = (field, value) => {
      updateNested('gallery', field, value);
  };

  const uploadFile = async (file, replacingVideoId = null) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId);
    
    // Provide defaults for unsaved books
    formData.append('folderName', folderName || 'My Flipbooks');
    formData.append('flipbookName', bookName || 'Untitled Document');
    
    formData.append('type', 'image');
    formData.append('assetType', 'Image');
    formData.append('page_v_id', 'popup_gallery'); // Using a fixed ID for popup gallery
    
    if (replacingVideoId) {
        formData.append('replacing_file_v_id', replacingVideoId);
    }
    formData.append('file', file);

    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
        if (res.data.url) {
            const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${backendUrl}${res.data.url}`;
            return {
                url: fullUrl,
                file_v_id: res.data.file_v_id,
                name: res.data.filename
            };
        }
    } catch (err) {
        console.error("Slideshow image upload failed:", err);
    }
    return null;
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_GALLERY_IMAGES - slideshowImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    const optimisticImages = filesToUpload.filter(file => file.type.startsWith('image/')).map((file, idx) => ({
      id: Date.now() + idx + Math.random(), 
      url: URL.createObjectURL(file), 
      name: file.name,
      isUploading: true,
      file_orig: file
    }));

    if (optimisticImages.length === 0) return;

    // Add optimistic images
    updateGallery('images', current => [...(current || []), ...optimisticImages]);
    e.target.value = '';

    // Upload in Background and Update State
    for (const img of optimisticImages) {
        const uploadedData = await uploadFile(img.file_orig);
        
        updateGallery('images', current => 
            current.map(item => {
                if (item.id === img.id) {
                    if (uploadedData) {
                        return { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false };
                    }
                    return { ...item, isUploading: false };
                }
                return item;
            })
        );
    }
    updateGallery('previewOpen', Date.now());
  };

  const handleReplaceFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file || replaceTargetIndex === null) return;
      
      const targetImg = slideshowImages[replaceTargetIndex];
      if (!targetImg) return;

      // Optimistic update
      const optimisticUrl = URL.createObjectURL(file);
      updateGallery('images', current => {
          const updated = [...current];
          if (updated[replaceTargetIndex]) {
              updated[replaceTargetIndex] = { ...updated[replaceTargetIndex], url: optimisticUrl, isUploading: true };
          }
          return updated;
      });
      
      e.target.value = '';

      // Upload
      const uploadedData = await uploadFile(file, targetImg.file_v_id);
      
      // Final update
      updateGallery('images', current => 
          current.map((img, idx) => {
              if (idx === replaceTargetIndex) {
                  return uploadedData 
                      ? { ...img, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false }
                      : { ...img, isUploading: false };
              }
              return img;
          })
      );
      setReplaceTargetIndex(null);
  };

  const uploadAudioFile = async (file) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId);
    formData.append('folderName', folderName || 'My Flipbooks');
    formData.append('flipbookName', bookName || 'Untitled Document');
    formData.append('type', 'audio');
    formData.append('assetType', 'Audio');
    formData.append('page_v_id', 'background_audio'); 
    formData.append('file', file);

    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
        if (res.data.url) {
            const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${backendUrl}${res.data.url}`;
            return {
                url: fullUrl,
                file_v_id: res.data.file_v_id,
                name: res.data.filename
            };
        }
    } catch (err) {
        console.error("Audio upload failed:", err);
    }
    return null;
  };

  const handleBgSoundUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type.startsWith('audio/')) {
       updateNested('sound', 'isUploadingBg', true);
       const uploadedData = await uploadAudioFile(file);
       if (uploadedData) {
           onUpdate(prev => {
               const currentCustom = prev.sound?.customBgSounds || [];
               
               // Find the maximum number among existing custom sound labels to ensure sequential naming
               const usedNumbers = currentCustom.map(s => {
                   const match = s.label.match(/BG Sound (\d+)/);
                   return match ? parseInt(match[1]) : 0;
               });
               const maxNum = Math.max(0, 3, ...usedNumbers);
               const nextIdNumber = maxNum + 1;

               const newCustomSound = {
                   id: `BG Sound ${nextIdNumber}`,
                   label: `BG Sound ${nextIdNumber}`,
                   url: uploadedData.url,
                   name: uploadedData.name
               };
                return {
                    ...prev,
                    sound: {
                        ...(prev.sound || {}),
                        customBgSounds: [...currentCustom, newCustomSound],
                        bgSound: newCustomSound.id,
                        isUploadingBg: false
                    }
                };
            });
        } else {
           updateNested('sound', 'isUploadingBg', false);
        }
    }
    e.target.value = '';
  };

  const deleteImage = async (index) => {
    const img = slideshowImages[index];
    if (!img) return;

    // Optimistic remove
    updateGallery('images', current => (current || []).filter((_, idx) => idx !== index));
    setOpenContextMenu(null);

    // Backend delete
    if (img.file_v_id) {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                await axios.post(`${backendUrl}/api/flipbook/delete-asset`, {
                    emailId: user.emailId,
                    file_v_id: img.file_v_id,
                    assetType: 'Image',
                    folderName: folderName || 'My Flipbooks',
                    bookName: bookName || 'Untitled Document'
                });
            }
        } catch (error) {
            console.error("Failed to delete asset from backend:", error);
        }
    }
  };

  const handleDeleteCustomSound = (id) => {
    onUpdate(prev => {
        const currentCustom = prev.sound?.customBgSounds || [];
        const nextCustom = currentCustom.filter(s => s.id !== id);
        let nextSelected = prev.sound?.bgSound;
        if (nextSelected === id) {
            nextSelected = 'BG Sound 1'; // Fallback to default
        }
        return {
            ...prev,
            sound: {
                ...prev.sound,
                customBgSounds: nextCustom,
                bgSound: nextSelected
            }
        };
    });
  };

  const handleLibraryFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImageData = { id: Date.now(), url: event.target.result };
      setUploadedImages((prev) => [newImageData, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePlaceFromLibrary = () => {
    if (!localLibrarySelected) return;
    
    // If we have a specific target (from context menu)
    if (libraryTargetIndex !== null) {
      updateGallery('images', current => {
        const updated = [...(current || [])];
        if (updated[libraryTargetIndex]) {
          updated[libraryTargetIndex] = { ...updated[libraryTargetIndex], url: localLibrarySelected.url, name: localLibrarySelected.name || 'Library Image' };
        } else {
          // If the slot was empty, we need to push
          updated.push({ id: Date.now(), url: localLibrarySelected.url, name: localLibrarySelected.name || 'Library Image' });
        }
        return updated;
      });
    } else {
      // General "Add" - find first empty slot or push if not full
      if (slideshowImages.length < MAX_GALLERY_IMAGES) {
        updateGallery('images', current => [...(current || []), { id: Date.now(), url: localLibrarySelected.url, name: localLibrarySelected.name || 'Library Image' }]);
      }
    }
    
    setShowLibrary(false);
    setLocalLibrarySelected(null);
    setLibraryTargetIndex(null);
    updateGallery('previewOpen', Date.now());
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
          <Icon icon="lucide:settings" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1vw] font-semibold text-gray-900">Other Setup</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-[1.25vw] hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Layout Settings */}
        <AccordionItem 
          title="Layout Settings" 
          isOpen={openAccordion === 'layout'} 
          onToggle={() => setOpenAccordion(openAccordion === 'layout' ? null : 'layout')}
        >
          <div className="space-y-[0.5vw] ">
            <div>
              <SectionHeader title="Toolbar Display Mode" />
              <div className="space-y-[0.5vw]">
                <SettingRow label="Add Text Below Icons">
                  <Switch 
                    enabled={settings.toolbar?.addTextBelowIcons ?? false} 
                    onChange={(val) => updateNested('toolbar', 'addTextBelowIcons', val)} 
                  />
                </SettingRow>
              </div>
            </div>

            <div>
              <SectionHeader title="Text Properties" />
              <SettingRow label="Text style">
                <PremiumDropdown 
                  options={fontFamilies}
                  value={settings.toolbar?.textProperties?.font || 'Arial'}
                  onChange={(val) => updateSectionField('toolbar', 'textProperties', 'font', val)}
                  width="10vw"
                  className="shrink-0"
                  isFont={true}
                  buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                  align="right"
                />
              </SettingRow>
            </div>

          </div>
        </AccordionItem>



        {/* Sound Settings */}
        <AccordionItem
          title="Sound Settings"
          isOpen={openAccordion === 'sound'}
          onToggle={() => setOpenAccordion(openAccordion === 'sound' ? null : 'sound')}
        >
          <div className="space-y-[1.5vw] ">
            <div>
              <SectionHeader title="Flip Sound" />
              <div className="space-y-[1vw] pl-[1vw]">
                {[
                  { id: 'Hard Cover Flip', label: 'Classic Book Flip' },
                  { id: 'Soft Paper Flip', label: 'Soft cover page' },
                  { id: 'Classic Book Flip', label: 'Hard Cover Page' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (!settings.sound?.pageSpecificSound) {
                        updateNested('sound', 'flipSound', s.id);
                      }
                    }}
                    disabled={settings.sound?.pageSpecificSound}
                    className={`w-full flex items-center gap-[1.25vw] bg-transparent transition-all group ${settings.sound?.pageSpecificSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-full transition-all ${settings.sound?.flipSound === s.id
                        ? 'bg-[#4A3AFF] text-white shadow-md border-transparent'
                        : 'bg-white border-[1.5px] border-black text-white shadow-sm group-hover:border-[#4A3AFF]'
                      }`}>
                      <Icon icon={settings.sound?.flipSound === s.id ? 'icon-park:music-rhythm' : 'mdi:music'} className="w-[1.2vw] h-[1.2vw]" color={settings.sound?.flipSound === s.id ? 'white' : 'black'} />
                    </div>
                    <span className={`text-[0.75vw] font-semibold ${settings.sound?.flipSound === s.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-[1.25vw] pl-[0.2vw]">
                <div className="flex flex-col">
                  <span className="text-[0.75vw] font-semibold text-gray-700 leading-tight">Add specific sound effect for pages :</span>
                  {settings.sound?.pageSpecificSound && (
                    <span className="text-[0.65vw] text-[#4A3AFF] font-medium mt-[0.2vw]">
                      {isHardCoverEnabled ? 'Combination of both soft and hard cover music' : 'Soft cover page music only'}
                    </span>
                  )}
                </div>
                <Switch
                  enabled={settings.sound?.pageSpecificSound}
                  onChange={(val) => updateNested('sound', 'pageSpecificSound', val)}
                />
              </div>
            </div>

            <div>
              <SectionHeader title="Background Sound" />
              <input type="file" ref={bgSoundInputRef} onChange={handleBgSoundUpload} accept=".mp3, .wav, .m4a" className="hidden" />
                <div 
                  className={`rounded-[1.25vw] p-[0.4vw] flex flex-col items-center justify-center gap-[0.50vw] cursor-pointer hover:border-[#4A3AFF]/50 transition-all mb-[1.5vw] group/upload ${settings.sound?.bgSound?.startsWith('BG Sound') && parseInt(settings.sound.bgSound.split(' ')[2]) >= 4 ? 'border-[#4A3AFF] bg-[#4A3AFF]/5' : 'bg-transparent'}`}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='20' ry='20' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                  onClick={() => bgSoundInputRef.current?.click()}
                >
                  <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw]" />
                  
                  {settings.sound?.isUploadingBg ? (
                    <span className="text-[0.75vw] font-semibold text-gray-400 animate-pulse">Uploading...</span>
                  ) : (
                    <span className="text-[0.75vw] font-semibold text-[#9BA1A6]">Upload - MP3, WAV, M4A</span>
                  )}
                </div>
                <div className="space-y-[0.5vw]">
                   {[
                    { id: 'BG Sound 1', label: 'Bg Sound 1' },
                    { id: 'BG Sound 2', label: 'Bg Sound 2' },
                    { id: 'BG Sound 3', label: 'Bg Sound 3' },
                    ...(settings.sound?.customBgSounds || [])
                   ].map((s, sIdx) => (
                     <button 
                       key={s.id}
                       onClick={() => updateNested('sound', 'bgSound', s.id)}
                       className={`w-full flex items-center justify-between px-[0.9vw] py-[0.3vw] transition-all group ${
                         settings.sound?.bgSound === s.id 
                         ? 'bg-transparent' 
                         : 'bg-transparent '
                       }`}
                     >
                       <div className="flex items-center gap-[1.25vw] overflow-hidden truncate">
                        <div className={`w-[1.5vw] h-[1.5vw] flex items-center justify-center rounded-full transition-all shrink-0 ${
                          settings.sound?.bgSound === s.id ? 'bg-[#4A3AFF] text-white shadow-md border-transparent' : 'bg-white border-[1.5px] border-black text-black shadow-sm group-hover:border-[#4A3AFF]'
                        }`}>
                          <Icon icon={settings.sound?.bgSound === s.id ? 'icon-park:music-rhythm' : 'mdi:music'} className="w-[1.2vw] h-[1.2vw]" color={settings.sound?.bgSound === s.id ? 'white' : 'black'} />
                        </div>
                        <span className={`text-[0.75vw] font-semibold truncate ${
                          settings.sound?.bgSound === s.id ? 'text-gray-900' : 'text-gray-500'
                        }`}>{s.label}</span>
                       </div>

                       {sIdx > 2 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCustomSound(s.id); }}
                            className="opacity-0 group-hover:opacity-100 p-[0.2vw] text-gray-400 hover:text-red-500 transition-all shrink-0"
                            title="Delete Sound"
                          >
                            <Trash2 size="0.95vw" />
                          </button>
                       )}
                     </button>
                   ))}
                </div>
              </div>
          </div>
        </AccordionItem>

        {/* Gallery Option */}
        <AccordionItem 
          title={
            <div className="flex items-center justify-between w-full pr-[1vw]">
              <span>Gallery Option</span>
             
            </div>
          } 
          isOpen={openAccordion === 'gallery'} 
          onToggle={() => setOpenAccordion(openAccordion === 'gallery' ? null : 'gallery')}
        >
          <div className="space-y-[1.25vw] pt-[1vw]">
             
             {/* Top Controls: Mode & Fit */}
             <div className="flex items-center justify-between px-[0.5vw]">
                    <span className="text-[0.75vw] font-semibold text-gray-700">Image Fix Type</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
                {/* Fit Dropdown */}

                <div className="relative z-20">
                    <button 
                      onClick={() => setShowFitDropdown(!showFitDropdown)}
                      className="flex items-center justify-between gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-white border border-gray-100 rounded-[0.4vw] shadow-lg hover:border-gray-800 transition-all text-[0.75vw] font-medium text-gray-700 min-w-[5vw]"
                    >
                      <span>{gallery.imageFitType || 'Fill All'}</span>
                      <ChevronDown size="0.8vw" className={`text-gray-500 transition-transform ${showFitDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showFitDropdown && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setShowFitDropdown(false)} />
                        <div className="absolute right-0 top-full mt-[0.25vw] w-full min-w-[5vw] bg-white border border-gray-200 rounded-[0.4vw] shadow-xl z-[100] py-[0.25vw] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {['Fit All', 'Fill All'].map(type => (
                            <button 
                              key={type}
                              onClick={() => {
                                updateGallery('imageFitType', type);
                                setShowFitDropdown(false);
                              }}
                              className="w-full text-left px-[0.75vw] py-[0.5vw] text-[0.7vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                </div>
             </div>

             {/* Info Row */}
             <div className="flex items-center gap-[0.4vw]">
               <div className="relative">
                 <button
                   className="w-[1.1vw] h-[1.1vw] rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-[0.6vw] font-semibold hover:bg-gray-100 transition-colors"
                   onMouseEnter={() => setShowInfoTooltip(true)}
                   onMouseLeave={() => setShowInfoTooltip(false)}
                 >
                   i
                 </button>
                 {showInfoTooltip && (
                   <div className="absolute left-[1.5vw] top-0 bg-gray-800 text-white text-[0.65vw] px-[0.75vw] py-[0.4vw] rounded-[0.4vw] whitespace-nowrap z-50 shadow-lg">
                     You can add up to 12 images in Gallery
                   </div>
                 )}
               </div>
               <span className="text-[0.7vw] text-gray-500">You can add up to 12 images in Gallery *</span>
             </div>

             {/* Images Grid - 3×4 (4 cols, up to 3 rows = 12 images) */}
             {/* Shows uploaded images + 1 next empty slot up to MAX_GALLERY_IMAGES */}
             <div className="grid grid-cols-4 gap-[0.65vw] px-[0.125vw] ">
               {Array.from({ length: visibleSlotCount }).map((_, i) => (
                 <div key={i} className="relative group/slot">
                   <div 
                     className={`aspect-[1/1] w-full rounded-[0.3vw] cursor-pointer border-[0.1vw] transition-all duration-300 relative flex items-center justify-center group/card hover:scale-[1.05] hover:-translate-y-[0.25vw] hover:z-20 ${
                       activeSlideIndex === i 
                         ? 'border-gray-500 bg-gray-100 shadow-[0_0.65vw_1.25vw_-0.4vw_rgba(99,102,241,0.3)]' 
                         : (slideshowImages[i] ? 'border-gray-200 hover:border-gray-400 hover:shadow-[0_0.75vw_1.5vw_-0.5vw_rgba(0,0,0,0.15)]' : 'border-gray-400 hover:border-indigo-400 shadow-sm')
                     } ${!slideshowImages[i] ? 'bg-gray-50/50 border-dashed' : 'bg-white shadow-sm'}`}
                     onClick={() => {
                        setActiveSlideIndex(i);
                        if (slideshowImages[i] && !slideshowImages[i]?.isUploading) {
                          const current = gallery.imageFitType || 'Fill All';
                          updateGallery('imageFitType', current === 'Fit All' ? 'Fill All' : 'Fit All');
                        }
                      }}
                   >
                     {slideshowImages[i]?.isUploading ? (
                       <div className="flex flex-col items-center justify-center gap-[0.375vw] w-full h-full">
                         <div className="w-[1.2vw] h-[1.2vw] border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                       </div>
                     ) : slideshowImages[i] ? (
                       <img src={slideshowImages[i].url} className="w-full h-full rounded-[0.3vw] transition-all duration-300" style={{ objectFit: (gallery.imageFitType || 'Fill All') === 'Fill All' ? 'cover' : 'contain' }} alt="" />
                     ) : (
                       <div 
                         onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveSlideIndex(i); 
                            if(fileInputRef.current) fileInputRef.current.value = '';
                            fileInputRef.current?.click(); 
                         }}
                         className="flex flex-col items-center justify-center gap-[0.375vw] opacity-30 group-hover/card:opacity-70 transition-all duration-300 w-full h-full"
                       >
                         <Upload size="0.95vw" strokeWidth={1.5} className="text-gray-900" />
                         <span className="text-[0.6vw] font-semibold text-gray-900">Upload</span>
                       </div>
                     )}
    
                     {/* Actions Menu Trigger */}
                     <button 
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         setOpenContextMenu(openContextMenu === i ? null : i); 
                       }}
                       className={`absolute -top-[0.375vw] -right-[0.375vw] w-[1.75vw] h-[1.75vw] rounded-full bg-white shadow-[0_0.1vw_0.5vw_rgba(0,0,0,0.15)] border-[0.1vw] border-gray-200 flex items-center justify-center transition-all duration-200 z-30 ${
                         openContextMenu === i ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover/card:opacity-100 group-hover/card:scale-100'
                       } hover:bg-gray-50 active:scale-125`}
                     >
                       <MoreVertical size="0.7vw" className="text-gray-600" strokeWidth={2.5} />
                     </button>
                   </div>

                   {/* Context Menu */}
                   {openContextMenu === i && (
                     <>
                       <div className="fixed inset-0 z-[105]" onClick={() => setOpenContextMenu(null)} />
                       <div                           className={`absolute top-[40%] mt-[0.25vw] w-[7.5vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                            (i % 4) >= 2 ? 'right-0' : 'left-0'
                          }`}>
                         <button 
                           onClick={() => { 
                             if (slideshowImages[i]) {
                                setReplaceTargetIndex(i);
                                if(replaceInputRef.current) replaceInputRef.current.value = '';
                                replaceInputRef.current?.click();
                                setOpenContextMenu(null);
                             } else {
                                setActiveSlideIndex(i); 
                                if(fileInputRef.current) fileInputRef.current.value = '';
                                fileInputRef.current?.click(); 
                                setOpenContextMenu(null); 
                             }
                           }}
                           className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors flex items-center gap-[0.5vw]"
                         >
                           {slideshowImages[i] ? 'Replace Image' : 'Upload Image'}
                         </button>
                         <button 
                           onClick={() => { 
                              setLibraryTargetIndex(i);
                              setShowLibrary(true);
                              setOpenContextMenu(null);
                           }}
                           className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors flex items-center gap-[0.5vw]"
                         >
                             Image Gallery
                         </button>
                         {slideshowImages[i] && (
                           <button 
                             onClick={() => {
                               setCropTargetIndex(i);
                               setIsCropping(true);
                               setOpenContextMenu(null);
                             }}
                             className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-gray-700 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors flex items-center gap-[0.5vw]"
                           >
                             Crop Image
                           </button>
                         )}
                         {slideshowImages[i] && (
                           <button 
                             onClick={() => deleteImage(i)}
                             className="w-full px-[1vw] py-[0.65vw] text-[0.6vw] font-semibold text-red-500 hover:bg-red-50 text-left transition-colors flex items-center gap-[0.5vw]"
                           >
                             Delete Image
                           </button>
                         )}
                       </div>
                     </>
                   )}
                 </div>
               ))}
             </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg" className="hidden" />
              <input type="file" ref={replaceInputRef} onChange={handleReplaceFileChange} accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg" className="hidden" />
            
            {/* Library Access Button */}
              <button 
                onClick={() => setShowLibrary(true)}
                           className="relative w-full h-[3.5vw] bg-black rounded-[0.9vw] overflow-hidden group transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5"
                         >
                           {/* Background Images Overlay */}
                           <div className="absolute inset-0 flex gap-[0.5vw] opacity-20 group-hover:opacity-40 transition-opacity">
                             <div className="flex-1 bg-cover bg-center" 
                             style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=300&auto=format&fit=crop')" }}>
                             </div>
                             <div className="flex-1 bg-cover bg-center" 
                              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=300&auto=format&fit=crop')" }}>
                             </div>
                             <div className="flex-1 bg-cover bg-center" 
                                 style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=300&auto=format&fit=crop')" }}>
                             </div>
                           </div>
                           {/* Dark Gradient Overlay */}
                           <div className="absolute inset-0 bg-gradient-to-r from-gray/10 via-gray/20 to-gray/40 group-hover:via-gray/20 transition-all"></div>
                           
                           {/* Content */}
                           <div className="relative z-10 flex items-center gap-[0.75vw]">
                               <Icon icon="clarity:image-gallery-solid" className="w-[1vw] h-[1.2vw] text-white" />
                             <span className="text-[0.95vw] font-semibold text-white ">Image Gallery</span>
                           </div>
                         </button>
          
             {/* ── GALLERY CONTROLS ────────────────────────────────── */}
             <div className="space-y-[0.5vw]">
              {/* Slide Effect */}
              <div className="space-y-[0.75vw] ">
                <SectionHeader title="Slide Effect" />
                <div className="flex items-center justify-between px-[0.5vw]">
                  <span className="text-[0.75vw] font-medium text-gray-700">Select Slide Effects :</span>
                  <PremiumDropdown 
                    options={['Linear', 'Fade', 'Slide', 'Push', 'Flip', 'Reveal']}
                    value={gallery.transitionEffect || 'Linear'}
                    onChange={(val) => updateGallery('transitionEffect', val)}
                    width="7vw"
                    align="right"
                    buttonClassName="!border-gray-500 !rounded-[0.5vw]"
                  />
                </div>
              </div>

               {/* Navigation Controls */}
               <div className="space-y-[0.75vw]">
                 <SectionHeader title="Navigation Controls" />
                 
                 <div className="flex flex-col gap-[0.8vw] px-[0.5vw] mt-[0.5vw]">
                   {/* Manual Navigation Icon Row */}
                   <div className="flex items-center justify-between gap-[1vw]">
                     <div className="flex flex-col flex-1 gap-[0.6vw]">
                       <div className="flex items-center gap-[0.5vw]">
                         <span className="text-[0.75vw] font-medium text-gray-500">Manual Navigation Icon</span>
                         <div className="flex-1 border-b border-dashed border-gray-200" />
                       </div>
                       
                       <div className="flex items-center gap-[0.5vw]">
                         <div 
                           className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] cursor-pointer shadow-sm relative overflow-hidden transition-all hover:scale-105 active:scale-95 shrink-0" 
                           style={{ backgroundColor: settings.gallery?.navIconColor || '#000000' }}
                           onClick={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             setNavPickerPos({ x: rect.left + 40, y: rect.bottom - 40 });
                             setShowNavColorPicker(true);
                           }}
                         />
                         <div className="flex-1 flex items-center border border-gray-400 rounded-[0.4vw] px-[0.6vw] py-[0.15vw] bg-white justify-between shadow-sm h-[1.8vw]">
                             <span className="text-[0.8vw] text-gray-500 font-medium uppercase tracking-tight">{settings.gallery?.navIconColor || '#000000'}</span>
                             <span className="text-[0.8vw] text-gray-500 font-medium ml-[0.5vw]">100%</span>
                         </div>
                       </div>
                     </div>

                     {/* Icon Style Preview Card */}
                     <div 
                       className="w-[6vw] h-[4vw] bg-white shadow-sm border border-gray-100 rounded-[0.4vw] shadow-[0_0.2vw_1vw_rgba(0,0,0,0.04)] flex items-center justify-center gap-[0.6vw] relative group/nav shrink-0 cursor-pointer transition-all"
                       onClick={() => setShowNavStylesPopup(true)}
                     >
                        {/* Hover Overlay Button */}
                        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.8vw] h-[1.8vw] bg-white shadow-md rounded-[0.4vw] flex items-center justify-center scale-90 opacity-0 group-hover/nav:opacity-100 group-hover/nav:scale-100 transition-all duration-300">
                           <Icon icon="lucide:arrow-right-left" className="w-[1vw] h-[1vw] text-gray-700" />
                        </div>
                        
                        {/* Icon Content (Blurred on hover) */}
                        <div className="flex items-center justify-center gap-[0.6vw] w-full h-full transition-all duration-300 group-hover/nav:blur-[1px]">
                           <div className="flex items-center justify-center shrink-0 ">
                              {NavIconRenderer({ styleId: settings.gallery?.navStyle || 1, size: "2vw", color: "black" }).left}
                           </div>
                           <div className=" flex items-center justify-center  shrink-0">
                              {NavIconRenderer({ styleId: settings.gallery?.navStyle || 1, size: "2vw", color: "black" }).right}
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Auto Slide Mode Toggle */}
                   <div className="flex items-center justify-between mt-[0.5vw]">
                     <span className="text-[0.8vw] font-medium text-gray-600">Auto Slide Mode</span>
                     <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
                     <Switch enabled={gallery.autoSlide ?? true} onChange={(v) => updateGallery('autoSlide', v)} />
                   </div>

                   {/* Slide Duration Stepper - Conditional Visibility */}
                   {(gallery.autoSlide ?? true) && (
                    <div className="flex items-center justify-between mt-[0.3vw] animate-in fade-in slide-in-from-top-1 duration-200">
                      <span className="text-[0.75vw] pl-[0.5vw] font-medium text-gray-600">Slide Duration</span>
                      <div className="flex items-center gap-[0.4vw]">
                        <button 
                          onClick={() => updateGallery('speed', Math.max(1, (gallery.speed || 3) - 1))}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <ChevronLeft size="1.2vw" />
                        </button>
                        <div className="min-w-[3.5vw] py-[0.35vw] border border-gray-400 rounded-[0.4vw] flex items-center justify-center bg-white shadow-sm">
                          <span className="text-[0.85vw] font-medium text-gray-900">{(gallery.speed || 3)}s</span>
                        </div>
                        <button 
                          onClick={() => updateGallery('speed', Math.min(20, (gallery.speed || 3) + 1))}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <ChevronRight size="1.2vw" />
                        </button>
                      </div>
                    </div>
                   )}
                 </div>
               </div>

                {/* Other Controls */}
                <div className="space-y-[0.75vw]">
                  <SectionHeader title="Other Controls" />

                 <div className="flex items-center justify-between px-[0.5vw]">
                    <span className="text-[0.8vw] font-medium text-gray-600">Infinity Loop Mode</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]" />
                    <Switch enabled={gallery.infiniteLoop ?? true} onChange={(v) => updateGallery('infiniteLoop', v)} />
                 </div>

                 <div className="flex items-center justify-between px-[0.5vw]">
                    <span className="text-[0.8vw] font-medium text-gray-600 ">Pagination Dots</span>
                    <div className="flex-1 border-b border-dashed border-gray-200 mx-[0.75vw]  " />
                    <Switch enabled={gallery.showDots ?? true} onChange={(v) => updateGallery('showDots', v)} />
                 </div>

                 {(gallery.showDots ?? true) && (
                    <div className="flex items-center justify-between px-[0.5vw] mb-[1vw] animate-in slide-in-from-top-1 fade-in duration-200 mt-[0.5vw]">
                       <span className="text-[0.75vw] pl-[0.5vw] font-medium text-gray-600 mt-[0.5vw]">Pagination Dot Color</span>
                       
                       <div className="flex items-center gap-[0.4vw]  mt-[0.5vw]">
                          <div 
                             className="w-[1.6vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 overflow-hidden relative cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95" 
                             style={{ backgroundColor: settings.gallery?.dotColor || '#4F46E5' }}
                             onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDotPickerPos({ x: rect.left - 50, y: rect.bottom - 160 });
                                setShowDotColorPicker(true);
                             }}
                          />
                          <div className="flex items-center border border-gray-400 rounded-[0.3vw] px-[0.5vw] py-[0.74vw] bg-white min-w-[4.5vw] h-[1.6vw] justify-between shadow-sm">
                             <span className="text-[0.75vw] text-gray-500 font-medium uppercase">{settings.gallery?.dotColor || '#4F46E5'}</span>
                          </div>
                       </div>
                    </div>
                 )}
               </div>
             </div>

          </div>
        </AccordionItem>

        {/* Cover Picture Option */}
        <AccordionItem 
          title="Cover Picture" 
          isOpen={openAccordion === 'cover'} 
          onToggle={() => setOpenAccordion(openAccordion === 'cover' ? null : 'cover')}
        >
          <div className="space-y-[1.25vw] pb-[1vw]">
            <p className="text-[0.6vw] text-gray-400 font-sm max-w-[15vw] mb-[1vw] ">
              This image will appear as the cover of your flipbook<span className="text-red-500">*</span>
            </p>
            
            <div className="relative w-[15vw] h-[14vw] mx-auto rounded-[1.2vw] overflow-hidden bg-gray-100 flex items-center justify-center group shadow-md border border-gray-200">
                {settings.coverPicture?.url ? (
                    <img src={settings.coverPicture.url} className="w-full h-full object-cover" alt="Cover" />
                ) : settings.coverPicture?.type === 'template' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-[1vw] text-center" style={{ backgroundColor: settings.coverPicture.bgColor || '#D7D8E8' }}>
                         <h3 className="text-[0.8vw] font-bold mb-[0.2vw]" style={{ color: settings.coverPicture.shadowColor || '#000000' }}>{settings.coverPicture.text1 || 'Title'}</h3>
                         <p className="text-[0.6vw]" style={{ color: settings.coverPicture.shadowColor || '#000000', opacity: 0.8 }}>{settings.coverPicture.text2 || 'Supporting Text'}</p>
                    </div>
                ) : (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: ".assets/cover/cover1.png" }}></div>
                )}
                {/* Dark overlay for editing */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => {
                            originalCoverRef.current = settings.coverPicture;
                            setShowCoverPopup(true);
                        }}
                        className="flex items-center gap-[0.5vw] bg-white/30 backdrop-blur-sm border border-white/60 text-white px-[1.2vw] py-[0.6vw] rounded-[0.6vw] hover:bg-white/40 shadow-lg transition-colors"
                    >
                        <Edit2 size="0.9vw" />
                        <span className="text-[0.85vw] font-semibold">Edit Cover</span>
                    </button>
                </div>
            </div>

            <div className="pt-[0.5vw]">
                <div className="flex items-center mb-[0.5vw]">
                    <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Set Quality & Export type</span>
                    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                </div>
                <div className="flex items-center justify-between gap-[0.5vw]">
                    <div className="flex items-center gap-[0.5vw]">
                        <select className="border border-gray-300 rounded-[0.5vw] px-[0.5vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-800 outline-none hover:border-gray-400 focus:border-[#4A3AFF] transition-colors appearance-none bg-white">
                            <option>1080 px</option>
                            <option>720 px</option>
                        </select>
                        <select className="border border-gray-300 rounded-[0.5vw] px-[0.5vw] py-[0.5vw] text-[0.8vw] font-medium text-gray-800 outline-none hover:border-gray-400 focus:border-[#4A3AFF] transition-colors appearance-none bg-white">
                            <option>JPG</option>
                            <option>PNG</option>
                        </select>
                    </div>
                    <span className="text-gray-500 font-semibold">:</span>
                    <button className="flex items-center gap-[0.5vw] bg-black text-white px-[1vw] py-[0.5vw] rounded-[0.5vw] hover:bg-zinc-800 transition-colors shadow-md active:scale-95">
                        <Upload size="0.9vw" className="rotate-0" />
                        <span className="text-[0.85vw] font-medium">Download</span>
                    </button>
                </div>
            </div>
          </div>
        </AccordionItem>

        {/* Image Library Pop-up (Library of uploaded images) */}
         {showLibrary && (
           <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[0.8vw] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
                 style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
             <div className="flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-100">
               <h2 className="text-[1vw] font-semibold text-gray-900">Image Gallery</h2>
               <button onClick={() => setShowLibrary(false)} className="w-[1.8vw] h-[1.8vw] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-[1.2vw] h-[1.2vw] text-gray-400" />
               </button>
             </div>

             <div className="px-[1vw] py-[0.5vw]">
               <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.2vw]">Upload your Image</h3>
               <p className="text-[0.7vw] text-gray-400 mb-[1vw]">
                 <span>You Can Reuse The File Which Is Uploaded In Gallery</span>
                 <span className="text-red-500">*</span>
               </p>
               <div
                 onClick={() => galleryInputRef.current?.click()}
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={(e) => {
                   e.preventDefault();
                   const file = e.dataTransfer.files[0];
                   if (file && file.type.startsWith('image/')) {
                     handleLibraryFileUpload({ target: { files: [file] } });
                   }
                 }}
                 className="w-full h-[12vh] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-indigo-50 transition-all cursor-pointer group" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                             >
                               <p className="text-[0.9vw] text-gray-600 font-semibold mb-[0.5vw]">Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span></p>
                                             <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-2" />
                                             <div className="flex flex-col items-center">
                                               <span className="text-[0.7vw] font-semibold text-gray-500">Supported File</span>
                                               <span className="text-[0.7vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                                             </div>
                             </div>
               <input type="file" ref={galleryInputRef} onChange={handleLibraryFileUpload} accept="image/*" className="hidden" />
             </div>

             <div 
                className="hide-scrollbar overflow-y-auto px-[1vw] py-[0.5vw] flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
               <h3 className="text-[0.85vw] font-semibold text-gray-900 mb-[0.5vw]">Uploaded Images</h3>
               {uploadedImages.length > 0 ? (
                 <div className="grid grid-cols-3 gap-[0.5vw]">
                   {uploadedImages.map((img, index) => (
                     <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalLibrarySelected(img)}>
                       <div className={`aspect-square w-full rounded-[0.5vw] overflow-hidden border-[0.15vw] transition-all ${localLibrarySelected?.url === img.url ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                         <img src={img.url} className="w-full h-full object-cover" alt="" />
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-[2vw] text-gray-400">
                   <p className="text-[0.8vw]">No uploaded images yet</p>
                 </div>
               )}
             </div>

             <div className="p-[0.75vw] border-t flex justify-end gap-[0.5vw] bg-white mt-auto">
               <button 
                 onClick={() => { setShowLibrary(false); setLocalLibrarySelected(null); }} 
                 className="flex-1 h-[2vw] border border-gray-300 rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] hover:bg-gray-50"
               >
                 <X size="0.9vw" /> Close
               </button>
               <button
                 onClick={handlePlaceFromLibrary}
                 disabled={!localLibrarySelected}
                 className={`flex-1 h-[2vw] rounded-[0.5vw] text-[0.7vw] font-semibold flex items-center justify-center gap-[0.3vw] transition-all ${localLibrarySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
               >
                 <Check size="0.9vw" /> Place
               </button>
             </div>
           </div>
        )}

        {showDotColorPicker && (
          <ColorPicker 
            color={settings.gallery?.dotColor || '#4F46E5'}
            onChange={(color) => updateGallery('dotColor', color)}
            onClose={() => setShowDotColorPicker(false)}
            style={{ position: 'fixed', top: dotPickerPos.y, left: dotPickerPos.x, zIndex: 1100 }}
            opacity={100}
            onOpacityChange={() => {}}
          />
        )}

        {showNavColorPicker && (
          <ColorPicker 
            color={settings.gallery?.navIconColor || '#000000'}
            onChange={(color) => updateGallery('navIconColor', color)}
            onClose={() => setShowNavColorPicker(false)}
            style={{ position: 'fixed', top: navPickerPos.y, left: navPickerPos.x, zIndex: 1100 }}
            opacity={100}
            onOpacityChange={() => {}}
          />
        )}

        {showNavStylesPopup && (
          <NavIconStylesPopup 
            currentStyle={settings.gallery?.navStyle || 1}
            onClose={() => setShowNavStylesPopup(false)}
            onSelect={(styleId) => updateGallery('navStyle', styleId)}
          />
        )}

        {showCoverPopup && (
          <CoverPicturePopup
             settings={settings}
             pages={pages}
             onClose={() => {
                 // Restore original background picture if cancelled
                 if (originalCoverRef.current) {
                     onUpdate(prev => ({
                         ...prev,
                         coverPicture: originalCoverRef.current
                     }));
                 }
                 setShowCoverPopup(false);
             }}
             onPreview={(previewData) => {
                 onUpdate(prev => ({
                     ...prev,
                     coverPicture: {
                         ...prev.coverPicture,
                         ...previewData
                     }
                 }));
             }}
             onSave={async (coverData) => {
                 let finalUrl = coverData.url;
                 
                 // If it's an uploaded image, we must upload it to the server to get a perent URL
                 if (coverData.type === 'upload' && coverData.rawFile) {
                     try {
                         const uploaded = await uploadFile(coverData.rawFile);
                         if (uploaded && uploaded.url) {
                             finalUrl = uploaded.url;
                             // Also update the local storage cache immediately for the dashboard
                             if (bookName && folderName) {
                               localStorage.setItem(`book_thumb_${folderName}_${bookName}`, finalUrl);
                               localStorage.setItem(`book_thumb_${bookName}`, finalUrl);
                             } else if (bookName) {
                               localStorage.setItem(`book_thumb_${bookName}`, finalUrl);
                             }
                         }
                     } catch (err) {
                         console.error("Failed to upload cover picture", err);
                     }
                 } else if (coverData.type === 'template' && finalUrl) {
                     // Also persist template URLs to local storage for the dashboard
                     if (bookName && folderName) {
                       localStorage.setItem(`book_thumb_${folderName}_${bookName}`, finalUrl);
                       localStorage.setItem(`book_thumb_${bookName}`, finalUrl);
                     } else if (bookName) {
                       localStorage.setItem(`book_thumb_${bookName}`, finalUrl);
                     }
                 }

                 onUpdate(prev => ({
                     ...prev,
                     coverPicture: {
                       ...coverData,
                       url: finalUrl,
                       rawFile: null // Clear file object from state
                     }
                 }));
                 setShowCoverPopup(false);
             }}
          />
        )}
        {isCropping && cropTargetIndex !== null && (
          <ImageCropOverlay 
              imageSrc={slideshowImages[cropTargetIndex].url}
              onSave={async ({ crop }) => {
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  img.onload = async () => {
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const sw = (crop.width / 100) * img.naturalWidth;
                      const sh = (crop.height / 100) * img.naturalHeight;
                      const sx = (crop.left / 100) * img.naturalWidth;
                      const sy = (crop.top / 100) * img.naturalHeight;
                      canvas.width = sw;
                      canvas.height = sh;
                      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                      const croppedSrc = canvas.toDataURL('image/png');
                      
                      // Optimistic update
                      updateGallery('images', current => {
                          const updated = [...current];
                          updated[cropTargetIndex] = { ...updated[cropTargetIndex], url: croppedSrc, isUploading: true };
                          return updated;
                      });
                      
                      // Convert to blob and upload
                      canvas.toBlob(async (blob) => {
                          const file = new File([blob], `cropped_${Date.now()}.png`, { type: 'image/png' });
                          const uploadedData = await uploadFile(file, slideshowImages[cropTargetIndex].file_v_id);
                          
                          updateGallery('images', current => 
                              current.map((item, idx) => {
                                  if (idx === cropTargetIndex) {
                                      return uploadedData 
                                          ? { ...item, url: uploadedData.url, file_v_id: uploadedData.file_v_id, name: uploadedData.name, isUploading: false }
                                          : { ...item, isUploading: false };
                                  }
                                  return item;
                              })
                          );
                      }, 'image/png');
                      
                      setIsCropping(false);
                      setCropTargetIndex(null);
                  };
                  img.src = slideshowImages[cropTargetIndex].url;
              }}
              onCancel={() => {
                  setIsCropping(false);
                  setCropTargetIndex(null);
              }}
          />
        )}
      </div>
    </div>
  );
};

export default OtherSetup;
