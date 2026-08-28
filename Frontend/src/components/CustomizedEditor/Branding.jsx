import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Trash2, Plus, ChevronDown, RefreshCw, Upload, Image as ImageIcon, ChevronRight, ArrowLeftRight, Link } from 'lucide-react';
import axios from 'axios';
import PremiumDropdown from './PremiumDropdown';
import AlertModal from '../AlertModal';
import { AdjustmentSlider, SectionLabel, ImageCropOverlay, CustomColorPicker } from './AppearanceShared';
import ReplaceMediaModal from '../TemplateEditor/ReplaceMediaModal';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Branding = ({
  type = 'logo',
  logoSettings,
  onUpdateLogo,
  watermarkSettings,
  onUpdateWatermark,
  preloaderSettings,
  onUpdatePreloader,
  onBack,
  onPreviewPreloader,
  folder,
  flipbookName,
  v_id
}) => {
  const fileInputRef = useRef(null);
  const watermarkFileInputRef = useRef(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const [showPreloaderBgColorPicker, setShowPreloaderBgColorPicker] = useState(false);
  const [showPreloaderTextColorPicker, setShowPreloaderTextColorPicker] = useState(false);
  const [showPreloaderSpinnerColorPicker, setShowPreloaderSpinnerColorPicker] = useState(false);
  const galleryInputRef = useRef(null);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null); // 'logo', 'watermark', or null
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showWatermarkUrlInput, setShowWatermarkUrlInput] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showCropOverlay, setShowCropOverlay] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replaceTarget, setReplaceTarget] = useState(null); // 'logo' | 'watermark' | null
  const [showLogoAdjustments, setShowLogoAdjustments] = useState(false);
  const [showWatermarkAdjustments, setShowWatermarkAdjustments] = useState(false);
  const [showPreloaderModal, setShowPreloaderModal] = useState(false);
  const [tempPreloaderSettings, setTempPreloaderSettings] = useState({});

  const handleOpenPreloaderModal = () => {
    setTempPreloaderSettings(preloaderSettings || {});
    setShowPreloaderModal(true);
  };



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
      try {
        localStorage.setItem('customized_editor_gallery', JSON.stringify(uploadedImages));
      } catch (e) {
        console.warn("localStorage quota exceeded for branding gallery images", e);
      }
    }
  }, [uploadedImages]);

  const [localGallerySelected, setLocalGallerySelected] = useState(null);

  const [logoResolution, setLogoResolution] = useState('');
  const [logoFileSize, setLogoFileSize] = useState('');
  const [watermarkResolution, setWatermarkResolution] = useState('');
  const [watermarkFileSize, setWatermarkFileSize] = useState('');

  const formatBytes = (bytes, decimals = 1) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (!logoSettings?.src) {
      setLogoResolution('');
      setLogoFileSize('');
      return;
    }
    const img = new Image();
    img.src = logoSettings.src;
    img.onload = () => {
      setLogoResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    if (logoSettings.src.startsWith('data:')) {
      const base64str = logoSettings.src.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setLogoFileSize(formatBytes(bytes, 1));
      }
    } else {
      fetch(logoSettings.src, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setLogoFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setLogoFileSize('Unknown Size');
            }
          } else {
            setLogoFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setLogoFileSize('Unknown Size');
        });
    }
  }, [logoSettings?.src]);

  useEffect(() => {
    if (!watermarkSettings?.src) {
      setWatermarkResolution('');
      setWatermarkFileSize('');
      return;
    }
    const img = new Image();
    img.src = watermarkSettings.src;
    img.onload = () => {
      setWatermarkResolution(`${img.naturalWidth} x ${img.naturalHeight}`);
    };

    if (watermarkSettings.src.startsWith('data:')) {
      const base64str = watermarkSettings.src.split(',')[1];
      if (base64str) {
        const bytes = Math.round(base64str.length * (3 / 4));
        setWatermarkFileSize(formatBytes(bytes, 1));
      }
    } else {
      fetch(watermarkSettings.src, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            const contentLength = res.headers.get('content-length');
            if (contentLength) {
              setWatermarkFileSize(formatBytes(parseInt(contentLength, 10), 1));
            } else {
              setWatermarkFileSize('Unknown Size');
            }
          } else {
            setWatermarkFileSize('Unknown Size');
          }
        })
        .catch(() => {
          setWatermarkFileSize('Unknown Size');
        });
    }
  }, [watermarkSettings?.src]);

  const uploadCustomizedAsset = async (file, assetType) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && file) {
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        formData.append('emailId', user.emailId);
        formData.append('assetType', assetType);
        formData.append('folderName', folder || 'My_Flipbooks');
        formData.append('flipbookName', flipbookName || v_id || 'Untitled Document');
        if (v_id) formData.append('v_id', v_id);
        if (assetType === 'logo' && logoSettings?.src) {
          formData.append('oldSrc', logoSettings.src);
        } else if (assetType === 'watermark' && watermarkSettings?.src) {
          formData.append('oldSrc', watermarkSettings.src);
        }

        const res = await axios.post(`${backendUrl}/api/flipbook/branding`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.url) {
          return res.data.url;
        }
      }
    } catch (err) {
      console.warn(`[Branding] ${assetType} upload warning:`, err);
    }
    return null;
  };

  const handleLogoReplace = async (file) => {
    if (!file) return;
    const uploadedUrl = await uploadCustomizedAsset(file, 'logo');
    if (uploadedUrl) {
      onUpdateLogo({
        ...logoSettings,
        src: uploadedUrl,
        url: uploadedUrl,
        opacity: logoSettings?.opacity ?? 100,
        adjustments: logoSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateLogo({
        ...logoSettings,
        src: event.target.result,
        url: event.target.result,
        opacity: logoSettings?.opacity ?? 100,
        adjustments: logoSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkReplace = async (file) => {
    if (!file) return;
    const uploadedUrl = await uploadCustomizedAsset(file, 'watermark');
    if (uploadedUrl) {
      onUpdateWatermark({
        ...watermarkSettings,
        src: uploadedUrl,
        opacity: watermarkSettings?.opacity ?? 64,
        position: watermarkSettings?.position || 'Bottom Right',
        adjustments: watermarkSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateWatermark({
        ...watermarkSettings,
        src: event.target.result,
        opacity: watermarkSettings?.opacity ?? 64,
        position: watermarkSettings?.position || 'Bottom Right',
        adjustments: watermarkSettings?.adjustments ?? {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWatermarkAdjustmentChange = (key, value) => {
    onUpdateWatermark({
      ...watermarkSettings,
      adjustments: {
        ...(watermarkSettings?.adjustments || {}),
        [key]: value
      }
    });
  };

  // Logo Handlers
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadedUrl = await uploadCustomizedAsset(file, 'logo');
      if (uploadedUrl) {
        onUpdateLogo({
          ...logoSettings,
          src: uploadedUrl,
          url: uploadedUrl,
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
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLogo({
          ...logoSettings,
          src: reader.result,
          url: reader.result,
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
    onUpdateLogo({ ...logoSettings, src: e.target.value, url: e.target.value });
  };

  const handleLogoTypeChange = (e) => {
    onUpdateLogo({ ...logoSettings, type: e.target.value });
  };

  const confirmRemoveLogo = () => {
    setDeleteTarget('logo');
  };

  const deleteBrandingAsset = async (assetType) => {
    const isLogo = assetType === 'logo';
    const targetSettings = isLogo ? logoSettings : watermarkSettings;
    const targetSrc = targetSettings?.src;

    if (targetSrc) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          await axios.post(`${backendUrl}/api/flipbook/branding`, {
            action: 'delete',
            emailId: user.emailId,
            v_id: v_id,
            assetType: assetType,
            src: targetSrc,
            folderName: folder || 'My_Flipbooks',
            flipbookName: flipbookName || v_id || 'Untitled Document'
          });
        }
      } catch (err) {
        console.warn(`[Branding] ${assetType} delete asset warning:`, err);
      }
    }

    if (isLogo) {
      onUpdateLogo({
        src: '',
        url: '',
        type: 'Fit',
        opacity: 100,
        cropData: null,
        adjustments: {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDeleteTarget(null);
    } else {
      onUpdateWatermark({
        src: '',
        type: 'Fit',
        opacity: 64,
        position: 'Bottom Right',
        cropData: null,
        adjustments: {
          exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0
        }
      });
      if (watermarkFileInputRef.current) watermarkFileInputRef.current.value = '';
      setDeleteTarget(null);
    }
  };

  const removeLogo = () => {
    deleteBrandingAsset('logo');
  };

  const removeWatermark = () => {
    deleteBrandingAsset('watermark');
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

  const getLogoFilterStr = () => {
    const adj = logoSettings?.adjustments || {};
    const exposure = adj.exposure || 0;
    const contrast = adj.contrast || 0;
    const saturation = adj.saturation || 0;
    const temperature = adj.temperature || 0;
    const tint = adj.tint || 0;
    const highlights = (adj.highlights || 0) / 5;
    const shadows = (adj.shadows || 0) / 5;
    return `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
  };

  const getWatermarkFilterStr = () => {
    const adj = watermarkSettings?.adjustments || {};
    const exposure = adj.exposure || 0;
    const contrast = adj.contrast || 0;
    const saturation = adj.saturation || 0;
    const temperature = adj.temperature || 0;
    const tint = adj.tint || 0;
    const highlights = (adj.highlights || 0) / 5;
    const shadows = (adj.shadows || 0) / 5;
    return `brightness(${100 + exposure}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${tint}deg) sepia(${temperature > 0 ? temperature : 0}%) brightness(${100 + highlights}%) contrast(${100 + shadows}%)`;
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




  // Default Logo View
  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Sub-header */}
      <div className="h-[7.5vh] flex items-center justify-between px-[1.2vw] border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-[0.75vw] text-gray-800">
          <Icon icon="lucide:gem" className="w-[1.2vw] h-[1.2vw] text-black" />
          <h2 className="text-[1vw] font-semibold text-gray-900">Branding</h2>
        </div>
        <button
          onClick={onBack}
          className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-90"
        >
          <Icon icon="ph:arrow-left-bold" className="w-[1.1vw] h-[1.1vw]" />
        </button>
      </div>

      <style>{`
        .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
        .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
        .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
        .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
        .custom-range-slider::-moz-range-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
        .custom-range-slider::-moz-range-thumb { height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); cursor: pointer; }
        .custom-range-slider::-moz-range-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
      `}</style>

      <div className="flex-1 overflow-y-auto px-[1.2vw] pt-[1vw] pb-[3vw] flex flex-col gap-[1vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Upload your Logo Header */}
        <div className="mb-[0.5vw]">
          <div className="flex items-center gap-[0.5vw] mt-[0.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap mb-[1vw]">Upload your Logo</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
            {logoSettings?.src && (
              <PremiumDropdown
                options={['Fit', 'Fill', 'Stretch', 'Crop']}
                value={logoSettings?.type || 'Fit'}
                onChange={(val) => {
                  if (val === 'Crop') {
                    setShowCropOverlay(true);
                  } else {
                    onUpdateLogo({ ...logoSettings, type: val });
                  }
                }}
                width="5vw"
                align="right"
              />
            )}
          </div>

          {/* Split Upload / Drop Zone */}
          {logoSettings?.src ? (
            <div className="flex flex-col gap-[0.75vw]">
              <div
                className="flex items-center gap-[1vw]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleFileChange({ target: { files: [file] } });
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                  <img
                    src={logoSettings.src}
                    alt="Thumbnail"
                    className={`w-full h-full ${logoSettings?.cropData ? 'object-cover' : 'object-contain'}`}
                    style={{
                      opacity: (logoSettings?.opacity ?? 100) / 100,
                      filter: getLogoFilterStr(),
                      ...(() => {
                        const cd = logoSettings?.cropData;
                        return cd && cd.inset ? {
                          clipPath: cd.inset,
                          WebkitClipPath: cd.inset,
                          transform: `translate(${cd.offX}%, ${cd.offY}%) scale(${cd.scale})`,
                          transformOrigin: 'center center'
                        } : {};
                      })()
                    }}
                  />
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw]">
                  <div className="flex flex-col gap-[0.1vw]">
                    <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw]" title="Logo">
                      Logo
                    </span>
                    <span className="text-[0.75vw] text-gray-400">
                      {logoResolution && logoFileSize ? `${logoResolution} • ${logoFileSize}` : (logoFileSize || logoResolution || 'Loading size...')}
                    </span>
                  </div>

                  <div className="flex items-center gap-[0.5vw]">
                    <button
                      onClick={() => setGalleryTarget('logo')}
                      className="px-[0.75vw] py-[0.4vw] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      Replace image
                    </button>
                    <button
                      onClick={confirmRemoveLogo}
                      className="p-[0.45vw] bg-[#f3f4f6] hover:bg-[#fee2e2] text-gray-500 hover:text-red-500 rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      <Trash2 size="0.95vw" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-[1vw] py-[0.5vw]">
                <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">Opacity :</span>
                <div className="flex-1 flex items-center h-[1.5vw]">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={logoSettings?.opacity ?? 100}
                    onChange={(e) => onUpdateLogo({ ...logoSettings, opacity: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider"
                    style={{
                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${logoSettings?.opacity ?? 100}%, #E2E8F0 ${logoSettings?.opacity ?? 100}%, #E2E8F0 100%)`
                    }}
                  />
                </div>
                <div className="px-[0.6vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-semibold text-gray-700 min-w-[3vw] text-center shadow-sm">
                  {logoSettings?.opacity ?? 100}%
                </div>
              </div>

              {/* Collapsible Adjustment Section */}
              <div className="flex flex-col">
                <div
                  onClick={() => setShowLogoAdjustments(!showLogoAdjustments)}
                  className={`w-full flex items-center justify-between px-[1vw] py-[1vw] bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${showLogoAdjustments ? 'rounded-t-[0.75vw] border-b-0' : 'rounded-[0.75vw]'}`}
                >
                  <span className="text-[0.75vw] font-semibold text-gray-700">Adjustments</span>
                  <ChevronDown
                    size="0.95vw"
                    className={`text-gray-500 transition-transform duration-200 ${showLogoAdjustments ? 'rotate-180' : ''}`}
                  />
                </div>

                {showLogoAdjustments && (
                  <div className="space-y-[0.1vw] border border-gray-200 rounded-b-[0.75vw] bg-white p-[0.5vw]">
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
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[0.75vw] mb-[1vw] ">
              {/* Drag & Drop Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleFileChange({ target: { files: [file] } });
                  }
                }}
                className="w-full h-[7vw] border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
              >
                <div className="flex items-center">
                  <span className="text-gray-500 text-[0.8vw] font-semibold">+ Add Logo</span>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          {/* Add Watermark Section */}
          <div className="mb-[0.5vw]">
            <div className="flex items-center gap-[0.5vw] mt-[1.5vw]">
              <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Add Watermark</span>
              <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
              {watermarkSettings?.src && (
                <PremiumDropdown
                  options={['Fit', 'Fill', 'Stretch']}
                  value={watermarkSettings?.type || 'Fit'}
                  onChange={(val) => onUpdateWatermark({ ...watermarkSettings, type: val })}
                  width="5vw"
                  align="right"
                />
              )}
            </div>
          </div>

          {watermarkSettings?.src ? (
            <div className="flex flex-col gap-[0.5vw]">
              <div className="flex items-center gap-[1vw]">
                {/* Thumbnail */}
                <div className="relative w-[8.5vw] h-[6vw] rounded-[0.4vw] overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                  <img
                    src={watermarkSettings.src}
                    alt="Watermark Thumbnail"
                    className="w-full h-full object-contain"
                    style={{
                      opacity: (watermarkSettings?.opacity ?? 64) / 100,
                      filter: getWatermarkFilterStr()
                    }}
                  />
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw]">
                  <div className="flex flex-col gap-[0.1vw]">
                    <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw]">
                      Watermark
                    </span>
                    <span className="text-[0.75vw] text-gray-400">
                      {watermarkResolution && watermarkFileSize ? `${watermarkResolution} • ${watermarkFileSize}` : (watermarkFileSize || watermarkResolution || 'Loading size...')}
                    </span>
                  </div>
                  <div className="flex items-center gap-[0.5vw]">
                    <button
                      onClick={() => setGalleryTarget('watermark')}
                      className="px-[0.75vw] py-[0.4vw] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      Replace image
                    </button>
                    <button
                      onClick={() => setDeleteTarget('watermark')}
                      className="p-[0.45vw] bg-[#f3f4f6] hover:bg-[#fee2e2] text-gray-500 hover:text-red-500 rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                    >
                      <Trash2 size="0.95vw" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[0.75vw] mb-[1vw]">
              {/* Drag & Drop Box */}
              <div
                onClick={() => watermarkFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    handleWatermarkReplace(file);
                  }
                }}
                className="w-full h-[7vw] border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
              >
                <div className="flex items-center">
                  <span className="text-gray-500 text-[0.8vw] font-semibold">+ Add Watermark</span>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={watermarkFileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleWatermarkReplace(file);
              }
            }}
            className="hidden"
            accept="image/*"
          />

          {/* Watermark Opacity & Position */}
          {watermarkSettings?.src && (
            <div className="flex flex-col gap-[0.5vw] pt-[0.5vw]">
              <style>{`
              .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
              .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
              .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
              .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.55vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
              .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
            `}</style>
              {/* Opacity Slider */}
              <div className="flex items-center gap-[1vw] pt-[0.5vw]">
                <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">Opacity :</span>
                <div className="flex-1 flex items-center h-[1.5vw]">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={watermarkSettings?.opacity ?? 64}
                    onChange={(e) => onUpdateWatermark({ ...watermarkSettings, opacity: parseInt(e.target.value) })}
                    className="w-full cursor-pointer custom-range-slider"
                    style={{
                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${watermarkSettings?.opacity ?? 64}%, #E2E8F0 ${watermarkSettings?.opacity ?? 64}%, #E2E8F0 100%)`
                    }}
                  />
                </div>
                <div className="px-[0.6vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] font-semibold text-gray-700 min-w-[3vw] text-center shadow-sm">
                  {watermarkSettings?.opacity ?? 64}%
                </div>
              </div>

              <div className="flex items-center justify-between gap-[1vw] py-[0.5vw]">
                <label className="text-[0.75vw] font-semibold text-gray-700">Select Watermark Position :</label>
                <PremiumDropdown
                  options={['Top Left', 'Top Right', 'Center', 'Bottom Left', 'Bottom Right']}
                  value={watermarkSettings?.position || 'Bottom Right'}
                  onChange={(val) => onUpdateWatermark({ ...watermarkSettings, position: val })}
                  width="7.6vw"
                  align="right"
                />
              </div>

              {/* Collapsible Adjustment Section */}
              <div className="flex flex-col">
                <div
                  onClick={() => setShowWatermarkAdjustments(!showWatermarkAdjustments)}
                  className={`w-full flex items-center justify-between px-[1vw] py-[1vw] bg-white border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${showWatermarkAdjustments ? 'rounded-t-[0.75vw] border-b-0' : 'rounded-[0.75vw]'}`}
                >
                  <span className="text-[0.75vw] font-semibold text-gray-700">Adjustments</span>
                  <ChevronDown
                    size="0.95vw"
                    className={`text-gray-500 transition-transform duration-200 ${showWatermarkAdjustments ? 'rotate-180' : ''}`}
                  />
                </div>

                {showWatermarkAdjustments && (
                  <div className="space-y-[0.1vw] border border-gray-200 rounded-b-[0.75vw] bg-white p-[0.5vw]">
                    <AdjustmentSlider
                      label="Exposure"
                      value={watermarkSettings?.adjustments?.exposure || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('exposure', val)}
                      onReset={() => handleWatermarkAdjustmentChange('exposure', 0)}
                    />
                    <AdjustmentSlider
                      label="Contrast"
                      value={watermarkSettings?.adjustments?.contrast || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('contrast', val)}
                      onReset={() => handleWatermarkAdjustmentChange('contrast', 0)}
                    />
                    <AdjustmentSlider
                      label="Saturation"
                      value={watermarkSettings?.adjustments?.saturation || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('saturation', val)}
                      onReset={() => handleWatermarkAdjustmentChange('saturation', 0)}
                    />
                    <AdjustmentSlider
                      label="Temperature"
                      value={watermarkSettings?.adjustments?.temperature || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('temperature', val)}
                      onReset={() => handleWatermarkAdjustmentChange('temperature', 0)}
                    />
                    <AdjustmentSlider
                      label="Tint"
                      value={watermarkSettings?.adjustments?.tint || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('tint', val)}
                      onReset={() => handleWatermarkAdjustmentChange('tint', 0)}
                    />
                    <AdjustmentSlider
                      label="Highlights"
                      value={watermarkSettings?.adjustments?.highlights || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('highlights', val)}
                      onReset={() => handleWatermarkAdjustmentChange('highlights', 0)}
                    />
                    <AdjustmentSlider
                      label="Shadows"
                      value={watermarkSettings?.adjustments?.shadows || 0}
                      onChange={(val) => handleWatermarkAdjustmentChange('shadows', val)}
                      onReset={() => handleWatermarkAdjustmentChange('shadows', 0)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preloader Customization Section */}
          <div className="flex items-center gap-[1vw] mb-[0.5vw] mt-[1.5vw]">
            <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Preloaded Customization</span>
            <div className="h-[0.0925vw] bg-gray-200 flex-1"> </div>
          </div>

          {/* Interactive Preloader Preview Box */}
          {(() => {
            const displayPreloader = showPreloaderModal
              ? { ...preloaderSettings, ...tempPreloaderSettings }
              : (preloaderSettings || {});
            return (
              <div
                className="relative w-full h-[8vw] rounded-[1vw] flex flex-col items-center justify-center shadow-xl border border-white/10 group overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: displayPreloader?.bgColor || '#D6E0F4',
                  color: displayPreloader?.textColor || '#ffffff'
                }}
              >
                {/* Swap Layout Button / Popup trigger */}
                <button
                  onClick={handleOpenPreloaderModal}
                  className="absolute top-[0.75vw] right-[0.75vw] p-[0.4vw] rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition-colors flex items-center justify-center z-[20]"
                  title="Change preloader settings"
                >
                  <ArrowLeftRight size="0.95vw" />
                </button>

                <div className="flex flex-col items-center gap-[0.8vw]">
                  {displayPreloader?.layout === 'bar' ? (
                    <div className="flex flex-col items-center gap-2 w-[12vw]">
                      <div className="w-full bg-gray-600/40 h-[0.4vw] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-pulse"
                          style={{
                            width: '60%',
                            backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A'
                          }}
                        ></div>
                      </div>
                      {displayPreloader?.showPercentage && (
                        <span className="text-[0.7vw] font-semibold">60%</span>
                      )}
                    </div>
                  ) : displayPreloader?.layout === 'dots' ? (
                    <div className="flex flex-col items-center gap-[0.3vw] py-[0.3vw]">
                      <div className="flex items-center gap-[0.4vw]">
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                        <div className="w-[0.5vw] h-[0.5vw] rounded-full animate-bounce" style={{ backgroundColor: displayPreloader?.spinnerColor || '#3B3C8A' }}></div>
                      </div>
                      {displayPreloader?.showPercentage && (
                        <span className="text-[0.7vw] font-semibold">20%</span>
                      )}
                    </div>
                  ) : (
                    // default circular spinner
                    <div className="relative flex items-center justify-center">
                      <div
                        className="w-[2.2vw] h-[2.2vw] border-[3px] border-t-transparent rounded-full animate-spin"
                        style={{
                          borderColor: `${displayPreloader?.spinnerColor || '#3B3C8A'} ${displayPreloader?.spinnerColor || '#3B3C8A'} ${displayPreloader?.spinnerColor || '#3B3C8A'} transparent`
                        }}
                      ></div>
                      {displayPreloader?.showPercentage && (
                        <span className="absolute text-[0.6vw] font-bold">20%</span>
                      )}
                    </div>
                  )}
                  <p
                    className="text-[0.75vw] font-semibold text-center truncate max-w-[15vw]"
                    style={{ fontFamily: displayPreloader?.font || 'Poppins' }}
                  >
                    {displayPreloader?.text || 'Loading Modal Please Wait....'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Preloader Styles Modal */}
          {showPreloaderModal && typeof document !== 'undefined' && createPortal(
            <div
              className="fixed w-[21vw] z-[9999] bg-white rounded-[0.8vw] shadow-[0_4px_30px_rgba(0,0,0,0.2)] border border-gray-200 overflow-hidden"
              style={{
                top: '50%',
                left: '48vw',
                transform: 'translate(-50%, -50%)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-[1vw] space-y-[1vw]">
                {/* Header */}
                <div className="flex items-center gap-[0.5vw]">
                  <h4 className="text-[1vw] font-semibold text-black whitespace-nowrap">Preloader Customization</h4>
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                </div>

                {/* Layout Selection */}
                <div className="flex items-center justify-between gap-[1vw]">
                  <label className="text-[0.8vw] font-semibold text-gray-700">Preloader Styles </label>
                  <PremiumDropdown
                    options={['Spinner', 'Bar', 'Dots']}
                    value={tempPreloaderSettings?.layout ? tempPreloaderSettings.layout.charAt(0).toUpperCase() + tempPreloaderSettings.layout.slice(1) : 'Spinner'}
                    onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, layout: val.toLowerCase() })}
                    width="8vw"
                    align="right"
                  />
                </div>

                {/* Text Input */}
                <div className="flex flex-col gap-[0.4vw]">
                  <label className="text-[0.8vw] font-semibold text-gray-700">Preloader Text</label>
                  <input
                    type="text"
                    value={tempPreloaderSettings?.text || ''}
                    onChange={(e) => setTempPreloaderSettings({ ...tempPreloaderSettings, text: e.target.value })}
                    className="w-full px-[0.8vw] py-[0.45vw] bg-white border border-gray-200 rounded-[0.4vw] text-[0.75vw] focus:ring-[0.0625vw] focus:ring-blue-500 focus:outline-none text-gray-700 shadow-sm"
                  />
                </div>

                {/* Text Style */}
                <div className="flex items-center justify-between gap-[1vw]">
                  <label className="text-[0.8vw] font-semibold text-gray-700">Text Style</label>
                  <PremiumDropdown
                    options={fontFamilies}
                    value={tempPreloaderSettings?.font || 'Poppins'}
                    onChange={(val) => setTempPreloaderSettings({ ...tempPreloaderSettings, font: val })}
                    width="8vw"
                    isFont={true}
                    align="right"
                  />
                </div>


                {/* Colors Customization List */}
                <div className="space-y-[0.8vw]">
                  {/* Bg Color */}
                  <div className="flex items-center justify-between gap-[1vw]">
                    <span className="text-[0.75vw] font-semibold text-gray-700 w-[7.2vw] text-left">Bg Color :</span>
                    <div className="flex-1 flex gap-[0.5vw] items-center">
                      <div
                        className="w-[1.8vw] h-[1.8vw] border border-gray-200 rounded-[0.5vw] shadow-[0_2px_4px_rgba(0,0,0,0.06)] cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0"
                        style={{ backgroundColor: tempPreloaderSettings?.bgColor || '#D6E0F4' }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                          setShowPreloaderBgColorPicker(true);
                        }}
                      />
                      <div className="flex-1 h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                        <input
                          type="text"
                          value={(tempPreloaderSettings?.bgColor || '#2D2F33').toUpperCase()}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#')) val = '#' + val;
                            setTempPreloaderSettings({ ...tempPreloaderSettings, bgColor: val });
                          }}
                          className="text-[0.8vw] font-medium text-gray-700 font-mono bg-transparent w-[5vw] outline-none"
                        />
                        <span className="text-[0.8vw] font-medium text-gray-400 font-mono">100%</span>
                      </div>
                      {window.EyeDropper && (
                        <button
                          onClick={async () => {
                            try {
                              const ed = new window.EyeDropper();
                              const result = await ed.open();
                              setTempPreloaderSettings({ ...tempPreloaderSettings, bgColor: result.sRGBHex });
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                          className="w-[1.8vw] h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer flex-shrink-0"
                          title="Eye Dropper"
                        >
                          <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-500 hover:text-gray-800" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="flex items-center justify-between gap-[1vw]">
                    <span className="text-[0.75vw] font-semibold text-gray-700 w-[7.2vw] text-left">Text Color :</span>
                    <div className="flex-1 flex gap-[0.5vw] items-center">
                      <div
                        className="w-[1.8vw] h-[1.8vw] rounded-[0.5vw] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0"
                        style={{ backgroundColor: tempPreloaderSettings?.textColor || '#ffffff' }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                          setShowPreloaderTextColorPicker(true);
                        }}
                      />
                      <div className="flex-1 h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                        <input
                          type="text"
                          value={(tempPreloaderSettings?.textColor || '#ffffff').toUpperCase()}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#')) val = '#' + val;
                            setTempPreloaderSettings({ ...tempPreloaderSettings, textColor: val });
                          }}
                          className="text-[0.8vw] font-medium text-gray-700 font-mono bg-transparent w-[5vw] outline-none"
                        />
                        <span className="text-[0.8vw] font-medium text-gray-400 font-mono">100%</span>
                      </div>
                      {window.EyeDropper && (
                        <button
                          onClick={async () => {
                            try {
                              const ed = new window.EyeDropper();
                              const result = await ed.open();
                              setTempPreloaderSettings({ ...tempPreloaderSettings, textColor: result.sRGBHex });
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                          className="w-[1.8vw] h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer flex-shrink-0"
                          title="Eye Dropper"
                        >
                          <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-500 hover:text-gray-800" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between gap-[1vw]">
                    <span className="text-[0.75vw] font-semibold text-gray-700 w-[7.2vw] text-left">Accent Color :</span>
                    <div className="flex-1 flex gap-[0.5vw] items-center">
                      <div
                        className="w-[1.8vw] h-[1.8vw] border border-gray-200 rounded-[0.5vw] shadow-[0_2px_4px_rgba(0,0,0,0.06)] cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0"
                        style={{ backgroundColor: tempPreloaderSettings?.spinnerColor || '#3B3C8A' }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPickerPos({ x: Math.min(window.innerWidth - 260, rect.left + 260), y: rect.top });
                          setShowPreloaderSpinnerColorPicker(true);
                        }}
                      />
                      <div className="flex-1 h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                        <input
                          type="text"
                          value={(tempPreloaderSettings?.spinnerColor || '#3B3C8A').toUpperCase()}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#')) val = '#' + val;
                            setTempPreloaderSettings({ ...tempPreloaderSettings, spinnerColor: val });
                          }}
                          className="text-[0.8vw] font-medium text-gray-700 font-mono bg-transparent w-[5vw] outline-none"
                        />
                        <span className="text-[0.8vw] font-medium text-gray-400 font-mono">100%</span>
                      </div>
                      {window.EyeDropper && (
                        <button
                          onClick={async () => {
                            try {
                              const ed = new window.EyeDropper();
                              const result = await ed.open();
                              setTempPreloaderSettings({ ...tempPreloaderSettings, spinnerColor: result.sRGBHex });
                            } catch (e) {
                              console.log(e);
                            }
                          }}
                          className="w-[1.8vw] h-[1.8vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer flex-shrink-0"
                          title="Eye Dropper"
                        >
                          <Icon icon="lucide:pipette" className="w-[0.9vw] h-[0.9vw] text-gray-500 hover:text-gray-800" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show Percentage Toggle */}
                <div className="flex items-center justify-between py-[0.2vw]">
                  <span className="text-[0.75vw] font-semibold text-gray-700">Show Loading Percentage :</span>
                  <button
                    onClick={() => setTempPreloaderSettings({ ...tempPreloaderSettings, showPercentage: !tempPreloaderSettings?.showPercentage })}
                    className={`w-[2.2vw] h-[1.2vw] rounded-full p-[0.1vw] transition-colors focus:outline-none ${tempPreloaderSettings?.showPercentage ? 'bg-[#4A3AFF]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-[1vw] h-[1vw] rounded-full bg-white shadow-sm transition-transform ${tempPreloaderSettings?.showPercentage ? 'translate-x-[1vw]' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Actions Footer */}
                <div className="h-[1px] bg-gray-200 w-full"></div>
                <div className="flex items-center justify-end gap-[0.8vw] pt-[0.2vw]">
                  <button
                    onClick={() => setShowPreloaderModal(false)}
                    className="flex items-center gap-[0.4vw] px-[0.8vw] py-[0.35vw] border border-black rounded-[0.4vw] text-black text-[0.8vw] hover:bg-gray-50 transition-colors font-medium bg-white cursor-pointer"
                  >
                    <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw]" />
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePreloader({ ...(preloaderSettings || {}), ...(tempPreloaderSettings || {}) });
                      setShowPreloaderModal(false);
                    }}
                    className="flex items-center gap-[0.4vw] px-[0.8vw] py-[0.35vw] bg-black text-white rounded-[0.4vw] text-[0.8vw] hover:bg-gray-800 transition-colors font-medium border border-black cursor-pointer"
                  >
                    <Icon icon="qlementine-icons:replace-16" className="w-[0.9vw] h-[0.9vw]" />
                    Change
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>

        {/* Gallery Modal */}
        {galleryTarget && (
          <div className="fixed z-[1000] bg-white border border-gray-100 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ width: '320px', height: '540px', top: '50%', left: '24vw', transform: 'translate(-50%, -50%)' }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h2 className="text-ms font-semibold text-gray-900">Image Gallery</h2>
              <button onClick={() => { setGalleryTarget(null); setLocalGallerySelected(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <Icon icon="lucide:x" className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-4 py-2">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-1">
                Upload your {galleryTarget === 'logo' ? 'Logo' : 'Watermark'}
              </h3>
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
              <h3 className="text-[13px] font-semibold text-gray-900 mb-1">
                Uploaded {galleryTarget === 'logo' ? 'Logos' : 'Watermarks'}
              </h3>
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
                  <p className="text-sm">No uploaded images yet</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t flex justify-end gap-2 bg-white mt-auto">
              <button onClick={() => { setGalleryTarget(null); setLocalGallerySelected(null); }} className="flex-1 h-8 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50">
                <Icon icon="lucide:x" className="w-4 h-4" /> Close
              </button>
              <button
                onClick={() => {
                  if (localGallerySelected && galleryTarget) {
                    if (galleryTarget === 'logo') {
                      onUpdateLogo({ ...logoSettings, src: localGallerySelected.url, url: localGallerySelected.url });
                    } else if (galleryTarget === 'watermark') {
                      onUpdateWatermark({ ...watermarkSettings, src: localGallerySelected.url });
                    }
                    setGalleryTarget(null);
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

        {showPreloaderBgColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.bgColor || '#2D2F33') : (preloaderSettings?.bgColor || '#2D2F33')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, bgColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, bgColor: color });
              }
            }}
            onClose={() => setShowPreloaderBgColorPicker(false)}
            position={pickerPos}
          />
        )}

        {showPreloaderTextColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.textColor || '#ffffff') : (preloaderSettings?.textColor || '#ffffff')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, textColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, textColor: color });
              }
            }}
            onClose={() => setShowPreloaderTextColorPicker(false)}
            position={pickerPos}
          />
        )}

        {showPreloaderSpinnerColorPicker && (
          <CustomColorPicker
            color={showPreloaderModal ? (tempPreloaderSettings?.spinnerColor || '#3B3C8A') : (preloaderSettings?.spinnerColor || '#3B3C8A')}
            onChange={(color) => {
              if (showPreloaderModal) {
                setTempPreloaderSettings({ ...tempPreloaderSettings, spinnerColor: color });
              } else {
                onUpdatePreloader({ ...preloaderSettings, spinnerColor: color });
              }
            }}
            onClose={() => setShowPreloaderSpinnerColorPicker(false)}
            position={pickerPos}
          />
        )}

        {replaceTarget && (
          <ReplaceMediaModal
            show={!!replaceTarget}
            onClose={() => setReplaceTarget(null)}
            onReplace={(file) => {
              if (replaceTarget === 'logo') {
                handleLogoReplace(file);
              } else if (replaceTarget === 'watermark') {
                handleWatermarkReplace(file);
              }
            }}
            mediaType="image"
          />
        )}

        <AlertModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget === 'logo') removeLogo();
            else if (deleteTarget === 'watermark') removeWatermark();
          }}
          type="warning"
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
          showCancel={true}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};

export default Branding;