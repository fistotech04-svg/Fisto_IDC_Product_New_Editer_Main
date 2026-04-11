import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import PremiumDropdown from './PremiumDropdown';
import { ImageCropOverlay } from './AppearanceShared';
import { X, Upload, Edit2, SlidersHorizontal, Image as ImageIcon, Check, MoreVertical, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';

const scrollbarStyles = `
  .custom-popup-scrollbar::-webkit-scrollbar {
    width: 0.18vw;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-track {
    background: #F9F9F9;
    border-radius: 10px;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-thumb {
    background: #333333;
    border-radius: 10px;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-button {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-button:vertical:decrement,
  .custom-popup-scrollbar::-webkit-scrollbar-button:vertical:increment,
  .custom-popup-scrollbar::-webkit-scrollbar-button:horizontal:decrement,
  .custom-popup-scrollbar::-webkit-scrollbar-button:horizontal:increment {
    display: none !important;
  }
  ::-webkit-scrollbar-button {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
  }
  .custom-popup-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #333333 #f9f9f9;
  }
`;
import cover1 from '../../assets/cover/cover1.png';
import cover2 from '../../assets/cover/cover2.jpg';
import cover3 from '../../assets/cover/cover3.jpg';
import cover4 from '../../assets/cover/cover4.jpg';
import cover5 from '../../assets/cover/cover5.jpg';
import cover6 from '../../assets/cover/cover6.jpg';
import cover7 from '../../assets/cover/cover7.jpg';
import cover8 from '../../assets/cover/cover8.jpg';
import cover9 from '../../assets/cover/cover9.jpg';
import cover10 from '../../assets/cover/cover10.jpg';

const COVER_TEMPLATES = [
  { id: 1, src: cover1, label: 'Cover 1' },
  { id: 2, src: cover2, label: 'Cover 2' },
  { id: 3, src: cover3, label: 'Cover 3' },
  { id: 4, src: cover4, label: 'Cover 4' },
  { id: 5, src: cover5, label: 'Cover 5' },
  { id: 6, src: cover6, label: 'Cover 6' },
  { id: 7, src: cover7, label: 'Cover 7' },
  { id: 8, src: cover8, label: 'Cover 8' },
  { id: 9, src: cover9, label: 'Cover 9' },
  { id: 10, src: cover10, label: 'Cover 10' },
];

const CoverPicturePopup = ({ onClose, onSave, onPreview, settings, pages = [] }) => {
  const [option, setOption] = useState(settings.coverPicture?.type || 'template');
  const [activeTab, setActiveTab] = useState(settings.coverPicture?.activeTab || 'cover');
  const [selectedTemplate, setSelectedTemplate] = useState(settings.coverPicture?.selectedTemplate || COVER_TEMPLATES[0]);

  const [uploadedImage, setUploadedImage] = useState(settings.coverPicture?.type === 'upload' ? settings.coverPicture.url : null);
  const [originalImage, setOriginalImage] = useState(settings.coverPicture?.type === 'upload' ? settings.coverPicture.url : null);
  const [isCropping, setIsCropping] = useState(false);
  const previewImgRef = useRef(null);
  const [rawFile, setRawFile] = useState(null);
  const [imageFixType, setImageFixType] = useState(settings.coverPicture?.fit || 'Fit');
  const [showMenu, setShowMenu] = useState(false);

  const [text1, setText1] = useState(settings.coverPicture?.text1 || 'Title');
  const [text2, setText2] = useState(settings.coverPicture?.text2 || 'Supporting Text');
  const [bgColor, setBgColor] = useState(settings.coverPicture?.bgColor || '#D7D8E8');
  const [bgOpacity, setBgOpacity] = useState(settings.coverPicture?.bgOpacity || 100);
  const [shadowColor, setShadowColor] = useState(settings.coverPicture?.shadowColor || '#000000');
  const [shadowOpacity, setShadowOpacity] = useState(settings.coverPicture?.shadowOpacity || 80);
  const [shadowX, setShadowX] = useState(settings.coverPicture?.shadowX || 0);
  const [shadowY, setShadowY] = useState(settings.coverPicture?.shadowY || 0);
  const [shadowBlur, setShadowBlur] = useState(settings.coverPicture?.shadowBlur || 35);

  const [selectedPages, setSelectedPages] = useState(settings.coverPicture?.selectedPages || []);

  // Notify parent of changes for real-time preview
  React.useEffect(() => {
    if (onPreview) {
      onPreview({
        type: option,
        activeTab,
        selectedTemplate,
        url: option === 'upload' ? uploadedImage : (selectedTemplate?.src || ''),
        fit: imageFixType,
        text1,
        text2,
        bgColor,
        bgOpacity,
        shadowColor,
        shadowOpacity,
        shadowX,
        shadowY,
        shadowBlur,
        selectedPages
      });
    }
  }, [option, activeTab, selectedTemplate, uploadedImage, imageFixType, text1, text2, bgColor, bgOpacity, shadowColor, shadowOpacity, shadowX, shadowY, shadowBlur, selectedPages, onPreview]);

  const handleCoverUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setRawFile(file);
       const url = URL.createObjectURL(file);
       setUploadedImage(url);
       setOriginalImage(url);
       setShowMenu(false);
    }
  };

  const togglePageSelection = (pageNum) => {
     setSelectedPages(prev => 
       prev.includes(pageNum) 
         ? prev.filter(p => p !== pageNum) 
         : [...prev, pageNum]
     );
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-[1vw] shadow-2xl w-[65vw] max-w-[700px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-[1.5vw] py-[1.2vw]">
          <div className="flex items-center gap-[1vw] flex-1">
             <h2 className="text-[1vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Cover Picture Customization</h2>
             <div className="h-[0.0925vw] bg-gray-200 w-full"> </div>
          </div>
          <button onClick={onClose} className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 ml-[1vw] shrink-0 transition-colors">
            <X size="1.2vw" />
          </button>
        </div>

        {/* Content */}
        <div className="px-[1.5vw] pb-[1vw] flex flex-col h-[40vw] max-h-[350px] overflow-hidden">
          {/* Options */}
          <div className="flex items-center gap-[2vw] mb-[1.5vw] shrink-0">
            <label className="flex items-center gap-[0.5vw] cursor-pointer group" onClick={() => setOption('template')}>
              <div className={`w-[1vw] h-[1vw] rounded-full border-[0.15vw] flex items-center justify-center transition-colors ${option === 'template' ? 'border-[#4A3AFF]' : 'border-gray-800'}`}>
                  {option === 'template' && <div className="w-[0.5vw] h-[0.5vw] bg-[#4A3AFF] rounded-full"></div>}
              </div>
              <span className="text-[0.75vw] font-semibold text-gray-900">Add from Templates</span>
            </label>
            <label className="flex items-center gap-[0.5vw] cursor-pointer group" onClick={() => setOption('upload')}>
              <div className={`w-[1vw] h-[1vw] rounded-full border-[0.15vw] flex items-center justify-center transition-colors ${option === 'upload' ? 'border-[#4A3AFF]' : 'border-gray-800'}`}>
                  {option === 'upload' && <div className="w-[0.5vw] h-[0.5vw] bg-[#4A3AFF] rounded-full"></div>}
              </div>
              <span className="text-[0.75vw] font-semibold text-gray-900">Upload cover picture</span>
            </label>

            {option === 'upload' && (
              <div className="flex items-center gap-[0.8vw] ml-[1vw]">
                 <label className="text-[0.75vw] font-semibold text-gray-700">Image Fix Type </label>
          <PremiumDropdown 
            options={['Fit', 'Fill', 'Stretch', 'Crop']}
            value={imageFixType || 'Fit'}
            onChange={(val) => {
                setImageFixType(val);
                if (val === 'Crop' && uploadedImage) {
                    setIsCropping(true);
                }
            }}
            width="6vw"
            align="right"
          />
              </div>
            )}
          </div>

          {option === 'upload' ? (
             <div className="flex gap-[2vw] flex-1 min-h-0 ">
               {/* Left Upload/Preview Area */}
               <div className="w-[50%] flex flex-col relative h-[36vw] max-h-[270px] ">
                  {!uploadedImage ? (
                     <div className="w-full h-full border-[0.15vw] border-dashed border-gray-400 rounded-[1.5vw] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCoverUpload} />
                        <span className="text-[0.75vw] text-gray-400 font-semibold mb-[2vw]">Drag & Drop or <span className="text-[#4A3AFF] font-bold">Upload</span></span>
                        <Upload size="1.8vw" className="text-gray-400 mb-[1vw]" strokeWidth={1.5} />
                        <span className="text-[0.7vw] text-gray-400 mb-[0.4vw] mt-[2vw]">Dimensions 1080 X 880 px</span>
                        <span className="text-[0.7vw] text-gray-400">Supported File Format : JPG, PNG</span>
                     </div>
                  ) : (
                     <div className="w-full h-full rounded-[1.5vw] overflow-hidden relative group shadow-sm bg-gray-50">
                        <img 
                            ref={previewImgRef}
                            src={uploadedImage} 
                            className={`w-full h-full ${imageFixType === 'Fit' ? 'object-contain' : (imageFixType === 'Fill' || imageFixType === 'Crop') ? 'object-cover' : 'object-fill'}`} 
                            alt="Uploaded Cover" 
                        />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="absolute top-[0.8vw] right-[0.8vw] w-[2.2vw] h-[2.2vw] bg-white rounded-full flex items-center justify-center text-gray-600 shadow-lg hover:bg-gray-100 transition-all z-30"
                            title="More Options"
                        >
                            <MoreVertical size="1.2vw" />
                        </button>

                        {showMenu && (
                            <div className="absolute top-[3.5vw] right-[0.8vw] bg-white rounded-[0.4vw] shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center py-[0.5vw] border border-gray-100 z-20 overflow-hidden">
                               <button 
                                  className="px-[1.2vw] py-[0.5vw] hover:bg-gray-50 text-[0.75vw] font-semibold text-gray-700 w-full text-center border-b border-gray-100 whitespace-nowrap" 
                                  onClick={() => {
                                      document.getElementById('replace-cover-input').click();
                                      setShowMenu(false);
                                  }}
                               >
                                  Replace Image
                               </button>
                               <button 
                                  className="px-[1.2vw] py-[0.5vw] hover:bg-gray-50 text-[0.75vw] font-semibold text-red-500 w-full text-center whitespace-nowrap" 
                                  onClick={() => { 
                                      setUploadedImage(null); 
                                      setOriginalImage(null); 
                                      setRawFile(null); 
                                      setShowMenu(false); 
                                  }}
                               >
                                  Delete Image
                               </button>
                            </div>
                        )}
                        <input type="file" id="replace-cover-input" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                     </div>
                  )}
               </div>

               {/* Right Side Options & Footer */}
               <div className="w-[70%] flex flex-col justify-end pb-[1.5vw] pr-[2vw]">
                 <div className="flex flex-col gap-[1vw]">
                     <p className="text-[0.6vw] text-gray-400 font-semibold pr-[1vw]">
                        <span className="text-red-500">*</span> Your selected or uploaded image will be saved as the flipbook cover after clicking <strong>“Save Changes”</strong>
                     </p>
                     <div className="flex gap-[0.5vw]">
                        <button 
                            onClick={onClose} 
                            className="flex-1 py-[0.5vw] border border-gray-900 rounded-[0.5vw] text-[0.75vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-[0.5vw] shadow-sm"
                        >
                           <X size="1vw" strokeWidth={2.5} /> Cancel
                        </button>
                        <button 
                            onClick={() => { 
                                onSave({ 
                                    type: 'upload', 
                                    url: uploadedImage, 
                                    fit: imageFixType,
                                    rawFile: rawFile
                                }); 
                                onClose(); 
                            }} 
                            className="flex-1 py-[0.5vw] bg-black text-white rounded-[0.5vw] text-[0.75vw] font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-[0.5vw] shadow-sm"
                        >
                           <Check size="1vw" strokeWidth={3} /> Save Changes
                        </button>
                     </div>
                  </div>
               </div>
             </div>
          ) : (
          <div className="flex gap-[1vw] flex-1 min-h-0">
        {/* Left Preview */}
             <div className="w-[50%] rounded-[0.8vw] overflow-hidden flex items-center justify-center relative shadow-sm bg-gray-100">
               {option === 'template' && selectedTemplate ? (
                 <img
                   src={selectedTemplate.src}
                   className="w-full h-full object-cover"
                   alt={selectedTemplate.label}
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 text-[0.75vw] font-medium">
                   No preview
                 </div>
               )}
             </div>

            {/* Right Controls */}
            <div className="w-[45%] bg-[#e9e9ea] rounded-[0.8vw] flex flex-col overflow-hidden relative custom-popup-scrollbar">
               {/* Tabs */}
               <div className="flex items-center pt-[0.5vw] px-[1vw] gap-[2vw] border-b border-gray-300 mx-[0.5vw] shrink-0">
                  <button 
                    onClick={() => setActiveTab('cover')} 
                    className={`text-[0.8vw] font-semibold pb-[0.8vw] px-[0.5vw] border-b-[0.2vw] transition-colors ${activeTab === 'cover' ? 'border-[#373D8A] text-[#373D8A]' : 'border-transparent text-gray-900 hover:text-gray-600'}`}
                  >
                    Cover Template
                  </button>
                  <button 
                    onClick={() => setActiveTab('edit')} 
                    className={`text-[0.8vw] font-semibold pb-[0.8vw] px-[0.5vw] border-b-[0.2vw] transition-colors ${activeTab === 'edit' ? 'border-[#373D8A] text-[#373D8A]' : 'border-transparent text-gray-900 hover:text-gray-600'}`}
                  >
                    Edit Template
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto px-[1vw] py-[1.2vw] pr-[1.2vw] custom-popup-scrollbar">
                   {activeTab === 'cover' ? (
                      <div className="grid grid-cols-3 gap-[0.5vw]">
                         {COVER_TEMPLATES.map((tpl) => (
                            <div
                              key={tpl.id}
                              onClick={() => setSelectedTemplate(tpl)}
                              className={`aspect-[3/4] rounded-[0.4vw] cursor-pointer overflow-hidden border-[0.15vw] transition-all hover:scale-[1.03] hover:shadow-md relative group ${
                                selectedTemplate?.id === tpl.id
                                  ? 'border-[#4A3AFF] shadow-[0_0_0_0.15vw_rgba(74,58,255,0.3)]'
                                  : 'border-transparent hover:border-gray-400'
                              }`}
                              title={tpl.label}
                            >
                              <img src={tpl.src} alt={tpl.label} className="w-full h-full object-cover" />
                              {selectedTemplate?.id === tpl.id && (
                                <div className="absolute inset-0 bg-[#4A3AFF]/15 flex items-start justify-end p-[0.3vw]">
                                  <div className="w-[1vw] h-[1vw] bg-[#4A3AFF] rounded-full flex items-center justify-center shadow-md">
                                    <svg viewBox="0 0 10 10" className="w-[0.6vw] h-[0.6vw]" fill="none">
                                      <polyline points="2,5 4.5,7.5 8,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[0.5vw] font-semibold text-center py-[0.2vw] opacity-0 group-hover:opacity-100 transition-opacity">
                                {tpl.label}
                              </div>
                            </div>
                         ))}
                      </div>
                  ) : (
                     <div className="space-y-[0.50vw]">
                        {/* Text 1 Row */}
                        <div className="flex items-center justify-between gap-[0.5vw]">
                           <span className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap min-w-[4vw]">Enter Text 1 :</span>
                           <div className="flex-1 flex gap-[0.5vw] items-center">
                              <div className="flex-1 bg-white border border-gray-400 rounded-[0.5vw] flex items-center px-[0.5vw] h-[2.2vw]">
                                 <input type="text" value={text1} onChange={e => setText1(e.target.value)} className="flex-1 bg-transparent text-[0.65vw] outline-none text-gray-400 font-medium" />
                                 <Edit2 size="0.95vw" className="text-gray-500" />
                              </div>
                              <Icon icon="mi:options-vertical" className="w-[1vw] h-[1vw] text-gray-600 shrink-0 cursor-pointer" />
                           </div>
                        </div>

                        {/* Text 2 Row */}
                        <div className="flex items-start justify-between gap-[0.5vw]">
                           <span className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap min-w-[4vw] pt-[0.6vw]">Enter Text 2 :</span>
                           <div className="flex-1 flex gap-[0.5vw] items-start">
                              <div className="flex-1 bg-white border border-gray-400 rounded-[0.5vw] flex flex-col p-[0.7vw] min-h-[5.5vw] relative">
                                 <textarea value={text2} onChange={e => setText2(e.target.value)} className="flex-1 bg-transparent text-[0.65vw] outline-none text-gray-400 resize-none h-full font-medium" />
                                 <Edit2 size="0.95vw" className="text-gray-500 absolute bottom-[0.7vw] right-[0.7vw]" />
                              </div>
                              <Icon icon="mi:options-vertical" className="w-[1vw] h-[1vw] text-gray-600 shrink-0 mt-[0.6vw] cursor-pointer" />
                           </div>
                        </div>

                        {/* Background Color Row */}
                        <div className="flex items-center gap-[0.5vw]">
                            <span className="text-[0.75vw] font-semibold text-gray-900 min-w-[4vw]">Background :</span>
                            <div className="flex gap-[0.5vw] items-center flex-1">
                                <div className="w-[1.8vw] h-[1.8vw] rounded-[0.5vw] border border-gray-400 shadow-sm" style={{ backgroundColor: bgColor }}></div>
                                <div className="bg-white border border-gray-400 rounded-[0.5vw] flex items-center justify-between px-[0.6vw] h-[1.8vw] flex-1">
                                    <span className="text-[0.8vw] text-gray-600 font-semibold">{bgColor.toUpperCase()}</span>
                                    <span className="text-[0.8vw] text-gray-600 font-semibold">{bgOpacity}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Shadow Color & Sliders */}
                        <div className="space-y-[1.2vw]">
                            <div className="flex items-center gap-[0.5vw]">
                                <span className="text-[0.75vw] font-semibold text-gray-900 min-w-[4.5vw]">Shadow :</span>
                                <div className="flex gap-[0.5vw] items-center flex-1">
                                    <div className="w-[1.8vw] h-[1.8vw] rounded-[0.5vw] border border-gray-400 bg-black shadow-sm"></div>
                                    <div className="bg-white border border-gray-400 rounded-[0.5vw] flex items-center justify-between px-[0.6vw] h-[1.8vw] flex-1">
                                        <span className="text-[0.8vw] text-gray-600 font-semibold">{shadowColor.toUpperCase()}</span>
                                        <span className="text-[0.8vw] text-gray-600 font-semibold">{shadowOpacity}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-[0.5vw] ml-[5vw]">
                                <div className="flex items-center justify-between gap-[0.3vw]">
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[2.3vw]">X Axis :</span>
                                    <div className="relative flex-1 h-[0.2vw]">
                                        <div className="absolute inset-0 bg-gray-400 rounded-full"></div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-[0.8vw] h-[0.8vw] bg-white rounded-full shadow-md border border-gray-300 left-[0%]"></div>
                                    </div>
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[1vw] text-right">{shadowX}</span>
                                </div>
                                <div className="flex items-center justify-between gap-[1vw]">
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[2.3vw]">Y Axis :</span>
                                    <div className="relative flex-1 h-[0.2vw]">
                                        <div className="absolute inset-0 bg-gray-400 rounded-full"></div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-[0.8vw] h-[0.8vw] bg-white rounded-full shadow-md border border-gray-300 left-[0%]"></div>
                                    </div>
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[1vw] text-right">{shadowY}</span>
                                </div>
                                <div className="flex items-center justify-between gap-[1vw]">
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[2.3vw]">Blur :</span>
                                    <div className="relative flex-1 h-[0.2vw]">
                                        <div className="absolute inset-0 bg-gray-400 rounded-full"></div>
                                        <div className="absolute inset-y-0 left-0 bg-[#4A3AFF] rounded-full w-[35%]"></div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-[0.8vw] h-[0.8vw] bg-white rounded-full shadow-md border border-gray-300 left-[0%]"></div>
                                    </div>
                                    <span className="text-[0.7vw] font-semibold text-gray-900 w-[2.5vw] text-right">{shadowBlur} %</span>
                                </div>
                            </div>
                        </div>

                        {/* Upload Logo Box */}
                        <div className="flex items-start gap-[0.5vw]">
                           <span className="text-[0.75vw] font-semibold text-gray-900 min-w-[4.5vw] pt-[0.5vw]">Upload Logo :</span>
                           <div className="flex-1 flex flex-col items-center">
                              <div className="w-full border-[0.15vw] border-dashed border-gray-400 rounded-[1vw] flex flex-col items-center justify-center py-[1.5vw] bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                                 <Upload size="1.3vw" className="text-gray-400 mb-[0.6vw]" strokeWidth={2} />
                                 <p className="text-[0.75vw] text-gray-500 font-medium whitespace-nowrap">
                                   Drag & Drop or <span className="text-[#4A3AFF] font-bold">Upload</span>
                                 </p>
                              </div>
                              <p className="text-[0.6vw] text-gray-400 mt-[0.5vw]">Supported File Format : JPG, PNG</p>
                           </div>
                        </div>

                        {/* Select Pages Component */}
                        <div className="flex items-start gap-[0.5vw] pt-[1vw]">
                           <span className="text-[0.75vw] font-semibold text-gray-900 min-w-[4.5vw] ">Select pages:</span>
                           <div className="bg-[#F2F2F2] rounded-[0.5vw] flex-1 border border-white shadow-sm overflow-hidden flex flex-col">
                              {/* Header */}
                              <div className="px-[0.5vw] py-[0.5vw]">
                                 <h3 className="text-[0.7vw] font-semibold text-gray-900">Select any - {selectedPages.length || 3} Pages</h3>
                              </div>
                              
                              
                                 {/* Pages List */}
                                 <div className="flex-1 py-[1vw] px-[1.2vw] space-y-[0.5vw] relative">
                                    {pages.length > 0 ? pages.map((page, index) => {
                                       const pageNum = index + 1;
                                       const isChecked = selectedPages.includes(pageNum);
                                       return (
                                          <label key={pageNum} className="flex items-center gap-[1.2vw] cursor-pointer group" onClick={(e) => { e.preventDefault(); togglePageSelection(pageNum); }}>
                                             <div className={`w-[1vw] h-[1vw] rounded-[0.2vw] flex items-center justify-center transition-colors ${isChecked ? 'bg-black text-white' : 'border-[0.15vw] border-gray-400 bg-white group-hover:border-gray-500'}`}>
                                                {isChecked && <span className="text-[0.65vw] font-semibold ">{selectedPages.indexOf(pageNum) !== -1 ? selectedPages.indexOf(pageNum) + 1 : pageNum}</span>}
                                             </div>
                                             <span className={`text-[0.6.5vw] font-semibold transition-colors ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>Page {pageNum}</span>
                                          </label>
                                       )
                                    }) : (
                                       <span className="text-gray-400 text-[0.8vw] font-medium">No pages available</span>
                                    )}
                                 </div>

                                 {/* Preview Image */}
                                 <div className="w-[5vw] m-[1.2vw] aspect-[3.5/5] bg-white border border-gray-200 rounded-[0.2vw] overflow-hidden shadow-md flex-shrink-0">
                                    {pages.length > 0 ? (
                                       <div className="w-full h-full p-[0.2vw] pointer-events-none w-[100%] h-[50%]">
                                          <div dangerouslySetInnerHTML={{ __html: pages[selectedPages[selectedPages.length - 1] - 1]?.html || pages[0].html }} />
                                       </div>
                                    ) : (
                                       <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[0.6vw] text-gray-400 px-[0.5vw] text-center">Preview</div>
                                    )}
                                 </div>

                              </div>
                           </div>
                        </div>
                  
                  )}
               </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        {option === 'template' && (
           <div className="px-[1.5vw] py-[1.2vw] flex items-center justify-between bg-white mt-auto border-t border-gray-200 shrink-0">
             <p className="text-[0.65vw] text-gray-500 font-medium">
               <span className="text-red-500">*</span> Choose and customize a template, then click "Save Changes" to save as your flipbook cover
             </p>
             <div className="flex gap-[0.8vw]">
                <button 
                    onClick={onClose} 
                    className="px-[1vw] py-[0.5vw] border border-gray-400 rounded-[0.5vw] text-[0.7vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-[0.4vw] shadow-sm"
                >
                   <X size="1vw" strokeWidth={2.5} /> Cancel
                </button>
                <button 
                    onClick={() => { 
                        onSave({ 
                            type: 'template',
                            activeTab,
                            selectedTemplate,
                            url: selectedTemplate?.src || '',
                            text1,
                            text2,
                            bgColor,
                            bgOpacity,
                            shadowColor,
                            shadowOpacity,
                            shadowX,
                            shadowY,
                            shadowBlur,
                            selectedPages,
                        }); 
                        onClose(); 
                    }} 
                    className="px-[1vw] py-[0.5vw] bg-black text-white rounded-[0.5vw] text-[0.7vw] font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-[0.4vw] shadow-sm"
                >
                   <Check size="1vw" strokeWidth={3} /> Save Changes
                </button>
             </div>
           </div>
        )}
        {isCropping && (
          <ImageCropOverlay 
            imageSrc={originalImage || uploadedImage}
            element={previewImgRef.current}
            onSave={({ crop }) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
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
                    setUploadedImage(croppedSrc);
                    canvas.toBlob((blob) => {
                       const file = new File([blob], "cover_cropped.png", { type: "image/png" });
                       setRawFile(file);
                    }, 'image/png');
                    setIsCropping(false);
                };
                img.src = originalImage || uploadedImage;
            }}
            onCancel={() => {
                setIsCropping(false);
                setImageFixType('Fit');
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

const CoverPicturePopupWithStyles = (props) => (
  <>
    <style>{scrollbarStyles}</style>
    <CoverPicturePopup {...props} />
  </>
);

export default CoverPicturePopupWithStyles;



