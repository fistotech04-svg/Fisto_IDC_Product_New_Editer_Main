import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { checkIsAnimatedWebp } from './editorUtils';
import { resolveUploadsPath } from '../../utils/supabaseUtils';

const MediaGalleryPopup = ({ isOpen, onClose, anchorRef, onFileSelect, initialGalleryType, imageOnly = false }) => {
  const [galleryType, setGalleryType] = useState(() => {
    return initialGalleryType || (imageOnly ? 'Image Gallery' : 'All');
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeGalleryDropdown, setActiveGalleryDropdown] = useState(null);
  const [itemToReplaceId, setItemToReplaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputRefReplaceItem = useRef(null);
  const dropdownRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (initialGalleryType) {
      setGalleryType(initialGalleryType);
    } else if (imageOnly) {
      setGalleryType('Image Gallery');
    }
  }, [initialGalleryType, imageOnly, isOpen]);

  // Fetch gallery assets from backend whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchGalleryAssets = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      setIsLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
          params: { emailId: user.emailId }
        });

        if (res.data.assets) {
          const formatted = res.data.assets.map((asset) => {
            const fullUrl = resolveUploadsPath(asset.url);
            const isVideo = asset.type === 'video';
            const isAnimated = asset.type === 'gif' || (asset.url && asset.url.toLowerCase().endsWith('.gif'));
            return {
              id: asset.id || asset.name,
              name: (asset.name || 'Asset').replace(/\.[^/.]+$/, ''),
              url: fullUrl,
              rawUrl: asset.url,
              type: isVideo ? 'video' : 'image',
              isAnimated,
              uploadedAt: asset.uploadedAt
            };
          });
          setGalleryAssets(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch gallery assets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryAssets();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    const handlePopupClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        if (anchorRef && anchorRef.current && anchorRef.current.contains(event.target)) {
          return;
        }
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePopupClickOutside);
    }
    return () => document.removeEventListener('mousedown', handlePopupClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const filteredAssets = React.useMemo(() => {
    return galleryAssets.filter(asset => {
      if (galleryType === 'All') return true;
      if (galleryType === 'Image Gallery' && asset.type === 'image' && !asset.isAnimated) return true;
      if (galleryType === 'Video Gallery' && asset.type === 'video') return true;
      if (galleryType === 'GIF Gallery' && asset.isAnimated) return true;
      return false;
    });
  }, [galleryAssets, galleryType]);

  if (!isOpen) return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files?.length) {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const newAssetsPromises = Array.from(e.target.files).map(async newFile => {
        const objectUrl = URL.createObjectURL(newFile);
        const isVideo = newFile.type.startsWith('video/');
        let isAnimated = false;
        if (newFile.type.includes('gif')) {
          isAnimated = true;
        } else if (newFile.type.includes('webp')) {
          isAnimated = await checkIsAnimatedWebp(newFile);
        }

        const tempAsset = {
          id: objectUrl,
          name: newFile.name.replace(/\.[^/.]+$/, ''),
          url: objectUrl,
          type: isVideo ? 'video' : 'image',
          isAnimated,
          file: newFile
        };

        const userEmail = user ? (user.emailId || user.email) : 'guest@fisto.tech';
        if (userEmail) {
          try {
            const formData = new FormData();
            formData.append('emailId', userEmail);
            if (imageOnly) {
              formData.append('assetType', 'gallery_image');
              formData.append('folderName', 'My_Flipbooks');
              formData.append('flipbookName', 'Untitled Document');
              formData.append('file', newFile);
              const res = await axios.post(`${backendUrl}/api/flipbook/upload-customized-asset`, formData);
              if (res.data.url) {
                return {
                  ...tempAsset,
                  id: res.data.fileName || objectUrl,
                  url: res.data.url,
                  rawUrl: res.data.url,
                  file_v_id: res.data.fileName
                };
              }
            } else {
              formData.append('isGallery', 'true');
              formData.append('type', isVideo ? 'video' : isAnimated ? 'gif' : 'image');
              formData.append('file', newFile);
              formData.append('page_v_id', 'global');

              const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
              if (res.data.url) {
                const serverUrl = resolveUploadsPath(res.data.url);
                return {
                  ...tempAsset,
                  id: res.data.file_v_id || objectUrl,
                  url: serverUrl,
                  rawUrl: res.data.url,
                  file_v_id: res.data.file_v_id
                };
              }
            }
          } catch (err) {
            console.error('Failed to upload global asset:', err);
          }
        }
        return tempAsset;
      });

      const newAssets = await Promise.all(newAssetsPromises);
      setGalleryAssets(prev => [...newAssets, ...prev]);
    }
  };

  const handleReplaceFileChange = async (e) => {
    if (e.target.files?.length && itemToReplaceId) {
      const newFile = e.target.files[0];
      const newUrl = URL.createObjectURL(newFile);
      const isVideo = newFile.type.startsWith('video/');
      let isAnimated = false;
      if (newFile.type.includes('gif')) {
        isAnimated = true;
      } else if (newFile.type.includes('webp')) {
        isAnimated = await checkIsAnimatedWebp(newFile);
      }

      const existingAsset = galleryAssets.find(g => g.id === itemToReplaceId);

      let updatedAsset = {
        id: newUrl,
        name: newFile.name.replace(/\.[^/.]+$/, ''),
        url: newUrl,
        type: isVideo ? 'video' : 'image',
        isAnimated,
        file: newFile
      };

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('emailId', user.emailId);
        formData.append('isGallery', 'true');
        formData.append('type', isVideo ? 'video' : isAnimated ? 'gif' : 'image');
        formData.append('file', newFile);
        formData.append('page_v_id', 'global');
        if (existingAsset?.rawUrl || existingAsset?.url) {
          formData.append('replacing_file_url', existingAsset.rawUrl || existingAsset.url);
        }

        try {
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          if (res.data.url) {
            const serverUrl = resolveUploadsPath(res.data.url);
            updatedAsset = {
              ...updatedAsset,
              id: res.data.file_v_id || newUrl,
              url: serverUrl,
              rawUrl: res.data.url,
              file_v_id: res.data.file_v_id
            };
          }
        } catch (err) {
          console.error('Failed to replace global gallery asset:', err);
        }
      }
      
      setGalleryAssets(prev => prev.map(g => g.id === itemToReplaceId ? updatedAsset : g));

      if (selectedAsset?.id === itemToReplaceId) {
        setSelectedAsset(updatedAsset);
      }
      setItemToReplaceId(null);
    }
  };

  const handleAddAssetToPage = async () => {
    if (!selectedAsset || !onFileSelect) return;

    if (selectedAsset.file) {
      onFileSelect(selectedAsset.file);
      onClose();
    } else {
      try {
        const response = await fetch(selectedAsset.url);
        const blob = await response.blob();
        const mimeType = blob.type || (selectedAsset.type === 'video' ? 'video/mp4' : 'image/png');
        const ext = mimeType.split('/')[1] || 'png';
        const file = new File([blob], `${selectedAsset.name}.${ext}`, { type: mimeType });
        onFileSelect(file);
        onClose();
      } catch (err) {
        console.error('Error fetching file for page insert:', err);
        onClose();
      }
    }
  };

  let popupStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100000,
  };

  if (anchorRef && anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    popupStyle = {
      position: 'fixed',
      top: `${rect.top + rect.height / 2}px`,
      left: `${rect.left + 60}px`,
      transform: 'translate(-100%, -50%)',
      zIndex: 100000,
    };
  }

  const galleryOptions = imageOnly ? ['Image Gallery'] : ['All', 'Image Gallery', 'Video Gallery', 'GIF Gallery'];

  return createPortal(
    <>
    {!anchorRef && (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[99999]"
        onClick={onClose}
      />
    )}
    <div 
      ref={popupRef}
      style={popupStyle} 
      className="bg-white rounded-[0.8vw] w-[24vw] min-w-[320px] max-w-[90vw] shadow-2xl border border-gray-300 flex flex-col font-sans relative z-[100000]" 
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAsset(null);
        setActiveGalleryDropdown(null);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-[1.5vw] pb-[1vw]">
        <h2 className="text-[0.9vw] font-bold text-gray-900 mr-[1vw]">
          {imageOnly ? 'Image Gallery' : 'Media Gallery'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
        </button>
      </div>

      {/* Content area */}
      <div className="px-[1.5vw] pb-[1.5vw] pt-0 h-[19vw] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-[1vw] pb-[1vw] px-[1.5vw] -mx-[1.5vw] border-b border-gray-100 shrink-0">
            {/* Dropdown */}
            <div className="relative inline-block cursor-pointer" ref={dropdownRef}>
              <div 
                className="flex items-center justify-between gap-[0.3vw] w-[7vw] bg-white border border-gray-200 rounded-[0.4vw] px-[0.55vw] py-[0.3vw] shadow-sm hover:bg-gray-50 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="text-[0.7vw] font-medium text-gray-700 truncate">{galleryType}</span>
                <Icon icon="lucide:chevron-down" className="w-[0.75vw] h-[0.75vw] text-gray-500 shrink-0" />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-[0.2vw] w-full bg-white border border-gray-200 rounded-[0.4vw] shadow-lg z-50 overflow-hidden">
                  {galleryOptions.map(option => (
                    <div 
                      key={option}
                      className={`px-[0.55vw] py-[0.45vw] text-[0.7vw] font-medium cursor-pointer transition-colors ${galleryType === option ? 'bg-[#F3F4F6] text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => {
                        setGalleryType(option);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Files Button */}
            <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.15vw] shadow-sm transition-colors cursor-pointer inline-block">
              <div 
                className="flex items-center justify-center gap-[0.45vw] cursor-pointer text-white px-[0.7vw] py-[0.2vw] rounded-[0.3vw] border-[1.5px] border-dashed border-white/60 hover:border-white transition-colors"
                onClick={handleUploadClick}
              >
                <Icon icon="lucide:upload" className="w-[0.75vw] h-[0.75vw] stroke-[2]" />
                <span className="text-[0.7vw] font-medium">Browse Files</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,image/svg+xml,video/x-matroska,image/gif" multiple onChange={handleFileChange} onClick={(e) => { e.target.value = null; }} />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pr-[0.5vw] will-change-scroll" onClick={() => { setSelectedAsset(null); setActiveGalleryDropdown(null); }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-[0.8vw]">
                Loading media...
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-[1vw]">
                {filteredAssets.length > 0 ? filteredAssets.map((item, idx) => (
                  <div key={item.id || idx} className="flex flex-col gap-[0.4vw] relative">
                    <div 
                      className={`group cursor-pointer w-full aspect-square rounded-[0.4vw] overflow-hidden bg-gray-100 relative shadow-sm ${selectedAsset?.id === item.id ? 'border-[0.15vw] border-[#4D47FF]' : 'border border-gray-200 group-hover:shadow-md'}`}
                      onClick={(e) => { e.stopPropagation(); selectedAsset?.id === item.id ? setSelectedAsset(null) : setSelectedAsset(item); setActiveGalleryDropdown(null); }}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <img src={item.url} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover pointer-events-none" />
                      )}
                      <div className={`absolute inset-0 bg-black/0 ${selectedAsset?.id === item.id ? '' : 'group-hover:bg-black/5'}`} />

                      {/* Hover Three Dots */}
                      <div 
                        className={`absolute top-[0.3vw] right-[0.3vw] bg-white/90 rounded-[0.2vw] p-[0.2vw] shadow-sm hover:bg-white z-10 ${activeGalleryDropdown === item.id ? 'block' : 'hidden group-hover:block'}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveGalleryDropdown(activeGalleryDropdown === item.id ? null : item.id); 
                        }}
                      >
                        <Icon icon="lucide:more-vertical" className="w-[0.9vw] h-[0.9vw] text-gray-700" />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {activeGalleryDropdown === item.id && (
                      <div className={`absolute top-[1.5vw] ${idx % 4 < 2 ? 'left-0' : 'right-0'} bg-white rounded-[0.3vw] shadow-lg border border-gray-200 py-[0.2vw] w-[6.5vw] z-20 flex flex-col overflow-hidden`}>
                        <button 
                          className="text-[0.7vw] font-medium text-gray-700 hover:bg-gray-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToReplaceId(item.id);
                            fileInputRefReplaceItem.current?.click();
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Replace {item.type === 'video' ? 'Video' : item.isAnimated ? 'Gif' : 'Image'}
                        </button>
                        <button 
                          className="text-[0.7vw] font-medium text-red-600 hover:bg-red-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const storedUser = localStorage.getItem('user');
                            if (storedUser) {
                              const user = JSON.parse(storedUser);
                              const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                              try {
                                await axios.post(`${backendUrl}/api/flipbook/delete-gallery-asset`, {
                                  emailId: user.emailId,
                                  url: item.rawUrl || item.url,
                                  fileName: item.id || item.name,
                                  file_v_id: item.file_v_id
                                });
                              } catch (err) {
                                console.error('Failed to delete global asset:', err);
                              }
                            }
                            setGalleryAssets(prev => prev.filter(g => g.id !== item.id));
                            if (selectedAsset?.id === item.id) {
                              setSelectedAsset(null);
                            }
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    
                    <span className="text-center text-[0.7vw] font-medium text-gray-500 truncate w-full px-[0.2vw]">{item.name}</span>
                  </div>
                )) : (
                  <div className="col-span-4 flex items-center justify-center text-center text-gray-400 py-[2vw] text-[0.8vw]">
                    No media found. Click "Browse Files" to add.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-[0.75vw] p-[1.5vw] border-t border-gray-100">
        <button 
          onClick={onClose}
          className="flex-1 py-[0.5vw] rounded-[0.3vw] border border-gray-200 text-gray-700 text-[0.8vw] font-medium hover:bg-gray-50 flex items-center justify-center gap-[0.5vw]"
        >
          <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" /> Cancel
        </button>
        <button 
          className={`flex-1 py-[0.5vw] rounded-[0.3vw] text-white text-[0.8vw] font-medium transition-colors ${selectedAsset ? 'bg-black hover:bg-gray-800' : 'bg-[#B1B1B1] cursor-not-allowed'}`}
          onClick={handleAddAssetToPage}
          disabled={!selectedAsset}
        >
          Add To Page
        </button>
      </div>
    </div>
    {/* Hidden input for replace action */}
    <input 
      type="file" 
      ref={fileInputRefReplaceItem} 
      className="hidden" 
      accept="image/jpeg,image/png,image/webp,video/mp4,image/svg+xml,video/x-matroska,image/gif" 
      onChange={handleReplaceFileChange} 
      onClick={(e) => { e.target.value = null; }} 
    />
    </>,
    document.body
  );
};

export default MediaGalleryPopup;
