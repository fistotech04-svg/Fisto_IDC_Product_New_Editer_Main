import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Trash2, Plus, ChevronDown, RefreshCw } from 'lucide-react';
import PremiumDropdown from './PremiumDropdown';
import AlertModal from '../AlertModal';
import { AdjustmentSlider, SectionLabel, ImageCropOverlay } from './AppearanceShared';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Branding = ({ type = 'logo', logoSettings, onUpdateLogo, profileSettings, onUpdateProfile, onBack }) => {
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showCropOverlay, setShowCropOverlay] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  // Load gallery images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('customized_editor_gallery');
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error("Failed to load gallery images", e);
      }
    }
  }, []);

  // Save gallery images to localStorage when updated
  useEffect(() => {
    if (uploadedImages.length > 0) {
      localStorage.setItem('customized_editor_gallery', JSON.stringify(uploadedImages));
    }
  }, [uploadedImages]);

  const [localGallerySelected, setLocalGallerySelected] = useState(null);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);

  // Profile draft state (top-level to comply with Rules of Hooks)
  const [draftName, setDraftName] = useState(profileSettings?.name || '');
  const [draftAbout, setDraftAbout] = useState(profileSettings?.about || '');

  // Logo Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLogo({ 
          ...logoSettings, 
          src: reader.result,
          opacity: logoSettings?.opacity ?? 100,
          adjustments: logoSettings?.adjustments ?? {
            exposure: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            highlights: 0,
            shadows: 0
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    onUpdateLogo({ ...logoSettings, url: e.target.value });
  };

  const handleLogoTypeChange = (e) => {
    onUpdateLogo({ ...logoSettings, type: e.target.value });
  };

  const confirmRemoveLogo = () => {
    setDeleteAlert(true);
  };

  const removeLogo = () => {
    onUpdateLogo({ ...logoSettings, src: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setDeleteAlert(false);
  };

  const handleAdjustmentChange = (key, value) => {
    onUpdateLogo({
      ...logoSettings,
      adjustments: {
        ...(logoSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  const resetAdjustment = (key) => {
    handleAdjustmentChange(key, 0);
  };

  const resetAllAdjustments = () => {
    onUpdateLogo({
      ...logoSettings,
      adjustments: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0
      }
    });
  };

  const handleModalFileUpload = (e) => {
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

  const handleAddContact = (type) => {
    const newContacts = [...(profileSettings?.contacts || []), { id: Date.now().toString(), type, value: '' }];
    onUpdateProfile({ ...profileSettings, contacts: newContacts });
    setShowSocialDropdown(false);
  };

  const handleRemoveContact = (id) => {
    const newContacts = (profileSettings?.contacts || []).filter(c => c.id !== id);
    onUpdateProfile({ ...profileSettings, contacts: newContacts });
  };

  const handleContactChange = (id, value) => {
    const newContacts = (profileSettings?.contacts || []).map(c => 
      c.id === id ? { ...c, value } : c
    );
    onUpdateProfile({ ...profileSettings, contacts: newContacts });
  };


  // Default Logo View
  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Sub-header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="lucide:gem" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1vw] font-semibold text-gray-900">Logo</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="pl-[1vw] pr-[1vw] pt-[1vw] flex flex-col gap-[1.25vw] overflow-y-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Upload your Logo Header */}
        <div className="flex items-center gap-[0.75vw]">
          <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Upload your Logo</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
        </div>

        {/* Image Type Selector */}
        <div className="flex items-center justify-between gap-[1vw]">
          <label className="text-[0.75vw] font-semibold text-gray-700">Select the Image type :</label>
          <PremiumDropdown 
            options={logoSettings?.src ? ['Fit', 'Fill', 'Stretch', 'Crop'] : ['Fit', 'Fill', 'Stretch']}
            value={logoSettings?.type || 'Fit'}
            onChange={(val) => {
              if (val === 'Crop') {
                setShowCropOverlay(true);
              } else {
                onUpdateLogo({ ...logoSettings, type: val });
              }
            }}
            width="6vw"
            align="right"
          />
        </div>

        {/* Split Upload / Drop Zone */}
        {logoSettings?.src ? (
          <div className="flex flex-col gap-[1.25vw]">
            {/* Current + Replace row */}
            <div className="flex items-start gap-[0.75vw]">
              {/* Current Logo */}
              <div className="flex flex-col items-center gap-[0.35vw]">
                <div className="relative w-[5vw] h-[5vw] p-[0.2vw] rounded-[0.5vw] overflow-hidden bg-white flex items-center justify-center group" style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}>
                  <img 
                    src={logoSettings.src} 
                    alt="Thumbnail" 
                    className={`w-90% h-90% rounded-[0.5vw] ${logoSettings?.cropData ? 'object-cover' : 'object-contain'}`} 
                    style={(() => {
                      const cd = logoSettings?.cropData;
                      return cd && cd.inset ? { 
                        clipPath: cd.inset, 
                        WebkitClipPath: cd.inset, 
                        transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`, 
                        transformOrigin: 'center center' 
                      } : {};
                    })()}
                  />
                  {/* Hover overlay with trash icon */}
                  <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-[0.2vw] cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); confirmRemoveLogo(); }}
                  >
                    <Icon icon="lucide:trash-2" className="w-[1.1vw] h-[1.1vw] text-white" />
                    <span className="text-[0.5vw] text-white font-semibold">Remove</span>
                  </div>
                </div>
                <span className="text-[0.6vw] font-semibold text-gray-400">Current</span>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center shrink-0 h-[5vw]">
                <Icon icon="qlementine-icons:replace-16" className="w-[1.1vw] h-[1.1vw] text-[#9ca3af]/100" />
              </div>

              {/* Replacement Upload Box */}
              <div className="flex flex-col items-center gap-[0.35vw] flex-1">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50/20'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50/20');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      handleFileChange({ target: { files: [file] } });
                    }
                  }}
                  className="flex-1 w-full h-[5.8vw] rounded-[0.75vw] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all bg-white py-[0.2vw]"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
                >
                  <p className="text-[0.65vw] font-medium text-gray-600 text-center mb-[0.25vw]">
                    Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span>
                  </p>
                  <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-[0.35vw]" />
                  <div className="flex flex-col items-center">
                    <span className="text-[0.55vw] font-semibold text-gray-500">Supported File</span>
                    <span className="text-[0.55vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                  </div>
                 </div>
                      {/* Spacer to match the height of 'Current' text for vertical symmetry */}
                      <span className="text-[0.6vw] opacity-0 pointer-events-none select-none">Spacer</span>
                    </div>
            </div>

            {/* Add URL Field */}
        <div className="flex flex-col gap-[0.5vw]">
          <label className="text-[0.75vw] font-semibold text-gray-700">Add URL :</label>
          <input
            type="text"
            placeholder="https://"
            value={logoSettings?.url || ''}
            onChange={handleUrlChange}
            className="w-full px-[1vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.75vw] focus:ring-[0.0625vw] focus:ring-blue-500 focus:outline-none text-gray-400 shadow-sm normal-case"
          />
        </div>

        <button 
              onClick={() => setShowGallery(true)}
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


            {/* Opacity Slider and Adjustments */}
            <div className="mb-[0vw]">
              <SectionLabel label="Opacity" />
              <div className="px-[0vw]">
                <AdjustmentSlider 
                  value={logoSettings?.opacity ?? 100} 
                  onChange={(val) => onUpdateLogo({ ...logoSettings, opacity: val })} 
                  onReset={() => onUpdateLogo({ ...logoSettings, opacity: 100 })}
                  min={0}
                  max={100}
                  unit="%"
                />
              </div>
            </div>

            {/* Adjustment Section */}
            <div className="space-y-[0.3vw]">
              <SectionLabel label="Adjustments" />
              <div className="space-y-[0.1vw] mt-[0.5vw]">
                <AdjustmentSlider 
                  label="Exposure" 
                  value={logoSettings?.adjustments?.exposure || 0} 
                  onChange={(val) => handleAdjustmentChange('exposure', val)} 
                  onReset={() => handleAdjustmentChange('exposure', 0)}
                />
                <AdjustmentSlider 
                  label="Contrast" 
                  value={logoSettings?.adjustments?.contrast || 0} 
                  onChange={(val) => handleAdjustmentChange('contrast', val)} 
                  onReset={() => handleAdjustmentChange('contrast', 0)}
                />
                <AdjustmentSlider 
                  label="Saturation" 
                  value={logoSettings?.adjustments?.saturation || 0} 
                  onChange={(val) => handleAdjustmentChange('saturation', val)} 
                  onReset={() => handleAdjustmentChange('saturation', 0)}
                />
                <AdjustmentSlider 
                  label="Temperature" 
                  value={logoSettings?.adjustments?.temperature || 0} 
                  onChange={(val) => handleAdjustmentChange('temperature', val)} 
                  onReset={() => handleAdjustmentChange('temperature', 0)}
                />
                <AdjustmentSlider 
                  label="Tint" 
                  value={logoSettings?.adjustments?.tint || 0} 
                  onChange={(val) => handleAdjustmentChange('tint', val)} 
                  onReset={() => handleAdjustmentChange('tint', 0)}
                />
                <AdjustmentSlider 
                  label="Highlights" 
                  value={logoSettings?.adjustments?.highlights || 0} 
                  onChange={(val) => handleAdjustmentChange('highlights', val)} 
                  onReset={() => handleAdjustmentChange('highlights', 0)}
                />
                <AdjustmentSlider 
                  label="Shadows" 
                  value={logoSettings?.adjustments?.shadows || 0} 
                  onChange={(val) => handleAdjustmentChange('shadows', val)} 
                  onReset={() => handleAdjustmentChange('shadows', 0)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-[1vw]">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-[14vw] h-[7vw] rounded-[1vw] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group bg-white py-[0.75vw]"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
              >
                <p className="text-[0.8vw] font-medium text-gray-600 text-center mb-[0.4vw]">
                  Drag & Drop or <span className="text-[#4F46E5] font-bold">Upload</span>
                </p>
                <Icon icon="lucide:upload" className="w-[1.5vw] h-[1.5vw] text-gray-400 mb-[0.5vw]" />
                <div className="flex flex-col items-center">
                  <span className="text-[0.65vw] font-semibold text-gray-500">Supported File</span>
                  <span className="text-[0.65vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
                </div>
              </div>
            </div>

            {/* Add URL Field */}
        <div className="flex flex-col gap-[0.5vw]">
          <label className="text-[0.75vw] font-semibold text-gray-700">Add URL :</label>
          <input
            type="text"
            placeholder="https://"
            value={logoSettings?.url || ''}
            onChange={handleUrlChange}
            className="w-full px-[1vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.75vw] focus:ring-[0.0625vw] focus:ring-blue-500 focus:outline-none text-gray-400 shadow-sm normal-case"
          />
        </div>
            
           <button 
              onClick={() => setShowGallery(true)}
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
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*" 
        />

      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h2 className="text-ms font-semibold text-gray-900">Image Gallery</h2>
            <button onClick={() => setShowGallery(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <Icon icon="lucide:x" className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="px-4 py-2">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-1">Upload your Logo</h3>
            <p className="text-[11px] text-gray-400 mb-4">
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
                  handleModalFileUpload({ target: { files: [file] } });
                }
              }}
              className="w-full h-[12vh] rounded-2xl flex flex-col items-center justify-center bg-white hover:bg-indigo-50  transition-all cursor-pointer group "
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%239ca3af' stroke-width='2' stroke-dasharray='6%2c4' stroke-linecap='square'/%3e%3c/svg%3e\")" }}
            >
              <p className="text-[0.9vw] text-gray-600 font-semibold mb-[0.5vw]">Drag & Drop or <span className="text-[#4F46E5] font-semibold">Upload</span></p>
              <Icon icon="lucide:upload" className="w-[1.2vw] h-[1.2vw] text-gray-400 mb-2" />
              <div className="flex flex-col items-center">
                <span className="text-[0.7vw] font-semibold text-gray-500">Supported File</span>
                <span className="text-[0.7vw] font-semibold text-gray-500">Image, Video, Audio, GIF, SVG</span>
              </div>
            </div>
            <input type="file" ref={galleryInputRef} onChange={handleModalFileUpload} accept="image/*" className="hidden" />
          </div>

          <div className="custom-scrollbar overflow-y-auto max-h-[250px] px-4 py-2 flex-1">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-1">Uploaded Logos</h3>
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {uploadedImages.map((img, index) => (
                  <div key={img.id || index} className="group cursor-pointer flex flex-col items-center" onClick={() => setLocalGallerySelected(img)}>
                    <div className={`aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${localGallerySelected?.url === img.url ? 'border-indigo-600 shadow-md scale-[1.02]' : 'hover:border-indigo-400 border-gray-100'}`}>
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No uploaded logos yet</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t flex justify-end gap-2 bg-white mt-auto">
            <button onClick={() => { setShowGallery(false); setLocalGallerySelected(null); }} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50">
              <Icon icon="lucide:x" className="w-4 h-4" /> Close
            </button>
            <button 
              onClick={() => { 
                if (localGallerySelected) {
                  onUpdateLogo({ ...logoSettings, src: localGallerySelected.url });
                  setShowGallery(false);
                  setLocalGallerySelected(null);
                }
              }} 
              disabled={!localGallerySelected}
              className={`flex-1 h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${localGallerySelected ? 'bg-black text-white hover:bg-zinc-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Icon icon="lucide:check" className="w-4 h-4" /> Place
            </button>
          </div>
        </div>
      )}

      {/* Crop Overlay */}
      {showCropOverlay && logoSettings?.src && (
        <ImageCropOverlay
          imageSrc={logoSettings.src}
          element={null}
          onSave={(cropData) => {
            onUpdateLogo({ ...logoSettings, cropData });
            setShowCropOverlay(false);
          }}
          onCancel={() => setShowCropOverlay(false)}
        />
      )}

      <AlertModal
        isOpen={deleteAlert}
        onClose={() => setDeleteAlert(false)}
        onConfirm={removeLogo}
        type="warning"
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        showCancel={true}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Branding;